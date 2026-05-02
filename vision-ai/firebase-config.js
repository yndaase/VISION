import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCLvmFR4NU6aIbDc-75EsBL-K9pqlNa5E",
  authDomain: "vision-education-8a794.firebaseapp.com",
  projectId: "vision-education-8a794",
  storageBucket: "vision-education-8a794.appspot.com",
  messagingSenderId: "324420775871",
  appId: "1:324420775871:web:b0371a1561be77b085fb0a",
  measurementId: "G-CCQSKNZKKW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

console.log('[Firebase] Initialized for Vision AI');
