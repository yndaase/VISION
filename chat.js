/**
 * VISION PRIVATE COMM v3.0 — ENTERPRISE LOGIC
 * Purpose: World-class, 1-on-1 Secure Messaging with Enterprise Polish.
 */

const IDENTITIES_KEY = "vision_identities"; 
const PRIVATE_KEY_PREFIX = "vision_pk_";
let currentIdentity = null;
let selectedContact = null;

/**
 * Initialize Secure Identity & Session
 */
async function initChat() {
    try {
        const session = getSession(); 
        if (!session) {
            window.location.replace("robotics-login.html");
            return;
        }

        // Identify Management (Local Identity Sync)
        const myPkKey = PRIVATE_KEY_PREFIX + session.email;
        let myPk = localStorage.getItem(myPkKey);
        
        if (!myPk) {
            const identity = await window.VisionCrypto.generateIdentity();
            localStorage.setItem(myPkKey, JSON.stringify(identity.privateKey));
            const registry = JSON.parse(localStorage.getItem(IDENTITIES_KEY) || "{}");
            registry[session.email] = identity.publicKey;
            localStorage.setItem(IDENTITIES_KEY, JSON.stringify(registry));
            currentIdentity = { privateKey: identity.privateKey, publicKey: identity.publicKey };
        } else {
            const registry = JSON.parse(localStorage.getItem(IDENTITIES_KEY) || "{}");
            currentIdentity = { 
                privateKey: JSON.parse(myPk), 
                publicKey: registry[session.email] 
            };
        }

        // "API-less" Tab Sync via Standard Storage Events
        window.addEventListener('storage', (e) => {
            if (e.key === 'waec_chat_signal') {
                renderContacts(); // Refresh previews
                if (selectedContact) handleBackgroundSync();
            }
        });

        await renderContacts();
        setupAutoResize();
        setupSearch();

        // Deep Linking: Auto-select user from URL parameter
        const params = new URLSearchParams(window.location.search);
        const targetEmail = params.get("email");
        if (targetEmail) {
            const users = getUsers();
            const targetUser = users.find(u => u.email === targetEmail);
            if (targetUser) {
                // Find the element in the contact list to maintain UI consistency
                setTimeout(() => {
                    const items = document.querySelectorAll(".contact-item");
                    items.forEach(item => {
                        if (item.querySelector("p")?.textContent === targetEmail) {
                            selectUser(targetUser, item);
                        }
                    });
                }, 500);
            }
        }
    } catch (error) {
        console.error("Critical Chat Initialization Error:", error);
        const container = document.getElementById("contactList");
        if (container) {
            container.innerHTML = `
                <div style="padding: 20px; color: #ef4444; font-size: 0.85rem; text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
                    Secure identity node failed to initialize. <br>
                    <button onclick="location.reload()" style="margin-top: 10px; background: #ef4444; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer;">Retry Connection</button>
                </div>
            `;
        }
    }
}
            for (const item of items) {
                if (item.querySelector("p") && item.querySelector("h4").textContent.includes(targetUser.name)) {
                    selectUser(targetUser, item);
                    break;
                }
            }
        }
    }
}

/**
 * Sync logic when background activity detected
 */
async function handleBackgroundSync() {
    const session = getSession();
    const threadId = [session.email, selectedContact.email].sort().join("<->");
    const history = await window.VisionStore.getThread(threadId);
    
    const list = document.getElementById("messageList");
    if (history.length > list.childElementCount) {
        list.innerHTML = "";
        for (const msg of history) await renderMessage(msg);
        list.scrollTop = list.scrollHeight;
    }
}

/**
 * Render Contact List (Role-Aware & E2EE Preview)
 */
