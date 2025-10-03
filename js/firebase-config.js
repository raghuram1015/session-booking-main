  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  const analytics = getAnalytics(app);
