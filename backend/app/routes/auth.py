from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UserCreate, Token
from app.models import User, PasswordResetToken
from app.utils.security import get_password_hash, verify_password, create_access_token
from app.deps import get_current_user
from datetime import timedelta, datetime
from pydantic import BaseModel, EmailStr
from app.config import settings
import secrets

# ✅ COMMENT OUT: Email sending (not configured yet)
# import os
# from sendgrid import SendGridAPIClient
# from sendgrid.helpers.mail import Mail

def send_password_reset_email(email: str, reset_link: str):
    """Send password reset email via SendGrid."""
    # ✅ TODO: Configure SendGrid or other email service in production
    print(f"📧 [DEV MODE] Password reset email would be sent to: {email}")
    print(f"🔗 Reset link: {reset_link}")
    
    # ✅ In production, uncomment and configure:
    # message = Mail(
    #     from_email='noreply@rhymebox.com',
    #     to_emails=email,
    #     subject='Reset Your Rhyme Box Password',
    #     html_content=f'''
    #     <h2>Password Reset Request</h2>
    #     <p>Click the link below to reset your password:</p>
    #     <p><a href="{reset_link}">Reset Password</a></p>
    #     <p>This link will expire in 1 hour.</p>
    #     <p>If you didn't request this, please ignore this email.</p>
    #     '''
    # )
    # 
    # try:
    #     sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    #     sg.send(message)
    # except Exception as e:
    #     print(f"Email send failed: {e}")

router = APIRouter()

