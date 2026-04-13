import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCLvmFR4NU6aIbDc-75EsBL-K9pqlNa5E",
  authDomain: "vision-education-8a794.firebaseapp.com",
  projectId: "vision-education-8a794",
  storageBucket: "vision-education-8a794.firebasestorage.app",
  messagingSenderId: "324420775871",
  appId: "1:324420775871:web:b0371a1561be77b085fb0a",
  measurementId: "G-CCQSKNZKKW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Syncs student's local localStorage data to Firebase
 */
window.syncStateToCloud = async function(email) {
  if (!email) return;

  try {
    // Collect stats from localStorage
    const statsKey = 'waec_stats_' + email;
    const streakKey = 'vision_streak_' + email;
    const mockKey = 'vision_last_mock_result';

    let stats = { answered: 0, correct: 0 };
    try { stats = JSON.parse(localStorage.getItem(statsKey)) || stats; } catch(e) {}

    let streak = { currentStreak: 0 };
    try { streak = JSON.parse(localStorage.getItem(streakKey)) || streak; } catch(e) {}

    let lastMock = null;
    try { lastMock = JSON.parse(localStorage.getItem(mockKey)); } catch(e) {}
    if (lastMock && lastMock.email !== email) {
        lastMock = null; // Don't upload a different user's mock result just because it's lingering
    }

    const payload = {
      stats: stats,
      streak: streak,
      lastMock: lastMock,
      lastUpdated: new Date().toISOString()
    };

    await setDoc(doc(db, "student_stats", email.toLowerCase()), payload, { merge: true });
    console.log(`[Firebase] Successfully pushed stats for ${email}`);
  } catch(error) { 
    console.error(`[Firebase] Failed to push stats:`, error);
  }
};

/**
 * Retrieves the latest live stats for a specific student from Firebase
 */
window.pullStateFromCloud = async function(email) {
  if (!email) return null;
  try {
    const docSnap = await getDoc(doc(db, "student_stats", email.toLowerCase()));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch(error) {
    console.error(`[Firebase] Failed to pull stats:`, error);
    return null;
  }
};

/**
 * Generates a 6-digit secure linking code for a student
 */
window.generateLinkingCode = async function(email) {
  if (!email) return null;
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const payload = {
      linkingCode: code,
      codeExpires: Date.now() + 15 * 60 * 1000, // 15 mins
      email: email.toLowerCase()
    };
    await setDoc(doc(db, "student_links", code), payload);
    return code;
  } catch(error) {
    console.error("[Firebase] Failed to generate code:", error);
    return null;
  }
};

/**
 * Verifies a 6-digit secure linking code and returns the linked student email
 */
window.verifyLinkingCode = async function(code) {
  if (!code) return null;
  try {
    const docSnap = await getDoc(doc(db, "student_links", code));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (Date.now() > data.codeExpires) return null; // Expired
      return data.email;
    }
    return null;
  } catch(error) {
    console.error("[Firebase] Failed to verify code:", error);
    return null;
  }
};

// Auto-sync when imported on student pages
if (typeof window !== 'undefined' && window.location.pathname !== '/parent-portal') {
  setTimeout(() => {
    try {
      const sessionString = sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session');
      if (sessionString) {
        const session = JSON.parse(sessionString);
        if (session && session.email && session.role !== 'parent') {
          window.syncStateToCloud(session.email);
        }
      }
    } catch(e) {}
  }, 2000);
}
