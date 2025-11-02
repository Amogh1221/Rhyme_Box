"""
Recreate database tables with latest schema
WARNING: This will delete all existing data!
"""
from app.database import engine, Base
from app.models import User, Poem, Tag, Friend, DailyPoem, PoemLike, Comment, Notification, ChatMessage

def recreate_db():
    print("\n" + "="*60)
    print("⚠️  WARNING: This will DELETE all data!")
    print("="*60)
    
    confirm = input("Type 'YES' to continue: ")
    if confirm != 'YES':
        print("❌ Aborted")
        return
    
    print("\n🗑️  Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("📝 Creating all tables with latest schema...")
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database recreated successfully!")
    print("="*60 + "\n")

if __name__ == "__main__":
    recreate_db()
