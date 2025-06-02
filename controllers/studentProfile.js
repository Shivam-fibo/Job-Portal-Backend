import StudentProfile from '../models/studentProfile.js'

export const uploadStudentProfile = async (req, res) => {
  try {
    const { skills, userId } = req.body;
    const skillList = skills.split(',').map((s) => s.trim());

    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'Resume upload failed' });
    }

    const resumeUrl = req.file.path;

    const existing = await StudentProfile.findOne({ userId });

    if (existing) {
      existing.skills = skillList;
      existing.resumeUrl = resumeUrl;
      await existing.save();
      return res.status(200).json({ message: 'Profile updated', profile: existing });
    }

    const profile = await StudentProfile.create({
      userId,
      skills: skillList,
      resumeUrl,
    });

    res.status(201).json({ message: 'Profile created', profile });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
