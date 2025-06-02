import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../util/cloudinary.js';
import multer from 'multer';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'job application',
    resource_type: 'raw',
    allowed_formats: ['pdf'],
  },
});

const upload = multer({ storage });

export default upload;
