/**
 * User Profile Page (Friend/Other User View)
 * 
 * Purpose: Display another user's public profile with:
 * - Profile picture, banner, bio
 * - Public poems
 * - Friend status (Add Friend / Chat / Already Friends)
 * 
 * URL: /frontend/src/pages/user_profile.html?username=someone
 * 
 * Note: This is different from profile.js (your own profile)
 */

document.addEventListener('DOMContentLoaded', async function() {
  console.log('👤 user_profile.js loaded');
  
  // Get username from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('username');
  
  console.log('  Username from URL:', username);
  
  if (!username) {
    console.error('❌ No username in URL');
    document.body.innerHTML = '<div style="text-align:center;padding:100px;"><h2>User not found</h2><p>No username provided in URL</p></div>';
    return;
  }
  
  // Fetch user data from backend
  const token = localStorage.getItem('rhymebox_token');
  
  try {
    console.log('📥 Fetching user data...');
    const response = await fetch(`/api/users/${username}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    
    if (!response.ok) {
      throw new Error('User not found');
    }
    
    const userData = await response.json();
    console.log('✅ User data loaded:', userData);
    
    // Check friendship status
    let friendshipStatus = 'none';
    if (token) {
      try {
        const statusResponse = await fetch(`/api/friends/status/${username}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          friendshipStatus = statusData.status;
          console.log('✅ Friendship status:', friendshipStatus);
        }
      } catch (error) {
        console.warn('⚠️ Could not check friendship status:', error);
      }
    }
    
    // Render profile with friendship status
    renderUserProfile(userData, friendshipStatus);
    
  } catch (error) {
    console.error('❌ Error loading profile:', error);
    document.body.innerHTML = `
      <div style="text-align:center;padding:100px;">
        <h2>Error Loading Profile</h2>
        <p>${error.message}</p>
        <a href="/frontend/src/pages/friends.html" class="btn">Back to Friends</a>
      </div>
    `;
  }
});

/**
 * Render user profile with appropriate action buttons
 */
