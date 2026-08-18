// public/js/main.js

function initAllAnimations() {
    // Register GSAP ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Initialize animations
    initHeroAnimations();
    initPortfolioScroll();
    initStepAnimations();

    // Refresh ScrollTrigger to ensure all layout calculations are accurate
    ScrollTrigger.refresh();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // If the page is already loaded, run animations immediately
    initAllAnimations();
} else {
    // Otherwise, wait for window load event
    window.addEventListener('load', initAllAnimations);
}

// Mobile GNB Menu Toggle Listener
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.getElementById("home-mobile-menu-toggle");
    const mobileMenu = document.querySelector("nav .nav-menu");

    if (mobileMenuButton && mobileMenu) {
        const closeMobileMenu = () => {
            mobileMenuButton.classList.remove("active");
            mobileMenu.classList.remove("mobile-open");
            mobileMenuButton.setAttribute("aria-expanded", "false");
        };

        mobileMenuButton.addEventListener("click", () => {
            const isOpen = mobileMenu.classList.toggle("mobile-open");
            mobileMenuButton.classList.toggle("active", isOpen);
            mobileMenuButton.setAttribute("aria-expanded", String(isOpen));
        });

        mobileMenu.querySelectorAll("a, button").forEach((element) => {
            element.addEventListener("click", closeMobileMenu);
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 640) closeMobileMenu();
        });
    }
});

// Start New Design / Reset Workspace Form Event Handlers
document.addEventListener('click', (e) => {
    const targetLink = e.target.closest('a[href="#/workspace"], #nav-start, #hero-start-btn, .btn-start');
    if (targetLink) {
        if (typeof window.resetWorkspaceForm === 'function') {
            window.resetWorkspaceForm();
        }
    }
});

// 1. Hero Content Entrance Animations
function initHeroAnimations() {
    gsap.fromTo('#hero-title', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.2 }
    );

    gsap.fromTo('#hero-subtitle', 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.5 }
    );

    gsap.fromTo('#hero-start-btn', 
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.8 }
    );
}

// 2. Horizontal Scroll for Portfolio Gallery
function initPortfolioScroll() {
    const scrollContainer = document.querySelector('.portfolio-scroll-container');
    if (!scrollContainer) return;

    // Calculate dynamic horizontal distance to scroll
    const getScrollAmount = () => {
        let containerWidth = scrollContainer.offsetWidth;
        let viewportWidth = window.innerWidth;
        return -(containerWidth - viewportWidth + 80); // padding safety margin
    };

    gsap.to(scrollContainer, {
        x: () => getScrollAmount(),
        ease: 'none',
        scrollTrigger: {
            trigger: '.portfolio-container',
            start: 'top top+=80',
            end: () => `+=${scrollContainer.offsetWidth - window.innerWidth}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            // markers: false // Set to true to debug triggers
        }
    });
}

// 3. Service Intro Zig-Zag Step Wheel Scroll Parallax Animations
function initStepAnimations() {
    const stepCards = gsap.utils.toArray('.step-card');
    
    stepCards.forEach((card) => {
        const visual = card.querySelector('.step-visual');
        const text = card.querySelector('.step-text');
        const num = card.querySelector('.step-num');
        const img = card.querySelector('.step-image');

        const isReverse = card.classList.contains('reverse');

        // Bind animation timeline directly to mouse wheel scroll position (scrub: 1.2)
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                end: 'bottom 15%',
                scrub: 1.2,
                invalidateOnRefresh: true
            }
        });

        if (visual) {
            tl.fromTo(visual, 
                { 
                    opacity: 0.15, 
                    x: isReverse ? 110 : -110,
                    scale: 0.88,
                    rotate: isReverse ? 3 : -3
                },
                {
                    opacity: 1,
                    x: 0,
                    scale: 1.03,
                    rotate: 0,
                    ease: 'power1.out',
                    duration: 1
                }, 0
            );
        }

        if (text) {
            tl.fromTo(text, 
                { 
                    opacity: 0.15, 
                    y: 70,
                    scale: 0.95
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    ease: 'power1.out',
                    duration: 1
                }, 0
            );
        }

        if (num) {
            tl.fromTo(num,
                { opacity: 0.2, scale: 0.8 },
                { opacity: 1, scale: 1.25, ease: 'power1.out', duration: 0.8 },
                0.1
            );
        }

        if (img) {
            tl.fromTo(img,
                { filter: 'brightness(0.7) contrast(0.9)' },
                { filter: 'brightness(1.1) contrast(1.05)', ease: 'none', duration: 1 },
                0
            );
        }
    });
}
