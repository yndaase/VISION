/* =====================================================
   WAEC 2026  Shared Auth Module
   Handles: localStorage accounts, session management,
            Google Sign-In callback, login/signup logic,
            page-level auth guard (checkAuth)
   ===================================================== */

const AUTH_KEY = "waec_users";
const SESSION_KEY = "waec_session";
const STATS_KEY = "waec_stats";

//  Storage helpers
function getUsers() {
  return JSON.parse(localStorage.getItem(AUTH_KEY) || "[]");
}
function saveUsers(u) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(u));
  // Background cloud sync (Vercel Blob legacy)
  syncWithCloud(u);
}

/**
 * Firebase-backed helper: save a user to both Firestore and localStorage cache.
 */
async function fbSaveUserAndCache(user) {
  // 1. Update localStorage cache
  const users = getUsers();
  const idx = users.findIndex(u => u.email === user.email);
  if (idx === -1) users.push(user); else users[idx] = { ...users[idx], ...user };
  localStorage.setItem(AUTH_KEY, JSON.stringify(users));
  // 2. Push to Firestore
  if (typeof window.fbSaveUser === 'function') {
    await window.fbSaveUser(user);
  }
}

/**
 * Firebase-backed helper: get a user from Firestore, fall back to localStorage.
 */
async function fbGetUserWithFallback(email) {
  // Try Firestore first
  if (typeof window.fbGetUser === 'function') {
    try {
      const cloudUser = await window.fbGetUser(email);
      if (cloudUser) {
        // ENFORCE EXPIRY DOWNGRADE: If cloud still says Pro but they are expired, downgrade cloud.
        const originalRole = cloudUser.role;
        const verifiedUser = verifyUserSchema(cloudUser);
        
        if (originalRole === 'pro' && verifiedUser.role === 'student') {
            console.log(`[Auth] ☁️ Subscription expired. Downgrading ${email} to student in Firestore.`);
            await window.fbUpdateUser(email, { role: 'student' });
        }

        // Refresh local cache with cloud data
        const users = getUsers();
        const idx = users.findIndex(u => u.email === verifiedUser.email);
        if (idx === -1) users.push(verifiedUser); else users[idx] = { ...users[idx], ...verifiedUser };
        localStorage.setItem(AUTH_KEY, JSON.stringify(users));
        return verifiedUser;
      }
    } catch(e) {
      console.warn('[Auth] Firestore lookup failed, using local cache.');
    }
  }
  // Fall back to localStorage
  return getUsers().find(u => u.email === email && u.provider === 'email') || null;
}

/**
 * Cloud Sync: Pushes local state to Vercel/Azure and pulls global updates.
 */
async function syncWithCloud(localUsers = getUsers()) {
  try {
    const res = await fetch('/api/auth-core', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'sync-users', localUsers })
    });
    const data = await res.json();
    if (data.users) {
      // Update local with merged cloud state WITHOUT triggering save (infinite loop)
      localStorage.setItem(AUTH_KEY, JSON.stringify(data.users));
      
      // Update active session if role changed in cloud
      const session = getSession();
      if (session) {
        const cloudMe = data.users.find(u => u.email === session.email);
        if (cloudMe && cloudMe.role !== session.role) {
          session.role = cloudMe.role;
          setSession(session);
        }
      }
    }
  } catch (err) {
    console.warn('[Auth Sync] Network issue, using local state.', err.message);
  }
}
function getSession() {
  // Read from sessionStorage first, then fall back to localStorage (survives refresh)
  const sessionString = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (!sessionString) return null;
  
  try {
    const rawSession = JSON.parse(sessionString);
    // CRITICAL: Always re-verify schema to catch expiry mid-session
    return verifyUserSchema(rawSession);
  } catch (e) {
    return null;
  }
}
function setSession(user) {
  const verified = verifyUserSchema(user);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(verified));
  localStorage.setItem(SESSION_KEY, JSON.stringify(verified));
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

function getStats() {
  const session = getSession();
  if (!session || !session.email) return { answered: 0, correct: 0 };
  const userStatsKey = `${STATS_KEY}_${session.email}`;
  return JSON.parse(
    localStorage.getItem(userStatsKey) || '{"answered":0,"correct":0}',
  );
}
function saveStats(s) {
  const session = getSession();
  if (!session || !session.email) return;
  const userStatsKey = `${STATS_KEY}_${session.email}`;
  localStorage.setItem(userStatsKey, JSON.stringify(s));
}

//  Schema & Migration
/**
 * Ensures user objects have the correct field names and types.
 * Solves "Can't login" issues caused by property renaming.
 */
function verifyUserSchema(user) {
  if (!user) return null;
  const emailLower = (user.email || "").toString().trim().toLowerCase();
  // Migrate 2FA property if missing on object but present as legacy
  if (user.hasOwnProperty("twoFactorEnabled")) {
    user.twoFAEnabled = user.twoFactorEnabled;
    delete user.twoFactorEnabled;
  }
  // Ensure default booleans/timestamps
  user.twoFAEnabled = !!user.twoFAEnabled;
  user.isVerified = !!user.isVerified;
  user.subscriptionExpiry = user.subscriptionExpiry || 0;

  // Permanent Pro Overrides (named accounts)
  if (emailLower === "bertina@vision.edu") {
    user.permanentPro = true;
    user.subscriptionExpiry = Math.max(user.subscriptionExpiry || 0, Date.now() + (100 * 365 * 24 * 60 * 60 * 1000));
    if (user.role !== "enterprise" && user.role !== "admin") user.role = "pro";
  }

  // ABSOLUTE ADMIN OVERRIDE (Permanent Pro)
  const isAdmin = user.role === 'admin';
  const isPermanentPro = !!user.permanentPro;
  
  // Calculate Effective Role
  const now = Date.now();
  const isPaidPro = (user.subscriptionExpiry || 0) > now;

  if (isAdmin || isPaidPro || isPermanentPro) {
    user.role = user.role === 'enterprise' ? 'enterprise' : 'pro';
  } else if (user.role !== 'enterprise' && user.role !== 'admin') {
    // Revert role to standard if everything expired (unless it's a fixed role)
    user.role = 'student';
  }

  return user;
}

/**
 * Checks if a user is currently Pro (Paid or Admin)
 */
function isProUser(user = getSession()) {
  if (!user) return false;
  if (user.role === 'enterprise') return true; // Enterprise is implicitly Pro
  const now = Date.now();
  const isAdmin = user.role === 'admin';
  const isPaidPro = (user.subscriptionExpiry || 0) > now;
  return isAdmin || isPaidPro || !!user.permanentPro;
}

/**
 * Checks if a user is an Enterprise/Institutional Admin
 */
