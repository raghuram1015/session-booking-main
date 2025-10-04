import { auth, db } from "./firebase-config.js"
import { logout, getCurrentUserProfile } from "./auth.js"
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"
import { showNotification } from "./main.js"

// Logout handler
const logoutBtn = document.getElementById("logout-btn")
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout)
}

// Load profile data
async function loadProfile() {
  try {
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) return

    // Show host-specific navigation
    if (userProfile.role === "host") {
      document.getElementById("my-sessions-link").style.display = "block"
    }

    const profileUserName = document.getElementById("profile-user-name")
    if (profileUserName) {
      profileUserName.textContent = userProfile.name
    }

    // Populate form
    document.getElementById("name").value = userProfile.name || ""
    document.getElementById("email").value = userProfile.email || ""
    document.getElementById("role").value = userProfile.role === "host" ? "Host (Expert)" : "User (Booking)"
    document.getElementById("bio").value = userProfile.bio || ""
    document.getElementById("skills").value = userProfile.skills ? userProfile.skills.join(", ") : ""
  } catch (error) {
    console.error("Error loading profile:", error)
  }
}

// Profile form handler
const profileForm = document.getElementById("profile-form")
if (profileForm) {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = document.getElementById("name").value
    const bio = document.getElementById("bio").value
    const skillsInput = document.getElementById("skills").value
    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s)

    const errorMessage = document.getElementById("error-message")
    const successMessage = document.getElementById("success-message")

    try {
      const user = auth.currentUser
      if (!user) return

      await updateDoc(doc(db, "users", user.uid), {
        name: name,
        bio: bio,
        skills: skills,
      })

      successMessage.textContent = "Profile updated successfully!"
      successMessage.style.display = "block"
      errorMessage.style.display = "none"

      showNotification("Profile updated successfully!", "success")

      setTimeout(() => {
        successMessage.style.display = "none"
      }, 3000)
    } catch (error) {
      errorMessage.textContent = error.message
      errorMessage.style.display = "block"
      successMessage.style.display = "none"
    }
  })
}

// Initialize profile page
if (document.getElementById("profile-form")) {
  loadProfile()
}
