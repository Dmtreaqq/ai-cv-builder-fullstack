# AI CV Builder

Paste your background or upload your current CV, name the role you want, and get a tailored,
one-page CV written by Claude. The app then asks about the gaps it found (missing dates, vague
bullets, likely skills), rewrites the right field with each answer, and exports an A4 PDF.

- `frontend/`: React 19 + TypeScript SPA (Vite). See [frontend/README.md](frontend/README.md).
- `backend/`: NestJS 12 API with Postgres, Redis/BullMQ and the Anthropic API. See
  [backend/README.md](backend/README.md).

## Run it with Docker (one command)

```bash
docker compose up --build
```

Open http://localhost:8080. This starts Postgres, Redis, the backend (it runs pending migrations
on start) and the frontend, built and served by nginx, which also proxies `/api` to the backend.

To generate CVs, give it an Anthropic key. Either export it in your shell or put it in a `.env`
file at the repo root (see [.env.example](.env.example)):

```bash
cp .env.example .env    # set ANTHROPIC_API_KEY; JWT_SECRET, ports and the model are optional
```

Without a key everything except generation works, and a new CV ends with "AI generation is not
configured." and a Retry button.

`docker compose down` stops everything; add `-v` to also delete the database. If port 8080, 5432
or 6379 is taken, set `APP_PORT`, `POSTGRES_PORT` or `REDIS_PORT`.

## Run it for development

Only Postgres and Redis run in Docker; the apps run with hot reload:

```bash
docker compose up -d postgres redis

cd backend
cp .env.example .env                      # set JWT_SECRET; add ANTHROPIC_API_KEY to generate CVs
npm install
npm run migration:run
npm run start:dev                         # http://localhost:3000/api/v1

cd ../frontend
npm install
npm run dev                               # http://localhost:5173
```

## How I built it

**I started with the frontend.** The product is mostly a UX problem (compose, watch it generate,
fix the gaps, export), so I built every flow first against an MSW mock API that answered on the
same `/api/v1` routes the real backend would. Working through the screens told me exactly what
the API had to return (the CV shape, the generation stages, how a question points at a field)
before I wrote any server code. The mock also made the failure and retry paths easy to test.
Then I built the backend to that contract and replaced the mocks with real calls.

**What I decided, and why:**

- **NestJS, Postgres and TypeORM, with the CV stored as JSONB.** A CV is a document that is read
  and saved as a whole, so its content and questions are JSON; users and ownership stay
  relational. The schema changes only through reviewed migrations.
- **Generation runs in a BullMQ queue, not in the request.** A Claude call takes tens of seconds
  and can hit rate limits. The queue retries with backoff, and the stage it saves lets the page
  poll for progress and survive a reload.
- **Claude must not invent facts.** It returns structured output checked against a schema, and
  it asks about missing details instead of guessing them. A CV with made-up facts is worse than
  an incomplete one.
- **An answer rewrites only the field it belongs to.** This is cheaper, more predictable, and
  never overwrites the user's own edits elsewhere.
- **The session is a JWT in an httpOnly cookie.** No tokens in `localStorage`, so a script can't
  read them. The frontend calls same-origin `/api`, so no CORS setup is needed.
- **The editor preview is the real PDF.** An HTML preview drifted from the downloaded file, so
  the preview now renders the same react-pdf document, page breaks included.
- **Personal data is kept only as long as needed.** The uploaded CV is deleted once generation
  succeeds. Creating CVs and answering questions are rate limited per user, because each call
  costs money.
- **The app runs without an API key**, so anyone can try everything except generation.