@router.post("/signup", response_model=Token)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    user = User(
        name=payload.name,
        username=payload.username,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        profile_tag = f"@{payload.username}"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # ✅ Use configured token expiration
    token = create_access_token(
        {"sub": user.username},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer"}

@router.post('/token', response_model=Token)
def login_for_token(form_data: dict, db: Session = Depends(get_db)):
    """Login endpoint - returns JWT token."""
    
    print(f"\n{'='*60}")
    print(f"🔐 LOGIN REQUEST")
    print(f"{'='*60}")
    
    try:
        # Extract credentials
        username_or_email = form_data.get('username') or form_data.get('email')
        password = form_data.get('password')
        
        print(f"Username/Email: {username_or_email}")
        print(f"Password provided: {'Yes' if password else 'No'}")
        
        if not username_or_email or not password:
            print(f"❌ Missing credentials")
            raise HTTPException(status_code=400, detail="Username/email and password required")
        
        # Find user
        user = db.query(User).filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        
        if not user:
            print(f"❌ User not found: {username_or_email}")
            raise HTTPException(status_code=401, detail="Invalid username/email or password")
        
        print(f"✅ User found: {user.username}")
        
        # Verify password
        if not verify_password(password, user.password_hash):
            print(f"❌ Password incorrect")
            raise HTTPException(status_code=401, detail="Invalid username/email or password")
        
        print(f"✅ Password verified")
        
        # Create token
        token = create_access_token(
            {"sub": user.username},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        print(f"✅ Token generated successfully")
        print(f"{'='*60}\n")
        
        return {"access_token": token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error during login: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ChangeEmailRequest(BaseModel):
    new_email: EmailStr
    password: str

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Change user password and return new token."""
    
    print(f"\n{'='*60}")
    print(f"🔐 PASSWORD CHANGE REQUEST for {current_user.username}")
    print(f"{'='*60}")
    
    # Verify current password
    if not verify_password(payload.current_password, current_user.password_hash):
        print(f"❌ Current password incorrect")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not any(c.isupper() for c in payload.new_password):
        raise HTTPException(status_code=400, detail="Password must contain an uppercase letter")
    if not any(c.isdigit() for c in payload.new_password):
        raise HTTPException(status_code=400, detail="Password must contain a number")
    
    # ✅ Update password with explicit commit
    try:
        old_hash = current_user.password_hash
        new_hash = get_password_hash(payload.new_password)
        
        print(f"Updating password hash...")
        current_user.password_hash = new_hash
        
        # ✅ Flush changes to database
        db.flush()
        
        # ✅ Commit transaction
        db.commit()
        
        # ✅ Refresh user to ensure we have latest data
        db.refresh(current_user)
        
        # ✅ Verify the new password works
        verify_test = verify_password(payload.new_password, current_user.password_hash)
        print(f"✅ New password verification: {verify_test}")
        
        if not verify_test:
            db.rollback()
            raise HTTPException(status_code=500, detail="Password verification failed after save")
        
        # ✅ Generate new token with extended expiration
        new_token = create_access_token(
            {"sub": current_user.username},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        print(f"✅ Password changed and new token generated")
        print(f"{'='*60}\n")
        
        return {
            "message": "Password changed successfully",
            "access_token": new_token,
            "token_type": "bearer"
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to change password: {str(e)}")

@router.post("/change-email")
def change_email(
    payload: ChangeEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Change user email."""
    
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is incorrect"
        )
    
    existing_user = db.query(User).filter(User.email == payload.new_email).first()
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(status_code=400, detail="Email already registered to another account")
    
    current_user.email = payload.new_email
    db.commit()
    
    return {"message": "Email changed successfully", "new_email": payload.new_email}

@router.post("/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(get_db)):
    """Request password reset token."""
    
    email = payload.get('email', '').strip()
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    print(f"\n{'='*60}")
    print(f"🔑 PASSWORD RESET REQUEST")
    print(f"{'='*60}")
    print(f"Email: {email}")
    
    # Find user by email
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # For security, don't reveal if email exists
        print(f"⚠️ Email not found, but returning success for security")
        return {"message": "If the email exists, a reset link has been sent"}
    
    print(f"✅ User found: {user.username}")
    
    # Generate secure token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)  # Token valid for 1 hour
    
    # Delete any existing unused tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False
    ).delete()
    
    # Create new reset token
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.add(reset_token)
    db.commit()
    
    # ✅ In development: log the reset link to console
    reset_link = f"http://localhost:8000/reset-password?token={token}"
    print(f"🔗 Password reset link (copy this):")
    print(f"   {reset_link}")
    print(f"   Token expires at: {expires_at}")
    print(f"{'='*60}\n")
    
    # ✅ Send email (in dev mode, just logs to console)
    send_password_reset_email(user.email, reset_link)
    
    return {
        "message": "If the email exists, a reset link has been sent",
        "reset_link": reset_link  # ⚠️ REMOVE THIS IN PRODUCTION!
    }

@router.post("/reset-password")
def reset_password(payload: dict, db: Session = Depends(get_db)):
    """Reset password using token."""
    
    token = payload.get('token')
    new_password = payload.get('new_password')
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required")
    
    print(f"\n{'='*60}")
    print(f"🔐 PASSWORD RESET")
    print(f"{'='*60}")
    print(f"Token: {token[:10]}...")
    
    # Find valid token
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()
    
    if not reset_token:
        print(f"❌ Invalid or expired token")
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Find user
    user = db.query(User).filter(User.id == reset_token.user_id).first()
    
    if not user:
        print(f"❌ User not found")
        raise HTTPException(status_code=404, detail="User not found")
    
    print(f"✅ Valid token for user: {user.username}")
    
    # Validate new password
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not any(c.isupper() for c in new_password):
        raise HTTPException(status_code=400, detail="Password must contain an uppercase letter")
    if not any(c.isdigit() for c in new_password):
        raise HTTPException(status_code=400, detail="Password must contain a number")
    
    # Update password
    user.password_hash = get_password_hash(new_password)
    
    # Mark token as used
    reset_token.used = True
    
    db.commit()
    
    print(f"✅ Password reset successfully for {user.username}")
    print(f"{'='*60}\n")
    
    return {"message": "Password reset successfully"}
