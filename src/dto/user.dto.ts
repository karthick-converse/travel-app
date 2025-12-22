import { body } from 'express-validator';

export const updateUserDto = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email')
];

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
}