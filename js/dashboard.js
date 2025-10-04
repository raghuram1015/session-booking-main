import { db } from "./firebase-config.js"
import { logout, getCurrentUserProfile } from "./auth.js"
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"
import { formatDate, showNotification } from "./main.js"

// Logout handler
const logoutBtn = document.getElementById("logout-btn")
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout)
}

window.selectRole = async (role) => {
  try {
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) return

    // Update user role in Firestore
    await updateDoc(doc(db, "users", userProfile.uid), {
      role: role,
    })

    // Hide modal and reload dashboard
    document.getElementById("role-selection-modal").style.display = "none"
    loadDashboard()
  } catch (error) {
    console.error("Error setting role:", error)
    alert("Failed to set role. Please try again.")
  }
}

// Load dashboard data
async function loadDashboard() {
  try {
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) return

    if (!userProfile.role) {
      document.getElementById("role-selection-modal").style.display = "flex"
      return
    }

    document.getElementById("user-name").textContent = userProfile.name

    if (userProfile.role === "host") {
      document.getElementById("role-description").textContent = "Manage your hosted sessions"
      document.getElementById("host-section").style.display = "block"
      document.getElementById("user-section").style.display = "none"
      document.getElementById("host-stats").style.display = "flex"
      await loadHostStats(userProfile.uid)
      await loadMySessions(userProfile.uid)
    } else {
      document.getElementById("role-description").textContent = "Browse and book sessions"
      document.getElementById("user-section").style.display = "block"
      document.getElementById("host-section").style.display = "none"
      await loadAvailableSessions()
      await loadMyBookings(userProfile.uid)
    }

    // Load booking stats for both roles
    await loadBookingStats(userProfile.uid)
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

async function loadAvailableSessions(categoryFilter = "") {
  try {
    const sessionsRef = collection(db, "sessions")
    let q

    if (categoryFilter) {
      q = query(
        sessionsRef,
        where("status", "==", "active"),
        where("category", "==", categoryFilter),
        orderBy("date", "asc"),
      )
    } else {
      q = query(sessionsRef, where("status", "==", "active"), orderBy("date", "asc"))
    }

    const querySnapshot = await getDocs(q)
    const sessionsGrid = document.getElementById("sessions-grid")

    if (querySnapshot.empty) {
      sessionsGrid.innerHTML = '<p class="empty-state">No sessions available</p>'
      return
    }

    sessionsGrid.innerHTML = ""

    querySnapshot.forEach((docSnap) => {
      const session = docSnap.data()
      const sessionCard = createSessionCard(docSnap.id, session)
      sessionsGrid.appendChild(sessionCard)
    })
  } catch (error) {
    console.error("Error loading sessions:", error)
  }
}

function createSessionCard(sessionId, session) {
  const card = document.createElement("div")
  card.className = "session-card"

  const spotsLeft = session.maxBookings - session.currentBookings
  const isFull = spotsLeft <= 0

  card.innerHTML = `
        <div class="session-header">
            <span class="session-category">${session.category}</span>
            <span class="session-price">$${session.price}</span>
        </div>
        <h3>${session.title}</h3>
        <p class="session-description">${session.description}</p>
        <div class="session-meta">
            <div class="meta-item">
                <span class="meta-icon">👤</span>
                <span>${session.hostName}</span>
            </div>
            <div class="meta-item">
                <span class="meta-icon">📅</span>
                <span>${formatDate(session.date)}</span>
            </div>
            <div class="meta-item">
                <span class="meta-icon">⏰</span>
                <span>${session.time} (${session.duration} min)</span>
            </div>
            <div class="meta-item">
                <span class="meta-icon">👥</span>
                <span>${spotsLeft} spots left</span>
            </div>
        </div>
        <button 
            class="btn-primary btn-full ${isFull ? "disabled" : ""}" 
            onclick="bookSession('${sessionId}')"
            ${isFull ? "disabled" : ""}
        >
            ${isFull ? "Fully Booked" : "Book Session"}
        </button>
    `

  return card
}

window.bookSession = async (sessionId) => {
  try {
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      showNotification("Please login to book a session", "error")
      return
    }

    // Get session details
    const sessionDoc = await getDoc(doc(db, "sessions", sessionId))
    if (!sessionDoc.exists()) {
      showNotification("Session not found", "error")
      return
    }

    const session = sessionDoc.data()

    // Check if already booked
    const bookingsRef = collection(db, "bookings")
    const q = query(
      bookingsRef,
      where("userId", "==", userProfile.uid),
      where("sessionId", "==", sessionId),
      where("status", "==", "confirmed"),
    )
    const existingBookings = await getDocs(q)

    if (!existingBookings.empty) {
      showNotification("You have already booked this session", "error")
      return
    }

    // Create booking
    await addDoc(collection(db, "bookings"), {
      sessionId: sessionId,
      sessionTitle: session.title,
      userId: userProfile.uid,
      userName: userProfile.name,
      hostId: session.hostId,
      date: session.date,
      time: session.time,
      meetingUrl: session.meetingUrl,
      status: "confirmed",
      bookedAt: new Date().toISOString(),
    })

    // Update session booking count
    await updateDoc(doc(db, "sessions", sessionId), {
      currentBookings: session.currentBookings + 1,
    })

    showNotification("Session booked successfully!", "success")
    loadDashboard()
  } catch (error) {
    console.error("Error booking session:", error)
    showNotification("Failed to book session", "error")
  }
}

