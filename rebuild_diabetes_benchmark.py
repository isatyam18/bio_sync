from pathlib import Path
import hashlib, json, platform
import pandas as pd
import sklearn
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, balanced_accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

ROOT = Path(__file__).resolve().parent
EVAL = ROOT / 'data' / 'diabetes' / 'evaluation'
OUT = ROOT / 'ml-api' / 'benchmarks' / 'diabetes'
MODEL_DIR = ROOT / 'ml-api' / 'models' / 'diabetes' / 'fair_benchmark'
OUT.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)

FEATURES = ['age', 'bmi', 'HbA1c_level', 'blood_glucose_level']
train = pd.read_csv(EVAL / 'train_transformed.csv')
test = pd.read_csv(EVAL / 'test_transformed.csv')
X_train, y_train = train[FEATURES].to_numpy(), train['diabetes'].to_numpy()
X_test, y_test = test[FEATURES].to_numpy(), test['diabetes'].to_numpy()

models = {
    'LogisticRegression': LogisticRegression(class_weight='balanced', max_iter=2000, random_state=42),
    'RandomForest': RandomForestClassifier(n_estimators=200, max_depth=8, class_weight='balanced', random_state=42, n_jobs=-1),
}

rows = {}
for name, model in models.items():
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    prob = model.predict_proba(X_test)[:, 1]
    tn, fp, fn, tp = confusion_matrix(y_test, pred).ravel()
    rows[name] = {
        'accuracy': float(accuracy_score(y_test, pred)),
        'balanced_accuracy': float(balanced_accuracy_score(y_test, pred)),
        'precision': float(precision_score(y_test, pred, zero_division=0)),
        'sensitivity': float(recall_score(y_test, pred, zero_division=0)),
        'specificity': float(tn / (tn + fp)) if (tn + fp) else None,
        'f1': float(f1_score(y_test, pred, zero_division=0)),
        'roc_auc': float(roc_auc_score(y_test, prob)),
        'tn': int(tn), 'fp': int(fp), 'fn': int(fn), 'tp': int(tp),
    }
    import joblib
    joblib.dump(model, MODEL_DIR / f'{name}.joblib')


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

provenance = {
    'description': 'Same-feature benchmark for direct classical-vs-hybrid-QML comparison.',
    'features': FEATURES,
    'train_samples': int(len(train)),
    'test_samples': int(len(test)),
    'test_positive_count': int(y_test.sum()),
    'test_positive_rate': float(y_test.mean()),
    'split_files': {
        'train_transformed.csv': sha256(EVAL / 'train_transformed.csv'),
        'test_transformed.csv': sha256(EVAL / 'test_transformed.csv'),
    },
    'training': {
        'LogisticRegression': {'class_weight': 'balanced', 'max_iter': 2000, 'random_state': 42},
        'RandomForest': {'n_estimators': 200, 'max_depth': 8, 'class_weight': 'balanced', 'random_state': 42},
    },
    'software': {'python': platform.python_version(), 'scikit_learn': sklearn.__version__},
}

payload = {'provenance': provenance, 'models': rows}
(OUT / 'fair_same_feature_benchmark.json').write_text(json.dumps(payload, indent=2))
print(json.dumps(payload, indent=2))
