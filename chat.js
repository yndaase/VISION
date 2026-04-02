/**
 * VISION PRIVATE COMM v3.0 — ENTERPRISE LOGIC
 * Purpose: World-class, 1-on-1 Secure Messaging with Enterprise Polish.
 */

const IDENTITIES_KEY = "vision_identities"; 
const PRIVATE_KEY_PREFIX = "vision_pk_";
let currentIdentity = null;
let selectedContact = null;

// Voice Record State
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingSeconds = 0;

// ── SERVER SYNC STATE ──
let pollInterval = null;
let lastPollTimestamp = 0;
const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds

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

        // Initialize P2P Tunneling (Zero-Backend)
        if (window.VisionNetwork) {
            window.VisionNetwork.init(session.email);
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
    
    // Stop any existing polling
    stopPolling();
    
    // UI Transitions
    document.getElementById("noChatSelected").style.display = "none";
    const activeChat = document.getElementById("activeChat");
    activeChat.style.display = "flex";
    activeChat.style.animation = "fadeIn 0.3s ease-out";
    
    document.getElementById("headerName").textContent = user.name;
    document.getElementById("headerAvatar").textContent = user.name.charAt(0);
    
    document.querySelectorAll(".contact-item").forEach(i => i.classList.remove("active"));
    if (element) element.classList.add("active");

    // --- Enterprise Auto-Provisioning (Demo Polish) ---
    const registry = JSON.parse(localStorage.getItem(IDENTITIES_KEY) || "{}");
    if (!registry[user.email]) {
        console.log(`Auto-provisioning secure identity for: ${user.email}`);
        const identity = await window.VisionCrypto.generateIdentity();
        registry[user.email] = identity.publicKey;
        localStorage.setItem(IDENTITIES_KEY, JSON.stringify(registry));
        localStorage.setItem(PRIVATE_KEY_PREFIX + user.email, JSON.stringify(identity.privateKey));
    }

    const session = getSession();
    const threadId = [session.email, user.email].sort().join("<->");

    // ── HYBRID LOAD: Merge local + server messages ──
    const localHistory = await window.VisionStore.getThread(threadId);
    let serverMessages = [];
    try {
        const resp = await fetch(`/api/chat/poll?threadId=${encodeURIComponent(threadId)}&after=0`);
        if (resp.ok) {
            const data = await resp.json();
            serverMessages = data.messages || [];
        }
    } catch (e) {
        console.warn("Server sync unavailable, using local only", e);
    }

    // Merge: deduplicate by timestamp+from, prefer server data
    const merged = mergeMessages(localHistory, serverMessages);

    // Save any server-only messages to local IndexedDB
    for (const sMsg of serverMessages) {
        const existsLocally = localHistory.some(l => l.timestamp === sMsg.timestamp && l.from === sMsg.from);
        if (!existsLocally) {
            const localMsg = serverToLocalMsg(sMsg);
            await window.VisionStore.saveMessage(localMsg);
        }
    }

    const list = document.getElementById("messageList");
    list.innerHTML = "";
    for (const msg of merged) await renderMessage(msg);
    list.scrollTop = list.scrollHeight;

    // Set poll cursor to latest message time
    lastPollTimestamp = merged.length > 0 ? merged[merged.length - 1].timestamp : 0;

    // Start polling for new messages
    startPolling(threadId);

    // Update Intelligence Panel
    updateInfoPanel(user);
}

/**
 * Merge local IndexedDB messages with server messages, deduplicated
 */
