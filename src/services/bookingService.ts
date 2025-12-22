import Booking from '../models/Booking';
import Package from '../models/Package';
import { CreateBookingRequest, UpdateBookingRequest, BookingQueryParams } from '../dto/booking.dto';

export class BookingService {
  async getAllBookings(userId: string, userRole: string, queryParams: BookingQueryParams) {
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const skip = (page - 1) * limit;

    let filter: any = {};
    
    // Regular users can only see their own bookings
    if (userRole !== 'admin') {
      filter.user = userId;
    }

    if (queryParams.status) {
      filter.status = queryParams.status;
    }

    const bookings = await Booking.find(filter)
      .populate('user', 'name email')
      .populate('package', 'title destination price')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(filter);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getBookingById(bookingId: string, userId: string, userRole: string) {
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('package', 'title destination price duration');

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Users can only view their own bookings unless they're admin
    if (userRole !== 'admin' && booking.user._id.toString() !== userId) {
      throw new Error('Access denied');
    }

    return { booking };
  }

  async createBooking(data: CreateBookingRequest, userId: string) {
    const { package: packageId, numberOfPeople, travelDate } = data;

    const travelPackage = await Package.findById(packageId);
    if (!travelPackage) {
      throw new Error('Package not found');
    }

    if (!travelPackage.isActive) {
      throw new Error('Package is not available');
    }

    if (numberOfPeople > travelPackage.maxPeople) {
      throw new Error(`Number of people exceeds maximum allowed (${travelPackage.maxPeople})`);
    }

    const totalPrice = travelPackage.price * numberOfPeople;

    const booking = new Booking({
      user: userId,
      package: packageId,
      numberOfPeople,
      totalPrice,
      travelDate: new Date(travelDate)
    });

    await booking.save();
    await booking.populate('package', 'title destination price duration');

    return {
      message: 'Booking created successfully',
      booking
    };
  }

  async updateBooking(bookingId: string, data: UpdateBookingRequest, userId: string, userRole: string) {
    const { numberOfPeople, travelDate, status } = data;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Users can only update their own bookings unless they're admin
    if (userRole !== 'admin' && booking.user.toString() !== userId) {
      throw new Error('Access denied');
    }

    // Only admin can update status
    if (status && userRole !== 'admin') {
      throw new Error('Only admin can update booking status');
    }

    const updateData: any = {};
    
    if (numberOfPeople) {
      const travelPackage = await Package.findById(booking.package);
      if (numberOfPeople > travelPackage!.maxPeople) {
        throw new Error(`Number of people exceeds maximum allowed (${travelPackage!.maxPeople})`);
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

    return {
      message: 'Booking updated successfully',
      booking: updatedBooking
    };
  }

  async deleteBooking(bookingId: string, userId: string, userRole: string) {
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Users can only delete their own bookings unless they're admin
    if (userRole !== 'admin' && booking.user.toString() !== userId) {
      throw new Error('Access denied');
    }

    await Booking.findByIdAndDelete(bookingId);
    return { message: 'Booking deleted successfully' };
  }
}