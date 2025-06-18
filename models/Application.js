import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  status: {
    type: String,
    enum: ['not applied', 'applied', 'clicked'],
    default: 'not applied'
  }
});

const Application = mongoose.model('Application', applicationSchema);
export default Application;
