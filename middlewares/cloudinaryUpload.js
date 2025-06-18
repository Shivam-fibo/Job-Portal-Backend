import multer from 'multer';
import cloudinary from '../util/cloudinary.js'

const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5 mb 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

export const uploadToCloudinary = async (buffer, fileName) => {
  const fileBase64 = `data:application/pdf;base64,${buffer.toString('base64')}`;
  
  const result = await cloudinary.uploader.upload(fileBase64, {
    folder: 'resumes',
    resource_type: 'raw',
    public_id: fileName,
    format: 'pdf',
  });

  return result;
};

export default upload;
