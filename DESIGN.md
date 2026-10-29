# Pepea (Ng'ambo) Design System

Target: Awwwards-level craft (rubric score 9-10) that still runs on a mid-range Android on a 3G connection in Kitui.
Owners: Collins (design system, landing, USSD simulator) and Sandra (dashboard, module interfaces).
Status: spec only. Nothing here is implemented yet. Build against it and update it when a decision changes.

---

## 1. Concept

**Brand essence: Crossing.** *Ng'ambo* means "the other side" in Swahili. Every screen is about moving a student across: from KCSE to a US GPA, from a feature phone to an Ivy League portal, from a scam agency to a free official route.

**Visual tension:** the humble and the elite. A green-phosphor USSD screen on a 2G phone sits beside editorial serif typography worthy of a university press. Neither is allowed to feel like the "lesser" one; the phone is treated as the hero object.

**Signature moment: "The Crossing."** A pinned scroll sequence on the landing page.
1. A monumental KCSE result, `A  82/84`, fills the viewport in Fraunces.
2. As the user scrolls, each digit rolls (odometer style, transform only) and resolves into `4.0`.
3. In the same scroll, a dotted flight line (the 1959-63 Kennedy-Mboya Airlift route) draws from Nairobi to Cambridge, MA as an SVG stroke-dashoffset animation.
4. The USSD phone docks in from the right and types the numeric dial code `*384*73732#` live.
Screenshot test: the frame where `82/84` is halfway to `4.0` with the arc mid-Atlantic.

**Technical ambition:** weighted smooth scroll, SVG path drawing and typographic odometers, all on `transform` and `opacity`, with a no-JS and data-saver fallback. No WebGL, no video, no heavy images.

**Voice and tone:** direct, warm, honest. Never pity, never "empower". Numbers over adjectives.

---

## 2. Principles

1. Typography is the design. The headline is the hero image.
2. Phone first, data-light. Design at 360px, then scale up. The first view must work on a 2G-grade connection.
3. Honesty in the interface. Unverified data is visibly marked. Indicative numbers say "indicative".
4. Every motion answers "why does this move?" or it is deleted.
5. Accessible by default: AA contrast, keyboard, reduced motion, screen readers.
6. No emoji in the UI. Use typographic marks and custom SVG icons.

---

## 3. Typography

| Role | Family | Use |
|---|---|---|
| Display | **Fraunces** (variable: `opsz` 9-144, `SOFT` 0-100, `wght` 100-900) | Headlines, big numerals, essay titles |
| UI / body | **Space Grotesk** (variable) | Interface text, forms, paragraphs |
| Data / USSD | **JetBrains Mono** | Codes, scores, the phone screen, hashes of IDs |

Load with `next/font/google`, `display: 'swap'`, `subsets: ['latin']`, only the axes used. Preload Fraunces and Space Grotesk. Total font payload budget: 120 KB.

Never use Inter, Roboto, Arial or `system-ui` as the primary face.

### Scale (fluid, 10:1 or more between display and body)

```css
--step--1: clamp(0.78rem, 0.76rem + 0.1vw, 0.85rem);   /* labels, mono captions */
--step-0:  clamp(1rem, 0.96rem + 0.2vw, 1.125rem);     /* body 16-18px */
--step-1:  clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
--step-2:  clamp(1.6rem, 1.4rem + 1vw, 2.25rem);
--step-3:  clamp(2.2rem, 1.7rem + 2.5vw, 3.75rem);
--step-4:  clamp(3rem, 2rem + 5vw, 6.5rem);
--step-5:  clamp(4.5rem, 2.5rem + 10vw, 13rem);        /* hero numerals: ~190px desktop, 72px phone */
```

- Display tracking `-0.03em` to `-0.05em`, line-height `0.9`-`1.0`. Body line-height `1.6`, measure 45-75 characters.
- `text-wrap: balance` on all headings, `text-wrap: pretty` on paragraphs.
- Control line breaks on the hero by hand at three breakpoints.
- Hover weight shift on large links: Fraunces `wght` 400 to 600 with `font-variation-settings`, no layout shift (reserve width with a hidden bold clone).
- Use real typographic marks: curly quotes, en/em dashes, proper `×`, and `tabular-nums` on scores and countdowns.

