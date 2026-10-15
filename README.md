## Drexel Daily Game

Questions realeased daily for drexel employees.

## Authentication and location onboarding

The root layout provides `useAuth()` through `AuthProvider`. Play starts Google
sign-in and remembers the intent in session storage. It uses a popup when the app
host differs from the Firebase auth domain, avoiding lost redirect results under
browser storage restrictions. Matching hosts use redirect sign-in. On return, the
provider loads `users/{uid}` and navigates to `/play`. The play access gate asks
users without a saved location to select one before mounting the questions.
Saving updates `locationId` in their user document. Existing saved `location`
values are moved to `locationId` and the old `location` field is deleted when
the profile loads, so those users skip onboarding. Questions load from the authenticated server API; submission remains a local demo.

Locations live in `lib/locations.ts` and use the configured employee location list.
Keep its values and the allowlist in `firestore.rules` synchronized.

### Firebase setup

- Enable Google under Authentication → Sign-in method.
- Add local and deployed hostnames under Authentication → Settings → Authorized
  domains. Verify that the existing `NEXT_PUBLIC_FIREBASE_*` variables are set.
- Create a Cloud Firestore database if one does not already exist.
- Publish the user-profile rules in `firestore.rules`. If your project already
  has rules, merge this `users/{uid}` block into them; do not replace unrelated
  rules. These rules allow only the owner to read their document and write the
  profile and location fields. Roles and stats can only be initialized by clients
  to `employee` and zero; subsequent changes require trusted server code.
- Employee authorization is a separate policy: Google authentication and
  self-selected locations do not verify employment. Add your verified employee
  allowlist or trusted claims policy before exposing protected employee data.

### Google redirect hosting setup

Firebase redirect sign-in needs a hosting configuration that works when browsers
block third-party storage. Follow
https://firebase.google.com/docs/auth/web/redirect-best-practices.
For a custom domain on Firebase Hosting, set
`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` to that domain and authorize
`https://YOUR_DOMAIN/__/auth/handler` in the Google OAuth client.
For Next.js hosted elsewhere (including App Hosting), the same-origin
reverse proxy in `next.config.ts` forwards `/__/auth/**` to your project's Firebase
Hosting auth helper. Use the app domain as `authDomain` and authorize its handler
URL. Setting
`authDomain` alone does not create the auth helper endpoints.
Rebuild after changing public environment variables.

### User document: `users/{userId}`

The document ID is the Firebase Authentication UID. Missing fields are initialized
on sign-in without overwriting existing values.

| Field                    | Type / initial value                                   |
| ------------------------ | ------------------------------------------------------ |
| `displayName`            | Auth display name, or `null`                           |
| `email`                  | Auth email, or `null`                                  |
| `photoURL`               | Auth photo URL, or `null`                              |
| `locationId`             | Configured location value, or `null` before onboarding |
| `role`                   | `employee` (default) or `admin`                        |
| `createdAt`              | Firestore server timestamp                             |
| `stats.currentStreak`    | Number, initially `0`                                  |
| `stats.longestStreak`    | Number, initially `0`                                  |
| `stats.totalPoints`      | Number, initially `0`                                  |
| `stats.challengesPlayed` | Number, initially `0`                                  |

For legacy profiles without `createdAt`, the timestamp records when the schema
was initialized. Stats are initialized only; demo challenges do not update them.

### Questions and daily challenges

`GET /api/challenge/today` requires a Firebase ID token in the Authorization
Bearer header. It verifies authentication (including revoked/disabled users),
uses America/Chicago, and returns one of `available`, `weekend`, `unavailable`,
or `error`. Only a published weekday challenge with three distinct, valid
question documents is returned. Question order follows `questionIds`.
The response contains only `id`, `text`, `category`, `type`, `options`, and
`imageUrl`. Answer keys and extra document fields are never serialized.
Responses use `private, no-store`; answers remain in React state and are lost
on refresh. No answers, attempts, scores, or stats are written.

#### Server configuration

