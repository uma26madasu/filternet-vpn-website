# FilterNet VPN - Backend Integration Guide

This guide explains how to integrate the FilterNet VPN dashboard with your backend API.

## 📋 Table of Contents
1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Integration Steps](#integration-steps)
6. [Testing](#testing)

---

## Overview

The dashboard is designed to work with a RESTful API backend. All API configuration is centralized in `api.js`.

### Files Structure
```
├── api.js              # API service layer and configuration
├── dashboard-data.js   # Data loading and state management
├── dashboard.js        # UI interactions
├── dashboard.html      # Dashboard HTML
└── dashboard.css       # Dashboard styles
```

---

## Authentication Flow

### 1. Google OAuth Integration (index.html)

Update the Google Sign-In handler in `script.js`:

```javascript
// In script.js - Google Sign-In button
googleSignInBtn.addEventListener('click', async () => {
    // Initialize Google OAuth
    const auth2 = await gapi.auth2.init({
        client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
    });

    try {
        const googleUser = await auth2.signIn();
        const id_token = googleUser.getAuthResponse().id_token;

        // Send token to your backend
        const response = await fetch('YOUR_BACKEND_URL/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: id_token })
        });

        const data = await response.json();

        // Store auth token
        localStorage.setItem('filternet_auth_token', data.access_token);
        localStorage.setItem('filternet_user_data', JSON.stringify(data.user));

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Authentication failed:', error);
    }
});
```

### 2. API Configuration

Update `api.js` configuration:

```javascript
const API_CONFIG = {
    baseURL: 'https://your-backend-api.com/v1',  // ← UPDATE THIS
    timeout: 10000
};

// Set MOCK_MODE to false when backend is ready
const MOCK_MODE = false;  // ← CHANGE TO FALSE
```

---

## API Endpoints

Your backend should implement the following endpoints:

### Authentication

```
POST   /auth/google              # Google OAuth login
POST   /auth/logout              # Logout user
GET    /user/profile             # Get current user
PUT    /user/profile             # Update user profile
```

### Family Members

```
GET    /family/members           # Get all family members
GET    /family/members/:id       # Get specific member
POST   /family/members           # Add new member
PUT    /family/members/:id       # Update member
DELETE /family/members/:id       # Delete member
```

### Devices

```
GET    /devices                  # Get all devices
GET    /devices?memberId=:id     # Get member's devices
POST   /devices                  # Add device
PUT    /devices/:id              # Update device
DELETE /devices/:id              # Remove device
```

### Time Limits

```
GET    /time-limits?memberId=:id        # Get member's limits
POST   /time-limits/daily               # Set daily limit
POST   /time-limits/app                 # Set app limit
PUT    /time-limits/:id                 # Update limit
DELETE /time-limits/:id                 # Delete limit
GET    /time-limits/usage?memberId=:id  # Get current usage
```

### Content Filtering

```
GET    /content-filter/rules?memberId=:id    # Get filtering rules
GET    /content-filter/apps                  # Get available apps
PUT    /content-filter/apps/:id              # Update app status
POST   /content-filter/websites              # Block website
GET    /content-filter/websites?memberId=:id # Get blocked sites
PUT    /content-filter/categories/:id        # Update category
GET    /content-filter/categories            # Get all categories
PUT    /content-filter/profile               # Update profile type
```

### Activity Monitoring

```
GET    /activity?memberId=:id&date=:date          # Get activity
GET    /activity/summary?memberId=:id&start=&end= # Get summary
GET    /activity/top-apps?memberId=:id            # Get top apps
GET    /activity/by-category?memberId=:id         # By category
```

### Bedtime Schedules

```
GET    /bedtime/schedules?memberId=:id      # Get schedules
POST   /bedtime/schedules                   # Create schedule
PUT    /bedtime/schedules/:id               # Update schedule
DELETE /bedtime/schedules/:id               # Delete schedule
PUT    /bedtime/schedules/:id/toggle        # Toggle active status
```

### Dashboard Overview

```
GET    /dashboard/overview                  # Get overview stats
GET    /dashboard/alerts                    # Get alerts
GET    /dashboard/recent-blocks?limit=10    # Get recent blocks
```

---

## Data Models

### User
```json
{
  "id": "user_123",
  "email": "parent@example.com",
  "name": "Parent Account",
  "familyId": "family_456"
}
```

### Family Member
```json
{
  "id": "member_1",
  "name": "Sarah",
  "age": 12,
  "profile": "teen",  // child | teen | adult
  "avatar": "👧",
  "devices": ["device_1", "device_2"]
}
```

### Device
```json
{
  "id": "device_1",
  "name": "iPhone",
  "type": "phone",  // phone | tablet | computer
  "memberId": "member_1",
  "status": "online"  // online | offline
}
```

### Time Limit
```json
{
  "id": "limit_1",
  "memberId": "member_1",
  "type": "app",  // daily | app | category
  "appId": "youtube",
  "app": "YouTube",
  "icon": "📺",
  "limit": 60,  // minutes
  "used": 27    // minutes used today
}
```

### App
```json
{
  "id": "youtube",
  "name": "YouTube",
  "status": "limited",  // blocked | allowed | limited
  "icon": "📺",
  "gradient": "linear-gradient(135deg, #FF0000, #CC0000)"
}
```

### Activity
```json
{
  "hasActivity": true,
  "totalTime": 135,  // minutes
  "activities": [
    {
      "app": "YouTube",
      "icon": "📺",
      "gradient": "linear-gradient(135deg, #FF0000, #CC0000)",
      "startTime": "2:30 PM",
      "endTime": "3:15 PM",
      "duration": "45 min"
    }
  ]
}
```

### Bedtime Schedule
```json
{
  "id": "schedule_1",
  "memberId": "member_1",
  "days": ["Su", "M", "Tu", "W", "Th", "F", "Sa"],
  "startTime": "22:00",  // 24-hour format
  "endTime": "07:00",
  "isActive": true
}
```

### Dashboard Overview
```json
{
  "totalMembers": 4,
  "totalDevices": 8,
  "sitesBlockedToday": 47,
  "totalScreenTime": "3h 45m",
  "recentAlerts": [
    {
      "type": "limit_reached",
      "member": "Sarah",
      "app": "Gaming Apps",
      "time": "2h ago"
    }
  ]
}
```

---

## Integration Steps

### Step 1: Set Up Your Backend

1. Create a backend API (Node.js/Express, Python/Django, etc.)
2. Implement the endpoints listed above
3. Set up Google OAuth for authentication
4. Implement JWT token authentication
5. Set up CORS to allow requests from your frontend domain

### Step 2: Configure the Dashboard

1. Update `api.js`:
   ```javascript
   const API_CONFIG = {
       baseURL: 'https://your-backend-url.com/v1'
   };
   const MOCK_MODE = false;
   ```

2. Update Google OAuth in `index.html`:
   ```html
   <script src="https://apis.google.com/js/platform.js" async defer></script>
   <meta name="google-signin-client_id" content="YOUR_CLIENT_ID.apps.googleusercontent.com">
   ```

### Step 3: Test Authentication

1. Open `index.html`
2. Click "Get Started"
3. Click "Continue with Google"
4. Verify you're redirected to `dashboard.html`
5. Check that auth token is stored in localStorage

### Step 4: Test Dashboard

1. Open browser DevTools → Network tab
2. Navigate through dashboard sections
3. Verify API calls are being made to your backend
4. Check responses match the data models above

### Step 5: Deploy

1. Build and deploy your backend
2. Update API_CONFIG.baseURL with production URL
3. Deploy frontend files to your web server
4. Configure HTTPS for production

---

## Testing

### Test with Mock Data (Default)

The dashboard comes with mock data enabled by default. This allows you to test the UI without a backend:

```javascript
// In api.js
const MOCK_MODE = true;  // Uses fake data
```

### Test with Real Backend

Once your backend is ready:

```javascript
// In api.js
const MOCK_MODE = false;  // Uses real API
```

### Debug Mode

Enable console logging to debug API calls:

```javascript
// In api.js - add this to apiRequest function
console.log('API Request:', endpoint, options);
console.log('API Response:', await response.json());
```

---

## Error Handling

The dashboard includes built-in error handling:

- **401 Unauthorized**: Auto-redirects to login
- **API Errors**: Shows error notifications
- **Loading States**: Shows loading spinners
- **Network Errors**: Shows retry option

To customize error messages, edit `dashboard-data.js`:

```javascript
function showSectionError(sectionId, message) {
    // Customize error display here
}
```

---

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for added security)
3. **Token Expiry**: Implement token refresh logic
4. **CORS**: Configure proper CORS headers on backend
5. **Input Validation**: Validate all user inputs on backend
6. **Rate Limiting**: Implement rate limiting on backend API

---

## Support

For issues or questions:
- Check browser console for error messages
- Verify API endpoints match the spec above
- Test API endpoints with Postman/curl
- Check CORS configuration
- Verify authentication tokens are being sent

---

## Example Backend (Node.js/Express)

```javascript
const express = require('express');
const app = express();

app.use(express.json());
app.use(cors());

// Authentication middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    // Verify JWT token here
    next();
};

// Example endpoint
app.get('/v1/family/members', authMiddleware, async (req, res) => {
    const members = await db.familyMembers.find({ familyId: req.user.familyId });
    res.json(members);
});

app.listen(3000);
```

---

## Next Steps

1. ✅ Set up backend API
2. ✅ Implement authentication
3. ✅ Update API_CONFIG in api.js
4. ✅ Test with real data
5. ✅ Deploy to production

Good luck with your integration! 🚀
