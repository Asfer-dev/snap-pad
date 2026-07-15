// backend/src/controllers/authController.ts
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository.js';

const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  return jwt.sign({ id: userId }, secret, { expiresIn: '24h' });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // 1. Basic Validation
    if (!name || name.trim() === '') {
      res.status(400).json({ error: 'Name cannot be empty.' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    // 2. Check uniqueness
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered.' });
      return;
    }

    // 3. Hash Password & Save User
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = await UserRepository.createUser(name, email, passwordHash);

    // 4. Generate Token
    const token = generateToken(user.id);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    // 1. Find User
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // 2. Validate Password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // 3. Generate Token
    const token = generateToken(user.id);

    // Strip hash before returning
    const { password_hash, ...userResponse } = user;

    res.status(200).json({ user: userResponse, token });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
