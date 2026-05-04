const SESSION_KEY = "waec_session";
const SESSION_ID = 'session_' + Math.random().toString(36).slice(2);
let currentSubject = '';
let isLoading = false;
let userEmail = null;
let supabaseReady = false;

// Load Supabase configuration
async function loadSupabaseConfig() {
  try {
    const response = await fetch('/api/supabase-config');
    const config = await response.json();
    
    if (config.error) {
      console.error('[Chat] Supabase config error:', config.error);
      return false;
    }
    
    window.SUPABASE_URL = config.url;
    window.SUPABASE_ANON_KEY = config.anonKey;
    console.log('[Chat] Supabase config loaded');
    return true;
  } catch (error) {
    console.error('[Chat] Failed to load Supabase config:', error);
    return false;
  }
}

// Wait for Supabase to be ready
function waitForSupabase(callback, maxAttempts = 20) {
  let attempts = 0;
  const checkSupabase = setInterval(async () => {
    attempts++;
    
    if (window.supabase && window.sbGetUser) {
      const user = await window.sbGetUser();
      if (user) {
        clearInterval(checkSupabase);
        supabaseReady = true;
        console.log('[Chat] Supabase ready with authenticated user:', user.email);
        if (callback) callback();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkSupabase);
        console.warn('[Chat] Supabase ready but user not authenticated');
        if (callback) callback(); // Continue anyway
      }
    } else if (attempts >= maxAttempts) {
      clearInterval(checkSupabase);
      console.warn('[Chat] Supabase not available after', maxAttempts, 'attempts');
      if (callback) callback(); // Continue anyway
    } else if (attempts % 5 === 0) {
      console.log(`[Chat] Waiting for Supabase... (attempt ${attempts}/${maxAttempts})`);
    }
  }, 500);
}

// Load user profile
async function loadUserProfile() {
  const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (!session) {
    console.warn('[Chat] No session found, redirecting to login');
    window.location.href = '/login';
    return;
  }

  try {
    const user = JSON.parse(session);
    userEmail = user.email;
    
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
    
    // Wait for Supabase to be ready before loading history
    waitForSupabase(async () => {
      const sbUser = await window.sbGetUser();
      if (sbUser) {
        console.log('[Chat] Supabase user confirmed:', sbUser.email);
        loadChatHistory();
        loadChatSessions();
      } else {
        console.warn('[Chat] Supabase user not authenticated - chat history will not be saved');
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
async function handleLogout() {
  // Sign out from Supabase
  if (window.sbSignOut) {
    await window.sbSignOut();
  }
  
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

// Load chat history from Supabase
async function loadChatHistory() {
  if (!userEmail || !window.sbLoadHistory) {
    console.log('[Chat] Supabase not available, skipping history load');
    return;
  }
  
  try {
    const messages = await window.sbLoadHistory(userEmail, SESSION_ID);
    if (messages && messages.length > 0) {
      hideEmptyState();
      messages.forEach(msg => {
        if (msg.role === 'user') {
          addMessage('user', msg.content, null, false);
        } else if (msg.role === 'assistant') {
          addMessage('assistant', msg.content, msg.source, false);
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
  if (!userEmail || !window.sbGetSessions) {
    return;
  }
  
  try {
    const sessions = await window.sbGetSessions(userEmail);
    if (!sessions || sessions.length === 0) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const todayChats = [];
    const weekChats = [];
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.last_updated);
      const item = {
        sessionId: session.session_id,
        title: session.last_message || 'New Chat',
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
    const sessionMessages = await window.sbLoadHistory(userEmail, sessionId);
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
async function clearChat() {
  if (confirm('Are you sure you want to clear this chat?')) {
    startNewChat();
    
    // Delete from Supabase
    if (userEmail && window.sbDeleteSession) {
      await window.sbDeleteSession(userEmail, SESSION_ID)
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
function addMessage(role, content, source = null, saveToSupabase = true) {
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
  
  // Save to Supabase
  if (saveToSupabase && userEmail && supabaseReady && window.sbSaveMessage) {
    const messageData = {
      role: role === 'user' ? 'user' : 'assistant',
      content: content,
      timestamp: Date.now(),
      source: source || null
    };
    
    window.sbSaveMessage(userEmail, SESSION_ID, messageData)
      .then(result => {
        if (result.success) {
          console.log('[Chat] Message saved to Supabase');
        } else {
          console.warn('[Chat] Failed to save message:', result.error);
        }
      })
      .catch(err => console.warn('[Chat] Save message error:', err));
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
    .replace(/(<li>.*<\/li>)+/gs, '<ul style="margin:8px 0;padding-left:20px">$0</ul>')
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
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Chat] Vision AI Chat - Initializing...');
  
  // Load Supabase config
  const configLoaded = await loadSupabaseConfig();
  if (!configLoaded) {
    console.error('[Chat] Failed to load Supabase config');
  }
  
  // Load user profile
  loadUserProfile();
  
  // Focus input
  const input = document.getElementById('messageInput');
  if (input) {
    input.focus();
  }
  
  console.log('[Chat] Ready');
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
