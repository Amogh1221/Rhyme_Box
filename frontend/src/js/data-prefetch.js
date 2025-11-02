/**
 * Background data prefetching system for Rhyme Box
 * 
 * Purpose: Prefetch common API data in the background to improve page load times
 * 
 * Features:
 * - Caches feed, friends list, and friend requests
 * - Runs after login/signup
 * - Auto-invalidates stale data (5 minutes TTL)
 * - Non-blocking: failures don't affect user experience
 */

(function() {
  'use strict';
  
  console.log('📦 Data prefetch module loaded');
  
  // Cache storage with timestamps
  const cache = {
    feed: null,
    friends: null,
    requests: null,
    lastFetch: {
      feed: 0,
      friends: 0,
      requests: 0
    }
  };
  
  // Cache validity: 5 minutes
  const CACHE_TTL = 5 * 60 * 1000;
  
  /**
   * Check if cached data is still valid
   */
  function isCacheValid(key) {
    return cache[key] && (Date.now() - cache.lastFetch[key] < CACHE_TTL);
  }
  
  /**
   * Invalidate specific cache entry
   */
  function invalidate(key) {
    console.log(`🗑️ Invalidating cache: ${key}`);
    cache[key] = null;
    cache.lastFetch[key] = 0;
  }
  
  /**
   * Prefetch feed data (public poems)
   */
  async function prefetchFeed() {
    if (isCacheValid('feed')) {
      console.log('⚡ Feed cache still valid, skipping prefetch');
      return;
    }
    
    try {
      console.log('📥 Prefetching feed data...');
      const response = await fetch('/api/poems/');
      
      if (!response.ok) {
        throw new Error(`Feed prefetch failed: ${response.status}`);
      }
      
      cache.feed = await response.json();
      cache.lastFetch.feed = Date.now();
      console.log(`✅ Feed prefetched: ${cache.feed.length} poems`);
      
    } catch (error) {
      console.warn('⚠️ Feed prefetch failed (non-critical):', error.message);
    }
  }
  
  /**
   * Prefetch friends list (requires authentication)
   */
  async function prefetchFriends() {
    const token = localStorage.getItem('rhymebox_token');
    if (!token) return;
    
    if (isCacheValid('friends')) {
      console.log('⚡ Friends cache still valid, skipping prefetch');
      return;
    }
    
    try {
      console.log('📥 Prefetching friends list...');
      const response = await fetch('/api/friends/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Friends prefetch failed: ${response.status}`);
      }
      
      cache.friends = await response.json();
      cache.lastFetch.friends = Date.now();
      console.log(`✅ Friends prefetched: ${cache.friends.length} friends`);
      
    } catch (error) {
      console.warn('⚠️ Friends prefetch failed (non-critical):', error.message);
    }
  }
  
  /**
   * Prefetch friend requests (requires authentication)
   */
  async function prefetchRequests() {
    const token = localStorage.getItem('rhymebox_token');
    if (!token) return;
    
    if (isCacheValid('requests')) {
      console.log('⚡ Requests cache still valid, skipping prefetch');
      return;
    }
    
    try {
      console.log('📥 Prefetching friend requests...');
      const response = await fetch('/api/friends/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Requests prefetch failed: ${response.status}`);
      }
      
      cache.requests = await response.json();
      cache.lastFetch.requests = Date.now();
      console.log(`✅ Requests prefetched: ${cache.requests.length} requests`);
      
    } catch (error) {
      console.warn('⚠️ Requests prefetch failed (non-critical):', error.message);
    }
  }
  
  /**
   * Prefetch all data in parallel (non-blocking)
   */
  async function prefetchAll() {
    console.log('🚀 Starting background data prefetch...');
    
    // Run all prefetch operations in parallel
    await Promise.allSettled([
      prefetchFeed(),
      prefetchFriends(),
      prefetchRequests()
    ]);
    
    console.log('✅ Background prefetch complete');
  }
  
  // Export public API
  window.DataPrefetch = {
    cache,
    prefetchAll,
    prefetchFeed,
    prefetchFriends,
    prefetchRequests,
    invalidate,
    isCacheValid
  };
  
  // Auto-prefetch on page load if user is logged in
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const token = localStorage.getItem('rhymebox_token');
      if (token) {
        // Delay prefetch by 500ms to not block initial page render
        setTimeout(prefetchAll, 500);
      }
    });
  }
  
})();
