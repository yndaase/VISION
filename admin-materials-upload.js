// Admin Materials Upload Handler
// Handles file uploads to Cloudflare R2 Storage for learning materials

let selectedFile = null;
let recentMaterials = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeUploadArea();
  initializeForm();
  loadRecentMaterials();
});

// Initialize drag-and-drop upload area
function initializeUploadArea() {
  const uploadArea = document.getElementById('fileUploadArea');
  const fileInput = document.getElementById('fileInput');

  // Click to upload
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // File selected
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });
}

// Handle file selection
function handleFileSelect(file) {
  // Validate file size (50MB max)
  const maxSize = 50 * 1024 * 1024; // 50MB limit
  if (file.size > maxSize) {
    showAlert('error', 'File size exceeds 50MB limit. Please use a smaller file.');
    return;
  }

  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png'
  ];

  if (!allowedTypes.includes(file.type)) {
    showAlert('error', 'Invalid file type. Please upload PDF, DOCX, PPTX, or images.');
    return;
  }

  selectedFile = file;
  displayFileInfo(file);
}

// Display selected file info
function displayFileInfo(file) {
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');

  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  fileInfo.classList.add('show');
}

// Remove selected file
function removeFile() {
  selectedFile = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('fileInfo').classList.remove('show');
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Initialize form submission
function initializeForm() {
  const form = document.getElementById('uploadForm');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      showAlert('error', 'Please select a file to upload');
      return;
    }

    await uploadMaterial();
  });
}

// Upload material to Cloudflare R2
async function uploadMaterial() {
  const uploadBtn = document.getElementById('uploadBtn');
  const progressContainer = document.getElementById('progressContainer');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  // Get form data
  const subject = document.getElementById('subject').value;
  const materialType = document.getElementById('materialType').value;
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;

  // Disable upload button
  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';
  progressContainer.style.display = 'block';

  try {
    const ADMIN_SESSION_KEY = "vision_admin_at";
    const adminSession = sessionStorage.getItem(ADMIN_SESSION_KEY);
    const authHeader = `Bearer ${adminSession || ''}`;

    // 1. Smart Upload Router: Choose method based on file size
    progressText.textContent = 'Preparing upload...';
    progressFill.style.width = '10%';

    const timestamp = Date.now();
    const fileKey = `materials/${subject}/${timestamp}_${selectedFile.name}`;
    
    // Determine upload method
    const API_PROXY_LIMIT = 4 * 1024 * 1024; // 4MB
    const useDirectUpload = selectedFile.size >= API_PROXY_LIMIT;
    
    let uploadSuccess = false;
    
    if (useDirectUpload) {
      // Large file: Try direct upload to R2 first (no size limit)
      console.log(`[Upload] Large file (${formatFileSize(selectedFile.size)}), using direct R2 upload`);
      progressText.textContent = 'Uploading large file directly to R2...';
      progressFill.style.width = '20%';
      
      try {
        // Get pre-signed URL
        const urlResponse = await fetch(`/api/upload?action=get-upload-url&fileKey=${encodeURIComponent(fileKey)}&contentType=${encodeURIComponent(selectedFile.type)}`, {
          method: 'GET',
          headers: { 'Authorization': authHeader }
        });
        
        if (urlResponse.ok) {
          const { uploadUrl } = await urlResponse.json();
          
          // Upload directly to R2
          progressText.textContent = 'Uploading to storage...';
          progressFill.style.width = '50%';
          
          const r2Response = await fetch(uploadUrl, {
            method: 'PUT',
            body: selectedFile,
            headers: {
              'Content-Type': selectedFile.type
            }
          });
          
          if (r2Response.ok) {
            console.log('[Upload] ✅ Direct R2 upload successful');
            uploadSuccess = true;
          } else {
            console.warn('[Upload] ⚠️ Direct R2 upload failed, will try API proxy');
          }
        }
      } catch (directError) {
        console.warn('[Upload] ⚠️ Direct upload error:', directError.message);
      }
    }
    
    // Fallback: Use API proxy for small files or if direct upload failed
    if (!uploadSuccess) {
      if (selectedFile.size >= API_PROXY_LIMIT) {
        console.log('[Upload] Falling back to API proxy (may fail if file > 4.5MB)');
        progressText.textContent = 'Retrying via API proxy...';
      } else {
        console.log(`[Upload] Small file (${formatFileSize(selectedFile.size)}), using API proxy`);
        progressText.textContent = 'Uploading file to storage...';
      }
      
      progressFill.style.width = '30%';

      const r2Response = await fetch(`/api/upload?action=upload&fileKey=${encodeURIComponent(fileKey)}&contentType=${encodeURIComponent(selectedFile.type)}`, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Authorization': authHeader,
          'Content-Type': selectedFile.type
        }
      });

      if (!r2Response.ok) {
        const errorData = await r2Response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Upload] ❌ API proxy upload failed:', errorData);
        
        // Handle specific error codes
        if (r2Response.status === 413) {
          throw new Error('File too large for API proxy (>4.5MB). Direct R2 upload also failed. Please check CORS configuration in Cloudflare R2 dashboard.');
        }
        
        throw new Error(errorData.error || 'Failed to upload file to R2');
      }
      
      console.log('[Upload] ✅ API proxy upload successful');
    }
    
    progressFill.style.width = '70%';
    
    progressFill.style.width = '70%';
    progressText.textContent = 'Saving metadata...';

    // Create material metadata
    const material = {
      id: timestamp.toString(),
      title: title,
      description: description,
      subject: subject,
      type: materialType,
      fileName: selectedFile.name,
      size: formatFileSize(selectedFile.size),
      fileSize: selectedFile.size,
      url: fileKey, // R2 key for download API
      blobUrl: fileKey, // Keep for backward compatibility
      uploadedAt: new Date().toISOString(),
      uploadedBy: sessionStorage.getItem('vision_admin_email') || 'admin'
    };

    // Save to Firebase (if available) or localStorage
    if (typeof window.fbSaveMaterial === 'function') {
      await window.fbSaveMaterial(material);
    } else {
      // Fallback to localStorage
      const materials = JSON.parse(localStorage.getItem('vision_materials') || '[]');
      materials.unshift(material);
      localStorage.setItem('vision_materials', JSON.stringify(materials));
    }

    progressFill.style.width = '100%';
    progressText.textContent = 'Upload complete!';

    // Show success message
    showAlert('success', `Material "${title}" uploaded successfully!`);

    // Reset form
    setTimeout(() => {
      document.getElementById('uploadForm').reset();
      removeFile();
      progressContainer.style.display = 'none';
      progressFill.style.width = '0%';
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload to Cloudflare R2';
      
      // Reload recent materials
      loadRecentMaterials();
    }, 2000);

  } catch (error) {
    console.error('Upload error:', error);
    showAlert('error', 'Upload failed: ' + error.message);
    
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload to Cloudflare R2';
    progressContainer.style.display = 'none';
    progressFill.style.width = '0%';
  }
}

