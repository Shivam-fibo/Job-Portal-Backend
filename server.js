
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js'
import studentRoutes from './routes/studentRoutes.js'
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/job', jobRoutes)
app.use('/api/student', studentRoutes)
// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
