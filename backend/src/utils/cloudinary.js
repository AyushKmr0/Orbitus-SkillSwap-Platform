import cloudinary, { ensureCloudinaryConfig } from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';

/**
 * Check whether Cloudinary credentials are fully configured in the environment.
 */
export const cloudinaryConfigured = () => {
  ensureCloudinaryConfig();
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Upload any local file to Cloudinary and automatically cleans up the local temporary file.
 * @param {string} localFilePath - Path to local file on disk
 * @param {object} options - Optional Cloudinary upload options
 * @returns {Promise<object|null>} - Cloudinary upload response object or null
 */
export const uploadOnCloudinary = async (localFilePath, options = {}) => {
  if (!localFilePath) return null;

  ensureCloudinaryConfig();
  if (!cloudinaryConfigured()) {
    return null;
  }

  try {
    const uploadOptions = {
      resource_type: options.resource_type || 'auto',
      folder: options.folder || 'orbitus',
      ...options,
    };

    const result = await cloudinary.uploader.upload(localFilePath, uploadOptions);

    if (fs.existsSync(localFilePath) && !options.keepLocalFile) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.warn('Could not remove temporary upload file:', err.message);
      }
    }

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    // Don't delete localFilePath so server can fall back to local static serving
    return null;
  }
};

/**
 * Upload a candidate resume to Cloudinary under the orbitus/resumes directory.
 */
export const uploadResumeToCloudinary = async (filePath, originalName = '') => {
  if (!cloudinaryConfigured()) return null;

  return cloudinary.uploader.upload(filePath, {
    folder: 'orbitus/resumes',
    resource_type: 'raw',
    use_filename: true,
    unique_filename: true,
    filename_override: originalName || undefined
  });
};

/**
 * Standardize Cloudinary metadata saved on user documents.
 */
export const buildCloudinaryResumeMeta = (uploadResult = null) => {
  if (!uploadResult?.public_id) return undefined;

  return {
    publicId: uploadResult.public_id,
    resourceType: uploadResult.resource_type || 'raw',
    type: uploadResult.type || 'upload',
    format: uploadResult.format || '',
    version: uploadResult.version
  };
};

/**
 * Parse public ID and resource details from a Cloudinary URL.
 */
export const parseCloudinaryResumeMeta = (resumeUrl = '') => {
  try {
    const parsed = new URL(resumeUrl);
    if (parsed.host !== 'res.cloudinary.com') return null;

    const parts = parsed.pathname.split('/').filter(Boolean);
    const resourceType = parts[1];
    const type = parts[2];
    const versionIndex = parts.findIndex(part => /^v\d+$/.test(part));
    const publicParts = parts.slice(versionIndex >= 0 ? versionIndex + 1 : 3);
    const fileName = publicParts[publicParts.length - 1] || '';
    const extensionMatch = fileName.match(/\.([a-z0-9]+)$/i);
    const format = extensionMatch?.[1] || '';
    const publicId = publicParts.join('/').replace(new RegExp(`\\.${format}$`, 'i'), '');

    if (!resourceType || !type || !publicId) return null;

    return {
      publicId,
      resourceType,
      type,
      format,
      version: versionIndex >= 0 ? Number(parts[versionIndex].slice(1)) : undefined
    };
  } catch {
    return null;
  }
};

/**
 * Generate a signed URL for reading private/raw Cloudinary resume assets securely.
 */
export const getSignedCloudinaryResumeUrl = (user) => {
  if (!cloudinaryConfigured()) return null;

  const meta = user.resumeCloudinary?.publicId
    ? user.resumeCloudinary
    : parseCloudinaryResumeMeta(user.resumeFile);

  if (!meta?.publicId) return null;

  const hasFormatInPublicId = meta.format && meta.publicId.toLowerCase().endsWith(`.${meta.format.toLowerCase()}`);

  return cloudinary.url(meta.publicId, {
    secure: true,
    sign_url: true,
    resource_type: meta.resourceType || 'raw',
    type: meta.type || 'upload',
    version: meta.version || undefined,
    format: !hasFormatInPublicId && meta.format ? meta.format : undefined
  });
};

/**
 * Delete an asset from Cloudinary.
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId || !cloudinaryConfigured()) return null;

  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
    return null;
  }
};

/**
 * Extract public_id from standard Cloudinary URL string.
 */
export const getPublicIdFromUrl = (url) => {
  if (!url) return '';
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return '';
    const afterUpload = parts.slice(uploadIndex + 1);
    const withVersion = afterUpload[0]?.match(/^v\d+$/) ? afterUpload.slice(1) : afterUpload;
    const joined = withVersion.join('/');
    return joined.replace(/\.[^/.]+$/, '');
  } catch {
    return '';
  }
};

export default {
  cloudinaryConfigured,
  uploadOnCloudinary,
  uploadResumeToCloudinary,
  buildCloudinaryResumeMeta,
  parseCloudinaryResumeMeta,
  getSignedCloudinaryResumeUrl,
  deleteFromCloudinary,
  getPublicIdFromUrl
};