async function loadMyBookings(userId) {
  try {
    const bookingsRef = collection(db, "bookings")
    const q = query(bookingsRef, where("userId", "==", userId), orderBy("bookedAt", "desc"))
    const querySnapshot = await getDocs(q)

    const bookingsList = document.getElementById("my-bookings-list")

    if (querySnapshot.empty) {
      bookingsList.innerHTML = '<p class="empty-state">No bookings yet</p>'
      return
    }

    bookingsList.innerHTML = ""

    querySnapshot.forEach((docSnap) => {
      const booking = docSnap.data()
      const bookingCard = createBookingCard(docSnap.id, booking)
      bookingsList.appendChild(bookingCard)
    })
  } catch (error) {
    console.error("Error loading bookings:", error)
  }
}

function createBookingCard(bookingId, booking) {
  const card = document.createElement("div")
  card.className = "booking-card"

  const statusClass = booking.status === "confirmed" ? "status-confirmed" : "status-cancelled"
  const sessionDate = new Date(booking.date)
  const now = new Date()
  const canCancel = booking.status === "confirmed" && sessionDate > now

  card.innerHTML = `
        <div class="booking-header">
            <h4>${booking.sessionTitle}</h4>
            <span class="booking-status ${statusClass}">${booking.status}</span>
        </div>
        <div class="booking-details">
            <p><strong>Date:</strong> ${formatDate(booking.date)}</p>
            <p><strong>Time:</strong> ${booking.time}</p>
            ${booking.meetingUrl ? `<p><strong>Meeting URL:</strong> <a href="${booking.meetingUrl}" target="_blank">${booking.meetingUrl}</a></p>` : ""}
        </div>
        ${
          canCancel
            ? `<button class="btn-danger btn-small" onclick="cancelBooking('${bookingId}')">Cancel Booking</button>`
            : ""
        }
    `

  return card
}

window.cancelBooking = async (bookingId) => {
  if (!confirm("Are you sure you want to cancel this booking?")) return

  try {
    const bookingDoc = await getDoc(doc(db, "bookings", bookingId))
    if (!bookingDoc.exists()) return

    const booking = bookingDoc.data()

    // Update booking status
    await updateDoc(doc(db, "bookings", bookingId), {
      status: "cancelled",
    })

    // Decrease session booking count
    const sessionDoc = await getDoc(doc(db, "sessions", booking.sessionId))
    if (sessionDoc.exists()) {
      const session = sessionDoc.data()
      await updateDoc(doc(db, "sessions", booking.sessionId), {
        currentBookings: Math.max(0, session.currentBookings - 1),
      })
    }

    showNotification("Booking cancelled successfully", "success")
    loadDashboard()
  } catch (error) {
    console.error("Error cancelling booking:", error)
    showNotification("Failed to cancel booking", "error")
  }
}

