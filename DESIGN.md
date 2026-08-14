# Design System: School ID Extractor

> Single source of truth for the visual language. All new screens and redesigns
> must conform to these rules. Anything not specified here defaults to a calm,
> warm, paper-like aesthetic — never the AI-default of blue/purple/neon cards.

---

## 1. Visual Theme & Atmosphere

A calm, paper-warm interface that feels like a school register, not a SaaS
dashboard. Generous whitespace, quiet borders, generous rounding. The user is
a school administrator reading handwriting on paper forms — the tool should
feel like an extension of that paper, not a flashy web app that interrupts it.

- **Density:** 4 — Daily App Balanced, leaning airy. Real estate over packing.
- **Variance:** 3 — Predictable Symmetric. School admins need predictability.
- **Motion:** 3 — Static Restrained. One tasteful transition per state change.
- **Tone:** Warm, professional, unhurried. Like a well-organized office.

**Single guiding principle:** *calm authority*. The interface is competent
and quiet; it gets out of the way of the data.

---

## 2. Color Palette & Roles

One warm-neutral canvas. One deep-green accent. No purple. No neon. No gradient
buttons. No glow shadows. Never `#000000`. Never `#FFFFFF`.

### Light mode (default)

| Role | Name | Hex | Use |
|---|---|---|---|
| Canvas | `Paper` | `#FAF7F2` | Page background |
| Surface | `Card` | `#FFFFFF` | Cards, panels, inputs |
| Surface alt | `Linen` | `#F2EDE4` | Subtle dividers, section bands |
| Ink | `Charcoal` | `#1F2024` | Primary text — never pure black |
| Ink muted | `Slate` | `#6B6E76` | Secondary text, metadata, helper |
| Border | `Whisper` | `#E8E2D6` | Card borders, 1px structural lines |
| Focus ring | `Moss` | `#3D5A40` | Focus outlines, selection rings |
| Accent | `Forest` | `#3D5A40` | Primary CTAs, active states, success |
| Accent ink | `Forest on Light` | `#FFFFFF` | Text on Forest background |
| Warning | `Amber` | `#B45309` | Needs-review, low confidence |
| Warning bg | `Amber Wash` | `#FEF6E7` | Warning cell backgrounds |
| Danger | `Brick` | `#9B2C2C` | Destructive, errors, UNCLEAR |
| Danger bg | `Brick Wash` | `#FBECEC` | Danger cell backgrounds |

### Dark mode

| Role | Name | Hex | Use |
|---|---|---|---|
| Canvas | `Ink` | `#1A1B1F` | Page background |
| Surface | `Slate` | `#23252B` | Cards, panels |
| Surface alt | `Charcoal` | `#2C2E35` | Subtle dividers, section bands |
| Ink | `Paper` | `#F0EBE0` | Primary text — warm off-white |
| Ink muted | `Fog` | `#9A9BA0` | Secondary text |
| Border | `Dusk` | `#383A42` | Card borders |
| Accent | `Sage` | `#7BA17D` | Primary CTAs, active states (lighter for contrast on dark) |
| Warning | `Amber` | `#D97706` | (lifted) |
| Warning bg | `Amber Wash` | `#3A2E1A` | (dark wash) |
| Danger | `Brick` | `#E57373` | (lifted) |
| Danger bg | `Brick Wash` | `#3A1F1F` | (dark wash) |

**Banned palettes:**
- The current blue/indigo (`#2563eb`, `#3b82f6`) — this IS the AI tell.
- Purple gradients, neon glows, glassmorphism.
- Pure black or pure white anywhere.

---

## 3. Typography Rules

Three fonts, fixed roles. Never substitute.

### Fonts (loaded via `next/font/google`)

| Role | Family | Weight | Use |
|---|---|---|---|
| Display | `Satoshi` | 700, 800 | H1, hero numerals, brand mark |
| Body | `Inter Tight` | 400, 500, 600 | Paragraphs, labels, table cells |
| Mono | `JetBrains Mono` | 400, 500 | IDs, admission numbers, queue counts, status pills |

### Hierarchy

- **H1:** `Satoshi 700`, `clamp(2rem, 4vw, 2.75rem)`, `Charcoal/Ink`. Tracking `-0.02em`. Line-height `1.1`.
- **H2:** `Satoshi 700`, `1.5rem`. Tracking `-0.015em`.
- **H3 / section labels:** `Inter Tight 600`, `0.875rem`, uppercase, tracking `0.08em`, `Slate` color.
- **Body:** `Inter Tight 400`, `0.9375rem` (15px), line-height `1.6`. Max-width `65ch`.
- **Caption / meta:** `Inter Tight 500`, `0.8125rem` (13px), `Slate`.
- **Mono (data):** `JetBrains Mono 500`, `0.875rem`, tabular-nums. Use for: admission numbers, queue counts, year (`2026-2027`), row numbers, file counts.

