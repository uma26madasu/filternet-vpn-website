// ===================================
// Real API Integration for FilterNet VPN
// This file integrates with your mentor's actual backend
// ===================================

const REAL_API_CONFIG = {
    // REPLACE THIS WITH YOUR ACTUAL BACKEND URL
    baseURL: 'https://your-backend-api.com/api',

    // API timeout
    timeout: 10000
};

// ===================================
// Service Name Mappings
// ===================================
const SERVICE_INFO = {
    'amazon_streaming': {
        name: 'Amazon Prime Video',
        icon: '📺',
        gradient: 'linear-gradient(135deg, #00A8E1, #0080B3)',
        category: 'streaming'
    },
    'apple_streaming': {
        name: 'Apple TV+',
        icon: '📺',
        gradient: 'linear-gradient(135deg, #000000, #333333)',
        category: 'streaming'
    },
    'instagram': {
        name: 'Instagram',
        icon: '📷',
        gradient: 'linear-gradient(135deg, #E4405F, #C13584)',
        category: 'social'
    },
    'tiktok': {
        name: 'TikTok',
        icon: '🎵',
        gradient: 'linear-gradient(135deg, #000000, #EE1D52)',
        category: 'social'
    },
    'amazon': {
        name: 'Amazon',
        icon: '📦',
        gradient: 'linear-gradient(135deg, #FF9900, #E68A00)',
        category: 'shopping'
    },
    'ebay': {
        name: 'eBay',
        icon: '🛍️',
        gradient: 'linear-gradient(135deg, #E53238, #0064D2)',
        category: 'shopping'
    },
    'facebook': {
        name: 'Facebook',
        icon: '📘',
        gradient: 'linear-gradient(135deg, #1877F2, #0C63D4)',
        category: 'social'
    },
    'netflix': {
        name: 'Netflix',
        icon: '🎬',
        gradient: 'linear-gradient(135deg, #E50914, #B20710)',
        category: 'streaming'
    },
    'roblox': {
        name: 'Roblox',
        icon: '🎮',
        gradient: 'linear-gradient(135deg, #000000, #333333)',
        category: 'gaming'
    },
    'whatsapp': {
        name: 'WhatsApp',
        icon: '💬',
        gradient: 'linear-gradient(135deg, #25D366, #128C7E)',
        category: 'messaging'
    },
    'youtube': {
        name: 'YouTube',
        icon: '📺',
        gradient: 'linear-gradient(135deg, #FF0000, #CC0000)',
        category: 'streaming'
    }
};

