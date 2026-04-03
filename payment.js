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
  
  // PRO users get everything for free (if that's the desired logic)
  if (session.role === "pro") return true;

  const purchases = JSON.parse(localStorage.getItem(PURCHASE_KEY_PREFIX + session.email) || "[]");
  return purchases.includes(itemId);
}

/**
 * Mark an item as purchased for the current user.
 */
function markAsPurchased(itemId) {
  const session = getSession();
  if (!session || !session.email) return;

  const key = PURCHASE_KEY_PREFIX + session.email;
  const purchases = JSON.parse(localStorage.getItem(key) || "[]");
  if (!purchases.includes(itemId)) {
    purchases.push(itemId);
    localStorage.setItem(key, JSON.stringify(purchases));
  }
}

/**
 * Start the Paystack checkout flow via standard Redirect.
 */
async function initiatePayment(itemId, amount, itemName) {
  const session = getSession();
  if (!session || !session.email) {
    alert("Please log in to make a purchase.");
    window.location.href = "/login";
    return;
  }

  try {
    // 1. Initialize transaction on backend
    const initRes = await fetch("/api/paystack-init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: session.email,
        amount: amount,
        metadata: {
          itemId: itemId,
          itemName: itemName,
          user: session.name
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
        const verifyRes = await fetch("/api/paystack-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference })
        });
        const verifyData = await verifyRes.json();
        
        if (verifyData.success) {
            if (pendingItemId) markAsPurchased(pendingItemId);
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
