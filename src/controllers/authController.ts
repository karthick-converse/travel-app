import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { registerDto, loginDto } from '../dto/auth.dto';
import { AuthRequest } from '../types';

const authService = new AuthService();

export const registerValidation = registerDto;
export const loginValidation = loginDto;

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    const message = (error as Error).message;
    const status = message === 'User already exists with this email' ? 400 : 500;
    res.status(status).json({ message, error: message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    const status = message === 'Invalid credentials' ? 400 : 500;
    res.status(status).json({ message, error: message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const result = await authService.getProfile(req.user!.id);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    const status = message === 'User not found' ? 404 : 500;
    res.status(status).json({ message, error: message });
  }
};