function isEnterpriseUser(user = getSession()) {
  if (!user) return false;
  return user.role === 'enterprise';
}

// Trial Decommissioned: strictly paid or institutional access model now active.

function migrateLegacyData() {
  try {
    const users = getUsers();
    let changed = false;

    // 1. Migrate Users Array
    const migratedUsers = users.map((u) => {
      if (u.hasOwnProperty("twoFactorEnabled")) {
        u.twoFAEnabled = u.twoFactorEnabled;
        delete u.twoFactorEnabled;
        changed = true;
      }
      return u;
    });

    if (changed) saveUsers(migratedUsers);

    // 2. Migrate Active Session
    let session = getSession();
    if (session) {
      if (session.hasOwnProperty("twoFactorEnabled")) {
        session.twoFAEnabled = session.twoFactorEnabled;
        delete session.twoFactorEnabled;
        setSession(session);
      }
    }

    console.log("[Auth] Database migration checked.");
  } catch (e) {
    console.error("[Auth] Migration error:", e);
  }
}

//  Secure SHA-256 Hashing
async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hashArray = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

//  Legacy simple hash (for migration only)
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h.toString(16);
}

//  Auth guard  call on every protected page
function checkAuth() {
  const session = getSession();
  if (!session) {
    const isRobotics = window.location.pathname.includes("robotics");
    window.location.href = isRobotics ? "/robotics-login" : "/login";
    return null;
  }
  
  // Background Security Check (RISC) for Google identities only
  if (session.provider === 'google' && session.sub) {
    validateRevocationStatus(session);
  }
  
  return session;
}

/**
 * Background verify if session has been revoked by Google RISC events
 */
async function validateRevocationStatus(session) {
  try {
    const res = await fetch('/api/auth-core?type=check-revocation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sub: session.sub, email: session.email })
    });
    const data = await res.json();
    if (data.revoked) {
      console.warn('[Security] Account Revocation Detected via RISC. Force Logout.');
      handleLogout();
    }
  } catch (err) {
    console.warn('[Security] RISC Check failed:', err.message);
  }
}

//  Redirect helpers
function goToDashboard() {
  const session = getSession();
  const isRobotics = window.location.pathname.includes("robotics");
  
  if (isRobotics) {
    window.location.href = "/robotics-dashboard";
    return;
  }

  if (session && session.role === 'teacher') {
    window.location.href = "/teacher-dashboard.html";
  } else if (session && session.role === 'admin') {
    window.location.href = "/admin";
  } else {
    window.location.href = "/dashboard";
  }
}
function goToLogin() {
  window.location.href = "/login";
}

//  Logout
function handleLogout() {
  clearSession();
  const isRobotics = window.location.pathname.includes("robotics");
  window.location.href = isRobotics ? "/robotics-login" : "/login";
}
// REDO: Guarantee global availability for all HTML event handlers
window.handleLogout = handleLogout;

//  2FA State Helpers
function is2FAEnabled(email) {
  const user = getUsers().find((u) => u.email === email);
  return user ? !!user.twoFAEnabled : false;
}
function toggle2FA(email, enabled) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx !== -1) {
    users[idx].twoFAEnabled = enabled;
    saveUsers(users);

    // Sync to Firestore
    if (typeof window.fbUpdateUser === 'function') {
      window.fbUpdateUser(email, { twoFAEnabled: enabled }).catch(e => console.warn('[Firebase] 2FA sync failed:', e));
    }

    // Update session
    const session = getSession();
    if (session && session.email === email) {
      session.twoFAEnabled = enabled;
      setSession(session);
    }

    // Update UI status (if standard elements exist)
    updateSecurityStatusUI(enabled);
  }
}

function updateSecurityStatusUI(enabled) {
  // 1. Standard Dashboard Elements
  const statusEl = document.getElementById("securityStatus");
  const toggleEl = document.getElementById("tfaToggle");

  if (statusEl) {
    statusEl.innerHTML = enabled
      ? '<span class="status-secure"> Level 2 Protected (2FA Active)</span>'
      : '<span class="status-warn"> Level 1 Protected (Standard)</span>';
  }
  if (toggleEl) {
    toggleEl.classList.toggle("active", enabled);
  }

  // 2. Robotics Dashboard Elements
  const robMsgEl = document.getElementById("twoFAMsg");
  const robCheckEl = document.getElementById("toggle2FACheck");

  if (robMsgEl) {
    robMsgEl.style.display = "block";
    if (enabled) {
      robMsgEl.textContent =
        " Two-Factor Authentication is now ENABLED. You'll receive a code via email on every login.";
      robMsgEl.style.color = "#4ade80";
      robMsgEl.style.background = "rgba(34,197,94,0.08)";
    } else {
      robMsgEl.textContent = " Two-Factor Authentication is now DISABLED.";
      robMsgEl.style.color = "#f87171";
      robMsgEl.style.background = "rgba(248,113,113,0.08)";
    }
  }
  if (robCheckEl) {
    robCheckEl.checked = enabled;
  }
}

//  Shared Logic
function unifiedToggle2FA(enabled) {
  const session = getSession();
  if (!session) return;
  toggle2FA(session.email, enabled);
}

