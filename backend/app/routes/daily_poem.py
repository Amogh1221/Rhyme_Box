# Poem of the Day routes

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime
from app.database import get_db
from app.models import DailyPoem
from app.scheduler.daily_task import generate_daily_poem, get_theme_for_date

router = APIRouter()

@router.get("/{date_str}")
def get_daily_poem(date_str: str, db: Session = Depends(get_db)):
    """Get the daily poem for a specific date (format: YYYY-MM-DD)."""
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Check if poem exists in database
    daily_poem = db.query(DailyPoem).filter(DailyPoem.date == date_str).first()
    
    if daily_poem:
        return {
            'date': daily_poem.date,
            'theme': daily_poem.theme,
            'title': daily_poem.title,
            'content': daily_poem.content
        }
    
    # Generate poem if not found
    try:
        result = generate_daily_poem(target_date)
        if result:
            return result
        else:
            raise HTTPException(status_code=500, detail="Failed to generate poem")
    except Exception as e:
        # Return theme even if generation fails
        theme = get_theme_for_date(target_date)
        raise HTTPException(
            status_code=500,
            detail=f"Could not generate poem. Theme: {theme}"
        )

@router.get("/theme/{date_str}")
def get_daily_theme(date_str: str):
    """Get just the theme for a specific date."""
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        theme = get_theme_for_date(target_date)
        return {'date': date_str, 'theme': theme}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
