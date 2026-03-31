/* =====================================================
   WAEC 2026 — Shared Auth Module
   Handles: localStorage accounts, session management,
            Google Sign-In callback, login/signup logic,
            page-level auth guard (checkAuth)
   ===================================================== */

const AUTH_KEY    = 'waec_users';
const SESSION_KEY = 'waec_session';
const STATS_KEY   = 'waec_stats';

// ─── Storage helpers ─────────────────────────────────
function getUsers()         { return JSON.parse(localStorage.getItem(AUTH_KEY)    || '[]'); }
function saveUsers(u)       { localStorage.setItem(AUTH_KEY, JSON.stringify(u)); }
function getSession()     {
  // Read from sessionStorage first, then fall back to localStorage (survives refresh)
  return JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || 'null');
}
function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));  // persist across refreshes
}
function clearSession()   {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

function getStats() {
  return JSON.parse(localStorage.getItem(STATS_KEY) || '{"answered":0,"correct":0}');
}
function saveStats(s) { localStorage.setItem(STATS_KEY, JSON.stringify(s)); }

// ─── Simple hash (demo-grade, not cryptographic) ─────
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return h.toString(16);
}

// ─── Auth guard — call on every protected page ───────
function checkAuth() {
  const session = getSession();
  if (!session) {
    const isRobotics = window.location.pathname.includes('robotics');
    window.location.href = isRobotics ? 'robotics-login.html' : 'login.html';
    return null;
  }
  return session;
}

// ─── Redirect helpers ────────────────────────────────
function goToDashboard() { 
  const isRobotics = window.location.pathname.includes('robotics');
  window.location.href = isRobotics ? 'robotics-dashboard.html' : 'dashboard.html'; 
}
function goToLogin()     { window.location.href = 'login.html'; }

// ─── Logout ──────────────────────────────────────────
function handleLogout() {
  clearSession();
  const isRobotics = window.location.pathname.includes('robotics');
  window.location.href = isRobotics ? 'robotics-login.html' : 'login.html';
}

// ─── 2FA State Helpers ────────────────────────────────
function is2FAEnabled(email) {
  const user = getUsers().find(u => u.email === email);
  return user ? !!user.twoFactorEnabled : false;
}
function toggle2FA(email, enabled) {
  const users = getUsers();
  const idx = users.findIndex(u => u.email === email);
  if (idx !== -1) {
    users[idx].twoFactorEnabled = enabled;
    saveUsers(users);
    
    // Update session
    const session = getSession();
    if (session && session.email === email) {
      session.twoFactorEnabled = enabled;
      setSession(session);
    }
    
    // Update UI status
    updateSecurityStatusUI(enabled);
  }
}

function updateSecurityStatusUI(enabled) {
  const statusEl = document.getElementById('securityStatus');
  const toggleEl = document.getElementById('tfaToggle');
  if (statusEl) {
    statusEl.innerHTML = enabled 
      ? '<span class="status-secure">🛡️ Level 2 Protected (2FA Active)</span>' 
      : '<span class="status-warn">⚠️ Level 1 Protected (Standard)</span>';
  }
  if (toggleEl) {
    toggleEl.classList.toggle('active', enabled);
  }
}

// ─── Settings Modal Logic ────────────────────────────
function openSettings() {
  const session = getSession();
  if (!session) return;
  
  const modal = document.getElementById('settingsModal');
  if (!modal) return;
  
  // Populate info
  const nameEl  = document.getElementById('settingsName');
  const emailEl = document.getElementById('settingsEmail');
  const avEl    = document.getElementById('settingsAvatar');
  
  if (nameEl)  nameEl.textContent  = session.name;
  if (emailEl) emailEl.textContent = session.email;
  if (avEl)    avEl.textContent    = session.name.charAt(0).toUpperCase();
  
  // Set 2FA toggle state from database/session
  const enabled = is2FAEnabled(session.email);
  updateSecurityStatusUI(enabled);
  
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('visible'), 10);
}

function closeSettings() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.classList.remove('visible');
    setTimeout(() => modal.style.display = 'none', 300);
  }
}

function handle2FAToggle() {
  const session = getSession();
  if (!session) return;
  
  const current = is2FAEnabled(session.email);
  toggle2FA(session.email, !current);
}

