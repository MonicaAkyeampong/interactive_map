import pandas as pd
import json

excel_file = "Ghana_GHG_Regional_Emissions_1990_2022.xlsx"

try:
    df = pd.read_excel(excel_file, sheet_name="Raw Data")
    print("Excel Data Info:")
    print(df.head())
    print("\nUnique Regions in Excel:")
    print(df['Region'].unique())
    print("\nColumns in Excel:")
    print(df.columns.tolist())
    
    # Calculate total for a single year to see where 54,000 vs 200,000 comes from
    # E.g., for year 2022
    df_2022 = df[df['Year'] == 2022]
    # Sum of all emission columns
    emission_cols = [c for c in df.columns if c not in ['Year', 'Region']]
    total_2022 = df_2022[emission_cols].sum().sum()
    print(f"\nTotal emissions in 2022 across all regions and gases: {total_2022}")

except Exception as e:
    print(f"Error reading excel: {e}")

try:
    with open('../frontend/public/ghana.geojson', 'r') as f:
        geojson = json.load(f)
    print("\nGeoJSON Regions:")
    for feature in geojson['features'][:5]:
        print(feature['properties'])
except Exception as e:
    print(f"Error reading geojson: {e}")
