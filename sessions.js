import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Minimal configuration to match the platform (reusing the same project)
const firebaseConfig = {
  apiKey: "AIzaSyCCLvmFR4NU6aIbDc-75EsBL-K9pqlNa5E",
  authDomain: "vision-education-8a794.firebaseapp.com",
  projectId: "vision-education-8a794",
  storageBucket: "vision-education-8a794.appspot.com",
  messagingSenderId: "324420775871",
  appId: "1:324420775871:web:b0371a1561be77b085fb0a",
  measurementId: "G-CCQSKNZKKW"
};

const app = initializeApp(firebaseConfig, "SessionManager"); // Unique name to avoid conflicts if firebase.js initializes
const db = getFirestore(app);

const SESSION_KEY = "waec_session";
const DEVICE_ID_KEY = "vision_device_id";

// Helpers
function getDeviceFingerprint() {
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
  else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  let os = "Unknown OS";
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "MacOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("like Mac")) os = "iOS";

  return `${browser} on ${os}`;
}

function getSessionUser() {
  const s = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
}

// 1. Register Session on Load
async function registerAndListenToSession() {
  const user = getSessionUser();
  if (!user || !user.email) return;
  const emailLower = user.email.toLowerCase();

  // Generate or retrieve Device ID
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = "dev_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  const sessionRef = doc(db, "users", emailLower, "sessions", deviceId);
  
  // Register session
  await setDoc(sessionRef, {
    deviceId,
    deviceInfo: getDeviceFingerprint(),
    lastActive: new Date().toISOString(),
    status: 'active'
  }, { merge: true });

  // Listen for revocation (Kill Switch)
  onSnapshot(sessionRef, (docSnap) => {
    if (docSnap.exists() && docSnap.data().status === 'revoked') {
      alert("Your session has been revoked from another device. You will be logged out.");
      if (typeof window.handleLogout === 'function') {
        window.handleLogout();
      } else {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login.html';
      }
    }
  });
}

// 2. Load UI
window.loadActiveSessions = async function() {
  const user = getSessionUser();
  if (!user || !user.email) return;
  const emailLower = user.email.toLowerCase();
  const currentDeviceId = localStorage.getItem(DEVICE_ID_KEY);

  const listEl = document.getElementById("deviceSessionsList");
  if (!listEl) return;
  listEl.innerHTML = "<div style='color: var(--text-muted); font-size: 0.9rem;'>Loading active sessions...</div>";

  try {
    const snap = await getDocs(collection(db, "users", emailLower, "sessions"));
    listEl.innerHTML = "";
    
    let activeCount = 0;
    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.status !== 'active') return;
      activeCount++;

      const isCurrent = data.deviceId === currentDeviceId;
      const date = new Date(data.lastActive);
      const timeStr = date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      const div = document.createElement("div");
      div.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;";
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: ${isCurrent ? '#10b981' : '#94a3b8'};">
              ${data.deviceInfo.includes('iOS') || data.deviceInfo.includes('Android') ? 
                '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line>' : 
                '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>'
              }
            </svg>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.95rem; color: #fff;">
              ${data.deviceInfo}
              ${isCurrent ? '<span style="font-size: 0.7rem; background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 2px 6px; border-radius: 10px; margin-left: 8px; vertical-align: middle;">Current</span>' : ''}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Last active: ${timeStr}</div>
          </div>
        </div>
        ${!isCurrent ? `<button onclick="window.revokeSpecificSession('${data.deviceId}')" style="background: transparent; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 6px; padding: 6px 12px; font-size: 0.8rem; cursor: pointer; transition: 0.2s;">Revoke</button>` : ''}
      `;
      listEl.appendChild(div);
    });

    if (activeCount === 0) {
      listEl.innerHTML = "<div style='color: var(--text-muted); font-size: 0.9rem;'>No active sessions found.</div>";
    } else {
      const summary = document.createElement("div");
      summary.style.cssText = "font-size: 0.85rem; color: #10b981; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;";
      summary.textContent = `${activeCount} Device${activeCount > 1 ? 's' : ''} Logged In`;
      listEl.insertBefore(summary, listEl.firstChild);
    }
  } catch (err) {
    console.warn("Error loading sessions:", err);
    listEl.innerHTML = "<div style='color: #ef4444; font-size: 0.9rem;'>Failed to load sessions.</div>";
  }
};

// 3. Revoke Logic
window.revokeSpecificSession = async function(deviceIdToRevoke) {
  if (!confirm("Are you sure you want to log out of this device?")) return;
  
  const user = getSessionUser();
  if (!user || !user.email) return;
  
  try {
    const sessionRef = doc(db, "users", user.email.toLowerCase(), "sessions", deviceIdToRevoke);
    await updateDoc(sessionRef, { status: 'revoked' });
    window.loadActiveSessions(); // refresh
  } catch (err) {
    console.error("Failed to revoke:", err);
    alert("Could not revoke the session. Please try again.");
  }
};

window.promptRevokeAllSessions = async function() {
  const user = getSessionUser();
  if (!user || !user.email) return;

  const currentDeviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!confirm("Are you sure you want to log out of all other devices?")) return;

  try {
    const snap = await getDocs(collection(db, "users", user.email.toLowerCase(), "sessions"));
    snap.forEach(async (docSnap) => {
      const data = docSnap.data();
      if (data.deviceId !== currentDeviceId && data.status === 'active') {
        await updateDoc(docSnap.ref, { status: 'revoked' });
      }
    });
    alert("Successfully logged out of all other devices.");
    window.loadActiveSessions();
  } catch (err) {
    console.error("Error revoking all:", err);
    alert("Failed to log out of all devices.");
  }
};

// Start listening immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registerAndListenToSession);
} else {
  registerAndListenToSession();
}

// Hook into the Settings UI so it reloads when the tab is opened
const originalSwitch = window.switchSettingsTab;
if (typeof originalSwitch === 'function') {
  window.switchSettingsTab = function(tabId, el) {
    originalSwitch(tabId, el);
    if (tabId === 'security') {
      window.loadActiveSessions();
    }
  };
} else {
  // Fallback observer
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.target.id === 'pane-security' && m.target.classList.contains('active')) {
        window.loadActiveSessions();
      }
    });
  });
  setTimeout(() => {
    const pane = document.getElementById('pane-security');
    if (pane) observer.observe(pane, { attributes: true, attributeFilter: ['class'] });
  }, 1000);
}
