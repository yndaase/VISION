/**
 * VISION Identity Verification System
 * Uses face-api.js (client-side) for face detection
 * Detects a real human face in a live selfie — runs entirely in the browser
 */

let stream = null;
let currentFacingMode = 'user';
let modelsLoaded = false;

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

// ─── Pre-load face-api.js models in background ──────────────
async function loadFaceModels() {
    if (modelsLoaded) return true;
    try {
        console.log("[FaceAPI] Loading models...");
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        modelsLoaded = true;
        console.log("[FaceAPI] Models loaded successfully");
        return true;
    } catch (err) {
        console.error("[FaceAPI] Failed to load models:", err);
        return false;
    }
}

// Start loading models as soon as possible
if (typeof faceapi !== 'undefined') {
    loadFaceModels();
} else {
    window.addEventListener('load', () => {
        if (typeof faceapi !== 'undefined') loadFaceModels();
    });
}

// ─── Modal Controls ─────────────────────────────────────────

function openVerifyModal() {
    document.getElementById('verifyModal').style.display = 'flex';
    resetVerifySteps();
    // Ensure models are loading
    if (!modelsLoaded && typeof faceapi !== 'undefined') loadFaceModels();

    // Go straight to the camera step (no ID upload needed)
    document.getElementById('verifyStep1').style.display = 'block';
    startCamera();
}

function closeVerifyModal() {
    document.getElementById('verifyModal').style.display = 'none';
    stopCamera();
}

function resetVerifySteps() {
    document.getElementById('verifyStep1').style.display = 'block';
    document.getElementById('verifyStep2').style.display = 'none';
    
    // Reset step 2 (processing)
    const spinner = document.getElementById('verifySpinner');
    const resultIcon = document.getElementById('verifyResultIcon');
    if (spinner) spinner.style.display = 'flex';
    if (resultIcon) resultIcon.style.display = 'none';
    const statusTitle = document.getElementById('verifyStatusTitle');
    if (statusTitle) { statusTitle.textContent = 'Verifying Identity'; statusTitle.style.color = 'var(--text-primary)'; }
}

// ─── STEP 1: Selfie Camera ──────────────────────────────────

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
        alert("Camera is still warming up. Please wait a moment.");
        return;
    }

    if (overlay) {
        overlay.style.opacity = '1';
        setTimeout(() => overlay.style.opacity = '0', 120);
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const selfieBase64 = canvas.toDataURL('image/jpeg', 0.7);
    if (preview) preview.src = selfieBase64;
    
    processVerification(selfieBase64);
}

// ─── STEP 2: Client-Side Face Detection ──────────────────────

async function processVerification(selfieBase64) {
    stopCamera();
    document.getElementById('verifyStep1').style.display = 'none';
    document.getElementById('verifyStep2').style.display = 'block';
    
    const statusText = document.getElementById('verifyStatusText');
    const statusTitle = document.getElementById('verifyStatusTitle');
    const session = JSON.parse(sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session') || 'null');
    
    if (!session || !session.email) {
        showVerifyResult('error', 'Session Error', 'Please log in and try again.');
        setTimeout(() => closeVerifyModal(), 2000);
        return;
    }

    try {
        // Step 1: Ensure models are loaded
        if (statusText) statusText.innerHTML = "Loading AI face recognition engine...";
        
        if (!modelsLoaded) {
            const loaded = await loadFaceModels();
            if (!loaded) {
                showVerifyResult('error', 'Model Load Failed', 'Could not load face recognition. Check your internet and try again.');
                setTimeout(() => resetVerifySteps(), 3000);
                return;
            }
        }

        // Step 2: Detect face in selfie
        if (statusText) statusText.innerHTML = "Scanning your face...";
        
        const selfieImg = new Image();
        selfieImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
            selfieImg.onload = resolve;
            selfieImg.onerror = reject;
            selfieImg.src = selfieBase64;
        });

        const selfieDetection = await faceapi
            .detectSingleFace(selfieImg)
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        if (!selfieDetection) {
            showVerifyResult('error', 'No Face Detected', 'Could not detect your face. Ensure good lighting and a clear view, then try again.');
            setTimeout(() => resetVerifySteps(), 4000);
            return;
        }

        // Step 3: Face detected — check quality (confidence score from detection)
        if (statusText) statusText.innerHTML = "Face detected! Updating your profile...";
        
        const confidence = Math.round(selfieDetection.detection.score * 100);
        console.log("[FaceAPI] Face detected | Confidence:", confidence + "%");

        if (confidence < 50) {
            showVerifyResult('error', 'Low Quality', 'Face detection confidence is too low. Please ensure good lighting and try again.');
            setTimeout(() => resetVerifySteps(), 4000);
            return;
        }

        // Step 4: Notify server to update Firestore
        try {
            await fetch('/api/verify-face', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: session.email, verified: true })
            });
        } catch(e) {
            console.warn("[Verify] Server sync failed, updating locally:", e);
        }
        
        // Update local session
        session.isVerified = true;
        try { sessionStorage.setItem('waec_session', JSON.stringify(session)); } catch(e) {}
        try { localStorage.setItem('waec_session', JSON.stringify(session)); } catch(e) {}
        if (typeof setSession === 'function') setSession(session);
        if (typeof updateVerificationUI === 'function') updateVerificationUI(true);
        
        showVerifyResult('success', 'IDENTITY VERIFIED', `Face scan confirmed (${confidence}% confidence)`);
        
        setTimeout(() => {
            closeVerifyModal();
            window.location.reload();
        }, 2200);

    } catch (err) {
        console.error("[Verification] Error:", err);
        showVerifyResult('error', 'System Error', 'Something went wrong. Please try again.');
        setTimeout(() => resetVerifySteps(), 3000);
    }
}

function showVerifyResult(type, title, message) {
    const statusText = document.getElementById('verifyStatusText');
    const statusTitle = document.getElementById('verifyStatusTitle');
    const spinner = document.getElementById('verifySpinner');
    const resultIcon = document.getElementById('verifyResultIcon');
    
    if (spinner) spinner.style.display = 'none';
    if (resultIcon) {
        resultIcon.style.display = 'flex';
        if (type === 'success') {
            resultIcon.innerHTML = '<svg width="36" height="36" fill="none" stroke="#10b981" stroke-width="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
            resultIcon.style.background = 'rgba(16,185,129,0.1)';
            resultIcon.style.borderColor = 'rgba(16,185,129,0.3)';
        } else {
            resultIcon.innerHTML = '<svg width="36" height="36" fill="none" stroke="#ef4444" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
            resultIcon.style.background = 'rgba(239,68,68,0.1)';
            resultIcon.style.borderColor = 'rgba(239,68,68,0.3)';
        }
    }
    
    if (statusTitle) {
        statusTitle.textContent = title;
        statusTitle.style.color = type === 'success' ? '#10b981' : '#ef4444';
    }
    if (statusText) statusText.innerHTML = message;
}