// ─── Google Sign-In callback (GIS) ───────────────────
function handleGoogleCredential(response) {
  try {
    // Decode JWT payload (base64url, middle part)
    const payload = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const user = {
      name:    payload.name  || 'Google User',
      email:   payload.email || '',
      picture: payload.picture || '',
      provider: 'google',
      sub:     payload.sub
    };

    // Upsert user in local store
    const users = getUsers();
    const idx = users.findIndex(u => u.email === user.email);
    if (idx === -1) users.push(user);
    else users[idx] = { ...users[idx], ...user };
    saveUsers(users);

    setSession(user);
    showAuthSuccess('Welcome, ' + user.name + '! 🎉');
    setTimeout(goToDashboard, 900);
  } catch(e) {
    console.error('Google Sign-In error:', e);
    showAuthSuccess('Google sign-in failed. Please use email instead.');
  }
}

// ─── Google Sign-In helper ────────────────────────────
// (Using official GIS script load, no programmatic trigger needed)

// ─── Email Login ─────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('loginPass').value;
  let valid = true;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markInputError('loginEmail', 'errLoginEmail', 'Enter a valid email address.');
    valid = false;
  }
  if (!pass) {
    markInputError('loginPass', 'errLoginPass', 'Please enter your password.');
    valid = false;
  }
  if (!valid) return;

  const user = getUsers().find(u => u.email === email && u.hash === simpleHash(pass));
  if (!user) {
    setError('errLoginGeneral', 'Invalid email or password. Please try again.');
    const form = document.getElementById('loginForm');
    if (form) { form.classList.add('form-shake'); setTimeout(() => form.classList.remove('form-shake'), 500); }
    return;
  }

  // DEEP 2FA INTEGRATION: Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    // Generate code and store for login session
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    saveResetCode(email, code); // reuse reset code store (10-min TTL)
    
    // Store email for verification step
    const hiddenEl = document.getElementById('2faEmailHidden');
    if (hiddenEl) hiddenEl.value = email;
    
    // Attempt EmailJS send
    const fallbackBox = document.getElementById('2faCodeFallback');
    try {
      if (typeof emailjs !== 'undefined') {
        const sendBtn = document.getElementById('loginSubmit');
        if (sendBtn) sendBtn.innerHTML = '<span>Verifying Identity...</span>';
        
        emailjs.send('service_gvml18u', 'template_sl92tvj', {
          to_name: user.name || email.split('@')[0],
          to_email: email,
          reset_code: code 
        }).then(() => {
          switchTab('2fa');
        }).catch(err => {
          console.error('EmailJS 2FA failed:', err);
          if (fallbackBox) {
            fallbackBox.textContent = 'Identity Code: ' + code;
            fallbackBox.style.display = 'block';
          }
          switchTab('2fa');
        });
      } else {
        throw new Error('EmailJS not loaded');
      }
    } catch(err) {
      if (fallbackBox) {
        fallbackBox.textContent = 'Identity Code: ' + code;
        fallbackBox.style.display = 'block';
      }
      switchTab('2fa');
    }
    return;
  }

  setSession(user);
  showAuthSuccess('Welcome back, ' + user.name + '! 👋');
  setTimeout(goToDashboard, 900);
}

// ─── 2FA Verification ────────────────────────────────
function handle2FAVerification(e) {
  e.preventDefault();
  clearErrors();

  const email = (document.getElementById('2faEmailHidden').value || '').trim().toLowerCase();
  const code  = document.getElementById('2faCodeInput').value.trim();
  
  if (!/^\d{6}$/.test(code)) {
    markInputError('2faCodeInput', 'err2FACode', 'Enter the 6-digit numeric code.');
    return;
  }

  const storedCode = getStoredResetCode(email);
  if (storedCode !== code) {
    markInputError('2faCodeInput', 'err2FACode', 'Invalid or expired security code.');
    return;
  }

  // Clear code and log in
  clearResetCode(email);
  const user = getUsers().find(u => u.email === email);
  setSession(user);
  showAuthSuccess('Secure identity verified! Logging in...');
  setTimeout(goToDashboard, 900);
}

