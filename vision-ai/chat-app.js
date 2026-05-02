const SESSION_KEY = "waec_session";
const SESSION_ID = 'session_' + Math.random().toString(36).slice(2);
let currentSubject = '';
let isLoading = false;
let userEmail = null;
let firebaseReady = false;

// Wait for Firebase to be ready
function waitForFirebase(callback, maxAttempts = 20) {
  let attempts = 0;
  const checkFirebase = setInterval(() => {
    attempts++;
    // Check if both Firebase functions AND Firebase Auth are ready
    const functionsReady = typeof window.fbSaveVisionAIMessage === 'function';
    const authReady = window.fbAuth && window.fbAuth.currentUser;
    
    if (functionsReady && authReady) {
      clearInterval(checkFirebase);
      firebaseReady = true;
      console.log('[Chat] Firebase ready with authenticated user:', window.fbAuth.currentUser.email);
      if (callback) callback();
    } else if (attempts >= maxAttempts) {
      clearInterval(checkFirebase);
      if (!functionsReady) {
        console.warn('[Chat] Firebase functions not available after', maxAttempts, 'attempts');
      } else if (!authReady) {
        console.warn('[Chat] Firebase Auth not ready - user may not be authenticated');
      }
      if (callback) callback(); // Continue anyway
    } else if (attempts % 5 === 0) {
      console.log(`[Chat] Waiting for Firebase... (attempt ${attempts}/${maxAttempts}, functions: ${functionsReady}, auth: ${authReady})`);
    }
  }, 500);
}

// Load user profile
function loadUserProfile() {
  const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (!session) {
    console.warn('[Chat] No session found, redirecting to login');
    window.location.href = '/login';
    return;
  }

  try {
    const user = JSON.parse(session);
    userEmail = user.email; // Store for Firebase operations
    
    console.log('[Chat] User session loaded:', userEmail);
    
    // Update sidebar profile
    const userNameSidebar = document.getElementById('userNameSidebar');
    const userEmailSidebar = document.getElementById('userEmailSidebar');
    const userInitialsSidebar = document.getElementById('userInitialsSidebar');
    const userAvatarSidebar = document.getElementById('userAvatarSidebar');

    if (userNameSidebar) userNameSidebar.textContent = user.name || 'User';
    if (userEmailSidebar) userEmailSidebar.textContent = user.email || 'user@email.com';
    
    // Set initials
    if (userInitialsSidebar) {
      const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      userInitialsSidebar.textContent = initials;
    }

    // Set avatar image if available
    if (user.picture && userAvatarSidebar) {
      const img = document.createElement('img');
      img.src = user.picture;
      img.alt = user.name || 'User';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '50%';
      img.onerror = function() {
        this.remove();
        if (userInitialsSidebar) userInitialsSidebar.style.display = 'block';
      };
      img.onload = function() {
        if (userInitialsSidebar) userInitialsSidebar.style.display = 'none';
      };
      userAvatarSidebar.appendChild(img);
    }
    
    // Wait for Firebase to be ready before loading history
    waitForFirebase(() => {
      // Check if Firebase Auth is ready
      if (window.fbAuth && window.fbAuth.currentUser) {
        console.log('[Chat] Firebase Auth confirmed:', window.fbAuth.currentUser.email);
        loadChatHistory();
        loadChatSessions();
      } else {
        console.warn('[Chat] Firebase Auth not ready - chat history will not be saved');
        // Still allow chat to work, just without persistence
      }
    });
  } catch (e) {
    console.error('[Chat] Error loading user profile:', e);
    window.location.href = '/login';
  }
}

// Toggle sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('show');
}

// Toggle user menu
function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  menu.classList.toggle('show');
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
  const userMenu = document.getElementById('userMenu');
  const userProfile = document.querySelector('.user-profile-sidebar');
  
  if (userMenu && userProfile && !userProfile.contains(e.target)) {
    userMenu.classList.remove('show');
  }
});

// Logout
function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  window.location.href = '/login';
}

// Start new chat
function startNewChat() {
  const messages = document.getElementById('messages');
  const emptyState = document.getElementById('emptyState');
  
  messages.innerHTML = '';
  emptyState.style.display = 'block';
  
  // Reset subject
  currentSubject = '';
  document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.subject === '') {
      btn.classList.add('active');
    }
  });
}

