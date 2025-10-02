import { db } from "./firebase-config.js"
import { logout, getCurrentUserProfile } from "./auth.js"
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"
import { formatDate } from "./main.js"

// Logout handler
const logoutBtn = document.getElementById("logout-btn")
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout)
}

// Load dashboard data
async function loadDashboard() {
  try {
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) return

    // Update user name
    document.getElementById("user-name").textContent = userProfile.name

    // Show host-specific elements if user is a host
    if (userProfile.role === "host") {
      document.getElementById("my-sessions-link").style.display = "block"
      document.getElementById("create-session-card").style.display = "flex"
      document.getElementById("host-stats").style.display = "flex"
      await loadHostStats(userProfile.uid)
    }

    // Load booking stats
    await loadBookingStats(userProfile.uid)

    // Load recent activity
    await loadRecentActivity(userProfile.uid)
  } catch (error) {
    console.error("Error loading dashboard:", error)
  }
}

async function loadBookingStats(userId) {
  try {
    const bookingsRef = collection(db, "bookings")
    const q = query(bookingsRef, where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    let upcoming = 0
    let completed = 0
    const now = new Date()

    querySnapshot.forEach((doc) => {
      const booking = doc.data()
      const sessionDate = new Date(booking.date)

      if (booking.status === "confirmed") {
        if (sessionDate > now) {
          upcoming++
        } else {
          completed++
        }
      }
    })

    document.getElementById("upcoming-bookings").textContent = upcoming
    document.getElementById("completed-bookings").textContent = completed
  } catch (error) {
    console.error("Error loading booking stats:", error)
  }
}

async function loadHostStats(userId) {
  try {
    const sessionsRef = collection(db, "sessions")
    const q = query(sessionsRef, where("hostId", "==", userId), where("status", "==", "active"))
    const querySnapshot = await getDocs(q)

    document.getElementById("active-sessions").textContent = querySnapshot.size
  } catch (error) {
    console.error("Error loading host stats:", error)
  }
}

async function loadRecentActivity(userId) {
  try {
    const bookingsRef = collection(db, "bookings")
    const q = query(bookingsRef, where("userId", "==", userId), orderBy("bookedAt", "desc"), limit(5))
    const querySnapshot = await getDocs(q)

    const activityList = document.getElementById("activity-list")

    if (querySnapshot.empty) {
      activityList.innerHTML = '<p class="empty-state">No recent activity</p>'
      return
    }

    activityList.innerHTML = ""

    querySnapshot.forEach((doc) => {
      const booking = doc.data()
      const activityItem = document.createElement("div")
      activityItem.className = "activity-item"

      const statusClass = booking.status === "confirmed" ? "status-confirmed" : "status-cancelled"

      activityItem.innerHTML = `
                <div class="activity-content">
                    <h4>${booking.sessionTitle}</h4>
                    <p>${formatDate(booking.date)} at ${booking.time}</p>
                </div>
                <span class="activity-status ${statusClass}">${booking.status}</span>
            `

      activityList.appendChild(activityItem)
    })
  } catch (error) {
    console.error("Error loading recent activity:", error)
  }
}

// Initialize dashboard
if (document.getElementById("user-name")) {
  loadDashboard()
}
