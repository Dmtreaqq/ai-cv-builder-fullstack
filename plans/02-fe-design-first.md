# Plan: "Paper & Ink" design foundation (Tailwind v4 + shadcn/ui)

## Context
The frontend is scaffolded, but every page is a placeholder and styling is one plain [index.css](frontend/src/index.css) with GitHub-like tokens. The product: a signed-in user uploads a CV PDF or describes their background, names a target role, then reviews, edits and downloads a generated CV as a PDF.

After an Inspo study and a grilling session, the user chose the following:
- **Paper & Ink** direction: warm paper, a serif display face, ink text and a terracotta accent. The CV itself is the hero.
- **Tailwind CSS v4 + shadcn/ui** in place of the single plain-CSS file.
- **shadcn-style conventions repo-wide**: kebab-case files, extensionless imports and the `@/` alias.

This pass covers the design foundation, the landing page, the auth pages and an auth-aware header. The editor and the generation flow come later, once a backend exists.

**Inspo references:**
- `contralabs-com`: stone paper, light Source Serif display, burgundy-brown ink, terracotta.
- `glideapps-com`: a "Describe… / Upload" composer card with a pill CTA.
- `mailchimp-com`: a serif headline over a sans body, a left-aligned hero and an eyebrow line.
- `gumloop-com--about`: a sticky index next to content. Use it for the future editor.

## Decisions (settled)
| # | Decision |
|---|---|
| Scope | Foundation + landing + auth pages + header |
| Theme | **Light only**. Drop the dark block and set `color-scheme: light` |
| Fonts | Google Fonts `<link>`: Source Serif 4 (300/400/600) for display, Inter (400/500/600) for body |
| Accent | Terracotta `#b5603f` for hover tint, focus ring, links and step numerals. **Primary CTA = ink pill** `#2b211c` |
| Landing h1 | "A CV written for the role you want". "AI CV Builder" moves to the eyebrow and nav |
| Composer | Static `aria-hidden` illustration (no real inputs). The CTA is a real `<Link to="/register">` |
| Signed-in hero | No CTA. A muted note reads "CV creation is coming soon" |
| Mobile | Order: headline → composer → scaled-down paper sheet. No horizontal scroll at 375px |
| Below fold | A 3-step "How it works" section: Upload or describe → Name the role → Review, edit, download PDF |
| Header | Logged out: "Log in" link and "Register" ink pill. Signed in: email and a "Log out" button that calls `logout()` then `navigate('/')` |
| Styling | Tailwind v4 via `@tailwindcss/vite`. shadcn/ui (base color stone). No Prettier class-sort plugin |
| Conventions | Kebab-case filenames. Extensionless imports. `@/` for cross-folder imports, `./` within a folder |
| Lint | Keep `only-export-components` and one-component-per-file for app code. Add an oxlint override disabling the rule for `src/components/ui/**` |
| Tests | New `layout.test.tsx` (logged out, signed in, logout). Update the app test's h1 and assert the CTA href |

## Steps

### 1. Tooling
- `npm i tailwindcss @tailwindcss/vite`.
- In [vite.config.ts](frontend/vite.config.ts), add `tailwindcss()` to `plugins` and add `resolve.alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }`. Vitest shares this config.
- In `tsconfig.json` and [tsconfig.app.json](frontend/tsconfig.app.json), add `"paths": { "@/*": ["./src/*"] }` and **remove** `allowImportingTsExtensions`, so that `.tsx` imports fail type-check.
- Run `npx shadcn@latest init` (Vite template, base color **stone**, CSS variables on), then `npx shadcn@latest add button card`. This adds `components.json`, `src/lib/utils.ts` (`cn`), `src/components/ui/{button,card}.tsx` and the deps `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react` and `tw-animate-css`.
- In [.oxlintrc.json](frontend/.oxlintrc.json), add `overrides: [{ files: ["src/components/ui/**"], rules: { "react/only-export-components": "off" } }]`.

### 2. Rename to kebab-case (`git mv`, imports updated, no extensions)
- `App.tsx` → `app.tsx` and `App.test.tsx` → `app.test.tsx`. These are case-only renames on Windows, so use two steps: `git mv App.tsx App.tmp && git mv App.tmp app.tsx`.
- `components/Layout.tsx` → `components/layout.tsx`.
- `pages/LandingPage.tsx` → `pages/landing-page.tsx` and `pages/NotFoundPage.tsx` → `pages/not-found-page.tsx`.
- `features/auth/`: `AuthProvider` → `auth-provider`, `LoginPage` → `login-page`, `RegisterPage` → `register-page`, `ProtectedRoute(.test)` → `protected-route(.test)`, `authContext` → `auth-context`, `useAuth` → `use-auth`.
- `main.tsx` and `test/setup.ts` are already fine. `index.html` keeps `/src/main.tsx`.

### 3. Tokens and theme ([src/index.css](frontend/src/index.css), which shadcn init rewrites)
- Keep `@import 'tailwindcss'` and `@import 'tw-animate-css'`. Remove the `.dark` block and the `@custom-variant dark` line.
- Set the shadcn variables in `:root`:
  - `--background: #f6f3ec`, `--foreground: #2b211c`, `--card: #fffdf8`, `--card-foreground: #2b211c`
  - `--primary: #2b211c`, `--primary-foreground: #f6f3ec`
  - `--secondary: #ece6da`, `--secondary-foreground: #2b211c`
  - `--muted: #ece6da`, `--muted-foreground: #6f6258`
  - `--accent: #efe4d6` (shadcn uses this for hover backgrounds), `--accent-foreground: #2b211c`
  - `--border` and `--input: #e2dccf`, `--ring: #b5603f`
  - Custom `--brand: #b5603f`, `--radius: 0.875rem`
