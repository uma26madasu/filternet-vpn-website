// ===================================
// Dashboard Data Management
// ===================================

// State management
const DashboardState = {
    currentUser: null,
    familyMembers: [],
    devices: [],
    selectedMember: null,
    currentDate: new Date()
};

// ===================================
// Initialization
// ===================================
async function initializeDashboard() {
    // Check authentication
    if (!checkAuthentication()) {
        return;
    }

    try {
        showGlobalLoading();

        // Load initial data
        await Promise.all([
            loadCurrentUser(),
            loadFamilyMembers(),
            loadDevices(),
            loadOverviewData()
        ]);

        hideGlobalLoading();

        // Initialize first section
        const hash = window.location.hash.substring(1) || 'overview';
        const navItem = document.querySelector(`[data-section="${hash}"]`);
        if (navItem) {
            navItem.click();
        }
    } catch (error) {
        console.error('Dashboard initialization failed:', error);
        showError('Failed to load dashboard data. Please refresh the page.');
        hideGlobalLoading();
    }
}

// ===================================
// Data Loading Functions
// ===================================

async function loadCurrentUser() {
    try {
        const user = await window.FilterNetAPI.Auth.getCurrentUser();
        DashboardState.currentUser = user;

        // Update UI
        const userNameEl = document.querySelector('.user-name');
        if (userNameEl && user.name) {
            userNameEl.textContent = user.name;
        }

        return user;
    } catch (error) {
        console.error('Failed to load user:', error);
        throw error;
    }
}

async function loadFamilyMembers() {
    try {
        const members = await window.FilterNetAPI.Family.getAllMembers();
        DashboardState.familyMembers = members;
        return members;
    } catch (error) {
        console.error('Failed to load family members:', error);
        throw error;
    }
}

async function loadDevices() {
    try {
        const devices = await window.FilterNetAPI.Device.getAllDevices();
        DashboardState.devices = devices;
        return devices;
    } catch (error) {
        console.error('Failed to load devices:', error);
        throw error;
    }
}

async function loadOverviewData() {
    try {
        const overview = await window.FilterNetAPI.Dashboard.getOverview();

        // Update stats
        updateStatCard('family-members', overview.totalMembers);
        updateStatCard('devices', overview.totalDevices);
        updateStatCard('blocked-sites', overview.sitesBlockedToday);
        updateStatCard('screen-time', overview.totalScreenTime);

        // Render family members overview
        renderFamilyMembersOverview();

        return overview;
    } catch (error) {
        console.error('Failed to load overview:', error);
        throw error;
    }
}

async function loadTimeLimits(memberId) {
    try {
        showSectionLoading('time-limits');

        const [limits, usage] = await Promise.all([
            window.FilterNetAPI.TimeLimit.getLimits(memberId),
            window.FilterNetAPI.TimeLimit.getCurrentUsage(memberId)
        ]);

        renderTimeLimits(limits);
        hideSectionLoading('time-limits');

        return { limits, usage };
    } catch (error) {
        console.error('Failed to load time limits:', error);
        showSectionError('time-limits', 'Failed to load time limits');
    }
}

async function loadContentFilters(memberId) {
    try {
        showSectionLoading('content-filtering');

        const [apps, categories] = await Promise.all([
            window.FilterNetAPI.ContentFilter.getAvailableApps(),
            window.FilterNetAPI.ContentFilter.getCategories()
        ]);

        renderApps(apps);
        renderCategories(categories);
        hideSectionLoading('content-filtering');

        return { apps, categories };
    } catch (error) {
        console.error('Failed to load content filters:', error);
        showSectionError('content-filtering', 'Failed to load content filters');
    }
}

async function loadActivity(memberId, date = null) {
    try {
        showSectionLoading('online-activity');

        const activity = await window.FilterNetAPI.Activity.getActivity(memberId, date);

        renderActivity(activity);
        hideSectionLoading('online-activity');

        return activity;
    } catch (error) {
        console.error('Failed to load activity:', error);
        showSectionError('online-activity', 'Failed to load activity data');
    }
}

