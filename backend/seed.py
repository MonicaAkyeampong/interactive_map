import random
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models import Base, Emission

# Generate sample data based on regions in Ghana
REGIONS = [
    "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", 
    "Greater Accra", "North East", "Northern", "Oti", "Savannah", 
    "Upper East", "Upper West", "Volta", "Western", "Western North"
]
YEARS = [2022, 2023, 2024, 2025]
GASES = ["CO2", "CH4", "N2O"]
SECTORS = ["Energy", "Agriculture", "Transport", "Waste", "Industrial"]

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(Emission).first():
        print("Database already seeded.")
        db.close()
        return

    print("Seeding database...")
    for region in REGIONS:
        for year in YEARS:
            for gas in GASES:
                for sector in SECTORS:
                    value = random.uniform(10.0, 5000.0)
                    if region == "Greater Accra" and sector == "Transport":
                        value *= 2.5 # Make Accra transport higher
                    elif region == "Ashanti" and sector == "Energy":
                        value *= 2.0
                        
                    emission = Emission(
                        region=region,
                        district=f"{region} District {random.randint(1, 5)}",
                        year=year,
                        gas_type=gas,
                        sector=sector,
                        value=round(value, 2),
                        unit="CO2e",
                        source_count=random.randint(5, 50)
                    )
                    db.add(emission)
    
    db.commit()
    db.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_db()
