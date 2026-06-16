import pandas as pd
from sqlalchemy import create_engine

engine = create_engine("postgresql+psycopg2://postgres:Algorithms@localhost:5432/ghana_ghg")

try:
    df = pd.read_sql("SELECT year, sum(emission_value) as total FROM emissions GROUP BY year ORDER BY year", engine)
    print("Yearly Totals in DB:")
    print(df)
    
    total_all = pd.read_sql("SELECT sum(emission_value) FROM emissions", engine)
    print(f"\nTotal of all records: {total_all.iloc[0,0]}")
    
    # check region names in DB vs what we mapped
    regions = pd.read_sql("SELECT region_name FROM regions", engine)
    print(f"\nRegions in DB: {regions['region_name'].tolist()}")
except Exception as e:
    print(f"Error: {e}")
