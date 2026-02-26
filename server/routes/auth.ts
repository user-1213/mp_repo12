import { Router } from 'express';
import { Db } from 'mongodb';
import jwt from 'jsonwebtoken';

export default function authRoutes(db: Db) {
  const router = Router();

  // Mock login - In production, use proper password hashing (bcrypt)
  router.post('/login', async (req, res) => {
    try {
      const { email, password, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Mock user - Replace with actual DB lookup
      const user = {
        id: `user-${Date.now()}`,
        email,
        role: role || 'employee',
        name: email.split('@')[0],
      };

      const token = jwt.sign(user, process.env.JWT_SECRET || 'secret', {
        expiresIn: '24h',
      });

      res.json({ token, user });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Register
  router.post('/register', async (req, res) => {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const newUser = {
        email,
        password, // In production: hash with bcrypt
        name,
        role: role || 'employee',
        createdAt: new Date(),
      };

      const result = await db.collection('users').insertOne(newUser);

      const token = jwt.sign(
        { id: result.insertedId, email, role: newUser.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      res.status(201).json({ token, user: { id: result.insertedId, email, name, role: newUser.role } });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Verify token
  router.get('/verify', (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      res.json({ valid: true, user: decoded });
    } catch (error) {
      res.status(401).json({ valid: false, error: 'Invalid token' });
    }
  });

  return router;
}
