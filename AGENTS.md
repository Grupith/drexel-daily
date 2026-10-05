<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Drexel Daily

## Project Overview

Drexel Daily is an internal daily challenge and engagement application for Drexel Building Supply employees.

The experience is inspired by daily games such as Wordle: employees receive one short challenge each workday, complete it once, see their results, and build a streak over time.

The application should feel:

- Fast
- Simple
- Friendly
- Competitive without being overly serious
- Mobile-first
- Easy to use during a short break or at the start of a shift

The primary domain is expected to be:

`drexeldaily.com`

The product name is:

**Drexel Daily**

---

# Core Product Philosophy

Do not over-engineer this application.

Prefer:

1. Simple architecture
2. Clear data models
3. Server-enforced business rules
4. Reusable components
5. Type safety
6. Good mobile UX
7. Maintainability
8. Security

over unnecessary abstraction or premature optimization.

Before introducing a new dependency, architectural pattern, database collection, or major abstraction, determine whether the existing stack can solve the problem cleanly.

Do not add packages simply because they are popular.

---

# Technology Stack

Use:

- Next.js
- App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase App Hosting
- Firebase Cloud Functions when trusted server-side logic is required

Use current stable APIs and patterns.

Prefer Server Components where appropriate.

Use Client Components only when browser APIs, state, event handlers, or interactive UI require them.

Do not convert components to `"use client"` unnecessarily.

---

# TypeScript

Use strict TypeScript.

Avoid `any`.

Create explicit types/interfaces for important domain objects including:

- User
- Challenge
- Question
- Answer
- Attempt
- Result
- Streak
- Category
- Admin data

Keep domain types centralized when practical.

Do not duplicate slightly different versions of the same type throughout the project.

---

# Authentication

The application is intended for Drexel Building Supply employees.

Authentication should be designed so access can be restricted to authorized employees.

Never trust authentication or authorization decisions made only in the client.

Protected data and administrative functionality must also be protected through Firebase Security Rules and/or trusted server-side code.

Admin authorization must never depend solely on hiding UI elements.

---

# Roles

Start with a simple role model.

### Employee

Employees can:

- View today's challenge
- Complete today's challenge once
- View their result
- View their streak
- View their challenge history
- View previous challenges and their own previous results

### Admin

Admins can additionally:

- Create challenges
- Create/edit questions
- Add images to questions
- Schedule challenges
- Manage categories
- Preview challenges
- Review challenge participation/results
- Manage content necessary to operate Drexel Daily

Do not create additional roles unless there is a demonstrated need.

---

# Daily Challenge Rules

These rules are critical.

## Challenge Days

Official challenge days are:

**Monday through Friday**

Saturday and Sunday are NOT challenge days.

Weekends must not:

- Break a streak
- Extend a streak
- Create missing challenge penalties
- Accidentally generate required daily challenges

---

# Challenge Availability

Each weekday challenge is available for the entire calendar day:

**12:00 AM through 11:59:59 PM Central Time**

Use the timezone:

`America/Chicago`

Do not use the user's browser timezone to determine the active Drexel Daily challenge.

All challenge-day calculations, streak calculations, challenge availability, and challenge IDs must use `America/Chicago`.

Daylight Saving Time must be handled correctly.

Do not implement Central Time by manually subtracting a fixed UTC offset.

---

# Date-Based Challenge Identity

Each challenge belongs to a specific calendar date.

Prefer an explicit date-based identifier such as:

`YYYY-MM-DD`

Example:

`2026-10-05`

The date represents the calendar date in `America/Chicago`.

The same challenge must be shown to every employee for that date.

Do not randomly select a different challenge or set of questions for each user.

---

# Challenge Content

Daily challenges should contain a small set of questions.

Questions may include categories such as:

- Product knowledge
- Vendor knowledge
- Company knowledge
- Safety
- Procedures
- Receiving
- Operations
- Locations
- People/team knowledge
- General Drexel knowledge
- Fun/trivia

The data model should allow categories to expand later without requiring major architectural changes.

---

# Question Reuse

The goal is for employees to receive fresh questions.

Questions should not normally be reused once they have appeared in a daily challenge.

Track whether and when a question has been used.

The system should make accidental duplicate/reused questions difficult.

If question reuse is ever allowed later, it should be intentional and based on a configurable reuse policy rather than accidental random selection.

Do not build complicated repetition algorithms until they are needed.

---

# Question Images

Questions may optionally contain an image.

Example:

> What vendor is this material from?

followed by an image of the material.

The question schema must therefore support an optional image.

Store uploaded question images in Firebase Storage.

Store only the necessary image metadata/reference in Firestore.

Images should:

