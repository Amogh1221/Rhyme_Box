(function() {
  console.log('💬 chat.js loaded');
  
  let currentChatUser = null;
  let chatModal = null;
  let messageCheckInterval = null;
  
  // Create chat modal
  function createChatModal() {
    console.log('📦 Creating chat modal');
    const modal = document.createElement('div');
    modal.id = 'chatModal';
    modal.className = 'chat-modal';
    modal.innerHTML = `
      <div class="chat-container">
        <div class="chat-header">
          <div class="chat-user-info">
            <img id="chatUserAvatar" src="/frontend/src/assets/default_profile.png" alt="" class="chat-avatar">
            <span id="chatUsername">Chat</span>
          </div>
          <button class="chat-close" id="closeChatBtn">✕</button>
        </div>
        
        <div class="chat-messages" id="chatMessages">
          <div class="chat-loading">Loading messages...</div>
        </div>
        
        <div class="chat-input-area">
          <textarea id="chatInput" placeholder="Type a message..." rows="1"></textarea>
          <button id="sendMessageBtn" class="btn">Send</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    console.log('✅ Chat modal created and appended to body');
    return modal;
  }
  
  // Open chat with a friend
  window.openChat = async function(username, profilePicUrl) {
    console.log(`💬 openChat called with username: ${username}`);
    console.log(`   Profile pic URL: ${profilePicUrl}`);
    
    // Create modal if doesn't exist
    if (!chatModal) {
      console.log('   Creating new chat modal...');
      chatModal = createChatModal();
      attachChatEventListeners();
    }
    
    currentChatUser = username;
    
    // Update UI
    document.getElementById('chatUsername').textContent = `@${username}`;
    document.getElementById('chatUserAvatar').src = profilePicUrl || '/frontend/src/assets/default_profile.png';
    
    console.log('   Showing modal...');
    // Show modal
    chatModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Load messages
    await loadMessages();
    
    // Start polling for new messages
    startMessagePolling();
    
    console.log('✅ Chat opened successfully');
  };
  
  // Close chat
  function closeChat() {
    console.log('❌ Closing chat');
    if (chatModal) {
      chatModal.classList.remove('show');
      document.body.style.overflow = 'auto';
      currentChatUser = null;
      stopMessagePolling();
    }
  }
  
  // Load chat messages
  async function loadMessages() {
    const token = localStorage.getItem('rhymebox_token');
    if (!token || !currentChatUser) {
      console.warn('⚠️ No token or chat user');
      return;
    }
    
    const messagesDiv = document.getElementById('chatMessages');
    
    try {
      console.log(`📥 Loading messages with ${currentChatUser}`);
      const response = await fetch(`/api/friends/chat/${currentChatUser}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const messages = await response.json();
      console.log(`✅ Loaded ${messages.length} messages`);
      
      const stored = JSON.parse(localStorage.getItem('rhymebox_user') || 'null');
      const myUsername = stored?.username || 'guest';
      
      if (messages.length === 0) {
        messagesDiv.innerHTML = `
          <div class="chat-empty">
            <p>No messages yet. Say hi! 👋</p>
          </div>
        `;
      } else {
        messagesDiv.innerHTML = messages.map(msg => {
          const isMe = msg.sender === myUsername;
          const time = new Date(msg.created_at).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          });
          
          return `
            <div class="chat-message ${isMe ? 'mine' : 'theirs'}">
              <div class="message-bubble">
                <p>${msg.content}</p>
                <span class="message-time">${time}</span>
              </div>
            </div>
          `;
        }).join('');
        
        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
      
    } catch (error) {
      console.error('❌ Load messages error:', error);
      messagesDiv.innerHTML = `
        <div class="chat-error">
          <p>Failed to load messages</p>
          <button onclick="window.openChat('${currentChatUser}')">Retry</button>
        </div>
      `;
    }
  }
  
  // Send message
  async function sendMessage() {
    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    
    if (!content || !currentChatUser) return;
    
    const token = localStorage.getItem('rhymebox_token');
    if (!token) {
      alert('Please login to send messages');
      return;
    }
    
    console.log(`📤 Sending message to ${currentChatUser}: ${content.substring(0, 50)}...`);
    
    try {
      const response = await fetch(`/api/friends/chat/${currentChatUser}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      console.log('✅ Message sent');
      
      // Clear input
      input.value = '';
      input.style.height = 'auto';
      
      // Reload messages
      await loadMessages();
      
    } catch (error) {
      console.error('❌ Send message error:', error);
      alert('Failed to send message. Please try again.');
    }
  }
  
  // Start polling for new messages
  function startMessagePolling() {
    stopMessagePolling();
    console.log('⏰ Starting message polling (3s interval)');
    messageCheckInterval = setInterval(() => {
      if (currentChatUser) {
        loadMessages();
      }
    }, 3000);
  }
  
  // Stop polling
  function stopMessagePolling() {
    if (messageCheckInterval) {
      console.log('⏰ Stopping message polling');
      clearInterval(messageCheckInterval);
      messageCheckInterval = null;
    }
  }
  
  // Attach event listeners
  function attachChatEventListeners() {
    console.log('🔗 Attaching chat event listeners');
    
    // Close button
    document.getElementById('closeChatBtn').addEventListener('click', closeChat);
    
    // Send button
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    
    // Enter key to send
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    // Close on overlay click
    chatModal.addEventListener('click', function(e) {
      if (e.target === chatModal) {
        closeChat();
      }
    });
    
    // ESC key to close
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && chatModal && chatModal.classList.contains('show')) {
        closeChat();
      }
    });
    
    console.log('✅ Chat event listeners attached');
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopMessagePolling();
  });
  
  console.log('✅ Chat module initialized, window.openChat is available');
})();
