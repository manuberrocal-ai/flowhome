# FH23Q/R — early discovery of the canonical PNG favicon

Change: preload the existing PNG as an image at low priority. The normal icon
link remains present. No binary, size, pixel, alpha or visual identity change.
SHA256 remains722a506aece70f033d8c51839e2ae5af98f094c699f5387100610ddbda8f4186.

Recomputation of the preserved Lighthouse trace exactly reproduces LCP2625.362ms:
the final simulated node is the late High/Other favicon request, not the H1
font. This is model attribution, not proof that the tab icon physically blocks
page paint. The preload advances discovery without hiding the icon from tests.

## Validation and limits

- Initial one-sample LCP2268.255ms was not treated as release approval.
- Full Brave12-sample run: LCP2118–2275ms, but homepage performance87/TBT353ms
  and product TBT273ms fail. These failures are retained, not deleted.
- Directed Brave3-sample run with traces: LCP2270.925ms/TBT0. It does not
  reproduce or replace the earlier full failure.
- Independent installed Chrome152.0.7977.84, same build and unchanged budgets,
  full4 routes ×3 samples: performance97/98/98/99; LCP2277.0317/2193.6537/
  2193.103/2120.761ms; all median TBT0/CLS0; accessibility/best-practices/SEO100.
  All12 samples complete; four post-report cleanup warnings. No failed budget.
- Both full runs transfer exactly one complete PNG body plus127 bytes in the
  second request per sample. Do not claim a single request or universal caching.
- Tests1068 pass; lint and diff pass; types466 files:0 errors/0 warnings/20 hints.
  Build88 and SEO88 pass. Prior FH23P browser142/142 covers unchanged visual and
  interaction source; the additional preload is covered by transfer and PNG tests.

The runner now passes --save-assets so future failures preserve trace and
devtoolslog beside each report. Budgets, isolation and sample selection remain
unchanged. Existing output retention applies to these larger evidence directories.

APROBADO LOCAL in the measured Chrome profile; Brave variability unresolved.
Not field CWV/INP, provider activation, remote review approval or deployment.
Evidence: C:/AGENTES/Informes/flowhome/fh23r-chrome-full-20260912/ and
C:/AGENTES/Informes/flowhome/fh23q-favicon-full-20260912/.
