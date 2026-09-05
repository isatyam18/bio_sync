from pathlib import Path
import json
from typing import Literal, Optional
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / "models"
DIAB_DIR = MODEL_DIR / "diabetes"

# ---------------- Cardiovascular artifacts ----------------
CARDIO_FEATURES = list(joblib.load(MODEL_DIR / "cardio_70k_feature_names.joblib"))
CARDIO_SCALER = joblib.load(MODEL_DIR / "cardio_70k_scaler.joblib")
CARDIO_PCA = joblib.load(MODEL_DIR / "cardio_70k_pca.joblib")
CARDIO_MODELS = {
    "RandomForest": joblib.load(MODEL_DIR / "cardio_70k_RandomForest.joblib"),
    "XGBoost": joblib.load(MODEL_DIR / "cardio_70k_XGBoost.joblib"),
    "SVM": joblib.load(MODEL_DIR / "cardio_70k_SVM_RBF.joblib"),
}

# Current cardiovascular hybrid artifact supplied by the ML team.
# It contains the classical XGBoost branch, the precomputed quantum-kernel
# SVM branch, calibration data, blend weight and the raw feature contract.
CARDIO_HYBRID = joblib.load(MODEL_DIR / "hybrid_cardio_70k.joblib")
CARDIO_HYBRID_CLASSICAL = CARDIO_HYBRID["classical_model"]
CARDIO_HYBRID_SCALER = CARDIO_HYBRID["classical_scaler"]
CARDIO_HYBRID_PCA = CARDIO_HYBRID["classical_pca"]
CARDIO_HYBRID_Q_SVM = CARDIO_HYBRID["qsvm_sk_model"]
CARDIO_HYBRID_Q_TRAIN = CARDIO_HYBRID["qsvm_X_train_ref"]
CARDIO_HYBRID_Q_SCALER = CARDIO_HYBRID["qsvm_scaler"]
CARDIO_HYBRID_Q_SELECTOR = CARDIO_HYBRID["qsvm_selector"]
CARDIO_HYBRID_Q_SCALER_ANGLE = CARDIO_HYBRID["qsvm_qscaler"]
CARDIO_HYBRID_CALIBRATOR = CARDIO_HYBRID["platt_calibrator"]
CARDIO_HYBRID_BLEND_CLASSICAL = float(CARDIO_HYBRID["blend_weight_classical"])
CARDIO_HYBRID_PARAMS = CARDIO_HYBRID.get("qsvm_kernel_params", {"n_qubits": 6, "reps": 1, "entanglement": "linear"})
CARDIO_HYBRID_THRESHOLD = 0.5
CARDIO_HYBRID_METRICS = CARDIO_HYBRID.get("test_metrics", {})

# Exact vectorized statevector basis for 6-qubit linear ZZFeatureMap
_ZZ_BITS = np.array([[(i >> q) & 1 for q in range(6)] for i in range(64)], dtype=float)
_ZZ_DIFFS = np.array([[((i >> q) & 1) ^ ((i >> (q + 1)) & 1) for q in range(5)] for i in range(64)], dtype=float)

def _compute_zz_statevectors(X: np.ndarray) -> np.ndarray:
    phase_1 = np.dot(X, _ZZ_BITS.T) * 2.0
    pair_weights = 2.0 * (np.pi - X[:, :5]) * (np.pi - X[:, 1:6])
    phase_2 = np.dot(pair_weights, _ZZ_DIFFS.T)
    return (1.0 / 8.0) * np.exp(1j * (phase_1 + phase_2))

CARDIO_HYBRID_SV_TRAIN = _compute_zz_statevectors(CARDIO_HYBRID_Q_TRAIN)

# The multisite heart artifact is retained as benchmark evidence. Its quantum
# SVC object is not bundled, so it is not used for live patient prediction.
HEART_MULTISITE_ARTIFACT = joblib.load(MODEL_DIR / "hybrid_heart_multisite.joblib")

