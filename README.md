# BioSync — Hybrid ML/QML Health Risk Assessment

BioSync is a disease-specific, model-based risk-assessment workflow with separate patient and doctor views.

## Supported conditions
- Cardiovascular
- Diabetes

Breast Cancer is **not** part of the current product build.

## Architecture
Browser → Next.js frontend → Express backend → MongoDB ↔ FastAPI ML API

Each patient profile has a `condition`, so the backend sends only the matching feature contract to the matching model set.

## Diabetes evidence
The supplied Diabetes package contains:
- Logistic Regression
- Random Forest
- Finetuned Hybrid QML
- held-out train/validation/test transformed splits
- QML threshold search
- QML training history
- efficiency benchmark
- supplied QML benchmark evidence

### Production Diabetes baselines
These use the full eight-feature production contract:

`gender, age, hypertension, heart_disease, smoking_history, bmi, HbA1c_level, blood_glucose_level`

On the supplied 1,000-row held-out test split:

| Model | Accuracy | Sensitivity | Specificity | F1 | ROC-AUC |
|---|---:|---:|---:|---:|---:|
| Logistic Regression | 88.4% | 90.6% | 88.2% | 57.0% | 0.963 |
| Random Forest | 92.9% | 84.7% | 93.7% | 67.0% | 0.972 |

### Direct classical vs hybrid-QML benchmark
The direct comparison uses the **same four numeric features** used by the supplied QML artifact:

`age, bmi, HbA1c_level, blood_glucose_level`

The same held-out test split is used for all three rows. Logistic Regression and Random Forest are independently retrained from the supplied 98,000-row training split with `class_weight=balanced`, `random_state=42`; the QML row is preserved from the supplied QML test evidence.

| Model | Accuracy | Sensitivity | Specificity | F1 | ROC-AUC |
|---|---:|---:|---:|---:|---:|
| Logistic Regression | 87.5% | 88.2% | 87.4% | 54.5% | 0.960 |
| Random Forest | 88.5% | 90.6% | 88.3% | 57.2% | 0.975 |
| Finetuned Hybrid QML | 82.8% | 77.6% | 83.3% | 43.4% | 0.882 |

The QML row is **not presented as independently reproduced** because the original QML training source is not included in the supplied artifact. This is deliberate evidence hygiene, not a hidden limitation.

## Diabetes hybrid-QML runtime
The `Finetuned Hybrid QML` model is executable in the application. Its serialized artifact is loaded at startup and the saved quantum weights plus classical head are used for inference.

Runtime order:
1. Standardize the four quantum inputs.
2. Apply the supplied quantum MinMax scaling range.
3. Run the documented 4-qubit / 3-layer reconstructed circuit on a simulator.
4. Feed the four quantum expectation values into the serialized 4→8→1 classical head.
5. Apply the supplied decision threshold (≈0.53).

PennyLane `default.qubit` is preferred when available. A dependency-light local 4-qubit statevector implementation executes the same documented reconstructed circuit if PennyLane is unavailable or incompatible. This fallback is still quantum simulation; it is not a classical replacement. The original QML training source was not bundled, so the runtime is not described as exact training-source reproduction.

Quick check:
```bash
cd ml-api
python qml_smoke_test.py
```

## Explainability
BioSync distinguishes two things:

1. **Submitted-value indicators** — directly derived from entered patient values. These are not model-attribution scores.

## Quantum transparency
The doctor view exposes the serialized quantum configuration and its provenance. For Diabetes the supplied artifact records 4 qubits, 3 layers and 24 trainable quantum parameters. Because the original QML training source was not bundled, the live circuit is explicitly labelled as an artifact reconstruction until the training source/replacement artifact is supplied.

For Cardiovascular, the current bundle records a 6-feature quantum-kernel configuration with one repetition and linear entanglement. The bundle does not serialize the original feature-map class, so the runtime documents that reconstruction rather than claiming exact training-source provenance.

## Clinical-safety framing
- Positive/negative is a model class label, not a diagnosis.
- Model-derived percentages are not presented as clinically validated probabilities.
- Risk bands are display-only product bands, not clinically validated thresholds.
- Patients receive a risk-band communication and recommended professional follow-up, not detailed model internals.
- Doctors receive detailed model comparison, evidence and reports.

## Security and reliability basics
- Session authentication with Mongo-backed sessions
- Password hashing with bcrypt
- Patient records scoped by owner at the backend
- Doctor-only model metadata/report access
- Backend feature validation
- Authentication and prediction rate limiting
- Production session-secret guard
- Helmet security headers
- Graceful model-service failure handling
- Assessment IDs group model outputs into one assessment

## Reproduce the Diabetes fair benchmark
From the project root:

```bash
python rebuild_diabetes_benchmark.py
```

The script uses the supplied transformed train/test files and writes:

`ml-api/benchmarks/diabetes/fair_same_feature_benchmark.json`

It also writes the retrained fair-baseline artifacts into:

`ml-api/models/diabetes/fair_benchmark/`

## Final pending input
The current cardiovascular hybrid package from the ML team is bundled as `ml-api/models/hybrid_cardio_70k.joblib`. The `heart_multisite` hybrid artifact is retained as benchmark evidence because it does not bundle a live quantum SVC object.

## V3 result/PDF fixes
- Quantum result is surfaced explicitly on the patient result page.
- Diabetes hybrid-QML is no longer rerun four extra times for sensitivity explanations.
- PDF tables use controlled pagination and the assessment trend chart is placed on a dedicated history page.
- Landing-page feature bullets/dots were removed without changing the overall visual design.
