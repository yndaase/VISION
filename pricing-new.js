// Pricing Page JavaScript

// Initialize Swiper
const swiper = new Swiper('.enterpriseSwiper', {
  slidesPerView: 1,
  spaceBetween: 30,
  centeredSlides: true,
  loop: true,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  keyboard: {
    enabled: true,
  },
  breakpoints: {
    640: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 1,
    },
    1024: {
      slidesPerView: 1,
    },
  },
});

// Switch between Individual and Enterprise plans
function switchPlanType(planType) {
  const individualSection = document.getElementById('individualSection');
  const enterpriseSection = document.getElementById('enterpriseSection');
  const toggleBtns = document.querySelectorAll('.pr-toggle-btn');

  // Update toggle buttons
  toggleBtns.forEach(btn => {
    if (btn.dataset.plan === planType) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Show/hide sections
  if (planType === 'individual') {
    individualSection.classList.remove('hidden');
    enterpriseSection.classList.add('hidden');
  } else {
    individualSection.classList.add('hidden');
    enterpriseSection.classList.remove('hidden');
    // Update swiper after showing
    setTimeout(() => swiper.update(), 100);
  }
}

// Handle Pro upgrade
async function handlePricingUpgrade(billingType) {
  const session = typeof getSession === 'function' ? getSession() : null;

  if (!session) {
    alert('Please log in first to upgrade to Pro.');
    window.location.href = '/login.html';
    return;
  }

  if (session.role === 'pro') {
    alert('You already have an active Pro subscription!');
    return;
  }

  // Determine price based on billing type
  const price = billingType === 'annual' ? 300.00 : 30.00;
  const productName = billingType === 'annual' ? 'Vision Pro Annual' : 'Vision Pro Monthly';

  // Call payment function
  if (typeof initiatePayment === 'function') {
    await initiatePayment('vision_pro_access', price, productName);
  } else {
    alert('Payment system loading... please try again.');
  }
}

// Check if user is already Pro
window.addEventListener('DOMContentLoaded', () => {
  const session = typeof getSession === 'function' ? getSession() : null;

  if (session && session.role === 'pro') {
    // Update Pro Monthly button
    const proMonthlyBtn = document.getElementById('proMonthlyBtn');
    if (proMonthlyBtn) {
      proMonthlyBtn.textContent = 'Current Active Plan';
      proMonthlyBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      proMonthlyBtn.style.boxShadow = '0 4px 18px rgba(34,197,94,0.3)';
      proMonthlyBtn.style.pointerEvents = 'none';
      proMonthlyBtn.style.cursor = 'default';
    }

    // Update Pro Annual button
    const proAnnualBtn = document.getElementById('proAnnualBtn');
    if (proAnnualBtn) {
      proAnnualBtn.textContent = 'Current Active Plan';
      proAnnualBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      proAnnualBtn.style.boxShadow = '0 4px 18px rgba(34,197,94,0.3)';
      proAnnualBtn.style.pointerEvents = 'none';
      proAnnualBtn.style.cursor = 'default';
    }
  }
});
