from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user
from app.schemas import UserOut
from app.models import User  # ✅ ADD THIS IMPORT
from app.utils.cloudinary_upload import upload_profile_picture, upload_banner_image, delete_image

router = APIRouter()

@router.get("/me", response_model=UserOut)
def read_me(current_user = Depends(get_current_user)):
    """Get current user profile with Cloudinary URLs."""
    
    print(f"\n{'='*60}")
    print(f"📥 Profile request for user: {current_user.username}")
    print(f"{'='*60}")
    print(f"Profile picture URL: {current_user.profile_picture_url}")
    print(f"Banner URL: {current_user.banner_image_url}")
    
    # Build response dict with proper types
    user_data = {
        "id": current_user.id,
        "name": current_user.name,
        "username": current_user.username,
        "email": current_user.email,
        "profile_tag": current_user.profile_tag,
        "bio": current_user.bio or "",
        "profile_picture_url": current_user.profile_picture_url,
        "banner_image_url": current_user.banner_image_url,
        "profile_picture": current_user.profile_picture or current_user.profile_picture_url,
        "banner": current_user.banner_image or current_user.banner_image_url,
        "created_at": current_user.created_at
    }
    
    print(f"📤 Sending user data to frontend")
    print(f"{'='*60}\n")
    
    return user_data

@router.post("/update", response_model=UserOut)
def update_profile(payload: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Update user profile (name, bio) - username is IMMUTABLE."""
    
    print(f"\n{'='*60}")
    print(f"📝 PROFILE UPDATE REQUEST")
    print(f"{'='*60}")
    print(f"User: {current_user.username}")
    print(f"Payload: {payload}")
    
    # ✅ Update ONLY allowed fields (name and bio)
    if 'name' in payload:
        current_user.name = payload['name']
        print(f"  Updated display name: {current_user.name}")
    
    if 'bio' in payload:
        current_user.bio = payload['bio']
        print(f"  Updated bio: {current_user.bio[:50]}..." if len(current_user.bio) > 50 else f"  Updated bio: {current_user.bio}")
    
    # ❌ CRITICAL: Never update username - it's the primary identifier
    # ❌ REMOVED: username update logic
    
    db.commit()
    db.refresh(current_user)
    
    print(f"✅ Profile updated successfully")
    print(f"  Username (unchanged): {current_user.username}")
    
    # Build response
    user_data = {
        "id": current_user.id,
        "name": current_user.name,
        "username": current_user.username,  # ✅ Always returns original username
        "email": current_user.email,
        "profile_tag": current_user.profile_tag,
        "bio": current_user.bio or "",
        "profile_picture_url": current_user.profile_picture_url,
        "banner_image_url": current_user.banner_image_url,
        "profile_picture": current_user.profile_picture or current_user.profile_picture_url,
        "banner": current_user.banner_image or current_user.banner_image_url,
        "created_at": current_user.created_at
    }
    
    print(f"📤 Returning updated profile data")
    print(f"{'='*60}\n")
    
    return user_data

# ✅ NEW: Upload profile picture endpoint
@router.post("/upload-profile-picture")
async def upload_profile_pic(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload profile picture to Cloudinary."""
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate file size (max 5MB)
    file_size = 0
    chunk_size = 1024 * 1024  # 1MB chunks
    for chunk in iter(lambda: file.file.read(chunk_size), b''):
        file_size += len(chunk)
        if file_size > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    # Reset file pointer
    file.file.seek(0)
    
    try:
        # Delete old profile picture if exists
        if current_user.profile_picture_public_id:
            delete_image(current_user.profile_picture_public_id)
        
        # Upload new picture
        result = upload_profile_picture(file.file, current_user.id)
        
        # Save URLs to database
        current_user.profile_picture_url = result['url']
        current_user.profile_picture_public_id = result['public_id']
        
        db.commit()
        db.refresh(current_user)
        
        return {
            "success": True,
            "url": result['url'],
            "message": "Profile picture uploaded successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ✅ NEW: Upload banner image endpoint
@router.post("/upload-banner")
async def upload_banner(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload banner image to Cloudinary."""
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate file size (max 10MB for banners)
    file_size = 0
    chunk_size = 1024 * 1024
    for chunk in iter(lambda: file.file.read(chunk_size), b''):
        file_size += len(chunk)
        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    file.file.seek(0)
    
    try:
        # Delete old banner if exists
        if current_user.banner_image_public_id:
            delete_image(current_user.banner_image_public_id)
        
        # Upload new banner
        result = upload_banner_image(file.file, current_user.id)
        
        # Save URLs to database
        current_user.banner_image_url = result['url']
        current_user.banner_image_public_id = result['public_id']
        
        db.commit()
        db.refresh(current_user)
        
        return {
            "success": True,
            "url": result['url'],
            "message": "Banner uploaded successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ✅ NEW: Remove profile picture
@router.delete("/remove-profile-picture")
def remove_profile_picture(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Remove profile picture from Cloudinary."""
    
    if current_user.profile_picture_public_id:
        delete_image(current_user.profile_picture_public_id)
    
    current_user.profile_picture_url = None
    current_user.profile_picture_public_id = None
    
    db.commit()
    
    return {"success": True, "message": "Profile picture removed"}

# ✅ NEW: Remove banner
@router.delete("/remove-banner")
def remove_banner(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Remove banner image from Cloudinary."""
    
    if current_user.banner_image_public_id:
        delete_image(current_user.banner_image_public_id)
    
    current_user.banner_image_url = None
    current_user.banner_image_public_id = None
    
    db.commit()
    
    return {"success": True, "message": "Banner removed"}
