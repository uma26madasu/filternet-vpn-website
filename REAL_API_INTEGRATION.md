# Real API Integration Guide

This guide explains how to integrate the FilterNet VPN dashboard with your mentor's actual backend API.

## 📋 Overview

The dashboard now has two API integration layers:
1. **Mock API** (`api.js`) - Original mock data for development
2. **Real API** (`real-api.js`) - Integration with your mentor's actual backend ✨ **NEW**

## 🚀 Current Setup

### What We've Built

Based on your mentor's API response structure, we've created:

1. **real-api.js** - Real API integration layer
   - Client configuration management
   - Blocked services toggle functionality
   - Safe search configuration
   - Data transformation utilities

2. **dashboard-real.js** - Dashboard logic using real API
   - Loads actual client devices from backend
   - Renders services with live toggle functionality
   - Updates backend when services are blocked/allowed
   - Device selection UI

3. **Updated dashboard.html** - Now uses real API integration

### Supported Services

The dashboard supports toggling these services (from your list):
- ✅ Amazon (Shopping)
- ✅ Amazon Prime Video (Streaming)
- ✅ Apple TV+ (Streaming)
- ✅ eBay (Shopping)
- ✅ Facebook (Social Media)
- ✅ Instagram (Social Media)
- ✅ Netflix (Streaming)
- ✅ Roblox (Gaming)
- ✅ TikTok (Social Media)
- ✅ WhatsApp (Messaging)
- ✅ YouTube (Streaming)

---

## ⚙️ Configuration Steps

### Step 1: Update API Endpoint

Open `real-api.js` and update the base URL:

```javascript
const REAL_API_CONFIG = {
    // REPLACE THIS WITH YOUR ACTUAL BACKEND URL
    baseURL: 'https://your-backend-api.com/api',  // ← UPDATE THIS
    timeout: 10000
};
```

**Example:**
```javascript
baseURL: 'https://filternet-api.mulesoft.com/v1'
```

### Step 2: Disable Mock Mode

In `real-api.js`, find this line and change it to `false`:

```javascript
const USE_MOCK_REAL_API = true; // Set to false when backend is ready
```

Change to:
```javascript
const USE_MOCK_REAL_API = false; // ✅ Using real backend
```

### Step 3: Update API Endpoints (if needed)

If your mentor's endpoints differ from the defaults, update them in `real-api.js`:

```javascript
const RealClientAPI = {
    // Get all client configurations
    getAllClients: async () => {
        const data = await realApiRequest('/clients');  // ← Update endpoint
        return transformClientData(data);
    },

    // Get specific client
    getClient: async (clientId) => {
        const data = await realApiRequest(`/clients/${clientId}`);  // ← Update endpoint
        return data;
    },

    // Update blocked services
    updateBlockedServices: async (clientId, blockedServices) => {
        const response = await realApiRequest(`/clients/${clientId}/blocked-services`, {
            method: 'PUT',
            body: JSON.stringify({
                blocked_services: blockedServices
            })
        });
        return response;
    }
};
```

---

## 📡 API Endpoints Required from Backend

Your mentor's backend needs to provide these endpoints:

### 1. **GET /clients**
Get all client configurations for the authenticated user.

**Response Format:**
```json
[
    {
        "yourznag-gmail-com-1": {
            "name": "yourznag@gmail.com||Naga_Home||45",
            "blocked_services": [
                "amazon_streaming",
                "instagram",
                "tiktok"
            ],
            "safe_search": {
                "enabled": true,
                "google": true,
                "youtube": true
            },
            "filtering_enabled": true,
            "ids": ["10.4.11.2", "id-45", "yourznag-gmail-com-1"]
        }
    },
    {
        "yourznag-gmail-com-2": {
            "name": "yourznag@gmail.com||iPhone||12",
            "blocked_services": ["instagram", "tiktok", "youtube"],
            "filtering_enabled": true,
            "ids": ["yourznag-gmail-com-2"]
        }
    }
]
```

### 2. **GET /clients/:clientId**
Get specific client configuration.