//  Unified Password Management
window.unifiedChangePassword = async function() {
  const session = getSession();
  const msg = document.getElementById("passChangeMsg");
  const curr = document.getElementById("setCurrentPass")?.value;
  const newP = document.getElementById("setNewPass")?.value;
  const conf = document.getElementById("setConfirmPass")?.value;

  function showMsg(text, ok) {
    if (!msg) {
      alert(text);
      return;
    }
    msg.style.display = "block";
    msg.textContent = text;
    msg.style.color = ok ? "#4ade80" : "#f87171";
    msg.style.background = ok
      ? "rgba(34,197,94,0.08)"
      : "rgba(248,113,113,0.08)";
  }

  if (!session) return showMsg("Not authenticated.", false);
  if (!curr) return showMsg("Enter your current password.", false);
  if (!newP || newP.length < 6)
    return showMsg("New password must be at least 6 characters.", false);
  if (newP !== conf) return showMsg("Passwords do not match.", false);

  const users = getUsers();
  const idx = users.findIndex((u) => u.email === session.email);
  if (idx === -1) return showMsg("Account not found.", false);
  if (users[idx].hash !== simpleHash(curr))
    return showMsg("Current password is incorrect.", false);

  const newHash = simpleHash(newP);
  users[idx].hash = newHash;
  saveUsers(users);

  // Sync new password hash to Firestore
  if (typeof window.fbUpdateUser === 'function') {
    window.fbUpdateUser(session.email, { hash: newHash }).catch(e => console.warn('[Firebase] Password sync failed:', e));
  }

  showMsg(" Password updated successfully! Please log in again.", true);
  ["setCurrentPass", "setNewPass", "setConfirmPass"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  setTimeout(() => {
    handleLogout();
  }, 2500);
}

window.handle2FAToggle = function() {
  const session = getSession();
  if (!session) return;

  const current = is2FAEnabled(session.email);
  toggle2FA(session.email, !current);
}

window.saveProfileChanges = async function() {
    const session = getSession();
    if (!session || !session.email) return;

    const btn = document.getElementById("saveProfileBtn");
    const phoneInput = document.getElementById("settingsPhone");
    if (!phoneInput) return;

    const phone = phoneInput.value.trim();
    if (phone && !phone.startsWith("+")) {
        alert("Tactical Error: Please include country code with '+' (e.g. +233)");
        return;
    }

    btn.disabled = true;
    btn.innerText = "SYNCHRONIZING...";

    try {
        let cloudSyncOk = true;
        if (typeof window.fbUpdateUser === 'function') {
            // Update Firestore with phone AND auto-opt-in for WhatsApp
            const res = await window.fbUpdateUser(session.email, { 
                phone: phone,
                waOptIn: !!phone // Automatically opt-in if phone is provided
            });
            
            // If we still get a sync error, it might be a missing session
            if (res && !res.success) {
                 console.error("[Auth] Firestore Sync failed:", res.error);
                 if ((res.error || "").toLowerCase().includes("missing or insufficient permissions")) {
                   let pw = "";
                   try {
                     const ts = Number(sessionStorage.getItem("waec_login_pw_ts") || "0");
                     const cached = sessionStorage.getItem("waec_login_pw") || "";
                     if (cached && Date.now() - ts < 5 * 60 * 1000) pw = cached;
                   } catch (e) {}

                   if (!pw) {
                     pw = prompt("Re-enter your password to sync with Firebase:") || "";
                   }

                   if (pw && typeof window.fbSignIn === 'function') {
                     const authRes = await window.fbSignIn(session.email, pw);
                     if (!authRes || !authRes.success) {
                       throw new Error("Firebase Auth sign-in failed. Please log out and log back in.");
                     }

                     const retry = await window.fbUpdateUser(session.email, { 
                       phone: phone,
                       waOptIn: !!phone
                     });
                     if (!retry || !retry.success) {
                       cloudSyncOk = false;
                     }
                   } else {
                     cloudSyncOk = false;
                   }
                 }
                 if (!cloudSyncOk) {
                   console.warn("[Auth] Falling back to local profile save only.");
                 } else {
                   throw new Error(res.error);
                 }
            }
            
            // Update local session for immediate UI reflection
            session.phone = phone;
            session.waOptIn = !!phone;
            setSession(session);

            // Also update local users array so admin panel sees the phone
            try {
                const users = getUsers();
                const idx = users.findIndex(u => u.email === session.email);
                if (idx !== -1) {
                    users[idx].phone = phone;
                    users[idx].waOptIn = !!phone;
                    saveUsers(users);
                }
            } catch(e) {}
            
            if (typeof showToast === 'function') {
                showToast(cloudSyncOk ? "Profile identity synchronized with Firebase" : "Profile saved locally. Firebase sync pending.");
            } else {
                alert(cloudSyncOk ? "Profile identity synchronized." : "Profile saved locally. Firebase sync pending.");
            }
            
            // Refresh settings UI to show updated state (badges, etc)
            openSettings();
        }
    } catch(e) {
        console.error("[Auth] Profile save failed:", e);
        alert("Sync error. Please try again.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Save Profile Changes";
    }
};

window.handleWAToggle = async function() {
    const session = getSession();
    if (!session || !session.email) return;

    const el = document.getElementById("waToggle");
    const active = el.classList.contains("active");
    const newState = !active;

    // UI Feedback
    el.classList.toggle("active", newState);

    // Persist to local session immediately
    session.waOptIn = newState;
    setSession(session);

    // Update local users array
    try {
        const users = getUsers();
        const idx = users.findIndex(u => u.email === session.email);
        if (idx !== -1) {
            users[idx].waOptIn = newState;
            saveUsers(users);
        }
    } catch(e) {}

    // Sync to Firebase
    try {
        if (typeof window.fbSetWAOptIn === 'function') {
            await window.fbSetWAOptIn(session.email, newState);
            console.log("[Auth] WhatsApp Opt-in synced to Firebase:", newState);
        }
    } catch(e) {
        console.error("[Auth] WA Toggle Firebase sync failed:", e);
        el.classList.toggle("active", active); // Rollback UI
        session.waOptIn = active; // Rollback session
        setSession(session);
    }
};

//  Settings Immersive Logic
window.openSettings = function() {
  console.log("[Settings] Opening immersive workspace");
  const session = typeof getSession === 'function' ? getSession() : null;
  if (!session) return;

  const modal = document.getElementById("settingsModal");
  if (!modal) return;

  // Populate user info
  const nameEl = document.getElementById("settingsName");
  const emailEl = document.getElementById("settingsEmail");
  const avatarEl = document.getElementById("settingsAvatar");
  
  if (nameEl) nameEl.textContent = session.name;
  if (emailEl) emailEl.textContent = session.email;
  if (avatarEl) avatarEl.textContent = session.name.charAt(0).toUpperCase();

  // Immediate local state (fast path — no waiting for Firebase)
  const phoneEl = document.getElementById("settingsPhone");
  if (phoneEl) phoneEl.value = session.phone || "";

  const waEl = document.getElementById("waToggle");
  if (waEl) waEl.classList.toggle("active", !!session.waOptIn);

  const waStatusText = document.getElementById("waStatusText");
  if (waStatusText) {
      waStatusText.innerText = session.phone ? "WhatsApp Linked" : "Not Linked";
      waStatusText.style.color = session.phone ? "#10b981" : "var(--text-muted)";
  }

  // Sync Profile state from Firestore (Ground Truth — overwrites local when ready)
  if (typeof window.fbGetUser === 'function') {
      window.fbGetUser(session.email).then(userData => {
          if (userData) {
              const phoneEl = document.getElementById("settingsPhone");
              if (phoneEl) phoneEl.value = userData.phone || "";
              
              const waEl = document.getElementById("waToggle");
              if (waEl) waEl.classList.toggle("active", !!userData.waOptIn);
              
              const waStatusText = document.getElementById("waStatusText");
              if (waStatusText) {
                  waStatusText.innerText = userData.phone ? "WhatsApp Linked" : "Not Linked";
                  waStatusText.style.color = userData.phone ? "#10b981" : "var(--text-muted)";
              }
          }
      });
  }

  // Sync 2FA state
  if (typeof is2FAEnabled === 'function') {
    const enabled = is2FAEnabled(session.email);
    updateSecurityStatusUI(enabled);
  }

  // Sync Verification State
  updateVerificationUI(session.isVerified);

  // Show immersive view
  modal.classList.add("visible");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden"; 

  if (typeof updateSettingsSubUI === "function") {
    updateSettingsSubUI();
  }
};

window.closeSettings = function() {
  const modal = document.getElementById("settingsModal");
  if (modal) {
    modal.classList.remove("visible");
    modal.style.display = "none";
    document.body.style.overflow = ""; 
  }
};

window.switchSettingsTab = function(tabId, btn) {
  document.querySelectorAll('.settings-nav-item').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // Update panes
  document.querySelectorAll('.settings-pane').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`pane-${tabId}`);
  if (target) target.classList.add('active');
}

/**
 * Generate a 6-digit parent access code for the current user.
 * Stored in localStorage with 24-hour expiry.
 */
window.generateParentCode = async function() {
  const session = getSession();
  if (!session) return null;

  let code;
  
  // Try Firebase first
  if (typeof window.generateLinkingCode === 'function') {
    code = await window.generateLinkingCode(session.email, session.name, session.school);
  }

  // Fallback to local storage if Firebase fails or is offline
  if (!code) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const PARENT_CODE_KEY = 'vision_parent_codes';
    let codes = [];
    try { codes = JSON.parse(localStorage.getItem(PARENT_CODE_KEY)) || []; } catch(e) { codes = []; }
    codes = codes.filter(c => c.childEmail !== session.email);
    codes.push({
      code: code,
      childEmail: session.email,
      childName: session.name || 'Student',
      childSchool: session.school || 'Ghana SHS',
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });
    localStorage.setItem(PARENT_CODE_KEY, JSON.stringify(codes));
  }

  // Update UI if the display element exists
  const codeDisplay = document.getElementById('parentCodeDisplay');
  const codeValue = document.getElementById('parentCodeValue');
  if (codeDisplay) codeDisplay.style.display = 'block';
  if (codeValue) codeValue.textContent = code;
  const codeMsg = document.getElementById('parentCodeMsg');
  if (codeMsg) {
    codeMsg.textContent = 'Share this code with your parent/guardian. It expires in 15 minutes.';
    codeMsg.style.display = 'block';
  }

  return code;
}

