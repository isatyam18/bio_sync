# BioSync — run this version first

1. Start MongoDB locally.
2. In the project root, create/activate the Python venv:
   `python -m venv .venv`
   `\.venv\Scripts\activate`
3. Install ML dependencies:
   `cd ml-api`
   `pip install -r requirements.txt`
   `cd ..`
4. Install backend dependencies:
   `cd backend`
   `npm install`
   `cd ..`
5. Install frontend dependencies:
   `cd frontend`
   `npm install`
   `cd ..`
6. Run `RUN_BIOSYNC_WINDOWS.bat`.
7. Check ML API: http://127.0.0.1:8000/health
8. Open: http://localhost:3000

The assessment page now shows the actual HTTP/backend error instead of only “Request failed”, and returning to the patient profile forces a fresh data fetch.

Cardiovascular HybridQuantum still requires the Qiskit dependencies listed in `ml-api/requirements.txt`. The application does not fake a quantum result when those dependencies are unavailable; classical cardiovascular results can still be returned when the backend and database are working.
