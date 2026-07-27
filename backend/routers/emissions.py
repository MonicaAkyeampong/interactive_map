from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/api",
    tags=["emissions"],
)

@router.get("/regions", response_model=List[schemas.Region])
def read_regions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    regions = db.query(models.Region).offset(skip).limit(limit).all()
    return regions

@router.get("/emissions", response_model=List[schemas.EmissionWithRelations])
def read_emissions(
    region_id: Optional[int] = None,
    gas_id: Optional[int] = None,
    year: Optional[int] = None,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    query = db.query(models.Emission)
    
    if region_id is not None:
        query = query.filter(models.Emission.region_id == region_id)
    if gas_id is not None:
        query = query.filter(models.Emission.gas_id == gas_id)
    if year is not None:
        query = query.filter(models.Emission.year == year)
        
    emissions = query.offset(skip).limit(limit).all()
    return emissions

@router.get("/gases", response_model=List[schemas.Gas])
def read_gases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    gases = db.query(models.Gas).offset(skip).limit(limit).all()
    return gases

@router.get("/sectors", response_model=List[schemas.Sector])
def read_sectors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    sectors = db.query(models.Sector).offset(skip).limit(limit).all()
    return sectors

@router.get("/summary")
def get_summary(
    year: Optional[int] = None,
    gas_id: Optional[int] = None,
    sector_id: Optional[int] = None,
    gas_name: Optional[str] = None,
    sector_name: Optional[str] = None,
    region_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    
    # Resolve names to IDs if provided
    if gas_name:
        gas_obj = db.query(models.Gas).filter(models.Gas.formula == gas_name).first()
        if gas_obj:
            gas_id = gas_obj.gas_id
            
    if sector_name:
        sector_obj = db.query(models.Sector).filter(models.Sector.sector_name == sector_name).first()
        if sector_obj:
            sector_id = sector_obj.sector_id

    region_id = None
    population = None
    if region_name:
        region_obj = db.query(models.Region).filter(func.lower(models.Region.region_name) == region_name.lower()).first()
        if region_obj:
            region_id = region_obj.region_id
            population = region_obj.population

    query = db.query(
        func.sum(models.Emission.emission_value).label('total_emissions'),
        func.count(models.Emission.emission_id).label('total_sources')
    )
    
    if year:
        query = query.filter(models.Emission.year == year)
    if gas_id:
        query = query.filter(models.Emission.gas_id == gas_id)
    if sector_id:
        query = query.filter(models.Emission.sector_id == sector_id)
    if region_id:
        query = query.filter(models.Emission.region_id == region_id)
        
    result = query.first()
    
    # Get top region if possible
    top_region_query = db.query(
        models.Region.region_name,
        func.sum(models.Emission.emission_value).label('total')
    ).join(models.Emission, models.Emission.region_id == models.Region.region_id)
    
    if year:
        top_region_query = top_region_query.filter(models.Emission.year == year)
    if gas_id:
        top_region_query = top_region_query.filter(models.Emission.gas_id == gas_id)
    if sector_id:
        top_region_query = top_region_query.filter(models.Emission.sector_id == sector_id)
        
    top_region = top_region_query.group_by(models.Region.region_name).order_by(func.sum(models.Emission.emission_value).desc()).first()
    
    # Get sector breakdown for progress bars
    sector_breakdown_query = db.query(
        models.Sector.sector_name,
        func.sum(models.Emission.emission_value).label('total')
    ).join(models.Emission, models.Emission.sector_id == models.Sector.sector_id)
    
    if year:
        sector_breakdown_query = sector_breakdown_query.filter(models.Emission.year == year)
    if gas_id:
        sector_breakdown_query = sector_breakdown_query.filter(models.Emission.gas_id == gas_id)
    if sector_id:
        sector_breakdown_query = sector_breakdown_query.filter(models.Emission.sector_id == sector_id)
    if region_id:
        sector_breakdown_query = sector_breakdown_query.filter(models.Emission.region_id == region_id)
        
    sector_breakdown_results = sector_breakdown_query.group_by(models.Sector.sector_name).order_by(func.sum(models.Emission.emission_value).desc()).all()
    sector_breakdown = [{"sector": r.sector_name, "total": float(r.total) if r.total else 0} for r in sector_breakdown_results]
    
    # Get gas breakdown
    gas_breakdown_query = db.query(
        models.Gas.formula,
        func.sum(models.Emission.emission_value).label('total')
    ).join(models.Emission, models.Emission.gas_id == models.Gas.gas_id)
    
    if year:
        gas_breakdown_query = gas_breakdown_query.filter(models.Emission.year == year)
    if gas_id:
        gas_breakdown_query = gas_breakdown_query.filter(models.Emission.gas_id == gas_id)
    if sector_id:
        gas_breakdown_query = gas_breakdown_query.filter(models.Emission.sector_id == sector_id)
    if region_id:
        gas_breakdown_query = gas_breakdown_query.filter(models.Emission.region_id == region_id)
        
    gas_breakdown_results = gas_breakdown_query.group_by(models.Gas.formula).order_by(func.sum(models.Emission.emission_value).desc()).all()
    gas_breakdown = [{"gas": r.formula, "total": float(r.total) if r.total else 0} for r in gas_breakdown_results]
    
    return {
        "total_emissions": float(result.total_emissions) if result.total_emissions else 0,
        "total_sources": result.total_sources or 0,
        "top_region": top_region.region_name if top_region else "None",
        "unit": "ktCO2e",
        "sector_breakdown": sector_breakdown,
        "gas_breakdown": gas_breakdown,
        "population": float(population) if population else None
    }

@router.get("/map-data")
def get_map_data(
    year: Optional[int] = None,
    sector_id: Optional[int] = None,
    sector_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    
    if sector_name:
        sector_obj = db.query(models.Sector).filter(models.Sector.sector_name == sector_name).first()
        if sector_obj:
            sector_id = sector_obj.sector_id

    # We want to group by region and gas to give the frontend the data it needs to color the map
    query = db.query(
        models.Region.region_name,
        models.Gas.formula,
        func.sum(models.Emission.emission_value).label('value')
    ).join(models.Emission, models.Emission.region_id == models.Region.region_id)\
     .join(models.Gas, models.Emission.gas_id == models.Gas.gas_id)
     
    if year:
        query = query.filter(models.Emission.year == year)
    if sector_id:
        query = query.filter(models.Emission.sector_id == sector_id)
        
    results = query.group_by(models.Region.region_name, models.Gas.formula).all()
    
    # Process into a nested dict: { "Region Name": { "CO2": 100, "CH4": 50, "dominant_gas": "CO2" } }
    map_data = {}
    for region_name, gas_formula, value in results:
        if region_name not in map_data:
            map_data[region_name] = {}
        # Convert numeric to float
        map_data[region_name][gas_formula] = float(value) if value else 0
        
    # Calculate dominant gas for each region
    for region_name, gases in map_data.items():
        dominant_gas = max(gases, key=gases.get) if gases else "None"
        map_data[region_name]["dominant_gas"] = dominant_gas
        
    return map_data

@router.get("/available-filters")
def get_available_filters(
    year: Optional[int] = None,
    gas_name: Optional[str] = None,
    sector_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Base query for all emissions
    query = db.query(models.Emission)
    
    # If parameters are provided, resolve IDs and filter
    if gas_name:
        gas_obj = db.query(models.Gas).filter(models.Gas.formula == gas_name).first()
        if gas_obj:
            query = query.filter(models.Emission.gas_id == gas_obj.gas_id)
            
    if sector_name:
        sector_obj = db.query(models.Sector).filter(models.Sector.sector_name == sector_name).first()
        if sector_obj:
            query = query.filter(models.Emission.sector_id == sector_obj.sector_id)
            
    if year:
        query = query.filter(models.Emission.year == year)
        
    # We need to find distinct years, gases, and sectors remaining in the filtered query
    # Subquery of the valid emissions
    valid_emissions = query.subquery()
    
    # Get distinct years
    years = [y[0] for y in db.query(valid_emissions.c.year).distinct().all()]
    
    # Get distinct gases
    gas_ids = [g[0] for g in db.query(valid_emissions.c.gas_id).distinct().all()]
    gases = [g.formula for g in db.query(models.Gas).filter(models.Gas.gas_id.in_(gas_ids)).all()] if gas_ids else []
    
    # Get distinct sectors
    sector_ids = [s[0] for s in db.query(valid_emissions.c.sector_id).distinct().all()]
    sectors = [s.sector_name for s in db.query(models.Sector).filter(models.Sector.sector_id.in_(sector_ids)).all()] if sector_ids else []
    
    return {
        "years": sorted(years),
        "gases": sorted(gases),
        "sectors": sorted(sectors)
    }

@router.get("/districts", response_model=List[schemas.District])
def read_districts(
    region_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 300,
    db: Session = Depends(get_db)
):
    query = db.query(models.District)
    if region_id is not None:
        query = query.filter(models.District.region_id == region_id)
    districts = query.offset(skip).limit(limit).all()
    return districts

@router.get("/district-emissions", response_model=List[schemas.DistrictEmissionWithRelations])

@router.get("/district-map-data")
def get_district_map_data(
    year: Optional[int] = None,
    sector_id: Optional[int] = None,
    sector_name: Optional[str] = None,
    region_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    
    if sector_name:
        sector_obj = db.query(models.Sector).filter(models.Sector.sector_name == sector_name).first()
        if sector_obj:
            sector_id = sector_obj.sector_id

    query = db.query(
        models.District.district_name,
        models.Gas.formula,
        func.sum(models.DistrictEmission.emission_value).label('value')
    ).join(models.DistrictEmission, models.DistrictEmission.district_id == models.District.district_id)\
     .join(models.Gas, models.DistrictEmission.gas_id == models.Gas.gas_id)
     
    if region_name:
        region_obj = db.query(models.Region).filter(func.lower(models.Region.region_name) == region_name.lower()).first()
        if region_obj:
            query = query.filter(models.District.region_id == region_obj.region_id)
            
    if year:
        query = query.filter(models.DistrictEmission.year == year)
    if sector_id:
        query = query.filter(models.DistrictEmission.sector_id == sector_id)
        
    results = query.group_by(models.District.district_name, models.Gas.formula).all()
    
    map_data = {}
    for district_name, gas_formula, value in results:
        if district_name not in map_data:
            map_data[district_name] = {}
        map_data[district_name][gas_formula] = float(value) if value else 0
        
    for district_name, gases in map_data.items():
        dominant_gas = max(gases, key=gases.get) if gases else "None"
        map_data[district_name]["dominant_gas"] = dominant_gas
        
    return map_data

@router.get("/district-summary")
def get_district_summary(
    year: Optional[int] = None,
    gas_id: Optional[int] = None,
    sector_id: Optional[int] = None,
    gas_name: Optional[str] = None,
    sector_name: Optional[str] = None,
    district_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    
    if gas_name:
        gas_obj = db.query(models.Gas).filter(models.Gas.formula == gas_name).first()
        if gas_obj:
            gas_id = gas_obj.gas_id
            
    if sector_name:
        sector_obj = db.query(models.Sector).filter(models.Sector.sector_name == sector_name).first()
        if sector_obj:
            sector_id = sector_obj.sector_id

    district_id = None
    population = None
    if district_name:
        clean_name = district_name.lower().replace(" district", "").replace(" municipal", "").replace(" metropolitan", "").replace(" assembly", "").strip()
        # Try exact match first
        district_obj = db.query(models.District).filter(func.lower(models.District.district_name) == district_name.lower()).first()
        if not district_obj:
            # Try fuzzy match
            district_obj = db.query(models.District).filter(func.lower(models.District.district_name).like(f"%{clean_name}%")).first()
            
        if district_obj:
            district_id = district_obj.district_id
            population = district_obj.pop_2021 or district_obj.pop_2010
        else:
            # Prevent summing national total by forcing a query that returns 0
            district_id = -1

    query = db.query(
        func.sum(models.DistrictEmission.emission_value).label('total_emissions'),
        func.count(models.DistrictEmission.district_emission_id).label('total_sources')
    )
    
    if year:
        query = query.filter(models.DistrictEmission.year == year)
    if gas_id:
        query = query.filter(models.DistrictEmission.gas_id == gas_id)
    if sector_id:
        query = query.filter(models.DistrictEmission.sector_id == sector_id)
    if district_id:
        query = query.filter(models.DistrictEmission.district_id == district_id)
        
    result = query.first()
    
    # Get top gas
    gas_breakdown_query = db.query(
        models.Gas.formula,
        func.sum(models.DistrictEmission.emission_value).label('total')
    ).join(models.DistrictEmission, models.DistrictEmission.gas_id == models.Gas.gas_id)
    
    if year:
        gas_breakdown_query = gas_breakdown_query.filter(models.DistrictEmission.year == year)
    if sector_id:
        gas_breakdown_query = gas_breakdown_query.filter(models.DistrictEmission.sector_id == sector_id)
    if district_id:
        gas_breakdown_query = gas_breakdown_query.filter(models.DistrictEmission.district_id == district_id)
        
    gas_breakdown_results = gas_breakdown_query.group_by(models.Gas.formula).order_by(func.sum(models.DistrictEmission.emission_value).desc()).all()
    gas_breakdown = [{"gas": r.formula, "total": float(r.total) if r.total else 0} for r in gas_breakdown_results]
    
    # Get top sector
    sector_breakdown_query = db.query(
        models.Sector.sector_name,
        func.sum(models.DistrictEmission.emission_value).label('total')
    ).join(models.DistrictEmission, models.DistrictEmission.sector_id == models.Sector.sector_id)
    
    if year:
        sector_breakdown_query = sector_breakdown_query.filter(models.DistrictEmission.year == year)
    if gas_id:
        sector_breakdown_query = sector_breakdown_query.filter(models.DistrictEmission.gas_id == gas_id)
    if district_id:
        sector_breakdown_query = sector_breakdown_query.filter(models.DistrictEmission.district_id == district_id)
        
    sector_breakdown_results = sector_breakdown_query.group_by(models.Sector.sector_name).order_by(func.sum(models.DistrictEmission.emission_value).desc()).all()
    sector_breakdown = [{"sector": r.sector_name, "total": float(r.total) if r.total else 0} for r in sector_breakdown_results]

    return {
        "total_emissions": float(result.total_emissions) if result.total_emissions else 0,
        "total_sources": result.total_sources or 0,
        "unit": "ktCO2e",
        "sector_breakdown": sector_breakdown,
        "gas_breakdown": gas_breakdown,
        "population": float(population) if population else None
    }

@router.get("/district-emissions", response_model=List[schemas.DistrictEmissionWithRelations])
def read_district_emissions(
    district_id: Optional[int] = None,
    gas_id: Optional[int] = None,
    sector_id: Optional[int] = None,
    year: Optional[int] = None,
    skip: int = 0,
    limit: int = 2000,
    db: Session = Depends(get_db)
):
    query = db.query(models.DistrictEmission)
    
    if district_id is not None:
        query = query.filter(models.DistrictEmission.district_id == district_id)
    if gas_id is not None:
        query = query.filter(models.DistrictEmission.gas_id == gas_id)
    if sector_id is not None:
        query = query.filter(models.DistrictEmission.sector_id == sector_id)
    if year is not None:
        query = query.filter(models.DistrictEmission.year == year)
        
    emissions = query.offset(skip).limit(limit).all()
    return emissions

