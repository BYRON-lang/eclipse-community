
/**
 * Image optimization utility for faster loading of images
 */

// Default image dimensions for optimization
const DEFAULT_WIDTH = 800;
const DEFAULT_QUALITY = 85;

/**
 * Optimizes an image URL for faster loading
 * 
 * @param url Original image URL
 * @param width Target width (default: 800px)
 * @param quality Image quality (default: 85)
 * @returns Optimized image URL or original URL if optimization not possible
 */
export const optimizeImage = (url: string | File, width: number = DEFAULT_WIDTH, quality: number = DEFAULT_QUALITY): string => {
  if (!url) return '';

  try {
    // Handle File objects
    if (url instanceof File) {
      return URL.createObjectURL(url);
    }
    
    // Check if using Firebase Storage URL
    if (url.includes('firebasestorage.googleapis.com')) {
      // Firebase Storage URLs can be modified to get optimized images
      // Add _width parameter to the download URL
      if (url.includes('?')) {
        return `${url}&w=${width}&q=${quality}`;
      } else {
        return `${url}?w=${width}&q=${quality}`;
      }
    }
    
    // Return original URL for URLs that can't be optimized
    return url;
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return typeof url === 'string' ? url : ''; // Return original URL if optimization fails
  }
};

/**
 * Optimizes an image file before upload
 * 
 * @param file Original file
 * @param maxWidth Maximum width (default: 1600px)
 * @param maxHeight Maximum height (default: 1600px)
 * @param quality Image quality (default: 85)
 * @returns Promise that resolves to optimized File object
 */
export const optimizeImageFile = (file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.85): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Only process image files
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create new file object
            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(optimizedFile);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, file.type, quality);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
};

/**
 * Creates a video thumbnail from a video file
 * 
 * @param videoFile The video file to create a thumbnail from
 * @param seekTime Time in seconds to capture the thumbnail (default: 1)
 * @returns Promise that resolves to a Blob containing the thumbnail image
 */
export const createVideoThumbnail = (videoFile: File, seekTime = 1): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Check if it's a video file
    if (!videoFile.type.startsWith('video/')) {
      reject(new Error('Not a video file'));
      return;
    }
    
    const videoUrl = URL.createObjectURL(videoFile);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.currentTime = seekTime;

    video.onloadeddata = () => {
      // Create a canvas to draw the thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw the video frame on the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Clean up
            URL.revokeObjectURL(videoUrl);
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
        },
        'image/jpeg',
        0.8
      );
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Error loading video'));
    };
    
    // Handle Safari which doesn't fire onloadeddata reliably
    setTimeout(() => {
      if (video.readyState >= 2) {
        video.dispatchEvent(new Event('loadeddata'));
      }
    }, 1000);
  });
};

/**
 * Generates a placeholder for an image while it's loading
 * 
 * @param width Width of the placeholder
 * @param height Height of the placeholder
 * @returns SVG placeholder as a data URL
 */
export const generatePlaceholder = (width = 400, height = 300): string => {
  // Create a SVG placeholder with a light gray background
  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f1f1f1"/>
      <circle cx="50%" cy="40%" r="${Math.min(width, height) * 0.15}" fill="#e1e1e1"/>
      <rect x="30%" y="55%" width="40%" height="20%" fill="#e1e1e1"/>
    </svg>
  `;
  
  // Convert to base64 data URL
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};
