import { v2 as cloudinary } from 'cloudinary';
import { ENV } from './_core/env';
import { debugLog } from './_core/debug';

// Explicitly configure Cloudinary using our ENV object
if (ENV.cloudinaryUrl) {
  cloudinary.config({
    cloudinary_url: ENV.cloudinaryUrl
  });
}

/**
 * Uploads a file to Cloudinary.
 * Signature matches the original storagePut for compatibility.
 * 
 * @param relKey The relative path/filename (used as public_id)
 * @param data The file data (Buffer, Uint8Array, or string)
 * @param contentType The MIME type (optional for Cloudinary)
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (!ENV.cloudinaryUrl) {
    throw new Error("Cloudinary configuration missing: set CLOUDINARY_URL in .env");
  }

  // Cloudinary public_id typically doesn't include the extension as part of the ID itself
  // but we can strip or keep it depending on the desired behavior.
  // We'll keep it to maintain path compatibility.
  const publicId = normalizeKey(relKey);

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      public_id: publicId,
      resource_type: "auto" as const,
    };

    // Convert data to a base64 string or URI for Cloudinary uploader if it's a Buffer
    let uploadSource: string;
    if (Buffer.isBuffer(data)) {
      const base64 = data.toString('base64');
      uploadSource = `data:${contentType};base64,${base64}`;
    } else if (typeof data === 'string') {
      uploadSource = data;
    } else {
      // Uint8Array
      const base64 = Buffer.from(data).toString('base64');
      uploadSource = `data:${contentType};base64,${base64}`;
    }

    cloudinary.uploader.upload(uploadSource, uploadOptions, (error, result) => {
      if (error) {
        console.error("[Cloudinary] Upload failed:", error);
        return reject(new Error(`Cloudinary upload failed: ${error.message}`));
      }
      if (!result) {
        return reject(new Error("Cloudinary upload failed: No result returned"));
      }

      debugLog("UPLOAD RESULT", result);

      resolve({
        key: result.public_id,
        url: result.secure_url || result.url,
      });
    });
  });
}

/**
 * Gets the URL for a previously uploaded file.
 * Cloudinary URLs are persistent once uploaded.
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  // For Cloudinary, we can generate the URL using the SDK if we know the cloud name
  // but usually, we store the full URL in the DB.
  // This helper generates a standard secure URL for the key.
  const url = cloudinary.url(key, { secure: true });
  return { key, url };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}
