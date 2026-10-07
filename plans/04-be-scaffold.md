# Backend setup: NestJS + TypeORM + Postgres + Jest (Users only)

## Context
The repo has only `frontend/`. CLAUDE.md lists `backend/` as "not created yet". This task adds a NestJS backend with a Postgres DB managed by TypeORM migrations. It has one `users` resource and no auth yet. Unit tests (Jest) must pass. Decisions settled in the grilling session:

| Topic | Decision |
|---|---|
| Postgres | `docker-compose.yml` at repo root, Postgres only (backend runs on host) |
| Scope | Entity + service + `POST /api/v1/users`, `GET /api/v1/users/:id` |
| Columns | `id` uuid, `email` unique (trimmed + lowercased), `name` nullable, `passwordHash` NOT NULL, `createdAt`, `updatedAt` |
| Password | Required, non-empty only (matches frontend `validate-credentials.ts`), hashed with **bcryptjs** |
| Schema | Migrations only, `synchronize: false` |
| Tests | **Unit tests only**: no e2e, no test DB |
| Scaffold | Nest CLI (`--strict`, CommonJS), then trim |
| Lint/format | oxlint + same Prettier config as frontend (no ESLint) |
| Config | `@nestjs/config`, `DATABASE_URL` + `PORT`, validated at boot with class-validator |
| Prefix/port | `/api/v1` on 3000. **Frontend is not changed** (it still calls `/api`, and aligning it comes later) |
| Naming | Nest style (`users.service.ts`, `user.entity.ts`), colocated `*.spec.ts` |
| Validation | class-validator DTOs + global `ValidationPipe` (whitelist, forbidNonWhitelisted, transform) |
| Errors | Always `{ statusCode, message: string, error }`, since frontend `ApiError` reads `message` (`frontend/src/lib/api-client.ts`). Validation errors add an `errors` map by field |
| Duplicate email | 409 Conflict (catch PG `23505`, race-safe) |
| Bad id | `ParseUUIDPipe` → 400 `Invalid user id`; unknown → 404 `User not found` |
| Serialization | Explicit `toUserResponse()` mapper; `passwordHash` has `select: false` |
| Docs | Backend section in CLAUDE.md + `backend/README.md` |

## Steps

1. **Scaffold**: from the repo root run `npx @nestjs/cli new backend --strict --skip-git --package-manager npm`.
   - Delete `app.controller*`, `app.service.ts`, `test/`, the `test:e2e` script, `eslint.config.mjs` and the ESLint deps.
   - Keep Jest config in package.json (`rootDir: src`, `*.spec.ts`).
2. **Tooling**: copy `frontend/.prettierrc.json` and `.prettierignore` (adjusted), and add `.oxlintrc.json` (plugins `typescript`, `oxc`; ignore `dist`). Copy the env section of `frontend/.gitignore` (`.env`, `.env.*`, `!.env.example`) into the backend `.gitignore`.
   - Scripts: `lint` (oxlint), `format`, `format:check`, `test`, `test:watch`, `test:cov`, `build`, `start`, `start:dev`, `start:prod`, `typeorm`, `migration:generate`, `migration:run`, `migration:revert`.
   - The `typeorm` script is `typeorm-ts-node-commonjs -d src/database/data-source.ts`.
3. **Deps**: `@nestjs/config @nestjs/typeorm typeorm pg class-validator class-transformer bcryptjs` (bcryptjs v3 ships its own types), plus dev dep `oxlint`.
4. **Compose** (`/docker-compose.yml`): service `postgres:17` with `POSTGRES_USER/PASSWORD=postgres`, `POSTGRES_DB=ai_cv_builder`, port `5432:5432`, named volume and a `pg_isready` healthcheck.
5. **Config**: `src/config/env.validation.ts` defines an `EnvironmentVariables` class (`DATABASE_URL` string/url, `PORT` int, default 3000) and a `validate()` that uses `plainToInstance` + `validateSync` and throws a readable error.
   - `ConfigModule.forRoot({ isGlobal: true, validate })`.
   - Commit `backend/.env.example` with `DATABASE_URL=postgres://postgres:postgres@localhost:5432/ai_cv_builder` and `PORT=3000`.
