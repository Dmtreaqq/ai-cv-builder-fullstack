# AI CV Builder: Frontend

React 19 + TypeScript SPA built with Vite, React Router, Tailwind CSS v4 and shadcn/ui.

## Getting started

```bash
cd frontend
npm install
cp .env.example .env   # optional: only to point the proxy at another backend
npm run dev
```

The dev server runs on `http://localhost:5173` and expects the backend on port 3000.

## Scripts

| Script                 | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start the Vite dev server           |
| `npm run build`        | Type-check and build for production |
| `npm run preview`      | Preview the production build        |
| `npm run lint`         | Lint with oxlint                    |
| `npm run format`       | Format with Prettier                |
| `npm run format:check` | Check formatting                    |
| `npm test`             | Run Vitest in watch mode            |
| `npm run test:run`     | Run the test suite once             |

## Running against the backend

The app needs the NestJS API from `backend/` (see its README): start Postgres and Redis with
`docker compose up -d postgres redis` at the repo root, then `npm run start:dev` in `backend/`.
Without an `ANTHROPIC_API_KEY` everything works except generation, which fails with "AI generation
is not configured." and offers Retry. To run the whole app in Docker instead, see the root README.

The frontend calls relative `/api/v1/*` URLs. In development the Vite dev server proxies `/api` to
`VITE_API_PROXY_TARGET` (default `http://localhost:3000`), so no CORS setup is needed.

Every request goes through `src/lib/api-client.ts`. It sends the session cookie, turns error
responses into an `ApiError` carrying the backend's string `message`, and logs the user out on a
`401`.

**Session:** the backend keeps the session in an httpOnly `access_token` cookie, so nothing is
stored in `localStorage`. On load `AuthProvider` asks `GET /auth/me`; protected routes show a
loading state until it answers. Log out calls `POST /auth/logout`, then clears the local state.

**Generation:** creating a CV returns it with `status: 'generating'`. The CV page polls it every
1.5 s and shows the stage the backend reports, then the editor once it is `ready`, or the error
with Retry once it has `failed`.

## Tests

Vitest with React Testing Library. Tests mock the API modules (`vi.mock('@/features/cvs/cvs-api')`,
`vi.mock('@/features/auth/auth-api')`) and build data with `src/test/fixtures.ts` (`makeCv`,
`makeContent`, `makeUser`). `renderApp(path, user)` renders the whole app with a signed-in user, or
signed out with `null`.

## PDF export

**Download PDF** lazy-loads `@react-pdf/renderer` and renders `features/editor/pdf/cv-document.tsx`
to an A4 PDF with selectable text. Fonts are TTFs in `public/fonts/` (Source Serif 4 and Inter,
SIL Open Font License, see the `*-OFL.txt` files there). Colors are read from the theme tokens at
export time.

The editor preview is the same PDF: `pdf/use-pdf-blob.ts` re-renders it 400 ms after the last edit
and `pdf/pdf-preview.tsx` draws its pages to canvas with `react-pdf` (pdf.js). Both are lazy-loaded,
so what you see, page breaks included, is exactly what downloads. Change the layout only in
`cv-document.tsx`.

## Structure

```
src/
  app.tsx           route table
  index.css         Tailwind entry and theme tokens
  components/       shared UI (layout, page header, form field)
  components/ui/    shadcn/ui components (generated, then owned)
  lib/              shared helpers (cn, api client, ids, relative time)
  pages/            top-level pages not tied to a feature (landing, 404)
  features/auth/    auth API, session provider, login/register form, protected route
  features/cvs/     CV types and API, dashboard, composer, generation progress
  features/editor/  editor state, autosave, sections, questions, preview, PDF
  test/             test setup, fixtures and render helper
```

Routes: `/cvs` (dashboard), `/cvs/new` (composer) and `/cvs/:id` (generation progress, then the
editor) require a session.

Add shadcn components with `npx shadcn@latest add <component>` (configured in `components.json`).

## Design direction: Paper & Ink

A warm, editorial look: paper backgrounds, ink text, a serif display face and one terracotta accent.
The CV itself is the hero, shown as a paper sheet.

**Tokens** are defined in `src/index.css` and used through Tailwind utilities. The theme is light only.

| Token                    | Value     | Use                              |
| ------------------------ | --------- | -------------------------------- |
| `background`             | `#f6f3ec` | Page paper                       |
| `card`                   | `#fffdf8` | Cards and the CV sheet           |
| `foreground` / `primary` | `#2b211c` | Ink: text and the primary CTA    |
| `muted-foreground`       | `#6f6258` | Secondary copy                   |
| `secondary` / `muted`    | `#ece6da` | Chips and quiet fills            |
| `accent`                 | `#efe4d6` | shadcn hover backgrounds         |
| `border` / `input`       | `#e2dccf` | Hairlines                        |
| `brand` / `ring`         | `#b5603f` | Terracotta accent and focus ring |

**Fonts** are loaded from Google Fonts in `index.html`:

- Source Serif 4 (300/400/600), `font-serif`: `h1`/`h2` and display text. Headings use the light weight.
- Inter (400/500/600), `font-sans`: body and UI.

**Accent rules:**

- The primary CTA is an **ink pill** (the default `<Button>`), which turns terracotta on hover. All
  buttons are pills.
- Terracotta (`text-brand`) is only for links, step numerals, focus rings and small highlights. Don't
  use it for large fills or body text.

**Editor layout:** the form (with the "Needs your input" panel on top) and the live PDF preview,
with **Download PDF** as the primary ink pill. On `lg+`, a toggle in the header picks **Side by
side** (form left, sticky preview right) or **Tabs** (one centred column, a sticky bar switches
between **Edit** and **Preview**). The choice is remembered in `localStorage`. Below `lg` the editor
always uses the tabs.
