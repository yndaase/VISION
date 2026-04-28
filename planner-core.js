/**
 * VISION EDUCATION — Study Planner Core v2
 * AI Timetable Grid Generator + PDF Download
 */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Auth guard
  const session = typeof checkAuth === 'function' ? checkAuth() : null;
  if (!session) return;

  // 2. Pro check
  const isAdmin = session.role === 'admin';
  const isPro   = session.role === 'pro' || isAdmin || session.role === 'enterprise' || !!session.institutionId;
  if (!isPro) {
    const paywall = document.getElementById("plannerPaywall");
    if (paywall) paywall.style.display = "flex";
    return;
  }

  // 3. Countdown
  startCountdown();

  // 4. Load saved timetable if fresh (< 24h)
  const PLAN_KEY = `vision_plan_v2_${session.email}`;
  const cached = JSON.parse(localStorage.getItem(PLAN_KEY) || 'null');
  if (cached && cached.plan && (Date.now() - cached.ts < 24 * 60 * 60 * 1000)) {
    showTimetable(cached.plan, session);
  }

  // 5. Render subject gaps
  renderSubjectGaps(session.email);

  // 6. Wire up break radio buttons styling
  document.querySelectorAll('input[name="breakDur"]').forEach(radio => {
    radio.addEventListener('change', () => styleBreakRadios());
  });
  styleBreakRadios();
});

// ── Countdown ──────────────────────────────────────────────────
function startCountdown() {
  const target = new Date("August 1, 2026 09:00:00").getTime();
  const update = () => {
    const diff = target - Date.now();
    if (diff <= 0) return;
    const days = Math.floor(diff / 86400000);
    const el = document.getElementById("cdDays");
    if (el) {
      el.textContent = days;
      document.getElementById("countdownBadge").classList.remove("hidden");
      document.getElementById("countdownBadge").classList.add("flex");
    }
  };
  update();
  setInterval(update, 60000);
}

// ── Break radio styling ─────────────────────────────────────────
function styleBreakRadios() {
  document.querySelectorAll('input[name="breakDur"]').forEach(radio => {
    const label = radio.parentElement;
    if (radio.checked) {
      label.style.borderColor = '#6366f1';
      label.style.background  = 'rgba(99,102,241,0.1)';
      label.style.color       = '#818cf8';
    } else {
      label.style.borderColor = 'rgba(255,255,255,0.1)';
      label.style.background  = '';
      label.style.color       = '#94a3b8';
    }
  });
}

// ── Generate Timetable ──────────────────────────────────────────
window.generateTimetable = async function() {
  const session = typeof checkAuth === 'function' ? checkAuth() : null;
  if (!session) return;

  // Collect selected subjects
  const subjects = [...document.querySelectorAll('.subj-check:checked')].map(c => c.value);
  if (subjects.length === 0) {
    alert("Please select at least one subject.");
    return;
  }

  const studyStart = document.getElementById("studyStart").value || "08:00";
  const studyEnd   = document.getElementById("studyEnd").value   || "15:00";
  const breakMins  = Number(document.querySelector('input[name="breakDur"]:checked')?.value || 30);

  // UI states
  document.getElementById("generateBtn").disabled = true;
  document.getElementById("loadingState").classList.remove("hidden");
  document.getElementById("errorState").classList.add("hidden");
  document.getElementById("timetableSection").classList.add("hidden");
  document.getElementById("downloadBtn").classList.remove("flex");
  document.getElementById("downloadBtn").classList.add("hidden");

  // Get weakest subject from Firebase mastery
  let weakest = subjects[0];
  let accuracy = 65;
  try {
    if (typeof window.fbGetTopicMastery === 'function') {
      const mastery = await window.fbGetTopicMastery(session.email);
      const entries = Object.entries(mastery).filter(([s]) => subjects.includes(s));
      if (entries.length > 0) {
        entries.sort((a, b) => (a[1].pct || 0) - (b[1].pct || 0));
        weakest  = entries[0][0];
        accuracy = entries[0][1].pct || 65;
      }
    }
  } catch (_) {}

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'planner',
        name: session.name || session.email.split('@')[0],
        subject: weakest,
        accuracy,
        subjects,
        studyStart,
        studyEnd,
        breakMins,
        email: session.email
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const plan = await res.json();

    // Cache it
    const PLAN_KEY = `vision_plan_v2_${session.email}`;
    localStorage.setItem(PLAN_KEY, JSON.stringify({ plan, ts: Date.now() }));

    // Save to Firestore
    if (typeof window.fbSavePlan === 'function') {
      window.fbSavePlan(session.email, plan).catch(() => {});
    }

    showTimetable(plan, session);
  } catch (err) {
    console.error("[Planner] Error:", err);
    document.getElementById("errorMsg").textContent = err.message;
    document.getElementById("errorState").classList.remove("hidden");
  } finally {
    document.getElementById("generateBtn").disabled = false;
    document.getElementById("loadingState").classList.add("hidden");
  }
};

