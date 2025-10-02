# SessionHub - Session Booking Application

A complete session booking platform built with HTML, CSS, JavaScript, and Firebase.

## Features

- **User Authentication**: Sign up, login, and logout functionality
- **Profile Management**: Manage user profiles with bio and skills
- **Session Management**: Create, update, and delete sessions (for hosts)
- **Booking System**: Book sessions, cancel bookings, view upcoming and past sessions
- **Responsive Design**: Works seamlessly on all device sizes
- **Real-time Updates**: Firebase Firestore for real-time data synchronization

## Project Structure

\`\`\`
session-booking-app/
├── index.html              # Landing page
├── pages/
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── dashboard.html     # User dashboard
│   ├── profile.html       # Profile management
│   ├── sessions.html      # Browse all sessions
│   ├── session-detail.html # Individual session details
│   ├── create-session.html # Create new session (hosts)
│   ├── my-sessions.html   # Manage sessions (hosts)
│   └── my-bookings.html   # View user bookings
├── css/
│   ├── styles.css         # Global styles
│   ├── home.css          # Home page styles
│   ├── auth.css          # Authentication pages styles
│   ├── dashboard.css     # Dashboard styles
│   └── sessions.css      # Session pages styles
├── js/
│   ├── firebase-config.js # Firebase configuration
│   ├── auth.js           # Authentication logic
│   ├── sessions.js       # Session management
│   ├── bookings.js       # Booking management
│   ├── profile.js        # Profile management
│   ├── dashboard.js      # Dashboard logic
│   └── main.js           # Utility functions
└── README.md
\`\`\`

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create a Firestore Database
5. Copy your Firebase configuration

### 2. Configure Firebase

Open `js/firebase-config.js` and replace the placeholder values with your Firebase configuration:

\`\`\`javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
\`\`\`

### 3. Firestore Database Structure

Create the following collections in Firestore:

**users** collection:
\`\`\`
{
  name: string,
  email: string,
  role: string (user/host),
  bio: string,
  skills: array,
  createdAt: timestamp
}
\`\`\`

**sessions** collection:
\`\`\`
{
  title: string,
  description: string,
  category: string,
  hostId: string,
  hostName: string,
  date: string,
  time: string,
  duration: number,
  price: number,
  maxBookings: number,
  currentBookings: number,
  status: string (active/cancelled),
  createdAt: timestamp
}
\`\`\`

**bookings** collection:
\`\`\`
{
  sessionId: string,
  sessionTitle: string,
  userId: string,
  userName: string,
  hostId: string,
  date: string,
  time: string,
  status: string (confirmed/cancelled),
  bookedAt: timestamp
}
\`\`\`

### 4. Firestore Security Rules

Add these security rules in Firebase Console:

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /sessions/{sessionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.hostId;
    }
    
    match /bookings/{bookingId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.hostId);
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
\`\`\`

### 5. Run the Application

1. Open `index.html` in a web browser, or
2. Use a local server (recommended):
   \`\`\`bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve
   
   # Using VS Code Live Server extension
   Right-click index.html > Open with Live Server
   \`\`\`
3. Navigate to `http://localhost:8000`

## User Roles

- **User**: Can browse and book sessions
- **Host**: Can create and manage sessions, plus book other sessions

## Features Breakdown

### User Management
- Email/password authentication
- Role-based access (User/Host)
- Profile editing with bio and skills
- Secure authentication state management

### Session Management (Hosts)
- Create sessions with details (title, description, category, date, time, duration, price)
- Edit existing sessions
- Delete sessions
- View booking statistics
- Category filtering (Technology, Business, Design, Marketing, Health, Education, Other)

### Booking System (Users)
- Browse available sessions
- Filter by category
- View detailed session information
- Book sessions (with availability checking)
- Cancel bookings (before session date)
- View upcoming and past bookings
- Automatic booking count management

### Dashboard
- Personalized welcome message
- Statistics overview (upcoming bookings, completed sessions, active sessions for hosts)
- Quick action cards
- Recent activity feed

## Technologies Used

- HTML5
- CSS3 (Flexbox, Grid, Custom Properties)
- Vanilla JavaScript (ES6+ Modules)
- Firebase Authentication
- Firebase Firestore
- Firebase Hosting (optional)

## Responsive Design

The application is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deployment

### Deploy to Firebase Hosting

1. Install Firebase CLI:
   \`\`\`bash
   npm install -g firebase-tools
   \`\`\`

2. Login to Firebase:
   \`\`\`bash
   firebase login
   \`\`\`

3. Initialize Firebase:
   \`\`\`bash
   firebase init
   \`\`\`
   - Select "Hosting"
   - Choose your Firebase project
   - Set public directory to `.` (current directory)
   - Configure as single-page app: No
   - Don't overwrite existing files

4. Deploy:
   \`\`\`bash
   firebase deploy
   \`\`\`

### Deploy to Netlify

1. Create a `netlify.toml` file:
   \`\`\`toml
   [build]
     publish = "."
   \`\`\`

2. Drag and drop your project folder to [Netlify Drop](https://app.netlify.com/drop)

### Deploy to Vercel

1. Install Vercel CLI:
   \`\`\`bash
   npm install -g vercel
   \`\`\`

2. Deploy:
   \`\`\`bash
   vercel
   \`\`\`

## Security Considerations

- All routes are protected with authentication
- Firestore security rules enforce data access control
- Users can only modify their own data
- Hosts can only edit/delete their own sessions
- Input validation on all forms
- XSS protection through proper data handling

## Future Enhancements

- Email notifications for bookings
- Payment integration (Stripe)
- Video call integration (Zoom, Google Meet)
- Rating and review system
- Search functionality
- Advanced filtering options
- Calendar view for sessions
- Host availability management
- Booking reminders
- Session recordings

## Troubleshooting

### Firebase Connection Issues
- Verify your Firebase configuration in `firebase-config.js`
- Check that Authentication and Firestore are enabled in Firebase Console
- Ensure security rules are properly configured

### Authentication Not Working
- Clear browser cache and cookies
- Check browser console for errors
- Verify email/password authentication is enabled in Firebase

### Sessions Not Loading
- Check Firestore security rules
- Verify user is authenticated
- Check browser console for errors

## License

MIT License

## Support

For issues and questions, please create an issue in the repository or contact support.

---

Built with ❤️ using Firebase and vanilla JavaScript
