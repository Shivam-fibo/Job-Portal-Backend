import express from 'express';
import { createJob, getAllJobs, getJobById } from '../controllers/jobController.js';
import protect from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/create/job', protect,  createJob);
router.get('/getAllJob', protect,  getAllJobs);
router.get('/getjob/:id', protect,  getJobById);

export default router;
