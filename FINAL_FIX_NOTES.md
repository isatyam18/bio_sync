# BioSync partner hardening notes

## This pass
- Corrected the Diabetes same-feature benchmark evaluation-set mismatch.
- Retrained same-feature Logistic Regression and Random Forest baselines on the exact supplied 98,000-row training split and exact supplied 1,000-row test split.
- Preserved the supplied hybrid-QML test metrics as source evidence rather than pretending to reproduce an unavailable training implementation.
- Added benchmark provenance, split hashes, class prevalence and reproducibility script.
- Separated Diabetes production eight-feature metrics from the direct four-feature quantum comparison in the UI and PDF report.
- Added a working assessment route for both doctors and patients.
- Added Run Assessment from the patient detail page.
- Fixed the previously dead New Assessment route.
- Dashboard now counts grouped assessment IDs rather than individual model rows.
- Restricted model metadata/evaluation endpoint to doctors.
- Added assessment rate limiting and prediction timeouts.
- Added stronger production session-secret requirements and proxy trust handling.
- Added quantum architecture/provenance visualization.
- Removed unsupported clinical wording from the hero.
- Removed dead footer links.
- Preserved existing visual language, MongoDB/session architecture, patient ownership, doctor scoping and result/report layout.
- Cardiovascular artifacts were preserved pending the improved Heart hybrid package.
- Breast Cancer is not part of the current product flow.

## Evidence checks
- Supplied Diabetes production Logistic Regression and Random Forest artifacts reproduce the supplied test metrics exactly on the supplied test split.
- Fair benchmark baselines are reproducible via `rebuild_diabetes_benchmark.py`.
- Supplied QML metrics are traceable to `ml-api/benchmarks/diabetes/test_results.csv`.
- QML training source remains absent; the live QML runtime is explicitly labelled as artifact reconstruction.

## Validation limitation
Full Next.js dependency installation/build was not run in this offline container because frontend packages are not installed locally and package-network access is unavailable. TypeScript/TSX source was syntax-transpiled successfully, and backend/Python syntax checks passed.
