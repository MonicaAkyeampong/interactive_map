from sqlalchemy import Column, Integer, String, Float
from database import Base

class Emission(Base):
    __tablename__ = "emissions"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, index=True)
    district = Column(String, index=True)
    year = Column(Integer, index=True)
    gas_type = Column(String, index=True)
    sector = Column(String, index=True)
    value = Column(Float)
    unit = Column(String, default="CO2e")
    source_count = Column(Integer, default=1)
