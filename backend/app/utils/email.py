import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def send_password_reset_email(to_email: str, user_name: str, reset_link: str):
    """Send password reset email"""
    
    subject = "Reset Your Rhyme Box Password"
    
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #F9D976 0%, #F39F86 100%); border-radius: 10px;">
          <h2 style="color: #2E2C2F; text-align: center;">Reset Your Password</h2>
          <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <p>Hello <strong>{user_name}</strong>,</p>
            <p>We received a request to reset your password for your Rhyme Box account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{reset_link}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #F9D976 0%, #F39F86 100%); color: #222; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 12px rgba(243, 159, 134, 0.3);">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #B76E79; font-size: 0.9rem;">{reset_link}</p>
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9rem; color: #666;">
              <strong>Note:</strong> This link will expire in 1 hour.<br>
              If you didn't request a password reset, please ignore this email.
            </p>
          </div>
          <p style="text-align: center; margin-top: 20px; color: #2E2C2F; font-size: 0.85rem;">
            © 2025 Rhyme Box - Express your poetic soul through words
          </p>
        </div>
      </body>
    </html>
    """
    
    text_body = f"""
    Hello {user_name},
    
    We received a request to reset your password for your Rhyme Box account.
    
    Click the link below to reset your password:
    {reset_link}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, please ignore this email.
    
    © 2025 Rhyme Box
    """
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = settings.FROM_EMAIL
    msg['To'] = to_email
    
    # Attach both plain text and HTML versions
    part1 = MIMEText(text_body, 'plain')
    part2 = MIMEText(html_body, 'html')
    msg.attach(part1)
    msg.attach(part2)
    
    # Send email
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        print(f"✅ Password reset email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        raise e
