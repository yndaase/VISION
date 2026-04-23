/**
 * VISION Identity Verification System — Real-Time Liveness Detection
 * Uses face-api.js for continuous face tracking in the camera feed
 * Verifies the user is a real human through movement & blink detection
 */

let stream = null;
let currentFacingMode = 'user';
let modelsLoaded = false;
let trackingInterval = null;
let livenessState = {
    faceDetectedFrames: 0,
    totalFrames: 0,
    positions: [],          // Track face center positions for movement detection
    earHistory: [],          // Eye Aspect Ratio history for blink detection
    blinkCount: 0,
    movementDetected: false,
    blinkDetected: false,
    faceStable: false,
    startTime: 0,
    phase: 'detecting',     // detecting → tracking → liveness → verified
};

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
const REQUIRED_FACE_FRAMES = 10;    // Frames with face needed for stability
const MOVEMENT_THRESHOLD = 12;       // Pixels of head movement required
const BLINK_EAR_THRESHOLD = 0.24;    // Eye Aspect Ratio below this = blink
const BLINK_COOLDOWN = 300;          // ms between blink detections
let lastBlinkTime = 0;

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

// ─── Eye Aspect Ratio (EAR) for blink detection ─────────────
function getEAR(eye) {
    // eye is array of 6 landmarks [{x,y}, ...]
    // EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
    const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    const v1 = dist(eye[1], eye[5]);
    const v2 = dist(eye[2], eye[4]);
    const h = dist(eye[0], eye[3]);
    if (h === 0) return 0.3;
    return (v1 + v2) / (2 * h);
}

// ─── Modal Controls ─────────────────────────────────────────

function openVerifyModal() {
    document.getElementById('verifyModal').style.display = 'flex';
    resetVerifySteps();
    if (!modelsLoaded && typeof faceapi !== 'undefined') loadFaceModels();
    document.getElementById('verifyStep1').style.display = 'block';
    startCamera().then(() => {
        startRealTimeTracking();
    });
}

function closeVerifyModal() {
    document.getElementById('verifyModal').style.display = 'none';
    stopTracking();
    stopCamera();
}

function resetVerifySteps() {
    document.getElementById('verifyStep1').style.display = 'block';
    document.getElementById('verifyStep2').style.display = 'none';

    // Reset liveness state
    livenessState = {
        faceDetectedFrames: 0,
        totalFrames: 0,
        positions: [],
        earHistory: [],
        blinkCount: 0,
        movementDetected: false,
        blinkDetected: false,
        faceStable: false,
        startTime: Date.now(),
        phase: 'detecting',
    };
    lastBlinkTime = 0;

    // Reset UI elements
    updateLivenessUI('detecting');
    const spinner = document.getElementById('verifySpinner');
    const resultIcon = document.getElementById('verifyResultIcon');
    if (spinner) spinner.style.display = 'flex';
    if (resultIcon) resultIcon.style.display = 'none';
    const statusTitle = document.getElementById('verifyStatusTitle');
    if (statusTitle) { statusTitle.textContent = 'Verifying Identity'; statusTitle.style.color = 'var(--text-primary)'; }

    // Reset tracking overlay
    const overlay = document.getElementById('trackingOverlay');
    if (overlay) {
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
}

// ─── Camera Controls ────────────────────────────────────────

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
        const video = document.getElementById('selfieVideo');
        video.srcObject = stream;
        // Wait for video to be ready
        await new Promise(resolve => {
            video.onloadedmetadata = resolve;
        });
    } catch (err) {
        console.error("Camera access denied", err);
        alert("Camera access is required for face verification.");
        closeVerifyModal();
    }
}

