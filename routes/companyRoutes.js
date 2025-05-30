import express from 'express'
const router = express.Router();
import {fetchCompanies, fetchJobsFromGreenhouse} from '../controllers/companyController.js'

router.post('/fetch', fetchCompanies);
router.get('/jobs', fetchJobsFromGreenhouse);

export default router
