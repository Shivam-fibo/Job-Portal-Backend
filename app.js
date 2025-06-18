import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';



dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World");
});


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

console.log(process.env.MONGODB_URI)
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/application', applicationRoutes);

export default app;