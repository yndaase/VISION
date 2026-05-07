/* =====================================================
   ENTERPRISE WELCOME PAGE JAVASCRIPT
   Handles animations and interactions
   ===================================================== */

/**
 * Check for existing session and redirect if already logged in
 */
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  const session = sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session');
  
  if (session) {
    try {
      const user = JSON.parse(session);
      
      // Redirect to appropriate dashboard based on role
      if (user.role === 'enterprise' || user.role === 'admin') {
        window.location.href = '/enterprise-dashboard.html';
      } else if (user.role === 'teacher') {
        window.location.href = '/enterprise-dashboard.html';
      } else {
        // Regular student - don't redirect, let them choose
        console.log('[Enterprise] Student session detected, allowing role selection');
      }
    } catch (e) {
      console.error('[Enterprise] Session parse error:', e);
    }
  }
  
  // Add smooth scroll behavior
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Animate stats on scroll
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateStats();
        statsObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  const statsSection = document.querySelector('.ent-welcome-stats');
  if (statsSection) {
    statsObserver.observe(statsSection);
  }
});

/**
 * Animate stats counter
 */
function animateStats() {
  const stats = [
    { element: document.querySelectorAll('.ent-welcome-stat-value')[0], target: 50, suffix: '+' },
    { element: document.querySelectorAll('.ent-welcome-stat-value')[1], target: 500, suffix: '+' },
    { element: document.querySelectorAll('.ent-welcome-stat-value')[2], target: 10000, suffix: '+' },
    { element: document.querySelectorAll('.ent-welcome-stat-value')[3], target: 98, suffix: '%' }
  ];
  
  stats.forEach(stat => {
    if (!stat.element) return;
    
    let current = 0;
    const increment = stat.target / 50;
    const duration = 1500;
    const stepTime = duration / 50;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= stat.target) {
        current = stat.target;
        clearInterval(timer);
      }
      
      if (stat.target >= 1000) {
        stat.element.textContent = Math.floor(current).toLocaleString() + stat.suffix;
      } else {
        stat.element.textContent = Math.floor(current) + stat.suffix;
      }
    }, stepTime);
  });
}

/**
 * Track role selection for analytics
 */
function trackRoleSelection(role) {
  try {
    // Store selection in localStorage for analytics
    const selections = JSON.parse(localStorage.getItem('vision_role_selections') || '[]');
    selections.push({
      role: role,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });
    
    // Keep only last 10 selections
    if (selections.length > 10) {
      selections.shift();
    }
    
    localStorage.setItem('vision_role_selections', JSON.stringify(selections));
  } catch (e) {
    console.error('[Enterprise] Analytics tracking error:', e);
  }
}

// Add click tracking to role buttons
document.addEventListener('DOMContentLoaded', () => {
  const adminBtn = document.querySelector('.admin-btn');
  const teacherBtn = document.querySelector('.teacher-btn');
  
  if (adminBtn) {
    adminBtn.addEventListener('click', () => trackRoleSelection('admin'));
  }
  
  if (teacherBtn) {
    teacherBtn.addEventListener('click', () => trackRoleSelection('teacher'));
  }
});

/**
 * Add parallax effect to background orbs
 */
document.addEventListener('mousemove', (e) => {
  const orbs = document.querySelectorAll('.ent-welcome-orb');
  const mouseX = e.clientX / window.innerWidth;
  const mouseY = e.clientY / window.innerHeight;
  
  orbs.forEach((orb, index) => {
    const speed = (index + 1) * 0.05;
    const x = (mouseX - 0.5) * 50 * speed;
    const y = (mouseY - 0.5) * 50 * speed;
    
    orb.style.transform = `translate(${x}px, ${y}px)`;
  });
});

/**
 * Add scroll reveal animations
 */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

document.addEventListener('DOMContentLoaded', () => {
  // Add reveal animation to sections
  const revealElements = document.querySelectorAll('.ent-welcome-role-card, .ent-welcome-feature-item, .ent-welcome-trust-logo');
  
  revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    revealObserver.observe(el);
  });
});
