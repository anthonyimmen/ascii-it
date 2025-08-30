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

// Normalize Twitter profile image URL to higher resolution if possible
export const getHighResProfileImageUrl = (url: string): string => {
  try {
    let out = url;
    // Replace legacy suffixes
    out = out.replace(/_normal(\.[a-zA-Z]+)(\?.*)?$/, '_400x400$1$2');
    out = out.replace(/_mini(\.[a-zA-Z]+)(\?.*)?$/, '_400x400$1$2');
    out = out.replace(/_bigger(\.[a-zA-Z]+)(\?.*)?$/, '_400x400$1$2');
    // Replace query name=normal|bigger|mini with 400x400
    out = out.replace(/([?&])name=(normal|bigger|mini)(&|$)/, '$1name=400x400$3');
    return out;
  } catch {
    return url;
  }
};

// Try to request the high-res banner variant
export const getHighResBannerUrl = (url: string): string => {
  try {
    // Banner URLs can accept size suffix like /1500x500
    if (/\/\d+x\d+(\?|$)/.test(url)) {
      return url.replace(/\/\d+x\d+(\?|$)/, '/1500x500$1');
    }
    if (/\.(jpg|png)(\?.*)?$/.test(url)) {
      // Append size segment
      const [base, query = ''] = url.split('?');
      return `${base}/1500x500${query ? `?${query}` : ''}`;
    }
    return url.endsWith('/') ? `${url}1500x500` : `${url}/1500x500`;
  } catch {
    return url;
  }
};
