// src/utils/imageUtils.js

/**
 * Configuration object for image paths
 */
const IMAGE_CONFIG = {
  // Base path for images in development
  devPath: '/',
  // Base path for images in production
  prodPath: '/',
  // Valid image directories
  validDirs: ['img', 'images', 'assets'],
  // Valid image extensions
  validExtensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']
};

/**
 * Validates and normalizes image paths for both development and production environments
 * 
 * @param {string} imagePath - The image path to process
 * @returns {string} - The processed image path
 * @throws {Error} - If the image path is invalid
 * 
 * @example
 * // Returns "/img/example.jpg"
 * getImagePath('img/example.jpg')
 * 
 * @example
 * // Returns "/img/example.jpg"
 * getImagePath('/img/example.jpg')
 */
export const getImagePath = (imagePath) => {
  if (!imagePath) {
    console.warn('Image path is empty or undefined');
    return '';
  }

  try {
    // Remove leading/trailing slashes and clean the path
    const cleanPath = imagePath.replace(/^\/+|\/+$/g, '');
    
    // Get the directory and filename
    const [directory] = cleanPath.split('/');
    const extension = cleanPath.split('.').pop().toLowerCase();

    // Validate directory
    if (!IMAGE_CONFIG.validDirs.includes(directory)) {
      console.warn(`Warning: Image directory "${directory}" is not in the standard directories: ${IMAGE_CONFIG.validDirs.join(', ')}`);
    }

    // Validate extension
    if (!IMAGE_CONFIG.validExtensions.includes(extension)) {
      console.warn(`Warning: File extension "${extension}" may not be supported. Valid extensions: ${IMAGE_CONFIG.validExtensions.join(', ')}`);
    }

    // Determine base path based on environment
    const basePath = import.meta.env.PROD ? IMAGE_CONFIG.prodPath : IMAGE_CONFIG.devPath;

    // Construct final path
    return `${basePath}${cleanPath}`;

  } catch (error) {
    console.error('Error processing image path:', error);
    return imagePath; // Return original path as fallback
  }
};

/**
 * Gets the complete URL for an image including the site base URL
 * Useful for social media tags and absolute URLs
 * 
 * @param {string} imagePath - The image path to process
 * @returns {string} - The complete URL
 */
export const getFullImageUrl = (imagePath) => {
  const baseUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || '';
  const processedPath = getImagePath(imagePath);
  return `${baseUrl}${processedPath}`;
};
