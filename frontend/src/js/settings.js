/**
 * Settings Page Logic
 * 
 * Features:
 * - Change password (validates new password strength)
 * - Change email (requires password confirmation)
 * - Theme selection (future feature - placeholder)
 * 
 * Security:
 * - All changes require current password verification
 * - New JWT token issued after password change
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('⚙️ Settings page loaded');
  
  const changePasswordForm = document.getElementById('changePasswordForm');
  const changeEmailForm = document.getElementById('changeEmailForm');
  
  /**
   * Show toast notification
   */
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  /**
   * Validate password strength
   */
  function validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain a special character');
    }
    
    return errors;
  }
  
  /**
   * Handle password change
   */
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      // Validate new password matches confirmation
      if (newPassword !== confirmPassword) {
        showToast('❌ Passwords do not match', 'error');
        return;
      }
      
      // Validate password strength
      const errors = validatePassword(newPassword);
      if (errors.length > 0) {
        showToast(`❌ ${errors[0]}`, 'error');
        return;
      }
      
      const token = localStorage.getItem('rhymebox_token');
      if (!token) {
        showToast('❌ Please login first', 'error');
        return;
      }
      
      // Show loading state
      const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Changing...';
      
      try {
        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Update token with new one
          localStorage.setItem('rhymebox_token', data.access_token);
          
          showToast('✅ Password changed successfully!', 'success');
          changePasswordForm.reset();
        } else {
          throw new Error(data.detail || 'Failed to change password');
        }
        
      } catch (error) {
        console.error('Change password error:', error);
        showToast(`❌ ${error.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
  
  /**
   * Handle email change
   */
  if (changeEmailForm) {
    changeEmailForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const newEmail = document.getElementById('newEmail').value.trim();
      const password = document.getElementById('emailChangePassword').value;
      
      const token = localStorage.getItem('rhymebox_token');
      if (!token) {
        showToast('❌ Please login first', 'error');
        return;
      }
      
      // Show loading state
      const submitBtn = changeEmailForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Changing...';
      
      try {
        const response = await fetch('/api/auth/change-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            new_email: newEmail,
            password: password
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Update user data in localStorage
          const user = JSON.parse(localStorage.getItem('rhymebox_user') || '{}');
          user.email = newEmail;
          localStorage.setItem('rhymebox_user', JSON.stringify(user));
          
          showToast('✅ Email changed successfully!', 'success');
          changeEmailForm.reset();
        } else {
          throw new Error(data.detail || 'Failed to change email');
        }
        
      } catch (error) {
        console.error('Change email error:', error);
        showToast(`❌ ${error.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
  
});