**Example:** `GET /clients/yourznag-gmail-com-1`

**Response Format:**
```json
{
    "name": "yourznag@gmail.com||Naga_Home||45",
    "blocked_services": ["amazon_streaming", "instagram", "tiktok"],
    "safe_search": {
        "enabled": true
    },
    "filtering_enabled": true
}
```

### 3. **PUT /clients/:clientId/blocked-services**
Update blocked services for a client.

**Request Body:**
```json
{
    "blocked_services": [
        "amazon_streaming",
        "instagram",
        "tiktok",
        "facebook"
    ]
}
```

**Response Format:**
```json
{
    "success": true,
    "client_id": "yourznag-gmail-com-1",
    "blocked_services": ["amazon_streaming", "instagram", "tiktok", "facebook"]
}
```

### 4. **PUT /clients/:clientId/safe-search** (Optional)
Update safe search settings.

**Request Body:**
```json
{
    "safe_search": {
        "enabled": true,
        "google": true,
        "youtube": true,
        "bing": true
    }
}
```

---

## 🔐 Authentication

The dashboard expects a JWT token stored in `localStorage` after Google OAuth login.

**Token Storage:**
```javascript
localStorage.setItem('filternet_auth_token', 'YOUR_JWT_TOKEN');
localStorage.setItem('filternet_user_data', JSON.stringify({
    email: 'user@gmail.com',
    name: 'User Name'
}));
```

**Token Usage:**
All API requests automatically include the token in headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Your mentor's backend should:
1. Verify the JWT token
2. Extract user information (email)
3. Return only clients belonging to that user

---

## 🎨 How It Works

### User Flow:

1. **Login with Google**
   - User authenticates via Google OAuth
   - JWT token stored in localStorage
   - Redirected to dashboard

2. **Dashboard Loads**
   - Fetches all client devices for logged-in user
   - Displays overview stats (devices, blocked services, etc.)
   - Shows family members (client devices) cards

3. **Content Filtering**
   - User clicks on a device card OR navigates to "Content Filtering"
   - Dashboard loads blocked services for selected device
   - Shows all available services grouped by category
   - Each service has a toggle switch

4. **Toggle Service**
   - User toggles a service (e.g., Instagram)
   - Dashboard makes API call to backend
   - Backend updates VPN server policies
   - UI updates to show new status
   - Success notification shown

### Data Flow:

```
User Action (Toggle Instagram)
    ↓
Frontend (dashboard-real.js)
    ↓
API Call (real-api.js) → PUT /clients/{id}/blocked-services
    ↓
Backend (MuleSoft)
    ↓
VPN Server (Policy Update)
    ↓
Backend Response
    ↓
Frontend Updates UI
    ↓
Show Notification "Instagram blocked ✓"
```

---

## 🧪 Testing

### Test with Mock Data

The integration includes mock data matching your example. To test:

1. Keep `USE_MOCK_REAL_API = true` in `real-api.js`
2. Open dashboard.html in browser
3. Navigate to "Content Filtering"
4. Toggle services - changes persist in mock data
5. Check browser console for API call logs

### Test with Real Backend

1. Update `baseURL` in `real-api.js`
2. Set `USE_MOCK_REAL_API = false`
3. Make sure you're logged in with Google OAuth
4. Open dashboard
5. Toggle services - should update real backend

---

## 🐛 Troubleshooting

### Services Not Loading

**Problem:** Content filtering section shows "Failed to load"

**Solutions:**
- Check browser console for errors
- Verify `baseURL` is correct in `real-api.js`
- Check if backend is running and accessible
- Verify CORS is enabled on backend

### Toggle Not Working

**Problem:** Toggle switches but nothing happens

**Solutions:**
- Check browser console for API errors
- Verify JWT token exists: `localStorage.getItem('filternet_auth_token')`
- Check backend logs for request errors
- Verify endpoint URL is correct

### Authentication Errors (401)

**Problem:** "Unauthorized" errors

**Solutions:**
- Re-login with Google OAuth
- Check if token expired
- Verify backend is validating token correctly

---

## 📝 Code Examples