**Banned:**
- `Inter` (the default). Use `Inter Tight` instead — same family, sharper.
- Generic serifs (`Times`, `Georgia`, `Garamond`). `Satoshi` is the only display family.
- Multiple display fonts. One.

---

## 4. Component Stylings

### Buttons

- **Primary:** `Forest` background, `Forest on Light` text. Padding `0.625rem 1.125rem`. Radius `0.625rem` (10px). No shadow. Hover: darken 8%. Active: `translateY(1px)` for tactile feedback. No glow.
- **Secondary:** transparent background, `1px Whisper` border, `Charcoal` text. Hover: `Linen` background.
- **Ghost:** no border, no background. Hover: `Linen` background. Used inside cards.
- **Danger:** `Brick` background, white text. Same shape as Primary.

### Cards / Panels

- Background `Card` (or `Slate` in dark). Radius `1rem` (16px). Border `1px solid Whisper`.
- **Never** use drop shadows. The border IS the elevation.
- Internal padding: `1.5rem` (24px). Generous.

### Inputs

- Label above input. Label is `Inter Tight 500 0.8125rem`, `Slate`.
- Input: `Card` background, `1px Whisper` border, radius `0.625rem`. Height `2.75rem`. Padding `0 0.875rem`.
- Focus: `2px Moss` ring (4px offset, 30% opacity).
- Placeholder: `Slate` 60% opacity.
- Helper text below input: `Slate`, `0.8125rem`.
- Error: helper text becomes `Brick`.

### Tables

- No outer card border around table — the table IS the content.
- Row dividers: `1px solid Linen` between rows only. No column dividers.
- Header row: `Inter Tight 600 0.75rem`, uppercase, tracking `0.08em`, `Slate`. Bottom border `1.5px solid Charcoal` (no `Whisper` — headers are emphatic).
- Cell padding: `0.75rem 1rem`.
- Row hover: `Linen` background.
- Selected row: `Moss at 8% opacity` background, `1.5px Forest` left border.

### Status pills (queue, table states)

- Small caps, `JetBrains Mono 500 0.6875rem` (11px), tracking `0.04em`.
- Padding `0.25rem 0.5rem`, radius `0.375rem` (6px).
- Color logic:
  - **Done / Ready:** `Forest` text on `Sage at 12% opacity` wash
  - **Processing:** `Amber` text on `Amber Wash`
  - **Pending:** `Slate` text on `Linen`
  - **Error / UNCLEAR:** `Brick` text on `Brick Wash`
  - **Empty:** dashed `Whisper` border, `Slate` text

### Modals

- Backdrop: `rgba(31, 32, 36, 0.4)` (Charcoal at 40%) + `backdrop-filter: blur(4px)`.
- Modal: `Card` background, radius `1.25rem`, padding `1.75rem`. Max-width `32rem`.
- No drop shadow. Border `1px solid Whisper` is enough.

### Toasts

- Top-right. `Card` background. Border `1px solid Whisper`. Radius `0.875rem`. Padding `0.875rem 1rem`.
- Icon on left (`Forest` for success, `Brick` for error, `Slate` for info). Text `Inter Tight 500 0.875rem`.
- Slide in from top-right with `cubic-bezier(0.16, 1, 0.3, 1)` over 240ms. Slide out 180ms.
- 4s default duration. Errors stay 6s. No progress bar — visually quiet.

### Empty states

- Centered. `Satoshi 700 1.125rem` headline (`Charcoal`). `Inter Tight 400 0.9375rem` helper (`Slate`).
- A single SVG illustration (16px stroke, `Slate` 40% opacity, max 120px tall). No emoji. No icon libraries.
- One CTA button (Primary). Max width `28rem`.

### Loaders

- Skeletal shimmer matched to final content dimensions. Shimmer: `Whisper` to `Linen` over 1.4s linear, infinite.
- No spinning circles. No "Loading…" text.

---

## 5. Layout Principles

- **Container max-width:** `72rem` (1152px). Centered with `mx-auto px-6`.
- **Section spacing:** `clamp(2.5rem, 6vw, 4rem)` between major sections.
- **Grid:** CSS Grid for layout, Flexbox for component-internal alignment. Never `calc()` percentage hacks.
- **Vertical rhythm:** Use the 4px scale. Allowed: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.
- **No overlapping elements.** Each region has clean boundaries (border OR space, never both layered).
- **No centered Hero** — left-aligned with max-width `42rem` content column on desktop.
- **Form layout:** Label above input. Stack vertically unless you have 4+ fields, then 2-column grid (`grid-cols-1 sm:grid-cols-2`).
- **Cards inside cards are banned.** Flatten the hierarchy.

---

## 6. Responsive Rules

- **Mobile-first.** All multi-column grids collapse to single column below `768px`.
- **Breakpoints:** `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`. Use Tailwind defaults.
- **Typography scales via `clamp()`.** H1: `clamp(2rem, 4vw, 2.75rem)`.
- **Body minimum:** `0.9375rem` (15px). Never go below.
- **Touch targets:** minimum `2.75rem` (44px) for any interactive element.
- **No horizontal scroll** on mobile. Ever.
- **Tables on mobile:** horizontal scroll within a `border-radius: 0.875rem` container. Min-width `720px` inside.

