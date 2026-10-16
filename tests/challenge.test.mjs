import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import React from "react";

function load(path, imports = {}) {
  const loadedModule = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(code, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: (id) => {
      if (id in imports) return imports[id];
      throw new Error(`Unexpected import ${id}`);
    },
    Intl,
    Date,
    Response,
    console: { error() {} },
    AbortController,
    fetch: imports.fetch,
    sessionStorage: imports.sessionStorage,
  });
  return loadedModule.exports;
}
const locations = load("lib/locations.ts");
const dates = load("lib/challenges/date.ts");
const attempts = load("lib/challenges/attempt.ts");
const scoring = load("lib/challenges/scoring.ts");
const content = load("lib/challenges/content.ts");
const question = {
  text: "Question?",
  category: "Safety",
  type: "multiple_choice",
  options: ["A", "B", "C", "D"],
  correctAnswerIndex: 0,
  imageUrl: null,
  isActive: true,
  createdAt: {},
  explanation: "Secret",
};

test("Central midnight, weekdays, weekends, and DST boundaries", () => {
  for (const [instant, date, weekday] of [
    ["2026-10-15T04:59:59Z", "2026-10-14", true],
    ["2026-10-15T05:00:00Z", "2026-10-15", true],
    ["2026-10-17T17:00:00Z", "2026-10-17", false],
    ["2026-10-18T17:00:00Z", "2026-10-18", false],
    ["2026-10-19T17:00:00Z", "2026-10-19", true],
    ["2026-03-08T08:00:00Z", "2026-03-08", false],
    ["2026-11-01T07:00:00Z", "2026-11-01", false],
    ["2026-11-02T05:59:59Z", "2026-11-01", false],
    ["2026-11-02T06:00:00Z", "2026-11-02", true],
  ]) {
    const actual = dates.getChallengeDay(new Date(instant));
    assert.equal(actual.date, date);
    assert.equal(actual.isWeekday, weekday);
  }
});

function route({
  challenge = {
    date: "2026-10-14",
    status: "published",
    questionIds: ["q3", "q1", "q2"],
  },
  docs = ["q1", "q2", "q3"].map((id) => ({
    id,
    data: () => ({ ...question, text: id }),
  })),
  weekend = false,
  authError = null,
  attempt = null,
} = {}) {
  let reads = 0;
  const { GET } = load("app/api/challenge/today/route.ts", {
    "@/firebase/admin": {
      getAdminServices: () => ({
        auth: {
          verifyIdToken: async (token, revoked) => {
            assert.equal(token, "valid");
            assert.equal(revoked, true);
            if (authError) throw authError;
            return { uid: "employee" };
          },
        },
        db: {
          collection: () => ({
            doc: (id) => ({
              id,
              collection: () => ({
                doc: () => ({
                  get: async () => ({ exists: !!attempt, data: () => attempt }),
                }),
              }),
              get: async () => {
                reads++;
                return { data: () => challenge };
              },
            }),
          }),
          getAll: async () => docs,
        },
      }),
    },
    "@/lib/challenges/date": {
      getChallengeDay: () => ({ date: "2026-10-14", isWeekday: !weekend }),
    },
    "@/lib/challenges/content": content,
    "@/lib/challenges/attempt": attempts,
  });
  return { GET, reads: () => reads };
}
const request = () =>
  new Request("http://localhost/api/challenge/today", {
    headers: { Authorization: "Bearer valid" },
  });
