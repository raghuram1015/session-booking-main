import { auth, db } from "./firebase-config.js"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js"
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"

// Check authentication state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in
    const currentPage = window.location.pathname
    if (currentPage.includes("login.html") || currentPage.includes("register.html")) {
      window.location.href = "dashboard.html"
    }
  } else {
    // User is signed out
    const protectedPages = [
      "dashboard.html",
      "profile.html",
      "my-bookings.html",
      "create-session.html",
      "my-sessions.html",
    ]
    const currentPage = window.location.pathname
    if (protectedPages.some((page) => currentPage.includes(page))) {
      window.location.href = "login.html"
    }
  }
})

// Register Form Handler
const registerForm = document.getElementById("register-form")
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = document.getElementById("name").value
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const errorMessage = document.getElementById("error-message")

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: null, // Role not set yet
        bio: "",
        skills: [],
        createdAt: new Date().toISOString(),
      })

      // Redirect to dashboard
      window.location.href = "dashboard.html"
    } catch (error) {
      errorMessage.textContent = error.message
      errorMessage.style.display = "block"
    }
  })
}

// Login Form Handler
const loginForm = document.getElementById("login-form")
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const errorMessage = document.getElementById("error-message")

    try {
      await signInWithEmailAndPassword(auth, email, password)
      window.location.href = "dashboard.html"
    } catch (error) {
      errorMessage.textContent = "Invalid email or password"
      errorMessage.style.display = "block"
    }
  })
}

// Logout Function
export async function logout() {
  try {
    await signOut(auth)
    window.location.href = "../index.html"
  } catch (error) {
    console.error("Logout error:", error)
  }
}

// Get Current User Profile
export async function getCurrentUserProfile() {
  const user = auth.currentUser
  if (user) {
    const docRef = doc(db, "users", user.uid)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { uid: user.uid, ...docSnap.data() }
    }
  }
  return null
}