"""Runtime for the supplied BioSync Diabetes hybrid-QML artifact.

The artifact contains trained quantum weights, a classical head and scaling
metadata, but not the original training source. The runtime therefore reconstructs
the documented circuit path from the serialized shape/configuration and explicitly
marks that provenance instead of claiming training-source verification.
"""
from pathlib import Path
import json
import numpy as np
import joblib
import torch

ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / "models" / "diabetes"

FEATURES = ["gender", "age", "hypertension", "heart_disease", "smoking_history", "bmi", "HbA1c_level", "blood_glucose_level"]
Q_FEATURES = ["age", "bmi", "HbA1c_level", "blood_glucose_level"]
SCALER = joblib.load(MODEL_DIR / "scaler.pkl")
Q_SCALER = joblib.load(MODEL_DIR / "quantum_scaler.pkl")
ARTIFACT = torch.load(MODEL_DIR / "finetuned_hybrid_qml.pt", map_location="cpu", weights_only=False)
STATE = ARTIFACT["model_state_dict"]
Q_WEIGHTS = STATE["quantum_layer.weights"].detach().cpu()
HEAD_W1 = STATE["classical_head.0.weight"].detach().cpu()
HEAD_B1 = STATE["classical_head.0.bias"].detach().cpu()
HEAD_W2 = STATE["classical_head.3.weight"].detach().cpu()
HEAD_B2 = STATE["classical_head.3.bias"].detach().cpu()
N_QUBITS = int(ARTIFACT.get("n_qubits", 4))
N_LAYERS = int(ARTIFACT.get("n_layers", 3))
THRESHOLD = float(ARTIFACT.get("decision_threshold", 0.53))


def encode_inputs(features: dict) -> np.ndarray:
    numeric = np.array([[float(features[k]) for k in Q_FEATURES]], dtype=float)
    # The supplied quantum scaler was trained on standardized numeric features.
    standardized = SCALER.transform(numeric)
    angles = Q_SCALER.transform(standardized)
    return angles.astype(np.float64)


def _classical_head(q_features: np.ndarray) -> tuple[float, float]:
    """Run the serialized PyTorch head with NumPy so QML inference does not
    depend on a Torch/PennyLane interface combination at runtime."""
    q = np.asarray(q_features, dtype=np.float64).reshape(-1)
    hidden = np.maximum(0.0, HEAD_W1.numpy().astype(np.float64) @ q + HEAD_B1.numpy().astype(np.float64))
    logit = float((HEAD_W2.numpy().astype(np.float64) @ hidden + HEAD_B2.numpy().astype(np.float64)).reshape(-1)[0])
    # Numerically stable sigmoid.
    probability = float(1.0 / (1.0 + np.exp(-np.clip(logit, -60.0, 60.0))))
    return logit, probability


def _predict_with_pennylane(x: np.ndarray) -> np.ndarray:
    """Execute the reconstructed 4-qubit circuit through PennyLane's
    NumPy/default-qubit path. Avoids the Torch interface, which can be version
    sensitive on local installations."""
    import pennylane as qml

    dev = qml.device("default.qubit", wires=N_QUBITS)

    @qml.qnode(dev)
    def circuit(inputs, weights):
        qml.AngleEmbedding(inputs, wires=range(N_QUBITS), rotation="Y")
        for layer in range(N_LAYERS):
            for wire in range(N_QUBITS):
                qml.RY(float(weights[layer, wire, 0]), wires=wire)
                qml.RZ(float(weights[layer, wire, 1]), wires=wire)
            for wire in range(N_QUBITS - 1):
                qml.CNOT(wires=[wire, wire + 1])
        return [qml.expval(qml.PauliZ(w)) for w in range(N_QUBITS)]

    values = circuit(np.asarray(x, dtype=np.float64), Q_WEIGHTS.numpy().astype(np.float64))
    return np.asarray(values, dtype=np.float64)


def _apply_single_qubit(state: np.ndarray, gate: np.ndarray, wire: int) -> np.ndarray:
    """Apply a 2x2 gate to one wire of a 4-qubit statevector."""
    tensor = state.reshape((2,) * N_QUBITS)
    tensor = np.moveaxis(tensor, wire, 0).reshape(2, -1)
    tensor = gate @ tensor
    tensor = np.moveaxis(tensor.reshape((2,) + (2,) * (N_QUBITS - 1)), 0, wire)
    return tensor.reshape(-1)