The admin session endpoint (`POST` and `DELETE /api/admin/session`) accepts the
exact browser origin `https://drexeldaily.com`. Outside production it also accepts
`http://localhost:3000`. Missing or other origins receive 403. This explicit
allowlist does not depend on App Hosting's internal request URL, `Host`, or
forwarded headers. No `ALLOWED_ORIGINS` variable is required. Redeploy Firebase
App Hosting after changing this route. Session creation still requires a verified
Firebase token and a `users/{uid}` role of `admin`; production cookies retain
`Secure`, `HttpOnly`, and `SameSite=Strict`.

The existing `firebase/config.ts` and public Firebase variables remain intact.
`firebase/admin.ts` uses Application Default Credentials (ADC), guarded by
`server-only`, and initializes lazily. Set `FIREBASE_PROJECT_ID` to the same
project as the client (or it falls back to `NEXT_PUBLIC_FIREBASE_PROJECT_ID`).
On Firebase App Hosting / Google Cloud, use the runtime service account with
Firestore read access and Firebase Authentication user-read permission
(`firebaseauth.users.get`, needed for revocation checks). No private key belongs
in a `NEXT_PUBLIC_*` variable or source control.

Locally, obtain a service-account JSON from Firebase Console → Project settings
→ Service accounts, keep it outside the repository, and set
`GOOGLE_APPLICATION_CREDENTIALS` to its absolute path in the server environment.
Use a server-managed credential/secret mechanism on other hosts.
See https://firebase.google.com/docs/admin/setup and
https://firebase.google.com/docs/auth/admin/verify-id-tokens.

Publish the updated `firestore.rules` using Firebase Console → Firestore Database
→ Rules. Preserve any unrelated deployed rules and check for overlapping broad
allow rules: Firestore matches are additive, so an explicit denial does not
cancel another allow. All client reads/writes of questions and challenges,
including authenticated and client-admin requests, are denied. Firebase Console
and Admin SDK access use IAM and bypass these rules. No additional indexes are
needed: all reads use document IDs. This code does not deploy rules or create
production documents automatically.

#### Exact document examples

Create these three question documents in the top-level `questions` collection.
Each `createdAt` must be a Firestore **timestamp**, not a string; use the Console
timestamp editor with the creation time. The ISO value below illustrates that
value. `imageUrl` may be omitted or set to null, or contain an HTTPS image URL.
For images, use Firebase Storage and ensure intended players can load the URL.

```js
// questions/framing-lumber
{
  text: "Which material is commonly used to frame a house?",
  category: "Product knowledge",
  type: "multiple_choice",
  options: ["Dimensional lumber", "Drywall", "Roofing shingles", "Vinyl siding"],
  correctAnswerIndex: 0,
  imageUrl: null,
  isActive: true,
  createdAt: Timestamp("2026-10-14T14:00:00Z")
}

// questions/forklift-inspection
{
  text: "What should you do before operating a forklift?",
  category: "Safety",
  type: "multiple_choice",
  options: ["Complete a pre-operation inspection", "Skip the inspection", "Exceed rated capacity", "Carry a passenger on the forks"],
  correctAnswerIndex: 0,
  imageUrl: null,
  isActive: true,
  createdAt: Timestamp("2026-10-14T14:00:00Z")
}

// questions/eye-protection
{
  text: "Which item protects your eyes from flying debris?",
  category: "Safety",
  type: "multiple_choice",
  options: ["Work boots", "Safety glasses", "Earplugs", "A reflective vest"],
  correctAnswerIndex: 1,
  imageUrl: null,
  isActive: true,
  createdAt: Timestamp("2026-10-14T14:00:00Z")
}

// challenges/2026-10-14
{
  date: "2026-10-14",
  questionIds: ["framing-lumber", "forklift-inspection", "eye-protection"],
  status: "published",
  createdAt: Timestamp("2026-10-14T14:05:00Z")
}
```

#### Creating the first challenge in Firebase Console

1. Open your project's Firestore Database → Data → Start collection and enter
   `questions`. Use the explicit IDs above (or your own IDs).
2. Add fields using string, array of four distinct nonempty strings, number
   (integer 0–3), null, boolean, and timestamp types as shown. The correct index
   is zero-based. Create all three questions before publishing.
