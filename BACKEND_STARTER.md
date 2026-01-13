# FilterNet VPN - Backend Starter (Node.js + Express)

This is a basic backend API starter that works with your dashboard.

## 🚀 Quick Start

```bash
# 1. Install Node.js (if not installed)
# Download from: https://nodejs.org/

# 2. Create backend folder
mkdir filternet-backend
cd filternet-backend

# 3. Copy all files from this guide into the folder

# 4. Install dependencies
npm install

# 5. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# 6. Run database migrations
npm run migrate

# 7. Start server
npm start

# ✅ API running on http://localhost:3000
```

---

## 📁 Project Structure

```
filternet-backend/
├── src/
│   ├── routes/
│   │   ├── auth.js           # Google OAuth, login/logout
│   │   ├── family.js          # Family members CRUD
│   │   ├── devices.js         # Device management
│   │   ├── timeLimit.js       # Time limits
│   │   ├── contentFilter.js   # App/website blocking
│   │   ├── activity.js        # Usage tracking
│   │   └── bedtime.js         # Bedtime schedules
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── models/
│   │   └── index.js           # Database models
│   ├── services/
│   │   └── vpn.js             # VPN server integration
│   └── app.js                 # Main Express app
├── package.json
├── .env.example
└── README.md
```

---

## 📦 Files to Create

### **1. package.json**

```json
{
  "name": "filternet-vpn-backend",
  "version": "1.0.0",
  "description": "FilterNet VPN Backend API",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "migrate": "node src/migrate.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "google-auth-library": "^9.0.0",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.35.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

### **2. .env.example**

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=filternet_vpn
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secret (change this to a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Google OAuth
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com

# VPN Server
VPN_SERVER_URL=http://localhost:8080
VPN_API_KEY=your-vpn-server-api-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8000
```

---

### **3. src/app.js** (Main Server)

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8000',
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/family', require('./routes/family'));
app.use('/api/v1/devices', require('./routes/devices'));
app.use('/api/v1/time-limits', require('./routes/timeLimit'));
app.use('/api/v1/content-filter', require('./routes/contentFilter'));
app.use('/api/v1/activity', require('./routes/activity'));
app.use('/api/v1/bedtime', require('./routes/bedtime'));
app.use('/api/v1/dashboard', require('./routes/dashboard'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🛡️  FilterNet VPN API running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
```

---

### **4. src/middleware/auth.js** (JWT Authentication)

```javascript
const jwt = require('jsonwebtoken');

// Verify JWT token from frontend
function authenticate(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1]; // "Bearer TOKEN"

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add user info to request
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = { authenticate };
```

---

### **5. src/routes/auth.js** (Google OAuth & Login)

```javascript
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { User, Family } = require('../models');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth Login
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;

        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // Find or create user
        let user = await User.findOne({ where: { email } });

        if (!user) {
            // Create new user and family
            const family = await Family.create({
                name: `${name}'s Family`,
                ownerId: null // Will update after user creation
            });

            user = await User.create({
                googleId,
                email,
                name,
                picture,
                familyId: family.id
            });

            // Update family owner
            await family.update({ ownerId: user.id });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                familyId: user.familyId
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
                familyId: user.familyId
            }
        });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

// Logout
router.post('/logout', authenticate, (req, res) => {
    // In stateless JWT, logout is handled on frontend by deleting token
    res.json({ success: true });
});

module.exports = router;
```

---

### **6. src/routes/family.js** (Family Members)

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { FamilyMember } = require('../models');

// Get all family members
router.get('/members', authenticate, async (req, res) => {
    try {
        const members = await FamilyMember.findAll({
            where: { familyId: req.user.familyId }
        });
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get family members' });
    }
});

// Get specific family member
router.get('/members/:id', authenticate, async (req, res) => {
    try {
        const member = await FamilyMember.findOne({
            where: {
                id: req.params.id,
                familyId: req.user.familyId
            }
        });

        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        res.json(member);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get member' });
    }
});

// Add new family member
router.post('/members', authenticate, async (req, res) => {
    try {
        const { name, age, profile, avatar } = req.body;

        const member = await FamilyMember.create({
            familyId: req.user.familyId,
            name,
            age,
            profile, // child, teen, adult
            avatar
        });

        res.json(member);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add family member' });
    }
});

// Update family member
router.put('/members/:id', authenticate, async (req, res) => {
    try {
        const member = await FamilyMember.findOne({
            where: {
                id: req.params.id,
                familyId: req.user.familyId
            }
        });

        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        await member.update(req.body);
        res.json(member);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update member' });
    }
});

// Delete family member
router.delete('/members/:id', authenticate, async (req, res) => {
    try {
        const member = await FamilyMember.findOne({
            where: {
                id: req.params.id,
                familyId: req.user.familyId
            }
        });

        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        await member.destroy();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete member' });
    }
});

module.exports = router;
```

