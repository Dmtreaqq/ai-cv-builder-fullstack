# AI CV Builder: Frontend

React 19 + TypeScript SPA built with Vite, React Router, Tailwind CSS v4 and shadcn/ui.

## Getting started

```bash
cd frontend
npm install
cp .env.example .env   # optional, see below
npm run dev
```

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

## Backend API

The frontend calls relative `/api/*` URLs. In development the Vite dev server proxies them to
`VITE_API_PROXY_TARGET` (default `http://localhost:3000`), so no CORS setup is needed.

## Structure

```
src/
  app.tsx          route table
  index.css        Tailwind entry and theme tokens
  components/      shared UI (layout)
  components/ui/   shadcn/ui components (generated, then owned)
  lib/             shared helpers (cn)
  pages/           top-level pages not tied to a feature (landing, 404)
  features/<name>/ feature modules: pages, context, hooks, components
  test/            test setup
```

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

**Future editor layout:** a sticky section index on the left, next to a live paper preview of the
CV, with **Download PDF** as the primary ink pill.