// ===================================
// API Helper Functions
// ===================================
async function realApiRequest(endpoint, options = {}) {
    const url = `${REAL_API_CONFIG.baseURL}${endpoint}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
        ...options
    };

    try {
        const response = await fetch(url, defaultOptions);

        if (response.status === 401) {
            handleUnauthorized();
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Real API Request failed:', error);
        throw error;
    }
}

// ===================================
// Client Configuration API
// ===================================
const RealClientAPI = {
    /**
     * Get all client configurations for the authenticated user
     * Returns array of client configs with blocked_services, safe_search, etc.
     */
    getAllClients: async () => {
        try {
            const data = await realApiRequest('/clients');
            // Data comes as array of objects with client IDs as keys
            // Transform to easier format
            return transformClientData(data);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
            throw error;
        }
    },

    /**
     * Get specific client configuration
     * @param {string} clientId - The client ID (e.g., 'yourznag-gmail-com-1')
     */
    getClient: async (clientId) => {
        try {
            const data = await realApiRequest(`/clients/${clientId}`);
            return data;
        } catch (error) {
            console.error('Failed to fetch client:', error);
            throw error;
        }
    },

    /**
     * Update blocked services for a client
     * @param {string} clientId - The client ID
     * @param {Array} blockedServices - Array of service IDs to block
     */
    updateBlockedServices: async (clientId, blockedServices) => {
        try {
            const response = await realApiRequest(`/clients/${clientId}/blocked-services`, {
                method: 'PUT',
                body: JSON.stringify({
                    blocked_services: blockedServices
                })
            });
            return response;
        } catch (error) {
            console.error('Failed to update blocked services:', error);
            throw error;
        }
    },

    /**
     * Toggle a single service block status
     * @param {string} clientId - The client ID
     * @param {string} serviceId - Service ID (e.g., 'instagram', 'youtube')
     * @param {boolean} shouldBlock - true to block, false to allow
     */
    toggleService: async (clientId, serviceId, shouldBlock) => {
        try {
            // Get current client config
            const client = await RealClientAPI.getClient(clientId);
            const currentBlocked = client.blocked_services || [];

            let newBlocked;
            if (shouldBlock) {
                // Add to blocked list if not already there
                newBlocked = currentBlocked.includes(serviceId)
                    ? currentBlocked
                    : [...currentBlocked, serviceId];
            } else {
                // Remove from blocked list
                newBlocked = currentBlocked.filter(s => s !== serviceId);
            }

            // Update on server
            return await RealClientAPI.updateBlockedServices(clientId, newBlocked);
        } catch (error) {
            console.error('Failed to toggle service:', error);
            throw error;
        }
    },

    /**
     * Update safe search settings
     * @param {string} clientId - The client ID
     * @param {Object} safeSearchConfig - Safe search configuration object
     */
    updateSafeSearch: async (clientId, safeSearchConfig) => {
        try {
            const response = await realApiRequest(`/clients/${clientId}/safe-search`, {
                method: 'PUT',
                body: JSON.stringify({
                    safe_search: safeSearchConfig
                })
            });
            return response;
        } catch (error) {
            console.error('Failed to update safe search:', error);
            throw error;
        }
    }
};

// ===================================
// Data Transformation Functions
// ===================================

/**
 * Transform raw client data to easier format for UI
 * Input: [{"clientId": {...}}, {"clientId2": {...}}]
 * Output: [{id: "clientId", name: "...", blocked_services: [...], ...}, ...]
 */
function transformClientData(rawData) {
    if (!Array.isArray(rawData)) {
        return [];
    }

    const clients = [];

    rawData.forEach(item => {
        // Each item is an object with client ID as key
        Object.keys(item).forEach(clientId => {
            const clientData = item[clientId];

            // Parse name field: "email||device||id"
            const nameParts = clientData.name ? clientData.name.split('||') : [];
            const email = nameParts[0] || '';
            const deviceName = nameParts[1] || 'Unknown Device';
            const deviceId = nameParts[2] || '';

            clients.push({
                id: clientId,
                email: email,
                deviceName: deviceName,
                deviceId: deviceId,
                name: deviceName, // Use device name as display name
                blocked_services: clientData.blocked_services || [],
                safe_search: clientData.safe_search || {},
                filtering_enabled: clientData.filtering_enabled || false,
                parental_enabled: clientData.parental_enabled || false,
                safesearch_enabled: clientData.safesearch_enabled || false,
                ids: clientData.ids || [],
                status: clientData.disallowed ? 'disabled' : 'active'
            });
        });
    });

    return clients;
}

/**
 * Get all available services with their current block status for a client
 * @param {Object} clientData - Client configuration object
 */
function getServicesWithStatus(clientData) {
    const blockedServices = clientData.blocked_services || [];
    const allServices = Object.keys(SERVICE_INFO);

    return allServices.map(serviceId => {
        const serviceInfo = SERVICE_INFO[serviceId];
        const isBlocked = blockedServices.includes(serviceId);

        return {
            id: serviceId,
            name: serviceInfo.name,
            icon: serviceInfo.icon,
            gradient: serviceInfo.gradient,
            category: serviceInfo.category,
            status: isBlocked ? 'blocked' : 'allowed',
            isBlocked: isBlocked
        };
    });
}

// ===================================
// Export Real API
// ===================================
window.RealFilterNetAPI = {
    Client: RealClientAPI,
    Utils: {
        transformClientData,
        getServicesWithStatus,
        SERVICE_INFO
    }
};

// ===================================
// Demo/Testing with Mock Data
// ===================================
// This section provides mock data based on your example for testing
// Remove or comment out in production

const USE_MOCK_REAL_API = true; // Set to false when backend is ready

if (USE_MOCK_REAL_API) {
    console.warn('⚠️ Running in MOCK REAL API MODE - Using example data');
    console.warn('Set USE_MOCK_REAL_API = false in real-api.js when backend is ready');

    // Mock data based on your example
    const MOCK_CLIENT_DATA = [
        {
            "yourznag-gmail-com-1": {
                "disallowed": false,
                "safe_search": {
                    "enabled": true,
                    "bing": true,
                    "duckduckgo": true,
                    "ecosia": true,
                    "google": true,
                    "pixabay": true,
                    "yandex": true,
                    "youtube": true
                },
                "blocked_services_schedule": {
                    "time_zone": "UTC"
                },
                "name": "yourznag@gmail.com||Naga_Home||45",
                "blocked_services": [
                    "amazon_streaming",
                    "apple_streaming",
                    "instagram",
                    "tiktok"
                ],
                "ids": [
                    "10.4.11.2",
                    "id-45",
                    "yourznag-gmail-com-1"
                ],
                "tags": [],
                "upstreams": [],
                "filtering_enabled": true,
                "parental_enabled": false,
                "safebrowsing_enabled": false,
                "safesearch_enabled": true,
                "use_global_blocked_services": false,
                "use_global_settings": false,
                "ignore_querylog": false,
                "ignore_statistics": false,
                "upstreams_cache_size": 0,
                "upstreams_cache_enabled": false
            }
        },
        {
            "yourznag-gmail-com-2": {
                "disallowed": false,
                "whois_info": {},
                "safe_search": null,
                "blocked_services_schedule": null,
                "name": "yourznag@gmail.com||iPhone||12",
                "blocked_services": [
                    "instagram",
                    "tiktok",
                    "youtube"
                ],
                "ids": [
                    "yourznag-gmail-com-2"
                ],
                "tags": null,
                "upstreams": null,
                "filtering_enabled": true,
                "parental_enabled": false,
                "safebrowsing_enabled": false,
                "safesearch_enabled": false,
                "use_global_blocked_services": false,
                "use_global_settings": false,
                "ignore_querylog": null,
                "ignore_statistics": null,
                "upstreams_cache_size": 0,
                "upstreams_cache_enabled": null
            }
        }
    ];

    // Override API with mock implementation
    window.RealFilterNetAPI.Client = {
        getAllClients: async () => {
            console.log('📡 Mock: Getting all clients');
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
            return transformClientData(MOCK_CLIENT_DATA);
        },

        getClient: async (clientId) => {
            console.log('📡 Mock: Getting client:', clientId);
            await new Promise(resolve => setTimeout(resolve, 300));

            // Find client in mock data
            for (const item of MOCK_CLIENT_DATA) {
                if (item[clientId]) {
                    return item[clientId];
                }
            }
            throw new Error('Client not found');
        },

        updateBlockedServices: async (clientId, blockedServices) => {
            console.log('📡 Mock: Updating blocked services for', clientId);
            console.log('   New blocked services:', blockedServices);
            await new Promise(resolve => setTimeout(resolve, 500));

            // In mock mode, just return success
            // In real mode, this would update the backend
            return {
                success: true,
                client_id: clientId,
                blocked_services: blockedServices
            };
        },

        toggleService: async (clientId, serviceId, shouldBlock) => {
            console.log('📡 Mock: Toggling service:', serviceId, 'to', shouldBlock ? 'blocked' : 'allowed');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Find and update in mock data (for demo persistence)
            for (const item of MOCK_CLIENT_DATA) {
                if (item[clientId]) {
                    const client = item[clientId];
                    const currentBlocked = client.blocked_services || [];

                    if (shouldBlock) {
                        if (!currentBlocked.includes(serviceId)) {
                            currentBlocked.push(serviceId);
                        }
                    } else {
                        const index = currentBlocked.indexOf(serviceId);
                        if (index > -1) {
                            currentBlocked.splice(index, 1);
                        }
                    }

                    client.blocked_services = currentBlocked;
                    break;
                }
            }

            return {
                success: true,
                client_id: clientId,
                service_id: serviceId,
                is_blocked: shouldBlock
            };
        },

        updateSafeSearch: async (clientId, safeSearchConfig) => {
            console.log('📡 Mock: Updating safe search for', clientId);
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                success: true,
                client_id: clientId,
                safe_search: safeSearchConfig
            };
        }
    };
}
