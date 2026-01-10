// ===================================
// Google OAuth Authentication
// ===================================

let googleAuth = null;

// Initialize Google Sign-In
function initGoogleAuth() {
    // Check if running in demo mode
    if (window.FilterNetConfig && window.FilterNetConfig.demoMode) {
        console.log('Demo mode enabled - Using mock authentication');
        return;
    }

    // Check if Google Client ID is configured
    const clientId = window.FilterNetConfig?.google?.clientId;
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
        console.error('Google Client ID not configured!');
        console.error('Please update config.js with your Google Client ID');
        console.error('Get it from: https://console.cloud.google.com/apis/credentials');
        return;
    }

    // Initialize Google Identity Services
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        console.log('✅ Google Sign-In initialized');
    } else {
        console.error('Google Sign-In SDK not loaded');
    }
}

// Handle Google Sign-In callback
async function handleGoogleSignIn(response) {
    try {
        console.log('Google Sign-In successful');

        const credential = response.credential;
        const userInfo = parseJwt(credential);

        console.log('User Info:', {
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture
        });

        // Store user data
        const userData = {
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            id: userInfo.sub
        };

        localStorage.setItem('filternet_user_data', JSON.stringify(userData));

        // Send credential to your backend for verification
        const backendURL = window.FilterNetConfig?.api?.baseURL;

        if (backendURL && backendURL !== 'https://api.filternet-vpn.com/v1') {
            try {
                const response = await fetch(`${backendURL}/auth/google`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ credential })
                });

                if (response.ok) {
                    const data = await response.json();

                    // Store JWT token from backend
                    localStorage.setItem('filternet_auth_token', data.access_token || data.token);

                    console.log('✅ Backend authentication successful');
                } else {
                    console.error('Backend authentication failed:', response.status);
                    showAuthError('Authentication failed. Please try again.');
                    return;
                }
            } catch (error) {
                console.error('Backend authentication error:', error);
                // For now, continue with client-side token
                console.warn('Using client-side authentication');
                localStorage.setItem('filternet_auth_token', credential);
            }
        } else {
            // No backend configured - use Google credential as token
            console.warn('No backend configured - using Google credential');
            localStorage.setItem('filternet_auth_token', credential);
        }

        // Show success message
        showAuthSuccess();

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        console.error('Authentication error:', error);
        showAuthError('Authentication failed. Please try again.');
    }
}

// Parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error parsing JWT:', error);
        return null;
    }
}

// Demo mode authentication (bypass Google)
function demoModeLogin() {
    console.log('🎭 Demo mode login');

    // Create mock user data
    const mockUser = {
        email: 'demo@filternet.com',
        name: 'Demo User',
        picture: '',
        id: 'demo_user_123'
    };

    // Store mock data
    localStorage.setItem('filternet_user_data', JSON.stringify(mockUser));
    localStorage.setItem('filternet_auth_token', 'demo_token_' + Date.now());

    // Show success and redirect
    showAuthSuccess();

    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 800);
}

// Trigger Google Sign-In popup
function triggerGoogleSignIn() {
    // Check for demo mode
    if (window.FilterNetConfig && window.FilterNetConfig.demoMode) {
        demoModeLogin();
        return;
    }

    // Check if Google is initialized
    if (typeof google === 'undefined' || !google.accounts) {
        console.error('Google Sign-In not initialized');
        showAuthError('Google Sign-In not available. Please refresh the page.');
        return;
    }

    // Check if Client ID is configured
    const clientId = window.FilterNetConfig?.google?.clientId;
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
        console.error('Google Client ID not configured');
        alert('Google Sign-In is not configured.\n\nPlease update config.js with your Google Client ID.\nGet it from: https://console.cloud.google.com/apis/credentials\n\nFor now, demo mode is enabled.');
        demoModeLogin();
        return;
    }

    // Trigger the prompt
    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Sign-in prompt was not displayed or skipped');

            // Fallback: Show custom modal (the one already in HTML)
            document.getElementById('loginModal').style.display = 'block';
        }
    });
}

// Show authentication success
function showAuthSuccess() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 2rem 0;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
                    <h3 style="color: #10b981; margin-bottom: 0.5rem;">Authentication Successful!</h3>
                    <p style="color: #6c757d;">Redirecting to dashboard...</p>
                </div>
            `;
        }
    }
}

// Show authentication error
function showAuthError(message) {
    const modal = document.getElementById('loginModal');
    if (modal) {
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 2rem 0;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">❌</div>
                    <h3 style="color: #ef4444; margin-bottom: 0.5rem;">Authentication Failed</h3>
                    <p style="color: #6c757d; margin-bottom: 1.5rem;">${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
                </div>
            `;
        }
    }
}

// Initialize on page load
window.addEventListener('load', () => {
    // Wait for Google SDK to load
    setTimeout(() => {
        initGoogleAuth();
    }, 500);
});

// Export functions
window.GoogleAuth = {
    init: initGoogleAuth,
    signIn: triggerGoogleSignIn,
    demoLogin: demoModeLogin
};
