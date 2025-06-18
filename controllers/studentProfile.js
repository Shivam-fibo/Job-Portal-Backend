import StudentProfile from '../models/studentProfile.js';
import { uploadToCloudinary } from '../middlewares/cloudinaryUpload.js';
import { extractTextFromPdfUrl } from '../util/extractResumeText.js';

export const getStudentProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await StudentProfile.findOne({ userId });
    
    if (!profile) {
      return res.status(404).json({ exists: false, message: 'Profile not found' });
    }

    res.status(200).json({ 
      exists: true, 
      profile: {
        name: profile.name,
        skills: profile.skills,
        resumeUrl: profile.resumeUrl
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const uploadStudentProfile = async (req, res) => {
  try {
    const { name, skills, userId } = req.body;

    if (!name || !skills || !userId) {
      return res.status(400).json({ message: 'Name, skills and userId are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const skillList = skills.split(',').map(s => s.trim());
    const fileName = `resume_${userId}_${Date.now()}`;
    const uploadResult = await uploadToCloudinary(req.file.buffer, fileName);
    const resumeUrl = uploadResult.secure_url;
    const resumeText = await extractTextFromPdfUrl(resumeUrl);
    const existing = await StudentProfile.findOne({ userId });

    if (existing) {
      existing.name = name;
      existing.skills = skillList;
      existing.resumeUrl = resumeUrl;
      existing.resumeText = resumeText;
      await existing.save();
      return res.status(200).json({ message: 'Profile updated', profile: existing });
    }

    const profile = await StudentProfile.create({
      userId,
      name,
      skills: skillList,
      resumeUrl,
      resumeText,
    });

    res.status(201).json({ message: 'Profile created', profile });
  } catch (error) {
    console.error('Error uploading profile:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
