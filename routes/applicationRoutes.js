import express from 'express';
import {
  applyToJob,
  updateApplicationStatus,
  getClickedJobsByStudent,
  getAppliedApplications,
  getAllStudentProfile,
  createAnnoucment,
  getAllAnnoucement
} from '../controllers/applicationController.js';

import protect from '../middleware/authMiddleware.js'; 

const router = express.Router();


router.post('/apply', protect, applyToJob);
router.post('/update-status', protect, updateApplicationStatus);
router.get('/status/:studentId', protect, getClickedJobsByStudent);
router.get('/jobApplied', protect, getAppliedApplications);
router.get('/getAllStudentProfile', protect, getAllStudentProfile);
router.post('/annoucment', protect, createAnnoucment);
router.get('/getAllAnnoucment', protect, getAllAnnoucement);

export default router;
