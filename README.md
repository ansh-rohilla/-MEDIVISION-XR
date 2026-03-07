# Medivision XR

A medical imaging web application with a **Flask** backend and a **React (Create React App)** frontend.

## Tech Stack

- **Backend**: Python, Flask, Flask-CORS
- **Frontend**: React (Create React App)
- **Imaging / ML**: SimpleITK, VTK, PyDICOM, PyTorch

## Project Structure

- `app.py`: Flask application entrypoint
- `routes/`: API routes (upload/auth/etc.)
- `static/`: backend static assets (`uploads/`, `processed/`)
- `frontend/`: React app
- `requirements.txt`: Python dependencies

## Prerequisites

- Python 3.10+ recommended
- Node.js 18+ recommended

## Setup & Run (Backend)

1. Create a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate
```

2. Install dependencies

```bash
pip install -r requirements.txt
```

3. Start the backend (runs on `http://localhost:5050`)

```bash
python app.py
```

Health check:

- `GET http://localhost:5050/api/health`

## Setup & Run (Frontend)

From the `frontend/` folder:

```bash
npm install
npm start
```

Frontend runs on:

- `http://localhost:3000`

## Notes

- The backend enables CORS for local development origins (port `3000`).




