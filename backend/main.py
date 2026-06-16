from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import emissions

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GHG Emissions Map API")

# Setup CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(emissions.router)

@app.get("/")
def read_root():
    return {"message": "GHG Emissions API is running. Check /docs for the interactive documentation."}
