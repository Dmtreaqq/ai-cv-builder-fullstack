# AI CV Builder: full frontend flow on mocks

## Context

The frontend has the Paper & Ink foundation: tokens, landing page, `button`/`card`, an in-memory `AuthProvider`, and placeholder login/register pages. There is no backend yet. Goal: build the whole product flow end to end. The real `/api/*` calls are intercepted by **MSW**, which keeps its data in **localStorage**, and the "AI" returns predefined text. When the backend lands, we switch MSW off and the app code stays the same.

## Decisions (from the grilling)

| Topic | Decision |
| --- | --- |
| Scope | Full flow: auth → dashboard → composer → generation → editor + questions → PDF |
| Mock layer | MSW intercepting real `fetch('/api/...')`, handlers persist to localStorage |
| Auth | Minimal. Register and Login both just start a session for an email (required fields + email format). Session survives reload. CVs are scoped by a user id derived from the email; another user's CV returns 404 |
| PDF upload | Accept PDF ≤ 5 MB, show a filename chip, send it as multipart; the mock ignores its contents |
| Composer | Textarea and/or PDF (at least one is required) + required free-text target role |
| Generation | Resumable server job: the mock derives the stage from elapsed time (~12 s); the client polls every 1.5 s; named stages. A source text containing `fail` fails the job, and Retry then succeeds |
| CVs | Dashboard with many CVs: open, rename, delete (with confirmation). No duplicate. Role is fixed after creation (no regenerate) |
| Editor | Form + live paper preview; Edit/Preview tabs on phones; autosave with an 800 ms debounce |
| Edit depth | Fixed 5 sections; add/remove/reorder entries and bullets with up/down buttons; skills as chips |
| Dates | Free text (`"Mar 2021"`, `"Present"`) |
| Contact | Full name, headline (defaults to the role), email, phone, location, links (label + URL) |
| Questions | "Needs your input" panel at the top of the edit column, with badges in the section index. Answer or skip; skipped ones can be reopened |
| Answer apply | `POST …/answer`: the mock applies a per-question template to the field's *current* value (~1 s), then the field gets a brief highlight. Questions whose target was deleted disappear |
| Mock AI content | One persona with deliberate gaps (no phone, missing end date, vague bullet without a metric, degree without a year, unspecified databases) |
| PDF export | `@react-pdf/renderer`, lazy-loaded on click, A4, selectable text, Source Serif 4 + Inter TTFs |
| Tests | Light: pure-logic unit tests + a few RTL+MSW flow tests; manual Playwright pass at phone and desktop widths |

## Design (Inspo + existing Paper & Ink)

Inspo's archive is mostly marketing sites; the useful references were:
- **Function Health FAQ:** a small `JUMP TO` label over a plain list, where the active item gets a terracotta underline. This is the pattern for the **section index**.
- **Loops changelog:** `← Back` link, light serif H1, a muted meta line, then a hairline. This is the pattern for the **editor and generation headers**.

The project's tokens win everywhere: ink pills, terracotta only for small highlights, serif light H1s, `bg-card` paper sheets.

- **Dashboard `/cvs`:** serif H1 "Your CVs" with a **New CV** ink pill. Below it, a responsive card grid (1/2/3 cols). Each card shows the title, target role, a status badge (*Generating…*, *Needs input · 3*, *Ready*, *Failed*), "Edited 2 h ago", and a `⋯` menu with Rename and Delete. The empty state is a small paper sheet illustration with copy and a CTA.
- **New CV `/cvs/new`:** the landing `ComposerPreview` made real. A card with the textarea, plus a footer row with an `Attach PDF` chip (hidden file input; once attached it shows the filename with an ✕) and a target role input. **Generate CV** pill. Inline errors.
- **Generation (`/cvs/:id` while generating):** the H1 reads "Tailoring your CV for *Senior Backend Engineer*". An ordered stage list with terracotta numerals, ✓ for completed stages and a pulsing dot on the current one. Next to it, a skeleton paper sheet (CvSheetPreview style, shimmering lines). Note: "You can leave or reload this page. We'll keep working." Failed state: the message, a **Retry** pill and "Back to CVs".
- **Editor (`/cvs/:id` when ready):**
  - Header: `← All CVs`, serif title, meta `Senior Backend Engineer · Saved`, and **Download PDF** ink pill.
  - `lg+`: grid `[150px | form | preview]`. The section index is a sticky left rail with question-count dots. The form column has the questions panel on top, then the section cards. The preview is a sticky A4 sheet scaled with container-query units, like `cv-sheet-preview.tsx`.
  - `<lg`: the index becomes a horizontal scrollable chip row; a sticky bar holds **Edit | Preview** tabs and the Download button.

