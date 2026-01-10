// ===================================
// Dashboard Navigation
// ===================================
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.dashboard-section');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
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

        // Update URL hash
        window.location.hash = targetSection;
    });
});

// Load section based on URL hash on page load
window.addEventListener('load', () => {
    const hash = window.location.hash.substring(1);
    if (hash) {
        const navItem = document.querySelector(`[data-section="${hash}"]`);
        if (navItem) {
            navItem.click();
        }
    }
});

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
// App Status Change
// ===================================
const appStatusSelects = document.querySelectorAll('.app-status');

appStatusSelects.forEach(select => {
    select.addEventListener('change', (e) => {
        const appName = e.target.closest('.app-item').querySelector('.app-name').textContent;
        const newStatus = e.target.value;

        // Update visual state
        select.classList.remove('blocked', 'allowed', 'limited');
        select.classList.add(newStatus);

        console.log(`${appName} status changed to: ${newStatus}`);

        // Here you would typically save this to your backend
        showNotification(`${appName} is now ${newStatus}`);
    });
});

// ===================================
// Toggle Switches
// ===================================
const toggleSwitches = document.querySelectorAll('.toggle-switch input[type="checkbox"]');

toggleSwitches.forEach(toggle => {
    toggle.addEventListener('change', (e) => {
        const categoryItem = e.target.closest('.category-item');
        const scheduleCard = e.target.closest('.schedule-card');

        if (categoryItem) {
            const categoryName = categoryItem.querySelector('h4').textContent;
            const isBlocked = e.target.checked;
            console.log(`${categoryName} blocking: ${isBlocked ? 'ON' : 'OFF'}`);
            showNotification(`${categoryName} ${isBlocked ? 'blocked' : 'allowed'}`);
        }

        if (scheduleCard) {
            const isActive = e.target.checked;
            console.log(`Bedtime schedule: ${isActive ? 'ON' : 'OFF'}`);
            showNotification(`Bedtime schedule ${isActive ? 'activated' : 'deactivated'}`);
        }
    });
});

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
// Add Buttons
// ===================================
const addButtons = document.querySelectorAll('.btn-primary, .add-schedule-btn, .add-member-btn');

addButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const buttonText = btn.textContent.trim();
        console.log(`Clicked: ${buttonText}`);

        // Show appropriate modal or form based on button
        if (buttonText.includes('Daily Limit')) {
            showNotification('Opening daily limit settings...');
        } else if (buttonText.includes('Individual Limits')) {
            showNotification('Opening individual limits settings...');
        } else if (buttonText.includes('Website')) {
            showNotification('Opening website blocking settings...');
        } else if (buttonText.includes('Schedule')) {
            showNotification('Opening schedule editor...');
        } else if (buttonText.includes('Family Member')) {
            showNotification('Opening add family member form...');
        }

        // In production, this would open a modal or navigate to a form
    });
});

// ===================================
// Manage Buttons
// ===================================
const manageButtons = document.querySelectorAll('.family-member-card .btn');

manageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const memberName = btn.closest('.family-member-card').querySelector('h3').textContent;
        showNotification(`Opening settings for ${memberName}...`);
        // In production, this would navigate to member-specific settings
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
// Notification System
// ===================================
function showNotification(message) {
    // Check if notification container exists, if not create it
    let notificationContainer = document.querySelector('.notification-container');

    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 100px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .notification {
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                animation: slideIn 0.3s ease;
                max-width: 350px;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .notification-icon {
                font-size: 1.5rem;
            }

            .notification-message {
                flex: 1;
                color: #343a40;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <span class="notification-icon">✓</span>
        <span class="notification-message">${message}</span>
    `;

    notificationContainer.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
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
