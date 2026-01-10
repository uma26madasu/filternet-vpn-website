// ===================================
// API Configuration
// ===================================
const API_CONFIG = {
    // REPLACE THIS WITH YOUR ACTUAL BACKEND URL
    baseURL: 'https://api.filternet-vpn.com/v1',

    // For local development
    // baseURL: 'http://localhost:3000/api/v1',

    // API timeout
    timeout: 10000
};

// ===================================
// API Helper Functions
// ===================================
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            // Add authentication token from localStorage
            'Authorization': `Bearer ${getAuthToken()}`
        },
        ...options
    };

    try {
        const response = await fetch(url, defaultOptions);

        if (response.status === 401) {
            // Token expired or invalid - redirect to login
            handleUnauthorized();
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// ===================================
// Authentication Management
// ===================================
function getAuthToken() {
    return localStorage.getItem('filternet_auth_token') || '';
}

function setAuthToken(token) {
    localStorage.setItem('filternet_auth_token', token);
}

function getUserData() {
    const userData = localStorage.getItem('filternet_user_data');
    return userData ? JSON.parse(userData) : null;
}

function setUserData(data) {
    localStorage.setItem('filternet_user_data', JSON.stringify(data));
}

function clearAuthData() {
    localStorage.removeItem('filternet_auth_token');
    localStorage.removeItem('filternet_user_data');
}

function handleUnauthorized() {
    clearAuthData();
    window.location.href = 'index.html';
}

// Check if user is authenticated
function checkAuthentication() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// ===================================
// API Endpoints
// ===================================

// USER & AUTHENTICATION
const AuthAPI = {
    // Get current user profile
    getCurrentUser: async () => {
        return await apiRequest('/user/profile');
    },

    // Update user profile
    updateProfile: async (data) => {
        return await apiRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Logout
    logout: async () => {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
        } finally {
            clearAuthData();
            window.location.href = 'index.html';
        }
    }
};

// FAMILY MEMBERS
const FamilyAPI = {
    // Get all family members
    getAllMembers: async () => {
        return await apiRequest('/family/members');
    },

    // Get specific family member
    getMember: async (memberId) => {
        return await apiRequest(`/family/members/${memberId}`);
    },

    // Add new family member
    addMember: async (memberData) => {
        return await apiRequest('/family/members', {
            method: 'POST',
            body: JSON.stringify(memberData)
        });
    },

    // Update family member
    updateMember: async (memberId, data) => {
        return await apiRequest(`/family/members/${memberId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Delete family member
    deleteMember: async (memberId) => {
        return await apiRequest(`/family/members/${memberId}`, {
            method: 'DELETE'
        });
    }
};

// DEVICES
const DeviceAPI = {
    // Get all devices
    getAllDevices: async () => {
        return await apiRequest('/devices');
    },

    // Get devices for specific family member
    getMemberDevices: async (memberId) => {
        return await apiRequest(`/devices?memberId=${memberId}`);
    },

    // Add new device
    addDevice: async (deviceData) => {
        return await apiRequest('/devices', {
            method: 'POST',
            body: JSON.stringify(deviceData)
        });
    },

    // Update device
    updateDevice: async (deviceId, data) => {
        return await apiRequest(`/devices/${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Remove device
    removeDevice: async (deviceId) => {
        return await apiRequest(`/devices/${deviceId}`, {
            method: 'DELETE'
        });
    }
};

// TIME LIMITS
const TimeLimitAPI = {
    // Get all time limits for a member
    getLimits: async (memberId) => {
        return await apiRequest(`/time-limits?memberId=${memberId}`);
    },

    // Set daily limit
    setDailyLimit: async (memberId, limitData) => {
        return await apiRequest(`/time-limits/daily`, {
            method: 'POST',
            body: JSON.stringify({ memberId, ...limitData })
        });
    },

    // Set app-specific limit
    setAppLimit: async (memberId, appId, limitData) => {
        return await apiRequest(`/time-limits/app`, {
            method: 'POST',
            body: JSON.stringify({ memberId, appId, ...limitData })
        });
    },

    // Update time limit
    updateLimit: async (limitId, data) => {
        return await apiRequest(`/time-limits/${limitId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Delete time limit
    deleteLimit: async (limitId) => {
        return await apiRequest(`/time-limits/${limitId}`, {
            method: 'DELETE'
        });
    },

    // Get current usage for member
    getCurrentUsage: async (memberId, date = null) => {
        const dateParam = date ? `&date=${date}` : '';
        return await apiRequest(`/time-limits/usage?memberId=${memberId}${dateParam}`);
    }
};

// CONTENT FILTERING
const ContentFilterAPI = {
    // Get filtering rules for member
    getRules: async (memberId) => {
        return await apiRequest(`/content-filter/rules?memberId=${memberId}`);
    },

    // Get all available apps
    getAvailableApps: async () => {
        return await apiRequest('/content-filter/apps');
    },

    // Update app status (blocked/allowed/limited)
    updateAppStatus: async (memberId, appId, status) => {
        return await apiRequest(`/content-filter/apps/${appId}`, {
            method: 'PUT',
            body: JSON.stringify({ memberId, status })
        });
    },

    // Add website to block list
    blockWebsite: async (memberId, url) => {
        return await apiRequest(`/content-filter/websites`, {
            method: 'POST',
            body: JSON.stringify({ memberId, url, action: 'block' })
        });
    },

    // Get blocked websites
    getBlockedWebsites: async (memberId) => {
        return await apiRequest(`/content-filter/websites?memberId=${memberId}`);
    },

    // Toggle category blocking
    updateCategoryStatus: async (memberId, categoryId, isBlocked) => {
        return await apiRequest(`/content-filter/categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify({ memberId, isBlocked })
        });
    },

    // Get all categories
    getCategories: async () => {
        return await apiRequest('/content-filter/categories');
    },

    // Update member profile (child/teen/adult)
    updateProfile: async (memberId, profile) => {
        return await apiRequest(`/content-filter/profile`, {
            method: 'PUT',
            body: JSON.stringify({ memberId, profile })
        });
    }
};

// ACTIVITY MONITORING
const ActivityAPI = {
    // Get activity for specific member and date
    getActivity: async (memberId, date = null) => {
        const dateParam = date ? `&date=${date}` : '';
        return await apiRequest(`/activity?memberId=${memberId}${dateParam}`);
    },

    // Get activity summary
    getSummary: async (memberId, startDate, endDate) => {
        return await apiRequest(
            `/activity/summary?memberId=${memberId}&start=${startDate}&end=${endDate}`
        );
    },

    // Get top used apps
    getTopApps: async (memberId, date = null) => {
        const dateParam = date ? `&date=${date}` : '';
        return await apiRequest(`/activity/top-apps?memberId=${memberId}${dateParam}`);
    },

    // Get activity by category
    getByCategory: async (memberId, date = null) => {
        const dateParam = date ? `&date=${date}` : '';
        return await apiRequest(`/activity/by-category?memberId=${memberId}${dateParam}`);
    }
};

// BEDTIME SCHEDULES
const BedtimeAPI = {
    // Get all schedules for member
    getSchedules: async (memberId) => {
        return await apiRequest(`/bedtime/schedules?memberId=${memberId}`);
    },

    // Create new schedule
    createSchedule: async (memberId, scheduleData) => {
        return await apiRequest(`/bedtime/schedules`, {
            method: 'POST',
            body: JSON.stringify({ memberId, ...scheduleData })
        });
    },

    // Update schedule
    updateSchedule: async (scheduleId, data) => {
        return await apiRequest(`/bedtime/schedules/${scheduleId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Delete schedule
    deleteSchedule: async (scheduleId) => {
        return await apiRequest(`/bedtime/schedules/${scheduleId}`, {
            method: 'DELETE'
        });
    },

    // Toggle schedule active status
    toggleSchedule: async (scheduleId, isActive) => {
        return await apiRequest(`/bedtime/schedules/${scheduleId}/toggle`, {
            method: 'PUT',
            body: JSON.stringify({ isActive })
        });
    }
};

// DASHBOARD OVERVIEW
const DashboardAPI = {
    // Get overview stats
    getOverview: async () => {
        return await apiRequest('/dashboard/overview');
    },

    // Get alerts and notifications
    getAlerts: async () => {
        return await apiRequest('/dashboard/alerts');
    },

    // Get recent blocks
    getRecentBlocks: async (limit = 10) => {
        return await apiRequest(`/dashboard/recent-blocks?limit=${limit}`);
    }
};

// ===================================
// Export API Object
// ===================================
const API = {
    Auth: AuthAPI,
    Family: FamilyAPI,
    Device: DeviceAPI,
    TimeLimit: TimeLimitAPI,
    ContentFilter: ContentFilterAPI,
    Activity: ActivityAPI,
    Bedtime: BedtimeAPI,
    Dashboard: DashboardAPI
};

// Make API available globally
window.FilterNetAPI = API;

// ===================================
// MOCK DATA FOR DEVELOPMENT
// ===================================
// This section provides mock data when backend is not available
// Remove or comment out this section in production

const MOCK_MODE = true; // Set to false when backend is ready

if (MOCK_MODE) {
    console.warn('⚠️ Running in MOCK MODE - Using fake data');
    console.warn('Set MOCK_MODE = false in api.js when backend is ready');

    // Override API requests to return mock data
    window.FilterNetAPI = {
        Auth: {
            getCurrentUser: async () => ({
                id: 'user_123',
                email: 'parent@example.com',
                name: 'Parent Account',
                familyId: 'family_456'
            }),
            logout: () => {
                clearAuthData();
                window.location.href = 'index.html';
            }
        },

        Family: {
            getAllMembers: async () => ([
                {
                    id: 'member_1',
                    name: 'Sarah',
                    age: 12,
                    profile: 'teen',
                    avatar: '👧',
                    devices: ['device_1', 'device_2']
                },
                {
                    id: 'member_2',
                    name: 'Mike',
                    age: 8,
                    profile: 'child',
                    avatar: '👦',
                    devices: ['device_3']
                },
                {
                    id: 'member_3',
                    name: 'Dad',
                    age: 40,
                    profile: 'adult',
                    avatar: '👨',
                    devices: ['device_4']
                },
                {
                    id: 'member_4',
                    name: 'Mom',
                    age: 38,
                    profile: 'adult',
                    avatar: '👩',
                    devices: ['device_5']
                }
            ])
        },

        Device: {
            getAllDevices: async () => ([
                { id: 'device_1', name: 'iPhone', type: 'phone', memberId: 'member_1', status: 'online' },
                { id: 'device_2', name: 'iPad', type: 'tablet', memberId: 'member_1', status: 'offline' },
                { id: 'device_3', name: 'iPhone', type: 'phone', memberId: 'member_2', status: 'online' },
                { id: 'device_4', name: 'MacBook', type: 'computer', memberId: 'member_3', status: 'online' },
                { id: 'device_5', name: 'iPhone', type: 'phone', memberId: 'member_4', status: 'online' }
            ])
        },

        Dashboard: {
            getOverview: async () => ({
                totalMembers: 4,
                totalDevices: 8,
                sitesBlockedToday: 47,
                totalScreenTime: '3h 45m',
                recentAlerts: [
                    { type: 'limit_reached', member: 'Sarah', app: 'Gaming Apps', time: '2h ago' }
                ]
            })
        },

        TimeLimit: {
            getLimits: async (memberId) => {
                if (memberId === 'member_1') {
                    return [
                        { id: 'limit_1', app: 'YouTube', appId: 'youtube', limit: 60, used: 27, icon: '📺' },
                        { id: 'limit_2', app: 'Gaming Apps', appId: 'gaming', limit: 30, used: 30, icon: '🎮' }
                    ];
                }
                return [];
            },
            getCurrentUsage: async (memberId) => ({
                daily: { limit: 180, used: 135 },
                apps: [
                    { app: 'YouTube', used: 27 },
                    { app: 'Gaming Apps', used: 30 }
                ]
            })
        },

        ContentFilter: {
            getAvailableApps: async () => ([
                { id: 'amazon_prime', name: 'Amazon Prime Video', status: 'blocked', icon: '📺', gradient: 'linear-gradient(135deg, #00A8E1, #0080B3)' },
                { id: 'discord', name: 'Discord', status: 'blocked', icon: '💬', gradient: 'linear-gradient(135deg, #5865F2, #3B4BC7)' },
                { id: 'facebook', name: 'Facebook', status: 'blocked', icon: '📘', gradient: 'linear-gradient(135deg, #1877F2, #0C63D4)' },
                { id: 'instagram', name: 'Instagram', status: 'blocked', icon: '📷', gradient: 'linear-gradient(135deg, #E4405F, #C13584)' },
                { id: 'snapchat', name: 'Snapchat', status: 'blocked', icon: '👻', gradient: 'linear-gradient(135deg, #FFFC00, #FFD600)' },
                { id: 'amazon', name: 'Amazon', status: 'allowed', icon: '📦', gradient: 'linear-gradient(135deg, #FF9900, #E68A00)' },
                { id: 'cartoon_network', name: 'Cartoon Network', status: 'allowed', icon: '📺', gradient: 'linear-gradient(135deg, #000000, #333333)' },
                { id: 'youtube', name: 'YouTube', status: 'limited', icon: '📺', gradient: 'linear-gradient(135deg, #FF0000, #CC0000)' }
            ]),
            getCategories: async () => ([
                { id: 'gaming', name: 'Gaming', description: 'Online games and gaming platforms', icon: '🎮', isBlocked: true },
                { id: 'social', name: 'Social Media', description: 'Social networking and messaging apps', icon: '💬', isBlocked: true },
                { id: 'video', name: 'Video Streaming', description: 'Video content and streaming services', icon: '🎬', isBlocked: false },
                { id: 'adult', name: 'Adult Content', description: 'Explicit and mature content', icon: '🔞', isBlocked: true },
                { id: 'gambling', name: 'Gambling', description: 'Betting and gambling websites', icon: '🎰', isBlocked: true }
            ])
        },

        Activity: {
            getActivity: async (memberId, date) => ({
                hasActivity: false,
                activities: [],
                totalTime: 0
            }),
            getTopApps: async (memberId) => ([])
        },

        Bedtime: {
            getSchedules: async (memberId) => {
                if (memberId === 'member_1' || memberId === 'member_2') {
                    return [{
                        id: 'schedule_1',
                        days: ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'],
                        startTime: '22:00',
                        endTime: '07:00',
                        isActive: true
                    }];
                }
                return [];
            }
        }
    };
}
