# BioSync integration handoff

This frontend is connected to the Express API through Next.js rewrites.

Browser -> Next.js `/api/*` -> Express -> MongoDB / FastAPI.

Authentication is real (MongoDB-backed session). Patient records are real MongoDB documents. Cardiovascular prediction calls the FastAPI adapter using the supplied 12-feature preprocessing/model artifacts.

No fake clinical accuracy, diagnosis, or feature-contribution percentages are shown.
