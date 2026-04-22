/**
 * VISION Identity Verification System
 * Uses face-api.js (client-side) for face comparison
 * ID Card face vs Live Selfie — runs entirely in the browser
 */

let stream = null;
let idImageBase64 = null;
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

// ─── Utility: Load image from base64 ────────────────────────
function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });
}

// ─── Modal Controls ─────────────────────────────────────────

function openVerifyModal() {
    document.getElementById('verifyModal').style.display = 'flex';
    resetVerifySteps();
    // Ensure models are loading
    if (!modelsLoaded && typeof faceapi !== 'undefined') loadFaceModels();
}

function closeVerifyModal() {
    document.getElementById('verifyModal').style.display = 'none';
    stopCamera();
    idImageBase64 = null;
}

function resetVerifySteps() {
    document.getElementById('verifyStep1').style.display = 'block';
    document.getElementById('verifyStep2').style.display = 'none';
    document.getElementById('verifyStep3').style.display = 'none';
    
    idImageBase64 = null;
    const preview = document.getElementById('idCardPreview');
    const placeholder = document.getElementById('idUploadPlaceholder');
    const nextBtn = document.getElementById('idNextBtn');
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    if (placeholder) placeholder.style.display = 'flex';
    if (nextBtn) { nextBtn.disabled = true; nextBtn.style.opacity = '0.4'; }
    
    // Reset step 3
    const spinner = document.getElementById('verifySpinner');
    const resultIcon = document.getElementById('verifyResultIcon');
    if (spinner) spinner.style.display = 'flex';
    if (resultIcon) resultIcon.style.display = 'none';
    const statusTitle = document.getElementById('verifyStatusTitle');
    if (statusTitle) { statusTitle.textContent = 'Verifying Identity'; statusTitle.style.color = 'var(--text-primary)'; }
}

// ─── STEP 1: National ID Upload ──────────────────────────────

function handleIdUpload(input) {
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        idImageBase64 = e.target.result;
        
        const preview = document.getElementById('idCardPreview');
        const placeholder = document.getElementById('idUploadPlaceholder');
        const nextBtn = document.getElementById('idNextBtn');
        const fileName = document.getElementById('idFileName');
        
        if (preview) { preview.src = idImageBase64; preview.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
        if (fileName) fileName.textContent = file.name;
        if (nextBtn) { nextBtn.disabled = false; nextBtn.style.opacity = '1'; }
    };
    
    reader.readAsDataURL(file);
}

// ─── STEP 2: Selfie Camera ──────────────────────────────────

async function showSelfieStep() {
    if (!idImageBase64) {
        alert("Please upload your National ID card first.");
        return;
    }
    
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

// ─── STEP 3: Client-Side Face Comparison ─────────────────────

async function processVerification(selfieBase64) {
    stopCamera();
    document.getElementById('verifyStep2').style.display = 'none';
    document.getElementById('verifyStep3').style.display = 'block';
    
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

        // Step 2: Detect face on ID card
        if (statusText) statusText.innerHTML = "Scanning face on ID card...";
        
        const idImg = await loadImage(idImageBase64);
        const idDetection = await faceapi
            .detectSingleFace(idImg)
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        if (!idDetection) {
            showVerifyResult('error', 'No Face on ID', 'Could not detect a face on your ID card. Please upload a clearer photo.');
            setTimeout(() => resetVerifySteps(), 4000);
            return;
        }

        // Step 3: Detect face in selfie
        if (statusText) statusText.innerHTML = "Analyzing your selfie...";
        
        const selfieImg = await loadImage(selfieBase64);
        const selfieDetection = await faceapi
            .detectSingleFace(selfieImg)
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        if (!selfieDetection) {
            showVerifyResult('error', 'No Face in Selfie', 'Could not detect your face. Ensure good lighting and try again.');
            setTimeout(() => resetVerifySteps(), 4000);
            return;
        }

        // Step 4: Compare faces
        if (statusText) statusText.innerHTML = "Comparing faces...";
        
        const distance = faceapi.euclideanDistance(
            idDetection.descriptor,
            selfieDetection.descriptor
        );
        
        const MATCH_THRESHOLD = 0.6; // Standard threshold (lower = stricter)
        const confidence = Math.round((1 - distance) * 100);
        const isMatch = distance < MATCH_THRESHOLD;
        
        console.log("[FaceAPI] Distance:", distance.toFixed(4), "| Confidence:", confidence + "%", "| Match:", isMatch);

        if (isMatch) {
            // Step 5: Notify server to update Firestore
            if (statusText) statusText.innerHTML = "Face matched! Updating your profile...";
            
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
            
            showVerifyResult('success', 'IDENTITY VERIFIED', `Face match confirmed (${confidence}% confidence)`);
            
            setTimeout(() => {
                closeVerifyModal();
                window.location.reload();
            }, 2200);
        } else {
            showVerifyResult('error', 'Face Mismatch', `The face on your ID does not match your selfie (${confidence}% similarity). Please ensure you upload YOUR ID and take a clear selfie.`);
            setTimeout(() => resetVerifySteps(), 5000);
        }

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
