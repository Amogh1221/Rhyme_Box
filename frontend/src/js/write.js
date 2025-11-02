document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('writeForm');
  let selectedTags = [];
  
  // Create toast notification element
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
  
  // ✅ UPDATED: New tag categories
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
  
  // Show tag selector
  function showTagSelector() {
    let overlay = document.getElementById('tagSelectorOverlay');
    if (!overlay) {
      overlay = createTagSelector();
    }
    
    // Mark already selected tags
    overlay.querySelectorAll('.tag-option').forEach(option => {
      if (selectedTags.find(t => t.name === option.dataset.tag)) {
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
          selectedTags = selectedTags.filter(t => t.name !== tagName);
        } else {
          // Select
          this.classList.add('selected');
          selectedTags.push({ name: tagName, class: tagClass });
        }
        
        updateTagsDisplay();
      };
    });
    
    // Handle done button
    overlay.querySelector('.confirm-btn:not(.cancel)').onclick = () => {
      overlay.classList.remove('show');
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
  
  // Update tags display
  function updateTagsDisplay() {
    const container = document.getElementById('selectedTagsDisplay');
    if (!container) return;
    
    if (selectedTags.length === 0) {
      container.innerHTML = '<p style="color:var(--muted);font-size:0.9rem;">No tags selected yet</p>';
    } else {
      container.innerHTML = selectedTags.map(tag => 
        `<span class="poem-tag ${tag.class}">${tag.name}</span>`
      ).join('');
    }
  }
  
  // Add tag button and display to form
  const tagSection = document.createElement('div');
  tagSection.style.marginTop = '24px';
  tagSection.innerHTML = `
    <label style="margin-bottom: 12px;">Tags</label>
    <button type="button" id="selectTagsBtn" class="btn secondary" style="width: auto; margin-bottom: 12px;">
      🏷️ Select Tags
    </button>
    <div id="selectedTagsDisplay" class="poem-tags-container"></div>
  `;
  form.insertBefore(tagSection, form.querySelector('div[style*="display: flex"]'));
  
  document.getElementById('selectTagsBtn').onclick = showTagSelector;
  updateTagsDisplay();
  
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('poem').value.trim();
    const is_public = document.getElementById('is_public').checked;
    
    if(!title||!content){ 
      showToast('Please add title and poem', 'error');
      return;
    }
    
    const stored = JSON.parse(localStorage.getItem('rhymebox_user') || 'null');
    const username = stored ? stored.username : 'guest';
    
    const poem = { 
      id: Date.now(), 
      title, 
      content, 
      author: username, 
      is_public,
      showOnProfile: true,
      tags: selectedTags,
      created_at: new Date().toISOString() 
    };
    
    // ✅ Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    window.RhymeBox.savePoem(poem)
      .then(() => {
        showToast('✨ Poem saved successfully!', 'success');
        form.reset();
        selectedTags = [];
        updateTagsDisplay();
      })
      .catch((error) => {
        showToast(`❌ ${error.message}`, 'error');
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
  });
});
