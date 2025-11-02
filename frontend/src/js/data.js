// Mock data store for the static prototype
window.RhymeBox = window.RhymeBox || {};
const RB = window.RhymeBox;

RB.poems = RB.poems || [];

RB.savePoem = async function(poem) {
    // Add showOnProfile flag by default
    if (poem.showOnProfile === undefined) {
      poem.showOnProfile = true;
    }
    
    // ✅ CRITICAL: Save to backend FIRST, then localStorage
    try {
        const token = localStorage.getItem('rhymebox_token');
        
        if (!token) {
            console.error('❌ No authentication token found. Please login first.');
            throw new Error('Please login to save poems');
        }
        
        console.log('📤 Saving poem to backend:', {
            title: poem.title,
            content: poem.content.substring(0, 50) + '...',
            is_public: poem.is_public,
            category: poem.category
        });
        
        const response = await fetch('/api/poems/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  // ✅ Add auth header
            },
            body: JSON.stringify({
                title: poem.title,
                content: poem.content,
                is_public: poem.is_public !== false,  // Default to true
                category: poem.category || (poem.title && poem.title.startsWith('AI:') ? 'ai' : 'manual')
            }),
        });
        
        console.log('📥 Backend response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend error:', errorText);
            throw new Error(`Failed to save poem to backend: ${response.status}`);
        }
        
        const savedPoem = await response.json();
        console.log('✅ Poem saved to backend with ID:', savedPoem.id);
        
        // Update poem with backend ID
        poem.id = savedPoem.id;
        poem.created_at = savedPoem.created_at;
        
    } catch (error) {
        console.error('❌ Failed to save poem to backend:', error);
        // Show error to user
        alert(`Failed to save poem: ${error.message}`);
        throw error;  // Don't continue if backend save fails
    }
    
    // ✅ Only save to localStorage after backend succeeds
    RB.poems.unshift(poem);
    localStorage.setItem('rhymebox_poems', JSON.stringify(RB.poems));
    console.log('✅ Poem also saved to localStorage');
}

RB.loadLocal = function(){ 
    const stored = JSON.parse(localStorage.getItem('rhymebox_poems')||'null'); 
    if(stored) RB.poems = stored; 
}

RB.loadLocal();
