import { Request, Response } from 'express';
import { BookingService } from '../services/bookingService';
import { createBookingDto, updateBookingDto } from '../dto/booking.dto';
import { AuthRequest } from '../types';

const bookingService = new BookingService();

export const bookingValidation = createBookingDto;
export const updateBookingValidation = updateBookingDto;

export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const queryParams = {
      page: parseInt(req.query.page as string),
      limit: parseInt(req.query.limit as string),
      status: req.query.status as string
    };
    
    const result = await bookingService.getAllBookings(req.user!.id, req.user!.role, queryParams);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const result = await bookingService.getBookingById(req.params.id, req.user!.id, req.user!.role);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    let status = 500;
    if (message === 'Booking not found') status = 404;
    if (message === 'Access denied') status = 403;
    res.status(status).json({ message, error: message });
  }
};

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const result = await bookingService.createBooking(req.body, req.user!.id);
    res.status(201).json(result);
  } catch (error) {
    const message = (error as Error).message;
    let status = 500;
    if (message === 'Package not found') status = 404;
    if (message.includes('not available') || message.includes('exceeds maximum')) status = 400;
    res.status(status).json({ message, error: message });
  }
};

export const updateBooking = async (req: AuthRequest, res: Response) => {
  try {
    const result = await bookingService.updateBooking(req.params.id, req.body, req.user!.id, req.user!.role);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    let status = 500;
    if (message === 'Booking not found') status = 404;
    if (message === 'Access denied' || message.includes('Only admin')) status = 403;
    if (message.includes('exceeds maximum')) status = 400;
    res.status(status).json({ message, error: message });
  }
};

export const deleteBooking = async (req: AuthRequest, res: Response) => {
  try {
    const result = await bookingService.deleteBooking(req.params.id, req.user!.id, req.user!.role);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    let status = 500;
    if (message === 'Booking not found') status = 404;
    if (message === 'Access denied') status = 403;
    res.status(status).json({ message, error: message });
  }
};