function handleModalOutsideClick(event) {
  // Immersive view doesn't close on outside click by design (it's full screen)
}

/**
 * Handle Face Verification — Single Selfie Flow
 */
let bioStream = null;

window.handleFaceVerification = async function() {
    const session = getSession();
    if (!session) return;

    const modal = document.getElementById("biometricModal");
    modal.style.display = "flex";

    // Update UI for selfie-only mode
    document.getElementById("bioModalTitle").innerText = "Face Verification";
    document.getElementById("bioModalDesc").innerText = "Look directly at the camera. Ensure good lighting.";
    if (document.getElementById("idGuide")) document.getElementById("idGuide").style.display = "none";
    if (document.getElementById("faceGuide")) document.getElementById("faceGuide").style.display = "block";
    if (document.getElementById("scannerLine")) document.getElementById("scannerLine").style.display = "block";

    try {
        bioStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        document.getElementById("bioVideo").srcObject = bioStream;
    } catch (err) {
        console.error("Camera Error:", err);
        alert("Camera access denied. Verification requires camera permission.");
        closeBiometricModal();
    }
}

window.captureBiometric = async function() {
    const video = document.getElementById("bioVideo");
    const canvas = document.getElementById("bioCanvas");
    const ctx = canvas.getContext("2d");
    const btn = document.getElementById("captureBtn");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL("image/jpeg", 0.85);

    btn.disabled = true;
    btn.innerText = "VERIFYING FACE...";

    try {
        const res = await fetch('/api/verify-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selfieBase64: base64 })
        });

        const data = await res.json();

        if (data.success && data.verified) {
            const session = getSession();

            // Update Local State
            session.isVerified = true;
            setSession(session);

            // Update Firebase
            if (typeof window.fbUpdateUser === 'function') {
                await window.fbUpdateUser(session.email, {
                    isVerified: true,
                    verifiedAt: new Date().toISOString()
                });
            }

            closeBiometricModal();
            alert("✅ Face Verified! Your verified badge is now active.");
            location.reload();
        } else {
            alert("Verification Failed: " + (data.error || "Could not detect a clear face. Try again."));
        }
    } catch (err) {
        console.error("Verification error:", err);
        alert("Connection error. Please check your internet and try again.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> Capture Selfie`;
    }
}

window.closeBiometricModal = function() {
    if (bioStream) {
        bioStream.getTracks().forEach(track => track.stop());
        bioStream = null;
    }
    document.getElementById("biometricModal").style.display = "none";
}

function updateVerificationUI(isVerified) {
    const unverifiedState = document.getElementById("verifyUnverifiedState");
    const verifiedState = document.getElementById("verifyVerifiedState");
    const badge = document.getElementById("settingsVerifiedBadge");
    const heroBadge = document.getElementById("heroVerifiedBadge");
    const navBadge = document.getElementById("navVerifiedBadge");
    
    if (isVerified) {
        if (unverifiedState) unverifiedState.style.display = "none";
        if (verifiedState) verifiedState.style.display = "block";
        if (badge) badge.style.display = "inline-flex";
        if (heroBadge) heroBadge.style.display = "inline-flex";
        if (navBadge) navBadge.style.display = "inline-flex";
    } else {
        if (unverifiedState) unverifiedState.style.display = "block";
        if (verifiedState) verifiedState.style.display = "none";
        if (badge) badge.style.display = "none";
        if (heroBadge) heroBadge.style.display = "none";
        if (navBadge) navBadge.style.display = "none";
    }
}

window.checkVerificationAndGo = function(url) {
    const session = getSession();
    if (!session) return;
    
    if (session.isVerified) {
        window.location.href = url;
    } else {
        openSettings();
        if (typeof switchSettingsTab === 'function') {
            const tabs = document.querySelectorAll('.settings-nav-item');
            for(let tab of tabs) {
                if(tab.textContent.includes('Verification')) {
                    switchSettingsTab('verification', tab);
                    break;
                }
            }
        }
        alert("Verification Required: You must complete Face Verification to access this feature.");
    }
}

