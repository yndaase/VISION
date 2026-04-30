// Admin WAEC Upload Script
// Handles file uploads to Vercel Blob Storage

// Auth guard - Admin only
const session = checkAuth();
if (!session || session.role !== 'admin') {
  window.location.href = '/dashboard';
  throw new Error("Admin access required");
}

let selectedFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeFileUpload();
  loadRecentUploads();
});

// Initialize file upload handlers
function initializeFileUpload() {
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileInput = document.getElementById('fileInput');
  const uploadForm = document.getElementById('uploadForm');

  // Click to upload
  fileUploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // File selection
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  });

  // Drag and drop
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
  });

  fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('dragover');
  });

  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      handleFileSelect(file);
    } else {
      showAlert('error', 'Please upload a PDF file');
    }
  });

  // Form submission
  uploadForm.addEventListener('submit', handleUpload);
}

// Handle file selection
function handleFileSelect(file) {
  if (file.type !== 'application/pdf') {
    showAlert('error', 'Only PDF files are allowed');
    return;
  }

  if (file.size > 50 * 1024 * 1024) { // 50MB
    showAlert('error', 'File size must be less than 50MB');
    return;
  }

  selectedFile = file;

  // Show file info
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = formatFileSize(file.size);
  document.getElementById('fileInfo').classList.add('show');
}

// Remove selected file
function removeFile() {
  selectedFile = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('fileInfo').classList.remove('show');
}

// Handle form upload
async function handleUpload(e) {
  e.preventDefault();

  if (!selectedFile) {
    showAlert('error', 'Please select a PDF file');
    return;
  }

  const subject = document.getElementById('subject').value;
  const year = document.getElementById('year').value;
  const paperType = document.getElementById('paperType').value;
  const duration = document.getElementById('duration').value;
  const questions = document.getElementById('questions').value;
  const title = document.getElementById('title').value;

  if (!subject || !year || !paperType) {
    showAlert('error', 'Please fill in all required fields');
    return;
  }

  const uploadBtn = document.getElementById('uploadBtn');
  const originalText = uploadBtn.textContent;
  uploadBtn.textContent = 'Uploading...';
  uploadBtn.disabled = true;

  try {
    // Convert file to base64
    const fileData = await fileToBase64(selectedFile);

    // Prepare upload data
    const uploadData = {
      subject,
      year,
      paperType,
      duration,
      questions: questions ? parseInt(questions) : null,
      title: title || `WAEC ${subject} ${year} - ${paperType}`,
      fileData: fileData.split(',')[1], // Remove data:application/pdf;base64, prefix
      fileName: selectedFile.name
    };

    // Upload to API
    const response = await fetch('/api/waec-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token || ''}`
      },
      body: JSON.stringify(uploadData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const result = await response.json();

    // Success
    showAlert('success', `Successfully uploaded: ${result.question.title}`);
    
    // Reset form
    document.getElementById('uploadForm').reset();
    removeFile();
    
    // Reload recent uploads
    loadRecentUploads();

  } catch (error) {
    console.error('Upload error:', error);
    showAlert('error', `Upload failed: ${error.message}`);
  } finally {
    uploadBtn.textContent = originalText;
    uploadBtn.disabled = false;
  }
}

// Load recent uploads
async function loadRecentUploads() {
  try {
    const response = await fetch('/api/waec-questions', {
      headers: {
        'Authorization': `Bearer ${session.token || ''}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load uploads');
    }

    const data = await response.json();
    const questions = data.questions || [];

    // Sort by upload date (newest first)
    questions.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    // Display recent 10
    const recentQuestions = questions.slice(0, 10);
    renderUploadedList(recentQuestions);

  } catch (error) {
    console.error('Error loading uploads:', error);
  }
}

// Render uploaded list
function renderUploadedList(questions) {
  const container = document.getElementById('uploadedList');

  if (questions.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No uploads yet</p>';
    return;
  }

  container.innerHTML = questions.map(q => `
    <div class="uploaded-item">
      <div class="item-info">
        <div class="item-title">${q.title}</div>
        <div class="item-meta">
          ${q.subject} • ${q.year} • ${q.paperType} • 
          Uploaded ${formatDate(q.uploadedAt)}
        </div>
      </div>
      <button class="btn-delete" onclick="deleteQuestion('${q.id}')">Delete</button>
    </div>
  `).join('');
}

// Delete question
async function deleteQuestion(questionId) {
  if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`/api/waec-questions?id=${questionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.token || ''}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete question');
    }

    showAlert('success', 'Question deleted successfully');
    loadRecentUploads();

  } catch (error) {
    console.error('Delete error:', error);
    showAlert('error', `Delete failed: ${error.message}`);
  }
}

// Utility: Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Utility: Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Utility: Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Show alert message
function showAlert(type, message) {
  const alertId = type === 'success' ? 'alertSuccess' : 'alertError';
  const alert = document.getElementById(alertId);
  
  alert.textContent = message;
  alert.classList.add('show');

  setTimeout(() => {
    alert.classList.remove('show');
  }, 5000);
}

// Export for global access
window.removeFile = removeFile;
window.deleteQuestion = deleteQuestion;
