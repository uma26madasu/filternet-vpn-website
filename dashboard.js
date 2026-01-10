// ===================================
// Initialize Dashboard on Load
// ===================================
window.addEventListener('load', async () => {
    await window.DashboardData.init();
    setupNavigation();
});

// ===================================
// Dashboard Navigation
// ===================================
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.dashboard-section');

    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();

            // Get the target section
            const targetSection = item.dataset.section;

            // Remove active class from all nav items and sections
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));

            // Add active class to clicked nav item
            item.classList.add('active');

            // Show the target section
            const section = document.getElementById(targetSection);
            if (section) {
                section.classList.add('active');
            }

            // Load data for specific sections
            await loadSectionData(targetSection);

            // Update URL hash
            window.location.hash = targetSection;
        });
    });
}

// Load data when switching sections
async function loadSectionData(sectionId) {
    const state = window.DashboardData.state;
    const memberId = state.selectedMember || state.familyMembers[0]?.id;

    if (!memberId) return;

    switch (sectionId) {
        case 'time-limits':
            await window.DashboardData.loadTimeLimits(memberId);
            break;
        case 'content-filtering':
            await window.DashboardData.loadContentFilters(memberId);
            break;
        case 'online-activity':
            await window.DashboardData.loadActivity(memberId);
            break;
        case 'bedtime':
            await window.DashboardData.loadBedtimeSchedules(memberId);
            break;
    }
}

// ===================================
// Content Filtering Tabs
// ===================================
const filterTabs = document.querySelectorAll('.filter-tab');
const tabContents = document.querySelectorAll('.tab-content');

filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and content
        filterTabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked tab
        tab.classList.add('active');

        // Show corresponding content
        const tabName = tab.dataset.tab;
        const content = document.getElementById(`${tabName}-tab`);
        if (content) {
            content.classList.add('active');
        }
    });
});

// ===================================
// Activity Toggle
// ===================================
const activityToggles = document.querySelectorAll('.activity-toggle .toggle-btn');

activityToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
        activityToggles.forEach(t => t.classList.remove('active'));
        toggle.classList.add('active');

        // Here you would typically load different data based on the toggle
        console.log('Activity view changed to:', toggle.textContent);
    });
});

// ===================================
// Profile Selector
// ===================================
const profileButtons = document.querySelectorAll('.profile-btn');

profileButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        profileButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Here you would typically load different filtering rules based on profile
        console.log('Profile changed to:', btn.textContent);
    });
});

// ===================================
// Logout Handler
// ===================================
const logoutBtn = document.querySelector('.header-right .btn-outline');
if (logoutBtn && logoutBtn.textContent.includes('Logout')) {
    logoutBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to logout?')) {
            await window.FilterNetAPI.Auth.logout();
        }
    });
}

// ===================================
// Date Navigation
// ===================================
const dateBtns = document.querySelectorAll('.date-btn');
const currentDateElement = document.querySelector('.current-date');

dateBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        // Simple date navigation simulation
        if (index === 0) {
            console.log('Navigate to previous day');
            // Here you would load data for the previous day
        } else {
            console.log('Navigate to next day');
            // Here you would load data for the next day
        }
    });
});


// ===================================
// Search Functionality
// ===================================
const searchInput = document.querySelector('.search-input');

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const appItems = document.querySelectorAll('.app-item');

        appItems.forEach(item => {
            const appName = item.querySelector('.app-name').textContent.toLowerCase();
            if (appName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}


// ===================================
// Console Welcome Message
// ===================================
console.log('%c🛡️ FilterNet VPN Dashboard', 'color: #667eea; font-size: 24px; font-weight: bold;');
console.log('%cParental Control Dashboard Loaded', 'color: #764ba2; font-size: 14px;');

// ===================================
// Auto-refresh Activity Data
// ===================================
// In production, this would fetch real-time data from your backend
function refreshActivityData() {
    const updatedTime = document.querySelector('.updated-time');
    if (updatedTime) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        updatedTime.textContent = `Updated today at ${timeString}`;
    }
}

// Refresh every 5 minutes
setInterval(refreshActivityData, 300000);
