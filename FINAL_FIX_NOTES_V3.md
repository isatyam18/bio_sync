# BioSync V3 Result/PDF Fixes

## User-requested fixes
- Kept existing UI/UX, database, authentication, and backend architecture intact.
- Removed the small bullet dots from the landing-page feature strip.
- Kept the site content focused; no new data-entry fields were added.
- Added an explicit Quantum Model Result card so a returned QSVM/Hybrid-QML result is visible independently of the classical summary.
- If the quantum model fails, the UI now says it did not return a result instead of silently looking like it was omitted.

## Quantum execution fix
The Diabetes hybrid-QML path previously ran once for the prediction and then was rerun once per numeric feature during the local-sensitivity explanation (four extra QML executions). This could make an assessment unnecessarily slow and could cause the quantum result to appear missing/time out.

V3 computes local sensitivity only for the classical models and runs the hybrid QML model once per assessment. This does not fabricate or replace the quantum output.

The cardiovascular QSVM remains the supplied quantum-kernel model and is not replaced by a classical fallback.

## PDF fixes
- Reworked PDF pagination into three deliberate sections/pages: summary/results, explanation/evaluation, history/trend.
- Removed fragile table auto-page-breaking that could leave tables and following content overlapping.
- Fixed table widths to remain inside A4 content width.
- Dedicated the assessment trend graph to the history page so it cannot be pushed into a partially occupied area.
- Added clear chart interpretation text.
- Removed bullet glyphs from submitted-value indicators.

## Verification
- `node --check backend/routes/patients.js`: PASS
- `python -m py_compile ml-api/main.py`: PASS
- `python verify_diabetes_evidence.py`: PASS for supplied Diabetes production evidence
- No Breast Cancer references found in active source text.


## V3.1 quantum execution hardening
- The Diabetes Finetuned Hybrid QML path no longer depends on the Torch/PennyLane interface for inference.
- PennyLane `default.qubit` is used when available; if the local PennyLane runtime is unavailable or incompatible, the same documented 4-qubit reconstructed circuit is executed by a dependency-light statevector simulator.
- This fallback is quantum simulation, not a classical replacement.
- Added `ml-api/qml_smoke_test.py` to verify that the Finetuned Hybrid QML model returns a prediction and probability.
- The application therefore does not intentionally display `Not run / Unavailable` merely because PennyLane's interface stack is unavailable.
