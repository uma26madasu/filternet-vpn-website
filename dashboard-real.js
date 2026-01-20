// ===================================
// Real Dashboard Integration
// This file manages the dashboard with real API data
// ===================================

// State management for real dashboard
const RealDashboardState = {
    currentUser: null,
    clients: [], // All client devices
    selectedClient: null, // Currently selected client for filtering
    services: [] // All available services with status
};

// ===================================
// Initialization
// ===================================
async function initializeRealDashboard() {
    // Check authentication
    if (!checkAuthentication()) {
        return;
    }

    try {
        showGlobalLoading();

        // Load user data from localStorage (set during Google OAuth)
        const userData = getUserData();
        RealDashboardState.currentUser = userData;

        // Update header with user info
        updateHeaderInfo(userData);

        // Load all clients
        await loadAllClients();

        // Select first client by default
        if (RealDashboardState.clients.length > 0) {
            selectClient(RealDashboardState.clients[0].id);
        }

        hideGlobalLoading();

        // Initialize section navigation
        initializeSectionNavigation();

    } catch (error) {
        console.error('Real dashboard initialization failed:', error);
        showError('Failed to load dashboard data. Please refresh the page.');
        hideGlobalLoading();
    }
}

// ===================================
// Data Loading Functions
// ===================================

async function loadAllClients() {
    try {
        const clients = await window.RealFilterNetAPI.Client.getAllClients();
        RealDashboardState.clients = clients;

        console.log('Loaded clients:', clients);

        // Update overview stats
        updateOverviewStats(clients);

        // Render family members (clients)
        renderFamilyMembersFromClients(clients);

        return clients;
    } catch (error) {
        console.error('Failed to load clients:', error);
        throw error;
    }
}

async function loadClientServices(clientId) {
    try {
        const client = await window.RealFilterNetAPI.Client.getClient(clientId);
        const services = window.RealFilterNetAPI.Utils.getServicesWithStatus(client);

        RealDashboardState.services = services;

        console.log('Loaded services for client:', clientId, services);

        return services;
    } catch (error) {
        console.error('Failed to load client services:', error);
        throw error;
    }
}

// ===================================
// UI Update Functions
// ===================================

function updateHeaderInfo(userData) {
    const userNameEl = document.querySelector('.user-name');
    if (userNameEl && userData && userData.name) {
        userNameEl.textContent = userData.name;
    }
}

function updateOverviewStats(clients) {
    // Total devices
    const totalDevices = clients.length;
    updateStatCard('devices', totalDevices);

    // Total family members (unique emails)
    const uniqueEmails = [...new Set(clients.map(c => c.email))];
    updateStatCard('family-members', uniqueEmails.length);

    // Total blocked services across all clients
    const totalBlocked = clients.reduce((sum, client) => {
        return sum + (client.blocked_services ? client.blocked_services.length : 0);
    }, 0);
    updateStatCard('blocked-sites', totalBlocked);

    // Active devices
    const activeDevices = clients.filter(c => c.status === 'active').length;
    updateStatCard('screen-time', `${activeDevices} Active`);
}