3. Create top-level `challenges` with document ID equal to the desired weekday
   in America/Chicago (`2026-10-14` is Wednesday). Set `date` to the identical
   string; add `questionIds` as an array of three distinct existing IDs in the
   intended order, `status` as `draft`, and `createdAt` as a timestamp.
4. Verify content, answer indexes, and images, then change `status` to
   `published`. Use today's Central date to test `/play` after signing in and
   selecting a location. A future date stays inaccessible through today's API.
5. After publication, never edit/delete the challenge or its referenced question
   content/answer keys. Create a new question ID for revisions. Avoid reusing
   question IDs by checking existing challenge arrays before scheduling.

`isActive` is a scheduling flag. Deactivating a question does not remove it
from an already published challenge. The submission API is the only employee-facing write operation for attempts and scores.
Console/IAM immutability is an operating policy, not something Security Rules
can enforce; keep privileged access limited. This ID-based model deliberately
uses immutable published questions rather than challenge snapshots.

#### Submissions and saved results

`POST /api/challenge/submit` requires a Firebase bearer ID token and a body:

```json
{
  "challengeDate": "2026-10-14",
  "questionIds": ["framing-lumber", "forklift-inspection", "eye-protection"],
  "answers": [0, 1, 1]
}
```

The date and IDs are consistency checks against today's server-selected Central
challenge, not selectors. Other fields are rejected. The server verifies the
ID token (including revocation), rejects weekends, validates the published
challenge and all three questions, and scores each correct answer at 10 points.
A transaction reads the deterministic attempt, challenge, questions and profile
before creating the attempt and updating the profile. Concurrent transactions
retry against the committed attempt. New submissions return 201; duplicates
return 409 with the original completed results and never award points again.
Invalid requests return 400, invalid authentication 401, weekends 403,
unavailable/unpublished challenges 404, invalid questions 503, and unexpected
failures 500. Error bodies contain no answer keys or internal error details.

`GET /api/challenge/today` verifies the caller and checks their own attempt first.
Completed responses use the stored snapshot without reloading the challenge or
question bank, even if content was subsequently edited or unpublished. Incomplete
responses contain only public question fields. Neither route accepts another UID
or a selectable challenge date. Both responses are private and uncached.

An example automatically created document at
`users/abc123/attempts/2026-10-14` is:

```js
{
  challengeDate: "2026-10-14",
  questionIds: ["framing-lumber", "forklift-inspection", "eye-protection"],
  answers: [0, 1, 1],
  correctCount: 2,
  pointsEarned: 20,
  submittedAt: Timestamp("2026-10-14T17:00:00Z"),
  questions: [
    // Each of the three original questions, in questionIds order:
    // { id, text, category, type, options, imageUrl, correctAnswerIndex }
  ]
}
```

Question snapshots preserve the original wording, options and answer keys for
review. Keep published content immutable during gameplay, and use new Storage
paths for revised images: snapshots store image URLs, not image bytes.
Do not manually create the attempts subcollection.

The same transaction updates `totalPoints`, `gamesPlayed`, `totalCorrect`, and
`lastPlayedDate` without replacing the user document. Missing totals start at
zero; existing nested `stats.totalPoints` and `stats.challengesPlayed` seed the
corresponding totals for older profiles and remain synchronized for the existing
profile UI. Other profile and statistics fields, including streaks, are preserved.
If legacy real attempts already exist outside this system, migrate/backfill
`totalCorrect` separately before enabling submission; it cannot be inferred from
points if historical scoring differed. Profile data already loaded in React may
remain stale until its next profile reload.

The gameplay keeps answers in React state and sends no selection writes. During
submission it prevents additional submits; errors preserve selections, and only
a confirmed saved result transitions to review. A lost response is recoverable
through either a retry (409 with original results) or a page refresh.

#### Rules deployment and verification

