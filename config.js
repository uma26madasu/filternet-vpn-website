// ===================================
// FilterNet VPN Configuration
// ===================================

const CONFIG = {
    // GOOGLE OAUTH CONFIGURATION
    // Get your Client ID from: https://console.cloud.google.com/apis/credentials
    google: {
        clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
        // Example: '123456789-abcdefgh.apps.googleusercontent.com'
    },

    // BACKEND API URL
    api: {
        baseURL: 'https://api.filternet-vpn.com/v1',
        // For local development: 'http://localhost:3000/api/v1'
    },

    // DEMO MODE
    // Set to true to bypass authentication for testing
    // Set to false for production
    demoMode: false,

    // APP SETTINGS
    app: {
        name: 'FilterNet VPN',
        version: '1.0.0'
    }
};

// Make config available globally
window.FilterNetConfig = CONFIG;

// Log configuration status
if (CONFIG.demoMode) {
    console.warn('⚠️ Running in DEMO MODE');
    console.warn('Set CONFIG.demoMode = false in config.js for production');
}

if (CONFIG.google.clientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
    console.warn('⚠️ Google Client ID not configured');
    console.warn('Update CONFIG.google.clientId in config.js');
    console.warn('Get your Client ID from: https://console.cloud.google.com/apis/credentials');
}
