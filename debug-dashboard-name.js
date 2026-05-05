// DASHBOARD NAME DEBUG SCRIPT
// Copy and paste this entire script into your browser console on the dashboard page

console.log("=== DASHBOARD NAME DEBUG ===");

// 1. Check Session
console.log("\n1. SESSION CHECK:");
const sessionKey = "waec_session";
const sessionStr = sessionStorage.getItem(sessionKey) || localStorage.getItem(sessionKey);
console.log("Session string:", sessionStr);

if (sessionStr) {
    try {
        const session = JSON.parse(sessionStr);
        console.log("✅ Session parsed:", session);
        console.log("   - Email:", session.email);
        console.log("   - Name:", session.name);
        console.log("   - Provider:", session.provider);
        console.log("   - First name would be:", session.name ? session.name.split(" ")[0] : "N/A");
    } catch (e) {
        console.error("❌ Session parse error:", e);
    }
} else {
    console.error("❌ No session found!");
}

// 2. Check Welcome Element
console.log("\n2. WELCOME ELEMENT CHECK:");
const welcomeEl = document.getElementById("welcomeName");
console.log("Element found:", welcomeEl);
if (welcomeEl) {
    console.log("   - Current text:", welcomeEl.textContent);
    console.log("   - Inner HTML:", welcomeEl.innerHTML);
    console.log("   - Parent HTML:", welcomeEl.parentElement?.outerHTML);
    
    const styles = window.getComputedStyle(welcomeEl);
    console.log("   - Display:", styles.display);
    console.log("   - Visibility:", styles.visibility);
    console.log("   - Opacity:", styles.opacity);
    console.log("   - Color:", styles.color);
    console.log("   - Font size:", styles.fontSize);
    console.log("   - Position:", styles.position);
} else {
    console.error("❌ welcomeName element not found!");
}

// 3. Check if checkAuth was called
console.log("\n3. CHECKAUTH FUNCTION CHECK:");
if (typeof checkAuth === 'function') {
    console.log("✅ checkAuth function exists");
    try {
        const authResult = checkAuth();
        console.log("   - checkAuth() returned:", authResult);
    } catch (e) {
        console.error("   - checkAuth() error:", e);
    }
} else {
    console.error("❌ checkAuth function not found!");
}

// 4. Check if dashboard.js loaded
console.log("\n4. DASHBOARD.JS CHECK:");
const navUsername = document.getElementById("navUsername");
const navAvatar = document.getElementById("navAvatar");
console.log("Nav username element:", navUsername);
console.log("Nav username text:", navUsername?.textContent);
console.log("Nav avatar element:", navAvatar);
console.log("Nav avatar text:", navAvatar?.textContent);

// 5. Force set the name
console.log("\n5. FORCE SET NAME:");
if (sessionStr && welcomeEl) {
    try {
        const session = JSON.parse(sessionStr);
        const firstName = session.name ? session.name.split(" ")[0] : "Student";
        welcomeEl.textContent = firstName;
        welcomeEl.style.color = "#6366f1";
        welcomeEl.style.fontSize = "2rem";
        welcomeEl.style.fontWeight = "800";
        console.log("✅ Forced name to:", firstName);
        console.log("   Check if you can see it now!");
    } catch (e) {
        console.error("❌ Force set error:", e);
    }
} else {
    console.error("❌ Cannot force set - missing session or element");
}

// 6. Check for JavaScript errors
console.log("\n6. CHECKING FOR ERRORS:");
console.log("Check the console above for any red error messages");

console.log("\n=== END DEBUG ===");
console.log("Please copy ALL of this output and send it to me!");