---

## 4. Colour

Invented for this project, from Kenyan ground and light. Never pure black or white.

| Token | Hex | Meaning |
|---|---|---|
| `--ink` | `#12110E` | Warm black, primary dark surface and text on light |
| `--bone` | `#F4EFE4` | Paper, primary light surface |
| `--bone-2` | `#E9E2D2` | Raised surface on light |
| `--acacia` | `#1E3B2A` | Deep green, "guide" and "aid" chapters |
| `--murram` | `#B8431F` | Laterite red. The one accent on light surfaces, and the scam-warning colour |
| `--saffron` | `#E8A83A` | The one accent on dark surfaces |
| `--phosphor` | `#8CF2A6` | USSD screen text only |
| `--screen` | `#07130B` | USSD screen background only |

Functional tokens (light / dark chapters):

```css
--text-1: var(--ink);        /* on bone */           /* on ink/acacia: var(--bone) */
--text-2: rgb(18 17 14 / .62);                         /* on dark: rgb(244 239 228 / .62) */
--text-3: rgb(18 17 14 / .55);                         /* captions, never below 55% */
--border: rgb(18 17 14 / .12);                         /* on dark: rgb(244 239 228 / .14) */
--accent: var(--murram);                               /* on dark: var(--saffron) */
```

### Measured contrast (WCAG 2.1)

| Pair | Ratio | Allowed use |
|---|---|---|
| ink on bone | 16.5 | all text |
| bone on acacia | 10.7 | all text |
| saffron on ink | 9.1 | all text |
| phosphor on screen | 13.9 | USSD screen |
| ink 62% on bone | 4.7 | secondary text (AA) |
| murram on bone | 4.7 | text 18px+ bold or any text 16px+ (AA) |
| bone 60% on acacia | 4.9 | secondary text on green |
| saffron on acacia | 5.9 | accents on green |
| murram on ink | 3.5 | **graphics only. Never text.** Use saffron on dark |
| ink 45% on bone | 3.0 | **forbidden for text** |

### Contextual chapters (colour shifts as you scroll)

| Chapter | Background | Accent |
|---|---|---|
| Hero / The Crossing | bone | murram |
| Guide, Aid | acacia | saffron |
| Essays, LOR, Advisor | ink | saffron |
| CUE scam radar | murram wash on bone | ink |

Chapter changes use a 600ms background colour transition triggered by an `IntersectionObserver` on section borders. Accent appears on CTAs, the active nav item and one detail per section. Never everywhere.

Grain: a 3% SVG noise overlay (`mix-blend-mode: multiply`, `pointer-events: none`, static, not animated) gives paper texture. Disable under `prefers-reduced-data`.

`::selection { background: var(--murram); color: var(--bone); }`, on dark chapters `var(--saffron)` / `var(--ink)`.

Status colours (dashboard badges): verified = acacia, unverified = saffron outline with the word "Unverified", reach/target/likely = ink outline, saffron, acacia fill. Colour is never the only signal: pair with a label.

---

## 5. Layout and composition

- 12-column grid, 24px gutters (16px on phones), 1440px max container, `clamp(16px, 4vw, 64px)` page margins.
- Break the grid on purpose: the hero numeral bleeds off the right edge (`margin-right: -4vw`), module headings offset to column 2, pull quotes hang in the margin.
- Alternate dense (data tables, checklists) with empty sections (one sentence on a full viewport). White space is the pacing tool.
- Cards vary in size within a grid. No uniform three-column card rows.
- Section anatomy: mono label (`01 / Guide`), Fraunces headline, one-sentence subhead, then content.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 72, 112, 176. Vertical rhythm between chapters is 112-176px on desktop and 72-112px on phones.
- Mobile-first: all primary actions reachable by thumb (bottom 40% of screen). Sticky bottom action bar on module pages.

---

## 6. Motion

Easing tokens (never `ease`, `ease-in`, `ease-out`, `linear`):

```css
--ease-expo-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-quart-out: cubic-bezier(0.25, 1, 0.5, 1);
--ease-expo-in-out: cubic-bezier(0.87, 0, 0.13, 1);
```

