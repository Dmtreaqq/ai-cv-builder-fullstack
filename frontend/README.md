# AI CV Builder: Frontend

React 19 + TypeScript SPA built with Vite and React Router.

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
  App.tsx          route table
  components/      shared UI (Layout)
  pages/           top-level pages not tied to a feature (Landing, 404)
  features/<name>/ feature modules: pages, context, hooks, components
  test/            test setup
```
