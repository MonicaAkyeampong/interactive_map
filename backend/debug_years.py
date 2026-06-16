import pandas as pd

try:
    df = pd.read_excel("GHG_dataset.xlsx", sheet_name="Raw Data")
    df = df.iloc[:-3]
    years = df['Year'].dropna().unique()
    print(f"Unique years in Excel: {sorted(list(years))}")
    print(f"Count: {len(years)}")
except Exception as e:
    print("Error:", e)