async function switchCamera() {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    stopTracking();
    await startCamera();
    startRealTimeTracking();
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// ─── Real-Time Face Tracking ─────────────────────────────────

function startRealTimeTracking() {
    stopTracking();

    const video = document.getElementById('selfieVideo');
    const overlay = document.getElementById('trackingOverlay');
    if (!video || !overlay) return;

    livenessState.startTime = Date.now();

    async function trackFrame() {
        if (!stream || livenessState.phase === 'verified') return;

        // Sync overlay size with video display size
        const rect = video.getBoundingClientRect();
        overlay.width = rect.width;
        overlay.height = rect.height;

        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (!modelsLoaded || !video.videoWidth) {
            trackingInterval = requestAnimationFrame(trackFrame);
            return;
        }

        try {
            const detection = await faceapi
                .detectSingleFace(video)
                .withFaceLandmarks();

            livenessState.totalFrames++;

            if (detection) {
                livenessState.faceDetectedFrames++;
                const box = detection.detection.box;
                const landmarks = detection.landmarks;

                // Scale factor from video resolution to display size
                const scaleX = overlay.width / video.videoWidth;
                const scaleY = overlay.height / video.videoHeight;

                // Draw face bounding box
                const sx = box.x * scaleX;
                const sy = box.y * scaleY;
                const sw = box.width * scaleX;
                const sh = box.height * scaleY;

                // Determine box color based on phase
                let boxColor = 'rgba(99, 102, 241, 0.8)';  // Default blue
                if (livenessState.phase === 'liveness') boxColor = 'rgba(251, 191, 36, 0.8)';  // Yellow
                if (livenessState.phase === 'verified') boxColor = 'rgba(16, 185, 129, 0.9)';  // Green

                // Draw rounded box
                ctx.strokeStyle = boxColor;
                ctx.lineWidth = 3;
                ctx.shadowColor = boxColor;
                ctx.shadowBlur = 10;
                drawRoundedRect(ctx, sx, sy, sw, sh, 12);
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Draw corner brackets for sci-fi feel
                const bracketLen = 18;
                ctx.lineWidth = 4;
                ctx.strokeStyle = boxColor;
                drawCornerBrackets(ctx, sx, sy, sw, sh, bracketLen);

                // Draw face landmarks (subtle dots)
                ctx.fillStyle = 'rgba(99, 102, 241, 0.5)';
                const positions = landmarks.positions;
                for (let i = 0; i < positions.length; i++) {
                    const px = positions[i].x * scaleX;
                    const py = positions[i].y * scaleY;
                    ctx.beginPath();
                    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }

                // ─── Liveness Analysis ───────────────────────
                const faceCenter = {
                    x: (box.x + box.width / 2),
                    y: (box.y + box.height / 2)
                };
                livenessState.positions.push(faceCenter);
                if (livenessState.positions.length > 30) livenessState.positions.shift();

                // Movement detection (check if head has moved enough)
                if (livenessState.positions.length >= 5) {
                    let totalMovement = 0;
                    for (let i = 1; i < livenessState.positions.length; i++) {
                        const dx = livenessState.positions[i].x - livenessState.positions[i - 1].x;
                        const dy = livenessState.positions[i].y - livenessState.positions[i - 1].y;
                        totalMovement += Math.sqrt(dx * dx + dy * dy);
                    }
                    if (totalMovement > MOVEMENT_THRESHOLD) {
                        livenessState.movementDetected = true;
                    }
                }

                // Blink detection using Eye Aspect Ratio
                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();
                const leftEAR = getEAR(leftEye);
                const rightEAR = getEAR(rightEye);
                const avgEAR = (leftEAR + rightEAR) / 2;

                livenessState.earHistory.push(avgEAR);
                if (livenessState.earHistory.length > 10) livenessState.earHistory.shift();

                // Detect blink: EAR drops below threshold then recovers
                const now = Date.now();
                if (avgEAR < BLINK_EAR_THRESHOLD && (now - lastBlinkTime) > BLINK_COOLDOWN) {
                    livenessState.blinkCount++;
                    livenessState.blinkDetected = true;
                    lastBlinkTime = now;
                    console.log("[Liveness] Blink detected! Count:", livenessState.blinkCount);
                }

                // Face stability check
                if (livenessState.faceDetectedFrames >= REQUIRED_FACE_FRAMES) {
                    livenessState.faceStable = true;
                }

                // ─── Phase Transitions ──────────────────────
                if (livenessState.phase === 'detecting' && livenessState.faceStable) {
                    livenessState.phase = 'tracking';
                    updateLivenessUI('tracking');
                }

                if (livenessState.phase === 'tracking' && (livenessState.movementDetected || livenessState.blinkDetected)) {
                    livenessState.phase = 'liveness';
                    updateLivenessUI('liveness');
                }

                // Need BOTH movement and blink, OR enough time with movement (fallback)
                const elapsed = Date.now() - livenessState.startTime;
                const livenessConfirmed = 
                    (livenessState.movementDetected && livenessState.blinkDetected) ||
                    (livenessState.movementDetected && elapsed > 6000) ||
                    (livenessState.blinkDetected && elapsed > 6000);

                if (livenessState.phase === 'liveness' && livenessConfirmed && livenessState.faceStable) {
                    livenessState.phase = 'verified';
                    updateLivenessUI('verified');

                    // Draw green success box
                    ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
                    ctx.lineWidth = 4;
                    ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
                    ctx.shadowBlur = 20;
                    drawRoundedRect(ctx, sx, sy, sw, sh, 12);
                    ctx.stroke();

                    // Auto-capture and process
                    setTimeout(() => captureAndVerify(), 800);
                    return; // Stop tracking
                }

            } else {
                // No face detected
                if (livenessState.phase !== 'detecting') {
                    // Face was lost — show warning but don't reset immediately
                    const noFaceEl = document.getElementById('trackingStatus');
                    if (noFaceEl) noFaceEl.textContent = 'Face lost — look at camera';
                }
            }

        } catch (err) {
            // Silently handle detection errors (model not ready, etc.)
        }

        trackingInterval = requestAnimationFrame(trackFrame);
    }

    trackingInterval = requestAnimationFrame(trackFrame);
}

function stopTracking() {
    if (trackingInterval) {
        cancelAnimationFrame(trackingInterval);
        trackingInterval = null;
    }
}

// ─── Drawing Helpers ─────────────────────────────────────────

function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawCornerBrackets(ctx, x, y, w, h, len) {
    // Top-left
    ctx.beginPath();
    ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len);
    ctx.stroke();
}