# ---------------- Diabetes artifacts ----------------
DIAB_FEATURES = ["gender", "age", "hypertension", "heart_disease", "smoking_history", "bmi", "HbA1c_level", "blood_glucose_level"]
DIAB_NUMERIC = ["age", "bmi", "HbA1c_level", "blood_glucose_level"]
DIAB_SCALER = joblib.load(DIAB_DIR / "scaler.pkl")
DIAB_PCA = joblib.load(DIAB_DIR / "pca.pkl")
DIAB_LE_GENDER = joblib.load(DIAB_DIR / "le_gender.pkl")
DIAB_LE_SMOKING = joblib.load(DIAB_DIR / "le_smoking_history.pkl")
DIAB_LOGREG = joblib.load(DIAB_DIR / "logistic_regression.pkl")
DIAB_RF = joblib.load(DIAB_DIR / "random_forest.pkl")
DIAB_Q_SCALER = joblib.load(DIAB_DIR / "quantum_scaler.pkl")
DIAB_Q_THRESHOLD = float(json.loads((DIAB_DIR / "qml_metadata.json").read_text()).get("decision_threshold", 0.53))

try:
    MODEL_METRICS = json.loads((ROOT / "model_metrics.json").read_text())
except Exception:
    MODEL_METRICS = {}

class CardioFeatures(BaseModel):
    age: float = Field(..., ge=0, le=120)
    gender: float = Field(..., ge=1, le=2)
    height: float = Field(..., gt=80, le=250)
    weight: float = Field(..., gt=20, le=300)
    ap_hi: float = Field(..., ge=60, le=300)
    ap_lo: float = Field(..., ge=30, le=200)
    cholesterol: float = Field(..., ge=1, le=3)
    gluc: float = Field(..., ge=1, le=3)
    smoke: float = Field(..., ge=0, le=1)
    alco: float = Field(..., ge=0, le=1)
    active: float = Field(..., ge=0, le=1)
    bmi: float = Field(..., gt=10, le=80)

class DiabetesFeatures(BaseModel):
    gender: Literal["Female", "Male", "Other"]

    age: float = Field(..., ge=0, le=120)
    hypertension: int = Field(..., ge=0, le=1)
    heart_disease: int = Field(..., ge=0, le=1)
    smoking_history: Literal["No Info", "current", "ever", "former", "never", "not current"]

    bmi: float = Field(..., gt=10, le=80)
    HbA1c_level: float = Field(..., ge=3, le=20)
    blood_glucose_level: float = Field(..., ge=40, le=500)

class PredictRequest(BaseModel):
    condition: Literal["cardiovascular", "diabetes"]
    model: Optional[str] = None
    features: dict

app = FastAPI(title="BioSync ML API", version="3.0.0")

CARDIO_DETAILS = {
    "RandomForest": {"type": "Classical ensemble", "preprocessing": "StandardScaler -> PCA(6)", "configuration": {"n_estimators": 200, "max_depth": 8, "class_weight": "balanced"}},
    "XGBoost": {"type": "Classical gradient boosting", "preprocessing": "StandardScaler -> PCA(6)", "configuration": {"n_estimators": 200, "max_depth": 3, "learning_rate": 0.05, "subsample": 0.9}},
    "SVM": {"type": "Classical SVM", "preprocessing": "StandardScaler -> PCA(6)", "configuration": {"kernel": "rbf", "C": 1.0, "gamma": 0.01, "probability": True}},
    "HybridQuantum": {
        "type": "Quantum-classical hybrid model",
        "preprocessing": "Classical StandardScaler -> PCA(6) + quantum-kernel branch with StandardScaler -> SelectKBest(6) -> angle scaling",
        "configuration": {
            "n_qubits": int(CARDIO_HYBRID_PARAMS.get("n_qubits", 6)),
            "reps": int(CARDIO_HYBRID_PARAMS.get("reps", 1)),
            "entanglement": CARDIO_HYBRID_PARAMS.get("entanglement", "linear"),
            "classical_blend_weight": CARDIO_HYBRID_BLEND_CLASSICAL,
            "quantum_blend_weight": 1.0 - CARDIO_HYBRID_BLEND_CLASSICAL,
            "decision_threshold": CARDIO_HYBRID_THRESHOLD,
            "training_vectors": int(CARDIO_HYBRID_Q_TRAIN.shape[0]),
        },
        "selected_features": list(CARDIO_HYBRID_Q_SELECTOR.get_feature_names_out(CARDIO_FEATURES)),
        "test_metrics": CARDIO_HYBRID_METRICS,
    },
}

