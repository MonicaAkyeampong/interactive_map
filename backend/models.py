from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, BigInteger, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Region(Base):
    __tablename__ = "regions"

    region_id = Column(Integer, primary_key=True, index=True)
    region_name = Column(String(100), nullable=False, unique=True)
    area_km2 = Column(Numeric(12, 2))
    population = Column(BigInteger)
    created_at = Column(DateTime, default=datetime.utcnow)

    emissions = relationship("Emission", back_populates="region")

class Sector(Base):
    __tablename__ = "sectors"

    sector_id = Column(Integer, primary_key=True, index=True)
    sector_name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)

    emissions = relationship("Emission", back_populates="sector")

class Gas(Base):
    __tablename__ = "gases"

    gas_id = Column(Integer, primary_key=True, index=True)
    gas_name = Column(String(100), nullable=False, unique=True)
    formula = Column(String(20))
    gwp100 = Column(Numeric(10, 2))
    description = Column(Text)

    emissions = relationship("Emission", back_populates="gas")

class Dataset(Base):
    __tablename__ = "datasets"

    dataset_id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String(255), nullable=False)
    source_organization = Column(String(255))
    methodology = Column(Text)
    version = Column(String(50))
    publication_year = Column(Integer)
    citation = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    emissions = relationship("Emission", back_populates="dataset")

class Emission(Base):
    __tablename__ = "emissions"

    emission_id = Column(BigInteger, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.region_id"), nullable=False)
    sector_id = Column(Integer, ForeignKey("sectors.sector_id"), nullable=False)
    gas_id = Column(Integer, ForeignKey("gases.gas_id"), nullable=False)
    year = Column(Integer, nullable=False)
    emission_value = Column(Numeric(20, 6), nullable=False)
    unit = Column(String(50), default='tCO2e')
    dataset_id = Column(Integer, ForeignKey("datasets.dataset_id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    region = relationship("Region", back_populates="emissions")
    sector = relationship("Sector", back_populates="emissions")
    gas = relationship("Gas", back_populates="emissions")
    dataset = relationship("Dataset", back_populates="emissions")

    __table_args__ = (
        UniqueConstraint('region_id', 'sector_id', 'gas_id', 'year', name='uq_emission_record'),
    )
