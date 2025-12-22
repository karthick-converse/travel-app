import { body } from 'express-validator';

export const createBookingDto = [
  body('package').isMongoId().withMessage('Valid package ID is required'),
  body('numberOfPeople').isInt({ min: 1 }).withMessage('Number of people must be at least 1'),
  body('travelDate').isISO8601().withMessage('Valid travel date is required')
];

export const updateBookingDto = [
  body('numberOfPeople').optional().isInt({ min: 1 }).withMessage('Number of people must be at least 1'),
  body('travelDate').optional().isISO8601().withMessage('Valid travel date is required'),
  body('status').optional().isIn(['pending', 'confirmed', 'cancelled']).withMessage('Invalid status')
];

export interface CreateBookingRequest {
  package: string;
  numberOfPeople: number;
  travelDate: string;
}

export interface UpdateBookingRequest {
  numberOfPeople?: number;
  travelDate?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export interface BookingQueryParams {
  page?: number;
  limit?: number;
  status?: string;
}