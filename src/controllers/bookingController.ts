import { Request, Response } from 'express';
import { body } from 'express-validator';
import Booking from '../models/Booking';
import Package from '../models/Package';
import { AuthRequest } from '../types';

export const bookingValidation = [
  body('package').isMongoId().withMessage('Valid package ID is required'),
  body('numberOfPeople').isInt({ min: 1 }).withMessage('Number of people must be at least 1'),
  body('travelDate').isISO8601().withMessage('Valid travel date is required')
];

export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    let filter: any = {};
    
    // Regular users can only see their own bookings
    if (req.user!.role !== 'admin') {
      filter.user = req.user!.id;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate('user', 'name email')
      .populate('package', 'title destination price')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('package', 'title destination price duration');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Users can only view their own bookings unless they're admin
    if (req.user!.role !== 'admin' && booking.user._id.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { package: packageId, numberOfPeople, travelDate } = req.body;

    const travelPackage = await Package.findById(packageId);
    if (!travelPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    if (!travelPackage.isActive) {
      return res.status(400).json({ message: 'Package is not available' });
    }

    if (numberOfPeople > travelPackage.maxPeople) {
      return res.status(400).json({ 
        message: `Number of people exceeds maximum allowed (${travelPackage.maxPeople})` 
      });
    }

    const totalPrice = travelPackage.price * numberOfPeople;

    const booking = new Booking({
      user: req.user!.id,
      package: packageId,
      numberOfPeople,
      totalPrice,
      travelDate: new Date(travelDate)
    });

    await booking.save();
    await booking.populate('package', 'title destination price duration');

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const updateBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { numberOfPeople, travelDate, status } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Users can only update their own bookings unless they're admin
    if (req.user!.role !== 'admin' && booking.user.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only admin can update status
    if (status && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update booking status' });
    }

    const updateData: any = {};
    
    if (numberOfPeople) {
      const travelPackage = await Package.findById(booking.package);
      if (numberOfPeople > travelPackage!.maxPeople) {
        return res.status(400).json({ 
          message: `Number of people exceeds maximum allowed (${travelPackage!.maxPeople})` 
        });
      }
      updateData.numberOfPeople = numberOfPeople;
      updateData.totalPrice = travelPackage!.price * numberOfPeople;
    }

    if (travelDate) {
      updateData.travelDate = new Date(travelDate);
    }

    if (status) {
      updateData.status = status;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    ).populate('package', 'title destination price duration');

    res.json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const deleteBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Users can only delete their own bookings unless they're admin
    if (req.user!.role !== 'admin' && booking.user.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};