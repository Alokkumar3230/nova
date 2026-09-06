# Design Brief

## Direction

NOVA — a calm, focused project-management workspace built on a cool off-white base with a deep ocean-blue primary and cool teal accent, engineered for dense Kanban, dashboard, and project views.

## Tone

Refined minimalism with deliberate restraint — productivity-first, airy whitespace balanced against data-dense cards, no decoration beyond subtle elevation and a single gradient accent.

## Differentiation

The deep ocean-blue + teal pairing on a cool grey-white canvas reads as premium and trustworthy without the generic bright-blue SaaS cliché; Space Grotesk display headings give every board a distinctive, technical edge.

## Color Palette

| Token      | OKLCH          | Role                              |
| ---------- | -------------- | --------------------------------- |
| background | 0.98 0.008 230 | Cool off-white app canvas         |
| foreground | 0.18 0.015 230 | Primary text                      |
| card       | 1.0 0.004 230  | Card/board surfaces               |
| primary    | 0.42 0.14 240  | Deep ocean blue — CTAs, active    |
| accent     | 0.6 0.15 170   | Cool teal — highlights, focus     |
| muted      | 0.94 0.01 230  | Secondary surfaces                |
| success    | 0.6 0.16 150   | Done / complete states            |
| warning    | 0.72 0.15 85   | Overdue / priority flags          |
| destructive| 0.55 0.22 25   | Delete / destructive actions      |

Dark mode inverts lightness (background 0.145 0.014 245) with luminous primary 0.72 0.15 240.

## Typography

- Display: Space Grotesk — headings, board titles, hero
- Body: DM Sans — UI text, labels, descriptions
- Mono: JetBrains Mono — due dates, IDs, metadata
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, h2 `text-2xl font-semibold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm text-base`

## Elevation & Depth

Cards sit on `bg-card` with `shadow-subtle`, lifting to `shadow-elevated` on hover; the sidebar is a distinct `bg-sidebar` surface separated by `border-r`, and depth comes from layered surfaces rather than gradients.

## Structural Zones

| Zone    | Background      | Border    | Notes                          |
| ------- | --------------- | --------- | ------------------------------ |
| Sidebar | bg-sidebar      | border-r  | Persistent nav, active accent  |
| Header  | bg-card         | border-b  | Logo, search, user menu        |
| Content | bg-background   | —         | Kanban columns on bg-muted/40  |
| Footer  | bg-muted/40     | border-t  | Subtle, low emphasis           |

## Spacing & Rhythm

Generous section gaps (`gap-6`) with tight micro-spacing (`gap-2`/`gap-3`) inside cards; Kanban columns use `p-3` gutters and cards `p-4`, keeping dense data readable.

## Component Patterns

- Buttons: `rounded-md`, primary `bg-primary text-primary-foreground`, hover `bg-primary/90`, destructive `bg-destructive`
- Cards: `rounded-lg bg-card shadow-subtle`, hover `shadow-elevated`, border `border-border`
- Badges: `rounded-full`, soft fills — success/warning/destructive tinted by priority and status

## Motion

- Entrance: `animate-card-in` (fade + 8px rise, 0.35s) on boards and lists
- Hover: `transition-smooth` lift on cards, shadow elevation 0.3s
- Decorative: none — restraint for a productivity tool

## Constraints

- Token-only styling — no raw hex/rgb literals or arbitrary Tailwind values in components
- 3–5 color families max; use primary sparingly for CTAs and active states
- Overdue tasks always flagged with `text-destructive` + warning badge
- AA+ contrast in both light and dark modes

## Signature Detail

A single `text-gradient` primary→teal accent reserved for the NOVA wordmark and key hero numbers, giving the otherwise-calm workspace one memorable focal point.
