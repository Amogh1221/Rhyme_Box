from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Poem
from app.schemas import UserOut

router = APIRouter()

@router.get("/{username}", response_model=UserOut)
def get_user_by_username(username: str, db: Session = Depends(get_db)):
    """Get user profile by username (public endpoint)."""
    
    print(f"\n{'='*60}")
    print(f"📥 GET USER PROFILE REQUEST")
    print(f"{'='*60}")
    print(f"Username: {username}")
    
    # Remove @ if present
    username = username.lstrip('@')
    
    try:
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            print(f"❌ User not found: {username}")
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"✅ User found:")
        print(f"   ID: {user.id}")
        print(f"   Name: {user.name}")
        print(f"   Username: {user.username}")
        print(f"   Bio: {user.bio[:50] if user.bio else 'None'}...")
        print(f"   Profile pic URL: {user.profile_picture_url}")
        print(f"   Banner URL: {user.banner_image_url}")
        
        # Build response dict with proper types (NO TAGS)
        user_data = {
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "email": user.email,
            "profile_tag": user.profile_tag,
            "bio": user.bio or "",
            "profile_picture_url": user.profile_picture_url,
            "banner_image_url": user.banner_image_url,
            "profile_picture": user.profile_picture or user.profile_picture_url,
            "banner": user.banner_image or user.banner_image_url,
            "created_at": user.created_at
        }
        
        print(f"✅ Successfully built user data")
        print(f"{'='*60}\n")
        
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