const categoryFilter = document.getElementById("category-filter")
if (categoryFilter) {
  categoryFilter.addEventListener("change", (e) => {
    loadAvailableSessions(e.target.value)
  })
}

const showCreateFormBtn = document.getElementById("show-create-form-btn")
const cancelCreateBtn = document.getElementById("cancel-create-btn")
const createSessionContainer = document.getElementById("create-session-container")

if (showCreateFormBtn) {
  showCreateFormBtn.addEventListener("click", () => {
    createSessionContainer.style.display = "block"
    showCreateFormBtn.style.display = "none"
    // Set minimum date to today
    const dateInput = document.getElementById("date")
    const today = new Date().toISOString().split("T")[0]
    dateInput.min = today
  })
}

if (cancelCreateBtn) {
  cancelCreateBtn.addEventListener("click", () => {
    createSessionContainer.style.display = "none"
    showCreateFormBtn.style.display = "block"
    document.getElementById("create-session-form").reset()
  })
}

const createSessionForm = document.getElementById("create-session-form")
if (createSessionForm) {
  createSessionForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const userProfile = await getCurrentUserProfile()
    if (!userProfile || userProfile.role !== "host") {
      showNotification("Only hosts can create sessions", "error")
      return
    }

    const title = document.getElementById("title").value
    const description = document.getElementById("description").value
    const category = document.getElementById("category").value
    const date = document.getElementById("date").value
    const time = document.getElementById("time").value
    const duration = Number.parseInt(document.getElementById("duration").value)
    const price = Number.parseFloat(document.getElementById("price").value)
    const maxBookings = Number.parseInt(document.getElementById("maxBookings").value)
    const meetingUrl = document.getElementById("meetingUrl").value

    try {
      await addDoc(collection(db, "sessions"), {
        title,
        description,
        category,
        hostId: userProfile.uid,
        hostName: userProfile.name,
        date,
        time,
        duration,
        price,
        maxBookings,
        currentBookings: 0,
        meetingUrl,
        status: "active",
        createdAt: new Date().toISOString(),
      })

      showNotification("Session created successfully!", "success")
      createSessionForm.reset()
      createSessionContainer.style.display = "none"
      showCreateFormBtn.style.display = "block"
      loadDashboard()
    } catch (error) {
      console.error("Error creating session:", error)
      showNotification("Failed to create session", "error")
    }
  })
}

async function loadMySessions(userId) {
  try {
    const sessionsRef = collection(db, "sessions")
    const q = query(sessionsRef, where("hostId", "==", userId), orderBy("date", "asc"))
    const querySnapshot = await getDocs(q)

    const sessionsGrid = document.getElementById("my-sessions-grid")

    if (querySnapshot.empty) {
      sessionsGrid.innerHTML = '<p class="empty-state">You haven\'t created any sessions yet</p>'
      return
    }

    sessionsGrid.innerHTML = ""

    querySnapshot.forEach((docSnap) => {
      const session = docSnap.data()
      const sessionCard = createMySessionCard(docSnap.id, session)
      sessionsGrid.appendChild(sessionCard)
    })
  } catch (error) {
    console.error("Error loading my sessions:", error)
  }
}

