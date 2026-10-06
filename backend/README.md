# AI CV Builder: backend

NestJS 12 API (ESM, TypeScript strict) backed by Postgres through TypeORM, with Redis and BullMQ
for background CV generation and Claude (Anthropic API) for the writing. Tests run on Jest in ESM
mode.

## Prerequisites

- Node.js 22+ (developed on Node 26)
- Docker, for the local Postgres and Redis
- An Anthropic API key, for generation (optional: the API runs without one)

## Setup

```bash
# from the repo root: start Postgres 17 (database ai_cv_builder, user/password postgres) and Redis 7
docker compose up -d

# then in backend/
cp .env.example .env     # set JWT_SECRET, and ANTHROPIC_API_KEY if you have one
npm install
npm run migration:run
npm run start:dev
```

The API listens on `http://localhost:3000/api/v1`.

If port 5432 or 6379 is already taken on your machine, start the containers on other host ports
and point `DATABASE_URL` / `REDIS_URL` at them:

```bash
POSTGRES_PORT=5434 REDIS_PORT=6380 docker compose up -d
```

## Environment

Validated at boot (`src/config/env.validation.ts`). The app refuses to start if a variable is invalid.

| Variable            | Required | Default                  | Notes                                                       |
| ------------------- | -------- | ------------------------ | ----------------------------------------------------------- |
| `DATABASE_URL`      | yes      |                          | `postgres://postgres:postgres@localhost:5432/ai_cv_builder` |
| `JWT_SECRET`        | yes      |                          | At least 32 characters. Signs the session cookie.           |
| `PORT`              | no       | `3000`                   |                                                             |
| `NODE_ENV`          | no       | `development`            | `production` marks the session cookie `secure`.             |
| `REDIS_URL`         | no       | `redis://localhost:6379` | BullMQ queue for generation.                                |
| `ANTHROPIC_API_KEY` | no       | empty                    | Empty: the app boots, but generation and answers fail.      |
| `ANTHROPIC_MODEL`   | no       | `claude-sonnet-5-5`      | Model for generation and answers.                           |

## Database and migrations

The schema is managed by migrations only. `synchronize` is always off.

```bash
# after changing an entity, generate a migration from the diff against the running DB
npm run migration:generate -- src/database/migrations/<Name>

npm run migration:run      # apply pending migrations
npm run migration:revert   # roll back the last one
```

Always review a generated migration before committing it. The TypeORM CLI uses `src/database/data-source.ts` (run through `tsx`) and reads `.env`. Because `tsx` doesn't emit decorator metadata, give every entity column an explicit `type`.

Tables: `users` and `cvs`. A CV keeps its `content` and `questions` as JSONB. The uploaded source
(`sourceText`, `sourcePdf`, `sourceFileName`) is cleared once generation succeeds and kept after a
failure, so Retry can use it.

## Scripts

| Script                 | What it does                                |
| ---------------------- | ------------------------------------------- |
| `npm run start:dev`    | Start in watch mode                         |
| `npm run build`        | Compile to `dist/`                          |
| `npm run start:prod`   | Run the compiled build                      |
| `npm test`             | Run unit tests (Jest, ESM)                  |
| `npm run test:watch`   | Run unit tests in watch mode                |
| `npm run test:cov`     | Run unit tests with coverage                |
| `npm run lint`         | Lint with oxlint (type-aware)               |
| `npm run format`       | Format with Prettier                        |
| `npm run format:check` | Check formatting                            |
| `npm run typeorm`      | Run the TypeORM CLI against the data source |

`jest.setup.mjs` preloads `@nestjs/common` and `@nestjs/core`: `@nestjs/throttler` is CommonJS and
`require()`s those ESM-only packages, which Jest can't do mid-import.

## Auth

Sessions are a JWT (7 days) in an httpOnly `access_token` cookie (`SameSite=Lax`, `secure` in
production). A global guard requires it on every route except those marked `@Public()`, and puts
`{ id, email }` on the request for `@CurrentUser()`. A missing or invalid cookie gives
`401 Log in to continue.`

## Generation

`POST /cvs` saves the CV as `generating` and adds a job to the `cv-generation` BullMQ queue (job id
= CV id, 3 attempts, exponential backoff from 10 s). The worker runs in the same process
(concurrency 2):

1. Streams a structured-output request to Claude (`src/ai/`): the PDF as a document block, the text
   and the role wrapped in tags, a system prompt that forbids inventing facts, and a JSON Schema for
   the draft. Effort is `medium`; server-side refusal fallback is on.
2. Stores the stage as it goes: `reading`, `analyzing` (request sent), `drafting` (first text),
   `tailoring` (the experience section starts), `reviewing` (validating the draft).
