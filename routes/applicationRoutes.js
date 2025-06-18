import express from 'express';
import { applyToJob, updateApplicationStatus, getClickedJobsByStudent, getAppliedApplications, getAllStudentProfile, createAnnoucment, getAllAnnoucement } from '../controllers/applicationController.js';


const router = express.Router();

router.post('/apply', applyToJob);

router.post('/update-status', updateApplicationStatus);


router.get('/status/:studentId', getClickedJobsByStudent);


router.get('/jobApplied', getAppliedApplications)

router.get('/getAllStudentProfile', getAllStudentProfile)

router.post('/annoucment', createAnnoucment)

router.get('/getAllAnnoucment', getAllAnnoucement)

export default router;
