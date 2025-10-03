// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAGUYloq3Ktq5POWrTEj8ui7pHaNW3poBE",
  authDomain: "session-booker-5422.firebaseapp.com",
  projectId: "session-booker-5422",
  storageBucket: "session-booker-5422.firebasestorage.app",
  messagingSenderId: "942763853117",
  appId: "1:942763853117:web:bb82beb454ffea850cf154",
  measurementId: "G-7C3Z463NW4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services that other files in your project need
export const auth = getAuth(app);
export const db = getFirestore(app);
