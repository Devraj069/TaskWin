# Firebase Setup Guide

## Firebase OAuth Domain Error Fix

The error `The current domain is not authorized for OAuth operations` means you need to add your domain to Firebase authorized domains.

### Steps to Fix:

1. **Go to Firebase Console:**
   - Visit https://console.firebase.google.com/
   - Select your project: `taskwin-1322c`

2. **Navigate to Authentication Settings:**
   - Click on "Authentication" in the left sidebar
   - Go to "Settings" tab
   - Click on "Authorized domains"

3. **Add Your Local Domain:**
   - Add `127.0.0.1` to the authorized domains list
   - Add `localhost` to the authorized domains list
   - Click "Save"

4. **Alternative for Development:**
   - You can also add `http://127.0.0.1:5500` (if using Live Server)
   - Add `http://localhost:3000` (if using other dev servers)

### Current Firebase Configuration Status:
- ✅ Firebase project ID: `taskwin-1322c`
- ✅ API Key configured
- ❌ OAuth domains need to be authorized

### Quick Fix:
1. Open Firebase Console → Authentication → Settings → Authorized domains
2. Add: `127.0.0.1` and `localhost`
3. Save changes
4. Refresh your application

This will resolve the OAuth authorization errors you're seeing in the console.