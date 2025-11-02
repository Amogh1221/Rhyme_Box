from pydantic import BaseModel, EmailStr, validator, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
import re

class UserCreate(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str
    
    @validator('name')
    def validate_name(cls, v):
        if not re.match(r'^[a-zA-Z\s]+$', v):
            raise ValueError('Name can only contain letters and spaces')
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v.strip()
    
    @validator('username')
    def validate_username(cls, v):
        # Remove @ if user added it
        v = v.lstrip('@')
        
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: Optional[str] = None
    username: str
    email: EmailStr
    profile_tag: Optional[str] = None
    bio: Optional[str] = None
    
    # Image fields
    profile_picture_url: Optional[str] = None
    banner_image_url: Optional[str] = None
    profile_picture: Optional[str] = None
    banner: Optional[str] = None
    
    created_at: datetime
    
    # Deprecated fields for backwards compatibility
    @field_validator('profile_picture', mode='before')
    @classmethod
    def set_profile_picture(cls, v, info):
        # If profile_picture is empty but profile_picture_url exists, use it
        if not v and 'profile_picture_url' in info.data:
            return info.data.get('profile_picture_url')
        return v
    
    @field_validator('banner', mode='before')
    @classmethod
    def set_banner(cls, v, info):
        # If banner is empty but banner_image_url exists, use it
        if not v and 'banner_image_url' in info.data:
            return info.data.get('banner_image_url')
        return v

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

class PoemCreate(BaseModel):
    title: Optional[str] = None
    content: str
    is_public: Optional[bool] = True
    category: Optional[str] = "manual"

class PoemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # ✅ Updated from orm_mode
    
    id: int
    user_id: Optional[int]
    title: Optional[str]
    content: str
    is_public: bool
    category: str
    created_at: datetime
    updated_at: datetime
    author: Optional[str] = "@unknown"  # ✅ ADD THIS: Default to @unknown if not provided

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain an uppercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain a number')
        return v