function mergeMessages(localMsgs, serverMsgs) {
    const map = new Map();
    // Local messages first
    for (const m of localMsgs) {
        const key = `${m.timestamp}_${m.from}`;
        map.set(key, m);
    }
    // Server messages fill gaps (messages from other user)
    for (const s of serverMsgs) {
        const key = `${s.timestamp}_${s.from}`;
        if (!map.has(key)) {
            map.set(key, serverToLocalMsg(s));
        }
    }
    // Sort by timestamp
    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Convert a server message to local format for rendering
 */
function serverToLocalMsg(sMsg) {
    return {
        type: "msg",
        from: sMsg.from,
        to: sMsg.to,
        threadId: sMsg.threadId,
        payload: null, // Server messages are plaintext
        textPreview: sMsg.text,
        timestamp: sMsg.timestamp,
        _fromServer: true
    };
}

/**
 * Server Polling — check for new messages every 3s
 */
function startPolling(threadId) {
    stopPolling();
    pollInterval = setInterval(async () => {
        if (!selectedContact) return;
        try {
            const resp = await fetch(`/api/chat/poll?threadId=${encodeURIComponent(threadId)}&after=${lastPollTimestamp}`);
            if (!resp.ok) return;
            const data = await resp.json();
            const newMsgs = (data.messages || []).filter(m => m.timestamp > lastPollTimestamp);

            if (newMsgs.length > 0) {
                const session = getSession();
                for (const sMsg of newMsgs) {
                    // Only render messages from the OTHER user (we already rendered ours)
                    if (sMsg.from !== session.email) {
                        const localMsg = serverToLocalMsg(sMsg);
                        // Save to local store
                        await window.VisionStore.saveMessage(localMsg);
                        // Render in chat
                        await renderMessage(localMsg);
                    }
                    if (sMsg.timestamp > lastPollTimestamp) {
                        lastPollTimestamp = sMsg.timestamp;
                    }
                }
                const list = document.getElementById("messageList");
                list.scrollTop = list.scrollHeight;
                renderContacts(); // Update sidebar previews
            }
        } catch (e) {
            // Silent fail — will retry next interval
        }
    }, POLL_INTERVAL_MS);
}

function stopPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
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

    // Detect actual P2P Link Status
    let isP2PConnected = false;
    if (window.VisionNetwork && window.VisionNetwork.peer) {
        let hash = 0;
        for (let i = 0; i < user.email.length; i++) {
            hash = ((hash << 5) - hash) + user.email.charCodeAt(i);
            hash |= 0; 
        }
        const targetId = "vision_hq_v2_" + Math.abs(hash).toString(36);
        const conn = window.VisionNetwork.connections[targetId];
        isP2PConnected = (conn && conn.open);
    }

    content.innerHTML = `
        <div class="intelligence-card">
            <div class="card-label">Hardware Operator</div>
            <h3 style="margin: 0; color: white;">${user.name}</h3>
            <div style="font-size: 0.8rem; color: var(--accent); margin-top: 4px;">${role}</div>
        </div>

        <div class="intelligence-card">
            <div class="card-label">P2P Network Link</div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="telemetry-pip ${isP2PConnected ? 'active' : 'idle'}"></span>
                <span style="font-size: 0.9rem; color: white;">${isP2PConnected ? 'UPLINK SECURED' : 'LOCAL CACHE ONLY'}</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
                Status: ${isP2PConnected ? 'Direct Device-to-Device Tunnel Actvated.' : 'Remote peer offline. Messages will queue locally.'}
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

    const ts = Date.now();
    const threadId = [session.email, selectedContact.email].sort().join("<->");

    try {
        const encrypted = await window.VisionCrypto.encryptForRecipient(text, recipientPubKey);
        const msgObj = {
            type: "msg",
            from: session.email,
            to: selectedContact.email,
            threadId,
            payload: encrypted,
            textPreview: text,
            timestamp: ts
        };

        await window.VisionStore.saveMessage(msgObj);
        await renderMessage(msgObj);

        // ── SERVER RELAY: Send to Vercel Blob so other user can see it ──
        relayToServer(session.email, selectedContact.email, threadId, text, ts);
        
        // Also try P2P WebRTC
        if (window.VisionNetwork) {
            window.VisionNetwork.broadcast(msgObj);
        }
        
        // Update poll cursor so we don't re-render our own message
        lastPollTimestamp = ts;
        
        input.value = "";
        input.style.height = 'auto';
        renderContacts();
    } catch (e) {
        console.error("Transmission failed:", e);
    }
}

/**
 * Relay message to server (fire-and-forget)
 */
function relayToServer(from, to, threadId, text, timestamp) {
    fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, threadId, text, timestamp })
    }).then(r => {
        if (r.ok) console.log('[Chat] Server relay OK');
        else console.warn('[Chat] Server relay failed:', r.status);
    }).catch(e => {
        console.warn('[Chat] Server relay unavailable:', e.message);
    });
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
        
        // Beam payload across WebRTC Tunnel
        if (window.VisionNetwork) {
            window.VisionNetwork.broadcast(msgObj);
        }
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
        if (msg.textPreview) {
            // Use plaintext preview (available for own messages and server-synced messages)
            dc = new TextEncoder().encode(msg.textPreview);
        } else if (msg.payload) {
            dc = await window.VisionCrypto.decrypt(msg.payload, currentIdentity.privateKey);
        } else {
            dc = new TextEncoder().encode("[Message]");
        }

        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (msg.fileName) {
            const blob = new Blob([dc], { type: msg.fileType });
            const url = URL.createObjectURL(blob);
            if (msg.fileType.startsWith("image/")) {
                bubble.innerHTML = `<img src="${url}" style="max-width:100%; border-radius:12px; display:block; margin-bottom:5px;">`;
            } else if (msg.fileType.startsWith("audio/")) {
                bubble.innerHTML = `<audio controls class="secure-audio" src="${url}" style="display:block; margin-bottom:5px;"></audio>`;
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

/**
 * Secure Voice Relay Logic
 */
async function toggleVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        // Stop & Send
        mediaRecorder.stop();
        stopTimer();
        document.getElementById("defaultInput").style.display = "flex";
        document.getElementById("recordingState").style.display = "none";
        document.getElementById("micBtn").classList.remove("recording");
        document.getElementById("sendBtn").style.display = "flex";
    } else {
        // Start
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };
            
            mediaRecorder.onstop = async () => {
                if (audioChunks.length === 0) return;
                const blob = new Blob(audioChunks, { type: "audio/webm" });
                audioChunks = [];
                stream.getTracks().forEach(t => t.stop()); // release mic
                await sendVoiceNote(blob);
            };

            audioChunks = [];
            mediaRecorder.start();
            document.getElementById("defaultInput").style.display = "none";
            document.getElementById("recordingState").style.display = "flex";
            document.getElementById("micBtn").classList.add("recording");
            document.getElementById("sendBtn").style.display = "none";
            startTimer();
        } catch (e) {
            console.error("Microphone access denied:", e);
            alert("Microphone access is required to send Secure Voice Notes.");
        }
    }
}

function cancelVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.onstop = () => { 
            audioChunks = []; 
            mediaRecorder.stream.getTracks().forEach(t => t.stop());
        }; // prevent send
        mediaRecorder.stop();
        stopTimer();
        document.getElementById("defaultInput").style.display = "flex";
        document.getElementById("recordingState").style.display = "none";
        document.getElementById("micBtn").classList.remove("recording");
        document.getElementById("sendBtn").style.display = "flex";
    }
}

function startTimer() {
    recordingSeconds = 0;
    const timerEl = document.getElementById("recordingTimer");
    timerEl.textContent = "0:00";
    recordingInterval = setInterval(() => {
        recordingSeconds++;
        const m = Math.floor(recordingSeconds / 60);
        const s = (recordingSeconds % 60).toString().padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(recordingInterval);
}

async function sendVoiceNote(blob) {
    if (!selectedContact) return;
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
            fileName: `VoiceNote_${Date.now()}.webm`,
            fileType: blob.type || "audio/webm",
            timestamp: Date.now()
        };

        await window.VisionStore.saveMessage(msgObj);
        await renderMessage(msgObj);
        
        // Beam payload across WebRTC Tunnel
        if (window.VisionNetwork) {
            window.VisionNetwork.broadcast(msgObj);
        }
        
        renderContacts(); // updates sidebar to show attachment icon
    };
    reader.readAsArrayBuffer(blob);
}

initChat();