| Token | Duration |
|---|---|
| micro (hover, press) | 160-240ms |
| reveal | 700-900ms |
| chapter / colour shift | 600ms |
| the Crossing scrub | scroll-driven |
Nothing over 1.2s unless it is scroll-scrubbed.

### Page-load choreography (landing)

| Time | What |
|---|---|
| 0-200ms | Structure: grid, nav skeleton, background |
| 200-600ms | Hero headline, line by line slide-up with 80ms stagger (mask-clip, not fade) |
| 400-800ms | Subhead |
| 600-900ms | Nav items cascade in |
| 800-1200ms | Phone, countdown and supporting elements |

### Scroll

- Lenis (about 3 KB) for weighted smooth scroll. Lerp `0.1`. Disabled when `prefers-reduced-motion` or Save-Data is on.
- Pinned sections: only the Crossing (about 300vh) and the USSD simulator (about 150vh). Never trap the user: Tab, End/Home, page-down and anchor links must always work, and every pinned beat is also readable as a static stack.
- Reveals via `IntersectionObserver` toggling a class (`.in`), once per element. Text lines slide up individually, images unmask with `clip-path`.
- Parallax only on decorative layers (grain offset, route-line dots). Never on text.
- Animate only `transform`, `opacity` and `clip-path`. Profile at 4x CPU throttle; if it drops below 60fps, simplify.
- Library choice: Framer Motion is already installed and handles layout/presence and the odometer. Use Lenis for scroll and CSS scroll-driven animation where supported. Add GSAP ScrollTrigger only if the Crossing cannot be built without it.

### Reduced motion / Save-Data

`@media (prefers-reduced-motion: reduce)` and `navigator.connection.saveData`: no smooth scroll, no pin, no odometer; show the end state (`A 82/84 = 4.0`) and the route line fully drawn. Content must be identical.

---

## 7. Pages and storyboard

### 7.1 Landing `/` (Collins)

| # | Section | Chapter | Beat |
|---|---|---|---|
| 1 | **Hero.** Headline: "From 84 points to 4.0." Subhead: "Free guidance for Kenyan students applying to US universities. On any phone." Two CTAs: *Start your plan* and *Dial \*384\*73732#*. 72h countdown as a mono ticker | bone | Giant Fraunces type, phone half-visible bottom right |
| 2 | **The Crossing** (signature moment) | bone to acacia | Pinned scroll, see Section 1 |
| 3 | **Six tools, one assistant.** Guide, GPA, Aid, Essays, LOR, Advisor presented as an index list (large type rows, hover reveals a one-line preview), not icon cards | acacia | Hover weight shift, magnetic row arrow |
| 4 | **Works on any phone.** USSD simulator pinned beside copy; numbers only | ink | Live calls to `/api/at/ussd` |
| 5 | **Essays, by type and school.** Two-column picker (type on the left, school on the right) animating into a mock review | ink | Shows the rubric bars filling |
| 6 | **The Scam Radar.** Murram-washed section; search a name, see the CUE list | bone with murram wash | Warning stamp motion (scale + rotate 2deg, once) |
| 7 | **Proof.** Three numbers in monumental type (5,337 / 20 / $0) with sources | bone | Counters roll on enter |
| 8 | **Footer.** Giant wordmark crop, WhatsApp and USSD codes, "100% free" | ink | Wordmark slides up |

### 7.2 Dashboard `/dashboard` (Sandra)

Student view, after phone verification. Same tokens, denser layout.
- **Top band:** greeting in Fraunces, next deadline as a mono countdown, progress ring (SVG) for guide completion.
- **Context card:** the student profile (KCSE, tests, majors, aid band) with inline edit and a "this is what Pepea tells Gemini about you" disclosure. Consent state visible.
- **Main grid (asymmetric):** Guide checklist (wide), Matches (tall), Aid (medium), Essays by school (wide), Recent chat (narrow).
- **Empty states:** every list has a designed empty state with one action and a USSD hint.
- Realtime: new essay version and review appear via Supabase Realtime with a subtle slide-in.

### 7.3 Module pages (Sandra, all under `/dashboard/*`)

