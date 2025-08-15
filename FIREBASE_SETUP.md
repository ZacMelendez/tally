# Firebase Setup Guide

To get your NetWorth app running with real authentication and data storage, you'll need to set up Firebase. Follow these steps:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "networth-app")
4. Disable Google Analytics (not needed for this app)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Click on "Google" provider
5. Toggle "Enable"
6. Add your email as a test user
7. Add your domain (for production: your-domain.com, for development: localhost)
8. Click "Save"

## 3. Set up Firestore Database

1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select your preferred location
5. Click "Done"

## 4. Get your Firebase Configuration

1. Go to Project Settings (gear icon near "Project Overview")
2. Scroll down to "Your apps" section
3. Click the web icon `</>`
4. Register your app with a name (e.g., "NetWorth Web App")
5. Copy the configuration object

## 5. Update the App Configuration

Replace the demo configuration in `src/lib/firebase.ts` with your actual Firebase config:

```typescript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
};
```

## 6. Set up Firestore Security Rules

In Firestore Database > Rules, replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Assets - users can only access their own
    match /assets/{assetId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }

    // Debts - users can only access their own
    match /debts/{debtId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }

    // Net worth snapshots - users can only access their own
    match /netWorthSnapshots/{snapshotId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }

    // Asset value history - users can only access their own
    match /assetValueHistory/{historyId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }

    // Debt value history - users can only access their own
    match /debtValueHistory/{historyId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## 7. Install Dependencies and Run

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Optional: Production Setup

For production deployment:

1. Add your production domain to Firebase Authentication > Settings > Authorized domains
2. Set up proper environment variables for Firebase config
3. Deploy using your preferred hosting service (Vercel, Netlify, Firebase Hosting, etc.)

## Security Features Included

-   ✅ Google OAuth authentication
-   ✅ Rate limiting on API operations
-   ✅ User data isolation (users can only see their own data)
-   ✅ Input validation and sanitization
-   ✅ Secure Firebase rules
-   ✅ Client-side security measures

Your NetWorth app is now ready to use with real data storage and authentication!
