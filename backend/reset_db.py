from sqlalchemy import text
from database import Base, engine

def reset():
    print("Clearing database...")
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE emissions RESTART IDENTITY CASCADE"))
        conn.execute(text("TRUNCATE TABLE regions RESTART IDENTITY CASCADE"))
        conn.execute(text("TRUNCATE TABLE sectors RESTART IDENTITY CASCADE"))
        conn.execute(text("TRUNCATE TABLE gases RESTART IDENTITY CASCADE"))
    print("Database cleared. Now re-seeding...")

if __name__ == "__main__":
    reset()
