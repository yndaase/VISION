/**
 * VISION Face Verification System
 * Handles Camera capture and Face++ API matching
 * This is the CANONICAL verification flow — all entry points route here.
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
            video: { 
                facingMode: currentFacingMode,
                width: { ideal: 640 },
                height: { ideal: 480 }
            } 
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
    ctx.drawImage(video, 0, 0);
    
    // Quality reduced to 0.4 for maximum Face++ compatibility
    const selfieBase64 = canvas.toDataURL('image/jpeg', 0.4);
    if (preview) preview.src = selfieBase64;
    
    processVerification(selfieBase64);
}

async function processVerification(selfieBase64) {
    stopCamera();
    document.getElementById('verifyStep2').style.display = 'none';
    document.getElementById('verifyStep3').style.display = 'block';
    
    const statusText = document.getElementById('verifyStatusText');
    const session = JSON.parse(sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session') || 'null');
    
    if (!session || !session.email) {
        statusText.innerHTML = "<span style='color:#ef4444; font-weight:800;'>Session Error</span><br>Please log in again.";
        setTimeout(() => closeVerifyModal(), 2000);
        return;
    }

    try {
        statusText.innerText = "Analyzing biometric data...";
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
            statusText.innerHTML = "<span style='color:#10b981; font-weight:800;'>VERIFIED!</span>";
            
            // Update local session state immediately
            session.isVerified = true;
            try { sessionStorage.setItem('waec_session', JSON.stringify(session)); } catch(e) {}
            try { localStorage.setItem('waec_session', JSON.stringify(session)); } catch(e) {}
            
            // Also update via auth.js setSession if available
            if (typeof setSession === 'function') {
                setSession(session);
            }

            // Update verification UI badges immediately (no reload needed for badge display)
            if (typeof updateVerificationUI === 'function') {
                updateVerificationUI(true);
            }
            
            setTimeout(() => {
                closeVerifyModal();
                window.location.reload();
            }, 1500);
        } else {
            statusText.innerHTML = "<span style='color:#ef4444; font-weight:800;'>FAILED</span><br>" + (result.error || "No face detected. Ensure good lighting and try again.");
            
            setTimeout(() => resetVerifySteps(), 3000);
        }
    } catch (err) {
        console.error("[Verification] System Error:", err);
        statusText.innerHTML = "System Error. Please try again.";
        setTimeout(() => resetVerifySteps(), 3000);
    }
}
