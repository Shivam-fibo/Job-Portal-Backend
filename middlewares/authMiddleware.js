import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv'

dotenv.config();

console.log(process.env.JWT_SECRET)
const protect = async (req, res, next) => {
  const token = req.cookies.token;
  console.log(req)
  console.log(token, "token")
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.userId).select('-password');
  next();
} catch (error) {
  console.error('JWT error:', error); // log exact reason
  return res.status(401).json({ message: 'Not authorized, token failed' });
}

};

export default protect;
