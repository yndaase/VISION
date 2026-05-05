/**
 * Firebase Configuration for Vision AI
 * Handles chat history persistence
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAD7pcqfK7xZ21mmfjI8aFrMqqOJWaJ5q8",
  authDomain: "vision-edu-491909.firebaseapp.com",
  projectId: "vision-edu-491909",
  storageBucket: "vision-edu-491909.firebasestorage.app",
  messagingSenderId: "378999569796",
  appId: "1:378999569796:web:795c728984977ba397b1d1",
  measurementId: "G-8EEL8JP4DV"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

/**
 * Save a message to Vision AI chat history
 * @param {string} userEmail - User's email
 * @param {string} sessionId - Chat session ID
 * @param {object} message - Message object { role, content, source?, timestamp }
 */
window.fbSaveVisionAIMessage = async function(userEmail, sessionId, message) {
  if (!userEmail || !sessionId || !message) return;
  
  try {
    const emailKey = userEmail.toLowerCase();
    const messagesRef = collection(db, "vision_ai_chats", emailKey, "sessions", sessionId, "messages");
    
    await addDoc(messagesRef, {
      ...message,
      timestamp: message.timestamp || Date.now(),
      savedAt: new Date().toISOString()
    });
    
    // Update session metadata
    await setDoc(doc(db, "vision_ai_chats", emailKey, "sessions", sessionId), {
      lastMessage: message.content.substring(0, 100),
      lastUpdated: new Date().toISOString(),
      messageCount: (await getDocs(messagesRef)).size
    }, { merge: true });
    
    console.log('[Firebase] Vision AI message saved');
  } catch(err) {
    console.warn('[Firebase] fbSaveVisionAIMessage failed:', err.message);
  }
};

/**
 * Load chat history for a session
 * @param {string} userEmail - User's email
 * @param {string} sessionId - Chat session ID
 * @returns {Array} - Array of messages
 */
window.fbLoadVisionAIHistory = async function(userEmail, sessionId) {
  if (!userEmail || !sessionId) return [];
  
  try {
    const emailKey = userEmail.toLowerCase();
    const messagesRef = collection(db, "vision_ai_chats", emailKey, "sessions", sessionId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    const snapshot = await getDocs(q);
    const messages = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`[Firebase] Loaded ${messages.length} messages for session ${sessionId}`);
    return messages;
  } catch(err) {
    console.warn('[Firebase] fbLoadVisionAIHistory failed:', err.message);
    return [];
  }
};

/**
 * Get all chat sessions for a user (for sidebar history)
 * @param {string} userEmail - User's email
 * @returns {Array} - Array of session summaries
 */
window.fbGetVisionAISessions = async function(userEmail) {
  if (!userEmail) return [];
  
  try {
    const emailKey = userEmail.toLowerCase();
    const sessionsRef = collection(db, "vision_ai_chats", emailKey, "sessions");
    
    // Simple query without orderBy to avoid index requirement
    const snapshot = await getDocs(sessionsRef);
    const sessions = [];
    snapshot.forEach(doc => {
      sessions.push({ 
        sessionId: doc.id, 
        ...doc.data() 
      });
    });
    
    // Sort in JavaScript instead of Firestore
    sessions.sort((a, b) => {
      const dateA = new Date(a.lastUpdated || 0);
      const dateB = new Date(b.lastUpdated || 0);
      return dateB - dateA; // Descending order
    });
    
    // Limit to 50
    const limited = sessions.slice(0, 50);
    
    console.log(`[Firebase] Loaded ${limited.length} sessions`);
    return limited;
  } catch(err) {
    console.warn('[Firebase] fbGetVisionAISessions failed:', err.message);
    return [];
  }
};

/**
 * Delete a chat session
 * @param {string} userEmail - User's email
 * @param {string} sessionId - Chat session ID
 */
window.fbDeleteVisionAISession = async function(userEmail, sessionId) {
  if (!userEmail || !sessionId) return;
  
  try {
    const emailKey = userEmail.toLowerCase();
    
    // Delete all messages in the session
    const messagesRef = collection(db, "vision_ai_chats", emailKey, "sessions", sessionId, "messages");
    const snapshot = await getDocs(messagesRef);
    const deletePromises = [];
    snapshot.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    await Promise.all(deletePromises);
    
    // Delete the session document
    await deleteDoc(doc(db, "vision_ai_chats", emailKey, "sessions", sessionId));
    
    console.log('[Firebase] Session deleted:', sessionId);
  } catch(err) {
    console.warn('[Firebase] fbDeleteVisionAISession failed:', err.message);
  }
};

/**
 * Clear all chat history for a user
 * @param {string} userEmail - User's email
 */
window.fbClearVisionAIHistory = async function(userEmail) {
  if (!userEmail) return;
  
  try {
    const emailKey = userEmail.toLowerCase();
    const sessionsRef = collection(db, "vision_ai_chats", emailKey, "sessions");
    const snapshot = await getDocs(sessionsRef);
    
    const deletePromises = [];
    snapshot.forEach(sessionDoc => {
      // Delete all messages in each session
      const messagesRef = collection(db, "vision_ai_chats", emailKey, "sessions", sessionDoc.id, "messages");
      getDocs(messagesRef).then(msgSnapshot => {
        msgSnapshot.forEach(msgDoc => {
          deletePromises.push(deleteDoc(msgDoc.ref));
        });
      });
      // Delete the session
      deletePromises.push(deleteDoc(sessionDoc.ref));
    });
    
    await Promise.all(deletePromises);
    console.log('[Firebase] All chat history cleared');
  } catch(err) {
    console.warn('[Firebase] fbClearVisionAIHistory failed:', err.message);
  }
};

console.log('[Firebase] Vision AI chat persistence initialized');
