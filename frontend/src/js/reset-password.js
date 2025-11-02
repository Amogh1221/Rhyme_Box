document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('resetPasswordForm');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  
  // Get token from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (!token) {
    alert('❌ Invalid or missing reset token. Please request a new password reset link.');
    window.location.href = '/frontend/src/pages/login.html';
    return;
  }
  
  // Password validation UI
  newPassword.addEventListener('input', function() {
    const password = this.value;
    const reqLength = document.getElementById('req-length');
    const reqUpper = document.getElementById('req-upper');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');
    
    reqLength.style.color = password.length >= 8 ? '#4CAF50' : 'var(--muted)';
    reqUpper.style.color = /[A-Z]/.test(password) ? '#4CAF50' : 'var(--muted)';
    reqNumber.style.color = /[0-9]/.test(password) ? '#4CAF50' : 'var(--muted)';
    reqSpecial.style.color = /[!@#$%^&*(),.?":{}|<>]/.test(password) ? '#4CAF50' : 'var(--muted)';
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = newPassword.value;
    const confirm = confirmPassword.value;
    
    // Validate passwords match
    if (password !== confirm) {
      alert('❌ Passwords do not match!');
      return;
    }
    
    // Validate password requirements
    if (password.length < 8) {
      alert('❌ Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      alert('❌ Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      alert('❌ Password must contain at least one number');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      alert('❌ Password must contain at least one special character');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token,
          new_password: password 
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to reset password');
      }
      
      alert('✅ Password reset successful! You can now login with your new password.');
      window.location.href = '/frontend/src/pages/login.html';
      
    } catch (error) {
      alert('❌ Failed to reset password: ' + error.message);
    }
  });
});
