/* =====================================================
   STREAKS ENGINE — Vision Education
   Tracks daily study activity, calculates streaks,
   and provides UI helpers for the dashboard.
   ===================================================== */

const STREAK_KEY_PREFIX = 'vision_streak_';

/**
 * Get the streak data object for the current user.
 */
function getStreakData() {
  const session = getSession ? getSession() : null;
  const email = session ? session.email : 'guest';
  const key = STREAK_KEY_PREFIX + email;
  const defaults = {
    days: [],          // Array of date strings 'YYYY-MM-DD'
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null
  };
  try {
    return JSON.parse(localStorage.getItem(key)) || defaults;
  } catch (e) {
    return defaults;
  }
}

/**
 * Save streak data for the current user.
 */
function saveStreakData(data) {
  const session = getSession ? getSession() : null;
  const email = session ? session.email : 'guest';
  const key = STREAK_KEY_PREFIX + email;
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Get today's date as 'YYYY-MM-DD' string.
 */
function getTodayStr() {
  const now = new Date();
  return now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');
}

/**
 * Get yesterday's date as 'YYYY-MM-DD' string.
 */
function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

/**
 * Record that the user studied today. Call this when a question is answered.
 */
function recordStudyDay() {
  const data = getStreakData();
  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  // Already recorded today
  if (data.lastStudyDate === today) return data;

  // Add today to the days array
  if (!data.days.includes(today)) {
    data.days.push(today);
    // Keep only last 365 days
    if (data.days.length > 365) {
      data.days = data.days.slice(-365);
    }
  }

  // Calculate streak
  if (data.lastStudyDate === yesterday) {
    // Consecutive day
    data.currentStreak += 1;
  } else if (data.lastStudyDate === today) {
    // Same day, no change
  } else {
    // Streak broken, start fresh
    data.currentStreak = 1;
  }

  // Update longest
  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak;
  }

  data.lastStudyDate = today;
  saveStreakData(data);

  // Update UI if streak elements exist
  updateStreakUI(data);

  return data;
}

/**
 * Recalculate the streak on page load (handles missed days).
 */
function recalculateStreak() {
  const data = getStreakData();
  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  if (data.lastStudyDate === today) {
    // Studied today — streak is current
  } else if (data.lastStudyDate === yesterday) {
    // Studied yesterday — streak is alive but not yet extended today
  } else {
    // Missed a day (or more) — reset current streak
    if (data.lastStudyDate && data.lastStudyDate !== today && data.lastStudyDate !== yesterday) {
      data.currentStreak = 0;
      saveStreakData(data);
    }
  }

  return data;
}

/**
 * Update the streak UI on the dashboard.
 */
function updateStreakUI(data) {
  if (!data) data = recalculateStreak();

  const currentEl = document.getElementById('streakCurrent');
  const longestEl = document.getElementById('streakLongest');
  const fireEl = document.getElementById('streakFire');
  const statusEl = document.getElementById('streakStatus');

  if (currentEl) currentEl.textContent = data.currentStreak;
  if (longestEl) longestEl.textContent = data.longestStreak;

  // Fire animation based on streak length
  if (fireEl) {
    if (data.currentStreak >= 7) {
      fireEl.className = 'streak-fire streak-fire-hot';
    } else if (data.currentStreak >= 3) {
      fireEl.className = 'streak-fire streak-fire-warm';
    } else if (data.currentStreak >= 1) {
      fireEl.className = 'streak-fire streak-fire-lit';
    } else {
      fireEl.className = 'streak-fire streak-fire-cold';
    }
  }

  if (statusEl) {
    const today = getTodayStr();
    if (data.lastStudyDate === today) {
      statusEl.innerHTML = '<span style="color:#4ade80;">Studied today</span>';
    } else {
      statusEl.innerHTML = '<span style="color:#fbbf24;">Study now to keep your streak!</span>';
    }
  }
}

/**
 * Show a streak toast notification on login/page load.
 */
function showStreakToast() {
  const data = recalculateStreak();
  if (data.currentStreak <= 0) return;

  const toast = document.createElement('div');
  toast.className = 'streak-toast';
  toast.innerHTML = `
    <span class="streak-toast-fire">🔥</span>
    <div class="streak-toast-content">
      <strong>${data.currentStreak} day streak!</strong>
      <span>Keep studying to maintain your streak.</span>
    </div>
  `;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('streak-toast-visible');
  });

  // Remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove('streak-toast-visible');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/**
 * Get study activity data for heatmap visualization.
 * Returns an object: { 'YYYY-MM-DD': true, ... }
 */
function getStudyHeatmap() {
  const data = getStreakData();
  const map = {};
  data.days.forEach(d => { map[d] = true; });
  return map;
}

/**
 * Get total unique study days.
 */
function getTotalStudyDays() {
  const data = getStreakData();
  return data.days.length;
}

// Auto-init on page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    updateStreakUI();
  });
}
