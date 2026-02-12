import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('Missing JWT_SECRET in environment');
}

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role || 'user'
    };
    next();
  } catch (err) {
    console.warn('JWT verification failed:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function signUserToken(user) {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d'
  });

  return token;
}

export async function loadUserFromRequest(req) {
  if (!req.user) return null;
  const user = await User.findById(req.user.id);
  return user;
}

