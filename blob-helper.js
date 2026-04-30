// Blob Helper - Utilities for working with Vercel Blob Storage
// Handles CORS issues by proxying requests through our API

/**
 * Get a CORS-safe URL for a Vercel Blob
 * @param {string} blobUrl - The original Vercel Blob URL
 * @returns {string} - Proxied URL that works with CORS
 */
export function getProxiedBlobUrl(blobUrl) {
  if (!blobUrl) return '';
  
  // If it's already a proxied URL, return as-is
  if (blobUrl.includes('/api/blob-proxy')) {
    return blobUrl;
  }
  
  // If it's a Vercel Blob URL, proxy it
  if (blobUrl.startsWith('https://blob.vercel-storage.com/')) {
    return `/api/blob-proxy?url=${encodeURIComponent(blobUrl)}`;
  }
  
  // Otherwise return as-is
  return blobUrl;
}

/**
 * Download a blob file
 * @param {string} blobUrl - The Vercel Blob URL
 * @param {string} filename - The filename to save as
 */
export async function downloadBlob(blobUrl, filename) {
  try {
    const proxiedUrl = getProxiedBlobUrl(blobUrl);
    
    const response = await fetch(proxiedUrl);
    if (!response.ok) {
      throw new Error('Failed to download file');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

/**
 * Open a blob in a new tab
 * @param {string} blobUrl - The Vercel Blob URL
 */
export function openBlob(blobUrl) {
  const proxiedUrl = getProxiedBlobUrl(blobUrl);
  window.open(proxiedUrl, '_blank');
}

/**
 * Get blob metadata
 * @param {string} blobUrl - The Vercel Blob URL
 * @returns {Promise<Object>} - Blob metadata
 */
export async function getBlobMetadata(blobUrl) {
  try {
    const proxiedUrl = getProxiedBlobUrl(blobUrl);
    
    const response = await fetch(proxiedUrl, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error('Failed to get blob metadata');
    }
    
    return {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      lastModified: response.headers.get('last-modified'),
      etag: response.headers.get('etag')
    };
  } catch (error) {
    console.error('Metadata error:', error);
    throw error;
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.getProxiedBlobUrl = getProxiedBlobUrl;
  window.downloadBlob = downloadBlob;
  window.openBlob = openBlob;
  window.getBlobMetadata = getBlobMetadata;
}
