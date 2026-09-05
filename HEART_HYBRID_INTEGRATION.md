# Cardiovascular Hybrid Model Integration

## Supplied artifacts
- `ml-api/models/hybrid_cardio_70k.joblib`
- `ml-api/models/hybrid_heart_multisite.joblib`
- `ml-api/benchmarks/heart/my_benchmark_results.csv`

## Live product path
The cardiovascular assessment uses `hybrid_cardio_70k.joblib`.

The artifact contains:
- raw feature order: age, gender, height, weight, ap_hi, ap_lo, cholesterol, gluc, smoke, alco, active, bmi
- classical XGBoost branch with StandardScaler + PCA
- precomputed-kernel QSVM branch
- Platt calibration for the quantum decision score
- classical/quantum blend weight
- held-out test metrics

The runtime reconstructs the serialized quantum feature map using the artifact's recorded configuration. It does not claim that this is the original training source.

## Multisite artifact
`hybrid_heart_multisite.joblib` is bundled as benchmark evidence. Its serialized object does not contain a live `qsvm_sk_model`, so it is not used for live patient prediction. Its benchmark results are kept in `my_benchmark_results.csv`.

## Benchmark values supplied by the ML team
The benchmark CSV is copied without changing its values. It contains results for:
- `cardio_70k`: RandomForest, SVM, XGBoost, QSVM, Hybrid
- `heart_multisite`: RandomForest, SVM, XGBoost, QSVM, Hybrid

The application does not claim quantum advantage from these results.
