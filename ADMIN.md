# Drexel Daily administration

The existing sidebar and dashboard shell now cover all `/admin` pages. Existing Google sign-in, challenge retrieval, submission, scoring, answer-key redaction and saved result snapshots are unchanged.

## Routes and implementation

- `/admin`: overview and four quick actions.
- `/admin/questions`: paginated library with text search, category/difficulty filters, usage badges and confirmed deletion.
- `/admin/questions/new` and `/admin/questions/[id]/edit`: reusable question form, optional image/explanation and one correct answer.
- `/admin/challenges`: date-ordered drafts and published challenges, preview and confirmed draft deletion.
- `/admin/challenges/new` and `/admin/challenges/[date]/edit`: reusable date/status editor, three question slots, searchable selector, reordering and preview.
- `/api/admin/[kind]` and `/api/admin/[kind]/[id]`: authenticated content operations; kind is allowlisted to questions/challenges.
- `/api/admin/images`: authenticated, bounded multipart Storage upload (PNG/JPEG/WebP, maximum 5 MB, MIME and signature checks).
- `/api/admin/session`: verifies an admin ID token and synchronizes an HttpOnly cookie for server-rendered routes. DELETE only clears that cookie and cannot access content.

Main implementation files are `app/admin/`, `app/api/admin/`, `components/admin/`, `lib/admin/` and `types/admin.ts`. The existing `components/app-sidebar.tsx` now has Overview, Questions and Challenges links. The root layout mounts admin session synchronization separately from the existing auth context. The homepage shows an Admin Dashboard entry for admins; clicking it verifies the session before navigation. Sonner provides notifications; Zod provides shared client/server question validation.

## Authorization

`lib/admin/auth.ts` verifies Firebase ID tokens with revocation checking and reads `users/{verifiedUid}.role` for every admin API request and server admin-layout render. Client roles and token role claims are never used as authority. Unauthorized pages redirect to `/`; APIs return 401/403. API mutations require an explicit Bearer token, so cookies cannot authorize cross-site writes. Session creation additionally requires the same Origin. The route cookie is HttpOnly, SameSite Strict, scoped to `/admin`, and Secure in production; its ID token is verified server-side, including expiration and revocation.

No user roles are changed or granted by this implementation.

## Existing data and additive fields

No collections, date document IDs, question references or attempt documents change. Questions retain `text`, `category`, `type: multiple_choice`, four `options`, `correctAnswerIndex`, `imageUrl`, `isActive` and `createdAt`. Optional `difficulty` (Easy/Medium/Hard) and `explanation` are supported. Questions without difficulty display Medium. Saves add `updatedAt` timestamps. Challenge documents retain `date`, `questionIds`, `status` and `createdAt`; incomplete drafts use 0–3 unique IDs. Publishing requires exactly three valid, active questions.

Usage is derived from existing challenge references; no assignment collection or duplicated usage records are created. Transactions write the selected question documents as shared locks so simultaneous publish, edit and delete requests serialize safely. Questions assigned to any challenge cannot be deleted. Remove draft references first. Published challenges and all their referenced questions are immutable, including before their first submission. This deliberate policy preserves the existing scoring implementation, which reads live question references, without changing gameplay. A separate submissions query also blocks changes/deletion if a legacy draft has submissions.

## Firebase setup before use

1. Manually set `users/{your Firebase UID}.role` to `admin` in Firestore. Sign in on the homepage, then use Admin Dashboard. No promotion script exists.
2. Use the existing Firebase Admin Application Default Credentials configuration. Its runtime identity needs Firestore access and permission to create objects in the configured Storage bucket. Never add private credentials to `NEXT_PUBLIC_*` variables.
3. Deploy the included indexes and rules to the intended Firebase project, for example:

   ```sh
   firebase deploy --only firestore:rules,firestore:indexes,storage --project YOUR_PROJECT_ID
   ```

   `firebase.json` points to the existing `firestore.rules`, the new `firestore.indexes.json`, and new `storage.rules`. Wait for indexes to finish building. The composite index supports published question usage; the collection-group index supports legacy submission checks.

4. Firestore rules are unchanged: users cannot change their own role, and direct client question/challenge reads and writes remain denied, even for admins. All content operations go through trusted server APIs.
5. Ensure `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` points to an existing Firebase Storage bucket. Direct bucket reads/listing/writes are denied by `storage.rules`; validated uploads use the Admin SDK and images use token download URLs. If Storage is unavailable, use an existing HTTPS image URL. Images uploaded before canceling an unsaved form may remain in Storage; no cleanup job is added.

No Firebase deployments, user promotions or live data mutations were performed as part of implementation.

## Read limits and validation

Lists return at most 25 items. Text/category/difficulty searches scan at most 100 library records per request, returning matching items and a document cursor. This supports existing question documents without backfills or a search service. Sparse matches may require Next to continue searching. Unused matches are prioritized within the current batch. Usage checks read at most two matching challenge documents per displayed question. Edits fetch one document; previews fetch only the selected questions. No polling or realtime content listeners are used.

Question saves use shared Zod validation; publishing and gameplay validate both supported answer structures. Publication uses Monday–Friday date IDs interpreted as America/Chicago calendar dates, rejects duplicates and reuse, and leaves activation to the existing daily API. The player API still sends only allowlisted public fields; correct answers/explanations remain out of pre-submission responses.

## Verification

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`: gameplay regression tests plus admin authorization, validation and transactional integrity tests.
- `npm run build -- --webpack`: verified production compilation. Default Turbopack hits an environment-specific port-binding error here.
- Local HTTP checks: a nested admin page redirects unauthenticated requests to `/`; the admin collection API responds 401.

Live Firebase CRUD, authenticated browser workflows and Storage uploads still require verification using an authorized account after indexes/rules and runtime permissions are configured. Tests use mocked trusted services and do not write to production.

## Estimate questions

Question identifiers are `multiple_choice` and `estimate`. Estimate documents use the same `questions` collection and shared fields, with a finite numeric `correctAnswer`, optional `unit` (up to 100 characters), and optional finite numeric `minGuess` / `maxGuess`. Bounds must be ordered and contain the correct answer. Multiple-choice documents retain their existing fields unchanged. Switching type deletes obsolete answer fields; clearing optional bounds removes them. Existing documents require no migration.

The employee API allowlists presentation fields, including estimate units and bounds, and excludes the answer key. Estimates remain in client state until the existing final submission. The server validates each numeric answer against the loaded question type and bounds, then uses the existing exact numeric equality scoring (10 points per correct answer). There is no tolerance, rounding or partial credit. Attempts retain the existing numeric `answers` array; estimate result snapshots include `correctAnswer` and presentation metadata so historical results remain reproducible. Existing multiple-choice snapshots remain compatible.

No Estimate-specific Firebase configuration, indexes, rules, collections, or data backfill is required. Existing admin roles, runtime credentials, rules and indexes must already be configured as described above. Automated verification includes form switching/loading/saving, preserved estimate navigation, mixed publishing/submissions, exact zero/decimal/negative scoring, invalid input rejection, result rendering and answer-key redaction. Live authenticated Firebase workflows still require an authorized environment.
