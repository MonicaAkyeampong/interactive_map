import pandas as pd
from sqlalchemy import create_engine
import json

engine = create_engine("postgresql+psycopg2://postgres:Algorithms@localhost:5432/ghana_ghg")

try:
    df = pd.read_sql("""
        SELECT DISTINCT e.year, g.formula as gas, s.sector_name as sector
        FROM emissions e
        JOIN gases g ON e.gas_id = g.gas_id
        JOIN sectors s ON e.sector_id = s.sector_id
    """, engine)
    
    # Check what sectors emit CH4
    ch4_sectors = df[df['gas'] == 'CH4']['sector'].unique().tolist()
    print(f"CH4 is emitted in: {ch4_sectors}")
    
    # Check what gases are emitted in Waste
    waste_gases = df[df['sector'] == 'Waste']['gas'].unique().tolist()
    print(f"Waste emits: {waste_gases}")
    
except Exception as e:
    print("Error:", e)
