# FlowHome Brand Guidelines

## Primary wordmark

Use the approved panoramic PNG wordmark at `public/images/flowhome-logo.png` (1076:250) as the master asset. Preserve its aspect ratio and keep it legible at a rendered width of approximately 170–195 px in compact navigation contexts.

For responsive header and footer delivery, use `public/images/flowhome-logo-430.png` (430:100), a LANCZOS-resampled derivative of the master. The master remains the fallback and the source of truth; responsive markup may select the derivative through `srcset` without changing the wordmark geometry or identity.

The square mark assets are reserved for icon contexts such as favicons, app surfaces, and compact avatars. Do not use the mark as a substitute for the primary wordmark in header or footer placements.

## Usage rules

- Keep clear space around the wordmark equal to at least the height of the capital letter in the rendered mark.
- Do not squash, stretch, crop, recolor, or otherwise distort the wordmark.
- Use the current FlowHome palette and design tokens; do not introduce arbitrary brand colors.
- Typography uses self-hosted, Latin-only Inter Variable for body copy and Plus Jakarta Sans Variable for headings. Both use `font-display: optional` to avoid a late font swap during LCP. Do not substitute arbitrary families or add CDN font requests.
- Preserve readable contrast, meaningful alt text, keyboard access, and reduced-motion behavior for branded UI.
