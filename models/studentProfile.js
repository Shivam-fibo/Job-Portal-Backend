import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', 
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  },
  resumeUrl: {
    type: String,
    required: true,
  },
  resumeText: {
    type: [String], 
    default: [],
  },
}, {
  timestamps: true,
});

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
export default StudentProfile;
