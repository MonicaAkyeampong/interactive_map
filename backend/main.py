from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

import models
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GHG Emissions API")

# Setup CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "GHG Emissions API is running."}

@app.get("/api/filters")
def get_filters(db: Session = Depends(get_db)):
    years = [r[0] for r in db.query(models.Emission.year).distinct().all()]
    gases = [r[0] for r in db.query(models.Emission.gas_type).distinct().all()]
    sectors = [r[0] for r in db.query(models.Emission.sector).distinct().all()]
    return {"years": years, "gases": gases, "sectors": sectors}

@app.get("/api/emissions/summary")
def get_summary(
    year: Optional[int] = None,
    gas: Optional[str] = None,
    sector: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(func.sum(models.Emission.value).label('total_emissions'), func.sum(models.Emission.source_count).label('total_sources'))
    
    if year:
        query = query.filter(models.Emission.year == year)
    if gas:
        query = query.filter(models.Emission.gas_type == gas)
    if sector:
        query = query.filter(models.Emission.sector == sector)
        
    result = query.first()
    
    return {
        "total_emissions": result.total_emissions or 0,
        "total_sources": result.total_sources or 0,
        "unit": "CO2e"
    }

@app.get("/api/emissions/by-region")
def get_emissions_by_region(
    year: Optional[int] = None,
    gas: Optional[str] = None,
    sector: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Emission.region, func.sum(models.Emission.value).label('value'))
    
    if year:
        query = query.filter(models.Emission.year == year)
    if gas:
        query = query.filter(models.Emission.gas_type == gas)
    if sector:
        query = query.filter(models.Emission.sector == sector)
        
    results = query.group_by(models.Emission.region).all()
    
    return [{"region": r.region, "value": r.value} for r in results]