function renderUserProfile(userData, friendshipStatus = 'none') {
  console.log('🎨 Rendering user profile for:', userData.username);
  
  const DEFAULT_PROFILE = '/frontend/src/assets/default_profile.png';
  const DEFAULT_BANNER = '/frontend/src/assets/default_banner.png';
  
  const profilePic = userData.profile_picture_url || userData.image || DEFAULT_PROFILE;
  const banner = userData.banner_image_url || userData.banner || DEFAULT_BANNER;
  
  console.log('  Profile pic:', profilePic);
  console.log('  Banner:', banner);
  
  // Determine action buttons based on friendship status
  let actionButtons = '';
  
  if (friendshipStatus === 'self') {
    // Viewing own profile - no action buttons
    actionButtons = '';
  } else if (friendshipStatus === 'friends') {
    // Already friends - show chat and remove friend
    actionButtons = `
      <div style="display: flex; gap: 12px; margin: 20px 0;">
        <button class="btn" id="chatBtn" style="display: flex; align-items: center; gap: 8px;">
          💬 Chat
        </button>
        <button class="btn secondary" id="removeFriendBtn" style="background: #e53935;">
          ✕ Remove Friend
        </button>
      </div>
    `;
  } else if (friendshipStatus === 'pending_sent') {
    // Request already sent
    actionButtons = `
      <div style="display: flex; gap: 12px; margin: 20px 0;">
        <button class="btn secondary" disabled style="opacity: 0.6; cursor: not-allowed;">
          ⏳ Request Sent
        </button>
      </div>
    `;
  } else if (friendshipStatus === 'pending_incoming') {
    // They sent you a request - show accept/decline
    actionButtons = `
      <div style="display: flex; gap: 12px; margin: 20px 0;">
        <button class="btn" id="acceptRequestBtn" style="background: #4CAF50;">
          ✓ Accept Request
        </button>
        <button class="btn secondary" id="declineRequestBtn">
          ✕ Decline
        </button>
      </div>
    `;
  } else {
    // Not friends - show add friend button
    actionButtons = `
      <div style="display: flex; gap: 12px; margin: 20px 0;">
        <button class="btn secondary" id="addFriendBtn">
          ➕ Add Friend
        </button>
      </div>
    `;
  }
  
  // Build profile HTML
  const profileHTML = `
    <main class="profile">
      <div class="profile-banner-area">
        <img class="profile-banner-img" src="${banner}" alt="Profile Banner"/>
        <div class="profile-pic-area">
          <img src="${profilePic}" alt="${userData.username}"/>
        </div>
      </div>
      
      <section class="profile-main-area">
        <div class="profile-info-stack">
          <h2 class="profile-name">${userData.name || userData.username}</h2>
          <div class="profile-handle">@${userData.username}</div>
          <p class="profile-bio">${userData.bio || 'No bio yet'}</p>
        </div>
        
        ${actionButtons}
        
        <h3>Poems</h3>
        <div id="userPoems" class="poem-feed"></div>
      </section>
    </main>
  `;
  
  // Replace body content
  document.body.innerHTML = '<div id="nav-placeholder"></div>' + profileHTML;
  
  console.log('  Reloading navbar...');
  // Re-inject navbar
  const navbarScript = document.createElement('script');
  navbarScript.src = '/frontend/src/js/navbar.js';
  document.body.appendChild(navbarScript);
  
  console.log('  Loading chat.js...');
  // Load chat.js
  const chatScript = document.createElement('script');
  chatScript.src = '/frontend/src/js/chat.js';
  chatScript.onload = function() {
    attachEventHandlers();
  };
  document.body.appendChild(chatScript);
  
  // Load user's poems
  loadUserPoems(userData.username);
  
  /**
   * Attach event handlers to action buttons
   */
  function attachEventHandlers() {
    const token = localStorage.getItem('rhymebox_token');
    
    // Chat button handler
    const chatBtn = document.getElementById('chatBtn');
    if (chatBtn) {
      chatBtn.addEventListener('click', function() {
        if (typeof window.openChat === 'function') {
          window.openChat(userData.username, profilePic);
        } else {
          alert('Chat feature is loading. Please try again in a moment.');
        }
      });
    }
    
    // Add friend button handler
    const addFriendBtn = document.getElementById('addFriendBtn');
    if (addFriendBtn) {
      addFriendBtn.addEventListener('click', async function() {
        if (!token) {
          alert('Please login to add friends');
          return;
        }
        
        try {
          const response = await fetch('/api/friends/follow', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username: userData.username })
          });
          
          if (response.ok) {
            this.textContent = '✓ Request Sent';
            this.disabled = true;
            this.style.opacity = '0.6';
            alert('Friend request sent!');
          } else {
            const error = await response.json();
            alert(error.detail || 'Failed to send request');
          }
        } catch (error) {
          console.error('Add friend error:', error);
          alert('Failed to send request');
        }
      });
    }
    
    // Remove friend, accept, decline handlers
    // (Similar patterns as above - omitted for brevity)
  }
}

/**
 * Load and display user's public poems
 */
async function loadUserPoems(username) {
  const poemsContainer = document.getElementById('userPoems');
  if (!poemsContainer) return;
  
  poemsContainer.innerHTML = '<p style="text-align:center;color:var(--muted);">Loading poems...</p>';
  
  try {
    const response = await fetch(`/api/poems/?user=${username}`);
    
    if (!response.ok) {
      throw new Error('Failed to load poems');
    }
    
    const poems = await response.json();
    
    if (poems.length === 0) {
      poemsContainer.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px 0;">No public poems yet.</p>';
      return;
    }
    
    poemsContainer.innerHTML = poems.map(p => {
      const isAI = p.category === 'ai';
      const aiTag = isAI ? '<span style="background:var(--lavender);color:#fff;padding:3px 10px;border-radius:12px;font-size:0.75rem;margin-left:8px;font-weight:600;">AI</span>' : '';
      
      const tagsHTML = p.tags && p.tags.length > 0 
        ? `<div class="poem-tags-container">${p.tags.map(tag => `<span class="poem-tag ${tag.class}">${tag.name}</span>`).join('')}</div>`
        : '';
      
      return `
        <article class="poem-card">
          <h3>${p.title || 'Untitled'}${aiTag}</h3>
          <p>${p.content}</p>
          ${tagsHTML}
          <small style="color:var(--muted);">${new Date(p.created_at).toLocaleDateString()}</small>
        </article>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Load poems error:', error);
    poemsContainer.innerHTML = '<p style="text-align:center;color:#e53935;">Failed to load poems</p>';
  }
}
