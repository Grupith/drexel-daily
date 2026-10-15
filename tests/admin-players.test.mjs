import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path, imports) {
  const loadedModule = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { module: loadedModule, exports: loadedModule.exports, require: name => { if (name in imports) return imports[name]; throw Error(name); }, Buffer, URL, Response, Date, Number, Object });
  return loadedModule.exports;
}
class AdminError extends Error { constructor(status, message) { super(message); this.status = status; } }
function setup(rows = []) {
  const calls = [];
  const query = {
    where: (...args) => { calls.push(['where', ...args]); return query; },
    orderBy: (...args) => { calls.push(['orderBy', ...args]); return query; },
    startAfter: (...args) => { calls.push(['startAfter', ...args]); return query; },
    limit: n => { calls.push(['limit', n]); return query; },
    get: async () => ({ docs: rows, size: rows.length }),
  };
  const db = { collection: name => { calls.push(['collection', name]); return query; } };
  const api = load('lib/admin/players.ts', { 'server-only': {}, 'firebase-admin/firestore': { AggregateField: {}, FieldPath: { documentId: () => '__name__' } }, './auth': { AdminError }, './data': { validId: id => { if (id.includes('/')) throw new AdminError(400, 'Invalid ID'); return id; } }, '@/lib/locations': { DREXEL_LOCATIONS: ['Test yard'] }, '@/lib/challenges/date': { getChallengeDay: () => ({ date: '2026-10-14' }) } });
  return { api, db, calls };
}
const row = (i, name = `Player ${i}`) => ({ id: `u${i}`, data: () => ({ displayName: name, stats: { totalPoints: i, challengesPlayed: 2, currentStreak: 0 } }), get: () => i });
test('directory limits document reads and paginates with value and document ID', async () => {
  const { api, db, calls } = setup(Array.from({ length: 26 }, (_, i) => row(i)));
  const page = await api.listPlayers(db, new URLSearchParams('sort=points&location=Test+yard'));
  assert.equal(page.items.length, 25);
  assert.deepEqual(JSON.parse(Buffer.from(page.next, 'base64url').toString()), [24, 'u24']);
  assert.ok(calls.some(c => c[0] === 'limit' && c[1] === 26));
  await api.listPlayers(db, new URLSearchParams({ sort: 'points', cursor: page.next }));
  assert.ok(calls.some(c => c[0] === 'startAfter' && c[1] === 24 && c[2] === 'u24'));
});
test('search is bounded, case insensitive, and can continue after an empty batch', async () => {
  const { api, db, calls } = setup(Array.from({ length: 100 }, (_, i) => row(i)));
  const result = await api.listPlayers(db, new URLSearchParams('sort=points&search=nobody'));
  assert.equal(result.items.length, 0); assert.ok(result.next);
  assert.ok(calls.some(c => c[0] === 'limit' && c[1] === 100));
  const matched = await api.listPlayers(db, new URLSearchParams('sort=points&search=PLAYER+9'));
  assert.equal(matched.items.length, 11);
});
test('invalid filters and cursors are rejected before querying documents', async () => {
  const { api, db } = setup();
  for (const params of ['sort=toString', 'sort=unknown', 'location=unknown', 'cursor=invalid', 'direction=sideways'])
    await assert.rejects(api.listPlayers(db, new URLSearchParams(params)), e => e.status === 400);
});
test('profile mapping reuses totals, supports legacy stats and does not invent an average for unplayed users', () => {
  const { api } = setup();
  const player = api.toAdminPlayer('u', { stats: { totalPoints: 40, challengesPlayed: 2 }, photoURL: 'javascript:alert(1)' });
  assert.equal(player.averageScore, 20); assert.equal(player.photoURL, null);
  assert.equal(api.toAdminPlayer('u', {}).averageScore, null);
});
test('every players endpoint rejects unauthorized requests before reading player data', async () => {
  for (const path of ['app/api/admin/players/route.ts', 'app/api/admin/players/summary/route.ts', 'app/api/admin/players/[id]/route.ts']) {
    let reads = 0;
    const route = load(path, { '@/lib/admin/auth': { requireAdmin: async () => { throw new AdminError(403, 'Administrator access required.'); }, adminFailure: e => Response.json({ message: e.message }, { status: e.status }) }, '@/lib/admin/players': { listPlayers: () => reads++, playersSummary: () => reads++, playerDetails: () => reads++ } });
    const response = await route.GET(new Request('http://localhost/api/admin/players'), { params: Promise.resolve({ id: 'u' }) });
    assert.equal(response.status, 403); assert.equal(reads, 0);
  }
});
