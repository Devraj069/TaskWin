// Firebase Configuration
// You'll need to replace these with your actual Firebase config values

const firebaseConfig = {
    apiKey: "AIzaSyDn70b9dtyuX90Li3lXFRmqEQmpaVg8U_g",
    authDomain: "taskwin-1322c.firebaseapp.com",
    databaseURL: "https://taskwin-1322c-default-rtdb.firebaseio.com",
    projectId: "taskwin-1322c",
    storageBucket: "taskwin-1322c.firebasestorage.app",
    messagingSenderId: "745931149570",
    appId: "1:745931149570:web:412a93974740c364e7721b",
    measurementId: "G-LYTJRVE38B"
};

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, orderBy, limit, where, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Export for use in other modules
export { 
    auth, 
    db,
    analytics,
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    where,
    onSnapshot,
    serverTimestamp
};

// Firebase configuration status
export const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey !== "your-api-key-here" && firebaseConfig.apiKey === "AIzaSyDn70b9dtyuX90Li3lXFRmqEQmpaVg8U_g";
};

// Helper function to show configuration instructions
export const showConfigInstructions = () => {
    console.log(`
🔥 Firebase Configuration Required!

To complete setup:
1. Go to https://console.firebase.google.com/
2. Create a new project or select existing one
3. Go to Project Settings > General
4. Add a web app and copy the configuration
5. Replace the firebaseConfig object in js/firebase-config.js

Current config status: ${isFirebaseConfigured() ? 'Configured ✅' : 'Not configured ❌'}
    `);
    
    if (!isFirebaseConfigured()) {
        // Show user-friendly message in UI
        const alertDiv = document.createElement('div');
        alertDiv.className = 'fixed top-4 right-4 bg-vibrant-orange text-white p-4 rounded-lg shadow-lg z-50';
        alertDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span>Firebase configuration required. Check console for instructions.</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 10000);
    }
};