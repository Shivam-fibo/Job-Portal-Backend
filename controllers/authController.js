import User from '../models/User.js';
import jwt from 'jsonwebtoken'
import SibApiV3Sdk from 'sib-api-v3-sdk'
import StudentProfile from '../models/studentProfile.js';

import dotenv from "dotenv"


dotenv.config();
// Configure Brevo (Sendinblue)
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();




// Generate JWT Token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Generate OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
export const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log("📥 Register request received:", { email, role });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("⚠️ User already exists:", email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    console.log("🔐 Generated OTP:", otp, "Expires at:", new Date(otpExpires).toISOString());

    const user = new User({
      email,
      password,
      role,
      emailOTP: otp,
      emailOTPExpires: otpExpires
    });

    await user.save();
    console.log("✅ User saved to database:", user._id);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = 'Verify Your Email - OTP';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification Request</h2>
        <p>Your OTP for email verification is:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;
    sendSmtpEmail.sender = { name: 'Placement Cell', email: 'placementofficer778@gmail.com' };
    sendSmtpEmail.to = [{ email: user.email }];

    try {
      const emailResponse = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log("📧 OTP email sent successfully:", emailResponse);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
    }

    res.status(201).json({
      message: 'User registered. OTP sent for email verification.',
      userId: user._id,
      email: user.email
    });

  } catch (error) {
    console.error("❌ Error in register:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("📥 OTP verification request:", { email, otp });

    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ No user found with email:", email);
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      console.log("⚠️ User already verified:", email);
      return res.status(400).json({ message: 'Email already verified' });
    }

    console.log("🔎 Stored OTP:", user.emailOTP, "Expires at:", new Date(user.emailOTPExpires).toISOString());

    if (
      user.emailOTP !== otp ||
      !user.emailOTPExpires ||
      Date.now() > user.emailOTPExpires
    ) {
      console.log("❌ Invalid or expired OTP for user:", email);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true
    user.emailOTP = null;
    user.emailOTPExpires = null;
    await user.save();
    console.log("✅ Email verified and user updated:", user._id);

    const token = generateToken(user._id);


    res.cookie('token', token, {
      // httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });


    res.status(200).json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("❌ Error in verifyEmailOTP:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Login User
export const login = async (req, res) => {

  try {
    const { email, password, role } = req.body;

    // Find user
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Initialize skills as empty array
    let skills = [];

    // If role is student, fetch the skills from StudentProfile
    if (role === 'student') {
      const profile = await StudentProfile.findOne({ userId: user._id });
      if (profile) {
        skills = profile.skills || [];
      }
    }
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });


console.log('Set-Cookie header:', res.getHeader('Set-Cookie'));


    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        skills,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log(otp)
    // Save OTP to user (expires in 10 minutes)
    user.resetOTP = otp;
    user.resetOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send email with OTP
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = 'Password Reset OTP';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;
    sendSmtpEmail.sender = { name: 'Placement Cell', email: 'placementofficer778@gmail.com' };

    sendSmtpEmail.to = [{ email: user.email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetOTP: otp,
      resetOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Update password
    user.password = newPassword;
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token', {
    // httpOnly: true,
    sameSite: 'None',
    secure: true
  });
  res.status(200).json({ message: 'Logged out successfully' });
};
