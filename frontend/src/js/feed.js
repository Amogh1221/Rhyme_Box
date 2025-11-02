document.addEventListener('DOMContentLoaded', async function(){
  const feed = document.getElementById('feed');
  
  let allPoems = [];
  let selectedFilterTags = [];
  
  // ✅ NEW: 6-category tag system
  const tagCategories = {
    'Themes': {
      class: 'tag-themes',
      tags: ['Love', 'Nature', 'Life', 'Death', 'Time', 'Dreams', 'Freedom', 'Identity', 'Friendship', 'War', 'Peace', 'Hope', 'Loneliness', 'Childhood', 'Spirituality', 'Society', 'Technology', 'Change', 'Memory', 'Loss']
    },
    'Tone / Mood': {
      class: 'tag-tone',
      tags: ['Romantic', 'Melancholic', 'Inspirational', 'Tragic', 'Hopeful', 'Dark', 'Nostalgic', 'Joyful', 'Calm', 'Angry', 'Playful', 'Mysterious', 'Reflective', 'Haunting', 'Empowering']
    },
    'Style / Form': {
      class: 'tag-style',
      tags: ['Haiku', 'Sonnet', 'Free Verse', 'Limerick', 'Ballad', 'Ode', 'Elegy', 'Epic', 'Acrostic', 'Narrative', 'Blank Verse', 'Lyric', 'Dramatic Monologue']
    },
    'Language / Technique': {
      class: 'tag-technique',
      tags: ['Metaphorical', 'Symbolic', 'Descriptive', 'Abstract', 'Minimalist', 'Visual / Concrete', 'Allegorical', 'Satirical']
    },
    'Context / Origin': {
      class: 'tag-context',
      tags: ['Modern', 'Classical', 'Contemporary', 'Experimental', 'Folk', 'Cultural', 'Philosophical']
    },
    'Emotion / Intensity': {
      class: 'tag-emotion',
      tags: ['Passionate', 'Serene', 'Intense', 'Subtle', 'Meditative', 'Chaotic']
    }
  };
  
  // Create tag filter modal
  function createTagFilterModal() {
    const overlay = document.createElement('div');
    overlay.className = 'tag-selector-overlay';
    overlay.id = 'tagFilterOverlay';
    
    let categoriesHTML = '';
    for (const [categoryName, categoryData] of Object.entries(tagCategories)) {
      const tagsHTML = categoryData.tags.map(tag => 
        `<span class="tag-option ${categoryData.class}" data-tag="${tag}" data-category="${categoryData.class}">${tag}</span>`
      ).join('');
      
      categoriesHTML += `
        <div class="tag-category">
          <h4>${categoryName}</h4>
          <div class="tag-options">${tagsHTML}</div>
        </div>
      `;
    }
    
    overlay.innerHTML = `
      <div class="tag-selector-modal">
        <h3>Filter Poems by Tags</h3>
        <p style="text-align:center;color:var(--muted);margin-bottom:20px;">Select tags to filter the feed (shows poems with any selected tag)</p>
        ${categoriesHTML}
        <div class="tag-selector-actions">
          <button class="confirm-btn cancel">Cancel</button>
          <button class="confirm-btn" style="background: var(--accent-gradient); color: #222;">Apply Filters</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    return overlay;
  }
  
  // Show tag filter modal
  function showTagFilterModal() {
    let overlay = document.getElementById('tagFilterOverlay');
    if (!overlay) {
      overlay = createTagFilterModal();
    }
    
    // Mark already selected tags
    overlay.querySelectorAll('.tag-option').forEach(option => {
      if (selectedFilterTags.find(t => t.name === option.dataset.tag)) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    });
    
    overlay.classList.add('show');
    
    // Handle tag clicks
    overlay.querySelectorAll('.tag-option').forEach(option => {
      option.onclick = function() {
        const tagName = this.dataset.tag;
        const tagClass = this.dataset.category;
        
        if (this.classList.contains('selected')) {
          // Deselect
          this.classList.remove('selected');
          selectedFilterTags = selectedFilterTags.filter(t => t.name !== tagName);
        } else {
          // Select
          this.classList.add('selected');
          selectedFilterTags.push({ name: tagName, class: tagClass });
        }
      };
    });
    
    // Handle apply button
    overlay.querySelector('.confirm-btn:not(.cancel)').onclick = () => {
      overlay.classList.remove('show');
      renderPoems(allPoems);
    };
    
    // Handle cancel button
    overlay.querySelector('.confirm-btn.cancel').onclick = () => {
      overlay.classList.remove('show');
    };
    
    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('show');
      }
    };
  }
  
  // Filter poems by selected tags (OR logic)
  function filterPoems(poems) {
    if (selectedFilterTags.length === 0) {
      return poems;
    }
    
    return poems.filter(poem => {
      if (!poem.tags || poem.tags.length === 0) return false;
      
      // Check if poem has ANY of the selected tags
      return selectedFilterTags.some(filterTag => 
        poem.tags.some(poemTag => poemTag.name === filterTag.name)
      );
    });
  }
  
  // ✅ NEW: Load initial like counts for each poem
  async function loadLikeCounts(poems) {
    const token = localStorage.getItem('rhymebox_token');
    if (!token) return;
    
    for (const poem of poems) {
      try {
        const response = await fetch(`/api/poems/${poem.id}/likes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          poem.like_count = data.like_count;
          poem.user_liked = data.user_liked || false;
        }
      } catch (error) {
        console.warn(`Failed to load likes for poem ${poem.id}`);
      }
    }
  }
  
  // ✅ NEW: Like poem function
  async function likePoem(poemId, likeBtn) {
    const token = localStorage.getItem('rhymebox_token');
    if (!token) {
      showToast('Please login to like poems', 'error');
      return;
    }
    
    try {
      const response = await fetch(`/api/poems/${poemId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to like poem');
      
      const result = await response.json();
      
      // ✅ Update button UI with database count
      const countSpan = likeBtn.querySelector('.like-count');
      countSpan.textContent = result.like_count;
      
      if (result.liked) {
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = `❤️ <span class="like-count">${result.like_count}</span>`;
      } else {
        likeBtn.classList.remove('liked');
        likeBtn.innerHTML = `🤍 <span class="like-count">${result.like_count}</span>`;
      }
      
    } catch (error) {
      console.error('Like error:', error);
      showToast('Failed to like poem', 'error');
    }
  }
  
  // ✅ NEW: Show comments modal
  async function showCommentsModal(poemId, poemTitle) {
    const token = localStorage.getItem('rhymebox_token');
    if (!token) {
      showToast('Please login to view comments', 'error');
      return;
    }
    
    // Create modal
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay show';
    overlay.innerHTML = `
      <div class="confirm-modal" style="max-width: 600px;">
        <h3>${poemTitle || 'Comments'}</h3>
        <div id="commentsContainer" style="max-height: 400px; overflow-y: auto; margin: 20px 0;">
          <p style="text-align:center;color:var(--muted);">Loading comments...</p>
        </div>
        <form id="addCommentForm" style="display:flex;gap:8px;margin-top:16px;">
          <input type="text" id="commentInput" placeholder="Add a comment..." style="flex:1;padding:10px;border:1px solid var(--border);border-radius:8px;" required>
          <button type="submit" class="btn" style="padding:10px 20px;">Post</button>
        </form>
        <button class="confirm-btn cancel" style="margin-top:16px;">Close</button>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Load comments
    await loadComments(poemId);
    
    // Handle add comment
    overlay.querySelector('#addCommentForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = overlay.querySelector('#commentInput');
      const content = input.value.trim();
      
      if (!content) return;
      
      try {
        const response = await fetch(`/api/poems/${poemId}/comment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ content })
        });
        
        if (!response.ok) throw new Error('Failed to post comment');
        
        input.value = '';
        await loadComments(poemId);
        showToast('Comment posted!', 'success');
        
      } catch (error) {
        console.error('Comment error:', error);
        showToast('Failed to post comment', 'error');
      }
    });
    
    // Close modal
    overlay.querySelector('.cancel').addEventListener('click', () => {
      overlay.remove();
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }
  
  // ✅ NEW: Load comments
  async function loadComments(poemId) {
    const container = document.getElementById('commentsContainer');
    const token = localStorage.getItem('rhymebox_token');
    
    try {
      const response = await fetch(`/api/poems/${poemId}/comments`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!response.ok) throw new Error('Failed to load comments');
      
      const comments = await response.json();
      const stored = JSON.parse(localStorage.getItem('rhymebox_user') || 'null');
      const myUsername = stored?.username;
      
      if (comments.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px;">No comments yet. Be the first!</p>';
        return;
      }
      
      container.innerHTML = comments.map(c => {
        const isOwn = c.author.replace('@', '') === myUsername;
        const deleteBtn = isOwn ? `<button class="btn-delete-comment" data-id="${c.id}" style="background:transparent;border:none;color:#e53935;cursor:pointer;font-size:0.9rem;padding:4px;">Delete</button>` : '';
        
        return `
          <div class="comment-item" style="padding:12px;border-bottom:1px solid var(--border);">
            <div style="display:flex;gap:8px;align-items:start;">
              <img src="${c.author_image || '/frontend/src/assets/default_profile.png'}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />
              <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <strong style="color:var(--ink);">${c.author}</strong>
                  ${deleteBtn}
                </div>
                <p style="margin:4px 0;color:var(--muted);">${c.content}</p>
                <small style="color:var(--muted);font-size:0.8rem;">${new Date(c.created_at).toLocaleDateString()}</small>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      // Attach delete handlers
      container.querySelectorAll('.btn-delete-comment').forEach(btn => {
        btn.addEventListener('click', async function() {
          const commentId = this.dataset.id;
          
          if (!confirm('Delete this comment?')) return;
          
          try {
            const response = await fetch(`/api/poems/comments/${commentId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Failed to delete comment');
            
            await loadComments(poemId);
            showToast('Comment deleted', 'success');
            
          } catch (error) {
            console.error('Delete error:', error);
            showToast('Failed to delete comment', 'error');
          }
        });
      });
      
    } catch (error) {
      console.error('Load comments error:', error);
      container.innerHTML = '<p style="text-align:center;color:#e53935;">Failed to load comments</p>';
    }
  }
  
  // ✅ Toast notification
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
  
  // Render poems with like & comment buttons
  function renderPoems(poems) {
    const filteredPoems = filterPoems(poems);
    
    if (filteredPoems.length === 0) {
      if (selectedFilterTags.length > 0) {
        feed.innerHTML = '<p style="text-align:center;padding:40px 0;color:var(--muted);">No poems found with the selected tags. Try different filters!</p>';
      } else {
        feed.innerHTML = '<p style="text-align:center;padding:40px 0;color:var(--muted);">No poems yet. Be the first to share!</p>';
      }
      return;
    }
    
    feed.innerHTML = filteredPoems.map(p => {
      console.log('Rendering poem:', {
        id: p.id,
        title: p.title,
        author: p.author,
        user_id: p.user_id
      });
      
      const isAI = (p.title && p.title.startsWith('AI:')) || p.category === 'ai';
      const aiTag = isAI ? '<span style="background:var(--lavender);color:#fff;padding:3px 10px;border-radius:12px;font-size:0.75rem;margin-left:8px;font-weight:600;">AI</span>' : '';
      
      // Display tags with colors
      const tagsHTML = p.tags && p.tags.length > 0 
        ? `<div class="poem-tags-container">${p.tags.map(tag => `<span class="poem-tag ${tag.class}">${tag.name}</span>`).join('')}</div>`
        : '';
      
      // Clickable author name
      const authorDisplay = p.author || '@unknown';
      const authorUsername = authorDisplay.replace('@', '');
      const authorLink = authorDisplay !== '@unknown' 
        ? `<a href="/frontend/src/pages/user_profile.html?username=${authorUsername}" style="color:#666;text-decoration:none;transition:color 0.2s ease;" onmouseover="this.style.color='var(--lavender)'" onmouseout="this.style.color='#666'">— ${authorDisplay}</a>`
        : `<small>— ${authorDisplay}</small>`;
      
      // ✅ Like & Comment buttons with initial counts from database
      const likeCount = p.like_count || 0;
      const likeIcon = p.user_liked ? '❤️' : '🤍';
      
      const interactionButtons = `
        <div style="display:flex;gap:16px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
          <button class="btn-like ${p.user_liked ? 'liked' : ''}" data-id="${p.id}" style="background:transparent;border:none;color:var(--muted);cursor:pointer;display:flex;align-items:center;gap:4px;padding:4px 8px;border-radius:8px;transition:all 0.2s ease;">
            ${likeIcon} <span class="like-count">${likeCount}</span>
          </button>
          <button class="btn-comment" data-id="${p.id}" data-title="${p.title || 'Untitled'}" style="background:transparent;border:none;color:var(--muted);cursor:pointer;display:flex;align-items:center;gap:4px;padding:4px 8px;border-radius:8px;transition:all 0.2s ease;">
            💬 Comment
          </button>
        </div>
      `;
      
      return `
        <article class="poem-card">
          <h3>${p.title || 'Untitled'}${aiTag}</h3>
          <p>${p.content}</p>
          ${tagsHTML}
          <div style="display:flex;justify-content:space-between;color:#666;margin-top:12px;">
            <small>${authorLink}</small>
            <small>${new Date(p.created_at).toLocaleDateString()}</small>
          </div>
          ${interactionButtons}
        </article>
      `;
    }).join('');
    
    // ✅ Attach like button handlers
    document.querySelectorAll('.btn-like').forEach(btn => {
      btn.addEventListener('click', function() {
        const poemId = this.dataset.id;
        likePoem(poemId, this);
      });
    });
    
    // ✅ Attach comment button handlers
    document.querySelectorAll('.btn-comment').forEach(btn => {
      btn.addEventListener('click', function() {
        const poemId = this.dataset.id;
        const title = this.dataset.title;
        showCommentsModal(poemId, title);
      });
    });
  }
  
  // Initial load
  if (!feed) {
    console.error('Feed element not found!');
    return;
  }
  
  feed.innerHTML = '<p style="text-align:center;padding:40px 0;color:var(--muted);">Loading poems...</p>';
  
  try {
    // ✅ Fetch poems
    let poems;
    if (window.DataPrefetch && window.DataPrefetch.cache.feed) {
      console.log('⚡ Using prefetched feed data');
      poems = window.DataPrefetch.cache.feed;
    } else {
      console.log('📥 Fetching fresh feed data');
      const response = await fetch('/api/poems/');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      poems = await response.json();
      
      // ✅ Debug: Log first poem to verify author field
      if (poems.length > 0) {
        console.log('📋 Sample poem from backend:', poems[0]);
        console.log('   Author field:', poems[0].author);
      }
      
      // Cache the result
      if (window.DataPrefetch) {
        window.DataPrefetch.cache.feed = poems;
        window.DataPrefetch.cache.lastFetch.feed = Date.now();
      }
    }
    
    // ✅ Load like counts for all poems
    await loadLikeCounts(poems);
    
    allPoems = poems;
    renderPoems(allPoems);
    
    // Add filter button handler
    const filterBtn = document.getElementById('filterByTagsBtn');
    if (filterBtn) {
      filterBtn.addEventListener('click', showTagFilterModal);
    }
    
  } catch (err) {
    console.error('❌ Failed to load poems:', err);
    feed.innerHTML = `
      <div style="text-align:center;padding:40px 0;">
        <p style="color:#e53935;margin-bottom:12px;">⚠️ Failed to load poems</p>
        <p style="color:var(--muted);font-size:0.9rem;">${err.message}</p>
      </div>
    `;
  }
});
