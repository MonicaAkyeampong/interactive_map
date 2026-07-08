from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
from sqlalchemy import func

router = APIRouter(
    prefix="/api/analysis",
    tags=["analysis"],
)

@router.get("/compare")
def compare_entities(
    type: str = Query(..., description="Level of analysis: national, region, or district"),
    ids: Optional[str] = Query(None, description="Comma-separated list of IDs to compare"),
    db: Session = Depends(get_db)
):
    valid_types = ["national", "region", "district"]
    if type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid type. Must be one of {valid_types}")

    entity_ids = []
    if type != "national":
        if not ids:
            raise HTTPException(status_code=400, detail="ids query parameter is required for region or district types")
        if ids.lower() == "all":
            entity_ids = "all"
        else:
            try:
                entity_ids = [int(i.strip()) for i in ids.split(",") if i.strip()]
            except ValueError:
                raise HTTPException(status_code=400, detail="ids must be comma-separated integers or 'all'")
            
            if not entity_ids:
                raise HTTPException(status_code=400, detail="At least one valid id must be provided")

    results = []

    if type == "national":
        # National aggregation
        # Demographics
        total_pop2010 = db.query(func.sum(models.District.pop_2010)).scalar() or 0
        total_pop2021 = db.query(func.sum(models.District.pop_2021)).scalar() or 0
        
        # Historical (1990-2022)
        historical_query = db.query(
            models.Emission.year,
            func.sum(models.Emission.emission_value).label('total')
        ).group_by(models.Emission.year).order_by(models.Emission.year).all()
        
        historical_data = [{"year": row.year, "total": float(row.total)} for row in historical_query]

        # 2022 Sectors
        sectors_2022_query = db.query(
            models.Sector.sector_name,
            func.sum(models.Emission.emission_value).label('total')
        ).join(models.Sector, models.Emission.sector_id == models.Sector.sector_id) \
         .filter(models.Emission.year == 2022) \
         .group_by(models.Sector.sector_name).all()
         
        sectors_2022 = {row.sector_name: float(row.total) for row in sectors_2022_query}
        
        # 2022 Gases
        gases_2022_query = db.query(
            models.Gas.formula,
            func.sum(models.Emission.emission_value).label('total')
        ).join(models.Gas, models.Emission.gas_id == models.Gas.gas_id) \
         .filter(models.Emission.year == 2022) \
         .group_by(models.Gas.formula).all()
         
        gases_2022 = {row.formula: float(row.total) for row in gases_2022_query}

        total_emissions_2022 = sum(sectors_2022.values())
        per_capita_2022 = (float(total_emissions_2022) * 1000.0) / float(total_pop2021) if total_pop2021 else 0

        results.append({
            "id": 0,
            "name": "Ghana (National)",
            "abbreviation": None,
            "type": "national",
            "demographics": {
                "pop2010": int(total_pop2010),
                "pop2021": int(total_pop2021),
                "reg_share_pct": 100.0,
                "rank_2022": 1,
                "per_capita_2022": round(per_capita_2022, 6)
            },
            "historical": historical_data,
            "sectors_2022": sectors_2022,
            "gases_2022": gases_2022
        })

    elif type == "region":
        if entity_ids == "all":
            regions = db.query(models.Region).all()
        else:
            regions = db.query(models.Region).filter(models.Region.region_id.in_(entity_ids)).all()
        for region in regions:
            # Region demographics
            # Calculate from districts
            districts_stats = db.query(
                func.sum(models.District.pop_2010).label("pop2010"),
                func.sum(models.District.pop_2021).label("pop2021")
            ).filter(models.District.region_id == region.region_id).first()
            
            pop2010 = districts_stats.pop2010 or 0
            pop2021 = districts_stats.pop2021 or region.population or 0

            # Historical (1990-2022)
            historical_query = db.query(
                models.Emission.year,
                func.sum(models.Emission.emission_value).label('total')
            ).filter(models.Emission.region_id == region.region_id) \
             .group_by(models.Emission.year).order_by(models.Emission.year).all()
             
            historical_data = [{"year": row.year, "total": float(row.total)} for row in historical_query]

            # 2022 Sectors
            sectors_2022_query = db.query(
                models.Sector.sector_name,
                func.sum(models.Emission.emission_value).label('total')
            ).join(models.Sector, models.Emission.sector_id == models.Sector.sector_id) \
             .filter(models.Emission.region_id == region.region_id) \
             .filter(models.Emission.year == 2022) \
             .group_by(models.Sector.sector_name).all()
             
            sectors_2022 = {row.sector_name: float(row.total) for row in sectors_2022_query}

            # 2022 Gases
            gases_2022_query = db.query(
                models.Gas.formula,
                func.sum(models.Emission.emission_value).label('total')
            ).join(models.Gas, models.Emission.gas_id == models.Gas.gas_id) \
             .filter(models.Emission.region_id == region.region_id) \
             .filter(models.Emission.year == 2022) \
             .group_by(models.Gas.formula).all()
             
            gases_2022 = {row.formula: float(row.total) for row in gases_2022_query}

            total_emissions_2022 = sum(sectors_2022.values())
            per_capita_2022 = (float(total_emissions_2022) * 1000.0) / float(pop2021) if pop2021 else 0

            results.append({
                "id": region.region_id,
                "name": region.region_name,
                "abbreviation": region.abbreviation,
                "type": "region",
                "demographics": {
                    "pop2010": int(pop2010),
                    "pop2021": int(pop2021),
                    "reg_share_pct": None,
                    "rank_2022": None,
                    "per_capita_2022": round(per_capita_2022, 6)
                },
                "historical": historical_data,
                "sectors_2022": sectors_2022,
                "gases_2022": gases_2022
            })

    elif type == "district":
        if entity_ids == "all":
            districts = db.query(models.District).all()
        else:
            districts = db.query(models.District).filter(models.District.district_id.in_(entity_ids)).all()
        for district in districts:
            # Historical (1990-2022)
            historical_query = db.query(
                models.DistrictEmission.year,
                func.sum(models.DistrictEmission.emission_value).label('total')
            ).filter(models.DistrictEmission.district_id == district.district_id) \
             .filter(models.DistrictEmission.sector_id == None) \
             .filter(models.DistrictEmission.gas_id == None) \
             .group_by(models.DistrictEmission.year).order_by(models.DistrictEmission.year).all()
             
            historical_data = [{"year": row.year, "total": float(row.total)} for row in historical_query]

            # 2022 Sectors
            sectors_2022_query = db.query(
                models.Sector.sector_name,
                func.sum(models.DistrictEmission.emission_value).label('total')
            ).join(models.Sector, models.DistrictEmission.sector_id == models.Sector.sector_id) \
             .filter(models.DistrictEmission.district_id == district.district_id) \
             .filter(models.DistrictEmission.year == 2022) \
             .group_by(models.Sector.sector_name).all()
             
            sectors_2022 = {row.sector_name: float(row.total) for row in sectors_2022_query}

            # 2022 Gases
            gases_2022_query = db.query(
                models.Gas.formula,
                func.sum(models.DistrictEmission.emission_value).label('total')
            ).join(models.Gas, models.DistrictEmission.gas_id == models.Gas.gas_id) \
             .filter(models.DistrictEmission.district_id == district.district_id) \
             .filter(models.DistrictEmission.year == 2022) \
             .group_by(models.Gas.formula).all()
             
            gases_2022 = {row.formula: float(row.total) for row in gases_2022_query}

            results.append({
                "id": district.district_id,
                "name": district.district_name,
                "abbreviation": None,
                "type": "district",
                "demographics": {
                    "pop2010": district.pop_2010,
                    "pop2021": district.pop_2021,
                    "reg_share_pct": float(district.reg_share_pct) if district.reg_share_pct else None,
                    "rank_2022": district.rank_2022,
                    "per_capita_2022": float(district.per_capita_2022) if district.per_capita_2022 else None
                },
                "historical": historical_data,
                "sectors_2022": sectors_2022,
                "gases_2022": gases_2022
            })

    return {"comparison_data": results}

