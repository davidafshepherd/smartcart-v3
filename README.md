# SmartCart v3

- `frontend/` – React dashboard
- `backend/` – FastAPI backend + ML pipeline

This project requires `python>=3.12`.

## Getting Started

First, download [Node.js v24.11.1 (LTS)](https://nodejs.org/en/download) and verify it is installed:

```bash
node -v
npm -v
```

Next, download [Miniconda](https://www.anaconda.com/docs/getting-started/installation) and verify it is installed:

```bash
conda --version
```

Next, clone the repository:

```bash
git clone https://github.com/davidafshepherd/smartcart-v3
cd smartcart-v3
```

Next, set up the backend:

```bash
cd backend
conda create -n smartcart-v3 python=3.12
conda activate smartcart-v3
pip install -r requirements.txt
```

Run the backend to verify it is set up:

```bash
uvicorn src.main:app --reload --port 8000
```

The backend will run at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs). Press `CTRL + C` to exit.

Lastly, set up the frontend:

```bash
conda deactivate
cd ../frontend
npm install
```
Run the frontend to verify it is set up:

```bash
npm run dev
```

The frontend will run at [http://localhost:3000](http://localhost:5173). Press `CTRL + C` to exit.

## Preview

![image](https://github.com/user-attachments/assets/79ca51c1-b3fb-4251-aefe-4ee98718d581)

![image](https://github.com/user-attachments/assets/dacf608d-5aae-4b2c-adcb-95dda9d1c3b1)

![image](https://github.com/user-attachments/assets/ae3db257-8a93-4ecd-bd00-003074b93c7d)

![image](https://github.com/user-attachments/assets/491c9584-9384-4ae3-b3b8-3caf33bee5cd)

![image](https://github.com/user-attachments/assets/42b204ee-e75f-4066-aea3-f4110a4410ac)

![image](https://github.com/user-attachments/assets/1af5ec72-69fc-4ce5-9677-01c7f7f1411e)

![image](https://github.com/user-attachments/assets/c8c46d60-899c-4568-bd4a-101333167cb2)

![image](https://github.com/user-attachments/assets/37cc2c91-6050-4dec-911e-18d0d98e6539)
