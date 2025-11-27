from app.db import Base, engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import patients, menu


# Create tables if they don't exist already
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow the Next.js frontend to call this API
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(patients.router, prefix="/patients", tags=["patients"])
app.include_router(menu.router, prefix="/menu", tags=["menu"])
