# BioSync Final Fixes After Team Review

- Removed the extra local sensitivity explanation from the patient result UI.
- Removed local sensitivity calculation from the ML API. Prediction no longer runs perturbation-based explanation checks.
- Removed local sensitivity section from generated PDF reports.
- Kept one quantum/hybrid model per condition: supplied Cardiovascular Hybrid Quantum model and Finetuned Hybrid QML for Diabetes.
- Kept classical model comparison because it is part of the benchmark/evaluation workflow.
- Added a real `metricRows()` helper so PDF report generation no longer throws `ReferenceError: metricRows is not defined`.
- Duplicate patient IDs now return a clear HTTP 409 message instead of a generic server error.
- Breast Cancer is not exposed in the current product build because no validated Breast Cancer prediction model is bundled.
- Existing prediction/history data remains backward compatible; old stored explanation fields are ignored by the UI/report.

Important: `Sensitivity` in the evaluation metrics table is a standard model-performance metric. It is not the removed local sensitivity explanation/"points" section.
