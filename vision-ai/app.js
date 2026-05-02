const SESSION_ID = 'session_' + Math.random().toString(36).slice(2);
const SESSION_KEY = "waec_session";
let subjectContext = '';
let isLoading = false;

// Load user profile
function loadUserProfile() {
  const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (!session) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const user = JSON.parse(session);
    const userName = document.getElementById('userName');
    const userInitials = document.getElementById('userInitials');
    const userAvatar = document.getElementById('userAvatar');

    if (userName) userName.textContent = user.name || 'User';
    
    // Set initials
    if (userInitials) {
      const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      userInitials.textContent = initials;
    }

    // Set avatar image if available (Google users)
    if (user.picture && userAvatar) {
      const img = document.createElement('img');
      img.src = user.picture;
      img.alt = user.name || 'User';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.onerror = function() {
        this.remove();
        if (userInitials) userInitials.style.display = 'block';
      };
      img.onload = function() {
        if (userInitials) userInitials.style.display = 'none';
      };
      userAvatar.appendChild(img);
    }
  } catch (e) {
    console.error('Error loading user profile:', e);
    window.location.href = '/login.html';
  }
}

// Toggle user dropdown
function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const userProfile = document.getElementById('userProfile');
  const dropdown = document.getElementById('userDropdown');
  if (userProfile && !userProfile.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

// Logout function
function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  window.location.href = '/login.html';
}

// Load chat history from Firebase
async function loadChatHistory() {
  const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (!session) return;

  try {
    const user = JSON.parse(session);
    if (typeof window.fbLoadVisionAIHistory === 'function') {
      const messages = await window.fbLoadVisionAIHistory(user.email, SESSION_ID);
      if (messages && messages.length > 0) {
        hideEmpty();
        messages.forEach(msg => {
          appendMessage(msg.role, renderMarkdown(msg.content), msg.source || null);
        });
      }
    }
  } catch (e) {
    console.warn('Failed to load chat history:', e);
  }
}

// Initialize user profile and chat history on load
document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
  setTimeout(loadChatHistory, 500);
});

function setSubject(subject) {
  subjectContext = subject;
  document.querySelectorAll('.subject-pill').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
}

function ask(text) {
  document.getElementById('queryInput').value = text;
  sendQuery();
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendQuery();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 140) + 'px';
}

function hideEmpty() {
  const empty = document.getElementById('emptyState');
  if (empty) empty.remove();
}

function scrollToBottom() {
  const cw = document.getElementById('chatWindow');
  cw.scrollTop = cw.scrollHeight;
}

function appendMessage(role, html, source) {
  hideEmpty();
  const cw = document.getElementById('chatWindow');
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = `
    <div class="avatar ${role}">${role === 'ai' ? 'V' : 'Y'}</div>
    <div class="bubble">
      ${html}
      ${source ? renderSourceBadge(source) : ''}
    </div>
  `;
  cw.appendChild(div);
  scrollToBottom();
  return div;
}

function renderSourceBadge(source) {
  const map = {
    'knowledge-base': ['kb', '📚 Knowledge Base'],
    'web-search':     ['web', '🔍 Web Search'],
    'math-engine':    ['math', '🔢 Math Engine'],
    'system':         ['kb', '🤖 Vision AI'],
    'fallback':       ['kb', '💡 Vision AI'],
  };
  const [cls, label] = map[source] || ['kb', source];
  return `<div class="source-badge ${cls}">${label}</div>`;
}

function showTyping() {
  hideEmpty();
  const cw = document.getElementById('chatWindow');
  const div = document.createElement('div');
  div.className = 'message ai';
  div.id = 'typingIndicator';
  div.innerHTML = `
    <div class="avatar ai">V</div>
    <div class="bubble">
      <div class="typing"><span></span><span></span><span></span></div>
    </div>`;
  cw.appendChild(div);
  scrollToBottom();
}

function removeTyping() {
  document.getElementById('typingIndicator')?.remove();
}

function renderMarkdown(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<strong style="font-size:1.05em;display:block;margin:8px 0 4px">$1</strong>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)+/gs, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p style="margin-top:8px">')
    .replace(/\n/g, '<br>');
}

async function sendQuery() {
  if (isLoading) return;
  const input = document.getElementById('queryInput');
  const sendBtn = document.getElementById('sendBtn');
  let query = input.value.trim();
  if (!query) return;

  const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  let userEmail = null;
  try {
    const user = JSON.parse(session);
    userEmail = user.email;
  } catch (e) {}

  if (subjectContext) query = `[${subjectContext}] ${query}`;

  const userMessage = input.value.trim();
  appendMessage('user', renderMarkdown(userMessage), null);
  input.value = '';
  input.style.height = 'auto';

  if (userEmail && typeof window.fbSaveVisionAIMessage === 'function') {
    window.fbSaveVisionAIMessage(userEmail, SESSION_ID, {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    }).catch(e => console.warn('Failed to save user message:', e));
  }

  isLoading = true;
  sendBtn.disabled = true;
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, sessionId: SESSION_ID }),
    });

    const data = await res.json();
    removeTyping();

    if (data.error) {
      appendMessage('ai', `<span style="color:#f87171">Error: ${data.error}</span>`, null);
    } else {
      appendMessage('ai', renderMarkdown(data.answer), data.source);
      
      if (userEmail && typeof window.fbSaveVisionAIMessage === 'function') {
        window.fbSaveVisionAIMessage(userEmail, SESSION_ID, {
          role: 'ai',
          content: data.answer,
          source: data.source,
          timestamp: Date.now()
        }).catch(e => console.warn('Failed to save AI message:', e));
      }
    }
  } catch (err) {
    removeTyping();
    appendMessage('ai', '<span style="color:#f87171">Could not reach Vision AI server. Please try again.</span>', null);
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

// Make functions globally available
window.toggleUserDropdown = toggleUserDropdown;
window.handleLogout = handleLogout;
window.setSubject = setSubject;
window.ask = ask;
window.handleKey = handleKey;
window.autoResize = autoResize;
window.sendQuery = sendQuery;