// ── Render Timetable ────────────────────────────────────────────
function showTimetable(plan, session) {
  const section = document.getElementById("timetableSection");
  const tbody   = document.getElementById("ttBody");
  if (!section || !tbody || !plan.slots) return;

  // Header info
  const now = new Date();
  const weekOf = now.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  const studentName = session?.name || session?.email?.split('@')[0] || 'Student';

  safeSet("weekOf",         weekOf);
  safeSet("ttFocus",        plan.weekFocus || "WASSCE 2026 Preparation");
  safeSet("ttStudentName",  studentName);
  safeSet("printStudentLine", `${studentName} · Generated: ${weekOf}`);

  // Build rows
  tbody.innerHTML = plan.slots.map(slot => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const cells = days.map(d => {
      const text = slot[d] || '';
      if (slot.isBreak) return `<td class="tt-cell tt-cell-break">${text}</td>`;
      return `<td class="tt-cell ${getSubjectClass(text)}">${text}</td>`;
    }).join('');
    return `<tr>
      <td class="tt-time">${slot.time || ''}</td>
      ${cells}
    </tr>`;
  }).join('');

  // Tasks
  const tasksEl = document.getElementById("ttTasks");
  if (tasksEl && plan.tasks) {
    tasksEl.innerHTML = plan.tasks.map(t => `
      <li class="flex items-start gap-3">
        <input type="checkbox" class="mt-1 accent-indigo-500 flex-shrink-0" />
        <span class="text-sm text-gray-300 font-medium leading-snug">${t}</span>
      </li>`).join('');
  }

  // Motivation
  safeSet("ttMotivation", `"${plan.motivation || 'Stay consistent. The exam rewards the prepared.'}"`);

  // Show section and download button
  section.classList.remove("hidden");
  document.getElementById("downloadBtn").classList.remove("hidden");
  document.getElementById("downloadBtn").classList.add("flex");
  document.getElementById("downloadBtn").style.display = "flex";

  // Scroll to timetable
  setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

// ── Download / Print ────────────────────────────────────────────
window.downloadTimetable = function() {
  // Show print header, hide screen-only elements
  const ph = document.getElementById("printHeader");
  if (ph) ph.style.display = "block";
  window.print();
  if (ph) ph.style.display = "none";
};

// ── Subject Colour Mapper ───────────────────────────────────────
function getSubjectClass(text) {
  if (!text) return '';
  const t = text.toLowerCase();
  if (t.includes('past question') || t === 'pq') return 'sc-pq';
  if (t.includes('theory') || t.includes('essay'))  return 'sc-theory';
  if (t.includes('elective maths') || t.includes('elective mathematics')) return 'sc-elective';
  if (t.includes('core maths') || t.includes('core mathematics') || t.includes('mathematics')) return 'sc-maths';
  if (t.includes('english'))    return 'sc-english';
  if (t.includes('integrated science') || t.includes('int. science')) return 'sc-science';
  if (t.includes('social'))     return 'sc-social';
  if (t.includes('computer'))   return 'sc-cs';
  if (t.includes('physics'))    return 'sc-physics';
  if (t.includes('chemistry'))  return 'sc-chemistry';
  if (t.includes('biology'))    return 'sc-biology';
  if (t.includes('economics'))  return 'sc-economics';
  if (t.includes('geography'))  return 'sc-geography';
  return '';
}

function safeSet(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Syllabus Gaps ───────────────────────────────────────────────
async function renderSubjectGaps(email) {
  const container = document.getElementById("gapsContainer");
  if (!container) return;

  const COLORS = ['#f87171','#fb923c','#fbbf24','#34d399','#60a5fa','#a78bfa'];

  try {
    if (email && typeof window.fbGetTopicMastery === 'function') {
      const mastery = await window.fbGetTopicMastery(email);
      const topics  = Object.entries(mastery);
      if (topics.length > 0) {
        topics.sort((a, b) => (a[1].pct || 0) - (b[1].pct || 0));
        container.innerHTML = topics.slice(0, 6).map(([name, data], i) => {
          const lvl = data.pct || 0;
          const col = COLORS[i % COLORS.length];
          return `<div>
            <div class="flex justify-between text-xs font-bold mb-1.5">
              <span class="text-gray-300">${name}</span>
              <span style="color:${lvl < 50 ? '#f87171' : lvl < 70 ? '#fbbf24' : '#34d399'}">${lvl}%</span>
            </div>
            <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div style="width:${lvl}%;height:100%;background:${col};box-shadow:0 0 8px ${col}66;transition:width 1s ease;"></div>
            </div>
          </div>`;
        }).join('');
        return;
      }
    }
  } catch (_) {}

  // Fallback
  container.innerHTML = `<p class="text-sm text-gray-600">Complete a mock exam to see your subject gaps here.</p>`;
}