//  Google Sign-In callback (GIS)
async function handleGoogleCredential(response) {
  try {
    // Decode JWT payload (base64url, middle part)
    const payload = JSON.parse(
      atob(
        response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
      ),
    );
    const user = {
      name: payload.name || "Google User",
      email: payload.email || "",
      picture: payload.picture || "",
      provider: "google",
      sub: payload.sub,
    };

    // Upsert user in Firestore + local cache
    await fbSaveUserAndCache(user);

    setSession(user);
    showAuthSuccess("Welcome, " + user.name + "! ");
    
    // Pull latest role/subscription from Firestore
    const cloudUser = await fbGetUserWithFallback(user.email);
    if (cloudUser) setSession(verifyUserSchema({ ...user, ...cloudUser }));
    
    setTimeout(goToDashboard, 900);
  } catch (e) {
    console.error("Google Sign-In error:", e);
    showAuthSuccess("Google sign-in failed. Please use email instead.");
  }
}

//  Google Sign-In helper
// (Using official GIS script load, no programmatic trigger needed)

//  Email Login
async function handleLogin(e) {
  e.preventDefault();
  clearErrors();

  const email = document
    .getElementById("loginEmail")
    .value.trim()
    .toLowerCase();
  const pass = document.getElementById("loginPass").value;
  let valid = true;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markInputError(
      "loginEmail",
      "errLoginEmail",
      "Enter a valid email address.",
    );
    valid = false;
  }
  if (!pass) {
    markInputError("loginPass", "errLoginPass", "Please enter your password.");
    valid = false;
  }
  if (!valid) return;

  // 1. Fetch from Firestore first, fall back to localStorage
  const loginBtn = document.getElementById("loginSubmit");
  if (loginBtn) loginBtn.innerHTML = "<span>Checking credentials...</span>";
  
  const user = await fbGetUserWithFallback(email);
  
  if (!user) {
    if (loginBtn) loginBtn.innerHTML = "<span>Sign In</span>";
    setError("errLoginGeneral", "Invalid email or password. Please try again.");
    const form = document.getElementById("loginForm");
    if (form) { form.classList.add("form-shake"); setTimeout(() => form.classList.remove("form-shake"), 500); }
    return;
  }

  if (loginBtn) loginBtn.innerHTML = "<span>Sign In</span>";

  const inputHash = await sha256(pass);
  const legacyHash = simpleHash(pass);

  let authSuccess = false;
  if (user.hash === inputHash) {
    authSuccess = true;
  } else if (user.hash === legacyHash) {
    // Soft Migration: Upgrade to SHA-256 on successful login
    user.hash = inputHash;
    await fbSaveUserAndCache(user);
    authSuccess = true;
    console.log("[Auth] User password upgraded to SHA-256 security.");
  }

  if (!authSuccess) {
    setError("errLoginGeneral", "Invalid email or password. Please try again.");
    const form = document.getElementById("loginForm");
    if (form) { form.classList.add("form-shake"); setTimeout(() => form.classList.remove("form-shake"), 500); }
    return;
  }

  try {
    sessionStorage.setItem("waec_login_pw", pass);
    sessionStorage.setItem("waec_login_pw_ts", String(Date.now()));
  } catch (e) {}

  const waitFor = (fn, timeoutMs = 4000, stepMs = 100) => new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (fn()) return resolve(true);
      if (Date.now() - start >= timeoutMs) return resolve(false);
      setTimeout(tick, stepMs);
    };
    tick();
  });

  const ensureFirebaseAuth = async (email, pass) => {
    const ok = await waitFor(() => typeof window.fbSignIn === "function");
    if (!ok) return { success: false, error: "Firebase not ready" };
    return await window.fbSignIn(email, pass);
  };

  // DEEP 2FA INTEGRATION: Check if 2FA is enabled
  if (user.twoFAEnabled) {
    try {
      sessionStorage.setItem("waec_login_pw", pass);
      sessionStorage.setItem("waec_login_pw_ts", String(Date.now()));
    } catch (e) {}
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    saveResetCode(email, code);
    const hiddenEl = document.getElementById("2faEmailHidden");
    if (hiddenEl) hiddenEl.value = email;
    const sendBtn = document.getElementById("loginSubmit");
    if (sendBtn) sendBtn.innerHTML = "<span>Verifying Identity...</span>";
    sendEmailCode(user.email, code, "2fa", user.name).then((result) => {
      if (sendBtn) sendBtn.innerHTML = "<span>Sign In</span>";
      switchTab("2fa");
      if (!result.success) {
        const fallbackBox = document.getElementById("2faCodeFallback");
        if (fallbackBox) { fallbackBox.textContent = "Identity Code: " + code; fallbackBox.style.display = "block"; }
      }
    });
    return;
  }

  try {
    const fb = await ensureFirebaseAuth(email, pass);
    if (!fb || !fb.success) {
      console.warn("[Auth] Firebase Silent Auth failed:", fb?.error);
    }
  } catch (e) {}

  setSession(verifyUserSchema(user));
  showAuthSuccess("Welcome back, " + user.name + "! ");
  setTimeout(goToDashboard, 900);
}

//  2FA Verification
async function handle2FAVerification(e) {
  e.preventDefault();
  clearErrors();

  const email = (document.getElementById("2faEmailHidden").value || "")
    .trim()
    .toLowerCase();
  const code = document.getElementById("2faCodeInput").value.trim();

  if (!/^\d{6}$/.test(code)) {
    markInputError(
      "2faCodeInput",
      "err2FACode",
      "Enter the 6-digit numeric code.",
    );
    return;
  }

  const waitFor = (fn, timeoutMs = 4000, stepMs = 100) => new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (fn()) return resolve(true);
      if (Date.now() - start >= timeoutMs) return resolve(false);
      setTimeout(tick, stepMs);
    };
    tick();
  });

  const ensureFirebaseAuth = async (email, pass) => {
    const ok = await waitFor(() => typeof window.fbSignIn === "function");
    if (!ok) return { success: false, error: "Firebase not ready" };
    return await window.fbSignIn(email, pass);
  };

  const storedCode = getStoredResetCode(email);
  if (storedCode !== code) {
    markInputError(
      "2faCodeInput",
      "err2FACode",
      "Invalid or expired security code.",
    );
    return;
  }

  // Clear code and log in
  clearResetCode(email);
  try {
    const ts = Number(sessionStorage.getItem("waec_login_pw_ts") || "0");
    const pw = sessionStorage.getItem("waec_login_pw") || "";
    if (pw && Date.now() - ts < 5 * 60 * 1000) {
      const fb = await ensureFirebaseAuth(email, pw);
      if (!fb || !fb.success) console.warn("[Auth] Firebase Silent Auth failed:", fb?.error);
    }
  } catch (e) {} finally {
    try {
      sessionStorage.removeItem("waec_login_pw");
      sessionStorage.removeItem("waec_login_pw_ts");
    } catch (e) {}
  }
  const user = getUsers().find((u) => u.email === email);
  setSession(user);
  showAuthSuccess("Secure identity verified! Logging in...");
  setTimeout(goToDashboard, 900);
}

