window.TagSystem = {
  categories: {
    'Themes': { class: 'tag-themes', tags: ['Love', 'Nature', 'Death', 'Time', 'Dreams', 'War', 'Peace', 'Freedom', 'Faith', 'Betrayal', 'Loneliness', 'Friendship', 'Courage', 'Hope', 'Memory'] },
    'Emotions': { class: 'tag-emotions', tags: ['Joy', 'Sadness', 'Anger', 'Fear', 'Melancholy', 'Serenity', 'Passion', 'Nostalgia', 'Anxiety', 'Longing', 'Pride', 'Compassion'] },
    'Forms': { class: 'tag-forms', tags: ['Sonnet', 'Haiku', 'Free Verse', 'Limerick', 'Ode', 'Elegy', 'Epic', 'Ballad', 'Villanelle', 'Tanka', 'Acrostic'] },
    'Style': { class: 'tag-style', tags: ['Imagist', 'Symbolist', 'Realist', 'Surrealist', 'Romantic', 'Modernist', 'Postmodern', 'Metaphysical', 'Abstract', 'Minimalist'] },
    'Context': { class: 'tag-context', tags: ['Urban', 'Rural', 'Cosmic', 'Mythological', 'Historical', 'Futuristic', 'Fantasy', 'Dreamscape', 'Spiritual', 'Night', 'Dawn'] },
    'AI': { class: 'tag-ai', tags: ['AI Generated', 'Tech-inspired', 'Digital Poetry', 'Algorithm', 'Neural Networks'] }
  },

  createSelector(currentTags = []) {
    const overlay = document.createElement('div');
    overlay.className = 'tag-selector-overlay';
    let html = '<div class="tag-selector-modal"><h3>Select Tags</h3>';
    
    for (const [name, data] of Object.entries(this.categories)) {
      html += `<div class="tag-category"><h4>${name}</h4><div class="tag-options">`;
      html += data.tags.map(tag => {
        const selected = currentTags.find(t => t.name === tag) ? 'selected' : '';
        return `<span class="tag-option ${data.class} ${selected}" data-tag="${tag}" data-class="${data.class}">${tag}</span>`;
      }).join('');
      html += '</div></div>';
    }
    
    html += '<div class="tag-selector-actions"><button class="confirm-btn cancel">Cancel</button><button class="confirm-btn" style="background:var(--accent-gradient);color:#222;">Done</button></div></div>';
    overlay.innerHTML = html;
    return overlay;
  },

  attachHandlers(overlay, onDone) {
    const selectedTags = [];
    overlay.querySelectorAll('.tag-option').forEach(opt => {
      if (opt.classList.contains('selected')) {
        selectedTags.push({ name: opt.dataset.tag, class: opt.dataset.class });
      }
      opt.onclick = function() {
        this.classList.toggle('selected');
        const idx = selectedTags.findIndex(t => t.name === this.dataset.tag);
        if (idx >= 0) selectedTags.splice(idx, 1);
        else selectedTags.push({ name: this.dataset.tag, class: this.dataset.class });
      };
    });
    overlay.querySelector('.confirm-btn:not(.cancel)').onclick = () => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
      onDone(selectedTags);
    };
    overlay.querySelector('.cancel').onclick = () => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    };
  }
};
