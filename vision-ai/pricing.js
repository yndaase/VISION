// Vision AI Pricing Page JavaScript
// Handles Pro subscription payments via Paystack

// Check if user is already Pro
window.addEventListener('DOMContentLoaded', () => {
  checkProStatus();
});

function checkProStatus() {
  // Get session from localStorage or sessionStorage
  const session = getSession();
  
  if (session && session.role === 'pro') {
    const proBtn = document.getElementById('proBtn');
    if (proBtn) {
      proBtn.textContent = 'Current Active Plan';
      proBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      proBtn.style.boxShadow = '0 4px 18px rgba(34,197,94,0.3)';
      proBtn.style.pointerEvents = 'none';
      proBtn.style.cursor = 'default';
    }
  }
}

function getSession() {
  try {
    const sessionData = sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session');
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Handle Pro upgrade with Paystack Popup
async function handleUpgrade() {
  const session = getSession();
  
  if (!session) {
    alert('Please log in first to upgrade to Pro.');
    window.location.href = '/login.html';
    return;
  }

  if (session.role === 'pro') {
    alert('You already have an active Pro subscription!');
    return;
  }

  // Use Paystack Popup directly
  initiatePaystackPopup(session.email, 30.00);
}

// Initialize Paystack Popup (no backend needed)
function initiatePaystackPopup(email, amount) {
  // Check if Paystack is loaded
  if (typeof PaystackPop === 'undefined') {
    alert('Payment system is loading. Please try again in a moment.');
    setTimeout(() => location.reload(), 1000);
    return;
  }

  const handler = PaystackPop.setup({
    key: 'pk_live_4c89f5f8c0e5e3b8e0e5e3b8e0e5e3b8', // Paystack Live Public Key
    email: email,
    amount: amount * 100, // Convert to pesewas
    currency: 'GHS',
    ref: 'VAI_' + Math.floor((Math.random() * 1000000000) + 1),
    metadata: {
      custom_fields: [
        {
          display_name: "Product",
          variable_name: "product",
          value: "Vision AI Pro"
        }
      ]
    },
    callback: function(response) {
      // Payment successful
      upgradeUserToPro({
        reference: response.reference,
        status: 'success'
      });
      
      alert('🎉 Welcome to Vision AI Pro! Your subscription is now active.');
      window.location.href = '/index.html';
    },
    onClose: function() {
      alert('Payment cancelled. You can try again anytime.');
    }
  });
  
  handler.openIframe();
}

async function upgradeUserToPro(paymentDetail) {
  try {
    const session = getSession();
    if (!session) return;

    // Update session with Pro role
    session.role = 'pro';
    session.proSince = new Date().toISOString();
    session.subscriptionId = paymentDetail.reference;

    // Save updated session
    sessionStorage.setItem('waec_session', JSON.stringify(session));
    localStorage.setItem('waec_session', JSON.stringify(session));

    // TODO: Update Firebase/Supabase with Pro status
    // This should be done on the backend for security
    console.log('User upgraded to Pro:', session);
  } catch (error) {
    console.error('Error upgrading user:', error);
  }
}

// FAQ toggle
function toggleFaq(element) {
  const isOpen = element.classList.contains('open');
  
  // Close all FAQs
  document.querySelectorAll('.vai-faq-item').forEach(item => {
    item.classList.remove('open');
  });
  
  // Open clicked FAQ if it wasn't open
  if (!isOpen) {
    element.classList.add('open');
  }
}
