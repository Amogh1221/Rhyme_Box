document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('aiForm');
  const outWrap = document.getElementById('aiResult');
  const output = document.getElementById('aiOutput');
  const titleInput = document.getElementById('generatedTitle');
  const saveBtn = document.getElementById('saveAiPoem');
  const themeInput = document.getElementById('theme');
  const loadingScreen = document.getElementById('loadingScreen');

  // ✅ FIX: Use correct image path and force reload
  const loadingImages = [
    '/frontend/src/assets/loading-screen-1.jpg',
    '/frontend/src/assets/loading-screen-2.jpg',
    '/frontend/src/assets/loading-screen-3.jpg',
    '/frontend/src/assets/loading-screen-4.jpg'
  ];
  
  let currentImageIndex = 0;
  let imageRotationInterval = null;

  // ✅ Shuffle images every 4 seconds
  function startImageRotation() {
    const loadingImg = loadingScreen.querySelector('img');
    if (!loadingImg) return;
    
    // ✅ Force reload by adding cache-busting timestamp
    currentImageIndex = Math.floor(Math.random() * loadingImages.length);
    loadingImg.src = loadingImages[currentImageIndex] + '?v=' + Date.now();
    
    // Rotate every 4 seconds
    imageRotationInterval = setInterval(() => {
      // Get next index (different from current)
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * loadingImages.length);
      } while (nextIndex === currentImageIndex && loadingImages.length > 1);
      
      currentImageIndex = nextIndex;
      
      // Fade out
      loadingImg.style.opacity = '0';
      
      // Change image and fade in
      setTimeout(() => {
        loadingImg.src = loadingImages[currentImageIndex] + '?v=' + Date.now();
        loadingImg.style.opacity = '1';
      }, 300);
    }, 4000);
  }
  
  function stopImageRotation() {
    if (imageRotationInterval) {
      clearInterval(imageRotationInterval);
      imageRotationInterval = null;
    }
  }

  // Create toast notification element
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const theme = themeInput.value.trim();
    if(!theme){ 
      showToast('Please enter a theme', 'error');
      return;
    }

    // ✅ Show inline loading screen (not fullscreen)
    loadingScreen.style.display = 'flex';
    outWrap.style.display = 'none';
    startImageRotation(); // ✅ Start image rotation

    try {
      // Call backend API to generate poem using RAG
      const response = await fetch('/api/poems/generate_ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: theme })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate poem');
      }

      const data = await response.json();
      
      // ✅ Stop image rotation
      stopImageRotation();
      
      // Hide loading screen and show generated poem
      loadingScreen.style.display = 'none';
      outWrap.style.display = 'block';
      
      // Populate title and content
      titleInput.value = data.title;
      output.textContent = data.poem;

      // Enable save button - Use the title from input field (editable)
      saveBtn.onclick = function(){
        // Get current user from localStorage
        const stored = JSON.parse(localStorage.getItem('rhymebox_user') || 'null');
        const username = stored ? stored.username : 'guest';
        
        // Get the title from the input field (user can edit it)
        const finalTitle = titleInput.value.trim() || data.title || 'Untitled';
        
        const poem = { 
          id: Date.now(), 
          title: finalTitle,  // Use the edited title from input
          content: data.poem, 
          author: username,
          is_public: true,
          showOnProfile: true,
          category: 'ai', // Mark as AI-generated
          created_at: new Date().toISOString() 
        };
        window.RhymeBox.savePoem(poem);
        showToast(`✨ "${finalTitle}" saved! Check your profile to see it.`, 'success');
      };

    } catch (error) {
      // ✅ Stop image rotation
      stopImageRotation();
      
      // Hide loading screen and show error
      loadingScreen.style.display = 'none';
      outWrap.style.display = 'block';
      titleInput.value = 'Error';
      output.textContent = `❌ Error: ${error.message}\n\nPlease make sure:\n1. The backend is running\n2. The RAG database is set up\n3. Your OpenRouter API key is configured`;
      console.error('AI generation error:', error);
    }
  });
});