//  Email Signup
async function handleSignup(e) {
  e.preventDefault();
  clearErrors();

  const name = document.getElementById("signupName").value.trim();
  const email = document
    .getElementById("signupEmail")
    .value.trim()
    .toLowerCase();
  const pass = document.getElementById("signupPass").value;
  const conf = document.getElementById("signupConfirm").value;
  let valid = true;

  if (name.length < 2) {
    markInputError(
      "signupName",
      "errSignupName",
      "Name must be at least 2 characters.",
    );
    valid = false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markInputError(
      "signupEmail",
      "errSignupEmail",
      "Enter a valid email address.",
    );
    valid = false;
  }
  if (pass.length < 6) {
    markInputError(
      "signupPass",
      "errSignupPass",
      "Password must be at least 6 characters.",
    );
    valid = false;
  }
  if (pass !== conf) {
    markInputError(
      "signupConfirm",
      "errSignupConfirm",
      "Passwords do not match.",
    );
    valid = false;
  }
  if (!valid) return;

  // --- SILENT AUTH BRIDGE FOR SIGNUP ---
  if (typeof window.fbSignIn === 'function') {
    // fbSignIn auto-creates the account if it doesn't exist in Firebase Auth
    await window.fbSignIn(email, pass);
  }


  // Check Firestore first, then local cache
  const existingCloud = await fbGetUserWithFallback(email);
  const existingLocal = getUsers().find(u => u.email === email);
  if (existingCloud || existingLocal) {
    markInputError("signupEmail", "errSignupEmail", "An account with this email already exists.");
    return;
  }

  const hash = await sha256(pass);
  const user = {
    name,
    email,
    hash,
    provider: "email",
    role: "student",
    createdAt: Date.now(),
  };

  // Save to Firestore + localStorage cache
  await fbSaveUserAndCache(user);
  setSession(user);

  showAuthSuccess("Account created! Welcome, " + name + " ");
  setTimeout(goToDashboard, 900);
}


// (Second copy of settings functions removed for unification)

// Global click handler for modal backdrop
window.addEventListener("click", (e) => {
  if (e.target.id === "settingsModal") closeSettings();
});

//  Tab switching
function switchTab(tab) {
  clearErrors();

  const forms = {
    login: document.getElementById("loginForm"),
    signup: document.getElementById("signupForm"),
    forgot: document.getElementById("forgotForm"),
    reset: document.getElementById("resetForm"),
    "2fa": document.getElementById("2faForm"),
  };

  Object.keys(forms).forEach((key) => {
    if (forms[key]) forms[key].classList.toggle("form-active", key === tab);
  });

  const showStandard = tab === "login" || tab === "signup";
  const tabsWrap = document.querySelector(".auth-tabs");
  const dividers = document.querySelectorAll(".auth-divider");
  const googleBtn = document.querySelector(".google-btn-wrap");
  const guestBtn = document.querySelector(".guest-btn");

  if (tabsWrap)
    tabsWrap.style.display =
      tab === "forgot" || tab === "reset" || tab === "2fa" ? "none" : "flex";
  if (googleBtn) googleBtn.style.display = showStandard ? "block" : "none";
  if (guestBtn) guestBtn.style.display = showStandard ? "block" : "none";
  dividers.forEach((el) => (el.style.display = showStandard ? "flex" : "none"));

  if (showStandard) {
    const tLogin = document.getElementById("tabLogin");
    const tSignup = document.getElementById("tabSignup");
    if (tLogin) tLogin.classList.toggle("auth-tab-active", tab === "login");
    if (tSignup) tSignup.classList.toggle("auth-tab-active", tab === "signup");
  }

  // Update Headings
  const title = document.getElementById("authTitle");
  const sub = document.getElementById("authSubtitle");
  if (!title || !sub) return;

  const isRobotics = window.location.pathname.includes("robotics");

  if (tab === "login") {
    title.textContent = isRobotics ? "Team Access" : "Welcome back";
    sub.textContent = isRobotics
      ? "Hardware credentials required."
      : "Sign in to continue your WASSCE prep journey.";
  } else if (tab === "signup") {
    title.textContent = isRobotics ? "Enroll Member" : "Create your account";
    sub.textContent = isRobotics
      ? "Register for the Augusco Robotics team."
      : "Join thousands of Ghana SHS students preparing for 2026.";
  } else if (tab === "forgot") {
    title.textContent = isRobotics ? "Security Recovery" : "Reset Password";
    sub.textContent = isRobotics
      ? "Authorize access code for your team ID."
      : "Don't worry, we'll get you back on track.";
    const eForgot = document.getElementById("forgotEmail");
    if (eForgot && !eForgot.value) {
      const eLogin = document.getElementById("loginEmail");
      if (eLogin && eLogin.value) eForgot.value = eLogin.value;
    }
  } else if (tab === "reset") {
    title.textContent = isRobotics ? "Verify Code" : "Check Your Email";
    sub.textContent = isRobotics
      ? "Enter the secondary authentication code."
      : "You're almost there! Set a new password below.";
  } else if (tab === "2fa") {
    title.textContent = isRobotics ? "Security Check" : "Identity Verifier";
    sub.textContent = isRobotics
      ? "Hardware key required for override."
      : "Multi-factor authentication is active on your account.";
  }
}

//  Errors
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.style.display = msg ? "block" : "none";
  }
}
function clearErrors() {
  document.querySelectorAll(".field-error").forEach((e) => {
    e.textContent = "";
    e.style.display = "none";
  });
  document
    .querySelectorAll(".auth-input")
    .forEach((i) => i.classList.remove("input-error"));
}
function markInputError(inputId, errorId, msg) {
  const inp = document.getElementById(inputId);
  if (inp) inp.classList.add("input-error");
  setError(errorId, msg);
}

//  Password strength
function checkPasswordStrength(val) {
  const bar = document.getElementById("strengthBar");
  const label = document.getElementById("strengthLabel");
  if (!bar) return;
  let score = 0;
  if (val.length >= 6) score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const lvls = [
    { w: "0%", c: "transparent", t: "" },
    { w: "20%", c: "#f87171", t: "Very Weak" },
    { w: "40%", c: "#fb923c", t: "Weak" },
    { w: "60%", c: "#fbbf24", t: "Fair" },
    { w: "80%", c: "#34d399", t: "Strong" },
    { w: "100%", c: "#22c55e", t: "Very Strong" },
  ];
  const l = lvls[score] || lvls[0];
  bar.style.width = l.w;
  bar.style.background = l.c;
  label.textContent = l.t;
  label.style.color = l.c;
}

//  Toggle password visibility
function toggleVisibility(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === "password") {
    inp.type = "text";
    btn.textContent = "";
  } else {
    inp.type = "password";
    btn.textContent = "";
  }
}

