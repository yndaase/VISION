/**
 * VISION Face Verification System
 * Handles ID upload, Camera capture, and CompreFace matching
 */

let idFile = null;
let selfieBlob = null;
let stream = null;

function openVerifyModal() {
    document.getElementById('verifyModal').style.display = 'flex';
    resetVerifySteps();
}

function closeVerifyModal() {
    document.getElementById('verifyModal').style.display = 'none';
    stopCamera();
}

function resetVerifySteps() {
    document.getElementById('verifyStep1').style.display = 'block';
    document.getElementById('verifyStep2').style.display = 'none';
    document.getElementById('verifyStep3').style.display = 'none';
    document.getElementById('idPreview').innerText = '📇';
    document.getElementById('idUploadLabel').innerText = 'Upload Student ID Card';
    document.getElementById('nextToSelfie').disabled = true;
    document.getElementById('nextToSelfie').style.opacity = '0.5';
    idFile = null;
}

function handleIdSelect(input) {
    if (input.files && input.files[0]) {
        idFile = input.files[0];
        document.getElementById('idPreview').innerText = '✅';
        document.getElementById('idUploadLabel').innerText = idFile.name;
        document.getElementById('nextToSelfie').disabled = false;
        document.getElementById('nextToSelfie').style.opacity = '1';
    }
}

let currentFacingMode = 'user'; // 'user' is front, 'environment' is back

async function showSelfieStep() {
    document.getElementById('verifyStep1').style.display = 'none';
    document.getElementById('verifyStep2').style.display = 'block';
    
    await startCamera();
}

async function startCamera() {
    stopCamera();
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: currentFacingMode } 
        });
        document.getElementById('selfieVideo').srcObject = stream;
    } catch (err) {
        console.error("Camera access denied", err);
        alert("Camera access is required for face verification.");
        closeVerifyModal();
    }
}

async function switchCamera() {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    await startCamera();
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

function captureSelfie() {
    const video = document.getElementById('selfieVideo');
    const canvas = document.getElementById('selfieCanvas');
    const overlay = document.getElementById('shutterOverlay');
    const preview = document.getElementById('capturedPhotoPreview');
    
    if (!video.videoWidth) {
        alert("Camera is still warming up. Please wait 1 second.");
        return;
    }

    // Shutter effect
    overlay.style.opacity = '1';
    setTimeout(() => overlay.style.opacity = '0', 100);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // DIGITAL FLASH: Boost brightness and contrast for the AI
    ctx.filter = 'brightness(1.1) contrast(1.1) saturate(1.1)';
    ctx.drawImage(video, 0, 0);
    
    const selfieBase64 = canvas.toDataURL('image/jpeg', 0.7);
    if (preview) preview.src = selfieBase64;
    
    console.log("[Verification] Captured image size:", Math.round(selfieBase64.length / 1024), "KB");
    processVerification(selfieBase64);
}

async function processVerification(selfieBase64) {
    stopCamera();
    document.getElementById('verifyStep2').style.display = 'none';
    document.getElementById('verifyStep3').style.display = 'block';
    
    const statusText = document.getElementById('verifyStatusText');
    const session = JSON.parse(localStorage.getItem('waec_session'));
    
    try {
        statusText.innerText = "Analyzing Face Data...";
        const res = await fetch('/api/verify-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                selfieBase64,
                email: session.email
            })
        });
        
        const result = await res.json();
        
        if (result.match) {
            statusText.innerHTML = "<span style='color:#10b981; font-weight:800;'>FACE VERIFIED!</span><br>Profile authenticated successfully.";
            await finalizeVerification();
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            statusText.innerHTML = "<span style='color:#ef4444; font-weight:800;'>SCAN FAILED</span><br>" + (result.error || "No face detected. Please try again.");
            setTimeout(() => resetVerifySteps(), 3000);
        }
    } catch (err) {
        console.error("Verification error", err);
        statusText.innerHTML = "<span style='color:#ef4444; font-weight:800;'>SYSTEM ERROR</span><br>Verification server is currently busy.";
        setTimeout(() => resetVerifySteps(), 3000);
    }
}

async function finalizeVerification() {
    const session = JSON.parse(localStorage.getItem('waec_session'));
    if (!session || !session.email) return;

    // Update Firebase
    if (typeof window.fbUpdateUser === 'function') {
        await window.fbUpdateUser(session.email, { isVerified: true });
    }
    
    // Update Local Session
    session.isVerified = true;
    localStorage.setItem('waec_session', JSON.stringify(session));
}

// Global UI Updater
window.updateVerificationUI = function(isVerified) {
    const navBadge = document.getElementById('navVerifiedBadge');
    const heroBadge = document.getElementById('heroVerifiedBadge');
    const verifyBtn = document.getElementById('navVerifyBtn');
    
    if (navBadge) navBadge.style.display = isVerified ? 'inline-flex' : 'none';
    if (heroBadge) heroBadge.style.display = isVerified ? 'inline-flex' : 'none';
    if (verifyBtn) verifyBtn.style.display = isVerified ? 'none' : 'flex';
};