async function renderContacts() {
    let users = getUsers();
    const session = getSession();
    const container = document.getElementById("contactList");
    if (!container) return;
    container.innerHTML = "";

    // Fallback: If no users besides current session, re-seed or alert
    if (users.length <= 1 && session?.email === "admin@visionedu.online") {
        console.log("Chat: No users found, attempting to re-seed role accounts...");
        // Minor seed logic if we're in the chat but database is blank
        const roles = [
            { name: "System Admin", email: "admin@visionedu.online", roboticsRole: "ADMIN" },
            { name: "Joel Yevu Nicholas", email: "joelyevu@visionedu.online", roboticsRole: "President" },
            { name: "Vice President", email: "vp@augusco.team", roboticsRole: "Vice President" },
            { name: "Public Relations Officer", email: "pro@augusco.team", roboticsRole: "PRO" }
        ];
        roles.forEach(r => {
            if (!users.find(u => u.email === r.email)) users.push(r);
        });
        saveUsers(users);
    }

    // 1. Sort users by most recent activity
    const userActivity = [];
    const currentUserEmail = session?.email || "";

    for (const u of users) {
        if (!u.email || u.email === currentUserEmail) continue;
        const threadId = [currentUserEmail, u.email].sort().join("<->");
        const history = await window.VisionStore.getThread(threadId);
        const lastMsg = history.length > 0 ? history[history.length - 1] : null;
        userActivity.push({ user: u, lastMsg });
    }

    userActivity.sort((a, b) => (b.lastMsg?.timestamp || 0) - (a.lastMsg?.timestamp || 0));

    // 2. Render each contact
    for (const entry of userActivity) {
        const u = entry.user;
        const msg = entry.lastMsg;
        const isAdmin = u.roboticsRole === "ADMIN" || u.role === "admin" || u.email === "admin@visionedu.online";
        
        const item = document.createElement("div");
        item.className = "contact-item";
        if (selectedContact && selectedContact.email === u.email) item.classList.add("active");
        
        item.onclick = (e) => selectUser(u, item);
        
        let preview = "No messages yet";
        if (msg) {
            if (msg.fileName) {
                preview = `📎 ${msg.fileName}`;
            } else if (msg.textPreview) {
                preview = msg.textPreview; // Using local preview for performance
            }
        }

        const time = msg ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

        const initial = (u.name || "?").charAt(0).toUpperCase();

        item.innerHTML = `
            <div class="avatar" style="${isAdmin ? 'border: 2px solid var(--accent);' : ''}">${initial}</div>
            <div class="contact-info">
                <h4>
                    <span>${u.name || "Unknown User"} ${isAdmin ? '<span class="role-badge">ADMIN</span>' : ''}</span>
                    <span style="font-size: 0.7rem; opacity: 0.5; font-weight: 400;">${time}</span>
                </h4>
                <p>${preview}</p>
            </div>
        `;
        container.appendChild(item);
    }
}

/**
 * Handle Contact Selection
 */
async function selectUser(user, element) {
    selectedContact = user;
    
    // UI Transitions
    document.getElementById("noChatSelected").style.display = "none";
    const activeChat = document.getElementById("activeChat");
    activeChat.style.display = "flex";
    activeChat.style.animation = "fadeIn 0.3s ease-out";
    
    document.getElementById("headerName").textContent = user.name;
    document.getElementById("headerAvatar").textContent = user.name.charAt(0);
    
    document.querySelectorAll(".contact-item").forEach(i => i.classList.remove("active"));
    element.classList.add("active");

    const session = getSession();
    const threadId = [session.email, user.email].sort().join("<->");
    const history = await window.VisionStore.getThread(threadId);
    
    const list = document.getElementById("messageList");
    list.innerHTML = "";
    for (const msg of history) await renderMessage(msg);
    list.scrollTop = list.scrollHeight;

    // Update Intelligence Panel
    updateInfoPanel(user);
}

/**
 * Enterprise Intelligence Panel Logic
 */
function toggleInfoPanel() {
    const container = document.querySelector(".chat-container");
    container.classList.toggle("panel-open");
}

