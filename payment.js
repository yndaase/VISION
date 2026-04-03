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
 * Start the Paystack checkout flow.
 */
async function initiatePayment(itemId, amount, itemName, onSuccessCallback) {
  const session = getSession();
  if (!session || !session.email) {
    alert("Please log in to make a purchase.");
    window.location.href = "/login";
    return;
  }

  // 1. Initialize transaction on backend
  try {
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

    // 2. Open Paystack Popup (V2 Syntax)
    const popup = new PaystackPop();
    popup.resumeTransaction({
      accessCode: initData.access_code,
      onSuccess: async function(response) {
        // 3. Verify on backend (optional but recommended)
        const verifyRes = await fetch("/api/paystack-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: response.reference })
        });

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          markAsPurchased(itemId);
          if (onSuccessCallback) onSuccessCallback(verifyData.detail);
          else {
            alert("Payment successful! " + itemName + " unlocked.");
            window.location.reload();
          }
        } else {
          alert("Payment verification failed: " + (verifyData.error || "Unknown error"));
        }
      },
      onCancel: function() {
        console.log("Payment cancelled.");
      }
    });
  } catch (err) {
    console.error("Payment error:", err);
    alert("Error starting payment: " + err.message);
  }
}

// Ensure getSession is available from auth.js
if (typeof getSession !== "function") {
    console.error("auth.js must be loaded before payment.js");
}
