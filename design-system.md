# TakeToday — Design System & Product Spec

*Version 1.0 · April 2026*

A newsroom product built for people who want to actually understand something in under 30 seconds. This document defines the system so anyone on the team — design, engineering, editorial — is building from the same foundation.

---

## 1. Brand Philosophy

**Three principles, in order:**

1. **Clarity over cleverness.** If a reader has to parse the layout before parsing the story, we've failed.
2. **Whitespace is a product.** The things we don't put on the page matter as much as the things we do.
3. **Confidence over hedging.** Editorial and visual voice are both direct. We have a take. We say it.

**Influences**: Apple (restraint), Bloomberg (information density done right), Are.na (editorial quiet), The Browser (curation signal), Substack (reading-first respect for the reader).

**Avoided at all costs**: Carousels, pop-up newsletters that block reading, autoplay video, emoji in headlines, third-party ad tag sprawl, "trending" rails that recommend the same story three times.

---

## 2. Logo & Identity

The mark is a two-letter monogram built from interrupted geometric strokes — the negative space is the point. It reads as "TT" architecturally, but also reads as a wordmark at small sizes because of the vertical rhythm.

**Usage rules**

- **Clear space**: minimum 1× logo height on all sides. No exceptions in the header or social avatars.
- **Minimum size**: 20px on screen, 12mm in print.
- **Colorways**: Ink on Paper (primary), Paper on Ink (inverted), Ink on Paper with 10% texture (print editorial).
- **Never**: rotate, outline, add gradients, place on a photo without a white circle behind it, use as a favicon below 24×24.

The wordmark "TakeToday" sits beside the mark in Inter Medium, optical kerning, tracked `-0.01em`. The mark is always visually slightly larger than the cap-height of the wordmark.

---

## 3. Color System

The palette is intentionally narrow. One accent, used like punctuation — never decoration.

| Token       | Hex       | Role                                                         |
| ----------- | --------- | ------------------------------------------------------------ |
| `ink`       | `#0A0A0A` | Primary text, logo, buttons, dark surfaces                   |
| `ink-900`   | `#111111` | Inverted surface base                                        |
| `ink-700`   | `#1F1F1F` | Body text on light                                           |
| `ink-500`   | `#6B6B6B` | Secondary text, metadata                                     |
| `ink-400`   | `#9A9A9A` | Disabled, tertiary                                           |
| `ink-300`   | `#C9C7C1` | Dividers, subtle borders                                     |
| `ink-200`   | `#E5E3DD` | Card borders, dividers on light                              |
| `ink-100`   | `#EFEDE6` | Card fills, hover states                                     |
| `paper`     | `#FAFAF7` | Canvas. Warm off-white, matches the logo backdrop            |
| `accent`    | `#C8553D` | Muted terracotta — used ONLY for "Why it matters," live indicators, and critical category tags. Never as a background field. |

**Rules of the accent.** The accent appears at most twice per screen. If we're tempted to use it a third time, it's decoration and it goes.

**Dark mode**: invert `paper` and `ink`. All grays flip through a symmetrical scale. Accent stays the same hex — terracotta reads identically on both backgrounds.

---

## 4. Typography

Two typefaces, three roles. No more.

| Role              | Family              | Why                                                                 |
| ----------------- | ------------------- | ------------------------------------------------------------------- |
| Editorial headline | **Instrument Serif** | Gives the site its "magazine" feel without going ornate. Italics do a lot of the emotional work. |
| UI & body          | **Inter**            | The hardest-working sans on the internet. Dense, readable, neutral. |
| Metadata & ticker  | **JetBrains Mono**   | Signals "live data" without shouting. Used for timestamps, tickers, category tags, issue numbers. |

### Type scale

```
display-xl  168px / 0.88 / -0.04em   Instrument Serif      Hero headlines only
display-lg   96px / 0.90 / -0.03em   Instrument Serif      Section intros
display-md   72px / 1.02 / -0.03em   Instrument Serif      Article H1
h1           56px / 1.05 / -0.02em   Instrument Serif      Featured cards
h2           40px / 1.10 / -0.02em   Instrument Serif      Article H2, sections
h3           26px / 1.15 / -0.02em   Instrument Serif      Card titles
h4           20px / 1.25 / -0.01em   Inter Medium          Sidebar heads
body-lg      18px / 1.75              Inter 400            Article body
body         16px / 1.65              Inter 400            UI default
body-sm     14.5px/ 1.55              Inter 400            Card summaries
meta         11px  / 1.4  /  0.18em   JetBrains Mono       Categories, timestamps
```