@router.get("/kpi")
def get_analysis_kpis(db: Session = Depends(get_db)):
    # Highest Emitting Region (2022)
    highest_region = db.query(
        models.Region.region_name,
        func.sum(models.Emission.emission_value).label('total')
    ).join(models.Emission, models.Region.region_id == models.Emission.region_id) \
     .filter(models.Emission.year == 2022) \
     .group_by(models.Region.region_name) \
     .order_by(func.sum(models.Emission.emission_value).desc()).first()

    # Highest Emitting District (2022)
    highest_district = db.query(
        models.District.district_name,
        func.sum(models.DistrictEmission.emission_value).label('total')
    ).join(models.DistrictEmission, models.District.district_id == models.DistrictEmission.district_id) \
     .filter(models.DistrictEmission.year == 2022) \
     .filter(models.DistrictEmission.sector_id == None) \
     .filter(models.DistrictEmission.gas_id == None) \
     .group_by(models.District.district_name) \
     .order_by(func.sum(models.DistrictEmission.emission_value).desc()).first()

    # Primary Gas (2022)
    primary_gas = db.query(
        models.Gas.formula,
        func.sum(models.Emission.emission_value).label('total')
    ).join(models.Emission, models.Gas.gas_id == models.Emission.gas_id) \
     .filter(models.Emission.year == 2022) \
     .group_by(models.Gas.formula) \
     .order_by(func.sum(models.Emission.emission_value).desc()).first()

    return {
        "highest_region": {
            "name": highest_region.region_name if highest_region else "N/A",
            "value": float(highest_region.total) if highest_region else 0
        },
        "highest_district": {
            "name": highest_district.district_name if highest_district else "N/A",
            "value": float(highest_district.total) if highest_district else 0
        },
        "primary_gas": {
            "name": primary_gas.formula if primary_gas else "N/A",
            "value": float(primary_gas.total) if primary_gas else 0
        }
    }
