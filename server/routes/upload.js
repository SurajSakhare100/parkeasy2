import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Store uploads in memory (buffer), not disk
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

/**
 * POST /api/upload
 * Upload up to 10 parking images to Cloudinary
 * Returns array of secure URLs
 */
router.post('/', protect, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'parkeasy/parkings',
            resource_type: 'image',
            transformation: [{ width: 1200, height: 800, crop: 'fill', quality: 'auto' }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      });
    });

    const urls = await Promise.all(uploadPromises);
    res.status(200).json({ urls });
  } catch (error) {
    console.error('CLOUDINARY UPLOAD ERROR:', error);
    res.status(500).json({ 
      message: 'Image upload failed', 
      error: error.message || 'Unknown error during Cloudinary upload',
      details: error
    });
  }
});

export default router;