### Prose rules
- Maximum line length: **68 characters** (`max-w-prose`). Non-negotiable in articles.
- Drop caps on the first paragraph only. Never on sub-sections.
- Block quotes set in Instrument Serif, 24px, left-ruled in `ink`, never centered.
- No justified text. Left-align everywhere.

---

## 5. Spacing & Layout

**Base unit**: 4px. Every space is a multiple.

**Spacing scale**: `4, 8, 12, 16, 20, 24, 32, 40, 56, 80, 120, 160`.

**Grid**: 12 columns, 80px max gutter at desktop, 24px at mobile. Container caps at 1400px. Reading columns cap at 680px (68ch).

**Breakpoints**: `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. Design is built mobile-first and fans outward.

**Vertical rhythm between sections**: 80px minimum on mobile, 120–160px on desktop. Readers need air between ideas.

---

## 6. Components

### 6.1 Navbar

Sticky, with a 75% opacity `paper` background and `backdrop-blur-md`. Sits above a 1px `ink-200` divider. Below the main row: a 32px high ticker strip showing live headlines with a pulsing terracotta "LIVE" dot. The ticker is purely ambient — clicking does nothing — its job is to make the site feel alive without being noisy.

**Layout**: logo-left, categories-center (desktop only), search + subscribe CTA right. On mobile the ticker hides, categories collapse into a drawer, search becomes an icon-only button.

### 6.2 News Card

The atomic unit of the homepage. Four sizes:

- **Lead (feature)**: 16:11 image, H1-scale headline, 2-line summary, category pill, read-time meta
- **Side (stacked)**: no image, H3 headline, 1-line summary, category + timestamp
- **Grid (standard)**: 4:3 image, H3 headline, 2-line summary, category + timestamp
- **Inline (briefing)**: category pill + headline only, one per row

All cards use the same hover treatment: a 350ms ease-out color shift on the headline from `ink` → `ink-700`. No scale, no shadow, no lift. The card isn't a button — the text is.

### 6.3 Category Pill

`mono 10px / uppercase / 0.18em tracking`. Paper background with 90% opacity, backdrop blur, no border, 999px radius. Sits top-left on image cards with 12px inset.

The **accent variant** (terracotta text) is reserved for four categories: `Breaking`, `Live`, `Editor's Pick`, and standalone article-page category labels. Everywhere else, category text is `ink-500`.

### 6.4 Article Layout

A three-act page:

1. **Header** (centered, max-w-3xl): back link → category + read-time → H1 → deck paragraph → author + actions row.
2. **Quick Take** (max-w-3xl, `ink-100` card, rounded-2xl): one Instrument Serif sentence. This is the "I read it in 10 seconds" layer — the single most important sentence in the piece.
3. **Body** (max-w-prose): drop-cap first paragraph, standard prose, `<h2>` sub-sections in serif, one pull-quote maximum.

**The "Why it matters" block** sits after the body. Left-ruled in `accent`, Instrument Serif at 28px. It is never optional — editors write it first, body second.

**Three things to remember**: an ordered list using large serif numerals at 40px in `ink-400` beside short explanation text. Our answer to the "TL;DR" without calling it that.

### 6.5 Intelligence Strip (newsletter module)

Full-bleed `ink` section with `paper` text. One editorial headline (display-lg, italic second line), one sentence of value prop, one email capture form. No illustrations, no testimonials, no fake social proof counts. The design is the proof.

### 6.6 Ticker

Infinite horizontal scroll, 45s loop, `mono 11px`. Pauses on hover. Mobile: hidden (too noisy, too small).

### 6.7 Buttons

Only three button styles. Everything else is a link.

- **Primary**: `ink` fill, `paper` text, 44px tall, 999px radius, 20px horizontal padding, tiny right-arrow icon.
- **Secondary**: 1px `ink-300` border, transparent, flips to `ink` fill on hover.
- **Ghost (filter chip)**: 32px tall, no border, `ink-100` fill on hover, `ink` fill when active.

---

## 7. Motion

**Philosophy**: Motion signals hierarchy, never personality. If a user notices the animation, it's too loud.

| Interaction                         | Duration       | Easing                     |
| ----------------------------------- | -------------- | -------------------------- |
| Link underline reveal               | 450ms          | `cubic-bezier(.2,.7,.2,1)` |
| Page transition (fade + 4px rise)   | 350ms          | ease-out                   |
| Button color shift                  | 200ms          | ease                       |
| Hover card headline tint            | 350ms          | ease-out                   |
| Ticker loop                         | 45s linear infinite | —                     |
| Live dot pulse                      | 2s             | ease-in-out infinite       |