async function loadBedtimeSchedules(memberId) {
    try {
        showSectionLoading('bedtime');

        const schedules = await window.FilterNetAPI.Bedtime.getSchedules(memberId);

        renderBedtimeSchedules(schedules);
        hideSectionLoading('bedtime');

        return schedules;
    } catch (error) {
        console.error('Failed to load bedtime schedules:', error);
        showSectionError('bedtime', 'Failed to load bedtime schedules');
    }
}

// ===================================
// Rendering Functions
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

function renderFamilyMembersOverview() {
    const container = document.querySelector('.members-grid');
    if (!container) return;

    container.innerHTML = DashboardState.familyMembers.map(member => {
        const memberDevices = DashboardState.devices.filter(d => d.memberId === member.id);
        const deviceText = memberDevices.length > 0 ? memberDevices[0].name : 'No device';
        const timeText = member.profile === 'adult' ? 'No limits' : 'Limited access';
        const statusClass = member.profile === 'adult' ? 'status-active' : 'status-safe';
        const statusText = member.profile === 'adult' ? 'Active' : 'Safe';

        return `
            <div class="member-card">
                <div class="member-avatar">${member.avatar}</div>
                <div class="member-info">
                    <h3 class="member-name">${member.name}'s Device</h3>
                    <div class="member-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        <span class="member-time">${timeText}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderTimeLimits(limits) {
    const container = document.querySelector('.limits-list');
    if (!container) return;

    if (limits.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = limits.map(limit => {
        const percentage = (limit.used / limit.limit) * 100;
        const isExceeded = limit.used >= limit.limit;
        const remaining = Math.max(0, limit.limit - limit.used);

        return `
            <div class="limit-item">
                <div class="limit-left">
                    <span class="app-icon">${limit.icon}</span>
                    <div class="limit-details">
                        <h4>${limit.app}</h4>
                        <p class="limit-time">${limit.limit} minutes per day</p>
                    </div>
                </div>
                <div class="limit-right">
                    <div class="progress-bar">
                        <div class="progress-fill ${isExceeded ? 'exceeded' : ''}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <span class="time-remaining ${isExceeded ? 'exceeded' : ''}">
                        ${isExceeded ? 'Limit reached' : `${remaining} min left`}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function renderApps(apps) {
    const container = document.querySelector('.apps-list');
    if (!container) return;

    container.innerHTML = apps.map(app => `
        <div class="app-item" data-app-id="${app.id}">
            <div class="app-left">
                <div class="app-icon-img" style="background: ${app.gradient};">${app.icon}</div>
                <span class="app-name">${app.name}</span>
            </div>
            <select class="app-status ${app.status}" data-app-id="${app.id}">
                <option value="blocked" ${app.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                <option value="allowed" ${app.status === 'allowed' ? 'selected' : ''}>Allowed</option>
                <option value="limited" ${app.status === 'limited' ? 'selected' : ''}>Time Limited</option>
            </select>
        </div>
    `).join('');

    // Add event listeners
    attachAppStatusListeners();
}

function renderCategories(categories) {
    const container = document.querySelector('.categories-list');
    if (!container) return;

    container.innerHTML = categories.map(cat => `
        <div class="category-item" data-category-id="${cat.id}">
            <div class="category-left">
                <span class="category-icon">${cat.icon}</span>
                <div class="category-info">
                    <h4>${cat.name}</h4>
                    <p>${cat.description}</p>
                </div>
            </div>
            <label class="toggle-switch">
                <input type="checkbox" ${cat.isBlocked ? 'checked' : ''} data-category-id="${cat.id}">
                <span class="toggle-slider"></span>
            </label>
        </div>
    `).join('');

    // Add event listeners
    attachCategoryListeners();
}

function renderActivity(activityData) {
    const container = document.querySelector('.activity-content');
    if (!container) return;

    if (!activityData.hasActivity || activityData.activities.length === 0) {
        container.innerHTML = `
            <div class="activity-card">
                <div class="activity-icon-large">📱</div>
                <h3>No online activity</h3>
                <p class="activity-note">(Device may be using offline apps)</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="activity-list">
            ${activityData.activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-app">
                        <div class="app-icon-img" style="background: ${activity.gradient};">${activity.icon}</div>
                        <div class="activity-details">
                            <h4>${activity.app}</h4>
                            <p class="activity-time">${activity.startTime} - ${activity.endTime}</p>
                        </div>
                    </div>
                    <div class="activity-duration">${activity.duration}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderBedtimeSchedules(schedules) {
    const container = document.querySelector('.bedtime-schedules');
    if (!container) return;

    const schedulesHTML = schedules.map(schedule => `
        <div class="schedule-card" data-schedule-id="${schedule.id}">
            <div class="schedule-header">
                <div class="schedule-days">${schedule.days.join(', ')}</div>
                <label class="toggle-switch">
                    <input type="checkbox" ${schedule.isActive ? 'checked' : ''} data-schedule-id="${schedule.id}">
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <div class="schedule-time">${schedule.startTime} - ${schedule.endTime}</div>
            <button class="btn-text" data-schedule-id="${schedule.id}">Edit schedule</button>
        </div>
    `).join('');

    const addButton = `
        <button class="add-schedule-btn">
            <span class="add-icon">+</span>
            <span>Add Schedule</span>
        </button>
    `;

    container.innerHTML = schedulesHTML + addButton;

    // Add event listeners
    attachBedtimeListeners();
}

// ===================================
// Event Listeners for Data Actions
// ===================================

function attachAppStatusListeners() {
    const selects = document.querySelectorAll('.app-status');
    selects.forEach(select => {
        select.addEventListener('change', async (e) => {
            const appId = e.target.dataset.appId;
            const newStatus = e.target.value;

            try {
                // Update visual state immediately
                e.target.classList.remove('blocked', 'allowed', 'limited');
                e.target.classList.add(newStatus);

                // Save to backend
                const memberId = DashboardState.selectedMember || DashboardState.familyMembers[0]?.id;
                await window.FilterNetAPI.ContentFilter.updateAppStatus(memberId, appId, newStatus);

                showNotification(`App status updated to ${newStatus}`);
            } catch (error) {
                console.error('Failed to update app status:', error);
                showNotification('Failed to update app status', 'error');
                // Revert change
                await loadContentFilters(DashboardState.selectedMember);
            }
        });
    });
}

function attachCategoryListeners() {
    const toggles = document.querySelectorAll('.category-item input[type="checkbox"]');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', async (e) => {
            const categoryId = e.target.dataset.categoryId;
            const isBlocked = e.target.checked;

            try {
                const memberId = DashboardState.selectedMember || DashboardState.familyMembers[0]?.id;
                await window.FilterNetAPI.ContentFilter.updateCategoryStatus(memberId, categoryId, isBlocked);

                showNotification(`Category ${isBlocked ? 'blocked' : 'allowed'}`);
            } catch (error) {
                console.error('Failed to update category:', error);
                showNotification('Failed to update category', 'error');
                e.target.checked = !e.target.checked; // Revert
            }
        });
    });
}

function attachBedtimeListeners() {
    const toggles = document.querySelectorAll('.schedule-card input[type="checkbox"]');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', async (e) => {
            const scheduleId = e.target.dataset.scheduleId;
            const isActive = e.target.checked;

            try {
                await window.FilterNetAPI.Bedtime.toggleSchedule(scheduleId, isActive);
                showNotification(`Bedtime schedule ${isActive ? 'activated' : 'deactivated'}`);
            } catch (error) {
                console.error('Failed to toggle schedule:', error);
                showNotification('Failed to update schedule', 'error');
                e.target.checked = !e.target.checked; // Revert
            }
        });
    });
}

// ===================================
// Loading & Error States
// ===================================

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

    const loading = document.createElement('div');
    loading.className = 'section-loading';
    loading.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
            <div style="color: #6c757d;">Loading data...</div>
        </div>
    `;
    section.appendChild(loading);
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
        document.body.appendChild(notificationContainer);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'error' ? '❌' : '✓'}</span>
        <span class="notification-message">${message}</span>
    `;

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===================================
// Export functions
// ===================================
window.DashboardData = {
    init: initializeDashboard,
    loadTimeLimits,
    loadContentFilters,
    loadActivity,
    loadBedtimeSchedules,
    state: DashboardState
};
