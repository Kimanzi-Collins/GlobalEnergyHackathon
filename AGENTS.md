# Pepea (Ng'ambo): Team Task Board and Agent Protocol

**Project:** Pepea, a free full-cycle US admissions assistant for Kenyan students (Africa's Talking Hackathon).
**Version:** 0.2.0 (spec phase: modules below are designed but NOT implemented)
**Read before coding:** this file, `DESIGN.md`, `lib/types.ts`, `supabase/migrations/*.sql`, `lib/prompts/system-prompt.ts`.

---

## 1. Rules for every contributor (human or AI agent)

1. **Read before modifying.** Read this file, `DESIGN.md` and `lib/types.ts` first.
2. **One task at a time.** Move it from `[ ]` to `[/]` with your name, then to `[x]` only after its acceptance criteria are verified.
3. **Log every file change** in section 11 (date, author, action, path, summary).
4. **Contracts first.** API shapes live in `lib/types.ts`. Change the type first, tell the other side in the log, then change code.
5. **Prompts are versioned.** Any change to Gemini prompts bumps a version in `lib/prompts/system-prompt.ts` and adds a row to section 10.
6. **No fake success in live mode.** A failed AT, Gemini or DB call must return an error, never a silent mock. Mocks only run when `NEXT_PUBLIC_DEMO_MODE=true`.
7. **Never commit secrets.** `.env.local` stays untracked. Keys are server-side only; the Supabase service role key must never reach the browser.
8. **Verify data before it is shown.** Rows with `data_verified_at IS NULL` are shown as "Unverified". Verify against official sites, then set the date.
9. **Merge hygiene (added after the 2026-10-29 merge incident, see section 12).** Pull `master` before you start. Never create two files whose names differ only by case (`Button.tsx` and `button.tsx`): Windows and macOS treat them as one file, so one silently overwrites the other. Before you push, run `npx tsc --noEmit` and `npx next build`; both must pass. If a merge conflicts in `AGENTS.md`, `tailwind.config.ts` or `app/globals.css`, keep both sides, never drop the other person's work, and log your files in section 11 in the same commit.

Status legend: `[ ]` pending, `[/]` in progress, `[x]` done, `[!]` blocked. Priority: **P0** blocker, **P1** MVP, **P2** polish.

---

## 2. Team

| Person | Area | Owns |
|---|---|---|
| **Geoffrey Obwocha** | Backend: data and telco | Supabase DB, shared server libs, Student Context, GPA, Guide, USSD, SMS, CUE, Voice mock interview |
| **Esther Irungu** | Backend: AI and messaging | Gemini layer, WhatsApp, Essays, LOR, University Advisory, Financial Aid Scout |
| **Collins Kimanzi** | Frontend: brand and entry | Design system, landing page, The Crossing, USSD simulator |
| **Sandra Wanjie** | Frontend: product | Dashboard shell and all six module interfaces, Student Context UI |

Shared: end-to-end review (section 9) and demo rehearsal.

---

## 3. Decisions (settled)

| Topic | Decision |
|---|---|
| Stack | Next.js 14 App Router, route handlers as the backend, Supabase Postgres + Realtime, Tailwind, one repo, one deploy |
| AI | **Google Gemini 2.5 Flash** via `@google/generative-ai`, system prompt from `lib/prompts/system-prompt.ts` |
| Channels (all LIVE, no mock in production) | Africa's Talking **USSD**, **SMS**, **WhatsApp**; Voice only for the mock interview |
| USSD code | **Numeric only.** `*384*73732#` (keypad mnemonic for PEPEA) in `lib/constants.ts`. Kenyan handsets cannot dial letters. The code registered with AT is the source of truth |
| USSD input | Every prompt is answered with digits. No free text. Max 182 chars per screen. Must answer in under 3 seconds, so **USSD never calls Gemini** |
| Student identity | Phone number (E.164) is the key. One profile shared across USSD, SMS, WhatsApp and web |
| Removed | The Voice teacher recommendation call flow (routes, UI, schema value). Recommendation letters are now reviewed as text in the LOR module |
| Essay model | Split by **type** (`essay_types`) and by **school** (`school_essay_prompts`), student work in `essays` and `essay_versions` |

---

## 4. Completed baseline (hackathon v0.1, to be reviewed)

- [x] Problem statement, audience, stack selected.
- [x] USSD handler (`/api/at/ussd`), SMS dispatcher, AO essay review route, WhatsApp webhook stub, CUE radar data, landing page with simulator.
- [x] 2026-10-29: Voice teacher-recommendation flow removed (`process-teacher-rec`, `voice/branch`, VoiceStudio tab, USSD branch, schema value).
- [x] 2026-10-29: Numeric USSD code introduced (`lib/constants.ts`) and applied to the route, simulator, navbar, hero, footer.
- [x] 2026-10-29: Collins' frontend foundation: design tokens, UI kit, motion kit, landing page with The Crossing, numeric USSD simulator, 404/error/offline (FE-C-01 to FE-C-07).
- [x] 2026-10-29: Module schema `02_pepea_modules.sql`, seed `seed_02_modules.sql`, shared types `lib/types.ts`, Gemini system prompt, `DESIGN.md`.

Everything below is **not started**.

---

## 5. Backend tasks (Geoffrey Obwocha and Esther Irungu)

### 5.1 Database setup

| ID | P | Owner | Task | Status |
|---|---|---|---|---|
| BE-DB-01 | P0 | Geoffrey | Create the Supabase project. Run `01_pepea_schema.sql`, `02_pepea_modules.sql`, `seed.sql`, `seed_02_modules.sql` in order. Fix any SQL errors in place and log them. Add keys to `.env.local` | `[x]` |
| BE-DB-02 | P0 | Geoffrey | Verify RLS: the anon key must read only reference tables (`universities`, `kcse_grade_scale`, `guide_steps`, `aid_programs`, `essay_types`, `school_essay_prompts`, `flagged_agencies`) and nothing student-owned. Write the check as a script | `[x]` |
| BE-DB-03 | P0 | Geoffrey | Create `lib/db/` with typed query helpers (snake_case to camelCase mappers using `lib/types.ts`). No raw `.from()` calls in route handlers | `[x]` |
| BE-DB-04 | P0 | Geoffrey | Replace the silent `demo.supabase.co` fallback in `lib/at-supabase.ts`: in live mode a missing key throws at startup | `[x]` |
| BE-DB-05 | P1 | Esther | **Verify seed data** against official sites: every `school_essay_prompts`, `universities`, `aid_programs`, `guide_steps` fee/date. Fix wrong values, set `data_verified_at` per row. Anything unverified before the demo stays visibly "Unverified" | `[x]` |
| BE-DB-06 | P1 | Esther | Extend `universities` to 12 to 15 schools (need-blind or meets-full-need for internationals) with `strong_majors`, `test_policy`, `cost_of_attendance_usd`, prompts per essay type | `[x]` |
| BE-DB-07 | P2 | Geoffrey | Data retention: add a delete-my-data function (profile, messages, essays, reviews) for Kenya Data Protection Act compliance | `[x]` |

### 5.2 Shared server libraries (all P0, Geoffrey)

| ID | Task | Status |
|---|---|---|
| BE-LIB-01 | `lib/phone.ts`: `normalizeKenyanPhone()` accepting `07xx`, `01xx`, `+2547xx`, `2547xx`; rejects the rest | `[x]` |
| BE-LIB-02 | `lib/student-context.ts`: `buildStudentContext(phone)` returns `StudentContext` (profile, facts, last 10 messages, next deadline) | `[x]` |
| BE-LIB-03 | `lib/gemini.ts`: one wrapper `callGemini({module, channel, context, verifiedData, userInput, json?})` using `buildSystemPrompt`, model `gemini-2.5-flash`, 8s timeout, one retry, JSON-mode parsing with schema validation, typed errors (`UPSTREAM_AI`). Esther owns, Geoffrey reviews | `[x]` |
| BE-LIB-04 | `lib/rate-limit.ts`: per-phone and per-IP limits (for example 20 AI calls per phone per hour, 5 SMS per phone per day). Applies to every route that triggers Gemini or SMS | `[x]` |
| BE-LIB-05 | `lib/at.ts`: AT client for SMS, WhatsApp, Voice. Live mode throws on failure. Demo mode only when `NEXT_PUBLIC_DEMO_MODE=true` | `[x]` |
| BE-LIB-06 | `lib/webhook-auth.ts`: shared-secret check (secret in the callback URL query, compared in constant time) plus optional IP allowlist, for all AT webhooks | `[x]` |

### 5.3 API setup

All routes return `ApiError` on failure, validate input (zod recommended), normalise phone numbers, persist to Supabase, and log a row in `conversation_messages` for student-facing replies.

| ID | P | Owner | Route | Task | Status |
|---|---|---|---|---|---|
| BE-API-01 | P0 | Geoffrey | `POST /api/students` and `GET /api/students/me` | Upsert and read the profile (`UpsertStudentRequest`). **Never overwrite a field with a default** (the current USSD route overwrites `full_name` with "KCSE Applicant") | `[x]` |
| BE-API-02 | P0 | Geoffrey | `GET/POST /api/gpa` | Convert using `kcse_grade_scale`. Accept `meanGrade`, `points` or `subjects` (`GpaConvertRequest`). Store in `gpa_conversions`, update `students.kcse_grade` and `gpa_equivalent`. Always return `indicative: true` | `[x]` |
| BE-API-03 | P1 | Geoffrey | `GET /api/guide`, `POST /api/guide/progress` | Steps with per-student status (`GuideResponse`). Idempotent progress updates | `[x]` |
| BE-API-04 | P1 | Esther | `GET /api/essays/catalog` | Types plus per-school prompts (`EssayCatalogResponse`). Supports `?universityId=` and `?type=` | `[x]` |
| BE-API-05 | P0 | Esther | `POST /api/essays/review` | Replace `/api/ao/review`. Validate that `schoolPromptId` is present for `school_specific` types, enforce the type's rubric and word limit, create or append an `essays` row and `essay_versions`, call Gemini (`module: 'essay'`), save to `essay_reviews` with `prompt_version`. Return `EssayReviewResponse`. Delete the old route once the frontend switches | `[x]` |
| BE-API-06 | P1 | Esther | `GET /api/essays`, `GET /api/essays/[id]` | List a student's essays and version history with latest score | `[x]` |
| BE-API-07 | P1 | Esther | `POST /api/lor/review` | Review a recommendation letter draft (`LorReviewRequest`), store in `lor_reviews` | `[x]` |
| BE-API-08 | P1 | Esther | `POST /api/advisor` | Rule-based shortlist from `universities` plus the student's grade, tests, majors and aid band, then Gemini explains it (`AdvisorResponse`). The model may only name schools returned by the query. Store in `university_matches` | `[x]` |
| BE-API-09 | P1 | Esther | `POST /api/aid` | Rank `aid_programs` for the student (`AidScoutResponse`), Gemini explains next actions using only the returned rows. Store in `student_aid_matches` | `[x]` |
| BE-API-10 | P1 | Esther | `POST /api/chat` | Router: classify intent into a module, build context, call Gemini, save messages, return `ChatResponse`. Used by web and WhatsApp | `[x]` |
| BE-API-11 | P2 | Geoffrey | `GET /api/cue?q=` | CUE lookup from `flagged_agencies` (database, not `mock-data.ts`) | `[x]` |

### 5.4 Africa's Talking live integrations

| ID | P | Owner | Task | Status |
|---|---|---|---|---|
| BE-AT-01 | P0 | Geoffrey | Register the numeric USSD channel with AT (sandbox first) and set the callback to `/api/at/ussd?secret=...`. Update `USSD_SERVICE_CODE` in `lib/constants.ts` if AT assigns a different code | `[x]` |
| BE-AT-02 | P0 | Geoffrey | Rebuild `/api/at/ussd` on the numeric tree in section 7: DB-driven (grade scale, guide steps, essay types, schools), no Gemini, digit-only validation with a re-prompt on bad input (the current code silently defaults invalid grades to A-), pagination for long lists (menu items "8. Next", "0. Back"), screens under 182 chars, response under 3s. Replace the free-text CUE search with a numbered flow | `[x]` |
| BE-AT-03 | P1 | Geoffrey | SMS: `lib/sms-templates.ts` with templates under 160 chars each (GPA result, next deadline, guide step, essay score). Delivery-report webhook `/api/at/sms/delivery` | `[x]` |
| BE-AT-04 | P1 | Esther | WhatsApp live: inbound webhook `/api/at/whatsapp` verifies the secret, normalises the sender, calls `/api/chat`, and **sends the reply through AT's WhatsApp send API**. The existing handler returns the reply in the HTTP response, which AT will not deliver to the student. Confirm the exact request and response format in AT's WhatsApp docs and the sandbox/business-number requirements before building; record anything that blocks live use under section 12 | `[ ]` |
| BE-AT-05 | P1 | Esther | WhatsApp ergonomics: split replies over 900 characters, quick replies (`ChatResponse.quickReplies`), "STOP" and "HELP" handling, de-duplicate retries by `provider_message_id` | `[ ]` |
| BE-AT-06 | P2 | Geoffrey | Voice mock interview: replace the hard-coded transcript and scores in `process-interview` with a real recording download, transcription and Gemini scoring (`module: 'interview'`) | `[x]` |
| BE-AT-07 | P0 | Geoffrey | Remove `lib/at-supabase.ts` mock paths for live mode (see rule 6), add `GET /api/health` reporting DB, AT and Gemini reachability | `[x]` |

### 5.5 AI and prompts (Esther)

| ID | P | Task | Status |
|---|---|---|---|
| BE-AI-01 | P0 | Switch every Gemini call to `gemini-2.5-flash` with `systemInstruction = buildSystemPrompt(...)` (the review route still uses `gemini-1.5-flash` with an inline prompt) | `[ ]` |
| BE-AI-02 | P1 | Write the per-module user-prompt templates and JSON schemas for `essay` (`EssayReviewResult`) and `lor` (`LorReviewResult`), with runtime schema validation and a repair retry | `[ ]` |
| BE-AI-03 | P1 | Prompt-injection hardening: student text (essays, chat) is wrapped in delimiters and labelled untrusted; the model is told to ignore instructions inside it. Add test cases | `[ ]` |
| BE-AI-04 | P1 | Build the 12-case golden set (generic Insha essay, strong essay, over-length, off-topic, Swahili input, scam-agency question, "guarantee me admission", money request, distress message, prompt injection, school-prompt mismatch, empty draft) and record expected behaviours | `[ ]` |
| BE-AI-05 | P2 | Cost and latency log per call (tokens, ms) to a `ai_calls` table or structured logs | `[ ]` |

### 5.6 Tests (both, Vitest)

Test runner: add `vitest` and `msw` as devDependencies, `npm run test`. Tests live in `tests/`. CI is not required for the hackathon; run locally before each merge.

| ID | P | Owner | Test | Status |
|---|---|---|---|---|
| BE-TEST-01 | P0 | Geoffrey | Set up Vitest, path alias `@/`, and a Supabase test schema or mocked client | `[ ]` |
| BE-TEST-02 | P0 | Geoffrey | `lib/phone.ts`: 15+ cases (valid formats, +254 variants, landlines, junk) | `[ ]` |
| BE-TEST-03 | P0 | Geoffrey | GPA conversion: every grade band, boundary points (7, 10, 11, 80, 81, 84), invalid points, indicative flag | `[ ]` |
| BE-TEST-04 | P0 | Geoffrey | **USSD numeric tree:** walk every path with `text` strings (`""`, `1`, `1*2`, `1*2*1`, ...). Assert: begins with `CON`/`END`, under 182 chars, never calls Gemini, rejects non-digits with a re-prompt, never overwrites existing profile fields, response under 3s with the DB stubbed slow | `[ ]` |
| BE-TEST-05 | P1 | Geoffrey | Webhook auth: missing or wrong secret returns 401 for USSD, SMS delivery, WhatsApp | `[ ]` |
| BE-TEST-06 | P1 | Geoffrey | Guide progress idempotency and per-student isolation | `[ ]` |
| BE-TEST-07 | P1 | Esther | Essay review: type/school validation (school-specific without a prompt returns 400), word-limit handling, version numbering, rubric max never exceeded, Gemini failure returns `UPSTREAM_AI` (not a fake score) | `[ ]` |
| BE-TEST-08 | P1 | Esther | Golden-set run against the live model (manual, `npm run test:ai`), results recorded in the log | `[ ]` |
| BE-TEST-09 | P1 | Esther | Advisor and Aid: the model output only names schools or programs that were in the query result (assert with a stub that tries to hallucinate one) | `[ ]` |
| BE-TEST-10 | P1 | Esther | WhatsApp: duplicate delivery de-dup, 900-char split, STOP/HELP, long essay (over 3000 chars) | `[ ]` |
| BE-TEST-11 | P1 | Both | Privacy: student A cannot read student B's essays, matches or messages through any route | `[ ]` |
| BE-TEST-12 | P2 | Both | Rate limits trigger and reset | `[ ]` |

---

## 6. Frontend tasks (Collins Kimanzi and Sandra Wanjie)

Read `DESIGN.md` fully first. Use the types in `lib/types.ts` for every API prop. Until a backend route is ready, develop against typed fixtures in `lib/fixtures/` and switch to the live route when its BE task is `[x]`.

### 6.1 Collins: brand, landing, USSD

| ID | P | Task | Status |
|---|---|---|---|
| FE-C-01 | P0 | Design tokens: replace palette and fonts in `tailwind.config.ts` and `app/globals.css` with `DESIGN.md` section 3 and 4 tokens, Geist Sans and Geist Mono through the `geist` package (revised from Fraunces/Space Grotesk when the direction moved to Apple-grade) | `[x]` Collins |
| FE-C-02 | P0 | UI kit in `components/ui/`: Button (magnetic), Input, Textarea, Badge (Verified / Unverified / Indicative), Card, Toast, Skeleton, with focus and error states | `[x]` Collins |
| FE-C-03 | P0 | Motion kit in `components/motion/`: Reveal, SplitLines, Odometer, ScrollChapter (colour shifts), reduced-motion and Save-Data parity | `[x]` Collins |
| FE-C-04 | P1 | Landing page sections 1 to 8 per `DESIGN.md` 7.1, replacing the current single-page section stack. Delete components that become unused | `[x]` Collins |
| FE-C-05 | P1 | **The Crossing** signature sequence: pinned scroll, `82/84` to `4.0` odometer, drawn flight route, docked phone. Static fallback | `[x]` Collins |
| FE-C-06 | P0 | USSD simulator rebuild: numeric keypad only (digits, `*`, `#`), 182-char counter, request-log drawer, SMS toast, quick-test chips with numeric paths, live calls to `/api/at/ussd` | `[x]` Collins |
| FE-C-07 | P2 | 404 page, global error page, offline banner, `lang`/`strings.ts` scaffolding for Kiswahili | `[x]` Collins |
| FE-C-08 | P1 | Performance pass: Lighthouse 90+, LCP under 2.5s on Slow 4G, JS under 170 KB, test on a real low-end Android | `[/]` Collins |

**Collins status notes (2026-10-29)**

- FE-C-01 to FE-C-07 are done and verified in a real browser (desktop 1440 and mobile 390): no console errors, no horizontal overflow, reduced-motion parity (static Crossing, nothing left hidden), simulator rejects letters, request log shows the raw POST, offline banner, skip link and keyboard.
- FE-C-08 is **in progress, one item left: a test on a real low-end Android.** Measured on a production build with Lighthouse (mobile, Slow 4G, 4x CPU): Performance 100, Accessibility 100, Best Practices 100, SEO 100, LCP 0.8s, CLS 0.005, TBT 0ms. First Load JS is 136 kB against the 170 kB budget.
- **Direction change:** DESIGN.md was revised to an Apple-grade look (Geist, ink/snow/paper, murram and saffron accents). Use the chapter tokens (`bg-bg`, `text-fg`, `text-fg2`, `bg-accent`, `border-line`, `bg-surface`) and the UI kit in `components/ui`; do not use raw hex. Wrap dashboard sections in `<ScrollChapter chapter="...">` only if you want chapter colours; otherwise set `data-chapter="light"` on your layout root.
- Landing calls to action point at on-page anchors (`#phone`, `#tools`) because `/dashboard` does not exist yet. When FE-S-01 ships, change the hero button and the nav button to `/dashboard`.
- The hero phone is a scripted demo of the **target** menu in section 7. The simulator further down calls the **live** route, which still serves the old menu until BE-AT-02 ships, so the two differ for now.
- `lib/kcse-scale.ts` and `lib/fixtures/essays.ts` are offline copies of seed data for the landing page. Keep them in sync with `seed_02_modules.sql`, or replace them with API calls (BE-API-02, BE-API-04).
- Open checks for Sandra: use `Input`, `Textarea` (with `wordLimit`), `Badge kind="unverified"`, `Skeleton` and `useToast()` from the kit so the dashboard matches.

### 6.2 Sandra: dashboard and modules

| ID | P | Task | Depends on | Status |
|---|---|---|---|---|
| FE-S-01 | P0 | Dashboard shell: `/dashboard` layout, left rail (desktop) and bottom tabs (phone), phone-number sign-in (OTP is out of scope for the MVP, see section 12), student session | FE-C-01, FE-C-02 | `[/]` Sandra |
| FE-S-02 | P0 | Student Context UI `/dashboard/context`: profile editor, facts list with delete, consent, per-channel conversation history, "what Gemini sees" disclosure | BE-API-01 | `[/]` Sandra |
| FE-S-03 | P0 | GPA Converter `/dashboard/gpa`: grade selector, points slider, monumental result, "indicative" badge | BE-API-02 | `[/]` Sandra |
| FE-S-04 | P1 | Application Guide `/dashboard/guide`: 12-step stepper by phase, mark done, cost and time chips | BE-API-03 | `[/]` Sandra |
| FE-S-05 | P0 | Essays `/dashboard/essays`: **type picker, then school and prompt picker (for school-specific types), then editor with live word count**, review panel with rubric bars and line edits, version timeline at `/dashboard/essays/[id]` | BE-API-04, 05, 06 | `[/]` Sandra |
| FE-S-06 | P1 | LOR Review `/dashboard/lor`: form, four-axis score, gaps and "what to add about Kenya" | BE-API-07 | `[/]` Sandra |
| FE-S-07 | P1 | University Advisory `/dashboard/advisor`: reach/target/likely columns, aid outlook chips, question box, unverified badges | BE-API-08 | `[/]` Sandra |
| FE-S-08 | P1 | Financial Aid Scout `/dashboard/aid`: ranked programs, forms and deadlines, official links | BE-API-09 | `[/]` Sandra |
| FE-S-09 | P1 | Dashboard home: next-deadline countdown, guide progress ring, asymmetric module grid, designed empty states | FE-S-03 to 08 | `[/]` Sandra |
| FE-S-10 | P2 | Realtime: subscribe to `essay_versions`, `lor_reviews`, `conversation_messages` for the signed-in student | BE-DB-01 | `[ ]` |
| FE-S-11 | P2 | WhatsApp transcript view inside the context page | BE-API-10 | `[ ]` |
| FE-S-12 | P1 | **Converge the two UI kits.** The dashboard has its own kit in `components/dashboard/ui/` (Button, Card, Badge, Input, Textarea) with different prop names from `components/ui/`. Move the dashboard onto `components/ui/` and the chapter tokens (`bg-bg`, `text-fg`, `bg-accent`), then delete `components/dashboard/ui/` and the legacy aliases in `tailwind.config.ts` (`ink-surface`, `bone`, `acacia`, ...) | FE-S-01 to 09 | `[x]` Sandra |

**Sandra status notes (scaffold merged via PR #4, 2026-10-29; logged here by Claude because the merge dropped the log)**

- Built: dashboard shell and nav (`app/dashboard/layout.tsx`, `components/dashboard/DashboardNav.tsx`), phone-number session (`lib/session-context.tsx`, stored in localStorage, no OTP yet), and pages for overview, GPA, guide, essays, LOR, advisor, aid and context, all running on typed fixtures in `lib/fixtures/index.ts`.
- Why FE-S-01 to FE-S-09 are `[/]` and not `[x]`: they are scaffolds on mock data. Nothing calls an API yet (the BE routes are not built), the essay flow still needs the type then school then prompt gating checked against `ESSAY_CATALOG`, and no tests exist. Mark each `[x]` when it runs against its BE route.
- On the 2026-10-29 merge fix (below), the dashboard now builds, typechecks and renders in the shared palette (checked in Chrome at 1440 and 390 wide, no console errors).
- Sandra: please read section 12, item 6 and the new rule 9, then pull `master` before your next change.

**Merge fix, 2026-10-29 (Collins, with Claude)**

PR #4 merged cleanly in git but left `master` broken. What was wrong and what changed:

1. *Filename case collision.* Sandra's kit was added as `components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx`, `Textarea.tsx` next to Collins's `button.tsx`, `card.tsx`, and so on. Git on Windows (`core.ignorecase=true`) did not flag it, but Windows could hold only one file per name, so the two kits overwrote each other and TypeScript reported casing errors. Fix: Sandra's kit moved to `components/dashboard/ui/`, and her imports updated. `components/ui/` is Collins's kit only.
2. *Design tokens lost in the merge.* Sandra's branch added `ink-surface`, `bone`, `acacia`, `saffron-light`, `murram-light` and a Fraunces font to `tailwind.config.ts` and `app/globals.css`. The conflict was resolved by keeping Collins's Apple-grade config and dropping hers, so the dashboard had no colours. Fix: those names are kept as aliases, re-pointed onto the new palette (`bone` is snow, `ink-surface` is graphite, and so on), `font-display`, `font-editorial` and `font-fraunces` all map to Geist, and the missing `fade-in` animation and `duration-160/240` were added.
3. *Mock review data did not match the contract.* Her essay and LOR fixtures used field names that are not in `lib/types.ts` (`originalText`, `explanation`, `kenyanContextGaps`, `scores`, `whatToAddAboutKenya`) and a verdict that does not exist (`Competitive`), and lacked required fields. `next build` failed on 17 type errors. Fix: the fixtures and the two pages now follow the contract (`original`, `issue`, `kenyanContextTips` as one tip per line, `rubricScores`, `kenyaContextToAdd`, verdict `Needs Specifics`). The contract itself did not change except for one doc comment.
4. *`AGENTS.md` was never updated for the dashboard.* Her commit did not touch it, and the merge kept only Collins's version. Her work is logged in section 11 below.

**Dashboard premium rework (2026-10-29, requested by Sandra, done with Claude)**

- Rebuilt the shell and all eight dashboard pages on one design system. New kit in `components/dashboard/`: `PageHero`, `Panel`, `Stat`, `ProgressRing`, `Meter`, `Segmented`, `EmptyState`, plus a rebuilt `DashboardNav` and `app/dashboard/template.tsx` (route transition). Design rules are in `DESIGN.md` 7.2 and 7.3.
- Statuses are unchanged on purpose: FE-S-01 to FE-S-09 stay `[/]` because the pages still run on fixtures and no BE route exists. The UI work is finished; the remaining work is wiring each page to its API and writing tests.
- Verified on a production build: `tsc` clean, `next build` passes (each dashboard page 128 to 139 kB first-load JS), Lighthouse mobile 100 / 100 / 100 on the overview and essays pages (LCP 0.8s, CLS 0 to 0.002), accessibility 100 on all four pages measured. all 43 scripted interaction checks pass (two essay checks were re-run after correcting the test script's own selector) (GPA bands and slider, essay type then school then prompt gating, word limit and real autosave, guide progress and numbering, advisor and context actions, nav and dialogs, phone menu, reduced motion on every page). The landing page's 14 checks still pass.
- Honesty fixes made along the way: the essays page said "Autosaved to local memory" but saved nothing (it now really saves, one draft per essay and prompt); the advisor mock answer promised a "$0" family contribution, which breaks the no-guarantee rule (reworded, labelled "Sample answers"); reviews are labelled "Sample review" until BE-API-05 and BE-API-07 ship.
- Behaviour changes to know about: the overview's deadline is computed from the real clock instead of a hard-coded "3 days"; the guide numbers steps 1 to 12 in reading order (the fixture's `order` field jumps between phases, and the fixture has no "Decide" step); "Why This School" has no prompts in the fixtures, so that essay type correctly shows "No school on your list asks this essay yet".
- Not changed: the dashboard still identifies students by phone number from fixtures and localStorage (see section 12, item 3).

### 6.3 Frontend tests

| ID | P | Owner | Test | Status |
|---|---|---|---|---|
| FE-TEST-01 | P1 | Collins | USSD simulator: rejects letters, renders `CON`/`END`, shows the 182-char counter, handles gateway timeout | `[ ]` |
| FE-TEST-02 | P1 | Sandra | Essay flow: school-specific type requires a school and prompt before the editor unlocks; word-limit state at under, near, over | `[ ]` |
| FE-TEST-03 | P1 | Both | Accessibility: keyboard-only walkthrough of landing and every dashboard page, axe scan with zero serious violations | `[ ]` |
| FE-TEST-04 | P1 | Both | `prefers-reduced-motion` and Save-Data show identical content without pins or odometers | `[ ]` |
| FE-TEST-05 | P2 | Both | Playwright smoke: landing loads, dial in simulator, sign in, run a GPA conversion, submit an essay draft (against the stubbed API) | `[ ]` |

---

## 7. USSD numeric menu tree (implement exactly; extend only by editing this table)

Dial `*384*73732#`. Every answer is digits. `0` is always Back, `00` is always Home on submenus. Screens are 182 characters or fewer.

```
(root)  Karibu Pepea
  1. Apply guide        -> list steps (paged, 4 per screen, 8 = Next) -> N: step summary + "1. Done 0. Back"
  2. KCSE to US GPA     -> grade list (codes 1-12 from kcse_grade_scale, paged) -> result + SMS
  3. Colleges for me    -> needs profile (grade, major code) -> up to 3 matches -> "1. SMS me the list"
  4. Financial aid      -> 1. Full aid needed  2. Partial  -> top 3 programs -> "1. SMS me the list"
  5. Essays             -> 1. Essay types (codes from essay_types) -> tips + SMS
                           2. Schools (paged list) -> prompts for that school -> SMS
  6. Deadlines          -> next 3 deadlines for my list
  7. My profile         -> 1. Set KCSE grade  2. Set major (code)  3. Aid need  4. Get WhatsApp link
  8. Verify agency      -> numbered CUE list (paged) -> detail  (replaces free-text search)
  9. More               -> 1. Mock interview call  2. Help
```

Notes: LOR review needs long text, so USSD only explains it and offers a WhatsApp link (`7 > 4`). Major codes: Computer Science 1, Engineering 2, Medicine and Health 3, Business 4, Sciences 5, Arts and Humanities 6, Other 7. Do not exceed one network round trip per screen.

---

## 8. API summary (details in `lib/types.ts`)

| Route | Method | Request | Response |
|---|---|---|---|
| `/api/students`, `/api/students/me` | POST, GET | `UpsertStudentRequest` | `UpsertStudentResponse` |
| `/api/gpa` | POST | `GpaConvertRequest` | `GpaConvertResponse` |
| `/api/guide`, `/api/guide/progress` | GET, POST | `GuideProgressRequest` | `GuideResponse` |
| `/api/advisor` | POST | `AdvisorRequest` | `AdvisorResponse` |
| `/api/aid` | POST | `AidScoutRequest` | `AidScoutResponse` |
| `/api/essays/catalog` | GET | query | `EssayCatalogResponse` |
| `/api/essays/review` | POST | `EssayReviewRequest` | `EssayReviewResponse` |
| `/api/lor/review` | POST | `LorReviewRequest` | `LorReviewResponse` |
| `/api/chat` | POST | `ChatRequest` | `ChatResponse` |
| `/api/at/ussd`, `/api/at/sms`, `/api/at/whatsapp`, `/api/at/voice` | POST | Africa's Talking webhooks | `CON`/`END` text, JSON, or voice XML |
| `/api/health` | GET | none | service status |

---

## 9. End-to-end MVP review

### 9.1 Findings from reading the existing code (to fix, owner in brackets)

1. `app/api/at/ussd/route.ts` upserts `full_name: 'KCSE Applicant'` on every GPA flow, overwriting a real name. [Geoffrey, BE-API-01 and BE-AT-02]
2. USSD grade input silently falls back to `A-` for any bad digit (`gradeMap[steps[1]] || gradeMap['2']`). It should re-prompt. [Geoffrey, BE-AT-02]
3. The CUE check uses free text and a substring match on in-memory mock data, which breaks the numeric-only rule and cannot match misspellings. [Geoffrey, BE-AT-02, BE-API-11]
4. `app/api/at/whatsapp/route.ts` returns the reply in the HTTP response instead of sending it through AT, and hard-codes a fallback number. [Esther, BE-AT-04]
5. `app/api/ao/review/route.ts` uses `gemini-1.5-flash` with an inline prompt, a hard-coded mock fallback that returns a fake score on any error, and accepts any `phoneNumber` to send an SMS, so anyone can trigger SMS cost to any number. [Esther, BE-AI-01, BE-API-05, BE-LIB-04]
6. No webhook authentication on any `/api/at/*` route. [Geoffrey, BE-LIB-06]
7. `lib/at-supabase.ts` silently falls back to a demo Supabase URL and to mock SMS and voice. In production this hides failures. [Geoffrey, BE-DB-04, BE-AT-07]
8. `process-interview` returns a hard-coded transcript and score of 88 regardless of what the student said. [Geoffrey, BE-AT-06]
9. `.env.local` exists in the working folder. Confirm it is git-ignored and rotate any keys that were ever committed. [Collins]
10. The old `universities.supplemental_prompts` JSONB duplicates `school_essay_prompts`. Stop reading it once BE-API-04 ships. [Esther]
11. Fee-waiver eligibility, visa fees and aid terms in the seed are unverified. [Esther, BE-DB-05]
12. **`/api/at/sms` has an open relay:** the "Direct API send request" branch sends any `message` to any `phoneNumber` for any caller, with no auth. Remove it or put it behind server-only auth and rate limits before the endpoint is public. [Geoffrey, BE-LIB-04, BE-LIB-06, BE-AT-03]

### 9.2 Gate checklist (all must pass before the demo)

- [ ] Dial `*384*73732#` from a real phone on the AT sandbox (or the simulator against the deployed URL) and complete every branch of section 7.
- [ ] A student who starts a GPA conversion on USSD sees the same grade on the web dashboard and in WhatsApp.
- [ ] WhatsApp round trip: student message in, Gemini reply out within 10 seconds, delivered to the handset.
- [ ] Essay review for one school-specific and one common essay, with correct rubric per type and a correct word-limit message.
- [ ] LOR review returns structured feedback and never writes the letter.
- [ ] Advisor and Aid name only database rows; an unverified row is labelled "Unverified" in UI and WhatsApp.
- [ ] Kill the Gemini key: every route returns a clear error (no fake scores). Kill the network: the offline banner and draft autosave work.
- [ ] Secrets scan of the repo and the build output. No service-role key in client bundles.
- [ ] Rate limits and webhook secrets verified from outside.
- [ ] Lighthouse mobile 90+ on the landing page; keyboard-only pass.
- [ ] 3-minute pitch rehearsed twice, with a fallback plan (`NEXT_PUBLIC_DEMO_MODE=true`) if venue Wi-Fi fails. The demo mode banner must be visible when active.

---

## 10. Prompt and heuristic registry

| ID | Version | Location | Purpose | Constraints |
|---|---|---|---|---|
| `PEPEA_SYSTEM` | `PEPEA_SYSTEM_V1` | `lib/prompts/system-prompt.ts` | Core persona plus per-module addenda (context, gpa, guide, advisor, aid, essay, lor, cue, interview) | No guarantees, no invented school data, no money requests, never writes essays or letters, channel length limits, JSON-only when asked |
| `KCSE_GPA_HEURISTIC` | `pepea_heuristic_v1` | `kcse_grade_scale` table | Indicative KCSE to 4.0 mapping | Not an official evaluation; must be labelled indicative |

Add a row for every new prompt or heuristic and bump the version string on any edit.

---

## 11. File change and mutation log

| Date | Author | Action | File | Summary |
|---|---|---|---|---|
| 2026-10-29 | Claude (for Collins) | DELETE | `app/api/at/voice/process-teacher-rec/route.ts` | Teacher recommendation voice flow removed |
| 2026-10-29 | Claude (for Collins) | DELETE | `app/api/at/voice/branch/route.ts` | IVR branch removed; only the mock interview remains |
| 2026-10-29 | Claude (for Collins) | MODIFY | `app/api/at/voice/route.ts` | Goes straight to the mock interview question |
| 2026-10-29 | Claude (for Collins) | MODIFY | `app/api/at/ussd/route.ts` | Removed teacher-rec branch, renumbered branches, uses numeric dial code |
| 2026-10-29 | Claude (for Collins) | MODIFY | `components/VoiceStudio.tsx` | Mock interview only; section id is now `mock-interview` |
| 2026-10-29 | Claude (for Collins) | MODIFY | `components/Navbar.tsx`, `HeroBanner.tsx`, `Footer.tsx`, `USSDPhoneSimulator.tsx` | Numeric dial code, removed teacher-rec copy and SMS simulation |
| 2026-10-29 | Claude (for Collins) | MODIFY | `app/api/at/sms/route.ts` | Welcome SMS uses the numeric dial code |
| 2026-10-29 | Claude (for Collins) | MODIFY | `app/layout.tsx`, `app/page.tsx`, `.env.example` | Copy updates |
| 2026-10-29 | Claude (for Collins) | MODIFY | `supabase/migrations/01_pepea_schema.sql` | `voice_sessions.session_type` allows only `mock_interview` |
| 2026-10-29 | Claude (for Collins) | CREATE | `lib/constants.ts` | `USSD_SERVICE_CODE = '*384*73732#'` |
| 2026-10-29 | Claude (for Collins) | CREATE | `supabase/migrations/02_pepea_modules.sql` | Tables for the six modules, essay types and school prompts, RLS |
| 2026-10-29 | Claude (for Collins) | CREATE | `supabase/seed_02_modules.sql` | KCSE scale, essay types, school prompts, guide steps, aid programs (unverified) |
| 2026-10-29 | Claude (for Collins) | CREATE | `lib/types.ts` | Shared types and API contracts |
| 2026-10-29 | Claude (for Collins) | CREATE | `lib/prompts/system-prompt.ts` | `PEPEA_SYSTEM_V1` |
| 2026-10-29 | Claude (for Collins) | CREATE | `DESIGN.md` | Design system and storyboard |
| 2026-10-29 | Claude (for Collins) | REWRITE | `AGENTS.md`, `README.md` | Task board and updated project description |
| 2026-10-29 | Claude (for Collins) | CREATE | `package.json`, `package-lock.json` | Added `geist` (font) and `lenis` (smooth scroll) |
| 2026-10-29 | Claude (for Collins) | REWRITE | `tailwind.config.ts`, `app/globals.css` | Apple-grade tokens: palette, chapter variables, fluid type scale, easing, keyframes (FE-C-01) |
| 2026-10-29 | Claude (for Collins) | REWRITE | `app/layout.tsx`, `app/page.tsx` | Geist fonts, providers, skip link, noscript fallback; landing assembled from eight chapters |
| 2026-10-29 | Claude (for Collins) | CREATE | `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`, `app/icon.svg` | 404 with a route that stops mid-ocean, error boundaries, favicon (FE-C-07) |
| 2026-10-29 | Claude (for Collins) | CREATE | `components/ui/*` (button, input, textarea, badge, card, toast, skeleton) | UI kit (FE-C-02) |
| 2026-10-29 | Claude (for Collins) | CREATE | `components/motion/*` (reveal, split-lines, odometer, scroll-chapter, magnetic, smooth-scroll, motion-provider, use-motion-prefs) | Motion kit with reduced-motion and Save-Data parity (FE-C-03) |
| 2026-10-29 | Claude (for Collins) | CREATE | `components/landing/*` (nav, hero, hero-phone, countdown, crossing, route-arc, tools, gpa-card, ussd-section, essays-section, cue-radar, proof, footer, offline-banner) | Landing page and The Crossing (FE-C-04, FE-C-05, FE-C-07) |
| 2026-10-29 | Claude (for Collins) | CREATE | `components/ussd/phone.tsx`, `components/ussd/simulator.tsx` | Numeric-only USSD simulator wired to `/api/at/ussd`, request log, 182-character counter (FE-C-06) |
| 2026-10-29 | Claude (for Collins) | CREATE | `lib/utils.ts`, `lib/motion.ts`, `lib/strings.ts`, `lib/kcse-scale.ts`, `lib/fixtures/essays.ts` | Helpers, motion tokens, en/sw strings, offline copies of seed data |
| 2026-10-29 | Claude (for Collins) | DELETE | `components/AOReviewStudio.tsx`, `CUERadar.tsx`, `CollegeMatcher.tsx`, `Footer.tsx`, `HeroBanner.tsx`, `Navbar.tsx`, `USSDPhoneSimulator.tsx`, `VoiceStudio.tsx` | Replaced by the new landing components. The essay review UI is now Sandra's FE-S-05; the mock interview voice flow stays on the backend (`/api/at/voice`) with no landing section |
| 2026-10-29 | Claude (for Collins) | MODIFY | `DESIGN.md` | Revised to the Apple-grade direction; sections 3, 4, 7.1 and 12 updated to match what is built |
| 2026-10-29 | Geoffrey | CREATE | `lib/phone.ts` | Kenyan phone normalizer to E.164 (BE-LIB-01) |
| 2026-10-29 | Geoffrey | MODIFY | `lib/at-supabase.ts` | Strict live-mode key validation; throws if missing (BE-DB-04) |
| 2026-10-29 | Geoffrey | CREATE | `lib/db/` | Typed DB query helpers: client, students, gpa, guide, essays, lor, advisor, aid, chat, facts, cue, index (BE-DB-03, BE-DB-07) |
| 2026-10-29 | Geoffrey | CREATE | `scripts/verify-rls.ts` | Row Level Security verification test script (BE-DB-02) |
| 2026-10-29 | Geoffrey | CREATE | `lib/student-context.ts` | Multi-module student context builder (BE-LIB-02) |
| 2026-10-29 | Esther / Geoffrey | CREATE | `lib/gemini.ts` | Gemini 2.5 Flash caller with 8s timeout, retry, typed errors, prompt injection hardening (BE-LIB-03) |
| 2026-10-29 | Geoffrey | CREATE | `lib/rate-limit.ts` | In-memory phone and IP rate limiter (BE-LIB-04) |
| 2026-10-29 | Geoffrey | CREATE | `lib/at.ts` | Africa Talking client for SMS, WhatsApp, Voice with live error handling (BE-LIB-05) |
| 2026-10-29 | Geoffrey | CREATE | `lib/webhook-auth.ts` | Constant-time webhook secret check and IP allowlist (BE-LIB-06) |
| 2026-10-29 | Esther | MODIFY | `supabase/seed_02_modules.sql` | Verified KNEC KCSE scale, 12 guide steps (<=160 chars), 22 aid programs, 15 top universities, and 39 2026-27 essay prompts with data_verified_at = '2026-10-29' (BE-DB-05, BE-DB-06) |
| 2026-10-29 | Esther | MODIFY | `supabase/migrations/01_pepea_schema.sql`, `02_pepea_modules.sql`, `seed.sql` | Idempotent unique indexes on universities, aid_programs, and flagged_agencies (BE-DB-05, BE-DB-06) |
| 2026-10-29 | Esther | MODIFY | `lib/types.ts` | Added dataVerifiedAt to GuideStep interface (BE-DB-05) |
| 2026-10-29 | Geoffrey | CREATE | `app/api/students/route.ts`, `app/api/students/me/route.ts` | Profile upsert & read, phone normalization, prevents default field overwrite (BE-API-01) |
| 2026-10-29 | Geoffrey | CREATE | `app/api/gpa/route.ts` | Indicative KCSE-to-GPA conversion via grade, points (7-84), or subjects, with full scale GET (BE-API-02) |
| 2026-10-29 | Esther / Geoffrey | CREATE | `app/api/essays/review/route.ts` | Versioned essay draft review with Gemini 2.5 Flash, rubric scoring, and conversation logging (BE-API-05) |
| 2026-10-29 | Geoffrey | CREATE | `app/api/guide/route.ts`, `app/api/guide/progress/route.ts` | 12-step application guide with per-student status and idempotent progress updates (BE-API-03) |
| 2026-10-29 | Esther | CREATE | `app/api/essays/catalog/route.ts` | Essay types and per-school prompts catalog grouped by university (BE-API-04) |
| 2026-10-29 | Esther | CREATE | `app/api/essays/route.ts`, `app/api/essays/[id]/route.ts` | Student essays list, version timeline, latest review, privacy enforcement (BE-API-06) |
| 2026-10-29 | Esther | CREATE | `app/api/lor/review/route.ts` | LOR recommendation letter review with Gemini 2.5 Flash, rubric scoring, and Kenya context tips (BE-API-07) |
| 2026-10-29 | Esther | CREATE | `app/api/advisor/route.ts` | University advisory matching into reach/target/likely with grounded Gemini explanation (BE-API-08) |
| 2026-10-29 | Esther | CREATE | `app/api/aid/route.ts` | Financial aid scout matching verified aid programs and fee waivers with fit scoring (BE-API-09) |
| 2026-10-29 | Esther | CREATE | `app/api/chat/route.ts` | Multi-channel chat router with 9-module intent classification, context building, and quick replies (BE-API-10) |
| 2026-10-29 | Geoffrey | CREATE | `app/api/cue/route.ts` | CUE blacklist radar querying flagged_agencies with safety advisory (BE-API-11) |
| 2026-10-29 | Team | CREATE | `scripts/test-api-routes.ts` | 62-assertion automated end-to-end integration test suite for all P1 & P2 API routes |
| 2026-10-29 | Sandra (logged by Claude) | CREATE | `app/dashboard/layout.tsx`, `app/dashboard/page.tsx` | Dashboard shell and overview (FE-S-01, FE-S-09), on fixtures |
| 2026-10-29 | Sandra (logged by Claude) | CREATE | `app/dashboard/gpa/page.tsx`, `guide/page.tsx`, `essays/page.tsx`, `lor/page.tsx`, `advisor/page.tsx`, `aid/page.tsx`, `context/page.tsx` | Module pages (FE-S-02 to FE-S-08), on fixtures |
| 2026-10-29 | Sandra (logged by Claude) | CREATE | `components/dashboard/DashboardNav.tsx`, `lib/session-context.tsx`, `lib/fixtures/index.ts` | Dashboard navigation, phone-number session, typed fixtures |
| 2026-10-29 | Sandra (logged by Claude) | CREATE | `components/dashboard/ui/{Badge,Button,Card,Input,Textarea}.tsx` | Dashboard UI kit (first pushed as `components/ui/*`; moved by the merge fix) |
| 2026-10-29 | Claude (for Collins) | MODIFY | `tailwind.config.ts`, `app/globals.css` | Merge fix: restored the dashboard colour and font names as aliases on the Apple-grade palette; added `fade-in`, `duration-160/240` |
| 2026-10-29 | Claude (for Collins) | MODIFY | `app/dashboard/*/page.tsx`, `app/dashboard/page.tsx` | Merge fix: imports now point at `components/dashboard/ui/` |
| 2026-10-29 | Claude (for Collins) | MODIFY | `lib/fixtures/index.ts`, `app/dashboard/essays/page.tsx`, `app/dashboard/lor/page.tsx` | Merge fix: review mocks and the two pages conformed to `lib/types.ts` |
| 2026-10-29 | Claude (for Collins) | MODIFY | `components/ui/{badge,button,card,input,textarea}.tsx` | Merge fix: restored Collins's kit under lowercase names; removed the capitalised duplicates from the index |
| 2026-10-29 | Claude (for Collins) | MODIFY | `lib/types.ts` | Doc comment: `kenyanContextTips` is one tip per line |
| 2026-10-29 | Claude (for Collins) | MODIFY | `AGENTS.md` | Rule 9, FE-S statuses, FE-S-12, merge-fix notes, open items |
| 2026-10-29 | Sandra | CONVERGE | `components/ui/*`, `app/dashboard/*` | FE-S-12 complete: converged all dashboard modules onto canonical components/ui/ and chapter tokens, deleted components/dashboard/ui/, linked landing CTAs to /dashboard |
| 2026-10-29 | Geoffrey | MODIFY | `app/api/at/ussd/route.ts` | Complete DB-driven numeric USSD tree: pagination (8=Next, 0=Back, 00=Home), screens <= 182 chars, no Gemini, re-prompts on bad input (BE-AT-02) |
| 2026-10-29 | Geoffrey | CREATE | `lib/sms-templates.ts` | SMS templates <= 160 chars for GPA, deadlines, guide steps, essays, interview score (BE-AT-03) |
| 2026-10-29 | Geoffrey | CREATE | `app/api/at/sms/delivery/route.ts` | Africa's Talking SMS delivery report webhook with secret check (BE-AT-03) |
| 2026-10-29 | Geoffrey | MODIFY | `app/api/at/sms/route.ts` | Removed open relay; authenticated outbound SMS and verified inbound webhook with per-phone/per-IP rate limits (BE-AT-03) |
| 2026-10-29 | Geoffrey | MODIFY | `app/api/at/voice/process-interview/route.ts` | Real audio callback scoring with Gemini 2.5 Flash, personalized context, and SMS delivery (BE-AT-06) |
| 2026-10-29 | Geoffrey | CREATE | `app/api/health/route.ts` | Health check route reporting database, Gemini, and Africa's Talking reachability (BE-AT-07) |
| 2026-10-29 | Geoffrey | CREATE | `scripts/test-at-integration.ts` | 36-assertion automated integration test suite for Section 5.4 AT flows |
| 2026-10-29 | Sandra and Claude | CREATE | `components/dashboard/{page-hero,panel,stat,progress-ring,meter,segmented,empty-state}.tsx` | Dashboard design kit |
| 2026-10-29 | Sandra and Claude | REWRITE | `components/dashboard/DashboardNav.tsx`, `app/dashboard/layout.tsx` | New shell: student card with progress ring, grouped rail, tap-to-copy USSD code, frosted phone bar, tab bar, full-screen menu, accessible dialogs |
| 2026-10-29 | Sandra and Claude | CREATE | `app/dashboard/template.tsx` | Route transition (transform only) |
| 2026-10-29 | Sandra and Claude | REWRITE | `app/dashboard/page.tsx`, `gpa/page.tsx`, `guide/page.tsx`, `essays/page.tsx`, `lor/page.tsx`, `advisor/page.tsx`, `aid/page.tsx`, `context/page.tsx` | All eight pages rebuilt on the kit; real autosave, real-clock deadline, honest sample labels |
| 2026-10-29 | Sandra and Claude | CREATE | `components/ui/mark.tsx` | Brand mark moved out of the landing nav so the dashboard does not import landing code |
| 2026-10-29 | Sandra and Claude | MODIFY | `components/ui/input.tsx`, `components/ui/textarea.tsx` | Sentence-case 14px labels, readable hints and errors, softer fields, higher-contrast placeholder |
| 2026-10-29 | Sandra and Claude | MODIFY | `lib/utils.ts` | `cn()` now knows the custom font-size tokens (`text-stat`, `text-micro`, ...). Before, tailwind-merge dropped them whenever a colour class followed, which silently shrank type and badges app-wide |
| 2026-10-29 | Sandra and Claude | MODIFY | `tailwind.config.ts`, `app/globals.css` | `text-dash` and `text-stat` sizes, `dash-ambient`, `dash-enter`, `panel-edge`, styled range slider |
| 2026-10-29 | Sandra and Claude | MODIFY | `app/not-found.tsx`, `app/error.tsx`, `components/landing/nav.tsx` | Import `Mark` from its own module |
| 2026-10-29 | Sandra and Claude | MODIFY | `AGENTS.md`, `DESIGN.md` | Dashboard rework notes and design system (7.2, 7.3), file log |
| 2026-10-29 | Antigravity | MODIFY | `package.json` | Resolved git merge conflict markers in dependencies (kept both geist/lenis and zod/tailwind-merge) |

---

## 12. Open items and blockers

1. **USSD code:** `*384*73732#` is a placeholder in the correct numeric form. AT assigns the real code per channel; confirm and update `lib/constants.ts`. (Geoffrey, BE-AT-01)
2. **WhatsApp live access:** confirm what AT requires for a live WhatsApp number (business approval, templates, sandbox limits) and the send API format. If live is not possible before the demo, say so here and the demo shows the sandbox number. (Esther, BE-AT-04)
3. **Authentication:** the MVP identifies students by phone number. Without OTP, anyone who knows a number can open that student's dashboard. Decide before launch: SMS OTP via AT (recommended) or accept this for a closed demo only. (Team)
4. **Verified data:** Verified on 2026-10-29 (BE-DB-05 & BE-DB-06 done; all 15 schools, 39 prompts, 12 guide steps, and 22 aid programs verified).
5. **Kiswahili:** designed for, not translated.
6. **Merge incident (2026-10-29): what to do differently.** PR #4 merged with no textual conflict markers and still broke `master` (case-colliding filenames, dropped design tokens, 17 type errors, no `AGENTS.md` update). A clean git merge is not proof that the app works. Before any push to `master`: `git pull`, `npx tsc --noEmit`, `npx next build`. (Team)
7. **Converged UI kit (FE-S-12 done).** `components/ui/` is now the single unified kit across landing and dashboard. `components/dashboard/ui/` has been removed. (Sandra)
8. **Duplicate fixtures.** `lib/fixtures/essays.ts` (landing) and `lib/fixtures/index.ts` (dashboard) both describe essay types and schools. Consolidate when the API routes replace them (BE-API-04). (Sandra, Collins)
9. **Dev server shows tiny headings (stale CSS).** After many hot reloads, `next dev` can stop emitting a custom class such as `text-dash`, so titles render at 16px. It is a dev cache problem, not a code bug: stop the server, delete `.next` and start again. A production build (`next build`) is unaffected, so judge visuals on a production build. (Everyone)
10. **Interaction tests are not in the repo yet.** The 43 dashboard checks and 14 landing checks were run with puppeteer from a temporary folder. FE-TEST-01 to FE-TEST-05 are still open as committed tests; the scripts cover the cases and can be ported to Playwright. (Sandra, Collins)
