# AI CV Builder

Monorepo-style repo with independent projects (no workspaces):

- `frontend/`: React 19 + TypeScript SPA (Vite, React Router, Vitest). See `frontend/README.md`.
- `backend/`: NestJS 12 API (ESM, TypeORM + Postgres, BullMQ + Redis, Anthropic SDK, Jest). See `backend/README.md`. Postgres and Redis run from `docker-compose.yml` at the repo root.

Run npm commands from inside the project folder (e.g. `cd frontend && npm run test:run`).

## Frontend conventions

- **Comments:** don't add comments unless the logic is complex or non-obvious. Prefer clear names over explanatory comments.
- **Components:** function components only. Use named exports (`export function LoginPage()`), not default exports.
- **One component per file.** Contexts, reducers, types and hooks go in their own `.ts` files (oxlint `only-export-components`). Exception: `src/components/ui/` (see Styling).
- **File names:** kebab-case (`login-page.tsx`, `use-auth.ts`, `auth-context.ts`).
- **Imports:** extensionless. Use the `@/` alias (`@/features/auth/use-auth`) across folders and `./` within a folder. Import routing from `react-router`.
- **Types:** use `import type` for type-only imports. Avoid `any`.
- **React 19:** use `use(Context)` and `<Context value>`. Keep state in React Context + `useReducer`. No state libraries.
- **Folders:** feature code lives in `src/features/<feature>/` (pages, hooks, context). Shared UI goes in `src/components/`, and non-feature pages in `src/pages/`.
- **Styling:** Tailwind CSS v4 utilities plus shadcn/ui (`npx shadcn@latest add <component>`). `src/components/ui/` is shadcn-generated code that we own and edit. It is exempt from one-component-per-file and the `only-export-components` lint rule. Theme tokens live in `src/index.css`.
- **Colors and fonts:** use the theme tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `text-brand`, `font-serif`), never raw hex or rgb values. The app is **light only**: don't add dark-mode styles. Design direction: see "Paper & Ink" in `frontend/README.md`.
- **API:** call the backend through `src/lib/api-client.ts`, which prefixes relative `/api/v1` URLs (Vite proxies them in dev). Never hardcode the backend host. The session is an httpOnly cookie: don't store tokens or users in `localStorage`.
- **Tests:** colocate them as `*.test.tsx`. Query by role or text with React Testing Library. Mock the API modules with `vi.mock` and build data with `src/test/fixtures.ts`.
- **Formatting:** Prettier (single quotes, semicolons, trailing commas, width 100). Don't hand-format against it.

## Backend conventions

- **File names:** Nest style (`users.service.ts`, `users.controller.ts`, `user.entity.ts`, `dto/create-user.dto.ts`). One module per folder in `src/<feature>/`.
- **Imports:** relative, with a `.js` suffix (ESM, `nodenext`). Use `import type` for type-only imports. Avoid `any`.
- **Tests:** unit tests only, colocated as `*.spec.ts`. Import `describe`/`it`/`expect`/`jest` from `@jest/globals`. Mock repositories via `getRepositoryToken(Entity)`.
- **Database:** schema changes go through migrations only (`npm run migration:generate`, then review). Never enable `synchronize`. Give every entity column an explicit `type`.
- **API:** routes live under `/api/v1`. Validate input with class-validator DTOs (the global `ValidationPipe` uses whitelist + forbidNonWhitelisted + transform).
- **Errors:** responses are `{ statusCode, message, error }` with `message` always a string (the frontend `ApiError` reads it). Validation errors add an `errors` map by field. Throw Nest HTTP exceptions with a single string message.
- **Serialization:** map entities to response types explicitly (e.g. `toUserResponse`). Never return `passwordHash`, and keep it `select: false`.
- **Formatting:** same Prettier config as the frontend. Lint with oxlint.

## Before finishing a task

1. In `frontend/`: `npm run lint`, `npm run format:check`, `npm run test:run` and `npm run build` must all pass.
2. In `backend/`: `npm run lint`, `npm run format:check`, `npm test` and `npm run build` must all pass.
3. **Kill every dev server you started** (Vite, Nest, etc.) once implementation is done. On Windows, stopping the background shell does not kill the node process: find it by port (`Get-NetTCPConnection -LocalPort 5173`, or 3000 for the backend) and `Stop-Process` it, then check that the port is free. `nest start --watch` also leaves a watcher `node` process that does not hold the port, so stop that one too.
