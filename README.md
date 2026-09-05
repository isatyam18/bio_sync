# BioSync: Explainable Hybrid ML and Quantum Machine Learning Health Risk Assessment

BioSync is an end-to-end clinical decision-support and health risk assessment platform. It bridges classical machine learning with quantum machine learning (QML) models to evaluate disease risk based on patient physiological profiles, offering dedicated interfaces for both patients and healthcare providers.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Supported Conditions and Model Portfolio](#supported-conditions-and-model-portfolio)
- [Quantum Machine Learning Implementations](#quantum-machine-learning-implementations)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [Running the Services](#running-the-services)
- [API Documentation](#api-documentation)
- [Clinical Safety and Framing](#clinical-safety-and-framing)
- [Security and Reliability](#security-and-reliability)
- [Benchmarking and Reproducibility](#benchmarking-and-reproducibility)
- [Deployment Guidelines](#deployment-guidelines)
- [Disclaimer](#disclaimer)

---

## System Architecture

The platform operates as a three-tier decoupled microservice architecture:

```
Browser Client
     │
     ▼
Next.js 15 Frontend (Port 3000)
     │ (API Proxy / Rewrites)
     ▼
Express.js Backend (Port 4000) ◄────► MongoDB / MongoDB Atlas (Port 27017)
     │
     ▼ (Internal JSON RPC / REST)
FastAPI ML Service (Port 8000)
```

1. **Frontend (Next.js 15 / React 19 / Tailwind CSS / Lucide)**: Provides authenticated patient self-service views and clinical doctor dashboards, interactive risk summaries, model explainability indicators, and downloadable PDF clinical reports.
2. **Backend (Node.js / Express / Mongoose / Session Auth)**: Handles authentication, session persistence with MongoStore, input validation, role-based access control (patient vs. doctor), patient record encryption/scoping, and aggregated assessment logging.
3. **ML Service (FastAPI / Uvicorn / PyTorch / Qiskit / PennyLane / Scikit-Learn / XGBoost)**: Hosts pre-trained classical ensembles and parameterized quantum circuits for inference, metric reporting, and feature preprocessing.

---

## Supported Conditions and Model Portfolio

Each condition operates under a strict feature contract to guarantee deterministic input transformation and model inference.

### 1. Cardiovascular Condition

- **Feature Contract (12 features)**:
  - Demographic: `age`, `gender`, `height`, `weight`, `bmi`
  - Vitals: `ap_hi` (Systolic BP), `ap_lo` (Diastolic BP)
  - Biochemical: `cholesterol` (1: normal, 2: above normal, 3: well above normal), `gluc` (1: normal, 2: above normal, 3: well above normal)
  - Behavioral: `smoke`, `alco`, `active`
- **Models Executed**:
  - `RandomForest`: 200 trees, maximum depth 8, balanced class weighting. Preprocessing: StandardScaler -> PCA(6).
  - `XGBoost`: Gradient boosted decision trees (200 estimators, learning rate 0.05, max depth 3). Preprocessing: StandardScaler -> PCA(6).
  - `SVM`: Support Vector Classifier with RBF kernel and probability calibration. Preprocessing: StandardScaler -> PCA(6).
  - `HybridQuantum`: Blended quantum-classical model combining classical XGBoost with a 6-qubit linear entanglement quantum-kernel Support Vector Machine (QSVM).

### 2. Diabetes Condition

- **Feature Contract (8 features)**:
  - Categorical: `gender` (Female, Male, Other), `smoking_history` (never, former, current, ever, not current, No Info)
  - Comorbidities: `hypertension` (0/1), `heart_disease` (0/1)
  - Numeric Biometrics: `age`, `bmi`, `HbA1c_level`, `blood_glucose_level`
- **Models Executed**:
  - `LogisticRegression`: Multi-feature classical baseline with balanced class weights.
  - `RandomForest`: Ensemble classifier (200 trees, maximum depth 8).
  - `FinetunedHybridQML`: Parameterized 4-qubit, 3-layer quantum circuit connected to a 4->8->1 classical neural network head.

---

## Quantum Machine Learning Implementations

### Cardiovascular Quantum Kernel (QSVM)
- **Circuit Design**: 6-qubit `ZZFeatureMap` with single repetition and linear entanglement.
- **Inference Optimization**: Live statevector fidelity calculations are performed via vectorized NumPy tensor products against precomputed reference training vectors. This replaces iterative AST circuit construction with instantaneous millisecond-level evaluation while preserving machine precision parity with Qiskit's `FidelityQuantumKernel`.
- **Calibration**: Quantum decision scores are calibrated via a fitted Platt calibrator into a probability distribution and weighted with the classical branch.

### Diabetes Hybrid Quantum Neural Network (QNN)
- **Circuit Design**: 4-qubit variational circuit encoding normalized numeric features (`age`, `bmi`, `HbA1c_level`, `blood_glucose_level`) across 3 parameterized layers (24 variational parameters).
- **Execution**: Evaluated via PennyLane `default.qubit` simulator with fallback to a lightweight local statevector simulator.
- **Decision Head**: Expectation values are fed into a trained feed-forward classical neural head with a calibrated decision threshold of 0.53.

---

## Repository Structure

```
BioSync/
├── RUN_BIOSYNC_WINDOWS.bat        # Automated one-click launcher for Windows
├── RUN_FIRST.md                   # Quick-start documentation
├── README.md                      # Comprehensive system documentation
├── backend/                       # Express.js REST API service
│   ├── .env.example               # Template environment configuration
│   ├── middleware/                # Session authentication and RBAC guards
│   ├── models/                    # Mongoose schemas (User, Patient, Prediction)
│   ├── routes/                    # Endpoints (auth, patients, dashboard)
│   ├── package.json
│   └── server.js                  # Application entry point
├── frontend/                      # Next.js 15 web application
│   ├── app/                       # App router pages (dashboard, login, patients)
│   ├── components/                # Reusable UI components & layouts
│   ├── lib/                       # API client and helper functions
│   ├── next.config.js             # API proxy routing configuration
│   ├── package.json
│   └── tsconfig.json
├── ml-api/                        # FastAPI Machine Learning Service
│   ├── benchmarks/                # Empirical benchmark tables and histories
│   ├── models/                    # Serialized model weights (.pkl, .joblib, .pt)
│   ├── diabetes_qml_runtime.py    # Standalone QML simulation engine
│   ├── main.py                    # FastAPI application routes and inference
│   ├── qml_smoke_test.py          # Quantum verification script
│   ├── smoke_test.py              # Classical verification script
│   └── requirements.txt           # Python package dependencies
└── data/                          # Transformed validation and benchmark splits
```

---

## Prerequisites

- **Node.js**: Version 18.x or 20.x LTS
- **Python**: Version 3.11, 3.12, or 3.13 (64-bit)
- **MongoDB**: Local MongoDB Community Server (v6.0+) or a MongoDB Atlas connection string

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/isatyam18/bio_sync.git
cd bio_sync
```

### 2. Python Virtual Environment and ML Dependencies

```bash
# Create virtual environment in root
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell / Command Prompt):
.\.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

# Install Python dependencies
pip install -r ml-api/requirements.txt
```

### 3. Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory using the provided template:

```bash
cp backend/.env.example backend/.env
```

Configuration parameters:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/biosync
SESSION_SECRET=a-secure-random-secret-key-at-least-32-characters-long
ML_API_URL=http://127.0.0.1:8000
FRONTEND_ORIGIN=http://localhost:3000
NODE_ENV=development
```

*Note: For MongoDB Atlas, set `MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/biosync?retryWrites=true&w=majority`.*

---

## Running the Services

### Option A: Windows Batch Launcher (Automated)

Double-click `RUN_BIOSYNC_WINDOWS.bat` or run from PowerShell:

```powershell
.\RUN_BIOSYNC_WINDOWS.bat
```

This launches all three services (ML API, Backend, Frontend) in individual console windows.

### Option B: Manual Execution (Terminal per Service)

#### Terminal 1: ML API Service
```bash
cd ml-api
# Activate venv:
..\.venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000
```
Verify health: `http://127.0.0.1:8000/health`

#### Terminal 2: Backend API Service
```bash
cd backend
npm run dev
```
Verify health: `http://127.0.0.1:4000/health`

#### Terminal 3: Frontend Web Service
```bash
cd frontend
npm run dev
```
Access application: `http://localhost:3000`

---

## API Documentation

### ML API (`http://127.0.0.1:8000`)

- `GET /health`: Returns service operational status and available models.
- `GET /models`: Returns model architecture metadata, training benchmarks, and feature expectations.
- `POST /predict`: Evaluates a single specific model for a patient.
  - Body: `{"condition": "cardiovascular" | "diabetes", "model": "RandomForest", "features": {...}}`
- `POST /predict-all`: Executes all applicable models for the specified condition simultaneously.
  - Body: `{"condition": "cardiovascular" | "diabetes", "features": {...}}`

### Backend API (`http://127.0.0.1:4000/api`)

- `POST /auth/signup`: Registers a new user (`patient` or `doctor`).
- `POST /auth/login`: Authenticates user and establishes session cookie.
- `GET /auth/me`: Retrieves current session profile and role.
- `POST /auth/logout`: Destroys session.
- `GET /patients`: Lists registered patient profiles accessible to the user.
- `POST /patients`: Registers a new patient with required condition biometrics.
- `GET /patients/:id`: Retrieves full patient history and past assessments.
- `POST /patients/:id/predict`: Runs a new model assessment and persists predictions.
- `GET /patients/:id/report`: Generates and streams a formatted PDF clinical assessment report.
- `GET /ml-info`: Provides doctor-only access to model performance metrics.

---

## Clinical Safety and Framing

BioSync enforces strict clinical framing across all interfaces:
- **Decision Support, Not Diagnosis**: Positive and negative model outputs represent predictive statistical classifications, not definitive medical diagnoses.
- **Display Risk Bands**: Risk stratifications (Low, Moderate, High) are heuristic communication bands, not clinically validated thresholds.
- **Audience-Specific Views**:
  - *Patients*: Receive plain-language summaries, lifestyle indicator reflections, and explicit guidance to consult licensed medical professionals.
  - *Doctors*: Receive granular model performance comparisons, ROC-AUC metrics, feature attributions, and quantum transparency disclosures.

---

## Security and Reliability

- **Session Authentication**: State stored in MongoDB via `connect-mongo` with HttpOnly, SameSite cookies.
- **Password Security**: Salted password hashing using `bcrypt`.
- **Rate Limiting**: Configured with `express-rate-limit` on authentication (`/api/auth/*`) and inference (`/api/patients/:id/predict`) endpoints.
- **HTTP Security**: Automated headers managed via `helmet`.
- **Data Scoping**: Patient records and assessments are strictly queried and scoped by authenticated user ID and role.
- **Graceful Degradation**: Classical predictions succeed and are saved even if an individual experimental model encounters an error.

---

## Benchmarking and Reproducibility

### Diabetes Fair Baseline Benchmark
To re-evaluate the comparative performance between classical models and the hybrid QML model on identical numeric feature subsets:

```bash
python rebuild_diabetes_benchmark.py
```

### Verification Smoke Tests
To verify all quantum and classical model pipelines locally:

```bash
cd ml-api
python qml_smoke_test.py
python smoke_test.py
```

---

## Deployment Guidelines

- **Frontend**: Deployable as a Next.js Web Service on Vercel, Netlify, or Render. Set environment variable `NEXT_PUBLIC_API_URL` or configure reverse proxy to the backend.
- **Backend**: Deployable on Render, Railway, AWS ECS, or any Node.js 18+ container. Ensure `MONGO_URI` and `ML_API_URL` are configured.
- **ML API**: Deployable as a Python web service (Render, Railway, AWS EC2, or Docker). Recommended minimum specifications: 1 vCPU, 2 GB RAM.

---

## Disclaimer

BioSync is designed solely for informational, educational, and clinical research decision-support purposes. It is not an FDA-cleared or CE-marked medical device. All outputs should be reviewed and verified by qualified medical practitioners prior to making clinical decisions.