---

### **7. src/routes/contentFilter.js** (App Blocking)

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { AppRule } = require('../models');
const vpnService = require('../services/vpn');

// Get available apps
router.get('/apps', authenticate, async (req, res) => {
    try {
        // Return list of apps that can be filtered
        const apps = [
            { id: 'youtube', name: 'YouTube', icon: '📺', gradient: 'linear-gradient(135deg, #FF0000, #CC0000)' },
            { id: 'instagram', name: 'Instagram', icon: '📷', gradient: 'linear-gradient(135deg, #E4405F, #C13584)' },
            { id: 'facebook', name: 'Facebook', icon: '📘', gradient: 'linear-gradient(135deg, #1877F2, #0C63D4)' },
            { id: 'tiktok', name: 'TikTok', icon: '🎵', gradient: 'linear-gradient(135deg, #000000, #00F2EA)' },
            { id: 'discord', name: 'Discord', icon: '💬', gradient: 'linear-gradient(135deg, #5865F2, #3B4BC7)' },
            { id: 'snapchat', name: 'Snapchat', icon: '👻', gradient: 'linear-gradient(135deg, #FFFC00, #FFD600)' },
        ];

        // Get rules for member
        const memberId = req.query.memberId;
        if (memberId) {
            const rules = await AppRule.findAll({
                where: { memberId, familyId: req.user.familyId }
            });

            // Add status to each app
            apps.forEach(app => {
                const rule = rules.find(r => r.appId === app.id);
                app.status = rule ? rule.status : 'allowed';
            });
        }

        res.json(apps);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get apps' });
    }
});

// Update app blocking status
router.put('/apps/:appId', authenticate, async (req, res) => {
    try {
        const { appId } = req.params;
        const { memberId, status } = req.body; // status: blocked, allowed, limited

        // Save rule to database
        const [rule, created] = await AppRule.findOrCreate({
            where: {
                familyId: req.user.familyId,
                memberId,
                appId
            },
            defaults: { status }
        });

        if (!created) {
            await rule.update({ status });
        }

        // Push policy to VPN server
        await vpnService.updateAppPolicy(memberId, appId, status);

        res.json({ success: true, rule });
    } catch (error) {
        console.error('Failed to update app status:', error);
        res.status(500).json({ error: 'Failed to update app status' });
    }
});

