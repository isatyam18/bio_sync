# BioSync Frontend - Run Instructions

This build uses Next.js with ES modules. The frontend package explicitly declares `"type": "module"` to avoid the CommonJS/ESM Turbopack module-format error.

## Run

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Backend

In another terminal:

```bash
cd backend
npm install
npm run dev
```

Backend runs on http://localhost:4000.

## ML API

In another terminal:

```bash
cd ml-api
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

If using macOS/Linux, activate with `source .venv/bin/activate`.
