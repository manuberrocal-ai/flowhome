# FlowHome Brand Guidelines

## Primary wordmark

Use the approved panoramic PNG wordmark at `public/images/flowhome-logo.png` (1076:250) as the master asset. Preserve its aspect ratio and keep it legible at a rendered width of approximately 170–195 px in compact navigation contexts.

For responsive header and footer delivery, use `public/images/flowhome-logo-430.png` (430:100), a LANCZOS-resampled derivative of the master. The master remains the fallback and the source of truth; responsive markup may select the derivative through `srcset` without changing the wordmark geometry or identity.

The square mark assets are reserved for icon contexts such as favicons, app surfaces, and compact avatars. Do not use the mark as a substitute for the primary wordmark in header or footer placements.

## Usage rules

- Keep clear space around the wordmark equal to at least the height of the capital letter in the rendered mark.
- Do not squash, stretch, crop, recolor, or otherwise distort the wordmark.
- Use the current FlowHome palette and design tokens; do not introduce arbitrary brand colors.
- Typography uses self-hosted, Latin-only Inter Variable for body copy and Plus Jakarta Sans Variable for headings. Both use `font-display: swap` and are preloaded from the local Vite build so the intended brand typography arrives promptly without third-party font requests. Do not substitute arbitrary families or add CDN font requests.
- Preserve readable contrast, meaningful alt text, keyboard access, and reduced-motion behavior for branded UI.

## Visual surfaces and motion

- Use `.brand-aurora-surface` for dark editorial surfaces: the home hero, deal radar, shortlist confidence, newsletter, account hero, and footer. It provides static layered navy, blue, cyan, and grid treatments only; it must not add scroll behavior, parallax, or fixed backgrounds. Use `.brand-aurora-surface--account` for the account-specific color balance.
- Use `.brand-sheen` on primary interactive surfaces. The finite sheen is available on hover and keyboard `:focus-within`; `.premium-action` shares the same treatment. Keep transitions at or below 300 ms and disable non-essential motion under `prefers-reduced-motion`.
- The hero rating stars may use the one-shot `brand-star-reveal` stagger. It is never infinite and is disabled for reduced-motion preferences.

## Translation privacy exception

The former floating Google Translate interface is intentionally not restored. FlowHome does not load Google Translate or external translation UI because it would add third-party requests and expose browsing context outside the current consent and privacy model.
