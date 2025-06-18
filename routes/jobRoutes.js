import express from 'express';
import { createJob, getAllJobs, getJobById } from '../controllers/jobController.js';

const router = express.Router();

router.post('/create/job', createJob);
router.get('/getAllJob', getAllJobs);
router.get('/getjob/:id', getJobById);

export default router;
