import api from '../utils/api'; // Import your custom axios instance
import { handleApiError } from '../utils/handleApiError';

// The API_URL is now handled by the 'api' instance's baseURL,
// so you just need the specific endpoint path.
const UPLOAD_ENDPOINT = '/upload'; // The specific endpoint for file uploads

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('files', file); // 'files' must match backend multer array name

  try {
    // Use the 'api' instance which already has the token interceptor
    const response = await api.post(UPLOAD_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Essential for file uploads
      },
      // withCredentials is already configured in api.js, but explicitly including doesn't hurt
    });
    
    if (response.data?.files?.length > 0) {
      return response.data.files[0]; // Return the first uploaded file's info
    }

    throw new Error('No files returned from server');
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = handleApiError(error) || 'File upload failed';
    throw new Error(errorMessage);
  }
};

export default uploadFile;