test("published response contains exactly three ordered public questions and no answer keys", async () => {
  const response = await route().GET(request());
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(
    data.questions.map((q) => q.id),
    ["q3", "q1", "q2"],
  );
  for (const q of data.questions)
    assert.deepEqual(Object.keys(q).sort(), [
      "category",
      "id",
      "imageUrl",
      "options",
      "text",
      "type",
    ]);
});
test("missing, draft, malformed, and incomplete challenges never return partial content", async () => {
  for (const config of [
    { challenge: null },
    { challenge: { status: "draft" } },
    {
      challenge: {
        date: "2026-10-14",
        status: "published",
        questionIds: ["q1", "q1", "q2"],
      },
    },
    { docs: [] },
    {
      docs: [
        { id: "q3", data: () => ({ ...question, correctAnswerIndex: 4 }) },
      ],
    },
  ]) {
    const data = await (await route(config).GET(request())).json();
    assert.equal(data.status, "unavailable");
  }
});
test("weekends skip Firestore reads; authentication is required and revoked tokens are rejected", async () => {
  const weekend = route({ weekend: true });
  assert.equal((await (await weekend.GET(request())).json()).status, "weekend");
  assert.equal(weekend.reads(), 0);
  assert.equal(
    (await route().GET(new Request("http://localhost"))).status,
    401,
  );
  assert.equal(
    (
      await route({ authError: { code: "auth/id-token-revoked" } }).GET(
        request(),
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await route({ authError: { code: "app/invalid-credential" } }).GET(
        request(),
      )
    ).status,
    500,
  );
});

test("component loads API questions, preserves backward navigation and changed answers, and submits ordered answers to the server", async () => {
  const states = [];
  let cursor = 0;
  const effects = [];
  const refs = [];
  const hooks = {
    ...React,
    useState: (initial) => {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [
        states[index],
        (value) => {
          states[index] =
            typeof value === "function" ? value(states[index]) : value;
        },
      ];
    },
    useRef: (initial) => {
      const index = cursor++;
      return (refs[index] ??= { current: initial });
    },
    useEffect: (effect) => {
      effects.push(effect);
    },
  };
  const user = { getIdToken: async () => "valid" };
  let calls = 0;
  const { DailyChallenge } = load("components/daily-challenge.tsx", {
    react: hooks,
    "react/jsx-runtime": await import("react/jsx-runtime"),
    "next/link": { default: "a" },
    "lucide-react": Object.fromEntries(
      ["ArrowLeft", "ArrowRight", "CalendarDays", "Check", "CheckCircle2"].map(
        (k) => [k, k],
      ),
    ),
    "@/lib/utils": { cn: () => "" },
    "@/components/ui/button": { Button: "button" },
    "@/components/ui/input": { Input: "input" },
    "@/lib/challenges/content": content,
    "@/components/challenge-results": { ChallengeResultsView: "results" },
    "@/auth/auth-context": { useAuth: () => ({ user }) },
    "@/components/play-skeleton": { PlaySkeleton: "skeleton" },
    fetch: async (url, options) => {
      calls++;
      assert.equal(options.headers.Authorization, "Bearer valid");
      if (url === "/api/challenge/today") return route().GET(request());
      assert.equal(url, "/api/challenge/submit");
      assert.deepEqual(JSON.parse(options.body), {
        challengeDate: "2026-10-14",
        questionIds: ["q3", "q1", "q2"],
        answers: [2, 1, 3],
      });
      if (calls === 2) throw new Error("Network unavailable");
      return Response.json(
        { status: "completed", results: { challengeDate: "2026-10-14" } },
        { status: 201 },
      );
    },
  });
  const render = () => {
    cursor = 0;
    return DailyChallenge();
  };
  function nodes(tree) {
    if (!React.isValidElement(tree)) return [];
    return [
      tree,
      ...React.Children.toArray(tree.props.children).flatMap(nodes),
    ];
  }
  const initial = render();
  assert.equal(initial.type, "skeleton");
  effects[0]();
  await new Promise((resolve) => setTimeout(resolve, 20));
  let tree = render();
  const choose = (index) =>
    nodes(tree)
      .filter((n) => n.props["aria-pressed"] !== undefined)
      [index].props.onClick();
  const next = () =>
    nodes(tree)
      .find((n) => n.type === "form")
      .props.onSubmit({ preventDefault() {} });
  choose(0);
  tree = render();
  next();
  tree = render();
  assert.equal(
    nodes(tree).find((n) => n.props.id === "play-title").props.children[1],
    "q1",
  );
  nodes(tree)
    .find((n) => n.type === "button" && n.props.variant === "ghost")
    .props.onClick();
  tree = render();
  assert.equal(
    nodes(tree).filter((n) => n.props["aria-pressed"] !== undefined)[0].props[
      "aria-pressed"
    ],
    true,
  );
  choose(2);
  tree = render();
  next();
  tree = render();
  choose(1);
  tree = render();
  next();
  tree = render();
  choose(3);
  tree = render();
  next();
  await new Promise((resolve) => setTimeout(resolve, 20));
  tree = render();
  assert.equal(
    nodes(tree).some((n) => n.props.role === "alert"),
    true,
  );
  assert.equal(
    nodes(tree).filter((n) => n.props["aria-pressed"] !== undefined)[3].props[
      "aria-pressed"
    ],
    true,
  );
  next();
  next();
  tree = render();
  assert.equal(
    nodes(tree).find((n) => n.type === "button" && n.props.type === "submit")
      .props.disabled,
    true,
  );
  await new Promise((resolve) => setTimeout(resolve, 20));
  tree = render();
  assert.equal(
    nodes(tree).some((n) => n.type === "results"),
    true,
  );
  assert.equal(calls, 3);
});

const savedAttempt = {
  challengeDate: "2026-10-14",
  questionIds: ["q3", "q1", "q2"],
  answers: [0, 1, 0],
  correctCount: 2,
  pointsEarned: 20,
  questions: ["q3", "q1", "q2"].map((id) => ({
    ...content.toPublicQuestion(id, question),
    correctAnswerIndex: 0,
  })),
  submittedAt: { toDate: () => new Date("2026-10-14T17:00:00Z") },
};
test("saved results use attempt snapshots without loading edited or unpublished content", async () => {
  const data = await (
    await route({ attempt: savedAttempt, challenge: null, docs: [] }).GET(
      request(),
    )
  ).json();
  assert.equal(data.status, "completed");
  assert.equal(data.results.correctCount, 2);
  assert.equal(data.results.questions[0].correctAnswerIndex, 0);
  assert.equal(data.results.submittedAt, "2026-10-14T17:00:00.000Z");
});

function submissionRoute({
  weekend = false,
  challenge = {
    date: "2026-10-14",
    status: "published",
    questionIds: ["q3", "q1", "q2"],
  },
  invalidQuestion = false,
  questionDocs = {},
  fail = false,
  authError = null,
  profile = {
    displayName: "Employee",
    locationId: "Campbellsport",
    stats: { totalPoints: 100, challengesPlayed: 4, currentStreak: 2 },
  },
} = {}) {
  let attempt;
  const yardTotals = new Map();
  let writes = 0;
  let queue = Promise.resolve();
  const ref = (path) => ({
    path,
    collection: (name) => ({ doc: (id) => ref(`${path}/${name}/${id}`) }),
  });
  const db = {
    collection: (name) => ({ doc: (id) => ref(`${name}/${id}`) }),
    // Serialize the fake transactions to model committed duplicate reads. Actual
    // Firestore isolation/retries still need verification against an emulator.
    runTransaction: (callback) => {
      const operation = queue.then(async () => {
        if (fail) throw new Error("Internal Firestore failure");
        const pending = [];
        const result = await callback({
          get: async (reference) => {
            if (reference.path.includes("/attempts/"))
              return { exists: !!attempt, data: () => attempt };
            if (reference.path.startsWith("challenges/"))
              return { data: () => challenge };
            assert.equal(reference.path, "users/employee");
            return { exists: true, data: () => profile };
          },
          getAll: async (...references) =>
            references.map((reference) => ({
              id: reference.path.split("/").at(-1),
              data: () =>
                invalidQuestion
                  ? undefined
                  : (questionDocs[reference.path.split("/").at(-1)] ??
                    question),
            })),
          set: (reference, data, options) => {
            assert.equal(reference.path, `locations/${profile.locationId}`);
            assert.equal(options.merge, true);
            assert.deepEqual(Object.keys(data), ["totalPoints"]);
            pending.push(() => {
              yardTotals.set(
                profile.locationId,
                (yardTotals.get(profile.locationId) ?? 0) +
                  data.totalPoints.increment,
              );
              writes++;
            });
          },
          create: (reference, data) => {
            assert.equal(reference.path, "users/employee/attempts/2026-10-14");
            pending.push(() => {
              attempt = data;
              writes++;
            });
          },
          update: (reference, data) => {
            assert.equal(reference.path, "users/employee");
            pending.push(() => {
              for (const [key, value] of Object.entries(data)) {
                if (key.startsWith("stats."))
                  profile.stats[key.slice(6)] = value;
                else profile[key] = value;
              }
              writes++;
            });
          },
        });
        pending.forEach((commit) => commit());
        return result;
      });
      queue = operation.catch(() => {});
      return operation;
    },
  };
  const { POST } = load("app/api/challenge/submit/route.ts", {
    "@/lib/locations": locations,
    "firebase-admin/firestore": {
      FieldValue: { increment: (value) => ({ increment: value }) },
      Timestamp: { now: () => savedAttempt.submittedAt },
    },
    "@/firebase/admin": {
      getAdminServices: () => ({
        db,
        auth: {
          verifyIdToken: async (token, revoked) => {
            assert.equal(token, "valid");
            assert.equal(revoked, true);
            if (authError) throw authError;
            return { uid: "employee" };
          },
        },
      }),
    },
    "@/lib/challenges/date": {
      getChallengeDay: () => ({ date: "2026-10-14", isWeekday: !weekend }),
    },
    "@/lib/challenges/content": content,
    "@/lib/challenges/scoring": scoring,
    "@/lib/challenges/attempt": attempts,
  });
  return {
    POST,
    profile,
    yardTotals,
    attempt: () => attempt,
    writes: () => writes,
  };
}
const submissionRequest = (
  body = {
    challengeDate: "2026-10-14",
    questionIds: ["q3", "q1", "q2"],
    answers: [0, 1, 0],
  },
) =>
  new Request("http://localhost/api/challenge/submit", {
    method: "POST",
    headers: {
      Authorization: "Bearer valid",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
test("server scores all totals and atomically preserves profile fields and existing counters", async () => {
  for (let count = 0; count <= 3; count++) {
    const fixture = submissionRoute();
    const answers = [0, 1, 2].map((_, index) => (index < count ? 0 : 1));
    const response = await fixture.POST(
      submissionRequest({
        challengeDate: "2026-10-14",
        questionIds: ["q3", "q1", "q2"],
        answers,
      }),
    );
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.results.correctCount, count);
    assert.equal(data.results.pointsEarned, count * 10);
    assert.deepEqual(fixture.attempt().answers, answers);
    assert.equal(fixture.profile.totalPoints, 100 + count * 10);
    assert.equal(fixture.yardTotals.get("Campbellsport"), count * 10);
    assert.equal(fixture.profile.gamesPlayed, 5);
    assert.equal(fixture.profile.totalCorrect, count);
    assert.equal(fixture.profile.lastPlayedDate, "2026-10-14");
    assert.equal(
      fixture.profile.stats.totalPoints,
      fixture.profile.totalPoints,
    );
    assert.equal(fixture.profile.stats.challengesPlayed, 5);
    assert.equal(fixture.profile.stats.currentStreak, 2);
    assert.equal(fixture.profile.displayName, "Employee");
    assert.equal(fixture.writes(), 3);
  }
});
test("simultaneous and repeated submissions return the saved attempt and award points once", async () => {
  const fixture = submissionRoute();
  const responses = await Promise.all([
    fixture.POST(submissionRequest()),
    fixture.POST(submissionRequest()),
  ]);
  assert.deepEqual(
    responses.map((response) => response.status),
    [201, 409],
  );
  assert.deepEqual(await responses[0].json(), await responses[1].json());
  assert.equal(fixture.writes(), 3);
  assert.equal(fixture.profile.totalPoints, 120);
  assert.equal(fixture.yardTotals.get("Campbellsport"), 20);
  assert.equal((await fixture.POST(submissionRequest())).status, 409);
  assert.equal(fixture.writes(), 3);
});
test("submission rejects invalid data, spoofed identities, unavailable content, weekends and failures without writes or keys", async () => {
  const valid = {
    challengeDate: "2026-10-14",
    questionIds: ["q3", "q1", "q2"],
    answers: [0, 1, 0],
  };
  const configs = [
    [{}, { ...valid, answers: [0, 1] }, 400],
    [{}, { ...valid, answers: [0, -1, 4] }, 400],
    [{}, { ...valid, answers: [0, "1", 0] }, 400],
    [{}, { ...valid, answers: [0, 0.5, 0] }, 400],
    [{}, { ...valid, userId: "another-user" }, 400],
    [{}, { ...valid, pointsEarned: 30 }, 400],
    [{}, { ...valid, correctAnswerIndex: 0 }, 400],
    [{}, { ...valid, challengeDate: "2026-10-13" }, 400],
    [{}, { ...valid, questionIds: ["q1", "q2", "q3"] }, 400],
    [{ challenge: null }, valid, 404],
    [{ challenge: { status: "draft" } }, valid, 404],
    [{ invalidQuestion: true }, valid, 503],
    [{ weekend: true }, valid, 403],
    [{ authError: { code: "auth/id-token-revoked" } }, valid, 401],
    [{ fail: true }, valid, 500],
  ];
  for (const [config, body, status] of configs) {
    const fixture = submissionRoute(config);
    const response = await fixture.POST(submissionRequest(body));
    assert.equal(response.status, status);
    const data = await response.json();
    assert.deepEqual(Object.keys(data).sort(), ["message", "status"]);
    assert.equal(fixture.writes(), 0);
  }
  assert.equal(
    (
      await submissionRoute().POST(
        new Request("http://localhost", { method: "POST" }),
      )
    ).status,
    401,
  );
  const malformed = new Request("http://localhost", {
    method: "POST",
    headers: { Authorization: "Bearer valid" },
    body: "{",
  });
  assert.equal((await submissionRoute().POST(malformed)).status, 400);
});

test("review shows original options, selected answers, correct and incorrect labels and Friday wording", async () => {
  const { ChallengeResultsView } = load("components/challenge-results.tsx", {
    "@/components/ui/button": { Button: "button" },
    "react/jsx-runtime": await import("react/jsx-runtime"),
    "next/link": { default: "a" },
    "lucide-react": { CheckCircle2: "check", XCircle: "cross" },
    "@/lib/utils": { cn: () => "" },
  });
  function text(tree) {
    if (typeof tree === "string" || typeof tree === "number")
      return String(tree);
    if (!React.isValidElement(tree)) return "";
    return React.Children.toArray(tree.props.children).map(text).join(" ");
  }
  const review = text(
    ChallengeResultsView({
      results: { ...savedAttempt, submittedAt: "" },
      headingRef: { current: null },
    }),
  );
  assert.match(review, /2 \/3 correct/);
  assert.match(review, /20\s+Points/);
  assert.match(review, /View Leaderboard/);
  assert.match(review, /Back to Home/);
  function links(tree) {
    if (!React.isValidElement(tree)) return [];
    return [
      ...(tree.type === "a" ? [tree.props.href] : []),
      ...React.Children.toArray(tree.props.children).flatMap(links),
    ];
  }
  assert.deepEqual(
    links(
      ChallengeResultsView({
        results: { ...savedAttempt, submittedAt: "" },
        headingRef: { current: null },
      }),
    ),
    ["/leaderboard", "/"],
  );
  assert.deepEqual(
    links(
      ChallengeResultsView({
        results: { ...savedAttempt, submittedAt: "" },
        headingRef: { current: null },
        testMode: true,
      }),
    ),
    ["/admin/challenges"],
  );
  assert.equal((review.match(/Your answer/g) ?? []).length, 3);
  assert.match(review, /Incorrect/);
  assert.match(review, /Correct answer/);
  for (const option of question.options) assert.ok(review.includes(option));
  assert.match(
    text(
      ChallengeResultsView({
        results: { ...savedAttempt, challengeDate: "2026-10-16" },
        headingRef: { current: null },
      }),
    ),
    /Monday/,
  );
});

test("authentication reads an existing profile once, rereads only after initialization, and cleans up its listener", async () => {
  for (const initialize of [false, true]) {
    const states = [];
    const effects = [];
    let reads = 0;
    let writes = 0;
    let subscriptions = 0;
    let cleanups = 0;
    let listener;
    const currentUser = {
      uid: "employee",
      displayName: "Employee",
      email: "employee@example.com",
      photoURL: null,
    };
    let stored = initialize
      ? {}
      : {
          displayName: "Employee",
          email: "employee@example.com",
          photoURL: null,
          locationId: "Campbellsport",
          role: "employee",
          createdAt: {},
          stats: {
            totalPoints: 20,
            challengesPlayed: 1,
            currentStreak: 0,
            longestStreak: 0,
          },
        };
    const snapshot = () => ({ data: () => stored });
    const router = { replace() {} };
    const { AuthProvider } = load("auth/auth-context.tsx", {
      react: {
        ...React,
        useState: (initial) => {
          const index = states.length;
          states.push(initial);
          return [
            initial,
            (value) => {
              states[index] =
                typeof value === "function" ? value(states[index]) : value;
            },
          ];
        },
        useRef: (initial) => ({ current: initial }),
        useEffect: (effect) => effects.push(effect),
      },
      "react/jsx-runtime": await import("react/jsx-runtime"),
      "next/navigation": { useRouter: () => router },
      "firebase/auth": {
        getRedirectResult: async () => null,
        onAuthStateChanged: (_, callback) => {
          subscriptions++;
          listener = callback;
          return () => {
            cleanups++;
          };
        },
      },
      "firebase/firestore": {
        doc: () => ({}),
        serverTimestamp: () => ({ committed: true }),
        runTransaction: async (_, callback) =>
          callback({
            get: async () => {
              reads++;
              return snapshot();
            },
            set: (_, missing, options) => {
              assert.equal(options.merge, true);
              writes++;
              stored = { ...stored, ...missing };
            },
          }),
        getDoc: async () => {
          reads++;
          return snapshot();
        },
      },
      "@/firebase/config": { auth: { currentUser }, db: {} },
      "@/lib/locations": { DREXEL_LOCATIONS: ["Campbellsport"] },
      sessionStorage: { getItem: () => null, removeItem() {} },
    });
    AuthProvider({ children: null });
    assert.equal(effects.length, 1);
    const cleanup = effects[0]();
    await listener(currentUser);
    assert.equal(reads, initialize ? 2 : 1);
    assert.equal(writes, initialize ? 1 : 0);
    assert.equal(subscriptions, 1);
    assert.equal(states[1].stats.totalPoints, initialize ? 0 : 20);
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(reads, initialize ? 2 : 1);
    cleanup();
    assert.equal(cleanups, 1);
  }
});

test("cancelled challenge load does not issue a request after token retrieval", async () => {
  const effects = [];
  let resolveToken;
  let calls = 0;
  const { DailyChallenge } = load("components/daily-challenge.tsx", {
    react: {
      ...React,
      useState: (initial) => [initial, () => {}],
      useRef: (initial) => ({ current: initial }),
      useEffect: (effect) => effects.push(effect),
    },
    "react/jsx-runtime": await import("react/jsx-runtime"),
    "next/link": { default: "a" },
    "lucide-react": {},
    "@/lib/utils": { cn: () => "" },
    "@/components/ui/button": { Button: "button" },
    "@/components/ui/input": { Input: "input" },
    "@/lib/challenges/content": content,
    "@/components/challenge-results": { ChallengeResultsView: "results" },
    "@/auth/auth-context": {
      useAuth: () => ({
        user: {
          getIdToken: () =>
            new Promise((resolve) => {
              resolveToken = resolve;
            }),
        },
      }),
    },
    "@/components/play-skeleton": { PlaySkeleton: "skeleton" },
    fetch: async () => {
      calls++;
      throw new Error("Unexpected request");
    },
  });
  DailyChallenge();
  const cleanup = effects[0]();
  cleanup();
  resolveToken("valid");
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(calls, 0);
});

const estimateQuestion = {
  text: "How many?",
  category: "Company",
  type: "estimate",
  correctAnswer: 800,
  unit: "employees",
  minGuess: -1000,
  maxGuess: 5000,
  isActive: true,
  imageUrl: null,
};
test("exact numeric scoring preserves zero, decimals, negatives, and the existing scale", () => {
  for (const value of [0, -12, 0.25, 800, 800.0]) {
    assert.equal(scoring.scoreAnswers([value], [value]).pointsEarned, 10);
    assert.equal(scoring.scoreAnswers([value + 0.5], [value]).pointsEarned, 0);
  }
  assert.equal(scoring.scoreAnswers([0.1 + 0.2], [0.3]).pointsEarned, 0);
});
test("estimate public responses omit answer keys and validate finite ranged answers", async () => {
  const publicQuestion = content.toPublicQuestion("q1", estimateQuestion);
  assert.equal("correctAnswer" in publicQuestion, false);
  assert.equal("correctAnswerIndex" in publicQuestion, false);
  for (const answer of [0, -1, 800.5])
    assert.equal(content.isValidAnswer(publicQuestion, answer), true);
  for (const answer of [
    undefined,
    null,
    "800",
    NaN,
    Infinity,
    -Infinity,
    -1001,
    5001,
  ])
    assert.equal(content.isValidAnswer(publicQuestion, answer), false);
  const result = await route({
    docs: ["q1", "q2", "q3"].map((id) => ({
      id,
      data: () => estimateQuestion,
    })),
  }).GET(request());
  const body = await result.json();
  assert.equal(body.status, "available");
  assert.equal(JSON.stringify(body).includes("correctAnswer"), false);
});
test("mixed submissions score estimates on the server and snapshot exact answers", async () => {
  for (const value of [0, -12, 0.25, 800]) {
    const server = submissionRoute({
      questionDocs: { q1: { ...estimateQuestion, correctAnswer: value } },
    });
    const response = await server.POST(
      submissionRequest({
        challengeDate: "2026-10-14",
        questionIds: ["q3", "q1", "q2"],
        answers: [0, value, 1],
      }),
    );
    assert.equal(response.status, 201);
    const { results } = await response.json();
    assert.equal(results.correctCount, 2);
    assert.equal(results.pointsEarned, 20);
    assert.equal(results.questions[1].correctAnswer, value);
    assert.equal(results.answers[1], value);
    assert.equal((await server.POST(submissionRequest())).status, 409);
    assert.equal(server.writes(), 3);
  }
  for (const value of [799, 801, 800.5]) {
    const server = submissionRoute({ questionDocs: { q1: estimateQuestion } });
    const response = await server.POST(
      submissionRequest({
        challengeDate: "2026-10-14",
        questionIds: ["q3", "q1", "q2"],
        answers: [0, value, 0],
      }),
    );
    assert.equal((await response.json()).results.pointsEarned, 20);
  }
  for (const answers of [
    [0, null, 0],
    [0, "800", 0],
    [0, 5001, 0],
    [0, -1001, 0],
    [0.5, 800, 0],
  ]) {
    const server = submissionRoute({ questionDocs: { q1: estimateQuestion } });
    assert.equal(
      (
        await server.POST(
          submissionRequest({
            challengeDate: "2026-10-14",
            questionIds: ["q3", "q1", "q2"],
            answers,
          }),
        )
      ).status,
      400,
    );
    assert.equal(server.writes(), 0);
  }
});

test("estimate input preserves zero and decimals across navigation without extra requests", async () => {
  const states = [],
    refs = [],
    effects = [];
  let cursor = 0,
    calls = 0;
  const hooks = {
    ...React,
    useState(initial) {
      const i = cursor++;
      if (!(i in states)) states[i] = initial;
      return [
        states[i],
        (v) => {
          states[i] = typeof v === "function" ? v(states[i]) : v;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      return (refs[i] ??= { current: initial });
    },
    useEffect(fn) {
      effects.push(fn);
    },
  };
  const { DailyChallenge } = load("components/daily-challenge.tsx", {
    react: hooks,
    "react/jsx-runtime": await import("react/jsx-runtime"),
    "next/link": { default: "a" },
    "lucide-react": {},
    "@/lib/utils": { cn: () => "" },
    "@/components/ui/button": { Button: "button" },
    "@/components/ui/input": { Input: "input" },
    "@/lib/challenges/content": content,
    "@/components/challenge-results": { ChallengeResultsView: "results" },
    "@/auth/auth-context": {
      useAuth: () => ({ user: { getIdToken: async () => "valid" } }),
    },
    "@/components/play-skeleton": { PlaySkeleton: "skeleton" },
    fetch: async () => {
      calls++;
      return Response.json({
        status: "available",
        date: "2026-10-14",
        questions: ["a", "b", "c"].map((id) =>
          content.toPublicQuestion(id, estimateQuestion),
        ),
      });
    },
  });
  function nodes(tree) {
    return React.isValidElement(tree)
      ? [tree, ...React.Children.toArray(tree.props.children).flatMap(nodes)]
      : [];
  }
  const render = () => {
    cursor = 0;
    return nodes(DailyChallenge());
  };
  render();
  effects[0]();
  await new Promise((resolve) => setTimeout(resolve, 10));
  let tree = render();
  const input = () => tree.find((n) => n.props.id === "estimate-answer");
  const next = () =>
    tree.find((n) => n.type === "form").props.onSubmit({ preventDefault() {} });
  const back = () =>
    tree.find((n) => n.props.variant === "ghost").props.onClick();
  const enter = (value) => {
    input().props.onChange({
      target: { value: String(value), valueAsNumber: Number(value) },
    });
    tree = render();
  };
  assert.equal(input().props.min, -1000);
  assert.equal(input().props.max, 5000);
  assert.equal(input().props.step, "any");
  enter(0);
  assert.equal(
    tree.find((n) => n.props.type === "submit").props.disabled,
    false,
  );
  next();
  tree = render();
  enter(-12.25);
  back();
  tree = render();
  assert.equal(input().props.value, "0");
  next();
  tree = render();
  assert.equal(input().props.value, "-12.25");
  enter(5001);
  assert.equal(
    tree.find((n) => n.props.type === "submit").props.disabled,
    true,
  );
  enter("");
  assert.equal(
    tree.find((n) => n.props.type === "submit").props.disabled,
    true,
  );
  assert.equal(calls, 1);
});
test("estimate results show submitted and correct numeric values with units", async () => {
  const { ChallengeResultsView } = load("components/challenge-results.tsx", {
    "@/components/ui/button": { Button: "button" },
    "react/jsx-runtime": await import("react/jsx-runtime"),
    "next/link": { default: "a" },
    "lucide-react": { CheckCircle2: "check", XCircle: "cross" },
    "@/lib/utils": { cn: () => "" },
  });
  function text(tree) {
    if (typeof tree === "string" || typeof tree === "number")
      return String(tree);
    return React.isValidElement(tree)
      ? React.Children.toArray(tree.props.children).map(text).join(" ")
      : "";
  }
  for (const answer of [750, 800]) {
    const review = text(
      ChallengeResultsView({
        results: {
          ...savedAttempt,
          answers: [answer],
          questions: [
            {
              ...content.toPublicQuestion("a", estimateQuestion),
              correctAnswer: 800,
            },
          ],
        },
        headingRef: { current: null },
      }),
    );
    assert.match(review, new RegExp(`Your Estimate ${answer}\\s+employees`));
    assert.match(review, /Correct Answer 800\s+employees/);
    assert.match(review, answer === 800 ? /·\s+Correct/ : /·\s+Incorrect/);
  }
});

test("yard rankings include all locations, zero defaults, and allowlist tie order", () => {
  const { rankYards } = load("lib/yard-leaderboard.ts", {
    "@/lib/locations": locations,
  });
  const yards = rankYards(
    new Map([
      ["Downtown", 20],
      ["Kiel", 20],
      ["Berlin", 10],
      ["Unknown", 999],
      ["Amherst", -1],
    ]),
  );
  assert.equal(yards.length, 10);
  assert.deepEqual(
    Array.from(yards.slice(0, 3), (yard) => yard.locationId),
    ["Downtown", "Kiel", "Berlin"],
  );
  assert.equal(yards[3].locationId, "Campbellsport");
  assert.equal(yards[9].totalPoints, 0);
  assert.deepEqual(
    Array.from(rankYards(new Map()), (yard) => yard.locationId),
    Array.from(locations.DREXEL_LOCATIONS),
  );
});

test("each exact location ID receives points; invalid locations reject the entire submission", async () => {
  for (const locationId of [
    ...locations.DREXEL_LOCATIONS,
    null,
    "campbellsport",
    "Unknown",
    "Downtown ",
  ]) {
    const fixture = submissionRoute({ profile: { locationId, stats: {} } });
    const response = await fixture.POST(submissionRequest());
    const valid = locations.DREXEL_LOCATIONS.includes(locationId);
    assert.equal(response.status, valid ? 201 : 409);
    assert.equal(fixture.writes(), valid ? 3 : 0);
    assert.equal(fixture.yardTotals.get(locationId), valid ? 20 : undefined);
  }
});

test("leaderboard security denies client writes and profile allowlist matches the source", () => {
  const rules = fs.readFileSync("firestore.rules", "utf8");
  assert.match(
    rules,
    /match \/locations\/\{locationId\}\s*\{\s*allow read: if request.auth != null;\s*allow create, update, delete: if false;/,
  );
  const allowlist = rules.match(/data.locationId in \[([\s\S]*?)\]/)[1];
  assert.deepEqual(
    Array.from(allowlist.matchAll(/'([^']+)'/g), (match) => match[1]),
    Array.from(locations.DREXEL_LOCATIONS),
  );
});

test("leaderboard visits fetch fresh totals, share in-flight requests, and retry failures", async () => {
  let reads = 0;
  let fail = false;
  let totalPoints = 30;
  const { getYardLeaderboard } = load("lib/yard-leaderboard-client.ts", {
    "firebase/firestore": {
      collection: (_, name) => {
        assert.equal(name, "locations");
        return name;
      },
      getDocsFromServer: async () => {
        reads++;
        if (fail) throw new Error("Unavailable");
        return { docs: [{ id: "Kiel", data: () => ({ totalPoints }) }] };
      },
    },
    "@/firebase/config": { db: {} },
    "@/lib/yard-leaderboard": load("lib/yard-leaderboard.ts", {
      "@/lib/locations": locations,
    }),
  });
  const first = getYardLeaderboard("employee");
  assert.equal(first, getYardLeaderboard("employee"));
  assert.equal((await first)[0].locationId, "Kiel");
  totalPoints = 60;
  assert.equal((await getYardLeaderboard("employee"))[0].totalPoints, 60);
  assert.equal(reads, 2);
  fail = true;
  await assert.rejects(getYardLeaderboard("another-employee"));
  fail = false;
  await getYardLeaderboard("another-employee");
  assert.equal(reads, 4);
});

test("preview renders three yards and full view renders ten with current yard highlighted", async () => {
  const { rankYards } = load("lib/yard-leaderboard.ts", {
    "@/lib/locations": locations,
  });
  const yards = rankYards(new Map());
  let state = { uid: "employee", yards };
  let signedIn = true;
  const { YardLeaderboard } = load("components/yard-leaderboard.tsx", {
    react: { ...React, useState: () => [state, () => {}], useEffect() {} },
    "react/jsx-runtime": await import("react/jsx-runtime"),
    "next/link": { default: "a" },
    "@/auth/auth-context": {
      useAuth: () => ({
        user: signedIn ? { uid: "employee" } : null,
        profile: { locationId: "Downtown" },
        loading: false,
      }),
    },
    "@/components/ui/card": {
      Card: "card",
      CardHeader: "header",
      CardContent: "content",
    },
    "@/components/ui/button": { Button: "button" },
    "@/lib/yard-leaderboard-client": {},
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
  });
  function nodes(tree) {
    return React.isValidElement(tree)
      ? [tree, ...React.Children.toArray(tree.props.children).flatMap(nodes)]
      : [];
  }
  function text(tree) {
    return typeof tree === "string" || typeof tree === "number"
      ? String(tree)
      : React.isValidElement(tree)
        ? React.Children.toArray(tree.props.children).map(text).join(" ")
        : "";
  }
  const preview = YardLeaderboard({ preview: true });
  assert.equal(nodes(preview).filter((node) => node.type === "li").length, 3);
  assert.equal(
    nodes(preview).find((node) => node.props.href)?.props.href,
    "/leaderboard",
  );
  const full = YardLeaderboard({});
  assert.equal(nodes(full).filter((node) => node.type === "li").length, 10);
  const current = nodes(full)
    .filter((node) => node.type === "li")
    .find((node) => text(node).includes("Your yard"));
  assert.match(text(current), /Downtown/);
  assert.match(current.props.className, /border-drexel-action/);
  state = null;
  assert.match(text(YardLeaderboard({})), /Loading yard rankings/);
  state = { uid: "employee", error: "Could not load" };
  assert.ok(
    nodes(YardLeaderboard({})).some((node) => node.props.role === "alert"),
  );
  signedIn = false;
  assert.match(text(YardLeaderboard({})), /Sign in through Play/);
});
