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
    
    if not year:
        year = 2022
        
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
    
    if not year:
        year = 2022
    
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

import re

DISTRICT_ALIASES = {
    'atwima-mponua': 'Atwima Mponua District',
    'mfantseman': 'Mfantseman Municipal',
    'akyemansa': 'Akyemansa District',
    'okere': 'Okere District',
    'adenta': 'Adentan Municipal',
    'ashaiman': 'Ashaiman Municipal',
    'korle-klottey': 'Korle Klottey Municipal',
    'krowor': 'Krowor Municipal',
    'la-dade-kotopon': 'La Dade-Kotopon Municipal',
    'ningo-prampram': 'Ningo Prampram District',
    'okaikwei north': 'Okaikwei North Municipal',
    'shai osudoku': 'Shai-Osudoku District',
    'weija gbawe': 'Ga South Municipal',
    'bunkpurugu nakpanduri': 'Bunkpurugu-Nyankpala District',
    'sagnerigu': 'Sagnarigu Municipal',
    'kasena nankana east': 'Kassena-Nankana Municipal',
    'kasena nankana west': 'Kassena-Nankana West District',
    'afadzato south': 'Afadjato South District',
    'keta municipal': 'Keta Municipal',
    'kpando': 'Kpando Municipal',
    'juaboso': 'Juabeso District',
    'ada east': 'Ada East District',
    'ada west': 'Ada West District',
    'ga north': 'Ga North Municipal',
    'east mamprusi': 'Nalerigu-Gambaga (East Mamprusi) Municipal',
    'west mamprusi': 'Walewale (West Mamprusi) Municipal',
    'west gonja': 'Damongo (West Gonja) Municipal',
    'new juaben south': 'Koforidua (New Juaben South) Municipal',
    'new juaben north': 'New Juaben North Municipal',
    'krachi east': 'Dambai (Krachi East) Municipal',
    'tano south': 'Tano South Municipal',
    'adansi akrofuom': 'Akrofuom District',
    'sekyere afram plains north': 'Sekyere Afram Plains District',
    'akwapem south': 'Akuapem South District',
    'akwapem north': 'Akuapem North Municipal',
    'lambussie-karni': 'Lambussie District',
    'dormaa': 'Dormaa Central Municipal',
    'kwaebibirem': 'Kwaebibirem Municipal',
    'juaben': 'Juaben Municipal',
    'tema west': 'Tema West Municipal',
    'atwima-nwabiagya south': 'Atwima Nwabiagya Municipal',
    'bolga east': 'Bolgatanga East District',
    'asikuma-odoben-brakwa': 'Asikuma Odoben Brakwa District',
    'obuasi east': 'Obuasi East District',
    'upper manya': 'Upper Manya Krobo District'
}

@router.get("/district-map-data")
def get_district_map_data(
    year: Optional[int] = None,
    sector_id: Optional[int] = None,
    sector_name: Optional[str] = None,
    region_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    
    if not year:
        year = 2022
    
    if sector_name:
        sector_obj = db.query(models.Sector).filter(models.Sector.sector_name == sector_name).first()
        if sector_obj:
            sector_id = sector_obj.sector_id

    region_id = None
    if region_name:
        region_obj = db.query(models.Region).filter(func.lower(models.Region.region_name) == region_name.lower()).first()
        if region_obj:
            region_id = region_obj.region_id

    # 1. Total emissions per district (filter sector_id IS NULL and gas_id IS NULL to prevent triple counting)
    totals_query = db.query(
        models.District.district_name,
        func.sum(models.DistrictEmission.emission_value).label('total')
    ).join(models.DistrictEmission, models.DistrictEmission.district_id == models.District.district_id)
    
    if region_id:
        totals_query = totals_query.filter(models.District.region_id == region_id)
    if year:
        totals_query = totals_query.filter(models.DistrictEmission.year == year)
    if sector_id:
        totals_query = totals_query.filter(models.DistrictEmission.sector_id == sector_id)
    else:
        totals_query = totals_query.filter(models.DistrictEmission.sector_id.is_(None), models.DistrictEmission.gas_id.is_(None))
        
    totals_results = totals_query.group_by(models.District.district_name).all()
    
    map_data = {}
    for dist_name, total_val in totals_results:
        map_data[dist_name] = {
            "TOTAL_EMISSIONS": float(total_val) if total_val else 0
        }
        
    # 2. Gas breakdown per district (e.g. for 2022 when gas_id is present)
    gas_query = db.query(
        models.District.district_name,
        models.Gas.formula,
        func.sum(models.DistrictEmission.emission_value).label('value')
    ).join(models.DistrictEmission, models.DistrictEmission.district_id == models.District.district_id)\
     .join(models.Gas, models.DistrictEmission.gas_id == models.Gas.gas_id)
     
    if region_id:
        gas_query = gas_query.filter(models.District.region_id == region_id)
    if year:
        gas_query = gas_query.filter(models.DistrictEmission.year == year)
    if sector_id:
        gas_query = gas_query.filter(models.DistrictEmission.sector_id == sector_id)
        
    gas_results = gas_query.group_by(models.District.district_name, models.Gas.formula).all()
    
    for dist_name, gas_formula, val in gas_results:
        if dist_name not in map_data:
            map_data[dist_name] = {}
        map_data[dist_name][gas_formula] = float(val) if val else 0
        
    for dist_name, data_obj in map_data.items():
        gases = {k: v for k, v in data_obj.items() if k != "TOTAL_EMISSIONS" and k != "dominant_gas"}
        dominant_gas = max(gases, key=gases.get) if gases else "None"
        map_data[dist_name]["dominant_gas"] = dominant_gas
        
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
    
    if not year:
        year = 2022
    
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
        target_name = district_name.strip()
        alias_target = DISTRICT_ALIASES.get(target_name.lower(), target_name)
        
        district_obj = db.query(models.District).filter(func.lower(models.District.district_name) == alias_target.lower()).first()
        if not district_obj:
            district_obj = db.query(models.District).filter(func.lower(models.District.district_name) == target_name.lower()).first()
            
        if not district_obj:
            clean_str = re.sub(r'[^a-z0-9]', '', target_name.lower().replace(" district", "").replace(" municipal", "").replace(" metropolitan", "").replace(" assembly", ""))
            all_dists = db.query(models.District).all()
            for d in all_dists:
                d_clean = re.sub(r'[^a-z0-9]', '', d.district_name.lower().replace(" district", "").replace(" municipal", "").replace(" metropolitan", "").replace(" assembly", ""))
                if clean_str and d_clean and (clean_str == d_clean or clean_str in d_clean or d_clean in clean_str):
                    district_obj = d
                    break

        if district_obj:
            district_id = district_obj.district_id
            population = district_obj.pop_2021 or district_obj.pop_2010
        else:
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
    if not gas_id and not sector_id:
        query = query.filter(models.DistrictEmission.sector_id.is_(None), models.DistrictEmission.gas_id.is_(None))
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