// Load recent materials
async function loadRecentMaterials() {
  try {
    let materials = [];

    // Try to load from Firebase first
    if (typeof window.fbGetMaterials === 'function') {
      materials = await window.fbGetMaterials();
    } else {
      // Fallback to localStorage
      materials = JSON.parse(localStorage.getItem('vision_materials') || '[]');
    }

    // Sort by upload date (newest first)
    materials.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    // Display only the 10 most recent
    recentMaterials = materials.slice(0, 10);
    renderRecentMaterials();

  } catch (error) {
    console.error('Error loading materials:', error);
  }
}

// Render recent materials list
function renderRecentMaterials() {
  const container = document.getElementById('uploadedList');

  if (recentMaterials.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No materials uploaded yet.</p>';
    return;
  }

  const subjectNames = {
    'core-maths': 'Core Mathematics',
    'english': 'English Language',
    'social': 'Social Studies',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'biology': 'Biology',
    'economics': 'Economics',
    'cs': 'Computer Science',
    'science': 'Integrated Science'
  };

  const typeNames = {
    'notes': 'Study Notes',
    'slides': 'Presentation Slides',
    'worksheet': 'Worksheet',
    'guide': 'Study Guide',
    'reference': 'Reference Material',
    'practice': 'Practice Questions'
  };

  container.innerHTML = recentMaterials.map(material => `
    <div class="uploaded-item">
      <div class="item-info">
        <div class="item-title">${material.title}</div>
        <div class="item-meta">
          ${subjectNames[material.subject] || material.subject} • 
          ${typeNames[material.type] || material.type} • 
          ${formatFileSize(material.fileSize)} • 
          ${new Date(material.uploadedAt).toLocaleDateString()}
        </div>
      </div>
      <button class="btn-delete" onclick="deleteMaterial('${material.id}')">Delete</button>
    </div>
  `).join('');
}

// Delete material
async function deleteMaterial(id) {
  if (!confirm('Are you sure you want to delete this material?')) {
    return;
  }

  try {
    // Delete from Firebase (if available) or localStorage
    if (typeof window.fbDeleteMaterial === 'function') {
      await window.fbDeleteMaterial(id);
    } else {
      // Fallback to localStorage
      let materials = JSON.parse(localStorage.getItem('vision_materials') || '[]');
      materials = materials.filter(m => m.id !== id);
      localStorage.setItem('vision_materials', JSON.stringify(materials));
    }

    showAlert('success', 'Material deleted successfully');
    loadRecentMaterials();

  } catch (error) {
    console.error('Delete error:', error);
    showAlert('error', 'Failed to delete material: ' + error.message);
  }
}

// Show alert message
function showAlert(type, message) {
  const alertSuccess = document.getElementById('alertSuccess');
  const alertError = document.getElementById('alertError');

  // Hide all alerts first
  alertSuccess.classList.remove('show');
  alertError.classList.remove('show');

  // Show appropriate alert
  if (type === 'success') {
    alertSuccess.textContent = message;
    alertSuccess.classList.add('show');
    setTimeout(() => alertSuccess.classList.remove('show'), 5000);
  } else {
    alertError.textContent = message;
    alertError.classList.add('show');
    setTimeout(() => alertError.classList.remove('show'), 5000);
  }

  // Scroll to top to show alert
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
