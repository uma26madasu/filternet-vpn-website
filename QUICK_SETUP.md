# 🚀 5-Minute Google OAuth Setup

Follow these steps to see the **real Google sign-in popup** in 5 minutes!

## Step 1: Create Google Cloud Project (1 minute)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top → **"New Project"**
3. Project name: `FilterNet VPN Test`
4. Click **"Create"**
5. Wait for project to be created (15 seconds)

## Step 2: Enable Google Sign-In (30 seconds)

1. Make sure your new project is selected (check dropdown at top)
2. Go to **APIs & Services** → **Library** (left sidebar)
3. Search for: `Google+ API`
4. Click on it → Click **"Enable"**

## Step 3: Configure OAuth Consent Screen (2 minutes)

1. Go to **APIs & Services** → **OAuth consent screen** (left sidebar)
2. Select **"External"** → Click **"Create"**
3. Fill in required fields:
   - **App name**: `FilterNet VPN`
   - **User support email**: (select your email from dropdown)
   - **Developer contact**: (type your email)
4. Click **"Save and Continue"**
5. Click **"Save and Continue"** again (skip scopes)
6. **Test users**: Click **"Add Users"** → Add your email → Click **"Add"**
7. Click **"Save and Continue"**
8. Click **"Back to Dashboard"**

## Step 4: Create OAuth Client ID (1 minute)

1. Go to **APIs & Services** → **Credentials** (left sidebar)
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `FilterNet Web Client`

5. **Authorized JavaScript origins** → Click **"Add URI"**:
   ```
   http://localhost:8000
   ```

6. **Authorized redirect URIs** → Click **"Add URI"**:
   ```
   http://localhost:8000
   ```

7. Click **"Create"**

8. **COPY YOUR CLIENT ID!** It looks like:
   ```
   123456789-abcdefghijklmnop.apps.googleusercontent.com
   ```

## Step 5: Add Client ID to Your Project (30 seconds)

1. Open `config.js` in your project
2. Find this line:
   ```javascript
   clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
   ```

3. Replace with YOUR Client ID:
   ```javascript
   clientId: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
   ```

4. Save the file

## Step 6: Test It! (30 seconds)

1. Start local server:
   ```bash
   python3 -m http.server 8000
   ```

2. Open browser: `http://localhost:8000`

3. Click **"Get Started"**

4. Click **"Continue with Google"**

5. 🎉 **Google sign-in popup appears!**

---

## ✅ What You Should See

1. A popup window from Google
2. "Sign in with Google" screen
3. Your Google account(s) listed
4. Option to select an account
5. Permission screen asking to share email/profile
6. After allowing → redirect to dashboard!

---

## ❌ Troubleshooting

### Popup doesn't appear?

1. **Check browser console** (F12) for errors
2. **Allow popups** - Click the popup blocker icon in address bar
3. **Verify Client ID** - Make sure you copied it correctly to config.js
4. **Refresh the page** and try again

### "redirect_uri_mismatch" error?

1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth Client
3. Make sure **"http://localhost:8000"** is in **both**:
   - Authorized JavaScript origins
   - Authorized redirect URIs
4. Save and try again

### Still shows demo login?

1. Open browser console (F12)
2. Check for error messages
3. Make sure `demoMode: false` in config.js
4. Hard refresh the page (Ctrl+Shift+R)

---

## 🎯 Total Time: ~5 minutes

That's it! You now have real Google OAuth working! 🚀

---

## After Testing

Once you confirm it's working:
- The same Client ID works for production
- Just update the authorized URLs to your production domain
- Deploy and you're done!
