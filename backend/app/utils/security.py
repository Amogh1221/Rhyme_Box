import bcrypt
from datetime import datetime, timedelta
from jose import jwt, JWTError
from app.config import settings

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash."""
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print(f"❌ Password verification error: {e}")
        return False

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create a JWT access token with configurable expiration."""
    to_encode = data.copy()
    
    # ✅ Use provided expiration or default from settings
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # ✅ Store as Unix timestamp (integer)
    to_encode.update({"exp": int(expire.timestamp())})
    
    print(f"🔐 Creating token - expires in {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
    print(f"   Expiration time: {expire}")
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    """Decode and verify a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Check expiration
        exp = payload.get("exp")
        if exp:
            exp_datetime = datetime.utcfromtimestamp(exp)
            now = datetime.utcnow()
            
            if now > exp_datetime:
                raise JWTError("Token has expired")
        
        return payload
        
    except JWTError as e:
        raise Exception(f"JWT validation failed: {str(e)}")
    except Exception as e:
        raise Exception(f"Token decode failed: {str(e)}")
