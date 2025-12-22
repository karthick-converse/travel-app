import { body } from 'express-validator';

export const createPackageDto = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('destination').trim().notEmpty().withMessage('Destination is required'),
  body('price').isNumeric().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
  body('maxPeople').isInt({ min: 1 }).withMessage('Max people must be at least 1'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('features').optional().isArray().withMessage('Features must be an array')
];

export const updatePackageDto = [
  body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('destination').optional().trim().notEmpty().withMessage('Destination is required'),
  body('price').optional().isNumeric().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
  body('maxPeople').optional().isInt({ min: 1 }).withMessage('Max people must be at least 1'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

export interface CreatePackageRequest {
  title: string;
  description: string;
  destination: string;
  price: number;
  duration: number;
  maxPeople: number;
  images?: string[];
  features?: string[];
}

export interface UpdatePackageRequest {
  title?: string;
  description?: string;
  destination?: string;
  price?: number;
  duration?: number;
  maxPeople?: number;
  images?: string[];
  features?: string[];
  isActive?: boolean;
}

export interface PackageQueryParams {
  page?: number;
  limit?: number;
  destination?: string;
  isActive?: boolean;
}