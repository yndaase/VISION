/**
 * Firebase Configuration for Vision AI
 * Handles chat history persistence
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCLvmFR4NU6aIbDc-75EsBL-K9pqlNa5E",
  authDomain: "vision-education-8a794.firebaseapp.com",
  projectId: "vision-education-8a794",
  storageBucket: "vision-education-8a794.appspot.com",
  messagingSenderId: "324420775871",
  appId: "1:324420775871:web:b0371a1561be77b085fb0a",
  measurementId: "G-CCQSKNZKKW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
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
    const q = query(sessionsRef, orderBy("lastUpdated", "desc"), limit(50));
    
    const snapshot = await getDocs(q);
    const sessions = [];
    snapshot.forEach(doc => {
      sessions.push({ 
        sessionId: doc.id, 
        ...doc.data() 
      });
    });
    
    console.log(`[Firebase] Loaded ${sessions.length} sessions`);
    return sessions;
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
