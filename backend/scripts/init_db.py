"""
Database initialization script for Rhyme Box
Creates all tables and optional seed data
"""

from app.database import engine, Base, SessionLocal
from app.models import User, Poem, Tag, Friend, DailyPoem, PoemLike, Comment, Notification, PREDEFINED_TAGS
from app.utils.security import get_password_hash
from datetime import datetime

def init_database():
    """Create all tables"""
    print("🔧 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")

def seed_tags():
    """Seed predefined tags into database."""
    db = SessionLocal()
    
    try:
        print("\n🏷️  SEEDING TAGS")
        print("="*60)
        
        # Clear existing tags
        print("🗑️  Clearing old tags...")
        db.query(Tag).delete()
        db.commit()
        
        total_tags = 0
        for category_name, category_data in PREDEFINED_TAGS.items():
            print(f"\n📂 {category_name}")
            color_class = category_data['color_class']
            
            for tag_name in category_data['tags']:
                tag = Tag(
                    name=tag_name,
                    category=category_name.lower().replace(' / ', '_').replace(' ', '_'),
                    color_class=color_class
                )
                db.add(tag)
                total_tags += 1
                print(f"  ✓ {tag_name}")
        
        db.commit()
        print(f"\n✅ Successfully seeded {total_tags} tags")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error seeding tags: {e}")
        db.rollback()
    finally:
        db.close()

def seed_demo_data():
    """Create demo user and poems"""
    db = SessionLocal()
    try:
        print("🌱 Creating demo data...")
        
        # Check if demo user exists
        demo_user = db.query(User).filter(User.username == 'demo').first()
        if not demo_user:
            demo_user = User(
                name='Demo User',
                username='demo',
                email='demo@rhymebox.com',
                password_hash=get_password_hash('demo123'),
                profile_tag='@demo',
                bio='A poetry enthusiast exploring words',
                is_verified=True
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print(f"✅ Created demo user: {demo_user.username}")
            
            # Create a demo poem
            demo_poem = Poem(
                user_id=demo_user.id,
                title='Welcome to Rhyme Box',
                content='Words dance on pages white,\nThoughts take flight in the night.\nPoetry flows like a stream,\nExpressing every dream.',
                is_public=True,
                category='manual'
            )
            db.add(demo_poem)
            db.commit()
            print("✅ Created demo poem")
        else:
            print("ℹ️ Demo user already exists")
            
    except Exception as e:
        print(f"❌ Error creating demo data: {e}")
        db.rollback()
    finally:
        db.close()

def drop_all_tables():
    """Drop all tables (use with caution!)"""
    print("⚠️ WARNING: This will delete all data!")
    response = input("Type 'DELETE ALL' to confirm: ")
    if response == 'DELETE ALL':
        print("🗑️ Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("✅ All tables dropped")
    else:
        print("❌ Aborted")

def migrate_add_cloudinary_columns():
    """Add Cloudinary columns to existing users table."""
    from sqlalchemy import text
    
    print("\n🔄 Adding Cloudinary columns to users table...")
    
    try:
        with engine.connect() as conn:
            # Add missing columns
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500),
                ADD COLUMN IF NOT EXISTS profile_picture_public_id VARCHAR(200),
                ADD COLUMN IF NOT EXISTS banner_image_url VARCHAR(500),
                ADD COLUMN IF NOT EXISTS banner_image_public_id VARCHAR(200)
            """))
            conn.commit()
            
            print("✅ Successfully added Cloudinary columns")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "init":
            init_database()
        elif command == "seed-tags":
            seed_tags()
        elif command == "seed-demo":
            seed_demo_data()
        elif command == "seed-all":
            seed_tags()
            seed_demo_data()
        elif command == "reset":
            drop_all_tables()
            init_database()
            seed_tags()
            seed_demo_data()
        elif command == "migrate-cloudinary":
            migrate_add_cloudinary_columns()
        else:
            print(f"Unknown command: {command}")
            print("Available commands: init, seed-tags, seed-demo, seed-all, reset, migrate-cloudinary")
    else:
        print("Usage: python -m scripts.init_db <command>")
        print("Commands:")
        print("  init                  - Create all tables")
        print("  seed-tags            - Add predefined tags")
        print("  seed-demo            - Create demo user and poems")
        print("  seed-all             - Run all seed scripts")
        print("  reset                - Drop and recreate all tables (WARNING: deletes data)")
        print("  migrate-cloudinary   - Add Cloudinary columns to users table")