DIAB_DETAILS = {
    "LogisticRegression": {"type": "Classical logistic regression", "preprocessing": "Categorical encoding + StandardScaler(numeric) -> 8-feature classical model", "configuration": {"class_weight": "balanced"}},
    "RandomForest": {"type": "Classical ensemble", "preprocessing": "Categorical encoding + StandardScaler(numeric) -> 8-feature classical model", "configuration": {"n_estimators": 200, "max_depth": 8, "class_weight": "balanced"}},
    "FinetunedHybridQML": {"type": "Hybrid quantum-classical neural model", "preprocessing": "StandardScaler(numeric) -> quantum MinMaxScaler [-pi, pi] -> 4-qubit simulator -> classical head", "configuration": {"n_qubits": 4, "n_layers": 3, "qml_parameters": 24, "decision_threshold": DIAB_Q_THRESHOLD}, "quantum_features": DIAB_NUMERIC, "verification_status": "Reconstructed from serialized artifact; original training source was not bundled."},
}


def cardio_row(f: CardioFeatures):
    return np.array([[getattr(f, name) for name in CARDIO_FEATURES]], dtype=float)


def cardio_classical(model_name, row):
    x = CARDIO_PCA.transform(CARDIO_SCALER.transform(row))
    model = CARDIO_MODELS[model_name]
    pred = int(model.predict(x)[0])
    prob = float(model.predict_proba(x)[0][1])
    return {"model": model_name, "prediction": pred, "probability": prob, "decision_score": None, "feature_order": CARDIO_FEATURES, "details": CARDIO_DETAILS[model_name]}


def cardio_hybrid(f: CardioFeatures):
    try:
        from qiskit.circuit.library import ZZFeatureMap
        from qiskit_machine_learning.kernels import FidelityQuantumKernel
    except ImportError as exc:
        raise RuntimeError("Cardiovascular hybrid model requires Qiskit. Install dependencies from ml-api/requirements.txt.") from exc

    row = cardio_row(f)

    # Classical branch from the supplied hybrid artifact.
    classical_x = CARDIO_HYBRID_PCA.transform(CARDIO_HYBRID_SCALER.transform(row))
    classical_probability = float(CARDIO_HYBRID_CLASSICAL.predict_proba(classical_x)[0][1])

    # Quantum-kernel branch from the supplied precomputed-kernel bundle.
    scaled = CARDIO_HYBRID_Q_SCALER.transform(row)
    selected = CARDIO_HYBRID_Q_SELECTOR.transform(scaled)
    angle_scaled = CARDIO_HYBRID_Q_SCALER_ANGLE.transform(selected)

    sv_test = _compute_zz_statevectors(angle_scaled)
    krow = np.abs(sv_test @ CARDIO_HYBRID_SV_TRAIN.conj().T) ** 2
    quantum_score = float(CARDIO_HYBRID_Q_SVM.decision_function(krow)[0])

    # The artifact includes a Platt calibrator for the quantum decision score.
    quantum_probability = float(CARDIO_HYBRID_CALIBRATOR.predict_proba([[quantum_score]])[0][1])

    hybrid_probability = (
        CARDIO_HYBRID_BLEND_CLASSICAL * classical_probability
        + (1.0 - CARDIO_HYBRID_BLEND_CLASSICAL) * quantum_probability
    )
    prediction = int(hybrid_probability >= CARDIO_HYBRID_THRESHOLD)

    return {
        "model": "HybridQuantum",
        "prediction": prediction,
        "probability": hybrid_probability,
        "decision_score": quantum_score,
        "classical_probability": classical_probability,
        "quantum_probability": quantum_probability,
        "blend_weight_classical": CARDIO_HYBRID_BLEND_CLASSICAL,
        "decision_threshold": CARDIO_HYBRID_THRESHOLD,
        "feature_order": CARDIO_FEATURES,
        "selected_features": list(CARDIO_HYBRID_Q_SELECTOR.get_feature_names_out(CARDIO_FEATURES)),
        "details": CARDIO_DETAILS["HybridQuantum"],
    }


