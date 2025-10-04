# Firebase Setup Guide for SessionHub

This guide will walk you through setting up Firebase for your SessionHub application.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `SessionHub` (or your preferred name)
4. Click "Continue"
5. Disable Google Analytics (optional) or configure it
6. Click "Create project"
7. Wait for the project to be created, then click "Continue"

## Step 2: Register Your Web App

1. In the Firebase Console, click the **Web icon** (`</>`) to add a web app
2. Enter app nickname: `SessionHub Web App`
3. **Do NOT** check "Also set up Firebase Hosting" (unless you want to deploy)
4. Click "Register app"
5. **IMPORTANT:** Copy the Firebase configuration object that appears

It will look like this:
\`\`\`javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
\`\`\`

6. Click "Continue to console"

## Step 3: Add Firebase Config to Your Project

1. Open the file `js/firebase-config.js` in your project
2. Replace the placeholder values with your actual Firebase config:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID",
}
\`\`\`

## Step 4: Enable Email/Password Authentication

1. In Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"** (if first time)
3. Click on the **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Toggle **"Enable"** to ON
6. Click **"Save"**

## Step 5: Create Firestore Database

1. In Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll add security rules next)
4. Click **"Next"**
5. Choose your Cloud Firestore location (select closest to your users)
6. Click **"Enable"**
7. Wait for the database to be created

## Step 6: Add Firestore Security Rules

1. In Firestore Database, click on the **"Rules"** tab
2. Replace the existing rules with the following:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read user profiles
      allow read: if request.auth != null;
      // Users can only write to their own profile
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Sessions collection
    match /sessions/{sessionId} {
      // Anyone authenticated can read sessions
      allow read: if request.auth != null;
      // Any authenticated user can create a session
      allow create: if request.auth != null;
      // Only the host who created the session can update or delete it
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.hostId;
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      // Users can read their own bookings or bookings for their hosted sessions
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.hostId);
      // Any authenticated user can create a booking
      allow create: if request.auth != null;
      // Only the user who made the booking can update or cancel it
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
\`\`\`

3. Click **"Publish"**

## Step 7: Understand the Database Structure

Your application will automatically create these collections:

### Users Collection (`users`)
\`\`\`javascript
{
  name: "John Doe",
  email: "john@example.com",
  role: "host" | "user" | null,
  bio: "Experienced developer...",
  skills: ["JavaScript", "React", "Node.js"],
  createdAt: "2025-01-10T12:00:00.000Z"
}
\`\`\`

### Sessions Collection (`sessions`)
\`\`\`javascript
{
  title: "Introduction to Web Development",
  description: "Learn the basics of HTML, CSS, and JavaScript",
  category: "Technology",
  hostId: "user-uid-123",
  hostName: "John Doe",
  date: "2025-02-15",
  time: "14:00",
  duration: 60,
  price: 50,
  maxBookings: 10,
  currentBookings: 3,
  meetingUrl: "https://zoom.us/j/123456789",
  status: "active",
  createdAt: "2025-01-10T12:00:00.000Z"
}
\`\`\`

### Bookings Collection (`bookings`)
\`\`\`javascript
{
  sessionId: "session-id-123",
  sessionTitle: "Introduction to Web Development",
  userId: "user-uid-456",
  userName: "Jane Smith",
  hostId: "user-uid-123",
  date: "2025-02-15",
  time: "14:00",
  meetingUrl: "https://zoom.us/j/123456789",
  status: "confirmed" | "cancelled",
  bookedAt: "2025-01-10T12:00:00.000Z"
}
\`\`\`

## Step 8: Test Your Application

1. Open `index.html` in a web browser using a local server:
   - **Using Python:** `python -m http.server 8000`
   - **Using Node.js:** `npx http-server`
   - **Using VS Code:** Install "Live Server" extension and click "Go Live"

2. Navigate to `http://localhost:8000` (or your server's URL)

3. Test the following:
   - Register a new account
   - Login with your credentials
   - Select a role (Host or User)
   - If Host: Create a session with meeting URL
   - If User: Browse and book a session
   - Check your profile page shows your name
   - Verify data appears in Firebase Console

## Step 9: Verify Data in Firebase Console

1. Go to Firebase Console > Firestore Database
2. You should see three collections being created as you use the app:
   - `users` - User profiles
   - `sessions` - Created sessions
   - `bookings` - Session bookings

3. Click on each collection to view the documents and verify data is being saved

## Troubleshooting

### Issue: "Firebase: Error (auth/configuration-not-found)"
**Solution:** Make sure you've correctly copied your Firebase config to `js/firebase-config.js`

### Issue: "Missing or insufficient permissions"
**Solution:** Verify your Firestore security rules are published correctly

### Issue: "Cannot read properties of undefined"
**Solution:** Ensure you're running the app through a local server, not opening the HTML file directly

### Issue: Data not showing in Firestore
**Solution:** 
- Check browser console for errors
- Verify Firebase config is correct
- Ensure you're authenticated (logged in)
- Check Firestore security rules allow the operation

## Optional: Deploy to Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Select your project
5. Set public directory to `.` (current directory)
6. Configure as single-page app: No
7. Deploy: `firebase deploy --only hosting`

## Summary

You now have a fully functional session booking application with:
- User authentication (Email/Password)
- Role-based access (Host/User)
- Session management (Create, Edit, Delete)
- Booking system (Book, Cancel)
- Profile management
- All data stored in Firebase Firestore

All data operations are handled automatically by the JavaScript code. You don't need to write any SQL - Firebase Firestore is a NoSQL database that stores data as documents in collections.
