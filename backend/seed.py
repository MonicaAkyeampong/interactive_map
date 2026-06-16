import os
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import engine, SessionLocal
from models import Base, Dataset, Region, Sector, Gas, Emission

def seed_database(file_path: str):
    if not os.path.exists(file_path):
        print(f"File {file_path} not found.")
        return

    print("Dropping existing tables and recreating them from models...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()

    try:
        # =====================================================
        # 1. INITIAL REFERENCE DATA SEEDING
        # =====================================================
        print("Seeding datasets, regions, sectors, and gases...")
        
        # Datasets
        dataset = Dataset(
            dataset_name="Ghana NID1/NIR6",
            source_organization="EPA-Ghana & NCEL KNUST",
            publication_year=2024,
            methodology="IPCC 2006 Guidelines + 2019 Refinement | GWP AR5"
        )
        session.add(dataset)
        session.flush() # flush to get dataset_id
        dataset_id = dataset.dataset_id

        # Sectors
        sector_names = ['Energy', 'Agriculture', 'LULUCF', 'IPPU', 'Waste']
        sectors_dict = {}
        for s_name in sector_names:
            sec = Sector(sector_name=s_name)
            session.add(sec)
            session.flush()
            sectors_dict[s_name] = sec.sector_id

        # Gases
        gas_names = ['CO2', 'CH4', 'N2O', 'HFC']
        gases_dict = {}
        for g_name in gas_names:
            gas = Gas(gas_name=g_name, formula=g_name)
            session.add(gas)
            session.flush()
            gases_dict[g_name] = gas.gas_id

        # =====================================================
        # 2. READ EXCEL DATA
        # =====================================================
        print(f"Reading data from {file_path}...")
        
        # The user mentioned "GHG_dataset_Raw_Data.csv", but we might have "GHG_dataset.xlsx".
        # We handle both just in case:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            # Assuming Excel, potentially looking for "Raw Data" sheet or just default sheet
            df = pd.read_excel(file_path, sheet_name="Raw Data" if "Raw Data" in pd.ExcelFile(file_path).sheet_names else 0)

        # Drop the last three rows which contain metadata footer text
        df = df.iloc[:-3]

        # Extract regions and population
        # Assuming the dataframe has 'Region' and 'Population' columns
        regions_dict = {}
        df_sorted_pop = df.dropna(subset=['Region', 'Population']).sort_values('Year')
        latest_pop = df_sorted_pop.groupby('Region')['Population'].last().to_dict()

        for region_name, pop in latest_pop.items():
            if pd.isna(region_name): continue
            reg = Region(region_name=region_name, population=int(pop))
            session.add(reg)
            session.flush()
            regions_dict[region_name] = reg.region_id
            
        session.commit()

        # =====================================================
        # 3. DATA PROCESSING & PANDAS MELTING
        # =====================================================
        print("Processing and melting emission data...")
        
        # Identify columns to melt. 
        # Exclude: Year, Region, Population, and any pre-calculated aggregations
        exclude_keywords = ["Total", "Tot_", "Natl", "Share_%"]
        id_vars = ["Year", "Region", "Population"]
        
        # Filter the actual columns present in df
        actual_id_vars = [col for col in id_vars if col in df.columns]
        
        value_vars = []
        for col in df.columns:
            if col in actual_id_vars:
                continue
            if any(k in col for k in exclude_keywords):
                continue
            if "_" in col and len(col.split("_")) == 2:
                sec, g = col.split("_")
                if sec in sector_names and g in gas_names:
                    value_vars.append(col)

        # Melt the dataframe
        melted_df = pd.melt(df, id_vars=actual_id_vars, value_vars=value_vars, var_name="Sector_Gas", value_name="Emission_Value")
        
        # Drop rows with NaN emission values or missing Region/Year
        melted_df = melted_df.dropna(subset=["Emission_Value", "Region", "Year"])

        # Bulk insert records
        records_to_insert = []
        for _, row in melted_df.iterrows():
            region_name = row["Region"]
            year = int(row["Year"])
            emission_value = float(row["Emission_Value"])
            
            # Split Sector and Gas
            sector_name, gas_formula = row["Sector_Gas"].split("_")
            
            # Map strings to primary keys
            region_id = regions_dict.get(region_name)
            sector_id = sectors_dict.get(sector_name)
            gas_id = gases_dict.get(gas_formula)
            
            if region_id and sector_id and gas_id:
                records_to_insert.append({
                    "region_id": region_id,
                    "sector_id": sector_id,
                    "gas_id": gas_id,
                    "year": year,
                    "emission_value": emission_value,
                    "unit": "ktCO2e",
                    "dataset_id": dataset_id
                })

        # Insert into database using SQLAlchemy bulk insert
        if records_to_insert:
            session.bulk_insert_mappings(Emission, records_to_insert)
            session.commit()
            print(f"Success! {len(records_to_insert)} emission records were successfully inserted into the database.")
        else:
            print("No valid emission records were found to insert.")

    except Exception as e:
        session.rollback()
        print(f"An error occurred during seeding: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    import sys
    # Let's see if the requested file exists, otherwise try the local one
    file_path = "GHG_dataset_Raw_Data.csv"
    if not os.path.exists(file_path):
        if os.path.exists("GHG_dataset.xlsx"):
            file_path = "GHG_dataset.xlsx"
            
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        
    seed_database(file_path)
