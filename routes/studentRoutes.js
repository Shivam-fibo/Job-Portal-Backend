import express from 'express';
import {uploadStudentProfile, getStudentProfile} from '../controllers/studentProfile.js'
import upload from '../middlewares/cloudinaryUpload.js';
import protect from '../middlewares/authMiddleware.js';
const router = express.Router();

router.get('/profile/:userId', protect,  getStudentProfile);
router.post('/profile', protect,  upload.single('resume'), uploadStudentProfile);

export default router;