No page-scroll-triggered reveal animations. No parallax. No confetti. No scroll-jacking.

---

## 8. Information Architecture

```
/                   Homepage — hero + Lead + Feed + Intelligence strip
/c/[category]       Category index (AI, Finance, Tech, Startups, Briefings)
/article/[slug]     Article page
/briefing/[date]    Daily 5-story briefing (the newsletter web version)
/search             Full-text + semantic search
/about              One page. One page only.
```

Navigation depth is deliberately shallow. There are no author pages, no tag pages, no archive pages — content routes to categories and search.

---

## 9. The Intelligence Layer — features that make TakeToday different

These are the things that turn a news site into a product. In priority order:

**1. The 30-second Take** · Every article opens with a single Instrument Serif sentence (`QuickTake` component). AI-assisted draft, human-approved, always present. This is the promise of the product, rendered once per story.

**2. Why it matters** · The block that closes every piece. This is what readers remember and what they repeat at dinner. Editors write it before writing the body.

**3. Three things to remember** · A post-read retention module. Not a summary — a set of *claims* the reader can now make. Designed to be screenshot-friendly.

**4. Topic Threads** · Instead of "related articles," we thread stories that share the same underlying through-line. Readers can follow the Fed rate-cut debate across six months in a single vertical scroll.

**5. Reading Time + Depth** · Each article is tagged `Brief / Analysis / Deep Dive` (60–100w / 150–300w / 400–700w). Readers pick the depth; the URL is stable, the content adapts.

**6. Listen Mode** · One-click audio of any article. Built in. No separate podcast app, no paywall. The voice is consistent — one AI narrator, fine-tuned, human-reviewed weekly.

**7. The Daily Brief** · 7am email. Five stories. Five minutes. Auto-unsubscribes anyone who hasn't opened it in 14 days (we refuse to inflate our own numbers — this is editorial hygiene as a feature).

**8. "What I missed"** · A button on every article that answers: *if I'd stopped reading the news a week ago, what would I need to know to understand this?* Semantic backfill, surfaced only on demand.

**9. Read Receipts (anonymous)** · A small counter under the headline: *"14,203 people finished this this morning."* Displayed only for articles with high completion rate. Signals quality without clickbait.

**10. No infinite scroll** · The feed ends. Readers hit "You're caught up." Respect for the reader's time is a feature.

### Engagement without clickbait

- Headlines are written in declarative voice, never in questions.
- No numbers in headlines unless genuinely critical ("68% of YC batch is AI" — yes. "10 things you need to know" — no.)
- A/B testing is allowed on layout, never on headline urgency language.
- If a story can be told in 60 words, it is. We publish fewer stories than competitors, not more.

---

## 10. Accessibility

- All text passes WCAG AA contrast: `ink-500` on `paper` = 4.9:1, `ink-700` on `paper` = 12:1.
- Every interactive element has a visible focus ring (`2px solid ink`, 3px offset).
- Minimum tap target 44×44px on mobile.
- Reduced-motion media query disables ticker, page-transition fade, and the live dot pulse.
- Semantic HTML throughout — `article`, `nav`, `main`, `aside` used correctly.
- Alt text on every cover image, auto-generated by editor + human-reviewed.

---

## 11. Performance Budget

| Metric                        | Target       |
| ----------------------------- | ------------ |
| Largest Contentful Paint      | < 1.2s       |
| First Input Delay             | < 50ms       |
| Cumulative Layout Shift       | < 0.02       |
| Total JS (homepage, gzipped)  | < 90 KB      |
| Total CSS (gzipped)           | < 14 KB      |
| Fonts loaded                  | 2 (Inter, Instrument Serif) + 1 variable mono |
| Images                        | AVIF with JPEG fallback, `<img loading="lazy">` below the fold |

The homepage ships with **zero third-party trackers at first paint**. Analytics loads after the idle callback fires. Ads — if they ever exist — will be server-rendered, static, no auction.

---

## 12. Content Voice Reminders (cross-ref with project charter)

Because the design and the voice have to agree:

- "Here's what happened. Here's why it matters. Here's what you should care about." — visible at the layout level, not just the copy level.
- Length tier is explicit (Brief / Analysis / Deep Dive) so readers never feel tricked into a longer piece than they budgeted for.
- Category tags are precise. `AI` is not the same as `Tech`. `Finance` is not the same as `Markets`. Taxonomy discipline is part of voice.

---

*This document is a working spec. Every component on the site traces back to one of these rules. If you're about to ship something that doesn't, pause and say why.*
