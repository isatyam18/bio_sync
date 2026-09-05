# BioSync Hackathon-Partner Audit Evidence

## 1. Problem-statement evidence
The SIH Buddy analysis for SIH26139 explicitly calls for:
- a hybrid classical-preprocessing + quantum-classifier pipeline on a simulator;
- an explainability module;
- accuracy, sensitivity and specificity;
- a direct classical comparison on identical features;
- a visible quantum circuit/feature-encoding explanation.

Source checked: `https://www.sihbuddy.in/ps/SIH26139` on 2026-09-05.

## 2. Diabetes dataset evidence
Supplied source: `data/diabetes/diabetes_prediction_dataset.csv`

Verified:
- 100,000 rows
- 8 predictive fields + target
- no missing values in the supplied CSV
- positive prevalence about 8.5%

Supplied transformed evaluation split:
- train: 98,000 rows
- validation: 1,000 rows
- test: 1,000 rows
- test positives: 85 / 1,000 = 8.5%

SHA-256:
- `train_transformed.csv`: `69439e6b38e506db233c8944e8d248ebcd9304dc5571a7d2e531a9717a016be1`
- `test_transformed.csv`: `1c4e19f3f6072235d307abd4a566c769d661eeea865e7387c5bdd4af93f3d8f3`

## 3. Production model verification
The supplied 8-feature Logistic Regression and Random Forest artifacts were independently executed against the supplied 1,000-row test split.

The reproduced values exactly match the supplied `test_results.csv` / model evidence:

| Model | Accuracy | Sensitivity | Specificity | F1 | ROC-AUC | TN | FP | FN | TP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Logistic Regression | 0.884 | 0.906 | 0.882 | 0.570 | 0.963 | 807 | 108 | 8 | 77 |
| Random Forest | 0.929 | 0.847 | 0.937 | 0.670 | 0.972 | 857 | 58 | 13 | 72 |

This is a strong evidence check because the saved artifacts reproduce the supplied test metrics rather than merely trusting a JSON table. The executable check is included as `verify_diabetes_evidence.py`.

## 4. Fair classical-vs-QML benchmark correction
The first hardened build contained a fair-benchmark metrics table whose saved baseline artifacts did not reproduce the listed values on the actual supplied test split. The root cause was an evaluation-set mismatch: the old table contained 83 positive cases while the supplied held-out test split contains 85.

This version removes that mismatch.

The fair benchmark now:
- uses the exact supplied 98,000-row training split;
- uses the exact supplied 1,000-row test split;
- uses exactly the four QML numeric features;
- retrains Logistic Regression and Random Forest with documented settings;
- preserves the supplied QML test evidence as a separate provenance-tracked row.

### Independently retrained fair baselines
| Model | Accuracy | Sensitivity | Specificity | F1 | ROC-AUC | TN | FP | FN | TP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Logistic Regression | 0.875 | 0.882 | 0.874 | 0.545 | 0.960 | 800 | 115 | 10 | 75 |
| Random Forest | 0.885 | 0.906 | 0.883 | 0.572 | 0.975 | 808 | 107 | 8 | 77 |

Training settings are stored in `ml-api/benchmarks/diabetes/fair_same_feature_benchmark.json` and can be reproduced with `rebuild_diabetes_benchmark.py`.

### Supplied QML evidence
The supplied `test_results.csv` reports:

| Model | Accuracy | Sensitivity | Specificity | F1 | ROC-AUC | TN | FP | FN | TP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Finetuned Hybrid QML | 0.828 | 0.776 | 0.833 | 0.434 | 0.882 | 762 | 153 | 19 | 66 |

These values are retained as **supplied source evidence**. They are not described as independently reproduced because the original QML training source is absent.

## 5. QML provenance finding
The supplied QML artifact contains:
- 4 qubits
- 3 layers
- 24 trainable quantum parameters
- validation AUC ≈ 0.8648
- decision threshold ≈ 0.53
- trained weights
- classical head weights

It does **not** contain the original training-source code. The application therefore labels its live circuit as an artifact reconstruction. This prevents an unsupported claim of exact training-source reproduction.

The supplied QML training history also reports:
- train ROC-AUC: 0.887
- validation ROC-AUC: 0.8648
- test ROC-AUC: 0.8817
- train-validation gap: 0.022

## 6. Model comparison interpretation
The evidence does not show quantum advantage on the supplied Diabetes benchmark:
- same-feature Random Forest ROC-AUC: 0.975 (independently retrained)
- supplied hybrid QML ROC-AUC: 0.882

BioSync therefore does **not** claim that quantum is better. The product frames the quantum layer as the experimental hybrid component required by the problem statement and reports the comparison honestly.

## 7. Application-flow audit fixes
The hardened build also addresses basic product flaws found during the partner audit:
- added a working Run Assessment route for doctor and patient flows;
- fixed the dead New Assessment link;
- grouped multiple model rows under one assessment on the dashboard;
- made dashboard assessment counts count assessment IDs rather than individual model rows;
- restricted model-metadata endpoint to doctors;
- added prediction rate limiting;
- strengthened production session-secret requirements;
- added prediction timeouts and graceful partial-model failure handling;
- separated Diabetes production metrics from the direct same-feature quantum benchmark;
- added visible quantum-architecture provenance in the doctor result view;
- removed fake footer links / replaced them with real anchors or non-clickable project notices;
- removed unsupported clinical wording from the hero;
- kept the existing visual language and MongoDB/session architecture;
- retained Cardiovascular + Diabetes only; Breast Cancer is absent from product references.

## 8. Remaining explicit blocker
The improved Heart/Cardiovascular hybrid artifact from the ML team is still pending. Once supplied, it must replace the current cardiovascular quantum artifact and go through the same evidence audit before the final SIH archive is declared final.