| Route | Module | Key interface |
|---|---|---|
| `/dashboard/guide` | Application Guide | Vertical stepper, 12 steps grouped by phase, each with cost chip, time estimate, "mark done" |
| `/dashboard/gpa` | GPA Converter | Big grade selector (A to E as large type buttons) or points slider 7-84, result as monumental numeral with the "indicative" label and a copy-for-Common-App note |
| `/dashboard/aid` | Financial Aid Scout | Ranked list with match score bar, reasons, required forms, deadline, official link, unverified badge |
| `/dashboard/essays` | Essays | Step 1 pick **type** (list of 9 types with scope chips: common / school / scholarship / aid). Step 2 for school-specific types pick **school** then **prompt**. Step 3 editor with live word count against the limit, then review panel |
| `/dashboard/essays/[id]` | Essay detail | Version timeline, rubric bars by essay type, line-edit sidebar, the one example rewrite |
| `/dashboard/lor` | LOR Review | Recommender details, paste letter, four-axis score, gaps, "what to add about Kenya" list |
| `/dashboard/advisor` | University Advisory | Reach / target / likely columns (stacked on phone), aid outlook chip, chat box for questions |
| `/dashboard/context` | Student Context | Full profile editor, facts list (delete any), conversation history per channel, data export and delete |

### 7.4 USSD simulator (Collins)

- Photorealistic but flat feature phone, 3-button softkeys, numeric keypad only (0-9, `*`, `#`). **No letter keys.** The dial field only accepts digits, `*`, `#`.
- Screen: phosphor on `--screen`, JetBrains Mono, 182-character budget shown as a quiet counter so the team sees real limits.
- Quick-test chips are numeric (`1*1*2`) and update the screen live.
- A "request log" drawer shows the raw AT POST (`sessionId`, `text`) and the `CON`/`END` reply, for judges.
- An SMS notification slides in from the top of the phone when a flow triggers SMS.

### 7.5 WhatsApp preview (Sandra, in dashboard `/dashboard/context`)

Chat bubble view of the same conversation the student has on WhatsApp, read-only, with module chips.

---

## 8. Component specs

**Buttons.** Primary: accent fill, bone text, 48px high (56px on phones), radius 999px, Fraunces-free (Space Grotesk 600, uppercase tracking 0.06em). Magnetic pull on desktop (max 8px, pointer devices only). Press: scale 0.97, 160ms. Focus: 2px outline offset 3px in `--accent`, plus 1px inner ring for contrast on any chapter. Secondary: outline. Ghost: underline that grows from left.

**Inputs.** Underline-style fields with floating mono labels; error text sits under the field in `--murram` (light) or `--saffron` (dark) with an icon and a sentence that says how to fix it. Text areas for essays: serif (Fraunces 18px), generous line-height, live word counter that turns accent when within 10% of the limit and stays accent (not red-only) when over, with the words "over by N".

**Cards.** Flat, 1px border, no shadows. Hover: border to accent, 2px upward translate, 240ms quart-out.

**Badges.** `Verified` (acacia), `Unverified` (saffron outline with a warning mark), `Indicative` (dashed outline). Always include text.

**Score visual.** Rubric bars (horizontal, thin 6px) filling on enter, with the numeric score in tabular mono. The five-axis radar is optional; bars are the default because they are more legible on phones.

**Nav.** Landing: transparent, wordmark left, three links, one CTA, hides on scroll down and returns on scroll up. Dashboard: left rail on desktop, bottom tab bar (5 items) on phones.

**Toasts.** Bottom, 4s, polite `aria-live`, never block.

---

## 9. States and micro-details

- **Loading:** skeletons shaped like the final content (never spinners alone). Gemini calls show a two-line status that changes ("Reading your draft", "Checking against the prompt") and a determinate-looking progress bar capped at 90% until the response arrives.
- **Empty:** one sentence, one action, one numeric USSD alternative.
- **Error:** says what happened and what to do next. AI failure falls back to the demo analyser with a visible "Demo mode" label.
- **Offline / slow:** a banner "You seem offline. Your draft is saved on this phone." Drafts autosave to `localStorage` every 5 seconds.
- **404:** the dotted flight line ends mid-ocean with the line "This page did not make the crossing." and a link home.
- **Custom cursor:** none by default. It is opt-in only and needs an explicit decision (open question 1 below).
- **Focus-visible** styles on every interactive element, designed per chapter.
- **Selection** colours per chapter (Section 4).
- Smart typography throughout, no orphans in headlines.