## API contract (implemented by MSW handlers)

All except auth require `Authorization: Bearer <token>`; a missing or invalid token returns 401.

- `POST /api/auth/register`, `POST /api/auth/login` `{email, password}` → `{token, user}`. The token is `mock.<base64url(email)>`; `user.id` is a stable hash of the lowercased email.
- `GET /api/cvs` → `CvSummary[]` (the current user's only, newest first)
- `POST /api/cvs` multipart `{targetRole, sourceText?, file?}` → `Cv` with `status: 'generating'`
- `GET /api/cvs/:id` → `Cv`. While generating it includes `generation: {stage, stages}`; once elapsed ≥ 12 s it materializes the fixture content + questions and persists `status: 'ready'`. A different owner gets 404.
- `PATCH /api/cvs/:id` `{title?, content?}` → `Cv`
- `DELETE /api/cvs/:id` → 204
- `POST /api/cvs/:id/retry` → resets `generationStartedAt` and sets `retried: true`, so the job succeeds this time
- `POST /api/cvs/:id/questions/:qid/answer` `{answer}` → `{cv, changed: FieldRef}` (with a ~1 s delay)
- `POST /api/cvs/:id/questions/:qid/skip` and `/reopen` → `Cv`

## Data model (`src/features/cvs/cv-types.ts`)

```ts
Cv { id, ownerId, title, targetRole, status: 'generating'|'ready'|'failed', error?, createdAt, updatedAt,
     generationStartedAt, generation?: { stage: StageId, stages: StageId[] },
     content: CvContent | null, questions: Question[] }
CvContent { contact: { fullName, headline, email, phone, location, links: {id,label,url}[] },
            summary, experience: {id, role, company, location, start, end, bullets: {id,text}[]}[],
            education: {id, degree, school, start, end, details}[], skills: {id,name}[] }
Question { id, prompt, hint?, target: FieldRef, status: 'open'|'answered'|'skipped', answer? }
FieldRef = { section: 'contact', field } | { section: 'experience'|'education', entryId, field }
         | { section: 'experience', entryId, bulletId } | { section: 'skills' } | { section: 'summary' }
```

Targets use **stable ids**, not indices, so reordering doesn't break them.

## File layout

**New dependencies:** `msw` (a runtime dep, because the mocks ship until the backend exists) and `@react-pdf/renderer`. Then run `npx msw init public --save`. Add shadcn components: `input textarea label badge tabs dropdown-menu dialog alert-dialog skeleton`. Add `public/mockServiceWorker.js` to the oxlint and prettier ignores. Add `VITE_USE_MOCKS=true` to `.env.example`.

```
src/mocks/
  browser.ts                setupWorker(...handlers)
  server.ts                 setupServer(...handlers) for tests
  db.ts                     read/write `cvb:mock-db` in localStorage ({ cvs: Cv[] })
  auth.ts                   token encode/decode, userIdFromEmail, requireUser(request)
  generation.ts             STAGES with offsets, stageAt(elapsedMs), resolveGeneration(cv, now)
  fixtures/persona.ts       buildCvContent(targetRole): persona content (summary templated with role)
  fixtures/questions.ts     buildQuestions(content) + applyAnswer(content, question, answer) templates
  handlers/auth-handlers.ts
  handlers/cv-handlers.ts
src/lib/api-client.ts       fetch wrapper: JSON/FormData, bearer token, ApiError(status, message), 401 → onUnauthorized
src/features/auth/
  auth-storage.ts           load/save/clear session `cvb:session`
  auth-provider.tsx         (edit) init from storage, persist on login/logout, wire 401 → logout
  auth-form.tsx             shared email/password form (mode: login|register)
  login-page.tsx, register-page.tsx  (edit) use AuthForm, redirect to `from` or /cvs
src/features/cvs/
  cv-types.ts, cvs-api.ts   typed calls for every endpoint above
  dashboard-page.tsx, cv-card.tsx, rename-cv-dialog.tsx, delete-cv-dialog.tsx
  new-cv-page.tsx           composer form + validation
  cv-page.tsx               loads CV via use-cv; switches generating | failed | ready
  use-cv.ts                 fetch + poll every 1.5 s while generating (useReducer, cleanup on unmount)
  generation-progress.tsx, generation-failed.tsx
src/features/editor/
  editor-reducer.ts         content actions: setField, add/remove/move entry|bullet|link|skill, applyChange, highlight
  editor-context.ts, use-editor.ts, editor-provider.tsx
  use-autosave.ts           800 ms debounce PATCH, status idle|saving|saved|error, flush()
  editor-page.tsx           header + responsive grid / mobile tabs
  section-index.tsx
  questions-panel.tsx, question-item.tsx   answer (flush autosave first → POST → applyChange + highlight), skip, reopen
  sections/contact-section.tsx, summary-section.tsx, experience-section.tsx,
           education-section.tsx, skills-section.tsx, bullet-list.tsx, move-buttons.tsx
  cv-sheet.tsx              HTML A4 preview (cqw-scaled)
  pdf/cv-document.tsx       react-pdf <Document><Page size="A4">, registers fonts from /fonts/*.ttf
  pdf/download-pdf-button.tsx  dynamic import of cv-document + pdf().toBlob() → download `<name>-<role>.pdf`
public/fonts/               SourceSerif4 Light/SemiBold + Inter Regular/Medium/SemiBold TTFs
```

**Edits to existing files:**
- `src/main.tsx`: `enableMocking()` (dynamic import of `./mocks/browser` when `VITE_USE_MOCKS !== 'false'`) before render
- `src/app.tsx`: protected routes `/cvs`, `/cvs/new`, `/cvs/:id` under the existing `ProtectedRoute`
- `src/components/layout.tsx`: a "My CVs" nav link when logged in
- `src/pages/landing/hero.tsx`: when logged in, show a "Go to my CVs" link instead of "coming soon"
- `src/test/setup.ts`: start the MSW server and clear localStorage per test
- `frontend/README.md`: mocks section and structure

## Mock persona and question templates

The persona is Jordan Lee with 3 jobs (most relevant first), 1 degree and ~10 skills. The summary is templated with the target role, and the headline is the role.

| Gap in fixture | Question | Applied as |
| --- | --- | --- |
| `contact.phone` empty | "What phone number should recruiters use?" | set field |
| Job 2 `end` empty | "When did you leave Northwind Logistics?" | set field (e.g. `Aug 2022`) |
| Job 1 bullet "Improved API performance." | "How much did API performance improve, and on which metric?" | `"<current minus period>, <answer>."` |
| Degree `end` empty | "What year did you graduate?" | set field |
| No databases in skills | "Which databases have you used in production?" | split on commas, add unique skills |

## Commit sequence (new branch `feat/cv-flow`)

1. Deps, shadcn components, MSW bootstrap, api-client, mock db/auth handlers, persistent auth + login/register forms
2. CV types, mock CV handlers + generation + fixtures, dashboard, new CV composer, generation progress/failed, polling
3. Editor: reducer/provider, autosave, section forms with CRUD and reorder, live preview, mobile tabs
4. Questions panel + answer/skip/reopen + highlight
5. PDF download (react-pdf + fonts)
6. Tests + README

## Tests (light)

- Unit: `generation.ts` stage timing and failure; `applyAnswer` templates; `editor-reducer` move/remove.
- RTL+MSW: login stores the session and lands on `/cvs`; composer shows the "role required / text or PDF required" errors; `/cvs/:id` with a seeded CV whose `generationStartedAt` is in the past renders the editor, and one started now renders the stages; answering the phone question updates the contact field.
- Update `app.test.tsx` for the new hero link.

## Verification

1. `npm run lint`, `npm run format:check`, `npm run test:run`, `npm run build` all pass.
2. `npm run dev` plus a Playwright check at 390×844 and 1280×800:
   - Register, then New CV, then reload mid-generation: progress resumes, then the editor appears.
   - A source containing `fail` shows the error; Retry then succeeds.
   - Answer and skip questions; the fields update and get highlighted.
   - Add, remove and reorder jobs and bullets; reload, and the edits persist.
   - Download PDF: open it and confirm it is A4 and the text is selectable/searchable.
   - Log in as another email: `/cvs` is empty, and the first user's `/cvs/:id` shows not found.
   - No horizontal scroll on the phone width.
3. Stop the Vite dev server by port 5173 and confirm the port is free.
