import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Transforms Cloudinary URLs to serve modern WebP/AVIF, auto-quality, and proper dimensions.
 * Falls back safely to original URL if not a Cloudinary upload.
 */
export function optimizeCloudinaryUrl(url, { width, height, crop = 'fill', gravity = 'face' } = {}) {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return url;
  }

  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  const afterUpload = url.slice(uploadIndex + 8);
  if (afterUpload.startsWith('f_auto') || afterUpload.startsWith('w_') || afterUpload.startsWith('q_')) {
    return url;
  }

  const transformParts = ['f_auto', 'q_auto'];
  if (width) transformParts.push(`w_${width}`);
  if (height) transformParts.push(`h_${height}`);
  if (crop && (width || height)) transformParts.push(`c_${crop}`);
  if (gravity && crop === 'fill') transformParts.push(`g_${gravity}`);

  return `${url.slice(0, uploadIndex + 8)}${transformParts.join(',')}/${afterUpload}`;
}
