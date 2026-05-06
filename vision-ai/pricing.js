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

// Handle Pro upgrade
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

  // Initiate Paystack payment
  await initiatePayment(session.email, 30.00, 'Vision AI Pro Subscription');
}

// Initialize Paystack payment
async function initiatePayment(email, amount, description) {
  try {
    // Show loading state
    const proBtn = document.getElementById('proBtn');
    const originalText = proBtn.textContent;
    proBtn.textContent = 'Processing...';
    proBtn.disabled = true;

    // Call Vision AI's own API endpoint
    const response = await fetch('/api/paystack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'init',
        email: email,
        amount: amount,
        metadata: {
          product: 'vision_ai_pro',
          description: description,
          custom_fields: [
            {
              display_name: 'Product',
              variable_name: 'product',
              value: 'Vision AI Pro'
            }
          ]
        }
      })
    });

    const data = await response.json();

    if (data.authorization_url && data.reference) {
      // Store reference for verification
      sessionStorage.setItem('payment_reference', data.reference);
      
      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
    } else {
      throw new Error(data.error || 'Failed to initialize payment');
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    alert('Payment initialization failed. Please try again.');
    
    // Reset button
    const proBtn = document.getElementById('proBtn');
    if (proBtn) {
      proBtn.textContent = 'Upgrade to Pro — GH₵ 30/mo';
      proBtn.disabled = false;
    }
  }
}

// Verify payment on return from Paystack
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get('reference');
  
  if (reference) {
    verifyPayment(reference);
  }
});

async function verifyPayment(reference) {
  try {
    const response = await fetch('/api/paystack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'verify',
        reference: reference
      })
    });

    const data = await response.json();

    if (data.success && data.detail) {
      // Payment successful - upgrade user to Pro
      await upgradeUserToPro(data.detail);
      
      // Clear payment reference
      sessionStorage.removeItem('payment_reference');
      
      // Show success message
      alert('🎉 Welcome to Vision AI Pro! Your subscription is now active.');
      
      // Redirect to chat
      window.location.href = '/index.html';
    } else {
      throw new Error(data.error || 'Payment verification failed');
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    alert('Payment verification failed. Please contact support if you were charged.');
  }
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
