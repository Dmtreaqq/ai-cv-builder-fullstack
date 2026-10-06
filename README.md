# AI CV Builder

Paste your background or upload your current CV, name the role you want, and get a tailored,
one-page CV written by Claude. The app then asks about the gaps it found (missing dates, vague
bullets, likely skills), rewrites the right field with each answer, and exports an A4 PDF.

- `frontend/`: React 19 + TypeScript SPA (Vite). See [frontend/README.md](frontend/README.md).
- `backend/`: NestJS 12 API with Postgres, Redis/BullMQ and the Anthropic API. See
  [backend/README.md](backend/README.md).

## Run it locally

```bash
docker compose up -d                      # Postgres 17 and Redis 7

cd backend
cp .env.example .env                      # set JWT_SECRET; add ANTHROPIC_API_KEY to generate CVs
npm install
npm run migration:run
npm run start:dev                         # http://localhost:3000/api/v1

cd ../frontend
npm install
npm run dev                               # http://localhost:5173
```

Without an Anthropic key everything except generation works, and a new CV ends with "AI generation
is not configured." and a Retry button.
