import { Request, Response } from 'express';
import { generateToken } from '../utils/jwt';
import * as userService from '../services/user.service';
import bcrypt from 'bcryptjs';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists with this email',
      });
    }

    // Create new user
    const newUser = await userService.createUser({ email, password, name });

    // Generate JWT token
    const token = generateToken({ id: newUser.id, email: newUser.email });

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during signup',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password',
      });
    }

    // 2) Find user with password
    const user = await userService.findUserByEmail(email, true);
    
    // 3) Check if user exists and password is correct
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password',
      });
    }

    // 4) Generate token
    const token = generateToken({ id: user.id, email: user.email });

    // 5) Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    // 6) Send response
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: err.message || 'An error occurred during login',
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // req.user is set by the protect middleware
    const user = await userService.findUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: err.message || 'An error occurred',
    });
  }
};