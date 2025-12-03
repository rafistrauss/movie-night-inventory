# Movie Night Budget + Inventory Tracker - Environment Configuration

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore Database
3. Enable Authentication (Email/Password)
4. Get your Firebase configuration from Project Settings

## Environment Variables

Create a `.env` file in the root directory with:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## GitHub Secrets (for deployment)

Add these secrets in your GitHub repository settings:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

## Firestore Security Rules

Deploy the rules from `firestore.rules` to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

Or copy the rules manually in the Firebase Console.

## GitHub Pages Setup

1. Go to your repository Settings > Pages
2. Select "GitHub Actions" as the source
3. Push to main branch to trigger deployment

## First User Setup

After deployment, you'll need to create the first user manually in Firebase Console:
1. Go to Authentication in Firebase Console
2. Add a user with email/password
3. Use these credentials to log in to the app
