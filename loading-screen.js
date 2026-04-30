// =====================================================
// VISION EDUCATION — LOADING SCREEN CONTROLLER
// Manages page loading animations and transitions
// =====================================================

class VisionLoader {
  constructor(options = {}) {
    this.options = {
      minDisplayTime: options.minDisplayTime || 800, // Minimum time to show loader (ms)
      fadeOutDuration: options.fadeOutDuration || 400, // Fade out animation duration (ms)
      showParticles: options.showParticles !== false, // Show particle effects
      loadingText: options.loadingText || 'Loading',
      autoInit: options.autoInit !== false
    };
    
    this.loader = null;
    this.startTime = null;
    
    if (this.options.autoInit) {
      this.init();
    }
  }

  // Initialize the loader
  init() {
    // Create loader HTML if it doesn't exist
    if (!document.getElementById('visionLoader')) {
      this.createLoader();
    }
    
    this.loader = document.getElementById('visionLoader');
    this.startTime = Date.now();
    
    // Show loader
    this.show();
    
    // Hide loader when page is fully loaded
    if (document.readyState === 'complete') {
      this.hide();
    } else {
      window.addEventListener('load', () => this.hide());
    }
  }

  // Create loader HTML structure
  createLoader() {
    const loaderHTML = `
      <div id="visionLoader" class="vision-loader-overlay">
        ${this.options.showParticles ? `
        <div class="vision-loader-particles">
          <div class="vision-loader-particle"></div>
          <div class="vision-loader-particle"></div>
          <div class="vision-loader-particle"></div>
          <div class="vision-loader-particle"></div>
        </div>
        ` : ''}
        
        <div class="vision-loader-content">
          <div class="vision-loader-logo">
            <div class="vision-loader-ring"></div>
            <div class="vision-loader-ring"></div>
            <img src="/assets/logo.png" alt="Vision Education" onerror="this.style.display='none'">
          </div>
          
          <div class="vision-loader-brand">
            <h1 class="vision-loader-title">Vision Education</h1>
            <p class="vision-loader-subtitle">Excellence in Learning</p>
          </div>
          
          <div class="vision-loader-bar">
            <div class="vision-loader-bar-fill"></div>
          </div>
          
          <p class="vision-loader-text">
            ${this.options.loadingText}<span class="vision-loader-dots"></span>
          </p>
        </div>
      </div>
    `;
    
    // Insert at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', loaderHTML);
  }

  // Show the loader
  show() {
    if (this.loader) {
      this.loader.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  // Hide the loader
  hide() {
    if (!this.loader) return;
    
    const elapsedTime = Date.now() - this.startTime;
    const remainingTime = Math.max(0, this.options.minDisplayTime - elapsedTime);
    
    setTimeout(() => {
      this.loader.classList.add('hidden');
      document.body.style.overflow = '';
      
      // Remove from DOM after animation completes
      setTimeout(() => {
        if (this.loader && this.loader.parentNode) {
          this.loader.remove();
        }
      }, this.options.fadeOutDuration);
    }, remainingTime);
  }

  // Update loading text
  updateText(text) {
    const textElement = this.loader?.querySelector('.vision-loader-text');
    if (textElement) {
      textElement.innerHTML = `${text}<span class="vision-loader-dots"></span>`;
    }
  }

  // Manually trigger loader for navigation
  static showForNavigation(url, text = 'Loading') {
    const loader = new VisionLoader({
      autoInit: false,
      loadingText: text,
      minDisplayTime: 500
    });
    
    loader.createLoader();
    loader.loader = document.getElementById('visionLoader');
    loader.startTime = Date.now();
    loader.show();
    
    // Navigate after a brief moment
    setTimeout(() => {
      window.location.href = url;
    }, 100);
  }
}

// Auto-initialize immediately (before DOM ready)
if (typeof window !== 'undefined') {
  // Create and show loader immediately
  document.addEventListener('DOMContentLoaded', () => {
    const visionLoader = new VisionLoader({
      minDisplayTime: 800,
      showParticles: true
    });
    
    // Make it globally accessible
    window.VisionLoader = VisionLoader;
    window.visionLoader = visionLoader;
  });
  
  // Also make class available immediately
  window.VisionLoader = VisionLoader;
}

// Enhanced navigation with loading screen
function navigateWithLoader(url, text) {
  VisionLoader.showForNavigation(url, text);
}

// Intercept all internal links to show loader
document.addEventListener('DOMContentLoaded', () => {
  // Add loading to all internal navigation links
  const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
  
  internalLinks.forEach(link => {
    // Skip if already has click handler or is external
    if (link.hasAttribute('data-no-loader') || link.target === '_blank') {
      return;
    }
    
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      // Skip for hash links and javascript: links
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
        return;
      }
      
      // Prevent default navigation
      e.preventDefault();
      
      // Get loading text from data attribute or use default
      const loadingText = link.getAttribute('data-loading-text') || 'Loading';
      
      // Show loader and navigate
      VisionLoader.showForNavigation(href, loadingText);
    });
  });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisionLoader;
}
