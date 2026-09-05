import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from diabetes_qml_runtime import predict

SAMPLE = {
    "gender": "Female",
    "age": 55,
    "hypertension": 1,
    "heart_disease": 0,
    "smoking_history": "never",
    "bmi": 31.2,
    "HbA1c_level": 6.8,
    "blood_glucose_level": 180,
}

result = predict(SAMPLE)
assert result["model"] == "FinetunedHybridQML"
assert result["prediction"] in (0, 1)
assert 0.0 <= result["probability"] <= 1.0
assert result["execution_backend"] in ("PennyLane default.qubit simulator", "Local 4-qubit statevector simulator")
print("QML SMOKE TEST: PASS")
print("prediction:", result["prediction"])
print("probability:", round(result["probability"], 6))
print("backend:", result["execution_backend"])
