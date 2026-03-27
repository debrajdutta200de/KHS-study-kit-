/**
 * Image Upload Utility Service
 * 
 * Handles image file validation, compression, and upload to Supabase Storage.
 * Provides robust error handling and user-friendly feedback.
 */

import { supabase } from '@/db/supabase';

// Configuration
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_DIMENSION = 1080; // Max width/height in pixels
const COMPRESSION_QUALITY = 0.8;

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
    };
  }

  // Check file size (initial check)
  if (file.size > MAX_FILE_SIZE * 5) { // Allow up to 5MB before compression
    return {
      valid: false,
      error: 'File is too large. Maximum size is 5MB.'
    };
  }

  return { valid: true };
}

/**
 * Compress image if needed
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = (height / width) * MAX_DIMENSION;
            width = MAX_DIMENSION;
          } else {
            width = (width / height) * MAX_DIMENSION;
            height = MAX_DIMENSION;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to WebP for better compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/webp',
          COMPRESSION_QUALITY
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Generate safe filename
 */
function generateSafeFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'webp';
  
  // Remove special characters and spaces
  const safeName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9]/g, '_') // Replace special chars with underscore
    .toLowerCase()
    .substring(0, 20); // Limit length
  
  return `${safeName}_${timestamp}_${random}.${extension}`;
}

/**
 * Convert blob to base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove data:image/...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; size: number; compressed: boolean }> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    onProgress?.(10);

    // Check if compression is needed
    let fileToUpload: File | Blob = file;
    let compressed = false;
    
    if (file.size > MAX_FILE_SIZE) {
      onProgress?.(20);
      console.log('Compressing image...');
      fileToUpload = await compressImage(file);
      compressed = true;
      onProgress?.(40);
    } else {
      onProgress?.(30);
    }

    // Generate safe filename
    const filename = generateSafeFilename(file.name);
    const filePath = `${userId}/${filename}`;

    onProgress?.(50);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(`${import.meta.env.VITE_APP_ID}_textbook_images`)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    onProgress?.(80);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(`${import.meta.env.VITE_APP_ID}_textbook_images`)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    onProgress?.(100);

    return {
      url: urlData.publicUrl,
      size: fileToUpload.size,
      compressed
    };
  } catch (error) {
    console.error('Image upload error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to upload image. Please try again.');
  }
}

/**
 * Convert image to base64 for OCR processing
 */
export async function imageToBase64(file: File): Promise<string> {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Compress if needed
    let fileToProcess: File | Blob = file;
    if (file.size > MAX_FILE_SIZE) {
      fileToProcess = await compressImage(file);
    }

    return await blobToBase64(fileToProcess);
  } catch (error) {
    console.error('Image to base64 error:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Delete image from storage
 */
export async function deleteImage(url: string, userId: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const filePath = `${userId}/${filename}`;

    const { error } = await supabase.storage
      .from(`${import.meta.env.VITE_APP_ID}_textbook_images`)
      .remove([filePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Image deletion error:', error);
    // Don't throw error for deletion failures
  }
}

export default {
  validateImageFile,
  uploadImage,
  imageToBase64,
  deleteImage
};
