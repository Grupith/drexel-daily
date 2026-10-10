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
the profile loads, so those users skip onboarding. The questions are still the existing demo.

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

| Field | Type / initial value |
| --- | --- |
| `displayName` | Auth display name, or `null` |
| `email` | Auth email, or `null` |
| `photoURL` | Auth photo URL, or `null` |
| `locationId` | Configured location value, or `null` before onboarding |
| `role` | `employee` (default) or `admin` |
| `createdAt` | Firestore server timestamp |
| `stats.currentStreak` | Number, initially `0` |
| `stats.longestStreak` | Number, initially `0` |
| `stats.totalPoints` | Number, initially `0` |
| `stats.challengesPlayed` | Number, initially `0` |

For legacy profiles without `createdAt`, the timestamp records when the schema
was initialized. Stats are initialized only; demo challenges do not update them.
