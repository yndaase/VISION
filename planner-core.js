/**
 * VISION EDUCATION - Study Planner Core
 * Countdown engine & AI Mission Handshake
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Auth Guard
    const session = typeof checkAuth === 'function' ? checkAuth() : null;
    if (!session) return;

    // 2. Start Countdown
    startCountdown();

    // 3. Load or Generate Mission
    initializeMission(session);

    // 4. Populate Subject Gaps
    renderSubjectGaps();
});

// WASSCE 2026 Target Date: Aug 1, 2026
function startCountdown() {
    const target = new Date("August 1, 2026 09:00:00").getTime();
    const elDays = document.getElementById("cdDays");
    const elHours = document.getElementById("cdHours");
    const elMins = document.getElementById("cdMins");

    function update() {
        const now = new Date().getTime();
        const diff = target - now;
        
        if (diff <= 0) {
            if (elDays) elDays.innerText = "EXAM";
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (elDays) elDays.innerText = days.toString().padStart(2, '0');
        if (elHours) elHours.innerText = hours.toString().padStart(2, '0');
        if (elMins) elMins.innerText = mins.toString().padStart(2, '0');
    }

    update();
    setInterval(update, 1000 * 60); // Update every minute
}

async function initializeMission(session, forced = false) {
    // 1. Vision Pro Access Check
    const isAdmin = session.role === 'admin';
    const isPro = session.role === 'pro' || isAdmin || session.role === 'enterprise' || !!session.institutionId;

    if (!isPro) {
        const paywall = document.getElementById("plannerPaywall");
        if (paywall) paywall.style.display = "flex";
        return;
    }

    const PLAN_KEY = `vision_plan_${session.email}`;
    const localStored = JSON.parse(localStorage.getItem(PLAN_KEY) || 'null');

    if (!forced) {
        // Try to load from Firestore first (cross-device)
        if (typeof window.fbGetPlan === 'function') {
            try {
                const cloudPlan = await window.fbGetPlan(session.email);
                if (cloudPlan && cloudPlan.plan && (Date.now() - cloudPlan.timestamp < 24 * 60 * 60 * 1000)) {
                    // Fresh cloud plan — use it and refresh local cache
                    localStorage.setItem(PLAN_KEY, JSON.stringify(cloudPlan));
                    renderMission(cloudPlan.plan);
                    renderSubjectGaps(session.email);
                    return;
                }
            } catch(e) { console.warn('[Planner] Firebase plan fetch failed, using local'); }
        }
        // Fall back to localStorage cache
        if (localStored && (Date.now() - localStored.timestamp < 24 * 60 * 60 * 1000)) {
            renderMission(localStored.plan);
            renderSubjectGaps(session.email);
            return;
        }
    }

    // Generate new plan
    generateNewMission(session, PLAN_KEY);
    renderSubjectGaps(session.email);
}

async function refreshPlan() {
    const session = typeof checkAuth === 'function' ? checkAuth() : null;
    if (!session) return;
    
    const btn = document.getElementById('refreshBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerText = "Refreshing...";
    }
    await initializeMission(session, true);
    if (btn) {
        btn.disabled = false;
        btn.innerText = "Refresh Plan";
    }
}

async function generateNewMission(session, PLAN_KEY) {
    const missionContainer = document.getElementById("missionContainer");
    const timetableEl = document.getElementById("planTimetable");
    
    if (missionContainer) missionContainer.style.opacity = "0.3";
    if (timetableEl) timetableEl.innerHTML = "<p style='color:var(--primary); font-weight:600;'>AI is auditing your Firebase mastery gaps and building your 7-day strategy...</p>";

    // 1. Get real weakness data from Firebase
    let prioritySubject = "Core Mathematics"; 
    let worstAccuracy = 100;
    let topicMastery = {};

    try {
        // Try Firebase mastery first (most accurate)
        if (typeof window.fbGetTopicMastery === 'function') {
            topicMastery = await window.fbGetTopicMastery(session.email);
        }
        // If Firebase has mastery data, use it
        if (Object.keys(topicMastery).length > 0) {
            Object.entries(topicMastery).forEach(([subject, data]) => {
                if ((data.pct || 0) < worstAccuracy) {
                    worstAccuracy = data.pct || 0;
                    prioritySubject = subject;
                }
            });
        } else {
            // Fall back to local mock history
            const stats = typeof getStats === 'function' ? getStats() : { answered: 0, correct: 0 };
            if (stats.mockHistory && stats.mockHistory.length > 0) {
                const subjects = {};
                stats.mockHistory.forEach(m => {
                    const subj = m.title.split('Mock')[0].trim();
                    if (!subjects[subj]) subjects[subj] = { acc: 0, count: 0 };
                    subjects[subj].acc += m.pct;
                    subjects[subj].count++;
                });
                for (const s in subjects) {
                    const avg = subjects[s].acc / subjects[s].count;
                    if (avg < worstAccuracy) { worstAccuracy = Math.round(avg); prioritySubject = s; }
                }
            }
        }
    } catch (e) { console.warn("Audit failed:", e); }

    try {
        const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                type: 'planner',
                subject: prioritySubject, 
                accuracy: worstAccuracy,
                name: session.name,
                email: session.email
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "AI Strategy Engine currently busy.");
        }

        const plan = await res.json();
        const planData = { plan, timestamp: Date.now() };
        
        // Save to localStorage
        localStorage.setItem(PLAN_KEY, JSON.stringify(planData));
        
        // Save to Firestore for cross-device persistence
        if (typeof window.fbSavePlan === 'function') {
            window.fbSavePlan(session.email, plan).catch(e => console.warn('[Planner] Firebase save failed:', e));
        }
        
        renderMission(plan);
    } catch (err) {
        console.error("Planner generation failed:", err);
        if (timetableEl) {
            timetableEl.innerHTML = `
                <div style="background:rgba(239, 68, 68, 0.1); border:1px solid #ef4444; border-radius:8px; padding:1rem; color:#ef4444; font-size:0.85rem;">
                    <strong>Generation Failed:</strong> ${err.message}<br>
                    <button onclick="refreshPlan()" style="margin-top:10px; background:#ef4444; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer;">Try Again</button>
                </div>
            `;
        }
    }
}

function renderMission(plan) {
    const topicEl = document.getElementById("planTopic");
    const tasksEl = document.getElementById("planTasks");
    const motivEl = document.getElementById("planMotivation");
    const diffEl = document.getElementById("planDifficulty");
    const timetableEl = document.getElementById("planTimetable");

    const sm = (val) => {
        if (!val) return "";
        return Array.isArray(val) ? val.join("\n") : String(val);
    };

    if (topicEl) topicEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(sm(plan.topic)) : sm(plan.topic);
    if (motivEl) motivEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(`"${sm(plan.motivation)}"`) : `"${sm(plan.motivation)}"`;
    
    if (timetableEl && plan.timetable) {
        timetableEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(sm(plan.timetable)) : sm(plan.timetable);
    }

    if (diffEl) {
        diffEl.innerText = plan.difficulty || "Medium";
        diffEl.className = "meta-chip " + (plan.difficulty?.toLowerCase() === 'hard' ? 'difficulty-hard' : '');
    }

    if (tasksEl && plan.tasks) {
        const tasks = Array.isArray(plan.tasks) ? plan.tasks : [plan.tasks];
        tasksEl.innerHTML = tasks.map(t => {
            const renderedText = typeof marked !== 'undefined' ? marked.parseInline(sm(t)) : sm(t);
            return `
                <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
                    <input type="checkbox" style="margin-top:4px;">
                    <span style="font-size:0.9rem;color:var(--text-secondary); line-height:1.4;">${renderedText}</span>
                </div>
            `;
        }).join('');
    }

    const missionCard = document.getElementById("missionCard");
    if (missionCard && typeof renderMathInElement !== 'undefined') {
        renderMathInElement(missionCard, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false
        });
    }

    const missionContainer = document.getElementById("missionContainer");
    if (missionContainer) missionContainer.style.opacity = "1";
}

async function renderSubjectGaps(email) {
    const container = document.getElementById("gapsContainer");
    if (!container) return;

    // Try loading from Firebase
    if (email && typeof window.fbGetTopicMastery === 'function') {
        try {
            const mastery = await window.fbGetTopicMastery(email);
            const topics = Object.entries(mastery);
            if (topics.length > 0) {
                // Sort weakest first
                topics.sort((a, b) => (a[1].pct || 0) - (b[1].pct || 0));
                const COLORS = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];
                container.innerHTML = topics.slice(0, 6).map(([name, data], i) => {
                    const lvl = data.pct || 0;
                    const color = COLORS[i % COLORS.length];
                    return `
                        <div style="margin-bottom:1.5rem;">
                            <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:6px;">
                                <span style="font-weight:700;color:var(--text-primary);">${name} Mastery</span>
                                <span style="color:${lvl < 50 ? '#f87171' : lvl < 70 ? '#fbbf24' : '#34d399'};font-weight:700">${lvl}%</span>
                            </div>
                            <div style="height:6px;background:rgba(255,255,255,0.05);border-radius:100px;overflow:hidden;">
                                <div style="width:${lvl}%; height:100%; background:${color}; box-shadow:0 0 10px ${color}44; transition: width 1s ease;"></div>
                            </div>
                        </div>
                    `;
                }).join('');
                return;
            }
        } catch(e) { console.warn('[Planner] Firebase mastery fetch failed'); }
    }

    // Fallback to dummy gaps
    const dummyGaps = [
        { name: "Chemistry", level: 45, color: "#fb923c" },
        { name: "Physics", level: 62, color: "#f87171" },
        { name: "Core Maths", level: 78, color: "#6366f1" }
    ];
    container.innerHTML = dummyGaps.map(g => `
        <div style="margin-bottom:1.5rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:6px;">
                <span style="font-weight:700;color:var(--text-primary);">${g.name} Mastery</span>
                <span style="color:var(--text-muted);">${g.level}%</span>
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.05);border-radius:100px;overflow:hidden;">
                <div style="width:${g.level}%; height:100%; background:${g.color}; box-shadow:0 0 10px ${g.color}44;"></div>
            </div>
        </div>
    `).join('');
}
