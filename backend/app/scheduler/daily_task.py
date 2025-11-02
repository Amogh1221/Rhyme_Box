import json
import os
from datetime import datetime, date
from pathlib import Path
from app.rag_engine.rag_poem_generator import generate_poem
from app.database import SessionLocal
from app.models import DailyPoem

# Load themes
THEMES_FILE = Path(__file__).parent / "daily_themes.json"

def load_themes():
    """Load all 365(+1) themes from JSON file."""
    with open(THEMES_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_theme_for_date(target_date: date = None) -> str:
    """Get the theme for a specific date (defaults to today)."""
    if target_date is None:
        target_date = date.today()
    
    themes = load_themes()
    month_name = target_date.strftime('%B').lower()
    day_index = target_date.day - 1  # 0-indexed
    
    # Handle leap year (Feb 29)
    if month_name == 'february' and target_date.day == 29:
        return themes['february'][-1]  # Last theme is for leap day
    
    month_themes = themes.get(month_name, [])
    if day_index < len(month_themes):
        return month_themes[day_index]
    
    return "A Day of Reflection"  # Fallback

def generate_daily_poem(target_date: date = None) -> dict:
    """Generate a poem for the given date using its theme."""
    if target_date is None:
        target_date = date.today()
    
    theme = get_theme_for_date(target_date)
    date_str = target_date.strftime('%Y-%m-%d')
    
    print(f"📅 Generating daily poem for {date_str}")
    print(f"🎨 Theme: {theme}")
    
    try:
        # Generate poem using RAG
        poem_data = generate_poem(theme)
        
        # Save to database
        db = SessionLocal()
        try:
            # Check if poem already exists for this date
            existing = db.query(DailyPoem).filter(DailyPoem.date == date_str).first()
            
            if existing:
                print(f"⚠️ Poem already exists for {date_str}, updating...")
                existing.theme = theme
                existing.title = poem_data['title']
                existing.content = poem_data['content']
                db.commit()
                print(f"✅ Updated poem for {date_str}")
            else:
                daily_poem = DailyPoem(
                    date=date_str,
                    theme=theme,
                    title=poem_data['title'],
                    content=poem_data['content'],
                    generated_by='ai'
                )
                db.add(daily_poem)
                db.commit()
                print(f"✅ Saved new poem for {date_str}")
            
            return {
                'date': date_str,
                'theme': theme,
                'title': poem_data['title'],
                'content': poem_data['content']
            }
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Failed to generate daily poem: {e}")
        return None

def preview_year_themes():
    """Preview all themes for the year."""
    themes = load_themes()
    print("\n" + "="*60)
    print("📅 RHYME BOX - 365 DAILY THEMES")
    print("="*60 + "\n")
    
    for month_name, month_themes in themes.items():
        print(f"\n🗓️  {month_name.upper()} ({len(month_themes)} days)")
        print("-" * 60)
        for i, theme in enumerate(month_themes, 1):
            print(f"  {i:2d}. {theme}")
    
    print("\n" + "="*60)
    total = sum(len(t) for t in themes.values())
    print(f"📊 Total themes: {total} (including Feb 29 for leap years)")
    print("="*60 + "\n")

# CLI interface for testing
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "preview":
            preview_year_themes()
        
        elif command == "today":
            result = generate_daily_poem()
            if result:
                print(f"\n📜 Poem of the Day")
                print(f"📅 {result['date']}")
                print(f"🎨 Theme: {result['theme']}")
                print(f"\n{result['title']}")
                print("-" * 40)
                print(result['content'])
        
        elif command == "generate":
            # Generate for specific date: python -m app.scheduler.daily_task generate 2024-12-25
            if len(sys.argv) > 2:
                date_str = sys.argv[2]
                target = datetime.strptime(date_str, '%Y-%m-%d').date()
                result = generate_daily_poem(target)
                if result:
                    print(f"✅ Generated poem for {date_str}")
            else:
                print("Usage: python -m app.scheduler.daily_task generate YYYY-MM-DD")
        
        elif command == "theme":
            # Get theme for specific date
            if len(sys.argv) > 2:
                date_str = sys.argv[2]
                target = datetime.strptime(date_str, '%Y-%m-%d').date()
                theme = get_theme_for_date(target)
                print(f"🎨 Theme for {date_str}: {theme}")
            else:
                theme = get_theme_for_date()
                print(f"🎨 Today's theme: {theme}")
        
        else:
            print("Unknown command. Available commands:")
            print("  preview  - Show all 365 themes")
            print("  today    - Generate today's poem")
            print("  generate YYYY-MM-DD - Generate poem for specific date")
            print("  theme [YYYY-MM-DD]  - Show theme for date")
    else:
        print("Usage: python -m app.scheduler.daily_task <command>")
        print("Commands: preview, today, generate, theme")
