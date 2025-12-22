import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { updateUserDto } from '../dto/user.dto';
import { AuthRequest } from '../types';

const userService = new UserService();

export const updateUserValidation = updateUserDto;

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const queryParams = {
      page: parseInt(req.query.page as string),
      limit: parseInt(req.query.limit as string)
    };
    
    const result = await userService.getAllUsers(queryParams);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const result = await userService.getUserById(req.params.id);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    const status = message === 'User not found' ? 404 : 500;
    res.status(status).json({ message, error: message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body, req.user!.id, req.user!.role);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    let status = 500;
    if (message === 'User not found') status = 404;
    if (message === 'Access denied') status = 403;
    if (message === 'Email already in use') status = 400;
    res.status(status).json({ message, error: message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    const status = message === 'User not found' ? 404 : 500;
    res.status(status).json({ message, error: message });
  }
};