// ─── Email Signup ────────────────────────────────────
function handleSignup(e) {
  e.preventDefault();
  clearErrors();

  const name  = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('signupPass').value;
  const conf  = document.getElementById('signupConfirm').value;
  let valid = true;

  if (name.length < 2) { markInputError('signupName', 'errSignupName', 'Name must be at least 2 characters.'); valid = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { markInputError('signupEmail', 'errSignupEmail', 'Enter a valid email address.'); valid = false; }
  if (pass.length < 6)  { markInputError('signupPass', 'errSignupPass', 'Password must be at least 6 characters.'); valid = false; }
  if (pass !== conf)    { markInputError('signupConfirm', 'errSignupConfirm', 'Passwords do not match.'); valid = false; }
  if (!valid) return;

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    markInputError('signupEmail', 'errSignupEmail', 'An account with this email already exists.');
    return;
  }

  const user = { name, email, hash: simpleHash(pass), provider: 'email', createdAt: Date.now() };
  users.push(user);
  saveUsers(users);
  setSession(user);

  showAuthSuccess('Account created! Welcome, ' + name + ' 🎉');
  setTimeout(goToDashboard, 900);
}

// ─── Guest ────────────────────────────────────────────
function continueAsGuest() {
  const guest = { name: 'Guest', email: '', provider: 'guest', isGuest: true };
  setSession(guest);
  goToDashboard();
}

// ─── Shared Settings Modal ───────────────────────────
function openSettings() {
  const session = getSession();
  if (!session) return;
  const modal     = document.getElementById('settingsModal');
  const nameEl    = document.getElementById('settingsName');
  const emailEl   = document.getElementById('settingsEmail');
  const avatarEl  = document.getElementById('settingsAvatar');
  const tfaToggle = document.getElementById('tfaToggle');
  const secStatus = document.getElementById('securityStatus');
  if (nameEl)    nameEl.textContent = session.name || 'Student';
  if (emailEl)   emailEl.textContent = session.email || '';
  if (avatarEl)  avatarEl.textContent = session.name ? session.name.charAt(0).toUpperCase() : 'S';
  const enabled = is2FAEnabled(session.email);
  if (tfaToggle) tfaToggle.classList.toggle('active', enabled);
  if (secStatus) {
    secStatus.innerHTML = enabled 
      ? '<span class="status-secure">🛡️ Level 2 Protected (2FA Active)</span>'
      : '<span class="status-warn">⚠️ Level 1 Protected (Password Only)</span>';
  }
  if (modal) modal.classList.add('active');
}

function closeSettings() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('active');
}

function handle2FAToggle() {
  const session = getSession();
  if (!session) return;
  const tfaToggle = document.getElementById('tfaToggle');
  const secStatus = document.getElementById('securityStatus');
  const enabled = tfaToggle && tfaToggle.classList.contains('active');
  const newState = !enabled;
  if (tfaToggle) tfaToggle.classList.toggle('active', newState);
  toggle2FA(session.email, newState);
  if (secStatus) {
    secStatus.innerHTML = newState 
      ? '<span class="status-secure">🛡️ Level 2 Protected (2FA Active)</span>'
      : '<span class="status-warn">⚠️ Level 1 Protected (Password Only)</span>';
  }
}

// Global click handler for modal backdrop
window.addEventListener('click', (e) => {
  if (e.target.id === 'settingsModal') closeSettings();
});