def _apply_cnot(state: np.ndarray, control: int, target: int) -> np.ndarray:
    """Apply CNOT using the computational-basis permutation."""
    out = np.zeros_like(state)
    for idx, amp in enumerate(state):
        bits = [(idx >> (N_QUBITS - 1 - k)) & 1 for k in range(N_QUBITS)]
        if bits[control]:
            bits[target] ^= 1
        j = 0
        for bit in bits:
            j = (j << 1) | bit
        out[j] = amp
    return out


def _ry(theta: float) -> np.ndarray:
    c, s = np.cos(theta / 2.0), np.sin(theta / 2.0)
    return np.array([[c, -s], [s, c]], dtype=np.complex128)


def _rz(theta: float) -> np.ndarray:
    return np.array(
        [[np.exp(-1j * theta / 2.0), 0], [0, np.exp(1j * theta / 2.0)]],
        dtype=np.complex128,
    )


def _predict_with_numpy_simulator(x: np.ndarray) -> np.ndarray:
    """Small dependency-light statevector fallback for the reconstructed
    circuit. This is still a quantum simulation, not a classical ML fallback."""
    state = np.zeros(2 ** N_QUBITS, dtype=np.complex128)
    state[0] = 1.0 + 0.0j

    # Same Y-angle embedding as the documented PennyLane reconstruction.
    for wire, angle in enumerate(x):
        state = _apply_single_qubit(state, _ry(float(angle)), wire)

    weights = Q_WEIGHTS.numpy().astype(np.float64)
    for layer in range(N_LAYERS):
        for wire in range(N_QUBITS):
            state = _apply_single_qubit(state, _ry(float(weights[layer, wire, 0])), wire)
            state = _apply_single_qubit(state, _rz(float(weights[layer, wire, 1])), wire)
        for wire in range(N_QUBITS - 1):
            state = _apply_cnot(state, wire, wire + 1)

    expectations = []
    probabilities = np.abs(state) ** 2
    for wire in range(N_QUBITS):
        value = 0.0
        for idx, prob in enumerate(probabilities):
            bit = (idx >> (N_QUBITS - 1 - wire)) & 1
            value += (1.0 if bit == 0 else -1.0) * prob
        expectations.append(float(np.real(value)))
    return np.asarray(expectations, dtype=np.float64)


def _quantum_features(x: np.ndarray) -> tuple[np.ndarray, str]:
    try:
        return _predict_with_pennylane(x), "PennyLane default.qubit simulator"
    except Exception as exc:
        # Do not silently fall back to a classical model. The fallback is the
        # same documented reconstructed circuit implemented as a local
        # statevector simulator, so the quantum path remains quantum-simulated.
        try:
            q = _predict_with_numpy_simulator(x)
            return q, "Local 4-qubit statevector simulator"
        except Exception as fallback_exc:
            raise RuntimeError(
                f"Diabetes hybrid QML execution failed in both quantum simulators: {type(exc).__name__}; {type(fallback_exc).__name__}"
            ) from fallback_exc


def predict(features: dict):
    x = encode_inputs(features)[0]
    q_features, execution_backend = _quantum_features(x)
    logit, probability = _classical_head(q_features)
    prediction = int(probability >= THRESHOLD)
    return {
        "model": "FinetunedHybridQML",
        "prediction": prediction,
        "probability": probability,
        "decision_score": logit,
        "decision_threshold": THRESHOLD,
        "feature_order": FEATURES,
        "quantum_features": Q_FEATURES,
        "execution_backend": execution_backend,
        "details": {
            "type": "Hybrid quantum-classical neural model",
            "verification_status": "Executable artifact reconstruction; original training source was not bundled.",
            "preprocessing": "StandardScaler -> quantum MinMaxScaler [-pi, pi] -> 4-qubit circuit -> classical head",
            "configuration": {
                "n_qubits": N_QUBITS,
                "n_layers": N_LAYERS,
                "qml_parameters": int(N_LAYERS * N_QUBITS * 2),
                "decision_threshold": THRESHOLD,
            },
            "quantum_features": Q_FEATURES,
            "execution_backend": execution_backend,
        },
    }


def circuit_text():
    return [
        "4-qubit simulator",
        "Y-angle data encoding (runtime reconstruction)",
        "3 layers of trainable RY + RZ rotations",
        "Linear CNOT entanglement",
        "4 Pauli-Z expectation values",
        "Classical head: 4 -> 8 (ReLU) -> 1 (sigmoid)",
        "Verification: training source not bundled",
    ]
