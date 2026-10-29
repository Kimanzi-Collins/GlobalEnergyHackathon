# Pepea (Ng'ambo) Design System

Target: Awwwards-level craft (rubric score 9-10) that still runs on a mid-range Android on a 3G connection in Kitui.
Owners: Collins (design system, landing, USSD simulator) and Sandra (dashboard, module interfaces).
Status: landing page, UI kit, motion kit and USSD simulator are built (2026-10-29). Dashboard and module pages are Sandra's and build against this spec.

**Direction (revised 2026-10-29): Apple-grade.** Quiet, product-first, huge type, generous space, alternating light and dark chapters, frosted nav, one accent. Palette and typeface below replace the earlier editorial draft (Fraunces, bone, acacia).

---

## 1. Concept

**Brand essence: Crossing.** *Ng'ambo* means "the other side" in Swahili. Every screen is about moving a student across: from KCSE to a US GPA, from a feature phone to an Ivy League portal, from a scam agency to a free official route.

**Visual tension:** the humble and the elite. A green-phosphor USSD screen on a 2G phone sits beside editorial serif typography worthy of a university press. Neither is allowed to feel like the "lesser" one; the phone is treated as the hero object.

**Signature moment: "The Crossing."** A pinned scroll sequence on the landing page.
1. A monumental KCSE result, `A  82/84`, fills the viewport in Geist at display size.
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
| Display and UI | **Geist Sans** (variable, self-hosted through the `geist` package) | Everything: headlines, body, forms |
| Data / USSD | **Geist Mono** | Codes, scores, the phone screen, countdown |

Geist is a neo-grotesque with the clarity of SF Pro, which gives the Apple register without relying on `system-ui`. Loaded in `app/layout.tsx` as CSS variables `--font-geist-sans` and `--font-geist-mono`. No third-party font requests.

### Scale (fluid; display is 10:1 or more against body)

Defined in `tailwind.config.ts` as `text-micro`, `text-body`, `text-lead`, `text-h3`, `text-h2`, `text-h1`, `text-mega`:

| Token | Size (phone to desktop) | Tracking | Line height |
|---|---|---|---|
| micro | 11.5px to 12.8px | +0.02em | 1.3 |
| body | 16px to 18px | 0 | 1.6 |
| lead | 20px to 28px | -0.012em | 1.35 |
| h3 | 24px to 36px | -0.022em | 1.12 |
| h2 | 36px to 80px | -0.035em | 1.02 |
| h1 | 48px to 136px | -0.045em | 0.96 |
| mega | 80px to 320px | -0.06em | 0.84 |

- Headlines are semibold with tight tracking, on a single idea of 3 to 7 words. Manual line breaks (`\n`) in `SplitLines`.
- `text-wrap: balance` on headings, `pretty` on paragraphs, `tabular-nums` on every number that changes.
- The Crossing numerals scale with viewport height (`min(16vw, 24vh)`) so they never collide with captions, and carry right padding so tight tracking cannot clip the last glyph.
- Real typographic marks: curly quotes, proper dashes. No emoji in the UI.

---

## 4. Colour

