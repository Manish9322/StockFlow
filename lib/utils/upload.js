/**
 * Uploads multiple image files to Cloudinary via API endpoint.
 * @param {File[]} files - Array of image files to upload
 * @returns {Promise<string[]>} - Array of URLs of uploaded images
 */
export async function uploadMultipleImages(files) {
  if (!files || files.length === 0) {
    return [];
  }

  try {
    // Create form data to send files to the API
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });

    // Check if we're on an admin route to determine which token to use
    const isAdminRoute = typeof window !== 'undefined' ? window.location.pathname.startsWith('/admin') : false;
    
    // Get the appropriate authentication token
    const token = isAdminRoute 
      ? (typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null)
      : (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    
    // Call the upload API endpoint
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload images');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to upload images');
    }

    return result.urls || [];
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
}

/**
 * Deletes a file from Cloudinary using its public URL via API endpoint.
 * @param {string} fileUrl - The full Cloudinary URL of the file to delete.
 * @returns {Promise<boolean>} - True if deletion was successful, false otherwise.
 */
export async function deleteFile(fileUrl) {
  try {
    // Check if we're on an admin route to determine which token to use
    const isAdminRoute = typeof window !== 'undefined' ? window.location.pathname.startsWith('/admin') : false;
    
    // Get the appropriate authentication token
    const token = isAdminRoute 
      ? (typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null)
      : (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    
    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ fileUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error deleting file from Cloudinary:', errorData.error);
      return false;
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return false;
  }
}
