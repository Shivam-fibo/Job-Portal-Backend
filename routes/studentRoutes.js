import express from 'express';
import {uploadStudentProfile, getStudentProfile} from '../controllers/studentProfile.js'
import upload from '../middlewares/cloudinaryUpload.js';

const router = express.Router();

router.get('/profile/:userId', getStudentProfile);
router.post('/profile', upload.single('resume'), uploadStudentProfile);

export default router;