- In `@theme inline`, add `--color-brand: var(--brand)`, `--font-sans: 'Inter', system-ui, sans-serif` and `--font-serif: 'Source Serif 4', Georgia, serif`.
- In the base layer, `h1`/`h2` use `font-serif font-light text-balance`, and `:root` gets `color-scheme: light`.
- In [ui/button.tsx](frontend/src/components/ui/button.tsx), change the base radius in `buttonVariants` to `rounded-full` so all buttons are pills. Also make the default variant's hover `hover:bg-brand`.
- [index.html](frontend/index.html): add the Google Fonts preconnect and stylesheet links.

### 4. Components and pages
- **[components/layout.tsx](frontend/src/components/layout.tsx)**:
  - Header on paper with the serif wordmark "AI CV Builder".
  - Use `useAuth()` from `@/features/auth/use-auth` to switch the nav: `<Button asChild variant="ghost"><NavLink to="/login">` and `<Button asChild><NavLink to="/register">` when logged out; when signed in, the email plus `<Button variant="ghost" onClick={…}>Log out</Button>`.
  - Main content gets `mx-auto max-w-6xl px-4 sm:px-6`.
- **[pages/landing-page.tsx](frontend/src/pages/landing-page.tsx)** composes the three pieces below. Each is one component per file in `src/pages/landing/`:
  - `landing/hero.tsx`:
    - A two-column grid (`lg:grid-cols-2`, single column below that), sized to fit 1280×800.
    - Left column: eyebrow, h1 (`text-4xl sm:text-5xl`), lead, `<ComposerPreview />`, then the CTA or the signed-in note.
    - Right column: `<CvSheetPreview />`.
  - `landing/composer-preview.tsx`: an `aria-hidden` card with placeholder text: "Describe your background…", "📎 Upload CV (PDF)" and "Target role: e.g. Product Designer".
  - `landing/cv-sheet-preview.tsx`: an `aria-hidden` A4-ratio sheet (`aspect-[1/1.414] bg-card shadow`) with a mock name, a rule and section lines. Slight rotation on lg, scaled down on mobile.
  - `landing/how-it-works.tsx`: an h2 and an `<ol>` of 3 steps with terracotta serif numerals. Section spacing `py-[clamp(72px,10vw,140px)]`.
- **[login-page.tsx](frontend/src/features/auth/login-page.tsx) / [register-page.tsx](frontend/src/features/auth/register-page.tsx)**: centered `Card` (`max-w-md`) with a `CardHeader` and a serif `CardTitle` that renders an `h1` "Log in" or "Register". Placeholder copy stays the same.
- **[not-found-page.tsx](frontend/src/pages/not-found-page.tsx)**: apply the serif h1 and muted copy. Keep the h1 text.

### 5. Tests
- [app.test.tsx](frontend/src/app.test.tsx): the `/` heading becomes "A CV written for the role you want". Add an assertion that the "Build my CV" link has `href="/register"`.
- New `components/layout.test.tsx`, following the [protected-route.test.tsx](frontend/src/features/auth/protected-route.test.tsx) pattern (`AuthProvider initialUser`):
  1. Logged out: it shows the "Log in" and "Register" links.
  2. Signed in: it shows the email and a "Log out" button, with no Register link.
  3. Clicking "Log out" (user-event) brings back the Log in and Register links.
- Optional: the hero shows "CV creation is coming soon" and no CTA link when signed in.

### 6. Docs
- **[CLAUDE.md](CLAUDE.md)**: rewrite the conventions:
  - Kebab-case files, extensionless imports, and `@/` for cross-folder imports.
  - Styling is Tailwind v4 utilities plus shadcn/ui. `src/components/ui/` is shadcn-generated, owned code, and is exempt from one-component-per-file and the lint rule.
  - Use the theme tokens (`bg-background`, `text-foreground`, `text-brand`, `font-serif`) and never raw hex values.
  - Light only.
  - Remove the "plain CSS / BEM" and "include the file extension" rules.
- **[frontend/README.md](frontend/README.md)**: add a "Design direction: Paper & Ink" section covering tokens, fonts, accent rules, the ink CTA, the CV-as-hero idea and the future editor layout (sticky section index next to a live paper preview, with Download PDF as the primary pill).

## Verification
1. In `frontend/`, run `npm run lint`, `npm run format:check`, `npm run test:run` and `npm run build`. All must pass.
2. Run `npm run dev` (background). With Playwright MCP, screenshot `/`, `/login`, `/register` and `/nope` at 1440×900 and 375×812. Check that:
   - The hero is complete above the fold at 1440.
   - There is no horizontal scroll at 375.
   - Source Serif and Inter actually render (`document.fonts.check`).
   - Keyboard tab order on `/` skips the composer mock and lands on "Build my CV".
3. Stop Vite: run `Get-NetTCPConnection -LocalPort 5173`, then `Stop-Process -Id <pid>`, then check that the port is free.