// Load chat history from Firebase
async function loadChatHistory() {
  if (!userEmail || typeof window.fbLoadVisionAIHistory !== 'function') {
    console.log('[Chat] Firebase not available, skipping history load');
    return;
  }
  
  try {
    const messages = await window.fbLoadVisionAIHistory(userEmail, SESSION_ID);
    if (messages && messages.length > 0) {
      hideEmptyState();
      messages.forEach(msg => {
        if (msg.role === 'user') {
          addMessage('user', msg.content, null, false); // Don't save again
        } else if (msg.role === 'assistant') {
          addMessage('assistant', msg.content, msg.source, false); // Don't save again
        }
      });
      console.log(`[Chat] Loaded ${messages.length} messages from history`);
    }
  } catch (error) {
    console.warn('[Chat] Failed to load history:', error);
  }
}

// Load chat sessions for sidebar
async function loadChatSessions() {
  if (!userEmail || typeof window.fbGetVisionAISessions !== 'function') {
    return;
  }
  
  try {
    const sessions = await window.fbGetVisionAISessions(userEmail);
    if (!sessions || sessions.length === 0) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const todayChats = [];
    const weekChats = [];
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.lastUpdated);
      const item = {
        sessionId: session.sessionId,
        title: session.lastMessage || 'New Chat',
        date: sessionDate
      };
      
      if (sessionDate >= today) {
        todayChats.push(item);
      } else if (sessionDate >= weekAgo) {
        weekChats.push(item);
      }
    });
    
    // Render today's chats
    const todayContainer = document.getElementById('todayChats');
    if (todayContainer && todayChats.length > 0) {
      todayContainer.innerHTML = todayChats.map(chat => `
        <div class="history-item" onclick="loadSession('${chat.sessionId}')">
          ${chat.title}
        </div>
      `).join('');
    }
    
    // Render week's chats
    const weekContainer = document.getElementById('weekChats');
    if (weekContainer && weekChats.length > 0) {
      weekContainer.innerHTML = weekChats.map(chat => `
        <div class="history-item" onclick="loadSession('${chat.sessionId}')">
          ${chat.title}
        </div>
      `).join('');
    }
    
    console.log(`[Chat] Loaded ${sessions.length} sessions`);
  } catch (error) {
    console.warn('[Chat] Failed to load sessions:', error);
  }
}

// Load a specific session
async function loadSession(sessionId) {
  if (!userEmail || !sessionId) return;
  
  try {
    // Clear current chat
    const messages = document.getElementById('messages');
    messages.innerHTML = '';
    hideEmptyState();
    
    // Load session messages
    const sessionMessages = await window.fbLoadVisionAIHistory(userEmail, sessionId);
    if (sessionMessages && sessionMessages.length > 0) {
      sessionMessages.forEach(msg => {
        if (msg.role === 'user') {
          addMessage('user', msg.content, null, false);
        } else if (msg.role === 'assistant') {
          addMessage('assistant', msg.content, msg.source, false);
        }
      });
    }
    
    // Close sidebar on mobile
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('show');
  } catch (error) {
    console.error('[Chat] Failed to load session:', error);
  }
}

// Select subject
function selectSubject(button, subject) {
  currentSubject = subject;
  document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  button.classList.add('active');
}

// Clear chat
function clearChat() {
  if (confirm('Are you sure you want to clear this chat?')) {
    startNewChat();
    
    // Optionally delete from Firebase
    if (userEmail && typeof window.fbDeleteVisionAISession === 'function') {
      window.fbDeleteVisionAISession(userEmail, SESSION_ID)
        .catch(err => console.warn('[Chat] Failed to delete session:', err));
    }
  }
}

// Auto resize textarea
function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  
  // Update character count
  const charCount = document.getElementById('charCount');
  if (charCount) {
    const length = textarea.value.length;
    charCount.textContent = `${length} / 2000`;
    if (length > 2000) {
      charCount.style.color = 'var(--danger)';
    } else {
      charCount.style.color = 'var(--text-tertiary)';
    }
  }
}

// Handle key press
function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// Quick ask function
function ask(question) {
  const input = document.getElementById('messageInput');
  input.value = question;
  sendMessage();
}

// Hide empty state
function hideEmptyState() {
  const emptyState = document.getElementById('emptyState');
  if (emptyState) {
    emptyState.style.display = 'none';
  }
}

