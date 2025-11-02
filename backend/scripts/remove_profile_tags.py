"""
Remove tags column from users table
Run with: python -m scripts.remove_profile_tags
"""
from app.database import engine
from sqlalchemy import text

def remove_tags_column():
    print("🗑️  Removing tags column from users table...")
    
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS tags"))
            conn.commit()
            print("✅ Tags column removed successfully")
        except Exception as e:
            print(f"❌ Error: {e}")
            conn.rollback()

if __name__ == "__main__":
    remove_tags_column()
