import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

let exportedCloudinary = cloudinary;

if (CLOUD_NAME && API_KEY && API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  });
  exportedCloudinary = cloudinary;
} else {
  console.warn('Cloudinary credentials not found in env — uploads will use a local fallback (data URLs)');
  // Provide a minimal stub that mimics cloudinary.uploader.upload
  exportedCloudinary = {
    uploader: {
      async upload(dataUrl, options = {}) {
        // If dataUrl is already a data URL, return it as secure_url so callers can display it directly.
        return { secure_url: dataUrl };
      },
    },
  };
}

export default exportedCloudinary;
