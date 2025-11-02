import cloudinary
import cloudinary.uploader
from app.config import settings
from typing import BinaryIO

# ✅ Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

def upload_profile_picture(file: BinaryIO, user_id: int) -> dict:
    """Upload profile picture to Cloudinary.
    
    Args:
        file: Binary file object
        user_id: User ID for unique filename
    
    Returns:
        dict: {
            'url': str,  # Public URL
            'public_id': str  # For deletion
        }
    """
    try:
        result = cloudinary.uploader.upload(
            file,
            folder="rhymebox/profiles",
            public_id=f"user_{user_id}_profile",
            overwrite=True,
            resource_type="image",
            transformation=[
                {'width': 400, 'height': 400, 'crop': 'fill', 'gravity': 'face'},
                {'quality': 'auto'},
                {'fetch_format': 'auto'}
            ]
        )
        
        return {
            'url': result['secure_url'],
            'public_id': result['public_id']
        }
    except Exception as e:
        print(f"❌ Cloudinary upload failed: {e}")
        raise Exception(f"Failed to upload profile picture: {str(e)}")

def upload_banner_image(file: BinaryIO, user_id: int) -> dict:
    """Upload banner image to Cloudinary.
    
    Args:
        file: Binary file object
        user_id: User ID for unique filename
    
    Returns:
        dict: {
            'url': str,  # Public URL
            'public_id': str  # For deletion
        }
    """
    try:
        result = cloudinary.uploader.upload(
            file,
            folder="rhymebox/banners",
            public_id=f"user_{user_id}_banner",
            overwrite=True,
            resource_type="image",
            transformation=[
                {'width': 1200, 'height': 400, 'crop': 'fill'},
                {'quality': 'auto'},
                {'fetch_format': 'auto'}
            ]
        )
        
        return {
            'url': result['secure_url'],
            'public_id': result['public_id']
        }
    except Exception as e:
        print(f"❌ Cloudinary upload failed: {e}")
        raise Exception(f"Failed to upload banner image: {str(e)}")

def delete_image(public_id: str) -> bool:
    """Delete an image from Cloudinary.
    
    Args:
        public_id: Cloudinary public ID of the image
    
    Returns:
        bool: True if deleted successfully
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get('result') == 'ok'
    except Exception as e:
        print(f"❌ Cloudinary delete failed: {e}")
        return False