---

## 10. Accessibility

- WCAG 2.1 AA minimum. Use only the contrast pairs in Section 4.
- Everything works by keyboard. Skip link first. Visible focus everywhere.
- Semantic landmarks and headings; one `h1` per page. Pinned sequences expose the same content in DOM order.
- `prefers-reduced-motion` and Save-Data respected (Section 6).
- Form errors announced with `aria-live="polite"` and tied with `aria-describedby`.
- Touch targets at least 44x44px.
- Kiswahili: all UI strings go through a single `strings` map so `sw` can be added without refactoring. Use `lang` attributes on mixed content.
- Charts and rubric bars have text equivalents.

---

## 11. Performance budget (3G, mid-range Android)

| Metric | Target |
|---|---|
| LCP | under 2.5s on Slow 4G throttling |
| CLS | under 0.05 (reserve space for fonts, phone mockup, images) |
| INP | under 200ms |
| Initial JS (landing, gzipped) | under 170 KB |
| Fonts | under 120 KB, preloaded, `display: swap` |
| Images | AVIF/WebP via `next/image`, none above the fold except the SVG phone |
| Lighthouse | 90+ on Performance, Accessibility, Best Practices, SEO |

Rules: dynamic-import everything below the fold (simulator, editor, charts), lazy-load Recharts only if the radar ships, no autoplay media, SVG for all illustration, inline critical CSS (Next default). Test on a real low-end Android before the demo.

---

## 12. Implementation notes

- Stack: Next.js 14 App Router, Tailwind 3.4, Framer Motion, Lenis. Extend the existing `tailwind.config.ts`; do not fight it.
- Replace the current palette (`canvas`, `savannah`, `safari`, `crimson`, `parchment`) with the tokens in Section 4. Map them in `tailwind.config.ts` as `ink`, `bone`, `acacia`, `murram`, `saffron`, `phosphor`, `screen` and remove the old names once nothing uses them.
- Tokens live as CSS variables in `app/globals.css`; Tailwind colours reference them (`rgb(var(--ink) / <alpha-value>)`) so chapter switching is one class on a section wrapper (`data-chapter="acacia"`).
- Suggested structure:

```
components/
  ui/            Button, Input, Textarea, Badge, Card, Toast, Skeleton
  motion/        Reveal, SplitLines, Odometer, ScrollChapter, MagneticButton
  landing/       Hero, Crossing, ToolsIndex, UssdSection, EssaysSection, CueRadar, Proof, Footer
  dashboard/     Shell, ContextCard, GuideStepper, MatchColumns, AidList, EssayPicker, EssayEditor, ReviewPanel, LorForm
  ussd/          Phone, Keypad, RequestLog
lib/
  motion.ts      easing + duration tokens
  strings.ts     en / sw
```

- Use the types in `lib/types.ts` for every data prop so the UI and API stay in sync.
- Hand-off rule from AGENTS.md applies: log every file you add or change in the mutation log.

---

## 13. Scorecard (self-assessment, to be re-scored after build)

| Category | Weight | Target | How |
|---|---|---|---|
| Typography | 25% | 9 | Fraunces at 190px numerals, 10:1+ scale, weight-on-hover |
| Composition | 25% | 9 | Bleeding numeral, asymmetric grid, index-list instead of card grid |
| Motion | 20% | 9 | The Crossing, choreographed load, custom easing, reduced-motion parity |
| Colour | 15% | 9 | Murram/acacia/bone chapters, nothing generic |
| Details | 15% | 9 | Honest badges, designed empty/error/404, numeric USSD simulator with request log |

Weighted target: 9.0. The gap to 10 is the Crossing's polish and real-device performance, which can only be judged after build.

---

## 14. Open decisions

1. **Custom cursor:** none specified. Add one only if the team approves it explicitly.
2. **Kiswahili UI:** designed for, not translated yet. Confirm whether the MVP ships it.
3. **Lenis vs native scroll** on the dashboard: spec uses Lenis on the landing page only, native scroll in the dashboard for form reliability.
4. **Imagery:** this spec uses no photography. If the team has permission-cleared photos of real Kenyan students, add one duotone portrait strip in the Proof section.
