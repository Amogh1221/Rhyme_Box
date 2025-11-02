"""Test if a token is valid."""

import sys
from app.utils.security import decode_access_token
from app.database import SessionLocal
from app.models import User

def test_token(token: str):
    """Test if a token is valid and can fetch user."""
    
    print(f"\n{'='*60}")
    print(f"TESTING TOKEN")
    print(f"{'='*60}")
    print(f"Token (first 30 chars): {token[:30]}...")
    
    try:
        # Decode token
        payload = decode_access_token(token)
        print(f"✅ Token is valid")
        print(f"Payload: {payload}")
        
        # Get username
        username = payload.get("sub") or payload.get("username")
        print(f"Username: {username}")
        
        if not username:
            print(f"❌ No username in token")
            return False
        
        # Check if user exists
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.username == username).first()
            if user:
                print(f"✅ User found: {user.username} (ID: {user.id})")
                print(f"Email: {user.email}")
                return True
            else:
                print(f"❌ User '{username}' not found in database")
                return False
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Token validation failed: {e}")
        return False
    finally:
        print(f"{'='*60}\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Try to get token from localStorage simulation
        print("Usage: python test_token.py <your_token>")
        print("\nGet your token from browser:")
        print("1. Open DevTools (F12)")
        print("2. Go to Console tab")
        print("3. Type: localStorage.getItem('rhymebox_token')")
        print("4. Copy the token and run: python test_token.py YOUR_TOKEN")
        sys.exit(1)
    
    token = sys.argv[1]
    test_token(token)
