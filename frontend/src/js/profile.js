document.addEventListener('DOMContentLoaded', async function() {
  // Defaults
  const DEFAULT_PROFILE = "/frontend/src/assets/default_profile.png";
  const DEFAULT_BANNER = "/frontend/src/assets/default_banner.png";

  // Fallback inline SVGs (in case assets are missing)
  const FALLBACK_PROFILE_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23e5e5e5"/><circle cx="50" cy="42" r="18" fill="%23cfcfcf"/><rect x="22" y="64" width="56" height="24" rx="12" fill="%23cfcfcf"/></svg>';
  const FALLBACK_BANNER_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="240" viewBox="0 0 1200 240"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="%23F9D976"/><stop offset="1" stop-color="%23F39F86"/></linearGradient></defs><rect width="1200" height="240" fill="url(%23g)"/></svg>';

  // Helper to try multiple sources in order (skips falsy/empty)
  function setWithFallback(imgEl, sources) {
    if (!imgEl) return;
    const queue = sources.filter(s => typeof s === 'string' && s.trim().length > 0);
    let i = 0;
    const tryNext = () => {
      if (i >= queue.length) {
        console.warn('[profile] All sources failed for', imgEl.id);
        // As a last resort, inject inline SVG placeholder
        if (imgEl.id === 'profilePic') imgEl.src = FALLBACK_PROFILE_SVG;
        if (imgEl.id === 'profileBanner') imgEl.src = FALLBACK_BANNER_SVG;
        return;
      }
      const src = queue[i++];
      imgEl.onerror = () => {
        console.warn('[profile] Failed to load', imgEl.id, '->', src);
        tryNext();
      };
      imgEl.onload = () => {
        console.log('[profile] Loaded', imgEl.id, '->', src);
        imgEl.onerror = null;
        imgEl.onload = null;
      };
      imgEl.src = src;
    };
    console.log('[profile] Loading', imgEl.id, 'with queue:', queue);
    tryNext();
  }

  // Load user (merge defaults with stored so image/banner are present)
  // ✅ CRITICAL: Fetch latest user data from backend on page load
  async function fetchLatestUserData() {
    const token = localStorage.getItem('rhymebox_token');
    
    console.log('🔍 fetchLatestUserData called');
    console.log('  Token exists:', !!token);
    
    if (!token) {
      console.warn('⚠️ No token found, using localStorage data');
      return null;
    }
    
    try {
      console.log('📥 Fetching user profile from /api/profile/me...');
      const response = await fetch('/api/profile/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('📥 Profile response status:', response.status);
      console.log('📥 Profile response ok:', response.ok);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Fresh user data received:', userData);
        console.log('  username:', userData.username);
        console.log('  profile_picture_url:', userData.profile_picture_url);
        console.log('  banner_image_url:', userData.banner_image_url);
        console.log('  profile_picture (old):', userData.profile_picture);
        
        // ✅ Map to old field names and save to localStorage
        const mappedUser = {
          ...userData,
          image: userData.profile_picture_url || userData.profile_picture || DEFAULT_PROFILE,
          banner: userData.banner_image_url || userData.banner_image || DEFAULT_BANNER
        };
        
        console.log('💾 Mapped user data:');
        console.log('  image:', mappedUser.image);
        console.log('  banner:', mappedUser.banner);
        
        localStorage.setItem('rhymebox_user', JSON.stringify(mappedUser));
        console.log('💾 Updated localStorage with fresh data');
        
        return mappedUser;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch profile:', response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      return null;
    }
  }
  
  // ✅ Fetch fresh data first, then load from localStorage as fallback
  const freshUser = await fetchLatestUserData();
  const stored = freshUser || JSON.parse(localStorage.getItem('rhymebox_user') || 'null');
  
  console.log('📥 Using user data:', stored);
  
  let user = {
    username: 'guest',
    bio: 'A lover of words',
    tags: ['Life','Nature'],
    image: DEFAULT_PROFILE,
    banner: DEFAULT_BANNER,
    ...(stored || {})
  };
  
  // ✅ CRITICAL: Prioritize Cloudinary URLs over old fields
  if (stored) {
    // Check all possible image field sources
    user.image = stored.profile_picture_url || stored.image || stored.profile_picture || DEFAULT_PROFILE;
    user.banner = stored.banner_image_url || stored.banner || stored.banner_image || DEFAULT_BANNER;
    
    console.log('🖼️ Final image URLs:');
    console.log('  Profile pic:', user.image);
    console.log('  Banner:', user.banner);
  }

  // View refs
  const viewWrap = document.getElementById('profileViewSection');
  const profileName = document.getElementById('profileName');
  const profileHandle = document.getElementById('profileHandle');
  const profilePic = document.getElementById('profilePic');
  const profileBanner = document.getElementById('profileBanner');
  const profileTags = document.getElementById('profileTags');
  const userPoems = document.getElementById('userPoems');

  // Edit refs
  const editWrap = document.getElementById('profileEditSection');
  const editBtn = document.getElementById('editProfileBtn');
  const editNameInput = document.getElementById('editNameInput');
  const editBioInput = document.getElementById('editBioInput');
  const editTagsInput = document.getElementById('editTagsInput');
  const editTags = document.getElementById('editTags');
  const profilePicInput = document.getElementById('profilePicInput');
  const profileBannerInputEdit = document.getElementById('profileBannerInputEdit');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const saveProfileBtnTop = document.getElementById('saveProfileBtnTop');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const cancelProfileBtnTop = document.getElementById('cancelProfileBtnTop');

  let tempBanner = null, tempProfilePic = null;
  let currentContextTarget = null; // Track which image was clicked
  
  // ✅ NEW: Store selected files instead of uploading immediately
  let selectedProfilePicFile = null;
  let selectedBannerFile = null;

  // Create context menu
  const contextMenu = document.createElement('div');
  contextMenu.className = 'image-context-menu';
  contextMenu.innerHTML = `
    <button data-action="change">
      <span>📷</span>
      <span>Change image</span>
    </button>
    <button data-action="remove">
      <span>🗑️</span>
      <span>Remove image</span>
    </button>
  `;
  document.body.appendChild(contextMenu);

  // Close context menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!contextMenu.contains(e.target) && !e.target.closest('.profile-banner-img, .profile-pic-area')) {
      contextMenu.classList.remove('show');
    }
  });

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

  // Create custom confirmation modal
  function showConfirm(title, message) {
    return new Promise((resolve) => {
      // Create modal elements
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      
      const modal = document.createElement('div');
      modal.className = 'confirm-modal';
      
      modal.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="confirm-actions">
          <button class="confirm-btn cancel">Cancel</button>
          <button class="confirm-btn confirm">Remove</button>
        </div>
      `;
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      // Show modal with animation
      setTimeout(() => overlay.classList.add('show'), 10);
      
      // Handle button clicks
      const cancelBtn = modal.querySelector('.cancel');
      const confirmBtn = modal.querySelector('.confirm');
      
      function cleanup() {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 200);
      }
      
      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });
      
      confirmBtn.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });
      
      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(false);
        }
      });
      
      // Close on ESC key
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(false);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    });
  }

  function renderView() {
    console.log('🎨 Rendering profile view');
    console.log('  Profile pic URL:', user.image);
    console.log('  Banner URL:', user.banner);
    
    setWithFallback(profileBanner, [user.banner, DEFAULT_BANNER, FALLBACK_BANNER_SVG]);
    setWithFallback(profilePic, [user.image, DEFAULT_PROFILE, FALLBACK_PROFILE_SVG]);

    // ✅ Display name and username separately
    if (profileName) profileName.textContent = user.name || user.username;
    if (profileHandle) profileHandle.textContent = '@' + (user.username || 'guest');
    if (document.getElementById('profileBio')) document.getElementById('profileBio').textContent = user.bio || '';

    // Poems authored by the user - filter by showOnProfile flag
    if (userPoems) {
      const poems = (window.RhymeBox && window.RhymeBox.poems || [])
        .filter(p => {
          const isAuthor = p.author === user.username || 
                          p.author === '@' + user.username ||
                          (p.author && p.author.replace('@', '') === user.username);
          // Show only poems where showOnProfile is true
          return isAuthor && p.showOnProfile !== false;
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      if(!poems.length) {
        userPoems.innerHTML = '<p style="text-align:center;padding:40px 0;color:var(--muted);">No poems yet. Start writing to see them here!</p>';
      } else {
        userPoems.innerHTML = poems.map(p=>{
          const date = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          
          // Check if poem is AI-generated (either by title prefix or category)
          const isAI = (p.title && p.title.startsWith('AI:')) || p.category === 'ai';
          const aiTag = isAI ? '<span style="background:var(--lavender);color:#fff;padding:3px 10px;border-radius:12px;font-size:0.75rem;margin-left:8px;font-weight:600;">AI</span>' : '';
          
          return `
            <article class="poem-card">
              <div>
                <h3>${p.title}${aiTag}</h3>
                <p>${p.content}</p>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <small style="color:var(--muted);">${date}</small>
                <button class="btn-remove-profile" data-id="${p.id}" style="background:transparent;border:none;color:var(--rosewood);cursor:pointer;font-size:1.1rem;padding:4px 8px;transition:all .2s ease;" title="Remove from profile">❌</button>
              </div>
            </article>
          `;
        }).join('');
        
        // Attach remove handlers - set showOnProfile to false instead of deleting
        document.querySelectorAll('.btn-remove-profile').forEach(btn => {
          btn.addEventListener('click', async function() {
            const id = parseInt(this.dataset.id);
            
            const confirmed = await showConfirm(
              'Remove from Profile?',
              'This will hide the poem from your profile. It will still be available in My Poems.'
            );
            
            if(confirmed) {
              // Find the poem and set showOnProfile to false
              const poem = window.RhymeBox.poems.find(p => p.id === id);
              if (poem) {
                poem.showOnProfile = false;
                localStorage.setItem('rhymebox_poems', JSON.stringify(window.RhymeBox.poems));
                showToast('Poem removed from profile (still in My Poems)', 'success');
                renderView();
              }
            }
          });
        });
      }
    }
  }

  function openEdit() {
    if (viewWrap) viewWrap.style.display = 'none';
    if (editWrap) editWrap.style.display = '';
    // ✅ Set name (not username) in the edit field
    if (editNameInput) editNameInput.value = user.name || user.username;
    if (editBioInput) editBioInput.value = user.bio || '';
    
    document.body.classList.add('editing-profile');
  }

  function closeEdit() {
    if (editWrap) editWrap.style.display = 'none';
    if (viewWrap) viewWrap.style.display = '';
    tempProfilePic = tempBanner = null;
    renderView();
    
    // Remove editing class
    document.body.classList.remove('editing-profile');
    contextMenu.classList.remove('show');
  }

  function saveProfile() {
    const newName = (editNameInput && editNameInput.value.trim()) || user.username;
    
    // Validate name: only letters and spaces
    if (!/^[a-zA-Z\s]+$/.test(newName)) {
      showToast('❌ Name can only contain letters and spaces', 'error');
      return;
    }
    
    if (newName.length < 2) {
      showToast('❌ Name must be at least 2 characters', 'error');
      return;
    }
    
    // ✅ Update display name only (NOT username)
    user.name = newName;
    user.bio = editBioInput ? editBioInput.value : '';
    // ❌ username remains unchanged

    // ✅ Upload images and save profile
    uploadImagesAndSaveProfile();
  }
  
  // ✅ NEW: Upload images when save is clicked
  async function uploadImagesAndSaveProfile() {
    // ✅ Show loading toast
    const loadingToast = document.createElement('div');
    loadingToast.className = 'toast toast-success show';
    loadingToast.textContent = '⏳ Updating profile...';
    document.body.appendChild(loadingToast);
    
    try {
      const token = localStorage.getItem('rhymebox_token');
      let profilePicUpdated = false;
      let bannerUpdated = false;
      
      // Upload profile picture if selected
      if (selectedProfilePicFile) {
        const formData = new FormData();
        formData.append('file', selectedProfilePicFile);
        
        const response = await fetch('/api/profile/upload-profile-picture', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          user.image = result.url;
          user.profile_picture_url = result.url;
          profilePicUpdated = true;
        } else {
          throw new Error('Failed to upload profile picture');
        }
      }
      
      // Upload banner if selected
      if (selectedBannerFile) {
        const formData = new FormData();
        formData.append('file', selectedBannerFile);
        
        const response = await fetch('/api/profile/upload-banner', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          user.banner = result.url;
          user.banner_image_url = result.url;
          bannerUpdated = true;
        } else {
          throw new Error('Failed to upload banner');
        }
      }
      
      // ✅ Save ONLY name and bio to backend (username is immutable)
      const profileUpdateResponse = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: user.name,  // ✅ Only update display name
          bio: user.bio || ''
          // ❌ REMOVED: username is never sent or updated
        })
      });
      
      if (!profileUpdateResponse.ok) {
        const error = await profileUpdateResponse.json();
        throw new Error(error.detail || 'Failed to update profile');
      }
      
      console.log('✅ Profile data saved to backend');
      
      // ✅ Save to localStorage
      localStorage.setItem('rhymebox_user', JSON.stringify(user));
      
      // ✅ Clear selected files
      selectedProfilePicFile = null;
      selectedBannerFile = null;
      
      // ✅ Remove loading toast
      loadingToast.remove();
      
      // ✅ Show specific success message based on what was updated
      if (profilePicUpdated && bannerUpdated) {
        showToast('✅ Profile picture and banner updated successfully!', 'success');
      } else if (profilePicUpdated) {
        showToast('✅ Profile picture updated successfully!', 'success');
      } else if (bannerUpdated) {
        showToast('✅ Banner updated successfully!', 'success');
      } else {
        showToast('✅ Profile saved successfully!', 'success');
      }
      
      // ✅ Exit edit mode and refresh view
      closeEdit();
      
    } catch (error) {
      console.error('Upload error:', error);
      
      // ✅ Remove loading toast
      const loadingToast = document.querySelector('.toast');
      if (loadingToast) loadingToast.remove();
      
      showToast(`❌ ${error.message}`, 'error');
    }
  }

  // Wire events
  if (editBtn) editBtn.onclick = openEdit;
  if (cancelEditBtn) cancelEditBtn.onclick = closeEdit;
  if (cancelProfileBtnTop) cancelProfileBtnTop.onclick = closeEdit; // New cancel button
  // ❌ REMOVED: Tags input event listener
  // if (editTagsInput) editTagsInput.addEventListener('input', renderTagsEdit);
  
  // Both save buttons trigger the same save function
  if (saveProfileBtn) saveProfileBtn.onclick = saveProfile;
  if (saveProfileBtnTop) saveProfileBtnTop.onclick = saveProfile;

  // Make banner clickable in edit mode
  if (profileBanner) {
    profileBanner.addEventListener('click', function(e) {
      if (!document.body.classList.contains('editing-profile')) return;
      
      currentContextTarget = 'banner';
      contextMenu.classList.add('show');
      
      // Position menu near click
      const rect = e.target.getBoundingClientRect();
      contextMenu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
      contextMenu.style.top = Math.min(e.clientY, window.innerHeight - 100) + 'px';
    });
  }

  // Make profile pic clickable in edit mode
  if (profilePic) {
    profilePic.addEventListener('click', function(e) {
      if (!document.body.classList.contains('editing-profile')) return;
      
      currentContextTarget = 'profile';
      contextMenu.classList.add('show');
      
      // Position menu near click
      const rect = e.target.getBoundingClientRect();
      contextMenu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
      contextMenu.style.top = Math.min(e.clientY, window.innerHeight - 100) + 'px';
    });
  }

  // ✅ Profile pic upload - just preview, don't upload yet
  if (profilePicInput) profilePicInput.addEventListener('change', function(){
    const file = this.files && this.files[0];
    if(!file || !file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File too large (max 5MB)', 'error');
      return;
    }
    
    // ✅ Store file for later upload
    selectedProfilePicFile = file;
    
    // ✅ Show preview using FileReader
    const reader = new FileReader();
    reader.onload = function(e) {
      tempProfilePic = e.target.result;
      profilePic.src = e.target.result;
      // ✅ Remove the "Click Save Profile" toast
    };
    reader.readAsDataURL(file);
  });

  // ✅ Banner upload - just preview, don't upload yet
  if (profileBannerInputEdit) profileBannerInputEdit.addEventListener('change', function(){
    const file = this.files && this.files[0];
    if(!file || !file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    
    // Validate file size (max 10MB for banners)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large (max 10MB)', 'error');
      return;
    }
    
    // ✅ Store file for later upload
    selectedBannerFile = file;
    
    // ✅ Show preview using FileReader
    const reader = new FileReader();
    reader.onload = function(e) {
      tempBanner = e.target.result;
      profileBanner.src = e.target.result;
      // ✅ Remove the "Click Save Profile" toast
    };
    reader.readAsDataURL(file);
  });

  // ✅ Context menu actions - just trigger file input
  contextMenu.addEventListener('click', async function(e) {
    const button = e.target.closest('button');
    if (!button) return;
    
    const action = button.dataset.action;
    contextMenu.classList.remove('show');
    
    if (action === 'change') {
      if (currentContextTarget === 'banner') {
        profileBannerInputEdit.click();
      } else if (currentContextTarget === 'profile') {
        profilePicInput.click();
      }
    } else if (action === 'remove') {
      try {
        const token = localStorage.getItem('rhymebox_token');
        if (!token) {
          throw new Error('Please login first');
        }
        
        const endpoint = currentContextTarget === 'banner' 
          ? '/api/profile/remove-banner'
          : '/api/profile/remove-profile-picture';
        
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove image');
        }
        
        if (currentContextTarget === 'banner') {
          selectedBannerFile = null;
          tempBanner = DEFAULT_BANNER;
          user.banner = DEFAULT_BANNER;
          setWithFallback(profileBanner, [DEFAULT_BANNER, FALLBACK_BANNER_SVG]);
        } else {
          selectedProfilePicFile = null;
          tempProfilePic = DEFAULT_PROFILE;
          user.image = DEFAULT_PROFILE;
          setWithFallback(profilePic, [DEFAULT_PROFILE, FALLBACK_PROFILE_SVG]);
        }
        
        localStorage.setItem('rhymebox_user', JSON.stringify(user));
        showToast('Image removed', 'success');
        
      } catch (error) {
        console.error('Remove error:', error);
        showToast(`❌ ${error.message}`, 'error');
      }
    }
  });

  // Initialize view
  renderView();
});
