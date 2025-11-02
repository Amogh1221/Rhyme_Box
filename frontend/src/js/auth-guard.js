/**
 * Authentication Guard for Protected Pages
 * 
 * Purpose: Redirect unauthenticated users to login page
 * 
 * Usage: Include this script BEFORE other page scripts on protected pages
 * Example: <script src="/frontend/src/js/auth-guard.js"></script>
 * 
 * Protected pages: profile, my_poems, write, friends, settings
 */

(function() {
  'use strict';
  
  console.log('🔒 Auth guard: Checking authentication...');
  
  // Check if user is authenticated
  const token = localStorage.getItem('rhymebox_token');
  const user = JSON.parse(localStorage.getItem('rhymebox_user') || 'null');
  
  if (!token || !user) {
    console.warn('⚠️ No authentication found, redirecting to login');
    
    // Save intended destination
    sessionStorage.setItem('intended_page', window.location.pathname);
    
    // Redirect to login page
    window.location.href = '/frontend/src/pages/login.html';
    
    // Stop script execution
    throw new Error('Authentication required');
  }
  
  console.log(`✅ Auth guard: User ${user.username} authenticated`);
  
})();