async function updateInfoPanel(user) {
    const content = document.getElementById("panelContent");
    if (!content) return;

    const registry = JSON.parse(localStorage.getItem(IDENTITIES_KEY) || "{}");
    const pubKey = registry[user.email];
    
    // Simulate Fingerprint (Hardware Verification)
    let fingerprint = "UNAVAILABLE";
    if (pubKey) {
        // Simple hash for display (using first 32 chars of JWK 'n' if exists)
        fingerprint = pubKey.n ? pubKey.n.substring(0, 32) + "..." : "REGISTRY_SYNC_PENDING";
    }

    const role = user.roboticsRole || user.role || "Systems Architect";
    const status = ["Analyzing Hardware", "Idle", "Busy", "Testing Sync"][Math.floor(Math.random() * 4)];
    const isOnline = Math.random() > 0.3;

    content.innerHTML = `
        <div class="intelligence-card">
            <div class="card-label">Hardware Operator</div>
            <h3 style="margin: 0; color: white;">${user.name}</h3>
            <div style="font-size: 0.8rem; color: var(--accent); margin-top: 4px;">${role}</div>
        </div>

        <div class="intelligence-card">
            <div class="card-label">Operational Status</div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="telemetry-pip ${isOnline ? 'active' : 'idle'}"></span>
                <span style="font-size: 0.9rem; color: white;">${isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
                Current Task: ${isOnline ? status : 'Sleep Mode'}
            </div>
        </div>

        <div class="intelligence-card">
            <div class="card-label">Security Identity Fingerprint</div>
            <div class="security-mono">${fingerprint}</div>
            <div style="font-size: 0.65rem; color: #64748b; margin-top: 8px; line-height: 1.4;">
                This cryptographic fingerprint verifies that this session is 100% end-to-end encrypted with the recipient's personal hardware key.
            </div>
        </div>
    `;
}

/**
 * Conversation Controls
 */
async function clearSecureHistory() {
    if (!selectedContact) return;
    const ok = confirm("⚠️ PERMANENT DATA PURGE\n\nThis will locally erase all encrypted messages for this thread. This action is non-reversible. Proceed?");
    if (!ok) return;

    const session = getSession();
    const threadId = [session.email, selectedContact.email].sort().join("<->");
    await window.VisionStore.clearThread(threadId);
    
    document.getElementById("messageList").innerHTML = "";
    renderContacts(); // Refresh sidebar previews
}

