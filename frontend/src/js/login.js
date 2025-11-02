document.addEventListener('DOMContentLoaded', function() {
  // Check if already logged in
  const token = localStorage.getItem('rhymebox_token');
  if (token) {
    window.location.href = '/frontend/src/pages/feed.html';
    return;
  }
  
  // Create toast notification
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
  
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const backToLoginLink = document.getElementById('backToLoginLink');
  const tabs = document.querySelectorAll('.auth-tab');
  const signupPassword = document.getElementById('signupPassword');
  
  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      const targetTab = this.dataset.tab;
      document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
        form.style.display = 'none';
      });
      
      if (targetTab === 'login') {
        loginForm.classList.add('active');
        loginForm.style.display = 'block';
      } else if (targetTab === 'signup') {
        signupForm.classList.add('active');
        signupForm.style.display = 'block';
      }
    });
  });
  
  // Password validation UI
  if (signupPassword) {
    signupPassword.addEventListener('input', function() {
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
  }
  
  // ✅ Show forgot password link after failed login
  function showForgotLink() {
    if (forgotPasswordLink) {
      forgotPasswordLink.style.display = 'inline-block';
      forgotPasswordLink.animate([
        { transform: 'translateY(0)', opacity: 0.9 },
        { transform: 'translateY(-6px)', opacity: 1 },
        { transform: 'translateY(0)', opacity: 1 }
      ], { duration: 700, easing: 'ease-out' });
    }
  }

  // ✅ Handle "Forgot Password" link click
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
      e.preventDefault();
      loginForm.classList.remove('active');
      loginForm.style.display = 'none';
      forgotPasswordForm.classList.add('active');
      forgotPasswordForm.style.display = 'block';
    });
  }

  // ✅ Handle "Back to Login" link
  if (backToLoginLink) {
    backToLoginLink.addEventListener('click', function(e) {
      e.preventDefault();
      forgotPasswordForm.classList.remove('active');
      forgotPasswordForm.style.display = 'none';
      loginForm.classList.add('active');
      loginForm.style.display = 'block';
    });
  }

  // ✅ Handle forgot password form submission
  forgotPasswordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();
    
    const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // ✅ REPLACE ALERT WITH TOAST
        showToast('📧 Password reset link sent! Check your email.', 'success');
        console.log('🔗 Dev reset link:', result.reset_link);
        
        forgotPasswordForm.classList.remove('active');
        forgotPasswordForm.style.display = 'none';
        loginForm.classList.add('active');
        loginForm.style.display = 'block';
        forgotPasswordForm.reset();
      } else {
        throw new Error(result.detail || 'Failed to send reset link');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      showToast('❌ ' + error.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // ✅ Handle login - REPLACE ALERTS AND FIX REDIRECT
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      // Show forgot password link on 401
      if (response.status === 401) {
        if (forgotPasswordLink) {
          forgotPasswordLink.style.display = 'inline-block';
        }
        const error = await response.json();
        showToast('❌ ' + (error.detail || 'Invalid username or password'), 'error');
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const result = await response.json();
      localStorage.setItem('rhymebox_token', result.access_token);

      // Fetch user profile
      const profileResponse = await fetch('/api/profile/me', {
        headers: { 'Authorization': `Bearer ${result.access_token}` }
      });

      if (profileResponse.ok) {
        const userData = await profileResponse.json();
        localStorage.setItem('rhymebox_user', JSON.stringify(userData));
      }

      // ✅ REPLACE ALERT WITH TOAST
      showToast('✨ Login successful! Welcome back!', 'success');
      
      // ✅ REDIRECT TO INDEX PAGE instead of profile
      setTimeout(() => {
        window.location.href = '/';
      }, 800);

    } catch (error) {
      console.error('Login error:', error);
      showToast('❌ ' + error.message, 'error');
    }
  });
  
  // Handle signup - Default name to "Rhymer"
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(signupForm);
    const data = {
      name: 'Rhymer',  // ✅ Default name for all new users
      username: formData.get('username').trim().replace('@', ''),
      email: formData.get('email').trim(),
      password: formData.get('password')
    };
    
    // Validate password
    const password = data.password;
    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      showToast('Password must contain at least one uppercase letter', 'error');
      return;
    }
    if (!/[0-9]/.test(password)) {
      showToast('Password must contain at least one number', 'error');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      showToast('Password must contain at least one special character', 'error');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Signup failed');
      }
      
      const result = await response.json();
      localStorage.setItem('rhymebox_token', result.access_token);
      localStorage.setItem('rhymebox_user', JSON.stringify({ 
        username: data.username,
        name: 'Rhymer'
      }));
      
      showToast('✨ Account created successfully! Welcome to Rhyme Box, Rhymer!', 'success');
      setTimeout(() => {
        window.location.href = '/frontend/src/pages/feed.html';
      }, 1000);
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
});