---

## 7. Motion & Interaction

- **Spring physics:** disabled by default. Use `cubic-bezier(0.16, 1, 0.3, 1)` for entry, `cubic-bezier(0.7, 0, 0.84, 0)` for exit. Duration 180–280ms.
- **Hover states:** 120ms ease. Color or background change. No transform except for buttons (active state).
- **Active state:** Buttons translate `Y(1px)` and darken 8%. 80ms.
- **Toasts:** slide in/out as specified.
- **No perpetual loops.** No pulsing dots. No rotating icons. No shimmer on completed items.
- **Stagger:** only on queue/list items entering. 30ms between siblings, max 6 items then cap.
- **Reduced motion:** respect `prefers-reduced-motion`. Disable all transitions for users who request it.

---

## 8. Iconography

- **Library:** `lucide-react`. Single icon family. Stroke width `1.5`. Size `16px` inline, `20px` for nav.
- **Color:** inherit from text color. Never fill icons with accent unless it IS the action.
- **Banned:** emoji as UI elements. No icon fonts (FontAwesome, etc.).

---

## 9. Copy & Microcopy

- **Voice:** Direct, warm, specific. Like a competent colleague, not a chatbot.
- **Banned phrases:** "Elevate your workflow", "Seamless experience", "Next-Gen", "Unlock", "AI-powered magic", "Supercharge", "Revolutionary".
- **Button text:** verb + object. `Create school`, `Upload forms`, `Export CSV`. Not `Submit`, not `Continue`, not `Click here`.
- **Empty states:** state the fact, then offer the action. "No schools yet. Add your first school to begin."
- **Errors:** what happened + what to do. Never apologize. "File is 12MB. Resize to under 10MB and try again."

---

## 10. Anti-Patterns (Banned — explicit AI tells to avoid)

These are the visual defaults that make an interface feel AI-generated. Never do them.

1. **No blue/indigo primary.** The current `#2563eb` / `#3b82f6` is the #1 AI tell. Use `Forest` instead.
2. **No purple gradients** on buttons, cards, or backgrounds.
3. **No drop shadows on cards.** Use borders.
4. **No glassmorphism** (backdrop-blur panels, frosted glass).
5. **No emoji as UI** (✅, 🎉, 🚀, etc. as button content or status). Use words or icons.
6. **No `Inter` font.** Use `Inter Tight` for body, `Satoshi` for display.
7. **No 3-column equal card grids** for features. Use 2-column or asymmetric.
8. **No "Scroll to explore" arrows**, bouncing chevrons, or scroll hints.
9. **No `LABEL // YEAR` formatting** ("SYSTEM // 2024"). Use periods or dashes.
10. **No fabricated metrics** (e.g., "99.9% accuracy"). If a number isn't real, don't show it.
11. **No generic illustrations** (gradient blobs, geometric "AI" art). Use real SVG line illustrations or no illustration.
12. **No fake loading screens** with brand statements. Skeletons only.
13. **No oversized hero sections** that take more than 50% of the first viewport on a tool page. This is a tool, not a landing page.
14. **No modal-on-modal stacking.** One modal at a time.
15. **No Tailwind defaults like `bg-blue-500 hover:bg-blue-600`.** Use semantic tokens (`bg-primary` mapped to `Forest`).
16. **No "centered everything" desktop layouts.** Left-align primary content with a max-width column.
17. **No `tracking-tight` overuse.** Apply only to display headings, not body text.

---

## 11. File Organization

- All colors as CSS variables in `globals.css` under `:root` and `.dark`. Use Tailwind `@theme inline` to map them to utility classes.
- All component files already exist under `src/components/`. Each component owns its styles via Tailwind utilities + the design tokens.
- Fonts loaded once in `app/layout.tsx` via `next/font/google`, exposed as CSS variables (`--font-satoshi`, `--font-inter-tight`, `--font-mono`).

---

## 12. Migration Checklist (from current state)

When redesigning, replace these specific AI-tells from the current codebase:

- [x] `#2563eb` / `#3b82f6` (blue) → `Forest` (`#3D5A40`)
- [x] `#0f172a` (slate-900) → `Ink` (`#1F2024`) — warm charcoal, not cool slate
- [x] `bg-blue-50`, `bg-blue-100`, `text-blue-700`, etc. → muted `Forest` variants
- [x] `rounded-2xl` everywhere → selective: `1rem` for cards, `0.625rem` for inputs/buttons
- [x] `shadow-sm` on cards → `border border-Whisper`
- [x] `Inter` font (default in `Geist` mixin) → `Satoshi` + `Inter Tight`
- [x] `bg-gradient-*` on any UI → solid colors only
- [x] Emoji icons in StatusBar ("⚠️", "✅") → text labels or lucide icons
- [x] `<Sparkles />` icon as marketing flair → remove from header copy
