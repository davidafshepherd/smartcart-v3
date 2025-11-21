# SmartCart v3

- `frontend/` – Next.js dashboard
- `backend/` – FastAPI API + ML pipeline
- `docs/` – architecture diagrams, API contracts, notes

## Getting Started

First, download [Node.js v24.11.1 (LTS)](https://nodejs.org/en/download) and verify it is installed:

```bash
node -v
npm -v
```

Next, install and configure Poetry:

```bash
pip install poetry
poetry --version
poetry config virtualenvs.in-project true
```

Next, clone the repository:

```bash
git clone https://github.com/davidafshepherd/smartcart-v3
cd smartcart-v3
```

Next, set up the backend:

```bash
cd backend
poetry install
```

Run the backend to verify it is set up:

```bash
poetry run uvicorn app.main:app --reload --port 8000
```

The backend will run at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs). Press CTRL + C to exit.

Next, set up the frontend:

```bash
cd ../frontend
npm install
```
Run the frontend to verify it is set up:

```bash
npm run dev
```

The frontend will run at [http://localhost:3000](http://localhost:3000). Press CTRL + C to exit.