// Add message to chat
function addMessage(role, content, source = null, saveToFirebase = true) {
  hideEmptyState();
  
  const messages = document.getElementById('messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  
  const time = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const avatar = role === 'user' ? getUserInitials() : 'V';
  const author = role === 'user' ? 'You' : 'Vision AI';
  
  let sourceBadge = '';
  if (source) {
    const sourceMap = {
      'knowledge-base': { icon: '📚', label: 'Knowledge Base' },
      'math-engine': { icon: '🔢', label: 'Math Engine' },
      'groq-ai': { icon: '🤖', label: 'Vision AI' },
      'system': { icon: '⚙️', label: 'Vision AI' },
      'fallback': { icon: '💡', label: 'Suggestion' }
    };
    const sourceInfo = sourceMap[source] || { icon: '💡', label: source };
    sourceBadge = `<div class="message-badge">${sourceInfo.icon} ${sourceInfo.label}</div>`;
  }
  
  messageDiv.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-author">${author}</span>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-text">${formatMessage(content)}</div>
      ${sourceBadge}
    </div>
  `;
  
  messages.appendChild(messageDiv);
  scrollToBottom();
  
  // Save to Firebase (only if ready and should save)
  if (saveToFirebase && userEmail && firebaseReady && typeof window.fbSaveVisionAIMessage === 'function') {
    const messageData = {
      role: role === 'user' ? 'user' : 'assistant',
      content: content,
      timestamp: Date.now()
    };
    if (source) messageData.source = source;
    
    window.fbSaveVisionAIMessage(userEmail, SESSION_ID, messageData)
      .then(() => console.log('[Chat] Message saved to Firebase'))
      .catch(err => console.warn('[Chat] Failed to save message:', err));
  }
  
  return messageDiv;
}

// Get user initials
function getUserInitials() {
  const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  try {
    const user = JSON.parse(session);
    return (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  } catch (e) {
    return 'U';
  }
}

// Format message with markdown
function formatMessage(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<strong style="font-size:1.1em;display:block;margin:12px 0 8px">$1</strong>')
    .replace(/^---$/gm, '<hr style="margin:16px 0;border:none;border-top:1px solid var(--border)"/>')
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)+/gs, '<ul style="margin:8px 0;padding-left:20px">$&</ul>')
    .replace(/\n\n/g, '</p><p style="margin-top:12px">')
    .replace(/\n/g, '<br>');
}

// Show typing indicator
function showTyping() {
  hideEmptyState();
  
  const messages = document.getElementById('messages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message assistant';
  typingDiv.id = 'typingIndicator';
  typingDiv.innerHTML = `
    <div class="message-avatar">V</div>
    <div class="message-content">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  
  messages.appendChild(typingDiv);
  scrollToBottom();
}

// Remove typing indicator
function removeTyping() {
  const typing = document.getElementById('typingIndicator');
  if (typing) {
    typing.remove();
  }
}

// Scroll to bottom
function scrollToBottom() {
  const container = document.getElementById('chatContainer');
  container.scrollTop = container.scrollHeight;
}

// Send message
async function sendMessage() {
  if (isLoading) return;
  
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  let query = input.value.trim();
  
  if (!query) return;
  if (query.length > 2000) {
    alert('Message is too long. Maximum 2000 characters.');
    return;
  }
  
  // Add subject context if selected
  if (currentSubject) {
    query = `[${currentSubject}] ${query}`;
  }
  
  // Add user message
  addMessage('user', input.value.trim());
  
  // Clear input
  input.value = '';
  input.style.height = 'auto';
  autoResizeTextarea(input);
  
  // Show typing
  isLoading = true;
  sendBtn.disabled = true;
  showTyping();
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, sessionId: SESSION_ID })
    });
    
    const data = await response.json();
    removeTyping();
    
    if (data.error) {
      addMessage('assistant', `❌ Error: ${data.error}`, 'system');
    } else {
      addMessage('assistant', data.answer, data.source);
    }
  } catch (error) {
    removeTyping();
    addMessage('assistant', '❌ Could not reach Vision AI server. Please check your connection and try again.', 'system');
    console.error('Send message error:', error);
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

// Attach file (placeholder)
function attachFile() {
  alert('File attachment feature coming soon!');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  
  // Focus input
  const input = document.getElementById('messageInput');
  if (input) {
    input.focus();
  }
  
  console.log('Vision AI Chat - Ready');
});

// Make functions globally available
window.toggleSidebar = toggleSidebar;
window.toggleUserMenu = toggleUserMenu;
window.handleLogout = handleLogout;
window.startNewChat = startNewChat;
window.selectSubject = selectSubject;
window.clearChat = clearChat;
window.autoResizeTextarea = autoResizeTextarea;
window.handleKeyPress = handleKeyPress;
window.ask = ask;
window.sendMessage = sendMessage;
window.attachFile = attachFile;
window.loadSession = loadSession;