//  Success toast
function showAuthSuccess(msg) {
  const toast = document.getElementById("authSuccessToast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("toast-visible");
  setTimeout(() => toast.classList.remove("toast-visible"), 3000);
}

//  Unified Email Sending (Backend API)
async function sendEmailCode(email, code, type = "reset", name = "") {
  try {
    const response = await fetch("/api/auth-core", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "send-code", email, code, authType: type, name }),
    });
    const result = await response.json();
    if (!result.success) {
      console.warn("Email sending failed:", result.error, result.detail);
    }
    return result;
  } catch (err) {
    console.error("Send code network failure:", err);
    return { success: false, error: "Network failure" };
  }
}

// Reset code store with 10-min TTL
const RESET_STORE_KEY = "waec_reset_codes";
function saveResetCode(email, code) {
  const store = JSON.parse(localStorage.getItem(RESET_STORE_KEY) || "{}");
  store[email] = { code, ts: Date.now() };
  localStorage.setItem(RESET_STORE_KEY, JSON.stringify(store));
}
function getStoredResetCode(email) {
  const store = JSON.parse(localStorage.getItem(RESET_STORE_KEY) || "{}");
  const entry = store[email];
  if (!entry) return null;
  if (Date.now() - entry.ts > 10 * 60 * 1000) {
    delete store[email];
    localStorage.setItem(RESET_STORE_KEY, JSON.stringify(store));
    return null;
  }
  return entry.code;
}
function clearResetCode(email) {
  const store = JSON.parse(localStorage.getItem(RESET_STORE_KEY) || "{}");
  delete store[email];
  localStorage.setItem(RESET_STORE_KEY, JSON.stringify(store));
}

async function handleForgotPassword(e) {
  e.preventDefault();
  clearErrors();
  const email = document.getElementById("forgotEmail").value.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markInputError("forgotEmail", "errForgotEmail", "Enter a valid email address.");
    return;
  }

  const btnText = document.getElementById("forgotBtnText");
  const btnArrow = document.getElementById("forgotBtnArrow");
  const submitBtn = document.getElementById("forgotSubmit");
  if (btnText) btnText.textContent = "Looking up account...";
  if (btnArrow) btnArrow.style.display = "none";
  if (submitBtn) submitBtn.disabled = true;

  // ── Look up user: Firebase first, then localStorage ──
  let user = null;
  if (typeof window.fbGetUser === 'function') {
    try { user = await window.fbGetUser(email); } catch(e) {}
  }
  if (!user) {
    // Fall back to localStorage
    const localUsers = getUsers();
    user = localUsers.find(u => u.email === email) || null;
  }

  if (!user) {
    if (btnText) btnText.textContent = "Send Recovery Code";
    if (btnArrow) btnArrow.style.display = "inline";
    if (submitBtn) submitBtn.disabled = false;
    markInputError("forgotEmail", "errForgotEmail", "No account found with this email address.");
    return;
  }

  if (user.provider === "google" && !user.hash) {
    if (btnText) btnText.textContent = "Send Recovery Code";
    if (btnArrow) btnArrow.style.display = "inline";
    if (submitBtn) submitBtn.disabled = false;
    markInputError("forgotEmail", "errForgotEmail", "This account uses Google Sign-In — no password to reset.");
    return;
  }

  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store code in localStorage (10-min TTL)
  saveResetCode(email, code);

  // Also store as resetToken in Firebase (in case user has no local record)
  if (typeof window.fbUpdateUser === 'function') {
    window.fbUpdateUser(email, {
      resetToken: code,
      resetTokenExpiry: Date.now() + 10 * 60 * 1000
    }).catch(() => {});
  }
  // Also persist to local cache
  const localUsers = getUsers();
  const localIdx = localUsers.findIndex(u => u.email === email);
  if (localIdx !== -1) {
    localUsers[localIdx].resetToken = code;
    saveUsers(localUsers);
  }

  // Populate hidden fields for next step
  const hiddenEl = document.getElementById("resetEmailHidden");
  const displayEl = document.getElementById("resetEmailDisplay");
  if (hiddenEl) hiddenEl.value = email;
  if (displayEl) displayEl.textContent = email;

  if (btnText) btnText.textContent = "Sending email...";

  // Send the email via Resend API
  const result = await sendEmailCode(email, code, "reset", user.name || email.split('@')[0]);

  if (btnText) btnText.textContent = "Send Recovery Code";
  if (btnArrow) btnArrow.style.display = "inline";
  if (submitBtn) submitBtn.disabled = false;

  if (result.success) {
    switchTab("reset");
    showAuthSuccess("Recovery code sent to " + email + "! Check your inbox (and spam folder).");
  } else {
    const errEl = document.getElementById("errForgotEmail");
    if (errEl) {
      errEl.textContent = "Failed to send email. Please check your address or try again shortly.";
      errEl.style.display = "block";
    }
    console.error("[Reset] Email send failed:", result.error, result.detail);
  }
}

async function handleResetPassword(e) {
  e.preventDefault();
  clearErrors();

  const email = (document.getElementById("resetEmailHidden")?.value || "").trim().toLowerCase();
  const code = document.getElementById("resetCode")?.value.trim();
  const pass = document.getElementById("resetPass")?.value;

  let valid = true;
  if (!email) {
    setError("errResetCode", "Session expired. Please start over from Forgot Password.");
    return;
  }
  if (!/^\d{6}$/.test(code)) {
    markInputError("resetCode", "errResetCode", "Enter the 6-digit numeric code.");
    valid = false;
  }
  if (!pass || pass.length < 6) {
    markInputError("resetPass", "errResetPass", "New password must be at least 6 characters.");
    valid = false;
  }
  if (!valid) return;

  // ── Verify code: localStorage TTL store OR Firebase resetToken ──
  const localCode = getStoredResetCode(email);

  // If not in local TTL store, check Firebase resetToken
  let cloudToken = null;
  let cloudTokenExpiry = 0;
  if (!localCode && typeof window.fbGetUser === 'function') {
    try {
      const cloudUser = await window.fbGetUser(email);
      if (cloudUser) {
        cloudToken = cloudUser.resetToken || null;
        cloudTokenExpiry = cloudUser.resetTokenExpiry || 0;
      }
    } catch(e) {}
  }

  const localCodeMatches = localCode && localCode === code;
  const cloudCodeMatches = cloudToken && cloudToken === code && Date.now() < cloudTokenExpiry;

  if (!localCodeMatches && !cloudCodeMatches) {
    // Also check localStorage user's resetToken as last fallback
    const localUsers = getUsers();
    const localUser = localUsers.find(u => u.email === email);
    if (!localUser || localUser.resetToken !== code) {
      markInputError("resetCode", "errResetCode", "Incorrect or expired code. Please try again.");
      return;
    }
  }

  // ── Code is valid — update password ──
  const newHash = await sha256(pass);

  // 1. Update localStorage
  const localUsers = getUsers();
  const localIdx = localUsers.findIndex(u => u.email === email);
  let userObj = localUsers[localIdx] || { email, provider: 'email' };
  userObj.hash = newHash;
  delete userObj.resetToken;
  if (localIdx !== -1) {
    localUsers[localIdx] = userObj;
  } else {
    localUsers.push(userObj);
  }
  saveUsers(localUsers);

  // 2. Sync new hash to Firebase
  if (typeof window.fbUpdateUser === 'function') {
    try {
      await window.fbUpdateUser(email, {
        hash: newHash,
        resetToken: null,
        resetTokenExpiry: null
      });
    } catch(e) {
      console.warn('[Reset] Firebase hash sync failed:', e);
    }
  }

  // 3. Clean up code stores
  clearResetCode(email);

  // 4. Set session and redirect
  setSession(verifyUserSchema(userObj));
  showAuthSuccess("Password reset for " + (userObj.name || email) + "! Logging you in… 🎉");
  setTimeout(goToDashboard, 1200);
}