// ─── Tab switching ────────────────────────────────────
function switchTab(tab) {
  clearErrors();
  
  const forms = {
    login:  document.getElementById('loginForm'),
    signup: document.getElementById('signupForm'),
    forgot: document.getElementById('forgotForm'),
    reset:  document.getElementById('resetForm'),
    '2fa':  document.getElementById('2faForm')
  };
  
  Object.keys(forms).forEach(key => {
    if (forms[key]) forms[key].classList.toggle('form-active', key === tab);
  });
  
  const showStandard = (tab === 'login' || tab === 'signup');
  const tabsWrap  = document.querySelector('.auth-tabs');
  const dividers  = document.querySelectorAll('.auth-divider');
  const googleBtn = document.querySelector('.google-btn-wrap');
  const guestBtn  = document.querySelector('.guest-btn');

  if (tabsWrap)  tabsWrap.style.display  = (tab === 'forgot' || tab === 'reset' || tab === '2fa') ? 'none' : 'flex';
  if (googleBtn) googleBtn.style.display = showStandard ? 'block' : 'none';
  if (guestBtn)  guestBtn.style.display  = showStandard ? 'block' : 'none';
  dividers.forEach(el => el.style.display = showStandard ? 'flex' : 'none');

  if (showStandard) {
    const tLogin  = document.getElementById('tabLogin');
    const tSignup = document.getElementById('tabSignup');
    if (tLogin)  tLogin.classList.toggle('auth-tab-active', tab === 'login');
    if (tSignup) tSignup.classList.toggle('auth-tab-active', tab === 'signup');
  }

  // Update Headings
  const title = document.getElementById('authTitle');
  const sub   = document.getElementById('authSubtitle');
  if (!title || !sub) return;

  const isRobotics = window.location.pathname.includes('robotics');

  if (tab === 'login') {
    title.textContent = isRobotics ? 'Team Access' : 'Welcome back';
    sub.textContent   = isRobotics ? 'Hardware credentials required.' : 'Sign in to continue your WASSCE prep journey.';
  } else if (tab === 'signup') {
    title.textContent = isRobotics ? 'Enroll Member' : 'Create your account';
    sub.textContent   = isRobotics ? 'Register for the Augusco Robotics team.' : 'Join thousands of Ghana SHS students preparing for 2026.';
  } else if (tab === 'forgot') {
    title.textContent = isRobotics ? 'Security Recovery' : 'Reset Password';
    sub.textContent   = isRobotics ? 'Authorize access code for your team ID.' : "Don't worry, we'll get you back on track.";
    const eForgot = document.getElementById('forgotEmail');
    if (eForgot && !eForgot.value) {
      const eLogin = document.getElementById('loginEmail');
      if (eLogin && eLogin.value) eForgot.value = eLogin.value;
    }
  } else if (tab === 'reset') {
    title.textContent = isRobotics ? 'Verify Code' : 'Check Your Email';
    sub.textContent   = isRobotics ? 'Enter the secondary authentication code.' : "You're almost there! Set a new password below.";
  } else if (tab === '2fa') {
    title.textContent = isRobotics ? 'Security Check' : 'Identity Verifier';
    sub.textContent   = isRobotics ? 'Hardware key required for override.' : 'Multi-factor authentication is active on your account.';
  }
}

// ─── Errors ───────────────────────────────────────────
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
}
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(e => { e.textContent = ''; e.style.display = 'none'; });
  document.querySelectorAll('.auth-input').forEach(i => i.classList.remove('input-error'));
}
function markInputError(inputId, errorId, msg) {
  const inp = document.getElementById(inputId);
  if (inp) inp.classList.add('input-error');
  setError(errorId, msg);
}

// ─── Password strength ────────────────────────────────
function checkPasswordStrength(val) {
  const bar   = document.getElementById('strengthBar');
  const label = document.getElementById('strengthLabel');
  if (!bar) return;
  let score = 0;
  if (val.length >= 6)  score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const lvls = [
    {w:'0%',c:'transparent',t:''},
    {w:'20%',c:'#f87171',t:'Very Weak'},
    {w:'40%',c:'#fb923c',t:'Weak'},
    {w:'60%',c:'#fbbf24',t:'Fair'},
    {w:'80%',c:'#34d399',t:'Strong'},
    {w:'100%',c:'#22c55e',t:'Very Strong'},
  ];
  const l = lvls[score] || lvls[0];
  bar.style.width      = l.w;
  bar.style.background = l.c;
  label.textContent    = l.t;
  label.style.color    = l.c;
}

// ─── Toggle password visibility ───────────────────────
function toggleVisibility(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') { inp.type = 'text';     btn.textContent = '🙈'; }
  else                         { inp.type = 'password'; btn.textContent = '👁'; }
}