Near-black and near-white (never #000 or #FFF), one warm accent drawn from Kenyan laterite and a sunrise gradient used for one word at a time.

| Token | Hex | Meaning |
|---|---|---|
| `ink` | `#0B0B0D` | Dark chapters |
| `graphite` | `#1D1D1F` | Text on light, surface on dark |
| `snow` | `#FBFBFD` | Light chapters |
| `paper` | `#F5F5F7` | Raised light surface, alternate light chapter |
| `murram` | `#A63A18` | The accent on light chapters, buttons, scam warning |
| `saffron` | `#F2A93B` | The accent on dark chapters |
| `phosphor` / `screen` | `#8CF2A6` / `#07130B` | USSD screen only |

Sunrise gradient (`murram` to `saffron`) is for a single word in a headline (the "4.0"), never for blocks or backgrounds.

### Chapter tokens

Components never use raw hex. Each landing section sets `data-chapter` (`light`, `paper`, `dark`, `wash`) which re-points these CSS variables, and Tailwind exposes them as `bg-bg`, `bg-surface`, `text-fg`, `text-fg2`, `border-line`, `bg-accent`, `text-accent-fg`. The nav reads the chapter beneath it and tints itself.

| Chapter | bg | surface | fg | fg2 | accent |
|---|---|---|---|---|---|
| light | snow | paper | graphite | #6E6E73 | murram |
| paper | paper | snow | graphite | #6E6E73 | murram |
| dark | ink | graphite | snow | #A1A1A6 | saffron |
| wash | #F3E4DC | #FBF1EB | graphite | #554E4A | murram |

### Measured contrast (WCAG 2.1)

| Pair | Ratio | Allowed use |
|---|---|---|
| graphite on paper | 15.5 | all text |
| snow on ink | 19.0 | all text |
| #A1A1A6 on ink | 7.6 | secondary text on dark |
| #6E6E73 on snow | 4.9 | secondary text on light (AA) |
| #6E6E73 on paper | 4.7 | secondary text (AA) |
| murram on paper | 6.0 | text and links |
| snow on murram | 6.3 | button label |
| saffron on ink | 9.9 | text and links on dark |
| phosphor on screen | 13.9 | USSD screen |
| #6E6E73 on wash | 4.1 | **do not use**: wash uses #554E4A instead |
| murram on ink | below 4.5 | **graphics only, never text** |

Status colours: Verified, Unverified and Indicative are shown by label and outline style, never by colour alone.

`::selection` uses the chapter accent. Focus rings are 2px accent outlines with 3px offset.

---

## 5. Layout and composition

- 12-column grid, 24px gutters (16px on phones), 1440px max container, `clamp(16px, 4vw, 64px)` page margins.
- Break the grid on purpose: the hero numeral bleeds off the right edge (`margin-right: -4vw`), module headings offset to column 2, pull quotes hang in the margin.
- Alternate dense (data tables, checklists) with empty sections (one sentence on a full viewport). White space is the pacing tool.
- Cards vary in size within a grid. No uniform three-column card rows.
- Section anatomy: mono label (`01 / Guide`), semibold headline, one-sentence subhead, then content.
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

### 7.1 Landing `/` (Collins) (built)

Eight chapters, light and dark alternating like an Apple product page. Frosted 52px nav that hides on scroll down.

| # | Section (file) | Chapter | Beat |
|---|---|---|---|
| 1 | **Hero** (`hero.tsx`): countdown, "From 84 points to 4.0." with the gradient on "4.0", two actions, a scripted phone rising and cropped by the section edge | light | Word-by-word mask reveal, 80ms stagger; phone parallax |
| 2 | **The Crossing** (`crossing.tsx`): 340vh pinned scroll. 82/84 rolls into 4.0, a dotted route is drawn from Nairobi to Cambridge, three captions, the dial code | dark | Signature moment. Static version for reduced-motion and Save-Data |
| 3 | **Six tools** (`tools.tsx`): asymmetric bento (7/5, 4/8, 5/7 columns), a live GPA converter tile | paper | Cards lift on hover |
| 4 | **On any phone** (`ussd-section.tsx`): numeric-only simulator wired to `/api/at/ussd`, request log, 182-character counter | dark | Copy column is sticky beside the phone |
| 5 | **Essays by type and school** (`essays-section.tsx`): type picker, school picker, prompt, rubric bars | light | Bars fill with scaleX on each selection |
| 6 | **Stay safe** (`cue-radar.tsx`): CUE list search with hit, miss and idle states | wash | Cross-fade between states |
| 7 | **Proof** (`proof.tsx`): 5,337 / 20 / 0 in monumental type | paper | Digits roll once (`Odometer`) |
| 8 | **Footer** (`footer.tsx`): wordmark cropped by the page edge, codes, disclaimer | dark | |

Calls to action point at on-page anchors (`#phone`, `#tools`) until the dashboard exists; change the hero and nav buttons to `/dashboard` when FE-S-01 ships.

### 7.2 Dashboard system `/dashboard` (built)

The dashboard is one dark chapter (`data-chapter="dark"`) with a fixed rail and a quiet ambient glow. It uses the same tokens, type and motion as the landing page, with a denser layout. Rules every dashboard page follows:

- **Header:** `PageHero` (small label with icon, a two-line title of two to five words with at most one gradient word, one sentence of description, an optional aside). Titles are `text-dash` (40 to 76px).
- **Surfaces:** `Panel` (rounded, flat, a hairline top highlight, no shadow). One `glow` panel per page, the one that should lead.
- **Numbers are the design:** `Stat` for the monumental figure (rolling digits, `text-stat` up to 144px, accent colour), `ProgressRing` for completion, `Meter` for rubric and match bars. Never a bare number in small mono.
- **Type:** Geist. Labels are sentence case at 14px; eyebrows are 12.8px uppercase. Minimum text size is 12px. Mono is only for codes, phone numbers and the AI payload.
- **Choice controls:** `Segmented` (a radio group with arrow keys) instead of native selects wherever the options fit on screen. Native selects only for long lists, with a dark background.
- **Motion:** the page settles in on navigation (`template.tsx`, transform only); headline words, eyebrow and aside are CSS animations so they start before React loads; panels use `Reveal`; rings and bars draw once. Everything is static under reduced motion and Save-Data.
- **Honesty:** every review, answer or ranking that is a mock carries a visible "Sample" label. Unverified data carries the Unverified badge. GPA is always "indicative".
- **States:** every list has a designed empty state (`EmptyState`), every async action has a loading state on its button, every save and copy confirms with a toast.

Shell (`components/dashboard/DashboardNav.tsx`): left rail on desktop with the student card (initials ringed by guide progress, opens the phone dialog), grouped links (Plan, Tools, You) with an accent bar on the current page, and the numeric USSD code (tap to copy). On phones: a frosted top bar, a five-item tab bar in thumb reach, and a full-screen menu listing all eight destinations. Escape closes every overlay.

### 7.3 Dashboard pages (built, on fixtures)

| Route | Signature | What it does |
|---|---|---|
| `/dashboard` | Days to the next deadline in monumental type, from the real clock | Plan ring, student context row, next four steps, shortlist with fit rings, essays with scores, aid matches |
| `/dashboard/gpa` | A rolling GPA numeral and a 12-bar band chart you can click | Mean grade or points slider, save to profile, the sentence to paste into the Common App |
| `/dashboard/guide` | A timeline whose spine turns green as steps complete | Sticky phase index, expandable steps, mark done, cost and time chips, USSD shortcut per step |
| `/dashboard/essays` | Three steps: type, school and prompt, then write. The editor stays locked until a school essay has its prompt | Live word ring and limit from the prompt, real autosave to this phone, rubric meters per essay type, line edits, Kenya context |
| `/dashboard/lor` | Four-axis assessment beside the letter | Strengths, gaps, what to add about Kenya, sentence-level rewrites. Never writes the letter |
| `/dashboard/advisor` | Three lanes: reach, target, likely | Fit rings, aid outlook, test policy, deadlines, "why this school", ask box |
| `/dashboard/aid` | Ranked programmes with match meters | Filter by type, forms and deadlines, how to apply, official link, scam warning |
| `/dashboard/context` | "What the AI sees": the exact payload, on demand | Editable profile, deletable facts, activities, consent state, conversation history |

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

**Buttons.** Primary: accent fill, `accent-fg` text, 44px high (56px for hero actions), radius 999px, Geist medium with tight tracking. Magnetic pull on desktop (max 8px, pointer devices only). Press: scale 0.97, 160ms. Focus: 2px outline offset 3px in `--accent`, plus 1px inner ring for contrast on any chapter. Secondary: outline. Ghost: underline that grows from left.

**Inputs.** Rounded surface fields with a visible label above, hint below; error text sits under the field in the chapter accent with an icon and a sentence that says how to fix it. Text areas for essays: 16-18px, generous line-height, live word counter that turns accent when within 10% of the limit and stays accent (not red-only) when over, with the words "over by N".

**Cards.** Flat, 1px border, no shadows. Hover: border to accent, 2px upward translate, 240ms quart-out.

**Badges.** `Verified` (check mark, neutral fill), `Unverified` (saffron outline with a warning mark), `Indicative` (dashed outline). Always include text.

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
- Tokens are in `tailwind.config.ts` and `app/globals.css` (done). Use the chapter tokens (`bg-bg`, `text-fg`, `text-fg2`, `bg-accent`, `border-line`, ...) in components and never raw hex, so a component works in every chapter.
- Tokens live as CSS variables in `app/globals.css`; Tailwind colours reference them (`rgb(var(--ink) / <alpha-value>)`) so chapter switching is one attribute on a section wrapper (`<ScrollChapter chapter="dark">`).
- Structure (landing parts are built; `dashboard/` is Sandra's):

```
components/
  ui/            Button, Input, Textarea, Badge, Card, Toast, Skeleton          (built)
  motion/        Reveal, SplitLines, Odometer, ScrollChapter, Magnetic,         (built)
                 SmoothScroll, MotionProvider, useLiteMotion
  landing/       Nav, Hero, HeroPhone, Crossing, RouteArc, Tools, GpaCard,      (built)
                 UssdSection, EssaysSection, CueRadar, Proof, Footer, Countdown, OfflineBanner
  ussd/          Phone, UssdSimulator                                           (built)
  dashboard/     Shell, ContextCard, GuideStepper, MatchColumns, AidList,
                 EssayPicker, EssayEditor, ReviewPanel, LorForm                 (to do)
lib/
  motion.ts      easing + duration tokens
  strings.ts     en / sw
  kcse-scale.ts, fixtures/essays.ts   offline copies for demos and for building UI before the API
```

- Framer Motion runs through `LazyMotion` (`m.*` components, `domAnimation` only). Use `m`, not `motion`, to keep the bundle small.
- `useLiteMotion()` is true for `prefers-reduced-motion` and Save-Data. Every motion component renders its end state when it is true.

- Use the types in `lib/types.ts` for every data prop so the UI and API stay in sync.
- Hand-off rule from AGENTS.md applies: log every file you add or change in the mutation log.

---

## 13. Scorecard (self-assessment, to be re-scored after build)

| Category | Weight | Target | How |
|---|---|---|---|
| Typography | 25% | 9 | Geist at up to 320px numerals, 10:1+ scale, tight tracking |
| Composition | 25% | 9 | Bleeding numeral, asymmetric grid, index-list instead of card grid |
| Motion | 20% | 9 | The Crossing, choreographed load, custom easing, reduced-motion parity |
| Colour | 15% | 9 | Alternating ink/snow/paper/wash chapters, one accent, gradient on one word |
| Details | 15% | 9 | Honest badges, designed empty/error/404, numeric USSD simulator with request log |

Weighted target: 9.0. The gap to 10 is the Crossing's polish and real-device performance, which can only be judged after build.

---

## 14. Open decisions

1. **Custom cursor:** none specified. Add one only if the team approves it explicitly.
2. **Kiswahili UI:** designed for, not translated yet. Confirm whether the MVP ships it.
3. **Lenis vs native scroll** on the dashboard: spec uses Lenis on the landing page only, native scroll in the dashboard for form reliability.
4. **Imagery:** this spec uses no photography. If the team has permission-cleared photos of real Kenyan students, add one duotone portrait strip in the Proof section.