3. Validates the draft with class-validator, caps lengths, assigns ids and maps up to 8 questions
   onto the fields they fill. An invalid draft is retried once within the attempt.
4. Saves `content` and `questions`, sets `ready` and clears the source.

Rate limits, overloads and connection errors are retried by BullMQ. Anything else (refusal,
truncated output, invalid draft, missing key) fails at once. A failed CV gets a short, safe `error`
message; Anthropic's own error text never reaches the client or the database.

Answering a question is synchronous: Claude rewrites only the targeted field (effort `low`), using
only the answer and the current value. Skills answers are merged into the list without duplicates.

## API

All routes are prefixed with `/api/v1`. Every CV route is scoped to the signed-in user: someone
else's CV (or an id that isn't a UUID) is `404 CV not found.`

| Method   | Path                             | Body                                            | Success                         |
| -------- | -------------------------------- | ----------------------------------------------- | ------------------------------- |
| `POST`   | `/auth/register`                 | `{ email, password }`                           | `201 { user }` + cookie         |
| `POST`   | `/auth/login`                    | `{ email, password }`                           | `200 { user }` + cookie         |
| `POST`   | `/auth/logout`                   |                                                 | `204`, clears the cookie        |
| `GET`    | `/auth/me`                       |                                                 | `200 { user }`                  |
| `GET`    | `/cvs`                           |                                                 | `200 CvSummary[]`, newest first |
| `POST`   | `/cvs`                           | multipart: `targetRole`, `sourceText?`, `file?` | `201 Cv` (generating)           |
| `GET`    | `/cvs/:id`                       |                                                 | `200 Cv`                        |
| `PATCH`  | `/cvs/:id`                       | `{ title?, content? }`                          | `200 Cv`                        |
| `DELETE` | `/cvs/:id`                       |                                                 | `204`                           |
| `POST`   | `/cvs/:id/retry`                 |                                                 | `200 Cv` (generating)           |
| `POST`   | `/cvs/:id/questions/:qid/answer` | `{ answer }`                                    | `200 { cv, changed }`           |
| `POST`   | `/cvs/:id/questions/:qid/skip`   |                                                 | `200 Cv`                        |
| `POST`   | `/cvs/:id/questions/:qid/reopen` |                                                 | `200 Cv`                        |

`user` is `{ id, email, name, createdAt, updatedAt }`; the password hash is never returned. `Cv`
and `CvSummary` match `frontend/src/features/cvs/cv-types.ts`. A generating CV includes
`generation: { stage, stages }`; a failed one includes `error`.

Input rules:

- `email` is trimmed and lowercased. On register the password must be 8 to 72 characters; login
  only requires a non-empty one.
- `targetRole` is 2 to 100 characters. `sourceText` is at most 30,000 characters, with control
  characters stripped. At least one of `sourceText` and `file` is required. `file` is one PDF
  (checked by its `%PDF-` signature) of at most 5 MB.
- `content` is validated in full, with length and count caps (`src/cvs/cv-limits.ts`), and can
  only be saved once the CV is `ready`. `title` is 1 to 120 characters.
- `answer` is 1 to 1,000 characters.
- Unknown body fields are rejected at any depth.

Rate limits: register and login share 10 requests a minute per IP; creating and retrying CVs share
10 an hour per user; answers allow 60 an hour per user.

### Errors

Errors use the shape `{ statusCode, message, error }`, and `message` is always a string. Validation
errors also include `errors`, a map from field path to messages:

```json
{
  "statusCode": 400,
  "message": "Enter a valid email address.",
  "error": "Bad Request",
  "errors": { "email": ["Enter a valid email address."] }
}
```

| Case                                 | Status | `message`                                           |
| ------------------------------------ | ------ | --------------------------------------------------- |
| Invalid body                         | 400    | First validation message                            |
| No session cookie, or an invalid one | 401    | `Log in to continue.`                               |
| Wrong email or password              | 401    | `Invalid email or password.`                        |
| Unknown CV or someone else's         | 404    | `CV not found.`                                     |
| Unknown question                     | 404    | `Question not found.`                               |
| Email already registered             | 409    | `An account with this email already exists.`        |
| Content sent before the CV is ready  | 409    | `This CV can’t be edited until it’s ready.`         |
| Retry on a CV that hasn't failed     | 409    | `Only a failed CV can be retried.`                  |
| Answer for a field that was removed  | 409    | `That part of the CV no longer exists.`             |
| PDF over 5 MB                        | 413    | `The PDF must be 5 MB or smaller.`                  |
| Rate limit hit                       | 429    | `Too many requests, try again later.`               |
| Claude's answer couldn't be used     | 502    | `We couldn’t apply that answer. Try rephrasing it.` |
| No API key, or Claude unavailable    | 503    | `AI generation is not configured.` or a retry hint  |