function renderFamilyMembersFromClients(clients) {
    const container = document.querySelector('.members-grid');
    if (!container) return;

    container.innerHTML = clients.map(client => {
        const statusClass = client.status === 'active' ? 'status-active' : 'status-safe';
        const statusText = client.status === 'active' ? 'Active' : 'Inactive';
        const blockedCount = client.blocked_services ? client.blocked_services.length : 0;

        return `
            <div class="member-card" data-client-id="${client.id}" onclick="selectClientCard('${client.id}')">
                <div class="member-avatar">📱</div>
                <div class="member-info">
                    <h3 class="member-name">${client.deviceName || client.name}</h3>
                    <div class="member-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        <span class="member-time">${blockedCount} services blocked</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===================================
// Content Filtering Functions
// ===================================

async function loadAndRenderContentFiltering() {
    const section = document.getElementById('content-filtering');
    if (!section) return;

    try {
        showSectionLoading('content-filtering');

        // Get selected client
        const clientId = RealDashboardState.selectedClient || RealDashboardState.clients[0]?.id;

        if (!clientId) {
            throw new Error('No client selected');
        }

        // Load services for this client
        const services = await loadClientServices(clientId);

        // Render services
        renderBlockedServicesUI(services, clientId);

        hideSectionLoading('content-filtering');

    } catch (error) {
        console.error('Failed to load content filtering:', error);
        showSectionError('content-filtering', 'Failed to load content filters');
    }
}

function renderBlockedServicesUI(services, clientId) {
    const appsTab = document.getElementById('apps-tab');
    if (!appsTab) return;

    // Group services by category
    const servicesByCategory = services.reduce((groups, service) => {
        const category = service.category || 'other';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(service);
        return groups;
    }, {});

    // Create HTML for all services
    const servicesHTML = Object.entries(servicesByCategory).map(([category, categoryServices]) => {
        const categoryNames = {
            'streaming': 'Streaming Services',
            'social': 'Social Media',
            'gaming': 'Gaming',
            'shopping': 'Shopping',
            'messaging': 'Messaging',
            'other': 'Other Services'
        };

        return `
            <div class="category-group">
                <h3 class="category-header">${categoryNames[category] || 'Other'}</h3>
                <div class="services-grid">
                    ${categoryServices.map(service => `
                        <div class="service-item ${service.isBlocked ? 'blocked' : 'allowed'}" data-service-id="${service.id}">
                            <div class="service-left">
                                <div class="app-icon-img" style="background: ${service.gradient};">${service.icon}</div>
                                <span class="app-name">${service.name}</span>
                            </div>
                            <label class="toggle-switch">
                                <input
                                    type="checkbox"
                                    ${service.isBlocked ? 'checked' : ''}
                                    data-service-id="${service.id}"
                                    data-client-id="${clientId}"
                                    onchange="handleServiceToggle(event)">
                                <span class="toggle-slider"></span>
                            </label>
                            <span class="service-status ${service.isBlocked ? 'blocked-text' : 'allowed-text'}">
                                ${service.isBlocked ? 'Blocked' : 'Allowed'}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    // Add client selector and services
    appsTab.innerHTML = `
        <div class="client-selector">
            <label for="client-select">Select Device:</label>
            <select id="client-select" onchange="handleClientChange(event)">
                ${RealDashboardState.clients.map(client => `
                    <option value="${client.id}" ${client.id === clientId ? 'selected' : ''}>
                        ${client.deviceName || client.name}
                    </option>
                `).join('')}
            </select>
        </div>

        <div class="filter-info">
            <p>Toggle services below to block or allow access on this device.</p>
        </div>

        ${servicesHTML}
    `;
}

// ===================================
// Event Handlers
// ===================================

async function handleServiceToggle(event) {
    const checkbox = event.target;
    const serviceId = checkbox.dataset.serviceId;
    const clientId = checkbox.dataset.clientId;
    const shouldBlock = checkbox.checked;

    // Show loading state
    const serviceItem = checkbox.closest('.service-item');
    const statusSpan = serviceItem.querySelector('.service-status');
    const originalStatus = statusSpan.textContent;
    statusSpan.textContent = 'Updating...';
    statusSpan.className = 'service-status updating';

    try {
        console.log('Toggling service:', serviceId, 'shouldBlock:', shouldBlock);

        // Update on backend
        await window.RealFilterNetAPI.Client.toggleService(clientId, serviceId, shouldBlock);

        // Update UI
        serviceItem.classList.toggle('blocked', shouldBlock);
        serviceItem.classList.toggle('allowed', !shouldBlock);
        statusSpan.textContent = shouldBlock ? 'Blocked' : 'Allowed';
        statusSpan.className = shouldBlock ? 'service-status blocked-text' : 'service-status allowed-text';

        // Show notification
        showNotification(`${window.RealFilterNetAPI.Utils.SERVICE_INFO[serviceId].name} ${shouldBlock ? 'blocked' : 'allowed'}`, 'success');

    } catch (error) {
        console.error('Failed to toggle service:', error);

        // Revert checkbox
        checkbox.checked = !shouldBlock;
        statusSpan.textContent = originalStatus;
        statusSpan.className = `service-status ${!shouldBlock ? 'blocked-text' : 'allowed-text'}`;

        showNotification('Failed to update service status', 'error');
    }
}

async function handleClientChange(event) {
    const clientId = event.target.value;
    selectClient(clientId);
    await loadAndRenderContentFiltering();
}

function selectClient(clientId) {
    RealDashboardState.selectedClient = clientId;
    console.log('Selected client:', clientId);
}

function selectClientCard(clientId) {
    selectClient(clientId);

    // Navigate to content filtering section
    const contentFilteringNav = document.querySelector('[data-section="content-filtering"]');
    if (contentFilteringNav) {
        contentFilteringNav.click();
    }
}

// Make function global for onclick
window.selectClientCard = selectClientCard;
window.handleServiceToggle = handleServiceToggle;
window.handleClientChange = handleClientChange;

// ===================================
// Section Navigation
// ===================================

function initializeSectionNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();

            const section = item.dataset.section;

            // Update active states
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.dashboard-section').forEach(sec => sec.classList.remove('active'));
            const sectionEl = document.getElementById(section);
            if (sectionEl) {
                sectionEl.classList.add('active');
            }

            // Load section-specific data
            if (section === 'content-filtering') {
                await loadAndRenderContentFiltering();
            } else if (section === 'overview') {
                await loadAllClients();
            }

            // Update URL hash
            window.location.hash = section;
        });
    });
}

// ===================================
// Helper Functions (reuse from dashboard-data.js)
// ===================================

function updateStatCard(type, value) {
    const selectors = {
        'family-members': '.stats-grid .stat-card:nth-child(1) .stat-value',
        'devices': '.stats-grid .stat-card:nth-child(2) .stat-value',
        'blocked-sites': '.stats-grid .stat-card:nth-child(3) .stat-value',
        'screen-time': '.stats-grid .stat-card:nth-child(4) .stat-value'
    };

    const element = document.querySelector(selectors[type]);
    if (element) {
        element.textContent = value;
    }
}

function showGlobalLoading() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'global-loading';
    loadingOverlay.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(255,255,255,0.9); display: flex;
                    align-items: center; justify-content: center; z-index: 9999;">
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🛡️</div>
                <div style="font-size: 1.2rem; font-weight: 600; color: #667eea;">Loading Dashboard...</div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
}

function hideGlobalLoading() {
    const loading = document.getElementById('global-loading');
    if (loading) {
        loading.remove();
    }
}

function showSectionLoading(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const loading = section.querySelector('.section-loading');
    if (loading) return; // Already showing

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'section-loading';
    loadingDiv.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
            <div style="color: #6c757d;">Loading data...</div>
        </div>
    `;
    section.appendChild(loadingDiv);
}

function hideSectionLoading(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const loading = section.querySelector('.section-loading');
    if (loading) {
        loading.remove();
    }
}

function showSectionError(sectionId, message) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    hideSectionLoading(sectionId);

    const error = document.createElement('div');
    error.className = 'section-error';
    error.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
            <div style="color: #dc3545; font-weight: 600; margin-bottom: 0.5rem;">${message}</div>
            <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        </div>
    `;
    section.appendChild(error);
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'success') {
    let notificationContainer = document.querySelector('.notification-container');

    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(notificationContainer);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        background: ${type === 'error' ? '#dc3545' : '#28a745'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideIn 0.3s ease;
        min-width: 250px;
    `;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'error' ? '❌' : '✓'}</span>
        <span class="notification-message">${message}</span>
    `;

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .service-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        background: white;
        border: 2px solid #e9ecef;
        border-radius: 12px;
        margin-bottom: 0.75rem;
        transition: all 0.3s ease;
    }

    .service-item.blocked {
        border-color: #dc3545;
        background: #fff5f5;
    }

    .service-item.allowed {
        border-color: #28a745;
        background: #f0fff4;
    }

    .service-left {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .service-status {
        font-size: 0.85rem;
        font-weight: 600;
        min-width: 80px;
        text-align: right;
    }

    .service-status.blocked-text {
        color: #dc3545;
    }

    .service-status.allowed-text {
        color: #28a745;
    }

    .service-status.updating {
        color: #6c757d;
        font-style: italic;
    }

    .category-group {
        margin-bottom: 2rem;
    }

    .category-header {
        font-size: 1.1rem;
        font-weight: 700;
        color: #495057;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e9ecef;
    }

    .services-grid {
        display: flex;
        flex-direction: column;
    }

    .client-selector {
        background: white;
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .client-selector label {
        font-weight: 600;
        margin-right: 1rem;
        color: #495057;
    }

    .client-selector select {
        padding: 0.5rem 1rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        min-width: 200px;
        cursor: pointer;
    }

    .filter-info {
        background: #e7f3ff;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        border-left: 4px solid #667eea;
    }

    .filter-info p {
        margin: 0;
        color: #495057;
    }

    .member-card {
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .member-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.2);
    }
`;
document.head.appendChild(style);

// ===================================
// Initialize on page load
// ===================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRealDashboard);
} else {
    initializeRealDashboard();
}

// Export for global access
window.RealDashboard = {
    init: initializeRealDashboard,
    loadClients: loadAllClients,
    loadContentFiltering: loadAndRenderContentFiltering,
    state: RealDashboardState
};
