document.addEventListener('DOMContentLoaded', async function(){
    const feed = document.getElementById('feed');
    
    if (!feed) {
        console.error('Feed element not found!');
        return;
    }
    
    // Show loading state
    feed.innerHTML = '<p style="text-align:center;padding:40px 0;color:var(--muted);">Loading poems...</p>';
    
    try {
      console.log('Fetching poems...');
      
      // ✅ Try to get cached data first
      let poems;
      if (window.DataPrefetch && window.DataPrefetch.cache.feed) {
        console.log('⚡ Using prefetched feed data');
        poems = window.DataPrefetch.cache.feed;
      } else {
        console.log('📥 Fetching fresh feed data');
        const response = await fetch('/api/poems/');
        
        if(!response.ok){ 
          throw new Error(`HTTP ${response.status}: ${response.statusText}`); 
        }
        
        poems = await response.json();
        
        // ✅ Debug first poem
        if (poems.length > 0) {
          console.log('📋 Sample poem:', poems[0]);
          console.log('   Author:', poems[0].author);
        }
        
        // Cache the result
        if (window.DataPrefetch) {
          window.DataPrefetch.cache.feed = poems;
          window.DataPrefetch.cache.lastFetch.feed = Date.now();
        }
      }
      
      console.log('Received poems:', poems.length);
      
      if(!poems.length){ 
        feed.innerHTML = '<p style="text-align:center;padding:40px 0;color:var(--muted);">No poems yet. Be the first to share!</p>'; 
        return; 
      }
      
      feed.innerHTML = poems.map(p => {
          // Debug each poem
          console.log('Rendering:', p.title, 'by', p.author);
          
          // Check if poem is AI-generated
          const isAI = (p.title && p.title.startsWith('AI:')) || p.category === 'ai';
          const aiTag = isAI ? '<span style="background:var(--lavender);color:#fff;padding:3px 10px;border-radius:12px;font-size:0.75rem;margin-left:8px;font-weight:600;">AI</span>' : '';
          
          // ✅ Use author directly from backend and make it clickable
          const authorDisplay = p.author || '@unknown';
          const authorUsername = authorDisplay.replace('@', '');
          
          // ✅ Make author name clickable (link to user profile)
          const authorLink = authorDisplay !== '@unknown' 
            ? `<a href="/frontend/src/pages/user_profile.html?username=${authorUsername}" style="color:#666;text-decoration:none;transition:color 0.2s ease;" onmouseover="this.style.color='var(--lavender)'" onmouseout="this.style.color='#666'">— ${authorDisplay}</a>`
            : `<small>— ${authorDisplay}</small>`;
          
          return `
              <article class="poem-card">
                  <h3>${p.title || 'Untitled'}${aiTag}</h3>
                  <p>${p.content}</p>
                  <div style="display:flex;justify-content:space-between;color:#666">
                    <small>${authorLink}</small>
                    <small>${new Date(p.created_at).toLocaleDateString()}</small>
                  </div>
              </article>
          `;
      }).join('');
      
      console.log('✅ Feed rendered successfully');
      
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
