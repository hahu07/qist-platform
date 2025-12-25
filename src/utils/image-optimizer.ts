/**
 * Image Optimization Utility
 * 
 * Compresses and resizes images before upload to reduce file size and improve
 * upload performance. Uses browser-native Canvas API for client-side processing.
 */

export interface ImageOptimizationOptions {
  /**
   * Maximum width in pixels (maintains aspect ratio)
   * @default 1920
   */
  maxWidth?: number;
  
  /**
   * Maximum height in pixels (maintains aspect ratio)
   * @default 1080
   */
  maxHeight?: number;
  
  /**
   * JPEG/WebP quality from 0 to 1
   * @default 0.85
   */
  quality?: number;
  
  /**
   * Output format
   * @default 'image/jpeg'
   */
  outputFormat?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface OptimizationResult {
  /** Optimized image as Blob */
  blob: Blob;
  /** Original file size in bytes */
  originalSize: number;
  /** Optimized file size in bytes */
  optimizedSize: number;
  /** Size reduction percentage (0-100) */
  reductionPercent: number;
  /** Original dimensions */
  originalDimensions: { width: number; height: number };
  /** Final dimensions */
  finalDimensions: { width: number; height: number };
}

/**
 * Optimizes an image file by compressing and resizing
 * 
 * @param file - The image file to optimize
 * @param options - Optimization options
 * @returns Promise resolving to OptimizationResult
 * 
 * @example
 * ```tsx
 * const result = await optimizeImage(file, {
 *   maxWidth: 1920,
 *   maxHeight: 1080,
 *   quality: 0.85,
 *   outputFormat: 'image/jpeg'
 * });
 * 
 * console.log(`Reduced by ${result.reductionPercent.toFixed(1)}%`);
 * // Upload result.blob to storage
 * ```
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizationResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    outputFormat = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    // Validate input
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Store original dimensions
        const originalDimensions = {
          width: img.width,
          height: img.height
        };

        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Round dimensions to integers
        width = Math.round(width);
        height = Math.round(height);

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedSize = blob.size;
              const originalSize = file.size;
              const reductionPercent = ((originalSize - optimizedSize) / originalSize) * 100;

              resolve({
                blob,
                originalSize,
                optimizedSize,
                reductionPercent: Math.max(0, reductionPercent),
                originalDimensions,
                finalDimensions: { width, height }
              });
            } else {
              reject(new Error('Image optimization failed: Could not create blob'));
            }
          },
          outputFormat,
          quality
        );
      } catch (error) {
        reject(new Error(`Image processing error: ${error}`));
      } finally {
        // Clean up
        URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image from file
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Checks if a file should be optimized
 * 
 * @param file - File to check
 * @param minSizeKB - Minimum file size in KB to trigger optimization (default: 500KB)
 * @returns true if file should be optimized
 */
export function shouldOptimizeImage(file: File, minSizeKB: number = 500): boolean {
  const minSizeBytes = minSizeKB * 1024;
  return file.type.startsWith('image/') && file.size > minSizeBytes;
}

/**
 * Gets recommended optimization options based on image purpose
 */
export function getPresetOptions(preset: 'photo' | 'logo' | 'document'): ImageOptimizationOptions {
  switch (preset) {
    case 'photo':
      // Director photos, business photos
      return {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        outputFormat: 'image/jpeg'
      };
    
    case 'logo':
      // Business logos, branding
      return {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.92,
        outputFormat: 'image/png' // Preserve transparency
      };
    
    case 'document':
      // Document scans, ID cards
      return {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.90,
        outputFormat: 'image/jpeg'
      };
    
    default:
      return {};
  }
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Batch optimize multiple images
 * 
 * @param files - Array of image files
 * @param options - Optimization options
 * @param onProgress - Progress callback (current, total)
 * @returns Promise resolving to array of OptimizationResults
 */
export async function optimizeImagesInBatch(
  files: File[],
  options: ImageOptimizationOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<OptimizationResult[]> {
  const results: OptimizationResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await optimizeImage(files[i], options);
      results.push(result);
      onProgress?.(i + 1, files.length);
    } catch (error) {
      console.error(`Failed to optimize ${files[i].name}:`, error);
      // Continue with other files even if one fails
    }
  }
  
  return results;
}