def diabetes_matrix(f: DiabetesFeatures):
    values = f.model_dump()
    encoded = [DIAB_LE_GENDER.transform([values["gender"]])[0], values["age"], values["hypertension"], values["heart_disease"], DIAB_LE_SMOKING.transform([values["smoking_history"]])[0], values["bmi"], values["HbA1c_level"], values["blood_glucose_level"]]
    arr = np.array([encoded], dtype=float)
    # The saved scaler is fitted only on the four numeric columns.
    arr[:, [1, 5, 6, 7]] = DIAB_SCALER.transform(arr[:, [1, 5, 6, 7]])
    return arr


def diabetes_classical(model_name, f: DiabetesFeatures):
    arr = diabetes_matrix(f)
    x = arr
    model = DIAB_LOGREG if model_name == "LogisticRegression" else DIAB_RF
    pred = int(model.predict(x)[0]); prob = float(model.predict_proba(x)[0][1])
    return {"model": model_name, "prediction": pred, "probability": prob, "decision_score": None, "feature_order": DIAB_FEATURES, "details": DIAB_DETAILS[model_name]}


def diabetes_quantum(f: DiabetesFeatures):
    from diabetes_qml_runtime import predict as qml_predict
    return qml_predict(f.model_dump())


def run_all(condition, features):
    if condition == "cardiovascular":
        f=CardioFeatures(**features); results=[]; failures=[]
        for m in ["RandomForest","XGBoost","SVM","HybridQuantum"]:
            try: results.append(cardio_hybrid(f) if m=="HybridQuantum" else cardio_classical(m,cardio_row(f)))
            except Exception as exc: failures.append({"model":m,"message":str(exc)})
        return results, failures
    f=DiabetesFeatures(**features); results=[]; failures=[]
    for m in ["LogisticRegression","RandomForest","FinetunedHybridQML"]:
        try:
            results.append(diabetes_quantum(f) if m=="FinetunedHybridQML" else diabetes_classical(m,f))
        except Exception as exc: failures.append({"model":m,"message":str(exc)})
    return results, failures

@app.get("/health")
def health():
    return {"ok": True, "conditions": ["cardiovascular", "diabetes"], "models": {"cardiovascular": list(CARDIO_MODELS)+["HybridQuantum"], "diabetes": ["LogisticRegression","RandomForest","FinetunedHybridQML"]}}

@app.get("/models")
def models():
    diabetes_metrics = MODEL_METRICS.get("diabetes", {})
    return {
        "conditions": {
            "cardiovascular": {
                "models": {k: {**v, "performance": MODEL_METRICS.get("cardiovascular", {}).get(k, {})} for k, v in CARDIO_DETAILS.items()}
            },
            "diabetes": {
                "models": {k: {**v, "performance": diabetes_metrics.get("production_test_set", {}).get("models", {}).get(k, {})} for k, v in DIAB_DETAILS.items()},
                "evaluation_protocol": diabetes_metrics.get("evaluation_protocol", {}),
                "production_test_set": diabetes_metrics.get("production_test_set", {}),
                "fair_same_feature_benchmark": diabetes_metrics.get("fair_same_feature_benchmark", {}),
                "generalization": diabetes_metrics.get("generalization", {}),
            },
        },
        "metrics": MODEL_METRICS,
    }

@app.post("/predict")
def predict(req: PredictRequest):
    allowed = CARDIO_DETAILS.keys() if req.condition == "cardiovascular" else DIAB_DETAILS.keys()
    model_name = req.model or "RandomForest"
    if model_name not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported model for {req.condition}: {model_name}")
    if req.condition == "cardiovascular":
        f = CardioFeatures(**req.features)
        try:
            return cardio_hybrid(f) if model_name == "HybridQuantum" else cardio_classical(model_name, cardio_row(f))
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc))
    f = DiabetesFeatures(**req.features)
    try:
        return diabetes_quantum(f) if model_name == "FinetunedHybridQML" else diabetes_classical(model_name, f)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

@app.post("/predict-all")
def predict_all(req: PredictRequest):
    results, failures=run_all(req.condition,req.features)
    if not results: raise HTTPException(status_code=503,detail="No model could be executed")
    return {"condition":req.condition,"results":results,"failures":failures}
