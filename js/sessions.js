import { db } from "./firebase-config.js"
import { logout, getCurrentUserProfile } from "./auth.js"
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
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

// Create Session Form Handler
const createSessionForm = document.getElementById("create-session-form")
if (createSessionForm) {
  // Set minimum date to today
  const dateInput = document.getElementById("date")
  const today = new Date().toISOString().split("T")[0]
  dateInput.min = today

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

    const errorMessage = document.getElementById("error-message")
    const successMessage = document.getElementById("success-message")

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
        status: "active",
        createdAt: new Date().toISOString(),
      })

      successMessage.textContent = "Session created successfully!"
      successMessage.style.display = "block"
      errorMessage.style.display = "none"

      showNotification("Session created successfully!", "success")

      setTimeout(() => {
        window.location.href = "my-sessions.html"
      }, 1500)
    } catch (error) {
      errorMessage.textContent = error.message
      errorMessage.style.display = "block"
      successMessage.style.display = "none"
    }
  })
}

// Load all sessions
async function loadSessions(categoryFilter = "") {
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

// Create session card
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
        <a href="session-detail.html?id=${sessionId}" class="btn-primary btn-full ${isFull ? "disabled" : ""}">
            ${isFull ? "Fully Booked" : "View Details"}
        </a>
    `

  return card
}

// Category filter
const categoryFilter = document.getElementById("category-filter")
if (categoryFilter) {
  categoryFilter.addEventListener("change", (e) => {
    loadSessions(e.target.value)
  })
}

// Load sessions on page load
if (document.getElementById("sessions-grid")) {
  loadSessions()
}

// Load session details
async function loadSessionDetail() {
  const urlParams = new URLSearchParams(window.location.search)
  const sessionId = urlParams.get("id")

  if (!sessionId) {
    window.location.href = "sessions.html"
    return
  }

  try {
    const docRef = doc(db, "sessions", sessionId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      showNotification("Session not found", "error")
      window.location.href = "sessions.html"
      return
    }

    const session = docSnap.data()
    const userProfile = await getCurrentUserProfile()
    const sessionDetail = document.getElementById("session-detail")

    const spotsLeft = session.maxBookings - session.currentBookings
    const isFull = spotsLeft <= 0
    const isOwnSession = userProfile && userProfile.uid === session.hostId

    sessionDetail.innerHTML = `
            <div class="session-detail-card">
                <div class="session-detail-header">
                    <div>
                        <span class="session-category">${session.category}</span>
                        <h1>${session.title}</h1>
                        <p class="host-name">Hosted by ${session.hostName}</p>
                    </div>
                    <div class="session-price-large">$${session.price}</div>
                </div>

                <div class="session-detail-content">
                    <h3>About this session</h3>
                    <p>${session.description}</p>

                    <h3>Session Details</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Date</span>
                            <span class="detail-value">${formatDate(session.date)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Time</span>
                            <span class="detail-value">${session.time}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Duration</span>
                            <span class="detail-value">${session.duration} minutes</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Available Spots</span>
                            <span class="detail-value">${spotsLeft} / ${session.maxBookings}</span>
                        </div>
                    </div>

                    ${
                      !isOwnSession
                        ? `
                        <button 
                            id="book-session-btn" 
                            class="btn-primary btn-large btn-full" 
                            ${isFull ? "disabled" : ""}
                            data-session-id="${sessionId}"
                        >
                            ${isFull ? "Fully Booked" : "Book This Session"}
                        </button>
                    `
                        : '<p class="info-message">This is your session</p>'
                    }
                </div>
            </div>
        `

    // Add booking handler
    const bookBtn = document.getElementById("book-session-btn")
    if (bookBtn) {
      bookBtn.addEventListener("click", () => bookSession(sessionId, session))
    }
  } catch (error) {
    console.error("Error loading session details:", error)
  }
}

// Book session function
async function bookSession(sessionId, session) {
  try {
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      showNotification("Please login to book a session", "error")
      return
    }

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
      status: "confirmed",
      bookedAt: new Date().toISOString(),
    })

    // Update session booking count
    const sessionRef = doc(db, "sessions", sessionId)
    await updateDoc(sessionRef, {
      currentBookings: session.currentBookings + 1,
    })

    showNotification("Session booked successfully!", "success")

    setTimeout(() => {
      window.location.href = "my-bookings.html"
    }, 1500)
  } catch (error) {
    console.error("Error booking session:", error)
    showNotification("Failed to book session", "error")
  }
}

// Load session detail on page load
if (document.getElementById("session-detail")) {
  loadSessionDetail()
}

// Load host's sessions
async function loadMySessions() {
  try {
    const userProfile = await getCurrentUserProfile()
    if (!userProfile || userProfile.role !== "host") {
      window.location.href = "dashboard.html"
      return
    }

    const sessionsRef = collection(db, "sessions")
    const q = query(sessionsRef, where("hostId", "==", userProfile.uid), orderBy("date", "asc"))
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

// Create my session card with edit/delete options
function createMySessionCard(sessionId, session) {
  const card = document.createElement("div")
  card.className = "session-card"

  const spotsLeft = session.maxBookings - session.currentBookings
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
        </div>
        <div class="session-actions">
            <button class="btn-primary" onclick="editSession('${sessionId}')">Edit</button>
            <button class="btn-danger" onclick="deleteSession('${sessionId}')">Delete</button>
        </div>
    `

  return card
}

// Edit session
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

    // Show modal
    document.getElementById("edit-modal").style.display = "block"
  } catch (error) {
    console.error("Error loading session for edit:", error)
  }
}

// Delete session
window.deleteSession = async (sessionId) => {
  if (!confirm("Are you sure you want to delete this session?")) return

  try {
    await deleteDoc(doc(db, "sessions", sessionId))
    showNotification("Session deleted successfully", "success")
    loadMySessions()
  } catch (error) {
    console.error("Error deleting session:", error)
    showNotification("Failed to delete session", "error")
  }
}

// Edit session form handler
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
      })

      showNotification("Session updated successfully!", "success")
      document.getElementById("edit-modal").style.display = "none"
      loadMySessions()
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

// Load my sessions on page load
if (document.getElementById("my-sessions-grid")) {
  loadMySessions()
}
