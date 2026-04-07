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
  // Background cloud sync
  syncWithCloud(u);
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
  return JSON.parse(
    sessionStorage.getItem(SESSION_KEY) ||
      localStorage.getItem(SESSION_KEY) ||
      "null",
  );
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
  // Migrate 2FA property if missing on object but present as legacy
  if (user.hasOwnProperty("twoFactorEnabled")) {
    user.twoFAEnabled = user.twoFactorEnabled;
    delete user.twoFactorEnabled;
  }
  // Ensure default booleans
  user.twoFAEnabled = !!user.twoFAEnabled;
  return user;
}

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
  
  // Background Security Check (RISC)
  if (session.provider === 'google' || session.email) {
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
  const isRobotics = window.location.pathname.includes("robotics");
  window.location.href = isRobotics
    ? "/robotics-dashboard"
    : "/dashboard";
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

function unifiedChangePassword() {
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

  users[idx].hash = simpleHash(newP);
  saveUsers(users);

  showMsg(" Password updated successfully! Please log in again.", true);
  ["setCurrentPass", "setNewPass", "setConfirmPass"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  setTimeout(() => {
    handleLogout();
  }, 2500);
}

function handle2FAToggle() {
  const session = getSession();
  if (!session) return;

  const current = is2FAEnabled(session.email);
  toggle2FA(session.email, !current);
}

//  Settings Modal Logic (Standard Site)
function openSettings() {
  const session = getSession();
  if (!session) return;

  const modal = document.getElementById("settingsModal");
  if (!modal) return;

  // Populate user info
  const nameEl = document.getElementById("settingsName");
  const emailEl = document.getElementById("settingsEmail");
  const avEl = document.getElementById("settingsAvatar");
  if (nameEl) nameEl.textContent = session.name;
  if (emailEl) emailEl.textContent = session.email;
  if (avEl) avEl.textContent = session.name.charAt(0).toUpperCase();

  // Sync 2FA toggle state
  const enabled = is2FAEnabled(session.email);
  updateSecurityStatusUI(enabled);

  // Sync theme button icon in settings
  const themeBtn = document.getElementById("settingsThemeBtn");
  if (themeBtn && window.getTheme) {
    themeBtn.textContent =
      getTheme() === "light" ? "\uD83C\uDF19" : "\u2600\uFE0F";
  }

  // Show modal  don't lock body scroll, overlay handles it
  modal.classList.add("visible");
}

function closeSettings() {
  const modal = document.getElementById("settingsModal");
  if (modal) {
    modal.classList.remove("visible");
  }
}

function handleModalOutsideClick(event) {
  if (event.target === document.getElementById("settingsModal")) {
    closeSettings();
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

    // Upsert user in local store
    const users = getUsers();
    const idx = users.findIndex((u) => u.email === user.email);
    if (idx === -1) users.push(user);
    else users[idx] = { ...users[idx], ...user };
    saveUsers(users);

    setSession(user);
    showAuthSuccess("Welcome, " + user.name + "! ");
    
    // Explicit sync on Google login to fetch Pro status
    await syncWithCloud();
    
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

  const users = getUsers();
  const userIndex = users.findIndex(
    (u) => u.email === email && u.provider === "email",
  );

  if (userIndex === -1) {
    setError("errLoginGeneral", "Invalid email or password. Please try again.");
    const form = document.getElementById("loginForm");
    if (form) {
      form.classList.add("form-shake");
      setTimeout(() => form.classList.remove("form-shake"), 500);
    }
    return;
  }

  const user = users[userIndex];
  const inputHash = await sha256(pass);
  const legacyHash = simpleHash(pass);

  let authSuccess = false;
  if (user.hash === inputHash) {
    authSuccess = true;
  } else if (user.hash === legacyHash) {
    // Soft Migration: Upgrade to SHA-256 on successful login
    user.hash = inputHash;
    users[userIndex] = user;
    saveUsers(users);
    authSuccess = true;
    console.log("[Auth] User password upgraded to SHA-256 security.");
  }

  if (!authSuccess) {
    setError("errLoginGeneral", "Invalid email or password. Please try again.");
    const form = document.getElementById("loginForm");
    if (form) {
      form.classList.add("form-shake");
      setTimeout(() => form.classList.remove("form-shake"), 500);
    }
    return;
  }

  // DEEP 2FA INTEGRATION: Check if 2FA is enabled
  if (user.twoFAEnabled) {
    // Generate code and store for login session
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    saveResetCode(email, code); // reuse reset code store (10-min TTL)

    // Store email for verification step
    const hiddenEl = document.getElementById("2faEmailHidden");
    if (hiddenEl) hiddenEl.value = email;

    //  NEW: Secure API-based 2FA sending
    const sendBtn = document.getElementById("loginSubmit");
    if (sendBtn) sendBtn.innerHTML = "<span>Verifying Identity...</span>";

    sendEmailCode(user.email, code, "2fa", user.name).then((result) => {
      if (sendBtn) sendBtn.innerHTML = "<span>Sign In</span>";
      switchTab("2fa");
      if (!result.success) {
        const fallbackBox = document.getElementById("2faCodeFallback");
        if (fallbackBox) {
          fallbackBox.textContent = "Identity Code: " + code;
          fallbackBox.style.display = "block";
        }
      }
    });
    return;
  }

  setSession(user);
  
  // Explicit sync on login to fetch Pro status
  await syncWithCloud();
  
  showAuthSuccess("Welcome back, " + user.name + "! ");
  setTimeout(goToDashboard, 900);
}

//  2FA Verification
function handle2FAVerification(e) {
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

  const users = getUsers();
  if (users.find((u) => u.email === email)) {
    markInputError(
      "signupEmail",
      "errSignupEmail",
      "An account with this email already exists.",
    );
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
  users.push(user);
  saveUsers(users);
  setSession(user);

  showAuthSuccess("Account created! Welcome, " + name + " ");
  setTimeout(goToDashboard, 900);
}

//  Guest
function continueAsGuest() {
  const guest = { name: "Guest", email: "", provider: "guest", isGuest: true };
  setSession(guest);
  goToDashboard();
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
  const email = document
    .getElementById("forgotEmail")
    .value.trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markInputError(
      "forgotEmail",
      "errForgotEmail",
      "Enter a valid email address.",
    );
    return;
  }
  // Check ALL registered users, regardless of provider
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.email === email);
  if (userIndex === -1) {
    markInputError(
      "forgotEmail",
      "errForgotEmail",
      "No account found with this email.",
    );
    return;
  }
  const user = users[userIndex];
  if (user.provider === "google" && !user.hash) {
    markInputError(
      "forgotEmail",
      "errForgotEmail",
      "This account uses Google Sign-In  no password to reset.",
    );
    return;
  }
  // Generate + store code in two places for reliability
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  saveResetCode(email, code);
  users[userIndex].resetToken = code;
  saveUsers(users);
  const hiddenEl = document.getElementById("resetEmailHidden");
  const displayEl = document.getElementById("resetEmailDisplay");
  if (hiddenEl) hiddenEl.value = email;
  if (displayEl) displayEl.textContent = email;
  const btnText = document.getElementById("forgotBtnText");
  const btnArrow = document.getElementById("forgotBtnArrow");
  const submitBtn = document.getElementById("forgotSubmit");
  if (btnText) btnText.textContent = "Sending...";
  if (btnArrow) btnArrow.style.display = "none";
  if (submitBtn) submitBtn.disabled = true;
  const result = await sendEmailCode(email, code, "reset", user.name);

  if (btnText) btnText.textContent = "Send Recovery Code";
  if (btnArrow) btnArrow.style.display = "inline";
  if (submitBtn) submitBtn.disabled = false;

  if (result.success) {
    switchTab("reset");
    showAuthSuccess(
      "Reset code sent to " + email + "! Check your inbox (and spam folder).",
    );
  } else {
    // Email failed  show error, don't switch tab, don't reveal code
    const errEl = document.getElementById("errForgotEmail");
    if (errEl) {
      errEl.textContent =
        "Failed to send email. Please check your address or try again shortly.";
      errEl.style.display = "block";
    }
    console.error("Email send failed:", result.error, result.detail);
  }
}

async function handleResetPassword(e) {
  e.preventDefault();
  clearErrors();
  const email = (document.getElementById("resetEmailHidden").value || "")
    .trim()
    .toLowerCase();
  const code = document.getElementById("resetCode").value.trim();
  const pass = document.getElementById("resetPass").value;
  let valid = true;
  if (!/^\d{6}$/.test(code)) {
    markInputError(
      "resetCode",
      "errResetCode",
      "Enter the 6-digit numeric code.",
    );
    valid = false;
  }
  if (pass.length < 6) {
    markInputError(
      "resetPass",
      "errResetPass",
      "New password must be at least 6 characters.",
    );
    valid = false;
  }
  if (!valid) return;
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.email === email);
  if (userIndex === -1) {
    setError(
      "errResetCode",
      "Session expired. Please restart the reset process.",
    );
    return;
  }
  const user = users[userIndex];
  const storedCode = getStoredResetCode(email);
  const validCode = storedCode === code || user.resetToken === code;
  if (!validCode) {
    markInputError(
      "resetCode",
      "errResetCode",
      "Incorrect or expired code. Please try again.",
    );
    return;
  }
  // Update password in the user database
  user.hash = await sha256(pass);
  delete user.resetToken;
  users[userIndex] = user;
  saveUsers(users);
  clearResetCode(email);
  setSession(user);
  showAuthSuccess(
    "Password reset for " +
      (user.name || email) +
      "! Logging you in\u2026 \ud83c\udf89",
  );
  setTimeout(goToDashboard, 1200);
}

//  Init on page load
document.addEventListener("DOMContentLoaded", () => {
  // Always run migration first to ensure database is in sync
  migrateLegacyData();

  if (document.getElementById("loginForm")) {
    if (getSession()) {
      goToDashboard();
      return;
    }
  }
});