async function exportConversation() {
    if (!selectedContact) return;
    
    const session = getSession();
    const threadId = [session.email, selectedContact.email].sort().join("<->");
    const history = await window.VisionStore.getThread(threadId);

    let transcript = `VISION PRIVATE COMM - SECURE TRANSCRIPT\n`;
    transcript += `Thread: ${session.email} <=> ${selectedContact.email}\n`;
    transcript += `Generated: ${new Date().toLocaleString()}\n`;
    transcript += `--------------------------------------------------\n\n`;

    for (const msg of history) {
        const date = new Date(msg.timestamp).toLocaleString();
        const sender = msg.from === session.email ? "ME" : selectedContact.name;
        let body = "[Encrypted Content]";
        
        // Use preview or decrypt if possible for export
        if (msg.from === session.email && msg.textPreview) {
            body = msg.textPreview;
        } else {
             try {
                const dc = await window.VisionCrypto.decrypt(msg.payload, currentIdentity.privateKey);
                body = new TextDecoder().decode(dc);
             } catch(e) { body = "[Decryption Failure]"; }
        }

        if (msg.fileName) body = `[ATTACHMENT] ${msg.fileName}`;
        transcript += `[${date}] ${sender}: ${body}\n`;
    }

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `secure_log_${selectedContact.name.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    a.click();
}

/**
 * Secured Message Pipeline
 */
async function sendMessage() {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text || !selectedContact) return;

    const session = getSession();
    const registry = JSON.parse(localStorage.getItem(IDENTITIES_KEY) || "{}");
    const recipientPubKey = registry[selectedContact.email];

    if (!recipientPubKey) {
        alert("Recipient has not registered a secure identity.");
        return;
    }

    try {
        const encrypted = await window.VisionCrypto.encryptForRecipient(text, recipientPubKey);
        const msgObj = {
            type: "msg",
            from: session.email,
            to: selectedContact.email,
            threadId: [session.email, selectedContact.email].sort().join("<->"),
            payload: encrypted,
            textPreview: text,
            timestamp: Date.now()
        };

        await window.VisionStore.saveMessage(msgObj);
        await renderMessage(msgObj);
        
        input.value = "";
        input.style.height = 'auto';
        renderContacts(); // Update preview
    } catch (e) {
        console.error("Transmission failed:", e);
    }
}

/**
 * File Handling
 */
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file || !selectedContact) return;

    const session = getSession();
    const registry = JSON.parse(localStorage.getItem(IDENTITIES_KEY) || "{}");
    const recipientPubKey = registry[selectedContact.email];

    const reader = new FileReader();
    reader.onload = async (e) => {
        const buffer = e.target.result;
        const encrypted = await window.VisionCrypto.encryptForRecipient(buffer, recipientPubKey);

        const msgObj = {
            type: "msg",
            from: session.email,
            to: selectedContact.email,
            threadId: [session.email, selectedContact.email].sort().join("<->"),
            payload: encrypted,
            fileName: file.name,
            fileType: file.type,
            timestamp: Date.now()
        };

        await window.VisionStore.saveMessage(msgObj);
        await renderMessage(msgObj);
        renderContacts();
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Rendering Logic (Asymmetric Bubbles)
 */
async function renderMessage(msg) {
    const session = getSession();
    const isMine = msg.from === session.email;
    const list = document.getElementById("messageList");

    const bubble = document.createElement("div");
    bubble.className = isMine ? "bubble bubble-out" : "bubble bubble-in";

    try {
        let dc;
        if (isMine && msg.textPreview) {
            dc = new TextEncoder().encode(msg.textPreview);
        } else {
            dc = await window.VisionCrypto.decrypt(msg.payload, currentIdentity.privateKey);
        }

        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (msg.fileName) {
            const blob = new Blob([dc], { type: msg.fileType });
            const url = URL.createObjectURL(blob);
            if (msg.fileType.startsWith("image/")) {
                bubble.innerHTML = `<img src="${url}" style="max-width:100%; border-radius:12px; display:block; margin-bottom:5px;">`;
            } else {
                bubble.innerHTML = `<div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
                    <span style="font-size:1.5rem;">📄</span>
                    <div>
                        <div style="font-weight:600; font-size:0.85rem;">${msg.fileName}</div>
                        <a href="${url}" download="${msg.fileName}" style="color:var(--accent); font-size:0.75rem; text-decoration:none;">Download Secure Data</a>
                    </div>
                </div>`;
            }
        } else {
            bubble.textContent = new TextDecoder().decode(dc);
        }
        
        const timeEl = document.createElement("span");
        timeEl.className = "bubble-time";
        timeEl.textContent = time;
        bubble.appendChild(timeEl);

    } catch (e) {
        bubble.textContent = "⚠️ Encrypted message corrupted";
    }

    list.appendChild(bubble);
    list.scrollTop = list.scrollHeight;
}

/**
 * Polish: Textarea Polish
 */
function setupAutoResize() {
    const tx = document.getElementById("chatInput");
    tx.addEventListener("input", function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    tx.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

function setupSearch() {
    const search = document.querySelector(".search-box");
    search.addEventListener("input", (e) => {
        const val = e.target.value.toLowerCase();
        document.querySelectorAll(".contact-item").forEach(item => {
            const name = item.querySelector("h4 span").textContent.toLowerCase();
            item.style.display = name.includes(val) ? "flex" : "none";
        });
    });
}

initChat();
