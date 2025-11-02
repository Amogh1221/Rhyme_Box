document.addEventListener('DOMContentLoaded', function(){
  const searchInput = document.getElementById('searchTag');
  const searchResults = document.getElementById('searchResults');
  const searchForm = document.getElementById('searchForm');
  const friendRequests = document.getElementById('friendRequests');
  const friendsList = document.getElementById('friendsList');
  
  let searchTimeout = null;
  
  // ✅ Load friends list on initial page load using cache
  const token = localStorage.getItem('rhymebox_token');
  if (token) {
    loadFriendsList();
  }
  
  // ✅ Tab switching
  document.querySelectorAll('.friends-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      // Update active tab
      document.querySelectorAll('.friends-tab').forEach(t => {
        t.classList.remove('active');
        t.style.borderBottom = '3px solid transparent';
        t.style.color = 'var(--muted)';
      });
      this.classList.add('active');
      this.style.borderBottom = '3px solid var(--rosewood)';
      this.style.color = 'var(--rosewood)';
      
      // Show corresponding section
      const tabName = this.dataset.tab;
      document.querySelectorAll('.friends-section').forEach(section => {
        section.style.display = 'none';
      });
      
      if (tabName === 'list') {
        document.getElementById('listSection').style.display = 'block';
        loadFriendsList();
      } else if (tabName === 'requests') {
        document.getElementById('requestsSection').style.display = 'block';
        loadFriendRequests();
      } else if (tabName === 'search') {
        document.getElementById('searchSection').style.display = 'block';
      }
    });
  });
  
  // ✅ Real-time autocomplete search
  searchInput.addEventListener('input', async function() {
    clearTimeout(searchTimeout);
    
    const query = this.value.trim();
    
    if (query.length < 1) {
      searchResults.innerHTML = '';
      return;
    }
    
    // Debounce search
    searchTimeout = setTimeout(async () => {
      await performSearch(query);
    }, 300);
  });
  
  // Also handle form submit
  searchForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      await performSearch(query);
    }
  });
  
  async function performSearch(query) {
    const token = localStorage.getItem('rhymebox_token');
    if (!token) {
      searchResults.innerHTML = '<p style="color:#e53935;">Please login to search for friends.</p>';
      return;
    }
    
    searchResults.innerHTML = '<p style="color:var(--muted);">Searching...</p>';
    
    try {
      const response = await fetch(`/api/friends/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const users = await response.json();
      
      if (users.length === 0) {
        searchResults.innerHTML = '<p style="color:var(--muted);">No users found matching your search.</p>';
        return;
      }
      
      // Display user cards
      searchResults.innerHTML = users.map(user => `
        <div class="poem-card" style="max-width:500px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
            <img src="${user.profile_picture_url || '/frontend/src/assets/default_profile.png'}" 
                 alt="${user.username}" 
                 style="width:60px;height:60px;border-radius:50%;object-fit:cover;" />
            <div>
              <h3 style="margin:0 0 4px 0;">${user.name || user.username}</h3>
              <div style="color:var(--muted);font-size:0.9rem;">${user.profile_tag || '@' + user.username}</div>
            </div>
          </div>
          ${user.bio ? `<p style="color:var(--muted);margin:12px 0;">${user.bio}</p>` : ''}
          <div style="display:flex;gap:12px;margin-top:16px;">
            <button class="btn" onclick="window.location.href='/frontend/src/pages/user_profile.html?username=${user.username}'">
              View Profile
            </button>
            <button class="btn secondary addFriend" data-user="${user.username}">
              ➕ Add Friend
            </button>
          </div>
        </div>
      `).join('');
      
      // Attach friend request handlers
      document.querySelectorAll('.addFriend').forEach(btn => {
        btn.addEventListener('click', async function() {
          const username = this.dataset.user;
          try {
            const response = await fetch('/api/friends/follow', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ username })
            });
            
            if (response.ok) {
              this.textContent = '✓ Request Sent';
              this.disabled = true;
              this.style.opacity = '0.6';
              showToast('Friend request sent!', 'success');
            } else {
              const error = await response.json();
              showToast(error.detail || 'Failed to send request', 'error');
            }
          } catch (error) {
            console.error('Add friend error:', error);
            showToast('Failed to send request', 'error');
          }
        });
      });
      
    } catch (error) {
      console.error('Search error:', error);
      searchResults.innerHTML = '<p style="color:#e53935;">Search failed. Please try again.</p>';
    }
  }
  
  // ✅ Load friend requests with cache support
  async function loadFriendRequests() {
    const token = localStorage.getItem('rhymebox_token');
    if (!token) {
      friendRequests.innerHTML = '<p style="color:#e53935;">Please login to view requests.</p>';
      return;
    }
    
    friendRequests.innerHTML = '<p style="color:var(--muted);">Loading requests...</p>';
    
    try {
      let requests;
      
      // ✅ Try cache first
      if (window.DataPrefetch && window.DataPrefetch.cache.requests) {
        console.log('⚡ Using prefetched requests data');
        requests = window.DataPrefetch.cache.requests;
      } else {
        console.log('📥 Fetching fresh requests data');
        const response = await fetch('/api/friends/requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load requests');
        
        requests = await response.json();
        
        // Cache the result
        if (window.DataPrefetch) {
          window.DataPrefetch.cache.requests = requests;
          window.DataPrefetch.cache.lastFetch.requests = Date.now();
        }
      }
      
      if (requests.length === 0) {
        friendRequests.innerHTML = '<p style="color:var(--muted);text-align:center;padding:40px 0;">No pending friend requests.</p>';
        return;
      }
      
      friendRequests.innerHTML = requests.map(req => `
        <div class="poem-card" style="max-width:500px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
            <img src="${req.profile_picture_url || '/frontend/src/assets/default_profile.png'}" 
                 alt="${req.username}" 
                 style="width:60px;height:60px;border-radius:50%;object-fit:cover;" />
            <div style="flex:1;">
              <h3 style="margin:0 0 4px 0;">${req.name || req.username}</h3>
              <div style="color:var(--muted);font-size:0.9rem;">@${req.username}</div>
              <small style="color:var(--muted);font-size:0.8rem;">${new Date(req.requested_at).toLocaleDateString()}</small>
            </div>
          </div>
          <div style="display:flex;gap:12px;margin-top:16px;">
            <button class="btn acceptRequest" data-user="${req.username}" style="background:#4CAF50;">
              ✓ Accept
            </button>
            <button class="btn secondary declineRequest" data-user="${req.username}">
              ✕ Decline
            </button>
          </div>
        </div>
      `).join('');
      
      // Attach handlers
      document.querySelectorAll('.acceptRequest').forEach(btn => {
        btn.addEventListener('click', async function() {
          const username = this.dataset.user;
          try {
            const response = await fetch('/api/friends/respond', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ username, action: 'accept' })
            });
            
            if (response.ok) {
              // ✅ Invalidate caches
              if (window.DataPrefetch) {
                window.DataPrefetch.invalidate('requests');
                window.DataPrefetch.invalidate('friends');
              }
              showToast('Friend request accepted!', 'success');
              loadFriendRequests();
            }
          } catch (error) {
            showToast('Failed to accept request', 'error');
          }
        });
      });
      
      document.querySelectorAll('.declineRequest').forEach(btn => {
        btn.addEventListener('click', async function() {
          const username = this.dataset.user;
          try {
            const response = await fetch('/api/friends/respond', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ username, action: 'decline' })
            });
            
            if (response.ok) {
              // ✅ Invalidate cache
              if (window.DataPrefetch) {
                window.DataPrefetch.invalidate('requests');
              }
              showToast('Request declined', 'success');
              loadFriendRequests();
            }
          } catch (error) {
            showToast('Failed to decline request', 'error');
          }
        });
      });
      
    } catch (error) {
      console.error('Load requests error:', error);
      friendRequests.innerHTML = '<p style="color:#e53935;">Failed to load requests.</p>';
    }
  }
  
  // ✅ Load friends list with cache support
  async function loadFriendsList() {
    const token = localStorage.getItem('rhymebox_token');
    if (!token) {
      friendsList.innerHTML = '<p style="color:#e53935;">Please login to view friends.</p>';
      return;
    }
    
    friendsList.innerHTML = '<p style="color:var(--muted);">Loading friends...</p>';
    
    try {
      let friends;
      
      // ✅ Try cache first
      if (window.DataPrefetch && window.DataPrefetch.cache.friends) {
        console.log('⚡ Using prefetched friends data');
        friends = window.DataPrefetch.cache.friends;
      } else {
        console.log('📥 Fetching fresh friends data');
        const response = await fetch('/api/friends/list', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load friends');
        
        friends = await response.json();
        
        // Cache the result
        if (window.DataPrefetch) {
          window.DataPrefetch.cache.friends = friends;
          window.DataPrefetch.cache.lastFetch.friends = Date.now();
        }
      }
      
      if (friends.length === 0) {
        friendsList.innerHTML = '<p style="color:var(--muted);text-align:center;padding:40px 0;">You haven\'t added any friends yet.<br>Search for friends to connect!</p>';
        return;
      }
      
      friendsList.innerHTML = friends.map(friend => `
        <div class="poem-card" style="max-width:500px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
            <img src="${friend.profile_picture_url || '/frontend/src/assets/default_profile.png'}" 
                 alt="${friend.username}" 
                 style="width:60px;height:60px;border-radius:50%;object-fit:cover;" />
            <div style="flex:1;">
              <h3 style="margin:0 0 4px 0;">${friend.name || friend.username}</h3>
              <div style="color:var(--muted);font-size:0.9rem;">${friend.profile_tag || '@' + friend.username}</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;margin-top:16px;">
            <button class="btn" onclick="window.location.href='/frontend/src/pages/user_profile.html?username=${friend.username}'">
              View Profile
            </button>
            <button class="btn secondary removeFriend" data-user="${friend.username}">
              Remove Friend
            </button>
          </div>
        </div>
      `).join('');
      
      // Attach remove handlers
      document.querySelectorAll('.removeFriend').forEach(btn => {
        btn.addEventListener('click', async function() {
          const username = this.dataset.user;
          if (!confirm(`Remove ${username} from friends?`)) return;
          
          try {
            const response = await fetch('/api/friends/remove', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ username })
            });
            
            if (response.ok) {
              // ✅ Invalidate cache
              if (window.DataPrefetch) {
                window.DataPrefetch.invalidate('friends');
              }
              showToast('Friend removed', 'success');
              loadFriendsList();
            }
          } catch (error) {
            showToast('Failed to remove friend', 'error');
          }
        });
      });
      
    } catch (error) {
      console.error('Load friends error:', error);
      friendsList.innerHTML = '<p style="color:#e53935;">Failed to load friends.</p>';
    }
  }
  
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
});
