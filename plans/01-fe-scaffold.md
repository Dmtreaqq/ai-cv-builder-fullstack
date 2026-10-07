# Plan: Frontend scaffold for the AI CV Builder

## Context
The repo `ai-cv-builder-fs` is empty: a default root `package.json` and the `.claude/` skills. It will hold a frontend and a backend as plain sibling folders (`frontend/`, `backend/`, not workspaces). This task covers only the **frontend scaffold**: tooling, folder conventions, routing and stub pages, with no real features yet. Styling, AI features, the CV data model and the fetch layer are deliberately deferred.

## Decisions (settled during the Q&A)
| Area | Decision |
|---|---|
| Tooling | Vite + React + **TypeScript**, client-side single-page app (SPA) |
| Layout | Plain `frontend/` folder. The root `package.json` is **deleted**. No `backend/` is created now |
| Package manager | npm (Node v26.9 / npm 11.19 installed) |
| Styling | Plain CSS, a **single `src/index.css`** (Tailwind etc. decided later) |
| Routing | `react-router` v7, declarative mode (`BrowserRouter` + `Routes`) |
| Client state | React Context + `useReducer` (used only by the auth stub for now) |
| Data fetching | Plain fetch in custom hooks, but **nothing is written yet**. Only the dev proxy |
| API wiring | Vite dev proxy `/api` → `VITE_API_PROXY_TARGET` (default `http://localhost:3000`) |
| Auth | `AuthContext` stub + `<ProtectedRoute>` component, which **no route uses yet** |
| Pages | Landing `/`, Login `/login`, Register `/register`, 404 `*`, all **placeholder text only** |
| AI features / CV types | None for now |
| Lint/format | ESLint (Vite flat config) + Prettier + `eslint-config-prettier` |
| Tests | Vitest + React Testing Library + jsdom |
| Conventions | Feature-based folders. No path alias and no `.nvmrc` |
| Git | Leave everything uncommitted |

## Steps
1. Delete the root `package.json`.
2. From the repo root, run `npm create vite@latest frontend -- --template react-ts` (non-interactive). Then run `npm install` in `frontend/`.
3. Add dependencies:
   - deps: `react-router`
   - devDeps: `prettier`, `eslint-config-prettier`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
4. Strip the template demo: the counter `App`, `App.css`, `src/assets/react.svg`, `public/vite.svg` and its favicon link. Set the `<title>` to "AI CV Builder".
5. Config:
   - `vite.config.ts`: `server.proxy['/api']` targets `loadEnv(...).VITE_API_PROXY_TARGET ?? 'http://localhost:3000'` with `changeOrigin: true`. A Vitest `test` block sets `environment: 'jsdom'`, `globals: true` and `setupFiles: './src/test/setup.ts'` (via `/// <reference types="vitest/config" />`).
   - `tsconfig.app.json`: add `"types": ["vitest/globals", "@testing-library/jest-dom"]`.
   - `eslint.config.js`: append `eslint-config-prettier` last.
   - `.prettierrc.json` (singleQuote, semi, trailingComma all, printWidth 100) and `.prettierignore` (dist, coverage).
   - `.env.example` with `VITE_API_PROXY_TARGET=http://localhost:3000`. Add `.env` to `frontend/.gitignore`.
   - `package.json` scripts: `dev`, `build`, `preview`, `lint`, `format` (`prettier --write .`), `format:check`, `test` (`vitest`), `test:run` (`vitest run`).
6. Source structure:
   ```
   frontend/src/
     main.tsx                  StrictMode > BrowserRouter > AuthProvider > App, imports index.css
     App.tsx                   <Routes>: Layout wraps /, /login, /register, *
     index.css                 minimal reset + base typography/layout
     components/
       Layout.tsx              header (app name + nav links Home/Login/Register) + <Outlet/>
     pages/
       LandingPage.tsx         placeholder heading/text
       NotFoundPage.tsx        placeholder + link home
     features/
       auth/
         AuthContext.tsx       AuthProvider (useReducer: { user } with login/logout actions), useAuth()
         ProtectedRoute.tsx    !user → <Navigate to="/login" replace state={{ from }}/>, else <Outlet/> (not wired)
         LoginPage.tsx         placeholder text
         RegisterPage.tsx      placeholder text
     test/
       setup.ts                imports @testing-library/jest-dom/vitest
   ```
7. Tests:
   - `src/App.test.tsx` uses MemoryRouter. It checks that `/` renders Landing, `/login` and `/register` render their placeholders, and an unknown path renders 404.
   - `src/features/auth/ProtectedRoute.test.tsx` checks that an unauthenticated user is redirected to `/login`, and an authenticated user (provider with an initial user) sees the child route.
8. Replace the template `frontend/README.md` with a short one covering scripts, env vars and the proxy note.

## Verification
- In `frontend/`, run `npm run lint`, `npm run format:check`, `npm run test:run` and `npm run build`. All should pass.
- Run `npm run dev`, then use the Playwright MCP to visit `/`, `/login`, `/register` and `/nope`. Each should render the correct placeholder inside the layout, with no console errors.
- Confirm that `git status` shows the root `package.json` deleted and `frontend/` untracked, with nothing committed.
