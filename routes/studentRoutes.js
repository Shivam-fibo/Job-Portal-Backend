import express from 'express';
import {uploadStudentProfile} from '../controllers/studentProfile.js'
import upload from '../middlewares/cloudinaryUpload.js';

const router = express.Router();

router.post('/profile', upload.single('resume'), uploadStudentProfile);

export default router;
