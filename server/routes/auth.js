import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authMiddleware, signUserToken } from '../middleware/auth.js';

const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
      role: 'user'
    });

    const token = signUserToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: name || user.email.split('@')[0],
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signUserToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.email.split('@')[0],
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) {
      return res.status(400).json({ error: 'Missing idToken' });
    }
    if (!GOOGLE_CLIENT_ID) {
      return res
        .status(500)
        .json({ error: 'GOOGLE_CLIENT_ID is not configured on the server' });
    }

    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
      idToken
    )}`;

    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.warn('Google tokeninfo error:', response.status, text);
      return res.status(401).json({ error: 'Invalid Google ID token' });
    }

    const data = await response.json();

    if (data.aud !== GOOGLE_CLIENT_ID) {
      console.warn('Google ID token audience mismatch:', data.aud);
      return res.status(401).json({ error: 'Invalid Google ID token audience' });
    }

    const email = data.email;
    const googleId = data.sub;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Google token missing email or sub' });
    }

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        user = await User.create({
          email,
          googleId,
          role: 'user'
        });
      }
    }

    const token = signUserToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.email.split('@')[0],
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

// ----- Get current authenticated user -----
// GET /api/auth/me  (Bearer token required)

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id email role');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        name: user.email.split('@')[0],
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Auth /me error:', err);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

export default router;

