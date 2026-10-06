# AI CV Builder

Monorepo-style repo with independent projects (no workspaces):

- `frontend/`: React 19 + TypeScript SPA (Vite, React Router, Vitest). See `frontend/README.md`.
- `backend/`: not created yet.

Run npm commands from inside the project folder (e.g. `cd frontend && npm run test:run`).

## Code conventions

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
- **API:** call the backend via relative `/api/*` URLs (Vite proxies them in dev). Never hardcode the backend host.
- **Tests:** colocate them as `*.test.tsx`. Query by role or text with React Testing Library.
- **Formatting:** Prettier (single quotes, semicolons, trailing commas, width 100). Don't hand-format against it.

## Before finishing a task

1. In `frontend/`: `npm run lint`, `npm run format:check`, `npm run test:run` and `npm run build` must all pass.
2. **Kill every dev server you started** (Vite, etc.) once implementation is done. On Windows, stopping the background shell does not kill the node process: find it by port (`Get-NetTCPConnection -LocalPort 5173`) and `Stop-Process` it, then check that the port is free.
