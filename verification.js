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
    const session = JSON.parse(localStorage.getItem('waec_session'));
    
    try {
        statusText.innerText = "Analyzing...";
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
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            statusText.innerHTML = "<span style='color:#ef4444; font-weight:800;'>FAILED</span><br>" + (result.error || "No face detected.");
            
            // KILL THE GHOST: If the scan fails, ensure the session reflects it
            const session = JSON.parse(localStorage.getItem('waec_session'));
            if (session) {
                session.isVerified = false;
                localStorage.setItem('waec_session', JSON.stringify(session));
            }
            
            setTimeout(() => resetVerifySteps(), 3000);
        }
    } catch (err) {
        statusText.innerHTML = "System Error. Try again.";
        setTimeout(() => resetVerifySteps(), 3000);
    }
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
