document.addEventListener('DOMContentLoaded', function(){
  const list = document.getElementById('myPoemsList');
  let currentEditingPoemId = null;
  
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
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      
      const modal = document.createElement('div');
      modal.className = 'confirm-modal';
      
      modal.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="confirm-actions">
          <button class="confirm-btn cancel">Cancel</button>
          <button class="confirm-btn confirm">Delete Permanently</button>
        </div>
      `;
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      setTimeout(() => overlay.classList.add('show'), 10);
      
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
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(false);
        }
      });
      
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
  
  // Create edit modal
  function createEditModal() {
    const modal = document.createElement('div');
    modal.className = 'confirm-overlay';
    modal.id = 'editPoemModal';
    modal.innerHTML = `
      <div class="confirm-modal" style="max-width: 600px;">
        <h3>Edit Poem</h3>
        <form id="editPoemForm">
          <label for="editPoemTitle" style="display: block; margin: 16px 0 8px; color: var(--ink); font-weight: 600;">Title</label>
          <input type="text" id="editPoemTitle" style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 1rem;" required>
          
          <label for="editPoemContent" style="display: block; margin: 16px 0 8px; color: var(--ink); font-weight: 600;">Content</label>
          <textarea id="editPoemContent" style="width: 100%; min-height: 300px; padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 1rem; font-family: 'Merriweather', serif; line-height: 1.8; resize: vertical;" required></textarea>
          
          <div class="confirm-actions" style="margin-top: 24px;">
            <button type="button" class="confirm-btn cancel">Cancel</button>
            <button type="submit" class="confirm-btn" style="background: var(--accent-gradient); color: #222;">Save Changes</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  // Show edit modal
  function showEditModal(poemId) {
    const poem = window.RhymeBox.poems.find(p => p.id === poemId);
    if (!poem) return;

    let modal = document.getElementById('editPoemModal');
    if (!modal) {
      modal = createEditModal();
    }

    const form = modal.querySelector('#editPoemForm');
    const titleInput = modal.querySelector('#editPoemTitle');
    const contentInput = modal.querySelector('#editPoemContent');
    const cancelBtn = modal.querySelector('.cancel');

    // Populate form with current poem data
    titleInput.value = poem.title;
    contentInput.value = poem.content;

    // Show modal
    modal.classList.add('show');

    // ✅ Handle form submission - save to BOTH localStorage AND backend
    const submitHandler = async function(e) {
      e.preventDefault();
      
      const newTitle = titleInput.value.trim();
      const newContent = contentInput.value.trim();
      
      if (!newTitle || !newContent) {
        showToast('❌ Title and content are required', 'error');
        return;
      }
      
      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
      
      try {
        // ✅ Update poem in backend first
        const token = localStorage.getItem('rhymebox_token');
        if (token) {
          const response = await fetch(`/api/poems/${poem.id}/update`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: newTitle,
              content: newContent,
              is_public: poem.is_public !== false
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to update poem in database');
          }
          
          console.log('✅ Poem updated in backend database');
        }
        
        // ✅ Update localStorage after backend succeeds
        poem.title = newTitle;
        poem.content = newContent;
        poem.updated_at = new Date().toISOString();
        
        localStorage.setItem('rhymebox_poems', JSON.stringify(window.RhymeBox.poems));
        
        showToast('✨ Poem updated successfully!', 'success');
        
        // Close modal and refresh
        modal.classList.remove('show');
        form.removeEventListener('submit', submitHandler);
        renderPoems();
        
      } catch (error) {
        console.error('❌ Update error:', error);
        showToast(`❌ ${error.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    };

    form.addEventListener('submit', submitHandler);

    // Handle cancel
    const cancelHandler = function() {
      modal.classList.remove('show');
      form.removeEventListener('submit', submitHandler);
      cancelBtn.removeEventListener('click', cancelHandler);
    };
    cancelBtn.addEventListener('click', cancelHandler);

    // Close on overlay click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('show');
        form.removeEventListener('submit', submitHandler);
      }
    });

    // Close on ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.classList.remove('show');
        form.removeEventListener('submit', submitHandler);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }
  
  // ✅ UPDATED: New 6-category tag system (matching write.js)
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
  
  // Create tag selector modal
  function createTagSelector() {
    const overlay = document.createElement('div');
    overlay.className = 'tag-selector-overlay';
    overlay.id = 'tagSelectorOverlay';
    
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
        <h3>Select Tags for Your Poem</h3>
        <p style="text-align:center;color:var(--muted);margin-bottom:20px;">Choose tags that best describe your poem</p>
        ${categoriesHTML}
        <div class="tag-selector-actions">
          <button class="confirm-btn cancel">Cancel</button>
          <button class="confirm-btn" style="background: var(--accent-gradient); color: #222;">Done</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    return overlay;
  }

  // Show tag selector for editing
  function showTagSelectorForPoem(poemId) {
    currentEditingPoemId = poemId;
    const poem = window.RhymeBox.poems.find(p => p.id === poemId);
    if (!poem) return;

    let overlay = document.getElementById('tagSelectorOverlay');
    if (!overlay) {
      overlay = createTagSelector();
    }

    // Mark already selected tags
    overlay.querySelectorAll('.tag-option').forEach(option => {
      const isSelected = poem.tags && poem.tags.find(t => t.name === option.dataset.tag);
      if (isSelected) {
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
          if (poem.tags) {
            poem.tags = poem.tags.filter(t => t.name !== tagName);
          }
        } else {
          // Select
          this.classList.add('selected');
          if (!poem.tags) poem.tags = [];
          poem.tags.push({ name: tagName, class: tagClass });
        }
      };
    });

    // Handle done button
    overlay.querySelector('.confirm-btn:not(.cancel)').onclick = () => {
      // Save tags to poem
      localStorage.setItem('rhymebox_poems', JSON.stringify(window.RhymeBox.poems));
      showToast('✨ Tags updated successfully!', 'success');
      overlay.classList.remove('show');
      currentEditingPoemId = null;
      renderPoems();
    };

    // Handle cancel button
    overlay.querySelector('.confirm-btn.cancel').onclick = () => {
      overlay.classList.remove('show');
      currentEditingPoemId = null;
      // Reload poem to discard changes
      renderPoems();
    };

    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('show');
        currentEditingPoemId = null;
      }
    };
  }
  
  function renderPoems() {
    const poems = window.RhymeBox.poems || [];
    const stored = JSON.parse(localStorage.getItem('rhymebox_user') || 'null');
    const username = stored ? stored.username : 'guest';
    
    // Filter poems by current user (show all, not just profile ones)
    const userPoems = poems.filter(p => 
      p.author === username || 
      p.author === '@' + username ||
      (p.author && p.author.replace('@', '') === username)
    );
    
    if(!userPoems.length){ 
      list.innerHTML = '<p style="text-align:center;padding:40px 0;color:var(--muted);">No poems yet.</p>'; 
      return; 
    }
    
    list.innerHTML = userPoems.map(p => {
      const date = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const isOnProfile = p.showOnProfile !== false;
      const visibility = isOnProfile 
        ? (p.is_public ? '🌐 Public' : '🔒 Private')
        : '';
      
      const isAI = (p.title && p.title.startsWith('AI:')) || p.category === 'ai';
      const aiTag = isAI ? '<span style="background:var(--lavender);color:#fff;padding:3px 10px;border-radius:12px;font-size:0.75rem;margin-left:8px;font-weight:600;">AI</span>' : '';
      
      // Display tags
      const tagsHTML = p.tags && p.tags.length > 0 
        ? `<div class="poem-tags-container">${p.tags.map(tag => `<span class="poem-tag ${tag.class}">${tag.name}</span>`).join('')}</div>`
        : '';
      
      // Can only edit tags on non-AI poems
      const tagButton = !isAI && isOnProfile
        ? `<button class="btn-edit-tags" data-id="${p.id}" style="background:transparent;border:none;color:var(--lavender);cursor:pointer;font-size:1.1rem;padding:4px 8px;transition:all .2s ease;" title="Edit tags">🏷️</button>`
        : '';
      
      const actionButtons = isOnProfile 
        ? `
          ${tagButton}
          <button class="btn-edit" data-id="${p.id}" style="background:transparent;border:none;color:var(--lavender);cursor:pointer;font-size:1.2rem;padding:4px 8px;transition:all .2s ease;" title="Edit poem">✏️</button>
          <button class="btn-delete" data-id="${p.id}" style="background:transparent;border:none;color:#e53935;cursor:pointer;font-size:1.2rem;padding:4px 8px;transition:all .2s ease;" title="Delete poem permanently">🗑️</button>
        `
        : `<button class="btn-add-profile" data-id="${p.id}" style="background:var(--accent-gradient);border:none;color:#222;cursor:pointer;font-size:0.85rem;padding:6px 12px;border-radius:6px;font-weight:600;transition:all .2s ease;" title="Add to profile">➕ Add to Profile</button>`;
      
      return `
        <div class="poem-card">
          <div>
            <h3>${p.title}${aiTag}</h3>
            <p>${p.content}</p>
            ${tagsHTML}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
            <small style="color:var(--muted);">${date}</small>
            <div style="display:flex;gap:8px;align-items:center;">
              ${visibility ? `<small style="color:var(--muted);font-size:0.8rem;">${visibility}</small>` : ''}
              ${actionButtons}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Attach edit tags handlers
    document.querySelectorAll('.btn-edit-tags').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        showTagSelectorForPoem(id);
      });
    });
    
    // Attach edit handlers
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        showEditModal(id);
      });
    });
    
    // Attach delete handlers - this PERMANENTLY deletes
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = parseInt(this.dataset.id);
        
        const confirmed = await showConfirm(
          'Delete Poem?',
          'Are you sure you want to permanently delete this poem? This action cannot be undone.'
        );
        
        if(confirmed) {
          // Permanently delete the poem
          window.RhymeBox.poems = window.RhymeBox.poems.filter(p => p.id !== id);
          localStorage.setItem('rhymebox_poems', JSON.stringify(window.RhymeBox.poems));
          showToast('Poem deleted permanently', 'success');
          renderPoems();
        }
      });
    });
    
    // Attach "Add to Profile" handlers
    document.querySelectorAll('.btn-add-profile').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        
        // Find the poem and set showOnProfile to true
        const poem = window.RhymeBox.poems.find(p => p.id === id);
        if (poem) {
          poem.showOnProfile = true;
          localStorage.setItem('rhymebox_poems', JSON.stringify(window.RhymeBox.poems));
          showToast('✨ Poem added to your profile!', 'success');
          renderPoems();
        }
      });
    });
  }
  
  renderPoems();
});
