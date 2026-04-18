if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Service Worker registered:", reg.scope);

        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // New content is available; please refresh.
                showOfflineToast("New update available. Refresh to apply!");
              } else {
                // Content is cached for offline use.
                showOfflineToast("App ready for offline use!");
              }
            }
          };
        };
      })
      .catch((err) => {
        console.log("Service Worker registration failed:", err);
      });
  });
}

function showOfflineToast(message) {
  const toast = document.createElement("div");
  toast.className = "offline-toast";
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(toast);

  // Style the toast
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(15, 23, 42, 0.9)",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "100px",
    fontSize: "0.85rem",
    fontWeight: "600",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    zIndex: "9999",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

