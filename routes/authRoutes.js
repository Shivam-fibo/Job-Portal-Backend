
import express from 'express'
import {register, login, forgotPassword, resetPassword, verifyEmailOTP} from '../controllers/authController.js'
const router = express.Router();

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Forgot password route
router.post('/forgot-password', forgotPassword);

// Reset password route
router.post('/reset-password', resetPassword);


router.post('/verify-otp', verifyEmailOTP);



export default router