- Load efficiently
- Be responsive
- Display correctly on phones
- Preserve useful aspect ratio
- Have appropriate loading/error states

Do not require an image for every question.

---

# Question Types

Design the question model so additional question types can be added later.

The initial implementation can focus on simple formats such as:

- Multiple choice
- True/false

Do not prematurely build a complex generic quiz engine.

Use a discriminated union or similarly type-safe structure if multiple question types are implemented.

---

# One Attempt Per Day

An employee gets exactly:

**ONE completed attempt per daily challenge.**

After submitting the challenge:

- The attempt becomes final
- The employee cannot restart it
- The employee cannot submit another attempt
- Refreshing the page must not reset the challenge
- Opening another browser/device must not provide another attempt

This rule MUST be enforced server-side/database-side.

Do not rely only on React state, localStorage, cookies, or disabled buttons.

Use a deterministic attempt identity or transaction strategy that prevents duplicate submissions.

For example, an attempt can conceptually be unique by:

`userId + challengeDate`

The exact implementation may vary, but duplicate completed attempts must not be possible under normal concurrent requests.

---

# In-Progress Challenges

Do not accidentally mark a challenge completed simply because the employee opened it.

Opening today's challenge and submitting today's challenge are separate concepts.

If draft/in-progress answers are stored, they must not count as a completed attempt.

Avoid adding autosave complexity unless it provides clear value.

---

# Results

After submitting, employees should immediately see their results.

Results may include:

- Score
- Correct answers
- Incorrect answers
- Total questions
- Percentage
- Updated streak

Once an attempt has been submitted, the result should be reproducible from stored attempt data.

Do not rely on recalculating historical results from question content that an admin may later edit.

Store enough historical information or immutable references to preserve accurate past results.

---

# Homepage

The `/` route should act as the employee's daily dashboard.

It should clearly show:

- Drexel Daily branding
- Today's challenge
- Whether today's challenge has been completed
- Today's result if completed
- Current streak
- Recent performance/history
- Clear CTA to begin today's challenge when available

The page should immediately answer:

**"What do I need to do today, and how am I doing?"**

Avoid dashboard clutter.

---

# Challenge History

Employees should be able to view previous daily challenges.

History should allow employees to see:

- Challenge date
- Whether they participated
- Their score/result
- The questions from that challenge
- Their submitted answers
- Correct answers

Past challenges are read-only.

Employees must never be able to submit or retry a historical challenge.

---

# Streak Rules

Streaks count consecutive completed **challenge days**, not consecutive calendar days.

Only Monday-Friday count.

Saturday and Sunday must be ignored.

Example:

Employee completes:

Thursday

Friday

Monday

Their streak is:

**3**

The weekend does not break the streak.

If the employee misses a required weekday challenge, the streak breaks.

Example:

Completed Friday

Missed Monday

Completed Tuesday

Tuesday begins a new streak.

Streak calculations must use `America/Chicago`.

Do not calculate streaks by simply checking whether two timestamps are 24 hours apart.

Use challenge dates and valid challenge days.

If Drexel Daily later supports holidays, shutdown days, or explicitly disabled challenge dates, design streak logic so those can eventually be treated as non-required days.

---

# Challenge Scheduling

Admins should be able to create challenges ahead of time.

A challenge should have a scheduled challenge date.

Only one active official challenge should exist for a given challenge date.

Enforce this structurally when practical.

A challenge may conceptually have states such as:

- Draft
- Scheduled
- Published/active
- Completed/archived

Keep state management simple.

Do not create unnecessary workflow states unless the UI requires them.

---

# Admin Question Creation

The admin question editor should support:

- Question text
- Category
- Question type
- Answer options
- Correct answer
- Optional image
- Explanation if desired
- Preview

Validation should prevent incomplete or invalid questions from being scheduled.

For multiple-choice questions:

- Require an appropriate number of choices
- Require exactly one valid correct answer unless the question type explicitly supports multiple correct answers

---

# Firestore Design

Favor a simple and query-efficient Firestore structure.

Likely core entities include:

- users
- challenges
- questions
- attempts

The exact schema may evolve.

Before changing the database structure significantly, consider:

- Security rules
- Query patterns
- Firestore indexes
- Read/write costs
- Historical accuracy
- Admin workflows
- Duplicate attempt prevention

Do not denormalize data without a reason.

However, reasonable denormalization is acceptable when it significantly simplifies Firestore queries or preserves historical challenge data.

---

# Historical Data Integrity

Historical challenge results are important.

If an admin edits a reusable question after it has appeared in a challenge, the historical challenge should not silently change.

Prefer one of these approaches:

