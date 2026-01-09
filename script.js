// ===================================
// Mobile Menu Toggle
// ===================================
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// ===================================
// Smooth Scrolling for Navigation Links
// ===================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navbarHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                }
            }
        }
    });
});

// ===================================
// Navbar Background on Scroll
// ===================================
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add shadow when scrolling
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
    }

    lastScroll = currentScroll;
});

// ===================================
// Intersection Observer for Animations
// ===================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards, pricing cards, and controls content
const animatedElements = document.querySelectorAll(
    '.feature-card, .pricing-card, .controls-content'
);

animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===================================
// Pricing Card Interaction
// ===================================
const pricingCards = document.querySelectorAll('.pricing-card');

pricingCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.zIndex = '10';
    });

    card.addEventListener('mouseleave', () => {
        card.style.zIndex = '1';
    });
});

// ===================================
// CTA Button Click Handlers
// ===================================
const ctaButtons = document.querySelectorAll('.btn-primary, .btn-white');

ctaButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        // Prevent default for demo purposes
        // In production, this would link to your signup/trial page
        if (!button.closest('a')) {
            console.log('CTA Button clicked:', button.textContent);

            // Add a visual feedback
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.6)';
            ripple.style.width = ripple.style.height = '100px';
            ripple.style.left = e.offsetX - 50 + 'px';
            ripple.style.top = e.offsetY - 50 + 'px';
            ripple.style.animation = 'ripple 0.6s ease-out';
            ripple.style.pointerEvents = 'none';

            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        }
    });
});

// Add ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===================================
// Dynamic Statistics Counter
// ===================================
const stats = document.querySelectorAll('.stat-number');
let statsAnimated = false;

const animateStats = () => {
    stats.forEach(stat => {
        const target = stat.textContent;
        const isPercentage = target.includes('%');
        const isMillion = target.includes('M');
        const isPlus = target.includes('+');

        let numericTarget = parseFloat(target);
        let current = 0;
        const increment = numericTarget / 50;
        const duration = 2000;
        const stepTime = duration / 50;

        const counter = setInterval(() => {
            current += increment;
            if (current >= numericTarget) {
                current = numericTarget;
                clearInterval(counter);
            }

            let displayValue = current.toFixed(1);
            if (isMillion) {
                displayValue += 'M';
            }
            if (isPlus) {
                displayValue += '+';
            }
            if (isPercentage) {
                displayValue += '%';
            }

            stat.textContent = displayValue;
        }, stepTime);
    });
};

// Trigger stats animation when hero section is visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !statsAnimated) {
            animateStats();
            statsAnimated = true;
        }
    });
}, { threshold: 0.5 });

const heroSection = document.querySelector('.hero');
if (heroSection) {
    heroObserver.observe(heroSection);
}

// ===================================
// Form Validation (if you add forms later)
// ===================================
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// ===================================
// Dark Mode Toggle (Optional Enhancement)
// ===================================
const initDarkMode = () => {
    const darkModeToggle = document.createElement('button');
    darkModeToggle.textContent = '🌙';
    darkModeToggle.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transition: transform 0.3s;
    `;

    darkModeToggle.addEventListener('mouseenter', () => {
        darkModeToggle.style.transform = 'scale(1.1)';
    });

    darkModeToggle.addEventListener('mouseleave', () => {
        darkModeToggle.style.transform = 'scale(1)';
    });

    // Uncomment to enable dark mode toggle
    // document.body.appendChild(darkModeToggle);
};

// Initialize dark mode toggle
// initDarkMode();

// ===================================
// Console Welcome Message
// ===================================
console.log('%c🛡️ FilterNet VPN', 'color: #667eea; font-size: 24px; font-weight: bold;');
console.log('%cProtecting families online since 2026', 'color: #764ba2; font-size: 14px;');
console.log('%cWebsite loaded successfully!', 'color: #43e97b; font-size: 12px;');

// ===================================
// Performance Monitoring
// ===================================
window.addEventListener('load', () => {
    const loadTime = window.performance.timing.domContentLoadedEventEnd -
                     window.performance.timing.navigationStart;
    console.log(`Page loaded in ${loadTime}ms`);
});

// ===================================
// Modal Functionality
// ===================================
const loginModal = document.getElementById('loginModal');
const comingSoonModal = document.getElementById('comingSoonModal');
const navGetStartedBtn = document.querySelector('.navbar .btn-primary');
const heroTrialBtn = document.getElementById('heroTrialBtn');
const startTrialBtn = document.getElementById('startTrialBtn');
const allGetStartedButtons = document.querySelectorAll('.btn-outline');

// Get all close buttons
const closeButtons = document.querySelectorAll('.modal-close');

// Function to open modal
function openModal(modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Function to close modal
function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Nav Get Started button - open login modal
if (navGetStartedBtn) {
    navGetStartedBtn.addEventListener('click', () => {
        openModal(loginModal);
    });
}

// Hero Start Free Trial button - open coming soon modal
if (heroTrialBtn) {
    heroTrialBtn.addEventListener('click', () => {
        openModal(comingSoonModal);
    });
}

// CTA Start Free Trial button - open coming soon modal
if (startTrialBtn) {
    startTrialBtn.addEventListener('click', () => {
        openModal(comingSoonModal);
    });
}

// All "Get Started" buttons in pricing cards - open login modal
allGetStartedButtons.forEach(button => {
    button.addEventListener('click', () => {
        openModal(loginModal);
    });
});

// Close button functionality
closeButtons.forEach(button => {
    button.addEventListener('click', function() {
        const modal = this.closest('.modal');
        closeModal(modal);
    });
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target);
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (loginModal.style.display === 'block') {
            closeModal(loginModal);
        }
        if (comingSoonModal.style.display === 'block') {
            closeModal(comingSoonModal);
        }
    }
});

// Google Sign-In button (placeholder - would integrate with actual Google OAuth)
const googleSignInBtn = document.querySelector('.btn-google');
if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', () => {
        console.log('Google Sign-In clicked - Integration needed');
        // In production, this would trigger Google OAuth flow
        alert('Google Sign-In integration coming soon!');
    });
}
