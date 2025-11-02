(function(){
  const authModal = `
    <div class="modal-overlay" id="authModal">
      <div class="auth-modal">
        <button class="close-modal">&times;</button>
        <div class="auth-tabs">
          <div class="auth-tab active" data-tab="login">Login</div>
          <div class="auth-tab" data-tab="signup">Sign Up</div>
        </div>

        <form class="auth-form active" id="loginForm">
          <input type="text" name="username" placeholder="Username or Email" required>
          <input type="password" name="password" placeholder="Password" required>
          <button type="submit" class="btn">Login</button>
          <!-- Forgot password hidden by default; will be shown after failed login -->
          <div style="text-align:center;margin-top:16px;padding-top:12px;border-top:1px solid var(--border);">
            <a href="#" id="forgotPasswordLink" style="display:none;color:#7E57C2;font-size:0.95rem;text-decoration:none;font-weight:500;display:inline-block;padding:8px 12px;border-radius:6px;background:rgba(126,87,194,0.05);">
              🔑 Forgot password?
            </a>
          </div>
        </form>
        
        <form class="auth-form" id="forgotPasswordForm" style="display:none;">
          <h3 style="text-align:center;margin:0 0 8px 0;color:var(--ink);">Reset Password</h3>
          <p style="color:var(--muted);text-align:center;margin-bottom:20px;font-size:0.9rem;">Enter your email address and we'll send you a reset link</p>
          <input type="email" name="email" placeholder="Email address" required>
          <button type="submit" class="btn">Send Reset Link</button>
          <div style="text-align:center;margin-top:16px;">
            <a href="#" id="backToLoginLink" style="color:var(--lavender);font-size:0.9rem;text-decoration:none;font-weight:500;">← Back to login</a>
          </div>
        </form>
        
        <form class="auth-form" id="signupForm">
          <input type="text" name="name" placeholder="Full Name (letters and spaces only)" required pattern="[a-zA-Z\\s]+" title="Name can only contain letters and spaces">
          <input type="text" name="username" placeholder="Username (alphanumeric + _)" required pattern="[a-zA-Z0-9_]+" title="Username: letters, numbers, and underscore only">
          <input type="email" name="email" placeholder="Email" required>
          <input type="password" name="password" id="signupPassword" placeholder="Password (min 8 chars)" required minlength="8">
          <div class="password-requirements" style="font-size: 0.85rem; color: var(--muted); margin: -8px 0 16px 0; padding: 8px; background: rgba(126,87,194,0.03); border-radius: 6px;">
            <div>Password must contain:</div>
            <ul style="margin: 4px 0; padding-left: 20px;">
              <li id="req-length">At least 8 characters</li>
              <li id="req-upper">One uppercase letter</li>
              <li id="req-number">One number</li>
              <li id="req-special">One special character (!@#$%^&*...)</li>
            </ul>
          </div>
          <button type="submit" class="btn">Sign Up</button>
        </form>
      </div>
    </div>
  `;

  // Check if user is logged in
  const token = localStorage.getItem('rhymebox_token');
  const user = JSON.parse(localStorage.getItem('rhymebox_user') || 'null');
  
  // ✅ Add debug logging
  console.log('🔍 Navbar initialization:');
  console.log('  Token exists:', !!token);
  console.log('  User data:', user);
  console.log('  profile_picture_url:', user?.profile_picture_url);
  console.log('  banner_image_url:', user?.banner_image_url);
  console.log('  image (old):', user?.image);
  console.log('  banner (old):', user?.banner);
  
  // ✅ Get profile picture with fallback - prioritize Cloudinary URL
  const DEFAULT_PROFILE = '/frontend/src/assets/default_profile.png';
  const DEFAULT_BANNER = '/frontend/src/assets/default_banner.png';
  
  const profilePic = user?.profile_picture_url || user?.image || DEFAULT_PROFILE;
  const username = user?.username || 'guest';
  
  console.log('  Final profilePic URL:', profilePic);
  
  // Determine nav link text
  const authLinkText = token ? 'Logout' : 'Login';
  const authLinkId = token ? 'logoutTrigger' : 'authTrigger';
  
  // ✅ Add inline SVG logo (use provided SVG)
  const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" xml:space="preserve" aria-hidden="true" focusable="false"><path d="M99.569 192.497a5.18 5.18 0 0 0 6.846-2.599c.22-.494.449-.991.682-1.494a5.175 5.175 0 0 0-2.507-6.879 5.176 5.176 0 0 0-6.879 2.507c-.253.546-.501 1.086-.741 1.62a5.177 5.177 0 0 0 2.599 6.845zM228.711 53.746a5.178 5.178 0 0 0-4.808-1.04c-23.523 6.812-48.657 29.368-65.604 47.09-20.182 21.108-40.02 47.236-53.062 69.89a5.176 5.176 0 0 0 1.904 7.069 5.178 5.178 0 0 0 7.07-1.903c12.65-21.975 31.932-47.358 51.571-67.9 19.303-20.187 37.848-34.58 53.188-41.404-1.55 9.503-3.585 18.304-6.157 26.664l-20.86 7.413a5.176 5.176 0 0 0 .121 9.798l12.466 4.083a120.961 120.961 0 0 1-5.77 10.605l-25.299-2.55a5.176 5.176 0 0 0-4.146 8.846l13.647 13.399a80.761 80.761 0 0 1-11.466 9.014l-12.311-9.559a5.178 5.178 0 0 0-8.352 4.09v14.912c-6.971 2.055-14.481 3.287-22.378 3.667a5.18 5.18 0 0 0-4.924 5.421 5.18 5.18 0 0 0 5.421 4.923c10.213-.492 19.883-2.286 28.743-5.333a5.18 5.18 0 0 0 3.493-4.896v-8.118l6.791 5.273a5.18 5.18 0 0 0 5.79.379c7.389-4.324 14.225-9.793 20.314-16.259a5.179 5.179 0 0 0-.139-7.245l-6.86-6.733 13.821 1.393a5.177 5.177 0 0 0 4.854-2.321c3.944-6.042 7.524-12.762 10.639-19.973a5.176 5.176 0 0 0-3.14-6.974l-3.557-1.165 8.995-3.196a5.173 5.173 0 0 0 3.192-3.284c3.923-12.121 6.73-25.038 8.58-39.487a5.171 5.171 0 0 0-1.767-4.589z"/><path d="m122.604 211.113-.988-.539c-1.388-.757-2.561-2.802-2.561-3.686v-2.864c5.339-3.402 8.629-8.261 8.629-13.737a5.178 5.178 0 1 0-10.356 0c0 3.893-7.562 8.419-17.31 8.419-9.748 0-17.309-4.526-17.309-8.419 0-2.295 2.657-4.851 6.769-6.512a5.176 5.176 0 0 0 2.861-6.74 5.176 5.176 0 0 0-6.74-2.861c-8.293 3.351-13.245 9.375-13.245 16.113 0 5.476 3.29 10.335 8.629 13.737v2.864c0 .884-1.173 2.929-2.56 3.686l-.988.539c-4.537 2.474-7.958 8.237-7.958 13.404v11.815c0 6.157 5.011 11.167 11.167 11.167h38.749c6.157 0 11.167-5.01 11.167-11.167v-11.815c.002-5.167-3.419-10.93-7.956-13.404zm-2.398 25.219c0 .432-.38.812-.812.812H80.646a.834.834 0 0 1-.812-.812v-11.815c0-1.39 1.341-3.648 2.56-4.312l.99-.54c4.146-2.263 7.359-7.048 7.88-11.529 2.741.601 5.683.926 8.756.926 3.075 0 6.016-.325 8.757-.926.52 4.48 3.733 9.267 7.881 11.529l.988.54c1.221.665 2.561 2.922 2.561 4.312v11.815z"/></svg>`;

  const navHtml = `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <a href="/" class="brand-link">
          <span class="brand-logo">${LOGO_SVG}</span>
          <span class="brand-text">Rhyme Box</span>
        </a>
      </div>
      <nav class="sidebar-nav">
        <a href="/frontend/src/pages/feed.html" class="nav-link active">Feed</a>
        <a href="/frontend/src/pages/my_poems.html" class="nav-link">My Poems</a>
        <a href="/frontend/src/pages/profile.html" class="nav-link">Profile</a>
        <a href="/frontend/src/pages/friends.html" class="nav-link">Friends</a>
      </nav>
      
      <!-- Logout above Settings, both above profile -->
      <div class="sidebar-bottom-section">
        <a href="#" class="nav-link" id="logoutTrigger">
          <span>Logout</span>
        </a>
        <a href="/frontend/src/pages/settings.html" class="nav-link settings-link">
          <span>Settings</span>
        </a>
        
        <!-- Profile section -->
        <div class="sidebar-profile">
          <img src="${profilePic}" alt="${username}" class="sidebar-profile-pic" />
          <div class="sidebar-profile-info">
            <div class="sidebar-profile-name">${username}</div>
            <div class="sidebar-profile-handle">@${username}</div>
          </div>
        </div>
      </div>
    </aside>`;

  function setupAuthModal() {
    const modal = document.querySelector('#authModal');
    const authLink = document.querySelector('#authTrigger');
    const logoutLink = document.querySelector('#logoutTrigger');
    
    console.log('🔍 setupAuthModal called');
    console.log('  Modal exists:', !!modal);
    console.log('  Auth link exists:', !!authLink);
    
    if (!modal) {
      console.warn('⚠️ Auth modal not found in DOM');
      return;
    }
    
    // If logout link exists, handle logout
    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmed = await showLogoutConfirm();
        if (confirmed) {
          localStorage.removeItem('rhymebox_token');
          localStorage.removeItem('rhymebox_user');
          window.location.href = '/frontend/src/pages/login.html';
        }
      });
      return;
    }
    
    // If login link exists, show auth modal
    if (!authLink) {
      console.warn('⚠️ Auth link not found');
      return;
    }
    
    const close = modal.querySelector('.close-modal');
    const tabs = modal.querySelectorAll('.auth-tab');
    const loginForm = modal.querySelector('#loginForm');
    const signupForm = modal.querySelector('#signupForm');
    const forgotPasswordForm = modal.querySelector('#forgotPasswordForm');
    const forgotPasswordLink = modal.querySelector('#forgotPasswordLink');
    const backToLoginLink = modal.querySelector('#backToLoginLink');
    
    console.log('🔍 Modal elements check:');
    console.log('  forgotPasswordLink exists:', !!forgotPasswordLink);
    console.log('  forgotPasswordForm exists:', !!forgotPasswordForm);
    console.log('  backToLoginLink exists:', !!backToLoginLink);
    
    if (!forgotPasswordLink) {
      console.error('❌ Forgot password link not found!');
      console.log('📋 loginForm HTML:', loginForm?.innerHTML.substring(0, 500));
    }
    
    // ✅ Verify all required elements exist
    if (!close || !loginForm || !signupForm || !forgotPasswordForm) {
      console.error('❌ Missing modal elements');
      return;
    }
    
    // Ensure it's hidden when modal opens
    if (forgotPasswordLink) {
      forgotPasswordLink.style.display = 'none';
    }

    // helper to reveal the forgot-password link after failed login
    function showForgotLink() {
      if (!forgotPasswordLink) return;
      forgotPasswordLink.style.display = 'inline-block';
      // subtle attention animation
      forgotPasswordLink.animate([
        { transform: 'translateY(0)', opacity: 0.9 },
        { transform: 'translateY(-6px)', opacity: 1 },
        { transform: 'translateY(0)', opacity: 1 }
      ], { duration: 700, easing: 'ease-out' });
    }

    authLink.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('show');
    });
    
    close.addEventListener('click', () => {
      modal.classList.remove('show');
    });
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const forms = modal.querySelectorAll('.auth-form');
        forms.forEach(f => f.classList.remove('active'));
        modal.querySelector(`#${tab.dataset.tab}Form`).classList.add('active');
      });
    });

    // Password validation UI
    if (signupPassword) {
      signupPassword.addEventListener('input', function() {
        const password = this.value;
        const reqLength = modal.querySelector('#req-length');
        const reqUpper = modal.querySelector('#req-upper');
        const reqNumber = modal.querySelector('#req-number');
        const reqSpecial = modal.querySelector('#req-special');
        
        if (reqLength) reqLength.style.color = password.length >= 8 ? '#4CAF50' : 'var(--muted)';
        if (reqUpper) reqUpper.style.color = /[A-Z]/.test(password) ? '#4CAF50' : 'var(--muted)';
        if (reqNumber) reqNumber.style.color = /[0-9]/.test(password) ? '#4CAF50' : 'var(--muted)';
        if (reqSpecial) reqSpecial.style.color = /[!@#$%^&*(),.?":{}|<>]/.test(password) ? '#4CAF50' : 'var(--muted)';
      });
    }

    // Handle "Forgot Password" link
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Forgot password clicked');
        
        // Hide all forms first
        loginForm.classList.remove('active');
        signupForm.classList.remove('active');
        forgotPasswordForm.classList.remove('active');
        
        // Show forgot password form
        forgotPasswordForm.classList.add('active');
        forgotPasswordForm.style.display = 'block';
      });
    }
    
    // Handle "Back to Login" link
    if (backToLoginLink) {
      backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Back to login clicked');
        
        // Hide forgot password form
        forgotPasswordForm.classList.remove('active');
        forgotPasswordForm.style.display = 'none';
        
        // Show login form
        loginForm.classList.add('active');
      });
    }
    
    // Handle forgot password form submission
    forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(forgotPasswordForm);
      const email = formData.get('email');
      
      console.log('📤 Sending password reset request for:', email);
      
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
          alert(`✉️ Password reset link sent!\n\nFor development: ${result.reset_link}\n\nCopy this link and open it in your browser.`);
          
          forgotPasswordForm.classList.remove('active');
          forgotPasswordForm.style.display = 'none';
          loginForm.classList.add('active');
          forgotPasswordForm.reset();
        } else {
          throw new Error(result.detail || 'Failed to send reset link');
        }
      } catch (error) {
        console.error('❌ Forgot password error:', error);
        alert('Error: ' + error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });

    // Handle login
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const data = {
        username: formData.get('username'),
        password: formData.get('password')
      };

      console.log('📤 Attempting login with username:', data.username);

      try {
        const response = await fetch('/api/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        console.log('📥 Response status:', response.status);

        // If credentials invalid, reveal forgot-password link
        if (response.status === 401) {
          showForgotLink();
          
          // ✅ Get detailed error message
          const errorText = await response.text();
          console.error('❌ 401 Unauthorized:', errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.detail || 'Invalid username or password');
          } catch (parseError) {
            throw new Error('Invalid username or password');
          }
        }

        const responseText = await response.text();
        if (!response.ok) {
          let errorMessage = 'Login failed';
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.detail || errorMessage;
          } catch (parseError) {
            errorMessage = `Server error: ${response.status}. Check backend console.`;
          }
          throw new Error(errorMessage);
        }
        
        const result = JSON.parse(responseText);
        console.log('✅ Login successful, token received');
        
        // Save token
        localStorage.setItem('rhymebox_token', result.access_token);
        
        // Fetch user profile
        const profileResponse = await fetch('/api/profile/me', {
          headers: { 'Authorization': `Bearer ${result.access_token}` }
        });
        
        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          const userToSave = {
            ...userData,
            image: userData.profile_picture_url || userData.profile_picture || DEFAULT_PROFILE,
            banner: userData.banner_image_url || userData.banner_image || DEFAULT_BANNER
          };
          
          localStorage.setItem('rhymebox_user', JSON.stringify(userToSave));
          console.log('✅ User profile saved to localStorage');
        }
        
        // ✅ NEW: Start background data prefetch
        if (window.DataPrefetch) {
          console.log('🚀 Triggering background data prefetch...');
          window.DataPrefetch.prefetchAll().catch(err => {
            console.warn('⚠️ Background prefetch failed (non-critical):', err);
          });
        }
        
        alert('✨ Login successful!');
        modal.classList.remove('show');
        
        // Redirect
        const intended = sessionStorage.getItem('intended_page');
        sessionStorage.removeItem('intended_page');
        window.location.href = intended || '/frontend/src/pages/profile.html';
        
      } catch (error) {
        console.error('❌ Login error:', error);
        showForgotLink();
        alert('Login failed: ' + error.message);
      }
    });

    // Handle signup
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(signupForm);
      const data = {
        name: formData.get('name').trim(),
        username: formData.get('username').trim().replace('@', ''),
        email: formData.get('email').trim(),
        password: formData.get('password')
      };
      
      // Validate name: only letters and spaces
      if (!/^[a-zA-Z\s]+$/.test(data.name)) {
        alert('❌ Name can only contain letters and spaces (no numbers or special characters)');
        return;
      }
      
      if (data.name.length < 2) {
        alert('❌ Name must be at least 2 characters long');
        return;
      }
      
      // Validate password
      const password = data.password;
      if (password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        alert('Password must contain at least one uppercase letter');
        return;
      }
      if (!/[0-9]/.test(password)) {
        alert('Password must contain at least one number');
        return;
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        alert('Password must contain at least one special character');
        return;
      }
      
      console.log('📤 Sending signup request:', { ...data, password: '[REDACTED]' });
      
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        console.log('📥 Response status:', response.status);
        console.log('📥 Response headers:', [...response.headers.entries()]);
        
        // Try to get response text first
        const responseText = await response.text();
        console.log('📥 Response body:', responseText);
        
        if (!response.ok) {
          // Try to parse as JSON
          let errorMessage = 'Signup failed';
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.detail || errorMessage;
          } catch (parseError) {
            // If not JSON, show the HTML error
            console.error('❌ Server returned HTML error:', responseText.substring(0, 200));
            errorMessage = `Server error: ${response.status} ${response.statusText}. Check backend console.`;
          }
          throw new Error(errorMessage);
        }
        
        // Parse successful response
        const result = JSON.parse(responseText);
        console.log('✅ Signup successful:', result);
        
        localStorage.setItem('rhymebox_token', result.access_token);
        localStorage.setItem('rhymebox_user', JSON.stringify({ 
          username: data.username,
          name: data.name
        }));
        
        // ✅ NEW: Start background data prefetch
        if (window.DataPrefetch) {
          console.log('🚀 Triggering background data prefetch...');
          window.DataPrefetch.prefetchAll().catch(err => {
            console.warn('⚠️ Background prefetch failed (non-critical):', err);
          });
        }
        
        alert('✨ Account created successfully! Welcome to Rhyme Box!');
        modal.classList.remove('show');
        
        const intended = sessionStorage.getItem('intended_page');
        sessionStorage.removeItem('intended_page');
        window.location.href = intended || '/frontend/src/pages/feed.html';
      } catch (error) {
        console.error('❌ Signup error:', error);
        alert('Signup failed: ' + error.message);
      }
    });
    
    // Google Sign In
    const googleBtn = modal.querySelector('.google-signin');
    googleBtn.addEventListener('click', () => {
      // Initialize Google Sign In
      // This is where you'd implement Google OAuth
      console.log('Google sign in clicked');
    });
  }
  
  // Logout confirmation modal
  function showLogoutConfirm() {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      const modal = document.createElement('div');
      modal.className = 'confirm-modal';
      modal.innerHTML = `
        <h3>Logout?</h3>
        <p>Are you sure you want to logout?</p>
        <div class="confirm-actions">
          <button class="confirm-btn cancel">Cancel</button>
          <button class="confirm-btn confirm" style="background: #e53935;">Logout</button>
        </div>
      `;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      setTimeout(() => overlay.classList.add('show'), 10);
      
      const cleanup = () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 200);
      };
      
      modal.querySelector('.cancel').onclick = () => { cleanup(); resolve(false); };
      modal.querySelector('.confirm').onclick = () => { cleanup(); resolve(true); };
      overlay.onclick = (e) => { if (e.target === overlay) { cleanup(); resolve(false); } };
    });
  }

  function injectNavbar() {
    try {
      console.log('📌 Attempting to inject navbar...');
      let placeholder = document.getElementById('nav-placeholder');
      if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.id = 'nav-placeholder';
        document.body.insertBefore(placeholder, document.body.firstChild);
      }
      
      // Inject both navbar and modal
      placeholder.innerHTML = navHtml + authModal;
      document.body.classList.add('has-sidebar');
      
      // ✅ Use requestAnimationFrame to ensure DOM is fully parsed
      requestAnimationFrame(() => {
        setupAuthModal();
        console.log('✅ Navbar injection complete');
      });

    } catch (err) {
      console.error('❌ Failed to inject navbar:', err);
    }
  }

  // Inject when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNavbar);
  } else {
    injectNavbar();
  }
})();
