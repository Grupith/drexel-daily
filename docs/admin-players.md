# Admin players

`/admin/players` uses the existing admin layout/session. All three GET endpoints verify a revoked-token-aware Firebase ID token and the stored admin role through `requireAdmin` before querying data. No client Firestore access, writes, listeners, scoring changes, or rules changes were added.

## Verified schema in source

- `auth/auth-context.tsx` initializes `users/{uid}` with Google display name, email, photoURL, locationId, createdAt, role, and stats (totalPoints, challengesPlayed, currentStreak, longestStreak).
- `app/api/challenge/submit/route.ts` atomically creates `users/{uid}/attempts/{date}` and updates totalPoints, gamesPlayed, totalCorrect, lastPlayedDate, stats.totalPoints, and stats.challengesPlayed. Both totals are maintained together. Attempts contain challengeDate, pointsEarned, correctCount, questionIds and immutable question snapshots.
- Streak fields are initialized but never updated by the existing submission implementation. The dashboard explicitly labels them as stored values. It does not compute replacement streaks from unbounded history.
- Average score means points per completed challenge, computed from existing player totals. No percentage or aggregate question-count statistic is invented.
- Inspection was of the schema, security rules and query/write code in this repository; live production Firestore documents were not accessed or audited.

## Queries and reads

- Overview: users count; users filtered by lastPlayedDate equal to today's America/Chicago date count; users sum of stats.totalPoints and stats.challengesPlayed. Aggregations read indexes, not every document or submission. Firestore bills aggregate index work according to the matching index entries, with minimum charges. Overview is fetched once per mount/retry, independently of table filters.
- Directory: order by createdAt, stats.totalPoints, stats.currentStreak, stats.challengesPlayed, or lastPlayedDate; optional locationId equality; document ID tie breaker; startAfter cursor containing sort value and ID. Timestamp cursors preserve nanoseconds. Normal requests read at most 26 documents, returning 25 with one lookahead.
- Search: case-insensitive name/email substring matching within a bounded, ordered batch of at most 100 user documents. Stops at 25 matches; cursor resumes after the last inspected document, so unread matches are preserved. An empty batch with continuation is distinct from exhaustion. A complete search can cumulatively visit the entire directory through explicit continuation. No full collection is loaded in a single request and no new search fields/index service are introduced.
- Details: one user document plus up to 20 attempt documents ordered by challengeDate descending, only when the Sheet opens. History returns only date and score counts, not answer keys.
- Each endpoint additionally reads the requesting admin's user document for role authorization; token revocation verification also uses Firebase Auth. No realtime refresh is used.

## Indexes and limits

Deploy the ten new users composite indexes in `firestore.indexes.json`: locationId ascending plus each of the five sort fields, in both ascending and descending directions. Unfiltered sorts and attempts history use existing single-field indexes. Totals rely on the default stats field indexes remaining enabled.

Firestore ordering excludes documents without the ordered field. Initialized profiles have createdAt and all stats fields; lastPlayedDate exists only after submission, so the UI labels that sort as participants only. The registration sort includes initialized players who have never played. Uninitialized legacy documents missing these fields require a separately reviewed migration for complete inclusion; this feature performs no migration or writes. Aggregate totals likewise reflect stored stats, with missing numeric fields not contributing. No live data verification was available to establish whether legacy inconsistencies exist.

Activity today means completed today's challenge, not sign-in activity; no last-login field exists. Summary totals are separate queries and are not a single transactional snapshot. Standard Firestore cursors can shift if player sort values change during navigation.