6. **Database**:
   - `src/database/typeorm-options.ts` holds the shared options builder (url, `synchronize: false`, migrations glob).
   - `src/database/data-source.ts` is the CLI DataSource: it loads `.env` via `dotenv` and uses entity/migration TS globs.
   - `AppModule` uses `TypeOrmModule.forRootAsync` with `ConfigService` and `autoLoadEntities: true`.
   - Generate `src/database/migrations/<ts>-CreateUsers.ts` with `migration:generate` against the compose DB, then review it (unique index on email, `gen_random_uuid()` default).
7. **Users module** (`src/users/`):
   - `user.entity.ts`:
     - `@PrimaryGeneratedColumn('uuid')`
     - `email` (unique)
     - `name` (nullable)
     - `passwordHash` (`select: false`)
     - `@CreateDateColumn` / `@UpdateDateColumn` (timestamptz)
   - `dto/create-user.dto.ts`:
     - `email`: `@Transform` trim+lowercase, then `@IsEmail`
     - `password`: `@IsString @IsNotEmpty`
     - `name`: `@IsOptional @IsString`, trimmed, `@MaxLength(100)`
   - `user-response.ts`: a `UserResponse` type and `toUserResponse(user)` returning `{ id, email, name, createdAt, updatedAt }`.
   - `users.service.ts`:
     - `create(dto)`: `bcrypt.hash(password, BCRYPT_ROUNDS = 12)`, then save. A `QueryFailedError` with code `23505` becomes `ConflictException('An account with this email already exists.')`.
     - `findOne(id)`: throws `NotFoundException('User not found')` when missing.
   - `users.controller.ts`: `@Post()` returns 201 + UserResponse. `@Get(':id')` uses `ParseUUIDPipe` with a custom `exceptionFactory` (message `Invalid user id`).
8. **App bootstrap** (`main.ts`): `setGlobalPrefix('api/v1')`, a global `ValidationPipe` with `exceptionFactory` from `src/common/validation-exception-factory.ts`, and listen on `ConfigService.get('PORT')`. The exception factory flattens class-validator errors to the first message plus an `errors: Record<field, string[]>` map.
9. **Unit tests** (colocated `*.spec.ts`, real bcryptjs, mocked repository via `getRepositoryToken(User)`):
   - `users.service.spec.ts`:
     - create hashes the password (`bcrypt.compare` true) and returns no hash
     - duplicate → `ConflictException`
     - other DB errors are rethrown
     - findOne found / not found
   - `users.controller.spec.ts`: delegates to the service and maps the response.
   - `dto/create-user.dto.spec.ts`: email is normalized, invalid email and empty password are rejected, name is optional.
   - `common/validation-exception-factory.spec.ts`: the message is a string and the errors map is built.
   - `config/env.validation.spec.ts`: missing `DATABASE_URL` throws and `PORT` defaults to 3000.
10. **Docs**:
    - `backend/README.md`: prerequisites, `docker compose up -d`, `.env` setup, migration commands, scripts, and the API surface.
    - CLAUDE.md: replace "not created yet" with a backend description. Add backend conventions: Nest file naming, `*.spec.ts`, relative imports, migrations only (never `synchronize`), `/api/v1`, error shape, no `passwordHash` in responses. Add the backend `lint`/`format:check`/`test`/`build` to "Before finishing".

Git: the branch is `feat/cv-flow` with uncommitted frontend changes. No commits unless you ask.

## Verification
1. `cd backend && npm run lint && npm run format:check && npm test && npm run build` all pass.
2. Manual smoke test:
   - `docker compose up -d`, then `npm run migration:run`, then `npm run start:dev`
   - `POST /api/v1/users` returns 201 without a hash
   - a duplicate returns 409
   - a bad email returns 400 with a string `message`
   - `GET /api/v1/users/:id` returns 200 for a real id, 404 for an unknown uuid and 400 for `abc`
3. `npm run migration:revert` and then `migration:run` both work.
4. Kill the dev server: `Get-NetTCPConnection -LocalPort 3000`, then `Stop-Process`, and confirm port 3000 is free. Leave the compose Postgres running (or `docker compose stop`) and report which.
5. Frontend is untouched, so its checks don't need re-running.