### Add a New Service

To add a new service (e.g., "Spotify"):

1. Open `real-api.js`
2. Add to `SERVICE_INFO`:

```javascript
const SERVICE_INFO = {
    // ... existing services
    'spotify': {
        name: 'Spotify',
        icon: '🎵',
        gradient: 'linear-gradient(135deg, #1DB954, #191414)',
        category: 'streaming'
    }
};
```

3. Make sure backend returns 'spotify' in `blocked_services` array

### Customize Service Categories

Edit category names in `dashboard-real.js`:

```javascript
const categoryNames = {
    'streaming': 'Streaming Services',  // ← Customize these
    'social': 'Social Media',
    'gaming': 'Gaming',
    'shopping': 'Shopping',
    'messaging': 'Messaging',
    'other': 'Other Services'
};
```

---

## 🔄 Data Synchronization

### Real-time Updates

Currently, the dashboard:
- ✅ Loads data on page load
- ✅ Updates immediately when user toggles
- ✅ Shows loading states during API calls
- ✅ Handles errors gracefully

### Future Enhancements

For real-time sync across devices, consider:
- WebSocket connection for live updates
- Polling every 30-60 seconds
- Server-Sent Events (SSE)

---

## 📊 Service IDs Reference

These are the exact service IDs your backend should use:

| Service ID          | Display Name          | Category  |
|--------------------|-----------------------|-----------|
| `amazon`           | Amazon                | Shopping  |
| `amazon_streaming` | Amazon Prime Video    | Streaming |
| `apple_streaming`  | Apple TV+             | Streaming |
| `ebay`             | eBay                  | Shopping  |
| `facebook`         | Facebook              | Social    |
| `instagram`        | Instagram             | Social    |
| `netflix`          | Netflix               | Streaming |
| `roblox`           | Roblox                | Gaming    |
| `tiktok`           | TikTok                | Social    |
| `whatsapp`         | WhatsApp              | Messaging |
| `youtube`          | YouTube               | Streaming |

**IMPORTANT:** Backend must use these exact IDs in the `blocked_services` array.

---

## ✅ Checklist for Deployment

Before going live, ensure:

- [ ] `baseURL` updated in `real-api.js`
- [ ] `USE_MOCK_REAL_API` set to `false`
- [ ] Backend endpoints are working
- [ ] CORS is enabled on backend
- [ ] Google OAuth is configured (see QUICK_SETUP.md)
- [ ] JWT token validation is working
- [ ] All services can be toggled successfully
- [ ] Error handling is working
- [ ] Test with multiple devices/clients

---

## 🆘 Need Help?

### Common Questions

**Q: Can I add more services?**
A: Yes! Add them to `SERVICE_INFO` in `real-api.js` and make sure your backend supports them.

**Q: Can I customize the UI colors?**
A: Yes! Edit `dashboard.css` for styling. Each service gradient is defined in `SERVICE_INFO`.

**Q: How do I test without backend?**
A: Keep `USE_MOCK_REAL_API = true` to use mock data that matches your API structure.

**Q: Where are API calls logged?**
A: Open browser DevTools → Console to see all API calls and responses.

---

## 📁 File Structure

```
filternet-vpn-website/
├── index.html              # Landing page
├── dashboard.html          # Main dashboard (UPDATED)
├── api.js                  # Original mock API
├── real-api.js            # Real API integration (NEW)
├── dashboard-real.js      # Real dashboard logic (NEW)
├── dashboard.js           # UI controls
├── dashboard-data.js      # Data management
├── config.js              # Google OAuth config
├── auth.js                # Authentication
└── styles/                # CSS files
```

---

## 🎯 Next Steps

1. **Share this guide with your mentor**
2. **Update `baseURL` in `real-api.js`** with actual backend URL
3. **Test the integration** with mock data first
4. **Deploy backend** following MULESOFT_BACKEND_GUIDE.md
5. **Switch to real mode** (`USE_MOCK_REAL_API = false`)
6. **Test end-to-end** with real Google login and service toggling

Your dashboard is now ready to work with real backend APIs! 🚀
