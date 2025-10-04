# Firebase Setup Guide

This guide will walk you through setting up Firebase for your SessionHub application.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter your project name (e.g., "SessionHub")
4. Click **Continue**
5. (Optional) Enable Google Analytics
6. Click **Create project**
7. Wait for the project to be created, then click **Continue**

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`) to add a web app
2. Enter an app nickname (e.g., "SessionHub Web")
3. **Do NOT** check "Also set up Firebase Hosting" (unless you want to deploy there)
4. Click **Register app**
5. You'll see your Firebase configuration object - **COPY THIS**, you'll need it soon

The configuration looks like this:
\`\`\`javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
\`\`\`

6. Click **Continue to console**

## Step 3: Enable Authentication

1. In the left sidebar, click **Build** → **Authentication**
2. Click **Get started**
3. Click on the **Sign-in method** tab
4. Click on **Email/Password**
5. Toggle **Enable** to ON
6. Click **Save**

## Step 4: Set Up Firestore Database

1. In the left sidebar, click **Build** → **Firestore Database**
2. Click **Create database**
3. Select **Start in production mode** (we'll add custom rules next)
4. Click **Next**
5. Choose your Cloud Firestore location (select closest to your users)
6. Click **Enable**

## Step 5: Configure Firestore Security Rules

1. Once your database is created, click on the **Rules** tab
2. Replace the default rules with the following:

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
      // Anyone authenticated can create a session
      allow create: if request.auth != null;
      // Only the host can update or delete their session
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.hostId;
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      // Users can read bookings if they are the user or the host
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.hostId);
      // Anyone authenticated can create a booking
      allow create: if request.auth != null;
      // Only the user who made the booking can update or delete it
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
\`\`\`

3. Click **Publish**

## Step 6: Create Firestore Collections (Optional - Auto-created)

Firestore will automatically create collections when you first write data to them. However, here's the structure:

### Collections Structure:

#### 1. **users** collection
Each document ID is the user's UID from Firebase Auth.

**Fields:**
- `name` (string) - User's full name
- `email` (string) - User's email address
- `role` (string) - Either "host" or "user"
- `bio` (string) - User's biography
- `skills` (array) - Array of skill strings
- `createdAt` (string) - ISO timestamp of account creation

#### 2. **sessions** collection
Each document has an auto-generated ID.

**Fields:**
- `title` (string) - Session title
- `description` (string) - Session description
- `category` (string) - Session category (e.g., "Technology", "Business", "Design")
- `date` (string) - Session date in YYYY-MM-DD format
- `time` (string) - Session time in HH:MM format
- `duration` (number) - Duration in minutes
- `maxParticipants` (number) - Maximum number of participants
- `currentParticipants` (number) - Current number of registered participants
- `hostId` (string) - User ID of the host
- `hostName` (string) - Name of the host
- `meetingUrl` (string) - URL for the online meeting (Zoom, Google Meet, etc.)
- `createdAt` (string) - ISO timestamp of session creation
- `status` (string) - "upcoming" or "completed"

#### 3. **bookings** collection
Each document has an auto-generated ID.

**Fields:**
- `sessionId` (string) - ID of the booked session
- `sessionTitle` (string) - Title of the session
- `userId` (string) - ID of the user who booked
- `userName` (string) - Name of the user who booked
- `hostId` (string) - ID of the session host
- `sessionDate` (string) - Date of the session
- `sessionTime` (string) - Time of the session
- `bookedAt` (string) - ISO timestamp of when booking was made
- `status` (string) - "confirmed" or "cancelled"

## Step 7: Add Firebase Config to Your Code

1. Open the file `js/firebase-config.js`
2. Replace the placeholder values with your actual Firebase configuration:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
}
\`\`\`

## Step 8: Test Your Application

1. Open `index.html` in a web browser using a local server:
   - **Using Python**: `python -m http.server 8000`
   - **Using Node.js**: `npx http-server`
   - **Using VS Code**: Install "Live Server" extension and click "Go Live"

2. Navigate to `http://localhost:8000` (or the port your server uses)

3. Test the following:
   - Register a new account
   - Login with your account
   - Select a role (Host or User)
   - Create a session (if Host)
   - Browse and register for sessions (if User)

## Step 9: Monitor Your Data

1. Go back to Firebase Console
2. Click **Firestore Database** in the left sidebar
3. You should see your collections (`users`, `sessions`, `bookings`) appear as you use the app
4. Click on any collection to view the documents and their data

## Troubleshooting

### Issue: "Permission denied" errors
**Solution**: Make sure your Firestore Security Rules are published correctly (Step 5)

### Issue: "Firebase not defined" errors
**Solution**: Check that your Firebase config is correct in `js/firebase-config.js`

### Issue: Data not appearing in Firestore
**Solution**: 
- Check browser console for errors
- Verify you're logged in
- Check that your Firebase config is correct

### Issue: Authentication not working
**Solution**: 
- Make sure Email/Password authentication is enabled in Firebase Console
- Check that your Firebase config includes the correct `authDomain`

## Data Flow Summary

Here's how data flows in your application:

1. **User Registration**:
   - User fills registration form → Firebase Auth creates account → User document created in Firestore `users` collection

2. **User Login**:
   - User enters credentials → Firebase Auth validates → User redirected to dashboard

3. **Role Selection**:
   - User selects role on dashboard → User document updated in Firestore with role field

4. **Session Creation (Host)**:
   - Host fills session form → New document created in Firestore `sessions` collection

5. **Session Registration (User)**:
   - User clicks "Register" → New document created in Firestore `bookings` collection → Session's `currentParticipants` incremented

6. **View Data**:
   - All pages query Firestore in real-time to display current data

## Security Notes

- Never commit your `firebase-config.js` with real credentials to public repositories
- The API key in the config is safe to expose (it's restricted by Firebase Security Rules)
- Always use proper Firestore Security Rules to protect your data
- Consider adding rate limiting for production applications

## Next Steps

- Set up Firebase Hosting for deployment
- Add email verification for new users
- Implement password reset functionality
- Add real-time listeners for live updates
- Set up Firebase Cloud Functions for advanced features (email notifications, etc.)
