import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadSession(environment, authStatus) {
  const writes = [];
  let authCalls = 0;
  class AdminError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }
  const imports = {
    'next/headers': { cookies: async () => ({
      set: (...args) => writes.push(['set', ...args]),
      delete: (...args) => writes.push(['delete', ...args]),
    }) },
    '@/lib/admin/auth': {
      AdminError,
      requireAdmin: async () => {
        authCalls++;
        if (authStatus) throw new AdminError(authStatus, 'Unauthorized');
      },
      adminFailure: error => Response.json({message: error.message}, {status: error.status ?? 500}),
    },
  };
  const loadedModule = {exports: {}};
  const code = ts.transpileModule(fs.readFileSync('app/api/admin/session/route.ts', 'utf8'), {
    compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS},
  }).outputText;
  vm.runInNewContext(code, {
    module: loadedModule, exports: loadedModule.exports, require: id => imports[id], Response, URL,
    process: {env: {NODE_ENV: environment}},
  });
  return {route: loadedModule.exports, writes, authCalls: () => authCalls};
}

for (const method of ['POST', 'DELETE']) {
  for (const environment of ['production', 'development']) {
    test(`${method} validates exact origins in ${environment} independently of proxy headers`, async () => {
      const origins = [
        ['https://drexeldaily.com', true],
        ['http://localhost:3000', environment === 'development'],
        ['https://external.example', false],
        ['http://drexeldaily.com', false],
        ['https://drexeldaily.com.evil.example', false],
        ['https://drexeldaily.com:444', false],
        [undefined, false], ['', false], ['null', false], ['malformed', false],
        ['https://drexeldaily.com/', false],
        ['https://drexeldaily.com/path', false],
        ['https://user@drexeldaily.com', false],
        ['https://drexeldaily.com, https://external.example', false],
      ];
      for (const [origin, allowed] of origins) {
        for (const url of ['http://internal.example:8080/api/admin/session', 'https://drexeldaily.com/api/admin/session']) {
          const session = loadSession(environment);
          const headers = {
            authorization: 'Bearer verified-token',
            host: 'external.example',
            'x-forwarded-host': 'external.example',
            'x-forwarded-proto': 'http',
          };
          if (origin !== undefined) headers.origin = origin;
          const response = await session.route[method](new Request(url, {method, headers}));
          assert.equal(response.status, allowed ? 200 : 403, `${method}: ${origin} at ${url}`);
          assert.equal(session.writes.length, allowed ? 1 : 0);
          assert.equal(session.authCalls(), allowed && method === 'POST' ? 1 : 0);
          if (allowed && method === 'POST') {
            const [operation, name, token, options] = session.writes[0];
            assert.equal(operation, 'set');
            assert.equal(name, 'admin-token');
            assert.equal(token, 'verified-token');
            assert.equal(options.httpOnly, true);
            assert.equal(options.secure, environment === 'production');
            assert.equal(options.sameSite, 'strict');
            assert.equal(options.path, '/admin');
            assert.equal(options.maxAge, 3500);
          } else if (allowed) {
            assert.equal(session.writes[0][0], 'delete');
            assert.equal(session.writes[0][1].name, 'admin-token');
            assert.equal(session.writes[0][1].path, '/admin');
          }
        }
      }
    });
  }
}

test('POST still requires valid Firebase authentication and admin authorization before setting cookies', async () => {
  for (const status of [401, 403]) {
    const session = loadSession('production', status);
    const response = await session.route.POST(new Request('http://internal.example/api/admin/session', {
      method: 'POST', headers: {origin: 'https://drexeldaily.com', authorization: 'Bearer token'},
    }));
    assert.equal(response.status, status);
    assert.equal(session.authCalls(), 1);
    assert.equal(session.writes.length, 0);
  }
});
