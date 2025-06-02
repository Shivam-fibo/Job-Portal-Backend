import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    jobType: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      default: 'onsite',
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'internship', 'part-time', 'contract', 'freelance'],
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ['fresher', '0-1 years', '1-3 years', '3-5 years', '5+ years'],
    },
    companyName: {
      type: String,
    },
    companyLocation: {
      type: String,
    },
    salary: {
      type: String,
    },
    duration: {
      type: String,
    },
    skillsRequired: {
      type: [String], 
      default: [],
    },
    applicationLink: {
      type: String,
    },
    deadline: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Job = mongoose.model('Job', jobSchema);

export default Job;