// --- GLOBAL SYSTEM INITIALIZATION ---
async function adminInit() {
  const adminEmail = "admin@visionedu.online";
  const expectedAdminHash = await sha256("Ndaase@2009");

  const entEmail = "school@visionedu.online";
  const expectedEntHash = await sha256("Vision@2026");

  const teacherEmail = "teacher@visionedu.online";
  const expectedTeacherHash = await sha256("Vision@2026");

  const proStudentEmail = "student@visionedu.online";
  const expectedProHash = await sha256("Vision@2026");
  const bertinaEmail = "bertina@vision.edu";
  const expectedBertinaHash = await sha256("BERTINA123");
  const bertinaParentEmail = "bertina.parent@vision.edu";
  const expectedBertinaParentHash = await sha256("PARENT123");

  const systemAccounts = [
    { 
      email: adminEmail, 
      name: "System Architect", 
      role: "admin", 
      hash: expectedAdminHash, 
      provider: "email",
      phoneNumber: "+233267208336",
      requiresPhoneAuth: true 
    },
    { email: entEmail, name: "Vision Academy Admin", role: "enterprise", hash: expectedEntHash, provider: "email", schoolName: "Vision Academy", schoolLogo: "V", schoolCode: "VISION-2026" },
    { email: teacherEmail, name: "Senior Faculty", role: "teacher", hash: expectedTeacherHash, provider: "email", institutionId: entEmail },
    { email: proStudentEmail, name: "Pro Candidate", role: "pro", hash: expectedProHash, provider: "email",
      subscriptionExpiry: Date.now() + (365 * 24 * 60 * 60 * 1000),
      institutionId: entEmail, institutionName: "Vision Academy" },
    { email: bertinaEmail, name: "Bertina", role: "pro", hash: expectedBertinaHash, provider: "email",
      permanentPro: true,
      subscriptionExpiry: Date.now() + (100 * 365 * 24 * 60 * 60 * 1000),
      institutionId: entEmail, institutionName: "Vision Academy" }
  ];

  // 1. Seed localStorage cache
  const users = getUsers();
  for (const account of systemAccounts) {
    const idx = users.findIndex(u => (u.email||'').toLowerCase() === account.email.toLowerCase());
    if (idx === -1) users.push({ ...account, createdAt: Date.now() });
    else { users[idx].role = account.role; users[idx].hash = account.hash; Object.assign(users[idx], account); }
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(users));

  // 2. Seed Firestore (async, non-blocking)
  if (typeof window.adminInitFirebase === 'function') {
    window.adminInitFirebase(systemAccounts).catch(e => console.warn('[Firebase] adminInitFirebase failed:', e));
  }

  // 3. Seed a dedicated parent account linked to Bertina (for Firebase parent dashboard sync)
  const parentAccount = {
    email: bertinaParentEmail,
    name: "Bertina Guardian",
    hash: expectedBertinaParentHash,
    role: "parent",
    provider: "email",
    linkedStudent: {
      email: bertinaEmail,
      name: "Bertina",
      school: "Vision Academy"
    },
    createdAt: Date.now()
  };

  if (typeof window.fbSaveUser === 'function') {
    window.fbSaveUser(parentAccount, 'parent_users').catch(e => console.warn('[Firebase] parent seed failed:', e));
  }
}

/**
 * Validates a school code and links the current student to the institution.
 */
async function joinInstitution(code) {
  const session = getSession();
  if (!session) return { success: false, message: "Authentication required." };

  // Find institution admin — check Firestore first, then local cache
  let institutionAdmin = null;
  if (typeof window.fbGetAllUsers === 'function') {
    try {
      const allUsers = await window.fbGetAllUsers();
      institutionAdmin = allUsers.find(u => u.schoolCode === code.toUpperCase());
    } catch(e) {}
  }
  if (!institutionAdmin) {
    const localUsers = getUsers();
    institutionAdmin = localUsers.find(u => u.schoolCode === code.toUpperCase());
  }

  if (!institutionAdmin) {
    return { success: false, message: "Invalid enrollment code. Please check with your school." };
  }

  const updates = {
    institutionId: institutionAdmin.email,
    institutionName: institutionAdmin.schoolName || "Vision Academy",
    role: 'pro',
    subscriptionExpiry: Date.now() + (365 * 24 * 60 * 60 * 1000)
  };

  // Update localStorage cache
  const users = getUsers();
  const idx = users.findIndex(u => u.email === session.email);
  if (idx !== -1) {
    Object.assign(users[idx], updates);
    saveUsers(users);
  }

  // Update Firestore
  if (typeof window.fbUpdateUser === 'function') {
    await window.fbUpdateUser(session.email, updates);
  }

  // Update active session
  Object.assign(session, updates);
  setSession(session);

  return { success: true };
}

//  Init on page load
document.addEventListener("DOMContentLoaded", () => {
  // Always run migration first to ensure database is in sync
  migrateLegacyData();

  // Bootstrap academic tiers only on auth/admin routes to avoid permission noise on student dashboard.
  const path = (window.location.pathname || "").toLowerCase();
  const shouldRunAdminInit = path.includes("/admin") || path.includes("/login") || !!document.getElementById("loginForm");
  if (shouldRunAdminInit) {
    adminInit().catch(console.error);
  }

  if (document.getElementById("loginForm")) {
    if (getSession()) {
      goToDashboard();
      return;
    }
  }
});

// Bootstrap Firebase Engine (user DB + stats sync)
// Removed redundant dynamic import as firebase.js is loaded via script tag in HTML.

