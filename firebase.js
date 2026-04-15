import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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
const auth = getAuth(app);
const storage = getStorage(app);

window.fbAuth = auth;
window.fbStorage = storage;

/* ─────────────────────────────────────────────────────────────
   USER DATABASE  (Firestore collection: "users")
   Document ID = lowercased email address
   ───────────────────────────────────────────────────────────── */

/**
 * Fetch a single user by email from Firestore.
 * @param {string} email
 * @param {string} [collectionName='users'] - Override collection (e.g. 'parent_users')
 * Returns the user object or null if not found.
 */
window.fbGetUser = async function(email, collectionName = 'users') {
  if (!email) return null;
  try {
    const docSnap = await getDoc(doc(db, collectionName, email.toLowerCase()));
    if (docSnap.exists()) return docSnap.data();
    return null;
  } catch(err) {
    console.warn(`[Firebase] fbGetUser(${collectionName}) failed:`, err.message);
    return null;
  }
};
export const fbGetUser = window.fbGetUser;

/**
 * Save (upsert) a user to Firestore.
 * @param {object} user
 * @param {string} [collectionName='users']
 */
window.fbSaveUser = async function(user, collectionName = 'users') {
  if (!user || !user.email) return;
  try {
    const key = user.email.toLowerCase();
    const payload = { ...user, email: key, lastUpdated: new Date().toISOString() };
    await setDoc(doc(db, collectionName, key), payload, { merge: true });
    console.log(`[Firebase] User saved to ${collectionName}: ${key}`);
  } catch(err) {
    console.warn(`[Firebase] fbSaveUser(${collectionName}) failed:`, err.message);
  }
};
export const fbSaveUser = window.fbSaveUser;

/**
 * Update specific fields on a user document.
 * @param {string} email
 * @param {object} fields
 * @param {string} [collectionName='users']
 */
window.fbUpdateUser = async function(email, fields, collectionName = 'users') {
  if (!email || !fields) return;
  try {
    const key = email.toLowerCase();
    const ref = doc(db, collectionName, key);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { ...fields, lastUpdated: new Date().toISOString() });
    } else {
      await setDoc(ref, { email: key, ...fields, lastUpdated: new Date().toISOString() }, { merge: true });
    }
  } catch(e) {
    console.warn(`[Firebase] fbUpdateUser(${collectionName}) failed:`, e.message);
  }
};
export const fbUpdateUser = window.fbUpdateUser;



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
   TOPIC MASTERY  (stored inside student_stats doc)
   ───────────────────────────────────────────────────────────── */

/**
 * Save per-topic mastery score to Firestore.
 * topicScores = { "Core Mathematics": { correct: 12, total: 20 }, ... }
 */
