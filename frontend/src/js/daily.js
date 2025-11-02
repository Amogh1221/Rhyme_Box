document.addEventListener('DOMContentLoaded', async function(){
  const themeEl = document.getElementById('dailyTheme');
  const poemEl = document.getElementById('dailyPoemText');
  
  // Show loading state
  themeEl.textContent = 'Loading today\'s theme...';
  poemEl.textContent = 'Loading poem of the day...';
  
  try {
    // Fetch today's poem from backend
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const response = await fetch(`/api/daily/${today}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch daily poem');
    }
    
    const data = await response.json();
    
    // Display the poem
    themeEl.textContent = `Theme: ${data.theme}`;
    poemEl.innerHTML = `<strong>${data.title}</strong>\n\n${data.content}`;
    
  } catch (error) {
    console.error('Error loading daily poem:', error);
    
    // Fallback to client-side generation
    const fallbackThemes = {
      0: 'New Beginnings and Fresh Starts',
      1: 'Winter\'s Embrace',
      2: 'Resolution and Determination',
      // ... add more fallbacks if needed
    };
    
    const dayOfMonth = new Date().getDate();
    const theme = fallbackThemes[dayOfMonth % Object.keys(fallbackThemes).length] || 'Daily Reflection';
    
    themeEl.textContent = `Theme: ${theme}`;
    poemEl.textContent = 'Unable to generate poem. Please check back later.';
  }
});
