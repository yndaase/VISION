/**
 * VISION Identity Verification System
 * Dual-Check: National ID Name OCR + Live Face Detection
 * This is the CANONICAL verification flow — all entry points route here.
 */

let stream = null;
let idImageBase64 = null;
let currentFacingMode = 'user';

function openVerifyModal() {
    document.getElementById('verifyModal').style.display = 'flex';
    resetVerifySteps();
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
    
    // Reset ID upload state
    idImageBase64 = null;
    const preview = document.getElementById('idCardPreview');
    const placeholder = document.getElementById('idUploadPlaceholder');
    const nextBtn = document.getElementById('idNextBtn');
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    if (placeholder) placeholder.style.display = 'flex';
    if (nextBtn) { nextBtn.disabled = true; nextBtn.style.opacity = '0.4'; }
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

    // Shutter effect
    if (overlay) {
        overlay.style.opacity = '1';
        setTimeout(() => overlay.style.opacity = '0', 120);
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const selfieBase64 = canvas.toDataURL('image/jpeg', 0.4);
    if (preview) preview.src = selfieBase64;
    
    processVerification(selfieBase64);
}

// ─── STEP 3: Dual Verification ──────────────────────────────

async function processVerification(selfieBase64) {
    stopCamera();
    document.getElementById('verifyStep2').style.display = 'none';
    document.getElementById('verifyStep3').style.display = 'block';
    
    const statusText = document.getElementById('verifyStatusText');
    const statusIcon = document.getElementById('verifyStatusIcon');
    const session = JSON.parse(sessionStorage.getItem('waec_session') || localStorage.getItem('waec_session') || 'null');
    
    if (!session || !session.email) {
        showVerifyResult('error', 'Session Error', 'Please log in and try again.');
        setTimeout(() => closeVerifyModal(), 2000);
        return;
    }

    try {
        // Phase 1 indicator
        if (statusText) statusText.innerHTML = "Comparing faces...<br><span style='font-size:0.75rem; color:var(--text-muted);'>Matching your ID photo against your selfie</span>";
        
        const res = await fetch('/api/verify-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                selfieBase64,
                idBase64: idImageBase64,
                email: session.email
            })
        });
        
        const result = await res.json();
        
        if (result.match) {
            showVerifyResult('success', 'IDENTITY VERIFIED', 'Both ID and face checks passed.');
            
            // Update local session
            session.isVerified = true;
            try { sessionStorage.setItem('waec_session', JSON.stringify(session)); } catch(e) {}
            try { localStorage.setItem('waec_session', JSON.stringify(session)); } catch(e) {}
            if (typeof setSession === 'function') setSession(session);
            if (typeof updateVerificationUI === 'function') updateVerificationUI(true);
            
            setTimeout(() => {
                closeVerifyModal();
                window.location.reload();
            }, 2000);
        } else {
            // Show which phase failed
            const phase = result.phase || 'unknown';
            const phaseLabel = phase === 'id' ? 'ID Name Check Failed' : phase === 'face' ? 'Face Detection Failed' : 'Verification Failed';
            
            showVerifyResult('error', phaseLabel, result.error || 'Please try again.');
            
            setTimeout(() => resetVerifySteps(), 4000);
        }
    } catch (err) {
        console.error("[Verification] System Error:", err);
        showVerifyResult('error', 'Connection Error', 'Please check your internet and try again.');
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
