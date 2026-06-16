import pandas as pd

try:
    df = pd.read_excel("GHG_dataset.xlsx", sheet_name="Raw Data")
    df = df.iloc[:-3]
    
    exclude_keywords = ["Total", "Tot_", "Natl", "Share_%"]
    id_vars = ["Year", "Region", "Population"]
    actual_id_vars = [col for col in id_vars if col in df.columns]
    
    value_vars = []
    for col in df.columns:
        if col in actual_id_vars: continue
        if any(k in col for k in exclude_keywords): continue
        if "_" in col and len(col.split("_")) == 2:
            value_vars.append(col)
            
    melted = pd.melt(df, id_vars=actual_id_vars, value_vars=value_vars, var_name="Sector_Gas", value_name="Emission_Value")
    melted = melted.dropna(subset=["Emission_Value", "Region", "Year"])
    
    # 1. Sum of everything
    total_all = melted['Emission_Value'].sum()
    print(f"Total over all years and regions: {total_all}")
    
    # 2. Sum for year 2022
    total_2022 = melted[melted['Year'] == 2022]['Emission_Value'].sum()
    print(f"Total for 2022: {total_2022}")
    
except Exception as e:
    print("Error:", e)
