# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for FilterNet VPN.

## 📋 Prerequisites

- A Google account
- Access to Google Cloud Console

---

## 🚀 Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: **FilterNet VPN**
5. Click "Create"

### Step 2: Enable Google Sign-In API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "Google Sign-In"
3. Click on it and click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for testing) or **Internal** (if using Google Workspace)
3. Click **Create**

4. Fill in the required information:
   - **App name**: FilterNet VPN
   - **User support email**: your-email@gmail.com
   - **Developer contact**: your-email@gmail.com
5. Click **Save and Continue**

6. On the **Scopes** page:
   - Click **Add or Remove Scopes**
   - Select: `email`, `profile`, `openid`
   - Click **Update**
   - Click **Save and Continue**

7. On **Test users** (if External):
   - Click **Add Users**
   - Add your email addresses
   - Click **Save and Continue**

8. Review and click **Back to Dashboard**

### Step 4: Create OAuth Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type**: **Web application**
4. Enter **Name**: FilterNet VPN Web Client

5. **Authorized JavaScript origins**:
   Add your website URLs:
   ```
   http://localhost:8000
   http://localhost:3000
   http://127.0.0.1:8000
   https://your-domain.com
   ```

6. **Authorized redirect URIs**:
   Add your redirect URLs:
   ```
   http://localhost:8000/dashboard.html
   http://localhost:3000/dashboard.html
   https://your-domain.com/dashboard.html
   ```

7. Click **Create**

8. **IMPORTANT**: Copy your **Client ID**
   - It looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - Save it somewhere safe

### Step 5: Configure FilterNet VPN

1. Open `config.js` in your project

2. Replace the Client ID:
   ```javascript
   const CONFIG = {
       google: {
           clientId: '123456789-abcdefghijklmnop.apps.googleusercontent.com'
           // ↑ Paste your Client ID here
       },
       demoMode: false  // ← Set to false for production
   };
   ```

3. Save the file

---

## 🧪 Testing

### Test Locally

1. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```

2. Open http://localhost:8000 in your browser

3. Click "Get Started"

4. Click "Continue with Google"

5. You should see the Google Sign-In popup! ✅

### What Should Happen:

1. **Google popup appears** asking you to choose an account
2. **You select your account**
3. **Google asks for permission** to share your email and profile
4. **You click "Allow"**
5. **You're redirected to the dashboard** 🎉

---

## ⚙️ Configuration Options

### Demo Mode (For Testing Without Google)

```javascript
// In config.js
const CONFIG = {
    demoMode: true  // Bypasses Google OAuth
};
```

When `demoMode` is true:
- No Google popup appears
- Uses mock authentication
- Perfect for UI testing

### Production Mode

```javascript
// In config.js
const CONFIG = {
    google: {
        clientId: 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com'
    },
    demoMode: false  // Real Google OAuth
};
```

---

## 🔧 Troubleshooting

### Issue: "Google Sign-In not initialized"

**Solution**: Make sure you added the Google SDK script to `index.html`:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### Issue: "Popup was blocked"

**Solution**:
- Allow popups for localhost in your browser
- Click the popup blocker icon in address bar
- Select "Always allow popups from this site"

### Issue: "Client ID not configured"

**Solution**: Update `config.js` with your actual Client ID

### Issue: "redirect_uri_mismatch"

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth Client
3. Add your current URL to **Authorized redirect URIs**
4. Make sure it matches exactly (including http/https and port)

### Issue: "Access blocked: This app's request is invalid"

**Solution**:
1. Complete the OAuth consent screen configuration
2. Add your email as a test user (if using External)
3. Make sure the app is not in "Testing" mode or add yourself as tester

---

## 🔐 Security Best Practices

### For Development:
- ✅ Use `demoMode: true` for UI testing
- ✅ Add `localhost` to authorized origins
- ✅ Don't commit Client ID to public repos (use environment variables)

### For Production:
- ✅ Use HTTPS only
- ✅ Set `demoMode: false`
- ✅ Publish your OAuth consent screen
- ✅ Verify tokens on your backend
- ✅ Use short-lived access tokens
- ✅ Implement token refresh

---

## 📱 What Gets Shared

When users sign in with Google, you receive:
- ✅ Email address
- ✅ Name
- ✅ Profile picture
- ✅ Google User ID

You do **NOT** get:
- ❌ Password
- ❌ Access to Gmail or other Google services
- ❌ Personal data beyond basic profile

---

## 🎯 Next Steps

After Google OAuth is working:

1. **Implement backend verification**
   ```javascript
   // Send credential to your backend
   fetch('YOUR_API/auth/google', {
       method: 'POST',
       body: JSON.stringify({ credential })
   });
   ```

2. **Verify the token on your backend**
   - Use Google's token verification library
   - Create a session/JWT token
   - Return it to the frontend

3. **Store the session**
   - Save your backend's token
   - Use it for API requests

4. **Implement logout**
   - Clear localStorage
   - Revoke token if needed

---

## 📚 Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web/guides/overview)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Sign-In Samples](https://developers.google.com/identity/sign-in/web/sign-in)

---

## ✅ Quick Checklist

Before going live:

- [ ] Created Google Cloud project
- [ ] Enabled Google Sign-In API
- [ ] Configured OAuth consent screen
- [ ] Created OAuth Client ID
- [ ] Added authorized origins and redirect URIs
- [ ] Updated `config.js` with Client ID
- [ ] Set `demoMode: false`
- [ ] Tested sign-in flow
- [ ] Implemented backend token verification
- [ ] Using HTTPS in production
- [ ] Published OAuth consent screen

---

Need help? Check the [troubleshooting section](#-troubleshooting) above or visit the [Google Identity documentation](https://developers.google.com/identity).
