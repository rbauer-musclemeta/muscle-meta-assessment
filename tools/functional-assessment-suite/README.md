# MM™ Functional Assessment Suite

Standalone, single-file HTML tool (`index.html`) for administering four validated
physical performance measures in clinic:

- 6-Minute Walk Test (aerobic capacity)
- 30-Second Sit-to-Stand (lower-body power)
- Timed Up-and-Go (agility & fall-risk)
- Handgrip Strength (muscular vigor / sarcopenia screen)

Enter age (40–85) and sex once and every test's reference range updates
automatically. Each test includes an on-screen timer/stopwatch, live
comparison against the age/sex reference, a running local assessment
history (saved in the browser via `localStorage`), and a **Download PDF
report** button (via jsPDF, loaded from cdnjs) that produces a clinical
one-pager with the client's results, reference comparison, interpretation,
citations, and disclaimer.

Reference values and citations are documented on-page and in the generated
PDF. See the in-app note box for full sourcing (Rikli & Jones, Bohannon,
Enright & Sherrill, Dodds et al., EWGSOP2) — this tool does not claim
ACSM-published numeric norms; it follows the functional/frailty screening
approach described in ACSM's Guidelines for Exercise Testing and
Prescription while citing the primary validated instruments for each test.

## Deploying to Netlify

This folder is self-contained (no build step, no dependencies beyond the
Google Fonts and jsPDF CDN scripts loaded in `index.html`). To deploy:

- **Netlify CLI:** `netlify deploy --dir=tools/functional-assessment-suite --prod`
- **Netlify UI:** drag-and-drop this folder in "Sites → Add new site → Deploy manually"
- **Git-linked site:** point the Netlify site's base directory to
  `tools/functional-assessment-suite` with an empty build command and
  publish directory `.`

No environment variables or backend are required.
