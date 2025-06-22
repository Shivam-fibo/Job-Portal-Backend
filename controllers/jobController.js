import Job from '../models/Job.js';
import User from '../models/User.js';
import StudentProfile from '../models/studentProfile.js';
import SibApiV3Sdk from 'sib-api-v3-sdk';
import fetch from 'node-fetch'; 
// import dotenv from "dotenv"


// dotenv.config();

console.log("api key testing", process.env.BREVO_API_KEY);
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

export const createJob = async (req, res) => {
  try {
    const jobData = req.body;
    const job = new Job(jobData);
    await job.save();

    const jobText = `${job.jobTitle} ${job.jobDescription}`.toLowerCase();
    const role = req.body.role;

    // Match students by skill similarity
    const students = await User.find({ role: 'student' });
    const profiles = await StudentProfile.find({ userId: { $in: students.map(s => s._id) } });

    const studentRecipients = [];

    for (const student of students) {
      const profile = profiles.find(p => p.userId.toString() === student._id.toString());
      if (!profile) continue;

      const profileText = [...(profile.skills || []), ...(profile.resumeText || [])]
        .join(' ')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .toLowerCase();

      const response = await fetch('https://api.api-ninjas.com/v1/textsimilarity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'iPN7XluFkkLzLbroyoNCyQ==iXAQnfNhisb8aVfz'
        },
        body: JSON.stringify({
          text_1: jobText,
          text_2: profileText
        })
      });

      if (!response.ok) {
        console.error(`Similarity API failed for ${student.email}:`, await response.text());
        continue;
      }

      const data = await response.json();
      const similarity = data.similarity;

      if (similarity > 0.45) {
        studentRecipients.push({
          email: student.email,
          name: student.name || 'Student'
        });
      }
    }

    let adjacentRole = null;
    if (role === 'hod') adjacentRole = 'placement_officer';
    else if (role === 'placement_officer') adjacentRole = 'hod';

    let adjacentRecipients = [];
    if (adjacentRole) {
      const adjacentUsers = await User.find({ role: adjacentRole });
      adjacentRecipients = adjacentUsers.map(user => ({
        email: user.email,
        name: user.name || adjacentRole
      }));
    }

    const allRecipients = [...studentRecipients, ...adjacentRecipients];

    if (allRecipients.length === 0) {
      return res.status(201).json({ message: 'Job posted but no matching recipients found', job });
    }

    const sendSmtpEmail = {
      sender: { name: 'Placement Cell', email: 'placementofficer778@gmail.com' },
      to: allRecipients,
      subject: '📢 New Job Opportunity Posted!',
      textContent: `Hi there,\n\nA new job titled "${job.jobTitle}" has just been posted.\n\nPlease log in to the portal to view and apply.\n\nBest,\nPlacement Cell`
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.status(201).json({ message: 'Job posted and emails sent to matching users', job });

  } catch (error) {
    console.error('Error creating job or sending emails:', error);
    res.status(500).json({ error: 'Failed to create job or send emails' });
  }
};



export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};