// ─── Success toast ────────────────────────────────────
function showAuthSuccess(msg) {
  const toast = document.getElementById('authSuccessToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('toast-visible');
  setTimeout(() => toast.classList.remove('toast-visible'), 3000);
}

// ─── EmailJS Setup & Forgot Password Logic ────────────
if (typeof emailjs !== 'undefined') {
  try { emailjs.init({ publicKey: "wK_ysK2NxQ7BwK_zJ" }); } catch(e) {}
}

// Reset code store with 10-min TTL
const RESET_STORE_KEY = 'waec_reset_codes';
function saveResetCode(email, code) {
  const store = JSON.parse(localStorage.getItem(RESET_STORE_KEY) || '{}');
  store[email] = { code, ts: Date.now() };
  localStorage.setItem(RESET_STORE_KEY, JSON.stringify(store));
}
function getStoredResetCode(email) {
  const store = JSON.parse(localStorage.getItem(RESET_STORE_KEY) || '{}');
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
  const store = JSON.parse(localStorage.getItem(RESET_STORE_KEY) || '{}');
  delete store[email];
  localStorage.setItem(RESET_STORE_KEY, JSON.stringify(store));
}

async function handleForgotPassword(e) {
  e.preventDefault();
  clearErrors();
  const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markInputError('forgotEmail', 'errForgotEmail', 'Enter a valid email address.');
    return;
  }
  // Check ALL registered users, regardless of provider
  const users = getUsers();
  const userIndex = users.findIndex(u => u.email === email);
  if (userIndex === -1) {
    markInputError('forgotEmail', 'errForgotEmail', 'No account found with this email.');
    return;
  }
  const user = users[userIndex];
  if (user.provider === 'google' && !user.hash) {
    markInputError('forgotEmail', 'errForgotEmail', 'This account uses Google Sign-In — no password to reset.');
    return;
  }
  // Generate + store code in two places for reliability
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  saveResetCode(email, code);
  users[userIndex].resetToken = code;
  saveUsers(users);
  const hiddenEl = document.getElementById('resetEmailHidden');
  const displayEl = document.getElementById('resetEmailDisplay');
  if (hiddenEl) hiddenEl.value = email;
  if (displayEl) displayEl.textContent = email;
  const btnText = document.getElementById('forgotBtnText');
  const btnArrow = document.getElementById('forgotBtnArrow');
  const submitBtn = document.getElementById('forgotSubmit');
  if (btnText) btnText.textContent = 'Sending...';
  if (btnArrow) btnArrow.style.display = 'none';
  if (submitBtn) submitBtn.disabled = true;
  let emailSent = false;
  try {
    if (typeof emailjs !== 'undefined') {
      await emailjs.send('service_gvml18u', 'template_sl92tvj', {
        to_name: user.name || email.split('@')[0],
        to_email: email,
        reset_code: code
      });
      emailSent = true;
    }
  } catch (err) {
    console.warn('EmailJS send failed:', err);
  } finally {
    if (btnText) btnText.textContent = 'Send Recovery Code';
    if (btnArrow) btnArrow.style.display = 'inline';
    if (submitBtn) submitBtn.disabled = false;
  }
  switchTab('reset');
  if (emailSent) {
    showAuthSuccess('Reset code sent to ' + email + '! Check your inbox.');
  } else {
    // Fallback: show code on-screen when email cannot be sent
    showAuthSuccess('Email service unavailable — use the code below.');
    const fallback = document.getElementById('resetCodeFallback');
    if (fallback) { fallback.textContent = 'Your code: ' + code; fallback.style.display = 'block'; }
  }
}

function handleResetPassword(e) {
  e.preventDefault();
  clearErrors();
  const email = (document.getElementById('resetEmailHidden').value || '').trim().toLowerCase();
  const code  = document.getElementById('resetCode').value.trim();
  const pass  = document.getElementById('resetPass').value;
  let valid = true;
  if (!/^\d{6}$/.test(code)) {
    markInputError('resetCode', 'errResetCode', 'Enter the 6-digit numeric code.'); valid = false;
  }
  if (pass.length < 6) {
    markInputError('resetPass', 'errResetPass', 'New password must be at least 6 characters.'); valid = false;
  }
  if (!valid) return;
  const users = getUsers();
  const userIndex = users.findIndex(u => u.email === email);
  if (userIndex === -1) {
    setError('errResetCode', 'Session expired. Please restart the reset process.'); return;
  }
  const user = users[userIndex];
  const storedCode = getStoredResetCode(email);
  const validCode = (storedCode === code) || (user.resetToken === code);
  if (!validCode) {
    markInputError('resetCode', 'errResetCode', 'Incorrect or expired code. Please try again.'); return;
  }
  // Update password in the user database
  user.hash = simpleHash(pass);
  delete user.resetToken;
  users[userIndex] = user;
  saveUsers(users);
  clearResetCode(email);
  setSession(user);
  showAuthSuccess('Password reset for ' + (user.name || email) + '! Logging you in\u2026 \ud83c\udf89');
  setTimeout(goToDashboard, 1200);
}

// ─── Init on login page ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('loginForm')) {
    if (getSession()) { goToDashboard(); return; }
  }
});
