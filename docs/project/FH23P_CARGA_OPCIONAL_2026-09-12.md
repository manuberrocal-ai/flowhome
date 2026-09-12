# FH23P — disabled optional runtime is not loaded

Base: a9a66a5762c8f4b21533d091f11531b8cf806f45. Local change only.

BaseLayout previously initialized analytics and experiments even when the
validated analytics configuration was disabled. Empty provider IDs prevented
remote scripts, not initialization and consented local attribution.

The new initializer checks validated analyticsEnabled before dynamic imports.
Experiments additionally require both existing experiment flags. Optional
download/setup failures resolve without interrupting independent image fallback
and cart functionality. No provider, experiment, account or publication is enabled.

Five new behavioral tests cover disabled downloads, approved configuration,
ordering and both failure boundaries. Thirty focused tests and the full suite
pass; lint passes; types:466 files,0 errors,0 warnings,20 existing hints.
Build88 and SEO88 pass. Browser142/142,91HTTP,0 setup/cleanup errors; disabled
consent-event case checks zero events and zero optional-module downloads.
Enabled provider delivery remains unverified; mock tests are not real integration.

The first paired homepage sample transfers23,124 script bytes across14 requests
versus27,993 across15 before the change. This is a payload observation, not a
field metric or proof of LCP improvement. Release LCP remains unapproved.
No imagery or visual design changes. Canonical PNG favicon is preserved.

Targeted homepage three-sample median: performance96, accessibility100,
best-practices100, SEO100, LCP2617.949ms, CLS0/TBT0, INP unavailable.
One budget failure and two post-report cleanup warnings. No proven LCP gain;
do not repeat the full matrix or approve release from this targeted result.
