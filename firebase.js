import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

/* ─────────────────────────────────────────────────────────────
   USER DATABASE  (Firestore collection: "users")
   Document ID = lowercased email address
   ───────────────────────────────────────────────────────────── */

/**
 * Fetch a single user by email from Firestore.
 * Returns the user object or null if not found.
 */
window.fbGetUser = async function(email) {
  if (!email) return null;
  try {
    const docSnap = await getDoc(doc(db, "users", email.toLowerCase()));
    if (docSnap.exists()) return docSnap.data();
    return null;
  } catch(err) {
    console.warn("[Firebase] fbGetUser failed:", err.message);
    return null;
  }
};

/**
 * Save (upsert) a user to Firestore.
 * Merges with any existing document so no data is lost.
 */
window.fbSaveUser = async function(user) {
  if (!user || !user.email) return;
  try {
    const key = user.email.toLowerCase();
    // Never store raw passwords — only hashes
    const payload = { ...user, email: key, lastUpdated: new Date().toISOString() };
    await setDoc(doc(db, "users", key), payload, { merge: true });
    console.log(`[Firebase] User saved: ${key}`);
  } catch(err) {
    console.warn("[Firebase] fbSaveUser failed:", err.message);
  }
};

/**
 * Update only specific fields of a user doc (e.g. role, subscriptionExpiry).
 */
window.fbUpdateUser = async function(email, fields) {
  if (!email || !fields) return;
  try {
    const key = email.toLowerCase();
    await updateDoc(doc(db, "users", key), {
      ...fields,
      lastUpdated: new Date().toISOString()
    });
    console.log(`[Firebase] User updated: ${key}`, fields);
  } catch(err) {
    // If the document doesn't exist yet, fall back to setDoc
    try {
      await setDoc(doc(db, "users", email.toLowerCase()), { email: email.toLowerCase(), ...fields, lastUpdated: new Date().toISOString() }, { merge: true });
    } catch(e) {
      console.warn("[Firebase] fbUpdateUser failed:", e.message);
    }
  }
};

/**
 * Get all users from Firestore (admin only).
 * Returns an array of user objects.
 */
window.fbGetAllUsers = async function() {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const users = [];
    snapshot.forEach(d => users.push(d.data()));
    return users;
  } catch(err) {
    console.warn("[Firebase] fbGetAllUsers failed:", err.message);
    return [];
  }
};

/**
 * Seeds the 4 hardcoded system accounts into Firestore if they don't exist.
 * Called once on auth.js DOMContentLoaded.
 */
window.adminInitFirebase = async function(accounts) {
  if (!accounts || !accounts.length) return;
  for (const account of accounts) {
    try {
      const key = account.email.toLowerCase();
      const existing = await getDoc(doc(db, "users", key));
      if (!existing.exists()) {
        // New account — create it
        await setDoc(doc(db, "users", key), {
          ...account,
          email: key,
          createdAt: Date.now(),
          lastUpdated: new Date().toISOString()
        });
        console.log(`[Firebase] Seeded system account: ${key}`);
      } else {
        // Existing — update role/hash but preserve other fields
        const data = existing.data();
        await setDoc(doc(db, "users", key), {
          ...data,
          role: account.role,
          hash: account.hash,
          ...(account.schoolName ? { schoolName: account.schoolName } : {}),
          ...(account.schoolCode ? { schoolCode: account.schoolCode } : {}),
          ...(account.institutionId ? { institutionId: account.institutionId } : {}),
          ...(account.subscriptionExpiry ? { subscriptionExpiry: account.subscriptionExpiry } : {}),
          lastUpdated: new Date().toISOString()
        });
      }
    } catch(err) {
      console.warn(`[Firebase] adminInitFirebase failed for ${account.email}:`, err.message);
    }
  }
};

/* ─────────────────────────────────────────────────────────────
   STUDENT STATS  (Firestore collection: "student_stats")
   ───────────────────────────────────────────────────────────── */

/**
 * Syncs student's local localStorage data to Firebase
 */
window.syncStateToCloud = async function(email) {
  if (!email) return;

  try {
    const statsKey = 'waec_stats_' + email;
    const streakKey = 'vision_streak_' + email;
    const mockKey = 'vision_last_mock_result';

    let stats = { answered: 0, correct: 0 };
    try { stats = JSON.parse(localStorage.getItem(statsKey)) || stats; } catch(e) {}

    let streak = { currentStreak: 0 };
    try { streak = JSON.parse(localStorage.getItem(streakKey)) || streak; } catch(e) {}

    let lastMock = null;
    try { lastMock = JSON.parse(localStorage.getItem(mockKey)); } catch(e) {}
    if (lastMock && lastMock.email !== email) lastMock = null;

    const payload = {
      stats,
      streak,
      lastMock,
      lastUpdated: new Date().toISOString()
    };

    await setDoc(doc(db, "student_stats", email.toLowerCase()), payload, { merge: true });
    console.log(`[Firebase] Stats synced for ${email}`);
  } catch(error) {
    console.error(`[Firebase] syncStateToCloud failed:`, error);
  }
};

/**
 * Retrieves the latest stats for a specific student from Firebase
 */
window.pullStateFromCloud = async function(email) {
  if (!email) return null;
  try {
    const docSnap = await getDoc(doc(db, "student_stats", email.toLowerCase()));
    if (docSnap.exists()) return docSnap.data();
    return null;
  } catch(error) {
    console.error(`[Firebase] pullStateFromCloud failed:`, error);
    return null;
  }
};

/* ─────────────────────────────────────────────────────────────
   PARENT LINKING  (Firestore collection: "student_links")
   ───────────────────────────────────────────────────────────── */

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
    console.error("[Firebase] generateLinkingCode failed:", error);
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
    console.error("[Firebase] verifyLinkingCode failed:", error);
    return null;
  }
};

/* ─────────────────────────────────────────────────────────────
   AUTO-SYNC on import (non-parent pages)
   ───────────────────────────────────────────────────────────── */
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
