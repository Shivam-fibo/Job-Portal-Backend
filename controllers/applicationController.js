import Application from '../models/Application.js';
import Job from '../models/Job.js';
import StudentProfile from '../models/studentProfile.js';
import Announcement from '../models/announcementModel.js';
import User from '../models/User.js';
import SibApiV3Sdk from 'sib-api-v3-sdk';
export const applyToJob = async (req, res) => {
  console.log("req body is : ",req.body)
  try {
    const { jobId, studentId } = req.body;
    let application = await Application.findOne({ student: studentId, job: jobId });
    if (!application) {
      application = new Application({ student: studentId, job: jobId, status: 'clicked' });
      await application.save();
    } else {
      application.status = 'clicked';
      await application.save();
    }
    res.status(200).json({ message: 'Application status updated', application });
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply to job' });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { jobId, status, studentId } = req.body; 
    let application = await Application.findOne({ student: studentId, job: jobId });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    application.status = status;
    await application.save();
    res.status(200).json({ message: 'Application status updated', application });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application status' });
  }
};
export const getClickedJobsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Step 1: Find applications where student ID matches and status is "clicked"
    const clickedApplications = await Application.find({
      student: studentId,
      status: "clicked",
    });

    // Step 2: Extract all job IDs from the applications
    const jobIds = clickedApplications.map(app => app.job);

    // Step 3: Fetch the full job details using Job.find
    const jobs = await Job.find({ _id: { $in: jobIds } });

    res.status(200).json({
      message: "Clicked jobs fetched successfully",
      jobs,
    });
  } catch (error) {
    console.error("Error fetching clicked jobs:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


export const getAppliedApplications = async (req, res) => {
  try {
    const applications = await Application.find({ status: 'applied' }).populate({
      path: 'job',
      select: 'jobTitle',
    });

    const studentProfiles = await StudentProfile.find({
      userId: { $in: applications.map(app => app.student) },
    });

    // Create a map from userId to student name
    const studentMap = {};
    studentProfiles.forEach(profile => {
      studentMap[profile.userId.toString()] = profile.name;
    });

    const formattedApplications = applications.map(app => ({
      id: app._id,
      jobTitle: app.job?.jobTitle || 'N/A',
      studentName: studentMap[app.student.toString()] || 'N/A',
    }));

    res.json(formattedApplications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
};



export const getAllStudentProfile = async(req, res) =>{
  try {
    const students = await StudentProfile.find()
    res.status(200).json(students)
  } catch (error) {
    console.error('Error fetching student profiles:', error);
    res.status(500).json({ message: 'Failed to fetch student profiles' });
  }
}

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = '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'
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

export const createAnnoucment = async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Save announcement in DB
    const newAnnouncement = new Announcement({ title, description });
    await newAnnouncement.save();

    // Fetch users with roles 'student' and 'placement officer'
    const users = await User.find({ role: { $in: ['student', 'placement officer'] } });

    const recipients = users.map(user => ({
      email: user.email,
      name: user.name || 'User'
    }));

 

    // Compose and send email
    const sendSmtpEmail = {
      sender: { name: 'Placement Cell', email: 'placementofficer778@gmail.com' },
      to: recipients,
      subject: '📢 New Announcement Posted!',
      textContent: `Hi,\n\nA new announcement titled "${title}" has just been posted.\n\nDescription: ${description}\n\nPlease log in to the portal to view more details.\n\nBest regards,\nPlacement Cell`
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.status(201).json({ message: 'Announcement created and emails sent', announcement: newAnnouncement });
  } catch (error) {
    console.error('Error creating announcement or sending emails:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


export const getAllAnnoucement = async(req, res) =>{
  try {
    const allAnnoucement = await Announcement.find();
    console.log(allAnnoucement, "all annoucment")
     res.status(200).json(allAnnoucement)
  } catch (error) {
    res.status(500).json({message: "Error while fetching the annocuement"})
  }
}