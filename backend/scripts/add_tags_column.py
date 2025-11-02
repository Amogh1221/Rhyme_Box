"""
Migration: Add tags column to users table
"""
from app.database import engine
from sqlalchemy import text

def add_tags_column():
    """Add tags column to users table if it doesn't exist."""
    
    print("\n" + "="*60)
    print("🔧 MIGRATION: Adding tags column to users table")
    print("="*60)
    
    with engine.connect() as conn:
        # Check if column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='tags'
        """))
        
        if result.fetchone():
            print("✅ Column 'tags' already exists")
            return
        
        # Add column
        print("📝 Adding 'tags' column...")
        conn.execute(text("ALTER TABLE users ADD COLUMN tags TEXT DEFAULT ''"))
        conn.commit()
        print("✅ Migration complete!")
        print("="*60 + "\n")

if __name__ == "__main__":
    add_tags_column()