function createMySessionCard(sessionId, session) {
  const card = document.createElement("div")
  card.className = "session-card"

  const statusClass = session.status === "active" ? "status-active" : "status-cancelled"

  card.innerHTML = `
        <div class="session-header">
            <span class="session-category">${session.category}</span>
            <span class="session-status ${statusClass}">${session.status}</span>
        </div>
        <h3>${session.title}</h3>
        <p class="session-description">${session.description}</p>
        <div class="session-meta">
            <div class="meta-item">
                <span class="meta-icon">📅</span>
                <span>${formatDate(session.date)}</span>
            </div>
            <div class="meta-item">
                <span class="meta-icon">⏰</span>
                <span>${session.time}</span>
            </div>
            <div class="meta-item">
                <span class="meta-icon">👥</span>
                <span>${session.currentBookings} / ${session.maxBookings} booked</span>
            </div>
            <div class="meta-item">
                <span class="meta-icon">💰</span>
                <span>$${session.price}</span>
            </div>
            ${
              session.meetingUrl
                ? `<div class="meta-item">
                    <span class="meta-icon">🔗</span>
                    <span><a href="${session.meetingUrl}" target="_blank">Meeting Link</a></span>
                  </div>`
                : ""
            }
        </div>
        <div class="session-actions">
            <button class="btn-primary btn-small" onclick="editSession('${sessionId}')">Edit</button>
            <button class="btn-danger btn-small" onclick="deleteSession('${sessionId}')">Delete</button>
        </div>
    `

  return card
}

window.editSession = async (sessionId) => {
  try {
    const docRef = doc(db, "sessions", sessionId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) return

    const session = docSnap.data()

    // Populate edit form
    document.getElementById("edit-session-id").value = sessionId
    document.getElementById("edit-title").value = session.title
    document.getElementById("edit-description").value = session.description
    document.getElementById("edit-category").value = session.category
    document.getElementById("edit-date").value = session.date
    document.getElementById("edit-time").value = session.time
    document.getElementById("edit-duration").value = session.duration
    document.getElementById("edit-price").value = session.price
    document.getElementById("edit-maxBookings").value = session.maxBookings
    document.getElementById("edit-meetingUrl").value = session.meetingUrl || ""

    // Show modal
    document.getElementById("edit-modal").style.display = "block"
  } catch (error) {
    console.error("Error loading session for edit:", error)
  }
}

window.deleteSession = async (sessionId) => {
  if (!confirm("Are you sure you want to delete this session?")) return

  try {
    await deleteDoc(doc(db, "sessions", sessionId))
    showNotification("Session deleted successfully", "success")
    loadDashboard()
  } catch (error) {
    console.error("Error deleting session:", error)
    showNotification("Failed to delete session", "error")
  }
}

const editSessionForm = document.getElementById("edit-session-form")
if (editSessionForm) {
  editSessionForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const sessionId = document.getElementById("edit-session-id").value
    const title = document.getElementById("edit-title").value
    const description = document.getElementById("edit-description").value
    const category = document.getElementById("edit-category").value
    const date = document.getElementById("edit-date").value
    const time = document.getElementById("edit-time").value
    const duration = Number.parseInt(document.getElementById("edit-duration").value)
    const price = Number.parseFloat(document.getElementById("edit-price").value)
    const maxBookings = Number.parseInt(document.getElementById("edit-maxBookings").value)
    const meetingUrl = document.getElementById("edit-meetingUrl").value

    try {
      await updateDoc(doc(db, "sessions", sessionId), {
        title,
        description,
        category,
        date,
        time,
        duration,
        price,
        maxBookings,
        meetingUrl,
      })

      showNotification("Session updated successfully!", "success")
      document.getElementById("edit-modal").style.display = "none"
      loadDashboard()
    } catch (error) {
      console.error("Error updating session:", error)
      showNotification("Failed to update session", "error")
    }
  })
}

// Modal close handler
const modal = document.getElementById("edit-modal")
const closeBtn = document.querySelector(".close")
if (closeBtn) {
  closeBtn.onclick = () => {
    modal.style.display = "none"
  }
}
if (modal) {
  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  }
}

// Initialize dashboard
if (document.getElementById("user-name")) {
  loadDashboard()
}