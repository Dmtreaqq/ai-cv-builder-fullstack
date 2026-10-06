# AI CV Builder: backend

NestJS 12 API (ESM, TypeScript strict) backed by Postgres through TypeORM. Tests run on Jest in ESM mode.

## Prerequisites

- Node.js 22+ (developed on Node 26)
- Docker, for the local Postgres

## Setup

```bash
# from the repo root: start Postgres 17 (database ai_cv_builder, user/password postgres)
docker compose up -d

# then in backend/
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```

The API listens on `http://localhost:3000/api/v1`.

If port 5432 is already taken on your machine, start Postgres on another host port and point `DATABASE_URL` at it:

```bash
POSTGRES_PORT=5434 docker compose up -d
```

## Environment

Validated at boot (`src/config/env.validation.ts`). The app refuses to start if a variable is invalid.

| Variable       | Required | Default | Example                                                     |
| -------------- | -------- | ------- | ----------------------------------------------------------- |
| `DATABASE_URL` | yes      |         | `postgres://postgres:postgres@localhost:5432/ai_cv_builder` |
| `PORT`         | no       | `3000`  | `3000`                                                      |

## Database and migrations

The schema is managed by migrations only. `synchronize` is always off.

```bash
# after changing an entity, generate a migration from the diff against the running DB
npm run migration:generate -- src/database/migrations/<Name>

npm run migration:run      # apply pending migrations
npm run migration:revert   # roll back the last one
```

Always review a generated migration before committing it. The TypeORM CLI uses `src/database/data-source.ts` (run through `tsx`) and reads `.env`. Because `tsx` doesn't emit decorator metadata, give every entity column an explicit `type`.

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

## API

All routes are prefixed with `/api/v1`.

| Method | Path         | Body                         | Success                |
| ------ | ------------ | ---------------------------- | ---------------------- |
| `POST` | `/users`     | `{ email, password, name? }` | `201` + `UserResponse` |
| `GET`  | `/users/:id` |                              | `200` + `UserResponse` |

`UserResponse` is `{ id, email, name, createdAt, updatedAt }`. The password hash is never returned.

- `email` is trimmed and lowercased before validation and must be unique.
- `password` must be a non-empty string. It is stored as a bcrypt hash (12 rounds).
- `name` is optional, trimmed, and at most 100 characters.
- Unknown body fields are rejected.

### Errors

Errors use the shape `{ statusCode, message, error }`, and `message` is always a string. Validation errors also include `errors`, a map from field name to messages:

```json
{
  "statusCode": 400,
  "message": "Enter a valid email address.",
  "error": "Bad Request",
  "errors": { "email": ["Enter a valid email address."] }
}
```

| Case                     | Status | `message`                                    |
| ------------------------ | ------ | -------------------------------------------- |
| Invalid body             | 400    | First validation message                     |
| `:id` is not a UUID      | 400    | `Invalid user id`                            |
| Unknown user id          | 404    | `User not found`                             |
| Email already registered | 409    | `An account with this email already exists.` |
