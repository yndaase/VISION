/**
 * VISION EDUCATION  Payment Logic (Paystack Integration)
 * Handles: Purchase tracking, Paystack Popup, Verification
 */

const PURCHASE_KEY_PREFIX = "waec_purchases_";

/**
 * Check if the current user has purchased a specific item.
 */
function isPurchased(itemId) {
  const session = getSession();
  if (!session || !session.email) return false;
  
  // PRO users (Active Paid Sub or Admin) get everything for free
  const now = Date.now();
  const isPaidPro = (session.subscriptionExpiry || 0) > now;
  const isElite = session.role === 'admin' || session.role === 'enterprise';

  if (isPaidPro || isElite) {
    return true;
  }

  const purchases = JSON.parse(localStorage.getItem(PURCHASE_KEY_PREFIX + session.email) || "[]");
  return purchases.includes(itemId);
}

/**
 * Marks an item as purchased and handles PRO upgrades.
 */
async function markAsPurchased(itemId) {
  const session = getSession();
  if (!session || !session.email) return;

  // 1. Local Purchase Tracking
  const key = PURCHASE_KEY_PREFIX + session.email;
  const purchases = JSON.parse(localStorage.getItem(key) || "[]");
  if (!purchases.includes(itemId)) {
    purchases.push(itemId);
    localStorage.setItem(key, JSON.stringify(purchases));
  }

  // 2. Monthly Subscription Activation
  if (itemId === 'vision_pro_access') {
    const users = getUsers();
    let idx = users.findIndex(u => u.email === session.email);
    if (idx === -1) {
      users.push(session);
      idx = users.length - 1;
    }
    
    const now = Date.now();
    const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    
    // Calculate Expiry: Add to existing if active, otherwise start from now
    const currentExpiry = users[idx].subscriptionExpiry || 0;
    const startPoint = currentExpiry > now ? currentExpiry : now;
    const newExpiry = startPoint + MONTH_MS;
    
    users[idx].subscriptionExpiry = newExpiry;
    users[idx].role = 'pro';
    
    session.subscriptionExpiry = newExpiry;
    session.role = 'pro';
    setSession(session);
    
    saveUsers(users); // Triggers local/blob sync

    // 3. SECURE FIREBASE CLOUD SYNC
    if (typeof window.fbUpdateUser === 'function') {
      try {
        await window.fbUpdateUser(session.email, {
          role: 'pro',
          subscriptionExpiry: newExpiry
        });
        console.log("[Payment] ☁️ Firebase global subscription state updated.");
      } catch (err) {
        console.error("[Payment] Firebase sync failed against Pro upgrade:", err);
      }
    } else {
      console.warn("[Payment] Firebase SDK not loaded. Subscription is local-only.");
    }
    
    console.log("[Payment] Subscription Activated/Extended. New Expiry:", new Date(newExpiry).toLocaleDateString());
  }
}

/**
 * Start the Paystack checkout flow with Holiday Promo & Code Logic.
 */
async function initiatePayment(itemId, amount, itemName, promoCode = "") {
  const session = getSession();
  if (!session || !session.email) {
    alert("Please log in to make a purchase.");
    window.location.href = "/login";
    return;
  }

  // PRICING MODEL LOCKDOWN (30 GHC / Month)
  let finalAmount = amount;
  if (itemId === 'vision_pro_access') {
      finalAmount = 30.00;
      // All promo codes (AUGUSCO, STUDENTFREE) removed to enforce premium rate
  }

  try {
    // 1. Initialize transaction on backend (Consolidated Hub)
    const initRes = await fetch("/api/paystack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: 'init',
        email: session.email,
        amount: finalAmount,
        metadata: {
          itemId: itemId,
          itemName: itemName,
          user: session.name,
          promoCode: promoCode
        }
      })
    });

    const initData = await initRes.json();
    if (!initRes.ok) throw new Error(initData.error || "Initialization failed");

    // Save the item being purchased temporarily to localStorage to know what to unlock upon return
    localStorage.setItem("pending_purchase_item", itemId);
    localStorage.setItem("pending_purchase_name", itemName);

    // 2. Redirect completely to Paystack Secure Checkout
    window.location.href = initData.authorization_url;
  } catch (err) {
    console.error("Payment error:", err);
    alert("Error starting payment: " + err.message);
  }
}

// 3. Global Verifier: Automatically runs when returning from Paystack
async function constructVerificationFlow() {
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get("reference");
  
  if (reference) {
    // We have returned from a payment
    const pendingItemId = localStorage.getItem("pending_purchase_item");
    const pendingItemName = localStorage.getItem("pending_purchase_name");

    try {
        const verifyRes = await fetch("/api/paystack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: 'verify', reference })
        });
        const verifyData = await verifyRes.json();
        
        if (verifyData.success) {
            if (pendingItemId) await markAsPurchased(pendingItemId);
            alert("Payment successful! " + (pendingItemName || "Item") + " unlocked.");
        } else {
            alert("Payment failed or was cancelled.");
        }
    } catch (err) {
        alert("Verification error: Could not verify payment.");
    } finally {
        // Clean up URL so it doesn't verify twice
        localStorage.removeItem("pending_purchase_item");
        localStorage.removeItem("pending_purchase_name");
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.reload(); // Hard reload to apply unlocked states
    }
  }
}

// Run verifier when file loads
constructVerificationFlow();

// Ensure getSession is available from auth.js
if (typeof getSession !== "function") {
    console.error("auth.js must be loaded before payment.js");
}
