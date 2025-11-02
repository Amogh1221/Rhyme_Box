"""
Quick test script to verify password hashing and verification.
Run this to test if your password works with the current hash.

Usage:
    python test_password.py <username> <password>
"""

import sys
from app.database import SessionLocal
from app.models import User
from app.utils.security import verify_password, get_password_hash

def test_user_password(username: str, password: str):
    """Test if a password works for a user."""
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            print(f"❌ User '{username}' not found in database")
            return False
        
        print(f"\n{'='*60}")
        print(f"Testing password for user: {username}")
        print(f"{'='*60}")
        print(f"User ID: {user.id}")
        print(f"Email: {user.email}")
        print(f"Password you're testing: '{password}'")
        print(f"Password length: {len(password)}")
        print(f"Stored hash: {user.password_hash}")
        print(f"Hash length: {len(user.password_hash)}")
        
        # Test verification
        is_valid = verify_password(password, user.password_hash)
        
        print(f"\n{'='*60}")
        if is_valid:
            print(f"✅ PASSWORD IS CORRECT!")
            print(f"✅ This password should work for login and password change")
        else:
            print(f"❌ PASSWORD IS WRONG!")
            print(f"❌ This password will NOT work for login or password change")
        print(f"{'='*60}\n")
        
        return is_valid
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def reset_user_password(username: str, new_password: str):
    """Reset a user's password (for admin use)."""
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            print(f"❌ User '{username}' not found")
            return False
        
        print(f"\n🔄 Resetting password for {username}...")
        
        new_hash = get_password_hash(new_password)
        print(f"Old hash: {user.password_hash}")
        print(f"New hash: {new_hash}")
        
        user.password_hash = new_hash
        db.commit()
        db.refresh(user)
        
        # Verify it works
        test = verify_password(new_password, user.password_hash)
        
        if test:
            print(f"✅ Password reset successfully!")
            print(f"✅ New password: '{new_password}'")
        else:
            print(f"❌ Password reset but verification failed!")
            db.rollback()
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage:")
        print("  Test password:  python test_password.py <username> <password>")
        print("  Reset password: python test_password.py <username> <new_password> --reset")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    
    if len(sys.argv) > 3 and sys.argv[3] == '--reset':
        reset_user_password(username, password)
    else:
        test_user_password(username, password)
