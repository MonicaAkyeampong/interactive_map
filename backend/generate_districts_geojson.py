import pandas as pd
import json
from shapely import wkt
import shapely.geometry
import os

def generate_geojsons():
    print("Loading CSV data...")
    df = pd.read_csv('Ghana_District_Data_Clean.csv')
    
    print("Parsing geometries...")
    # Convert WKT to shapely objects
    df['geometry'] = df['WKT'].apply(wkt.loads)
    
    # We will save the files in the parent directory (interactive_map)
    output_dir = '../'
    
    # Group by Region (NAME_1)
    regions = df['NAME_1'].unique()
    
    for region in regions:
        if pd.isna(region):
            continue
            
        print(f"Processing region: {region}")
        region_df = df[df['NAME_1'] == region]
        
        features = []
        for _, row in region_df.iterrows():
            geom = row['geometry']
            
            # Map the geometry to GeoJSON format
            geom_json = shapely.geometry.mapping(geom)
            
            feature = {
                "type": "Feature",
                "geometry": geom_json,
                "properties": {
                    "REGION": str(row['NAME_1']),
                    "DISTRICT": str(row['NAME_2'])
                }
            }
            features.append(feature)
            
        feature_collection = {
            "type": "FeatureCollection",
            "features": features
        }
        
        # Format region name for filename: lowercase, replace spaces with underscores
        safe_region_name = region.lower().replace(' ', '_').replace('/', '_')
        filename = f"districts_{safe_region_name}.geojson"
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(feature_collection, f)
            
    print("Done generating GeoJSON files.")

if __name__ == "__main__":
    generate_geojsons()