1. Snapshot question data into the scheduled challenge.
2. Make published challenge questions immutable.
3. Use versioned questions.

Choose the simplest approach that reliably preserves history.

For this project, challenge snapshots are generally preferred unless there is a strong reason otherwise.

---

# Security

Treat Firestore Security Rules as part of the application architecture.

Employees must not be able to:

- Change another employee's attempt
- Submit attempts for another employee
- Give themselves admin access
- Modify challenge content
- Modify correct answers
- Modify their score after submission
- Create multiple completed attempts
- Access administrative data they do not need

Never trust fields sent from the client such as:

- score
- role
- userId
- completion status
- correct answer count

when those values can be determined or verified by trusted server logic.

Prefer calculating authoritative results server-side when practical.

---

# Correct Answers

Be careful about exposing correct answers before submission.

Employees should not be able to inspect normal client requests or Firestore documents and trivially retrieve all correct answers before completing the challenge.

Do not send sensitive answer-key information to the client unnecessarily.

If the architecture requires answer validation, prefer trusted server-side validation.

After submission, the application may return the information needed to display the employee's results.

---

# Firebase Storage

Use Firebase Storage for uploaded question images.

Use organized paths.

For example:

`challenge-images/{questionId}/{filename}`

or another predictable structure.

Validate:

- Authentication
- File type
- File size
- Authorization

Do not allow arbitrary unauthenticated uploads.

---

# UI / UX

Use shadcn/ui components where appropriate.

Maintain a consistent design system.

The UI should feel polished but simple.

Prioritize:

- Mobile usability
- Large touch targets
- Clear typography
- Fast navigation
- Strong visual hierarchy
- Accessible contrast
- Loading states
- Empty states
- Error states
- Disabled states

Avoid excessive animation.

Use animation only when it improves feedback or clarity.

---

# Mobile First

Assume many employees will complete Drexel Daily on their phone.

Every major workflow must work well around mobile widths first.

Test:

- Question cards
- Multiple-choice buttons
- Images
- Results
- History
- Admin forms where practical

Desktop layouts may expand but should not require separate business logic.

---

# Components

Prefer reusable components when a UI pattern appears more than once.

Examples may include:

- ChallengeCard
- QuestionCard
- AnswerOption
- ScoreDisplay
- StreakDisplay
- ChallengeStatus
- QuestionImage
- EmptyState
- LoadingState

Do not create a component abstraction for every small piece of markup.

---

# Data Fetching

Keep server state and client state conceptually separate.

Do not introduce TanStack Query automatically.

Next.js and Firebase already provide many of the capabilities this application needs.

If client-side caching, mutation state, invalidation, or complex synchronization becomes difficult, TanStack Query can be considered.

Document the reason before introducing it.

---

# Forms

Use clear validation.

Validation should exist at the appropriate layers:

- UI validation for usability
- Server/database validation for security and integrity

Never assume client validation is sufficient.

---

# Error Handling

Do not silently swallow errors.

User-facing errors should be understandable.

Development errors should include enough context to debug the issue without exposing secrets.

Avoid exposing Firebase internals or stack traces to normal users.

---

# Loading States

Any asynchronous action that can noticeably delay should have an appropriate loading state.

Examples:

- Loading today's challenge
- Submitting answers
- Uploading an image
- Loading history
- Saving an admin challenge

Prevent accidental double submission while a mutation is running.

---

# Accessibility

Use semantic HTML.

Inputs must have labels.

Buttons should be actual buttons.

Interactive elements must be keyboard accessible.

Images that communicate question information should have appropriate alternative text when doing so would not reveal the answer.

Do not rely solely on color to indicate correct/incorrect states.

---

# Naming

Use descriptive names.

Prefer:

`getTodayChallenge()`

over:

`getData()`

Prefer:

`submitChallengeAttempt()`

over:

`submit()`

Boolean names should generally read naturally:

- `isCompleted`
- `isAdmin`
- `hasAttempt`
- `canSubmit`

Avoid unnecessary abbreviations.

---

# File Structure

Keep related code reasonably close together.

A possible structure:

app/

page.tsx

challenge/

history/

admin/

components/

challenge/

dashboard/

admin/

ui/

lib/

firebase/

auth/

challenges/

streaks/

dates/

validation/

types/

Do not reorganize the entire project without a meaningful reason.

---

# Date Utilities

Centralize challenge-date logic.

Create shared utilities for concepts such as:

- Getting the current Drexel challenge date
- Determining whether a date is a challenge day
- Finding the previous challenge day
- Calculating streaks
- Formatting challenge dates

Do not scatter timezone logic across components.

All authoritative challenge-date logic must use:

`America/Chicago`

