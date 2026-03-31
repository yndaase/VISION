/* =====================================================
   WAEC 2026 — Dashboard Logic
   Populates welcome section, stats, user chip
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ─── Auth guard ─────────────────────────────────────
  const session = checkAuth();  // redirects to login.html if null
  if (!session) return;

  // ─── Populate user chip ──────────────────────────────
  const navAvatar   = document.getElementById('navAvatar');
  const navUsername = document.getElementById('navUsername');

  const initial = session.name ? session.name.charAt(0).toUpperCase() : '?';
  if (navAvatar)   navAvatar.textContent   = initial;
  if (navUsername) navUsername.textContent = session.name || 'Student';

  // If Google user has picture, show it
  if (session.picture && navAvatar) {
    navAvatar.style.cssText = `
      background-image: url('${session.picture}');
      background-size: cover;
      background-position: center;
      font-size: 0;
    `;
  }

  // ─── Welcome hero ────────────────────────────────────
  const welcomeName     = document.getElementById('welcomeName');
  const welcomeGreeting = document.getElementById('welcomeGreeting');

  if (welcomeName) {
    // Show first name only
    const firstName = session.name ? session.name.split(' ')[0] : 'Student';
    welcomeName.textContent = firstName;
  }

  if (welcomeGreeting) {
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    if (hour >= 5  && hour < 12) greeting = 'Good morning';
    else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    welcomeGreeting.textContent = greeting;
  }

  // ─── Stats ───────────────────────────────────────────
  const stats = getStats();
  const answered = stats.answered || 0;
  const correct  = stats.correct  || 0;
  const pct      = answered > 0 ? Math.round((correct / answered) * 100) + '%' : '—';

  const elAnswered = document.getElementById('statAnswered');
  const elCorrect  = document.getElementById('statCorrect');
  const elPct      = document.getElementById('statPct');

  if (elAnswered) animateCount(elAnswered, answered);
  if (elCorrect)  animateCount(elCorrect, correct);
  if (elPct)      elPct.textContent = pct;

  // ─── Stagger card animation ──────────────────────────
  const cards = document.querySelectorAll('.subject-card');
  cards.forEach((card, i) => {
    card.style.animationDelay = `${i * 0.07 + 0.1}s`;
  });
});

// ─── Animated counter ────────────────────────────────
function animateCount(el, target) {
  if (target === 0) { el.textContent = '0'; return; }
  let start = 0;
  const duration = 1000;
  const step = (timestamp) => {
    if (!step.startTime) step.startTime = timestamp;
    const progress = Math.min((timestamp - step.startTime) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}