No Firebase SDK configuration changes, new indexes, or dependencies are required.
The existing Admin SDK Application Default Credentials must have Firestore access.
Publish the updated `firestore.rules` in Firebase Console → Firestore Database →
Rules before enabling submissions. This repository has no `firebase.json`; use
the Console, or configure the Firebase CLI's Firestore rules path explicitly
before deploying with `firebase deploy --only firestore:rules --project YOUR_PROJECT_ID`.
No rules or production application deployment is performed by this implementation.

Rules allow authenticated users to read only their own attempts and deny all
client attempt writes. Existing profile allowlists already prevent changes to
root server statistics and protect the nested stats map, roles and creation
timestamps while retaining profile creation, location changes and legacy profile
initialization. There are no overlapping recursive allows. Questions and
challenges remain unreadable directly by clients.

Run `npm test`, `npm run lint`, and `npx tsc --noEmit`. Tests exercise server routes
with mocked Firebase, a serialized transaction mock, and gameplay with mocked
React hooks/network. They cover scoring 0–30, ordered answers, profile preservation,
concurrent/repeated submissions, hidden answer keys, authentication, invalid
content/input, Central midnight/DST/weekends, saved snapshots, backward navigation,
changed answers, failed requests, submit locking, and results labels.
These do not replace real Firestore transaction/rules or browser verification.

For a live smoke test using a fresh test account and a published weekday challenge:

1. Sign in, select a location, and open `/play`. Inspect the daily response to
   confirm it has no correct-answer fields. Select answers, move back, change one,
   and finish all three questions.
2. Submit; verify the correct count, points and all three review cards. Check
   the deterministic attempt path, ordered answers, timestamp and snapshots in
   Firestore, then verify the four root totals and synchronized nested counters.
3. Refresh, navigate home and return, and open `/play` in another tab/device.
   Each should show the same saved results without replay controls.
4. Send two authenticated submits concurrently with the same valid body (use
   an uncompleted test user). Expect one 201 and one 409; totals increase once.
5. Simulate a lost response after the server commits, then refresh to recover.
   Simulate a failed request before commit and confirm selections remain editable.
6. With client SDK/emulator tests verify own-attempt reads succeed, other-user
   reads and all attempt writes fail, protected root/nested stat edits fail, and
   normal profile/location updates still work. Check mobile/desktop, keyboard
   navigation, images, light/dark themes and existing entrance animation.

Before implementing streaks, use Central challenge dates and an explicit required
weekday/holiday policy; do not infer streaks from elapsed hours. Future leaderboard
reads should use trusted aggregates with deliberate visibility rules. Keep root
statistics canonical and preserve the transactional single-attempt invariant.
Employee authorization remains the existing Firebase authentication policy.

## Yard leaderboard

The landing page shows the top three yards; `/leaderboard` shows all ten and
marks the signed-in employee's `locationId`. Both require authentication to read
rankings. Names and tie order come from `lib/locations.ts`. Missing documents
appear with zero points, so no Firebase Console initialization or indexes are
required. Existing submissions are not migrated.

New accepted daily submissions atomically increment
`locations/{locationId}.totalPoints` with the existing server-calculated points,
in the same transaction as the attempt and user counters. The document is
created on first submission (including a zero-point submission), with only
`totalPoints`. This adds one write and no reads per accepted submission; duplicate
submissions do not increment anything. Invalid/missing profile locations reject
submission without writes. Admin test challenges do not award yard points.

Leaderboard views share a five-minute, per-user in-memory request cache. Totals
may be up to five minutes old; navigation after expiration refreshes them.
There are no listeners or polling. Reads fetch only the locations collection.

Deploy the updated `firestore.rules` before releasing the UI:
`firebase deploy --only firestore:rules` (select the intended Firebase project).
Authenticated clients can read locations, but all client creates, updates, and
deletes are denied. Trusted Admin SDK code performs the increment. Deploy the
application changes as well; no manual Console data changes are needed.

`npm test` covers ranking, zero defaults, exact location IDs, submission points,
duplicate suppression, unchanged user counters, shared reads, and both display
variants. Rule assertions inspect the rule source; transaction tests use a mock.
Before production release, verify permissions and concurrent commits against a
Firebase emulator or staging project and check layout on mobile and desktop.