---

# Testing Priorities

Prioritize tests around business rules more than cosmetic UI.

Especially test:

### Date Logic

- Monday-Friday are challenge days
- Saturday/Sunday are skipped
- Friday → Monday counts as consecutive challenge days
- DST transitions do not select the wrong challenge

### Attempts

- User can submit once
- Duplicate submission is rejected
- Refreshing does not allow retry
- Two simultaneous submissions cannot create two completed attempts

### Streaks

- Consecutive weekdays increment
- Weekend does not break streak
- Missed weekday breaks streak
- Historical calculations remain correct

### Challenge Access

- Today's challenge is available all day Central Time
- Yesterday's challenge cannot be submitted
- Tomorrow's challenge cannot be accessed early
- Historical challenges are read-only

### Authorization

- Employee cannot perform admin actions
- Employee cannot modify another employee's data
- Client cannot forge score/results

---

# Development Workflow

When implementing a feature:

1. Understand the existing architecture before editing.
2. Identify the smallest set of files that need to change.
3. Reuse existing utilities/components where appropriate.
4. Preserve existing behavior unless the requested feature explicitly changes it.
5. Implement the feature.
6. Run TypeScript/lint checks.
7. Fix errors caused by the change.
8. Review security implications.
9. Briefly summarize what changed.

Do not make unrelated refactors while implementing a focused feature.

---

# Codex Behavior

When working in this repository:

Do not blindly rewrite large files.

Inspect existing code first.

Prefer incremental edits.

Do not remove working functionality unless explicitly requested or necessary for the requested change.

Do not change the database schema casually.

Do not weaken Firebase Security Rules to make development easier.

Do not expose secrets.

Do not hard-code credentials.

Do not place private Firebase Admin credentials in client-accessible environment variables.

Do not assume client code is trusted.

If a requested implementation creates a meaningful security or data-integrity problem, explain the problem before implementing an unsafe shortcut.

If multiple approaches are reasonable, prefer the simplest approach consistent with this document.

---

# Environment Variables

Use environment variables for environment-specific configuration.

Never commit:

- Service account private keys
- Private API keys
- Credentials
- Secrets

Remember that values exposed through `NEXT_PUBLIC_*` are accessible to browser clients.

Only put values there that are safe to expose publicly.

---

# Performance

Avoid premature optimization, but avoid obviously wasteful Firestore usage.

Do not:

- Fetch entire collections when only a few records are needed
- Create unnecessary realtime listeners
- Re-fetch static historical data repeatedly
- Store huge blobs directly in Firestore

Use pagination where historical data becomes large enough to require it.

Images should be appropriately compressed/resized.

---

# Analytics / Future Data

Structure challenge results so aggregate analytics can eventually answer questions such as:

- Participation rate
- Average score
- Average score by category
- Most difficult questions
- Most difficult categories
- Participation by date
- Streak distribution
- Question accuracy
- Vendor/product knowledge gaps

Do not build a large analytics system during the MVP.

Simply avoid designing the underlying data in a way that makes these metrics impossible to calculate later.

---

# Future Features

Possible future features include:

- Leaderboards
- Department/location comparisons
- Achievements
- Holiday/non-working-day calendar
- Push/email reminders
- Additional question formats
- Question reuse after a configurable cooldown
- Admin analytics
- Seasonal challenges
- Special company events

These are NOT MVP requirements unless explicitly requested.

Do not build them preemptively.

---

# Source of Truth

The hierarchy for product decisions is:

1. Explicit current user request
2. This AGENTS.md
3. Existing established project architecture
4. Existing code conventions
5. General framework conventions

If an explicit request conflicts with this file, follow the explicit request and update the relevant architecture/documentation if necessary.

---

# Core Rules — Never Accidentally Break These

Before completing changes involving challenges, attempts, dates, authentication, or streaks, verify these invariants:

1. One official challenge per challenge date.
2. Challenge dates use `America/Chicago`.
3. Challenges run Monday-Friday.
4. Weekend days do not affect streaks.
5. Daily challenge availability is 12:00 AM–11:59:59 PM Central Time.
6. Every employee sees the same challenge for a given date.
7. Employees receive one completed attempt per challenge.
8. Attempt limits are enforced beyond the UI.
9. Historical challenges cannot be retried.
10. Historical results remain accurate even if question-bank content later changes.
11. Question images are optional.
12. Correct answers should not be exposed before submission.
13. Authorization must be enforced server-side/database-side.
14. Admin functionality must be protected.
15. Changes should remain simple enough for a small internal application to maintain.

When a proposed implementation conflicts with one of these rules, stop and resolve the conflict rather than silently changing product behavior.
