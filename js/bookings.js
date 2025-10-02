import { db } from "./firebase-config.js"
import { logout, getCurrentUserProfile } from "./auth.js"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"
import { formatDate, showNotification } from "./main.js"

// Logout handler
const logoutBtn = document.getElementById("logout-btn")
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout)
}

// Show host navigation if user is a host
async function checkUserRole() {
  const userProfile = await getCurrentUserProfile()
  if (userProfile && userProfile.role === "host") {
    const mySessionsLink = document.getElementById("my-sessions-link")
    if (mySessionsLink) {
      mySessionsLink.style.display = "block"
    }
  }
}
checkUserRole()

// Tab switching
const tabBtns = document.querySelectorAll(".tab-btn")
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Remove active class from all tabs
    tabBtns.forEach((b) => b.classList.remove("active"))
    btn.classList.add("active")

    // Hide all booking containers
    document.getElementById("upcoming-bookings").style.display = "none"
    document.getElementById("past-bookings").style.display = "none"

    // Show selected container
    const tab = btn.dataset.tab
    document.getElementById(`${tab}-bookings`).style.display = "block"
  })
})

// Load bookings
async function loadBookings() {
  try {
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) return

    const bookingsRef = collection(db, "bookings")
    const q = query(bookingsRef, where("userId", "==", userProfile.uid))
    const querySnapshot = await getDocs(q)

    const upcomingContainer = document.getElementById("upcoming-bookings")
    const pastContainer = document.getElementById("past-bookings")

    if (querySnapshot.empty) {
      upcomingContainer.innerHTML = '<p class="empty-state">No upcoming bookings</p>'
      pastContainer.innerHTML = '<p class="empty-state">No past bookings</p>'
      return
    }

    const upcomingBookings = []
    const pastBookings = []
    const now = new Date()

    querySnapshot.forEach((docSnap) => {
      const booking = { id: docSnap.id, ...docSnap.data() }
      const sessionDate = new Date(booking.date)

      if (sessionDate > now && booking.status === "confirmed") {
        upcomingBookings.push(booking)
      } else {
        pastBookings.push(booking)
      }
    })

    // Sort by date
    upcomingBookings.sort((a, b) => new Date(a.date) - new Date(b.date))
    pastBookings.sort((a, b) => new Date(b.date) - new Date(a.date))

    // Render upcoming bookings
    if (upcomingBookings.length === 0) {
      upcomingContainer.innerHTML = '<p class="empty-state">No upcoming bookings</p>'
    } else {
      upcomingContainer.innerHTML = ""
      upcomingBookings.forEach((booking) => {
        const bookingCard = createBookingCard(booking, true)
        upcomingContainer.appendChild(bookingCard)
      })
    }

    // Render past bookings
    if (pastBookings.length === 0) {
      pastContainer.innerHTML = '<p class="empty-state">No past bookings</p>'
    } else {
      pastContainer.innerHTML = ""
      pastBookings.forEach((booking) => {
        const bookingCard = createBookingCard(booking, false)
        pastContainer.appendChild(bookingCard)
      })
    }
  } catch (error) {
    console.error("Error loading bookings:", error)
  }
}

// Create booking card
function createBookingCard(booking, isUpcoming) {
  const card = document.createElement("div")
  card.className = "booking-card"

  const statusClass = booking.status === "confirmed" ? "status-confirmed" : "status-cancelled"

  card.innerHTML = `
        <div class="booking-header">
            <h3>${booking.sessionTitle}</h3>
            <span class="booking-status ${statusClass}">${booking.status}</span>
        </div>
        <div class="booking-details">
            <div class="booking-detail-item">
                <span class="detail-icon">📅</span>
                <span>${formatDate(booking.date)}</span>
            </div>
            <div class="booking-detail-item">
                <span class="detail-icon">⏰</span>
                <span>${booking.time}</span>
            </div>
            <div class="booking-detail-item">
                <span class="detail-icon">👤</span>
                <span>Host: ${booking.hostName || "N/A"}</span>
            </div>
        </div>
        ${
          isUpcoming && booking.status === "confirmed"
            ? `
            <div class="booking-actions">
                <button class="btn-danger" onclick="cancelBooking('${booking.id}', '${booking.sessionId}')">
                    Cancel Booking
                </button>
            </div>
        `
            : ""
        }
    `

  return card
}

// Cancel booking
window.cancelBooking = async (bookingId, sessionId) => {
  if (!confirm("Are you sure you want to cancel this booking?")) return

  try {
    // Update booking status
    await updateDoc(doc(db, "bookings", bookingId), {
      status: "cancelled",
    })

    // Get session and decrease booking count
    const sessionRef = doc(db, "sessions", sessionId)
    const sessionSnap = await getDoc(sessionRef)

    if (sessionSnap.exists()) {
      const session = sessionSnap.data()
      await updateDoc(sessionRef, {
        currentBookings: Math.max(0, session.currentBookings - 1),
      })
    }

    showNotification("Booking cancelled successfully", "success")
    loadBookings()
  } catch (error) {
    console.error("Error cancelling booking:", error)
    showNotification("Failed to cancel booking", "error")
  }
}

// Load bookings on page load
if (document.getElementById("upcoming-bookings")) {
  loadBookings()
}
