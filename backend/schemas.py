from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# Region Schemas
class RegionBase(BaseModel):
    region_name: str
    area_km2: Optional[Decimal] = None
    population: Optional[int] = None

class RegionCreate(RegionBase):
    pass

class Region(RegionBase):
    region_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Sector Schemas
class SectorBase(BaseModel):
    sector_name: str
    description: Optional[str] = None

class SectorCreate(SectorBase):
    pass

class Sector(SectorBase):
    sector_id: int

    class Config:
        from_attributes = True

# Gas Schemas
class GasBase(BaseModel):
    gas_name: str
    formula: Optional[str] = None
    gwp100: Optional[Decimal] = None
    description: Optional[str] = None

class GasCreate(GasBase):
    pass

class Gas(GasBase):
    gas_id: int

    class Config:
        from_attributes = True

# Dataset Schemas
class DatasetBase(BaseModel):
    dataset_name: str
    source_organization: Optional[str] = None
    methodology: Optional[str] = None
    version: Optional[str] = None
    publication_year: Optional[int] = None
    citation: Optional[str] = None
    notes: Optional[str] = None

class DatasetCreate(DatasetBase):
    pass

class Dataset(DatasetBase):
    dataset_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Emission Schemas
class EmissionBase(BaseModel):
    region_id: int
    sector_id: int
    gas_id: int
    year: int
    emission_value: Decimal
    unit: Optional[str] = 'tCO2e'
    dataset_id: Optional[int] = None

class EmissionCreate(EmissionBase):
    pass

class Emission(EmissionBase):
    emission_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class EmissionWithRelations(Emission):
    region: Region
    sector: Sector
    gas: Gas
    dataset: Optional[Dataset] = None

    class Config:
        orm_mode = True
