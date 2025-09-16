# 🚀 TaskPaisa Deployment Guide

## Firebase Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `taskpaisa-rewards` (or your preferred name)
4. Enable Google Analytics (recommended)
5. Complete project creation

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Go to **Sign-in method** tab
3. Enable these providers:
   - **Email/Password**: Click and enable
   - **Google**: Click, enable, and set support email

### Step 3: Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (we'll deploy security rules later)
3. Select a location closest to your users
4. Click **Done**

### Step 4: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Web app** icon (`</>`)
4. Register app with name: `TaskPaisa Web`
5. Copy the `firebaseConfig` object

### Step 5: Update Configuration

Replace the configuration in `js/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id",
    measurementId: "G-XXXXXXXXXX"
};
```

## Local Development

### Option 1: Simple File Server

1. Open `index.html` directly in a modern browser
2. Note: Some features may be limited due to CORS restrictions

### Option 2: Firebase Hosting (Recommended)

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project directory
firebase init

# Select these features:
# - Firestore: Deploy rules and create indexes
# - Hosting: Configure files for Firebase Hosting

# Serve locally
firebase serve
```

### Option 3: Python Server

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Option 4: Node.js Server

```bash
npx http-server -p 8000
```

## Production Deployment

### Deploy to Firebase Hosting

```bash
# Build and deploy
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

### Deploy to Other Platforms

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts

#### Netlify
1. Drag and drop project folder to [Netlify Deploy](https://app.netlify.com/drop)
2. Or connect GitHub repository

#### GitHub Pages
1. Push code to GitHub repository
2. Go to repository Settings → Pages
3. Select source branch (usually `main`)

## Environment Configuration

### Development
- Use Firebase emulators for local testing
- Enable debug mode in console

### Production
- Update Firebase security rules
- Configure custom domain (optional)
- Set up monitoring and analytics

## Security Checklist

### Firestore Rules
```bash
# Deploy security rules
firebase deploy --only firestore:rules
```

### Authentication
- ✅ Enable only required sign-in methods
- ✅ Configure authorized domains
- ✅ Set up proper redirect URLs

### Hosting
- ✅ Enable HTTPS (automatic with Firebase)
- ✅ Configure proper headers
- ✅ Set up redirects if needed

## Performance Optimization

### Before Deployment
1. Minimize CSS and JavaScript files
2. Optimize images
3. Enable compression
4. Test on mobile devices

### After Deployment
1. Monitor Core Web Vitals
2. Check Firebase usage quotas
3. Monitor error rates
4. Set up alerts

## Monitoring and Analytics

### Firebase Analytics
```javascript
// Add to firebase-config.js if not already included
import { getAnalytics } from 'firebase/analytics';
const analytics = getAnalytics(app);
```

### Performance Monitoring
```javascript
// Add to firebase-config.js
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);
```

## Troubleshooting

### Common Issues

1. **Firebase Config Error**
   - Verify all config values are correct
   - Check if services are enabled in Firebase Console

2. **Authentication Issues**
   - Check authorized domains in Firebase Console
   - Verify sign-in methods are enabled

3. **Firestore Permission Denied**
   - Deploy security rules: `firebase deploy --only firestore:rules`
   - Check user authentication status

4. **Hosting Issues**
   - Check `firebase.json` configuration
   - Verify public directory setting

### Debug Commands

```bash
# Check Firebase project status
firebase list

# View Firestore rules
firebase firestore:rules

# View hosting configuration
firebase hosting:config

# Check deployment status
firebase hosting:status
```

## Support

For technical support:
1. Check [Firebase Documentation](https://firebase.google.com/docs)
2. Visit [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
3. Review browser console errors
4. Check Firebase Console for quota limits

## Next Steps

After successful deployment:
1. Test all authentication flows
2. Verify task completion system
3. Test leaderboard real-time updates
4. Configure monitoring and alerts
5. Plan Phase 2 features (admin panel, rewards redemption)

---

**Happy Deploying! 🚀**