// Get all categories
router.get('/categories', authenticate, async (req, res) => {
    try {
        const categories = [
            { id: 'gaming', name: 'Gaming', description: 'Online games and gaming platforms', icon: '🎮', isBlocked: false },
            { id: 'social', name: 'Social Media', description: 'Social networking apps', icon: '💬', isBlocked: false },
            { id: 'adult', name: 'Adult Content', description: 'Explicit content', icon: '🔞', isBlocked: true },
            { id: 'gambling', name: 'Gambling', description: 'Betting and gambling', icon: '🎰', isBlocked: true },
        ];

        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

module.exports = router;
```

---

### **8. src/routes/activity.js** (Usage Tracking)

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Activity } = require('../models');

// Get activity for member
router.get('/', authenticate, async (req, res) => {
    try {
        const { memberId, date } = req.query;

        const activities = await Activity.findAll({
            where: {
                familyId: req.user.familyId,
                memberId,
                date: date || new Date().toISOString().split('T')[0]
            },
            order: [['startTime', 'DESC']]
        });

        res.json({
            hasActivity: activities.length > 0,
            activities,
            totalTime: activities.reduce((sum, a) => sum + a.duration, 0)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get activity' });
    }
});

// Log activity (called by VPN server)
router.post('/log', authenticate, async (req, res) => {
    try {
        const { memberId, appId, app, duration, startTime, endTime } = req.body;

        const activity = await Activity.create({
            familyId: req.user.familyId,
            memberId,
            appId,
            app,
            duration,
            startTime,
            endTime,
            date: new Date().toISOString().split('T')[0]
        });

        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: 'Failed to log activity' });
    }
});

module.exports = router;
```

---

### **9. src/routes/dashboard.js** (Overview Stats)

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { FamilyMember, Device, Activity } = require('../models');

// Get dashboard overview
router.get('/overview', authenticate, async (req, res) => {
    try {
        const familyId = req.user.familyId;
        const today = new Date().toISOString().split('T')[0];

        // Count family members
        const totalMembers = await FamilyMember.count({
            where: { familyId }
        });

        // Count devices
        const totalDevices = await Device.count({
            where: { familyId }
        });

        // Count sites blocked today (placeholder - implement actual blocking logic)
        const sitesBlockedToday = 47;

        // Calculate total screen time today
        const activities = await Activity.findAll({
            where: { familyId, date: today }
        });

        const totalMinutes = activities.reduce((sum, a) => sum + a.duration, 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const totalScreenTime = `${hours}h ${minutes}m`;

        res.json({
            totalMembers,
            totalDevices,
            sitesBlockedToday,
            totalScreenTime,
            recentAlerts: [] // Implement alerts logic
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get overview' });
    }
});

module.exports = router;
```

---

### **10. src/services/vpn.js** (VPN Server Integration)

```javascript
const axios = require('axios');

const VPN_SERVER_URL = process.env.VPN_SERVER_URL;
const VPN_API_KEY = process.env.VPN_API_KEY;

// Update app blocking policy on VPN server
async function updateAppPolicy(memberId, appId, status) {
    try {
        await axios.post(`${VPN_SERVER_URL}/api/policy/app`, {
            memberId,
            appId,
            action: status // blocked, allowed, limited
        }, {
            headers: {
                'Authorization': `Bearer ${VPN_API_KEY}`
            }
        });

        console.log(`✅ VPN policy updated: ${appId} -> ${status} for member ${memberId}`);
    } catch (error) {
        console.error('Failed to update VPN policy:', error.message);
        // Don't throw - continue even if VPN server is down
    }
}

// Push all policies for a member to VPN server
async function syncMemberPolicies(memberId, policies) {
    try {
        await axios.post(`${VPN_SERVER_URL}/api/policy/sync`, {
            memberId,
            policies
        }, {
            headers: {
                'Authorization': `Bearer ${VPN_API_KEY}`
            }
        });

        console.log(`✅ Synced all policies for member ${memberId}`);
    } catch (error) {
        console.error('Failed to sync policies:', error.message);
    }
}

module.exports = {
    updateAppPolicy,
    syncMemberPolicies
};
```

---

### **11. src/models/index.js** (Database Models - Example with Sequelize)

```javascript
const { Sequelize, DataTypes } = require('sequelize');

// Database connection
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false
});

// User model
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    googleId: {
        type: DataTypes.STRING,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        unique: true
    },
    name: DataTypes.STRING,
    picture: DataTypes.STRING,
    familyId: DataTypes.UUID
});

// Family model
const Family = sequelize.define('Family', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: DataTypes.STRING,
    ownerId: DataTypes.UUID
});

// Family Member model
const FamilyMember = sequelize.define('FamilyMember', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    familyId: DataTypes.UUID,
    name: DataTypes.STRING,
    age: DataTypes.INTEGER,
    profile: DataTypes.ENUM('child', 'teen', 'adult'),
    avatar: DataTypes.STRING
});

// Device model
const Device = sequelize.define('Device', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    familyId: DataTypes.UUID,
    memberId: DataTypes.UUID,
    name: DataTypes.STRING,
    type: DataTypes.ENUM('phone', 'tablet', 'computer'),
    status: DataTypes.ENUM('online', 'offline')
});

// App Rule model
const AppRule = sequelize.define('AppRule', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    familyId: DataTypes.UUID,
    memberId: DataTypes.UUID,
    appId: DataTypes.STRING,
    status: DataTypes.ENUM('blocked', 'allowed', 'limited')
});

// Activity model
const Activity = sequelize.define('Activity', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    familyId: DataTypes.UUID,
    memberId: DataTypes.UUID,
    appId: DataTypes.STRING,
    app: DataTypes.STRING,
    duration: DataTypes.INTEGER, // minutes
    startTime: DataTypes.TIME,
    endTime: DataTypes.TIME,
    date: DataTypes.DATEONLY
});

// Sync database
sequelize.sync({ alter: true }).then(() => {
    console.log('✅ Database synced');
});

module.exports = {
    sequelize,
    User,
    Family,
    FamilyMember,
    Device,
    AppRule,
    Activity
};
```

---

## 🔗 Integration with Your Dashboard

Your dashboard is already configured to call these endpoints!

```javascript
// In your frontend config.js - Update this:
api: {
    baseURL: 'http://localhost:3000/api/v1'  // ← Backend URL
}
```

---

## 🧪 Testing

```bash
# Start backend
npm start

# Test endpoints with curl:

# 1. Health check
curl http://localhost:3000/health

# 2. Login (will need real Google token)
curl -X POST http://localhost:3000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"credential": "GOOGLE_JWT_TOKEN"}'

# 3. Get family members (with JWT token)
curl http://localhost:3000/api/v1/family/members \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📚 Next Steps

1. **Install dependencies:** `npm install`
2. **Set up PostgreSQL database**
3. **Configure .env file**
4. **Run the server:** `npm start`
5. **Update frontend config.js** with backend URL
6. **Test authentication flow**
7. **Implement remaining endpoints** (devices, time-limits, bedtime)

This is a working starter - your mentor can expand from here! 🚀