window.fbSaveTopicMastery = async function(email, topicScores) {
  if (!email || !topicScores) return;
  try {
    await setDoc(doc(db, "student_stats", email.toLowerCase()), {
      topicMastery: topicScores,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    console.log('[Firebase] Topic mastery saved for', email);
  } catch(err) {
    console.warn('[Firebase] fbSaveTopicMastery failed:', err.message);
  }
};

/**
 * Get topic mastery for a student.
 * Returns { "Core Mathematics": { correct: 12, total: 20, pct: 60 }, ... }
 */
window.fbGetTopicMastery = async function(email) {
  if (!email) return {};
  try {
    const snap = await getDoc(doc(db, "student_stats", email.toLowerCase()));
    if (snap.exists()) return snap.data().topicMastery || {};
    return {};
  } catch(err) {
    console.warn('[Firebase] fbGetTopicMastery failed:', err.message);
    return {};
  }
};
export const fbGetTopicMastery = window.fbGetTopicMastery;

/**
 * Get top N students sorted by score for the leaderboard.
 * Returns array of { name, email, score, accuracy, school }
 */
window.fbGetLeaderboard = async function(limit = 50) {
  try {
    const snapshot = await getDocs(collection(db, "student_stats"));
    const entries = [];
    snapshot.forEach(d => {
      const data = d.data();
      if (data.stats && data.stats.answered > 0) {
        const accuracy = Math.round((data.stats.correct / data.stats.answered) * 100);
        entries.push({
          email: d.id,
          name: data.name || d.id.split('@')[0],
          school: data.school || 'Vision Academy',
          score: (data.stats.correct * 10) + data.stats.answered,
          accuracy,
          correct: data.stats.correct,
          answered: data.stats.answered,
          streak: data.streak?.currentStreak || 0
        });
      }
    });
    return entries.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch(err) {
    console.warn('[Firebase] fbGetLeaderboard failed:', err.message);
    return [];
  }
};

/* ─────────────────────────────────────────────────────────────
   STUDY PLANNER  (Firestore collection: "student_plans")
   ───────────────────────────────────────────────────────────── */

/**
 * Save AI-generated study plan to Firestore.
 */
window.fbSavePlan = async function(email, plan) {
  if (!email || !plan) return;
  try {
    await setDoc(doc(db, "student_plans", email.toLowerCase()), {
      plan,
      timestamp: Date.now(),
      generatedAt: new Date().toISOString()
    });
    console.log('[Firebase] Study plan saved for', email);
  } catch(err) {
    console.warn('[Firebase] fbSavePlan failed:', err.message);
  }
};

/**
 * Load AI-generated study plan from Firestore.
 * Returns { plan, timestamp } or null.
 */
window.fbGetPlan = async function(email) {
  if (!email) return null;
  try {
    const snap = await getDoc(doc(db, "student_plans", email.toLowerCase()));
    if (snap.exists()) return snap.data();
    return null;
  } catch(err) {
    console.warn('[Firebase] fbGetPlan failed:', err.message);
    return null;
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
export const pullStateFromCloud = window.pullStateFromCloud;

/* ─────────────────────────────────────────────────────────────
   PARENT LINKING  (Firestore collection: "student_links")
   ───────────────────────────────────────────────────────────── */

/**
 * Generates a 6-digit secure linking code for a student
 */
window.generateLinkingCode = async function(email, childName, childSchool) {
  if (!email) return null;
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const payload = {
      codeExpires: Date.now() + 15 * 60 * 1000, // 15 mins
      email: email.toLowerCase(),
      childEmail: email.toLowerCase(),
      childName: childName || email.split('@')[0],
      childSchool: childSchool || ''
    };
    await setDoc(doc(db, "student_links", code), payload);
    return code;
  } catch(error) {
    console.error("[Firebase] generateLinkingCode failed:", error);
    return null;
  }
};

/**
 * Verifies a 6-digit secure linking code and returns the full link payload
 * (childEmail, childName, childSchool, expiresAt)
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

/**
 * Get full link code payload for parent portal linking.
 * Returns { childEmail, childName, childSchool, codeExpires } or null.
 */
const _fbGetLinkCode = async function(code) {
  if (!code) return null;
  try {
    const docSnap = await getDoc(doc(db, "student_links", code));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (Date.now() > (data.codeExpires || 0)) return null;
      return {
        childEmail: data.email || data.childEmail,
        childName: data.childName || null,
        childSchool: data.childSchool || null,
        codeExpires: data.codeExpires
      };
    }
    return null;
  } catch(error) {
    console.error("[Firebase] fbGetLinkCode failed:", error);
    return null;
  }
};
window.fbGetLinkCode = _fbGetLinkCode;
export const fbGetLinkCode = _fbGetLinkCode;

/* ─────────────────────────────────────────────────────────────
   LEARNING MATERIALS  (Firestore collection: "learning_materials")
   ───────────────────────────────────────────────────────────── */

/**
 * Save or update a material in Firestore.
 */
window.fbSaveMaterial = async function(mat) {
  if (!mat || !mat.id) return;
  try {
    await setDoc(doc(db, "learning_materials", mat.id), mat, { merge: true });
    console.log('[Firebase] Material saved:', mat.title);
  } catch(err) {
    console.error('[Firebase] fbSaveMaterial failed:', err.message);
  }
};

/**
 * Get all learning materials from Firestore.
 */
window.fbGetMaterials = async function() {
  try {
    const snapshot = await getDocs(collection(db, "learning_materials"));
    const mats = [];
    snapshot.forEach(d => mats.push(d.data()));
    return mats;
  } catch(err) {
    console.error('[Firebase] fbGetMaterials failed:', err.message);
    return [];
  }
};

/**
 * Delete a material from Firestore.
 */
window.fbDeleteMaterial = async function(id) {
  if (!id) return;
  try {
    await deleteDoc(doc(db, "learning_materials", id));
    console.log('[Firebase] Material deleted:', id);
  } catch(err) {
    console.error('[Firebase] fbDeleteMaterial failed:', err.message);
  }
};

/* ─────────────────────────────────────────────────────────────
   BROADCASTS  (Firestore collection: "broadcasts")
   ───────────────────────────────────────────────────────────── */

/**
 * Save a new broadcast announcement to Firestore.
 */
window.fbSaveBroadcast = async function(broadcast) {
  if (!broadcast || !broadcast.id) return;
  try {
    await setDoc(doc(db, "broadcasts", broadcast.id), broadcast);
    console.log('[Firebase] Broadcast saved:', broadcast.title);
  } catch(err) {
    console.error('[Firebase] fbSaveBroadcast failed:', err.message);
  }
};

/**
 * Get the latest broadcasts from Firestore.
 */
window.fbGetBroadcasts = async function() {
  try {
    const snapshot = await getDocs(collection(db, "broadcasts"));
    const list = [];
    snapshot.forEach(d => list.push(d.data()));
    // Sort by date descending
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch(err) {
    console.error('[Firebase] fbGetBroadcasts failed:', err.message);
    return [];
  }
};

/**
 * Delete a broadcast from Firestore.
 */
window.fbDeleteBroadcast = async function(id) {
  if (!id) return;
  try {
    await deleteDoc(doc(db, "broadcasts", id));
    console.log('[Firebase] Broadcast deleted:', id);
  } catch(err) {
    console.error('[Firebase] fbDeleteBroadcast failed:', err.message);
  }
};

/* ─────────────────────────────────────────────────────────────
   STORAGE UPLOADS
   ───────────────────────────────────────────────────────────── */
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Upload a file to Firebase Storage.
 * @param {File} file - The file object to upload
 * @param {string} path - The storage path (e.g. 'materials/physics.pdf')
 * @param {Function} onProgress - Progress callback (percentage)
 * @returns {Promise<string>} - Download URL
 */
window.fbUploadData = async function(file, path, onProgress) {
  if (!file) throw new Error("No file specialized for transmission.");
  if (file.size > MAX_FILE_SIZE) throw new Error("File exceeds 50MB tactical limit.");

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      }, 
      (error) => {
        console.error("[Storage] Upload failed:", error);
        reject(error);
      }, 
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject);
      }
    );
  });
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