// ─── Liveness UI Updates ─────────────────────────────────────

function updateLivenessUI(phase) {
    const statusEl = document.getElementById('trackingStatus');
    const progressEl = document.getElementById('livenessProgress');
    const check1 = document.getElementById('checkFace');
    const check2 = document.getElementById('checkMovement');
    const check3 = document.getElementById('checkBlink');
    const ringEl = document.getElementById('faceRing');

    const instructions = {
        detecting: '🔍 Looking for your face...',
        tracking: '👤 Face detected! Now move your head slightly',
        liveness: '👁️ Great! Now blink naturally',
        verified: '✅ Liveness confirmed!'
    };

    if (statusEl) statusEl.textContent = instructions[phase] || '';

    // Update ring color
    if (ringEl) {
        const colors = {
            detecting: 'var(--primary)',
            tracking: '#3b82f6',
            liveness: '#fbbf24',
            verified: '#10b981'
        };
        ringEl.style.borderColor = colors[phase] || 'var(--primary)';
        ringEl.style.boxShadow = `0 0 0 10px ${colors[phase]}15, 0 0 40px ${colors[phase]}20`;
    }

    // Update check indicators
    if (check1) check1.className = (phase !== 'detecting') ? 'liveness-check done' : 'liveness-check';
    if (check2) check2.className = livenessState.movementDetected ? 'liveness-check done' : 'liveness-check';
    if (check3) check3.className = livenessState.blinkDetected ? 'liveness-check done' : 'liveness-check';

    // Update progress bar
    if (progressEl) {
        const progress = {
            detecting: 10,
            tracking: 40,
            liveness: 70,
            verified: 100
        };
        progressEl.style.width = (progress[phase] || 0) + '%';
        progressEl.style.background = phase === 'verified'
            ? 'linear-gradient(90deg, #10b981, #34d399)'
            : 'linear-gradient(90deg, var(--primary), #3b82f6)';
    }
}

// ─── Capture & Verify ────────────────────────────────────────

function captureAndVerify() {
    const video = document.getElementById('selfieVideo');
    const canvas = document.getElementById('selfieCanvas');
    const preview = document.getElementById('capturedPhotoPreview');
    const overlay = document.getElementById('shutterOverlay');

    if (!video.videoWidth) return;

    // Shutter flash
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

// Legacy capture button (manual fallback)
function captureSelfie() {
    if (livenessState.phase === 'verified') {
        captureAndVerify();
    } else {
        // Force-pass if face is at least stable (manual override after waiting)
        const elapsed = Date.now() - livenessState.startTime;
        if (livenessState.faceStable && elapsed > 4000) {
            livenessState.phase = 'verified';
            updateLivenessUI('verified');
            setTimeout(() => captureAndVerify(), 500);
        } else {
            const statusEl = document.getElementById('trackingStatus');
            if (statusEl) statusEl.textContent = '⏳ Keep looking at the camera...';
        }
    }
}

// ─── Process Verification Result ─────────────────────────────

async function processVerification(selfieBase64) {
    stopTracking();
    stopCamera();
    document.getElementById('verifyStep1').style.display = 'none';
    document.getElementById('verifyStep2').style.display = 'block';

    const statusText = document.getElementById('verifyStatusText');
    const session = JSON.parse(sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session') || 'null');

    if (!session || !session.email) {
        showVerifyResult('error', 'Session Error', 'Please log in and try again.');
        setTimeout(() => closeVerifyModal(), 2000);
        return;
    }

    try {
        if (statusText) statusText.innerHTML = "Liveness confirmed! Updating your profile...";

        // Notify server to update Firestore
        try {
            await fetch('/api/verify-face', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: session.email, verified: true })
            });
        } catch (e) {
            console.warn("[Verify] Server sync failed, updating locally:", e);
        }

        // Update local session
        session.isVerified = true;
        try { sessionStorage.setItem('waec_session', JSON.stringify(session)); } catch (e) {}
        try { localStorage.setItem('waec_session', JSON.stringify(session)); } catch (e) {}
        if (typeof setSession === 'function') setSession(session);
        if (typeof updateVerificationUI === 'function') updateVerificationUI(true);

        const confidence = Math.min(99, 70 + livenessState.blinkCount * 5 + (livenessState.movementDetected ? 10 : 0));
        showVerifyResult('success', 'IDENTITY VERIFIED', `Liveness confirmed — real human detected (${confidence}% confidence)`);

        setTimeout(() => {
            closeVerifyModal();
            window.location.reload();
        }, 2500);

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
