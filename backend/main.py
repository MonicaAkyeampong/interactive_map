from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
import os
from database import engine
from routers import emissions

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GHG Emissions Map API")

# Setup CORS for Next.js frontend
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
origins = [
    "http://localhost:3000",
    FRONTEND_URL,
]

if os.getenv("ALLOW_ALL_CORS", "false").lower() == "true":
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(emissions.router)

@app.get("/")
def read_root():
    return {"message": "GHG Emissions API is running. Check /docs for the interactive documentation."}
