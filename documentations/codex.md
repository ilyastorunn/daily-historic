# Codex Design Rules

## Design North Star
- Build a minimal, cool, and aesthetic experience where content breathes.
- Let historical stories feel cinematic without clutter.
- Emphasize clarity, contrast, and confident whitespace.

## Visual Language
- **Palette**: Neutral base (soft charcoal, warm off-white) with a single accent per screen (muted teal, deep amber, or electric indigo). Avoid gradients unless they support hero imagery.
- **Typography**: Pair a clean sans-serif for UI (e.g., Inter) with a distinctive serif accent for headlines (e.g., Libre Baskerville). Maintain generous line height and limit to two weights per view.
- **Imagery**: Favor editorial photography, archival textures, or monochrome illustrations with subtle grain. Crop tightly to create focus. Never use generic stock art.
- **Iconography**: Simple, thin-line icons with rounded terminals. Use sparingly and only to support comprehension.
- **Motion**: Micro-interactions <250ms. Ease-out curves. Avoid gratuitous transitions; animations must reinforce context (e.g., timeline sweep, card lift).

## Layout & Spacing
- Grid: 8pt base with 24/40pt gutters on desktop, 16pt margins on mobile.
- Keep single-column layouts on mobile; introduce max two columns on tablet/desktop.
- Provide breathing room around hero content; no element should touch edges.

## Content Hierarchy
- Lead with Today’s Hero event. Supportive modules should ladder in relevance (For You, Categories, Collections).
- Maintain consistent card structure: year badge, headline, 2-line summary, actions.
- Limit copy to clear, factual statements; optional “Did you know?” tags can add flavor.

## Interaction Rules
- Primary CTAs are filled accent buttons with 4px radius; secondary actions use ghost style.
- Always show state feedback: hover tint, pressed inset, loading spinners <1s.
- Save/share icons animate subtly (scale 1.05) and confirm with toast.
- Use light/dark toggle with preference stored; ensure color ratios meet WCAG AA in both modes.

## Design Tokens
- Source shared color, spacing, radius, and typography tokens from `theme/tokens.ts`.
- Treat `lightTheme` as the baseline palette; dark mode variants live alongside for future rollout.
- Never hardcode hex values in screens—extend tokens when new primitives are needed.
- Consume spacing scale for padding/gaps; if a size is missing, add to the token map before use.

## Accessibility
- Minimum contrast ratio 4.5:1 for text, 3:1 for large display type.
- Keyboard focus ring 2px accent outline with 4px offset.
- All imagery requires alt text; decorative visuals flagged as such.
- Support dynamic type scaling to 200% without layout breakage.

## Copy & Tone
- Confident, informed, and concise. Avoid academic jargon.
- Use present tense: “Discover today’s breakthroughs.”
- Titles max 60 characters; body copy max 120 characters per block.

## Component Guidelines
- **Timeline Chip**: Pill-shaped with subtle drop shadow; active state fills accent; inactive only border.
- **Event Card**: 12pt radius, soft shadow (0 8 24 rgba 0,0,0,0.08), image banner optional top.
- **Streak Tracker**: Linear progress with glow on completion; no badges overloaded with text.
- **Notifications Modal**: Minimal copy, 1 CTA primary, 1 tertiary link; include illustration with <30% screen occupancy.

## Do & Don’t
- **Do**: Keep surfaces calm, highlight one hero element per screen, use whitespace as design tool, rely on data-driven priority.
- **Don’t**: Stack multiple accent colors, overload text blocks, add skeuomorphic treatments, or trigger motion without purpose.

## Craft Rituals
- Audit every screen at 1x and 0.5x zoom—legibility and balance must hold.
- Run contrast checks before sign-off.
- Prototype with real content, not lorem ipsum.
- Document rationale alongside components to stay intentional.
