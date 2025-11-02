// Shared UI components and utilities
window.UIComponents = {
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  showConfirm(title, message) {
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
      
      const cleanup = () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 200);
      };
      
      modal.querySelector('.cancel').onclick = () => { cleanup(); resolve(false); };
      modal.querySelector('.confirm').onclick = () => { cleanup(); resolve(true); };
      overlay.onclick = (e) => { if (e.target === overlay) { cleanup(); resolve(false); } };
    });
  },

  createEditModal(poem) {
    const modal = document.createElement('div');
    modal.className = 'confirm-overlay';
    modal.innerHTML = `
      <div class="confirm-modal" style="max-width: 600px;">
        <h3>Edit Poem</h3>
        <form id="editPoemForm">
          <label>Title</label>
          <input type="text" id="editPoemTitle" value="${poem.title}" required style="width:100%;padding:12px;border:1px solid var(--border);border-radius:8px;font-size:1rem;margin-bottom:16px;">
          <label>Content</label>
          <textarea id="editPoemContent" style="width:100%;min-height:300px;padding:12px;border:1px solid var(--border);border-radius:8px;font-size:1rem;font-family:'Merriweather',serif;line-height:1.8;resize:vertical;" required>${poem.content}</textarea>
          <div class="confirm-actions" style="margin-top:24px;">
            <button type="button" class="confirm-btn cancel">Cancel</button>
            <button type="submit" class="confirm-btn" style="background:var(--accent-gradient);color:#222;">Save</button>
          </div>
        </form>
      </div>
    `;
    return modal;
  }
};
