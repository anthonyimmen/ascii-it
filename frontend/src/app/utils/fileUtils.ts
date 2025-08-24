import axios from 'axios';

// Format file size for display
export const formatFileSize = (size: number): string => {
  return size < 1024 * 1024 
    ? `${Math.round(size / 1024)} KB` 
    : `${(size / 1024 / 1024).toFixed(1)} MB`;
};

// Clean up object URLs to prevent memory leaks
export const cleanupObjectURL = (url: string | null) => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};

export const fetchProfileInfo = async (twitterUsername: string) => {
  const response = await axios.get(`/api/twitter/${twitterUsername}`);
  return response.data;
}