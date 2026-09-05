"""Reproduce the supplied Diabetes production metrics from serialized models."""
from pathlib import Path
import json
import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, balanced_accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

ROOT = Path(__file__).resolve().parent
TEST = pd.read_csv(ROOT / 'data/diabetes/evaluation/test_transformed.csv')
X = TEST.drop(columns=['diabetes'])
y = TEST['diabetes'].to_numpy()
expected = json.loads((ROOT / 'ml-api/model_metrics.json').read_text())['diabetes']['production_test_set']['models']

for name, filename in [('LogisticRegression', 'logistic_regression.pkl'), ('RandomForest', 'random_forest.pkl')]:
    model = joblib.load(ROOT / 'ml-api/models/diabetes' / filename)
    pred = model.predict(X)
    prob = model.predict_proba(X)[:, 1]
    tn, fp, fn, tp = confusion_matrix(y, pred).ravel()
    actual = {
        'accuracy': accuracy_score(y, pred),
        'balanced_accuracy': balanced_accuracy_score(y, pred),
        'precision': precision_score(y, pred, zero_division=0),
        'sensitivity': recall_score(y, pred, zero_division=0),
        'specificity': tn / (tn + fp),
        'f1': f1_score(y, pred, zero_division=0),
        'roc_auc': roc_auc_score(y, prob),
        'tn': tn, 'fp': fp, 'fn': fn, 'tp': tp,
    }
    for key, value in actual.items():
        tolerance = 1e-12 if isinstance(value, float) else 0
        assert abs(value - expected[name][key]) <= tolerance, (name, key, value, expected[name][key])
    print(f'{name}: PASS')
print('Diabetes production evidence verification: PASS')
