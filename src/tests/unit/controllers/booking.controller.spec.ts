import { Response } from 'express';
import { AuthRequest } from '../../../types';

// Mock the BookingService before importing the controller
const mockBookingService = {
  getAllBookings: jest.fn(),
  getBookingById: jest.fn(),
  createBooking: jest.fn(),
  updateBooking: jest.fn(),
  deleteBooking: jest.fn(),
};

jest.mock('../../../services/bookingService', () => {
  return {
    BookingService: jest.fn().mockImplementation(() => mockBookingService)
  };
});

// Import controller after mocking
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
} from '../../../controllers/bookingController';
describe('Booking Controller', () => {
  let mockAuthRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockAuthRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllBookings', () => {
    it('should return all bookings with pagination', async () => {
      const expectedResult = {
  bookings: [
    {
      _id: '1',
      packageId: 'pkg1',
      userId: 'user123',
      status: 'pending',
    },
    {
      _id: '2',
      packageId: 'pkg2',
      userId: 'user123',
      status: 'confirmed',
    },
  ] as any, // 👈 important for mongoose Document
  pagination: {
    total: 2,
    page: 1,
    limit: 10,
    pages: 1,
  },
};

      mockAuthRequest.query = {
        page: '1',
        limit: '10',
        status: 'pending',
      };

      mockBookingService.getAllBookings.mockResolvedValue(expectedResult);

      await getAllBookings(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockBookingService.getAllBookings).toHaveBeenCalledWith(
        'user123',
        'user',
        {
          page: 1,
          limit: 10,
          status: 'pending',
        }
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should handle missing query parameters', async () => {
     const expectedResult = {
  bookings: [
    {
      _id: '1',
      packageId: 'pkg1',
      userId: 'user123',
      status: 'pending',
    },
    {
      _id: '2',
      packageId: 'pkg2',
      userId: 'user123',
      status: 'confirmed',
    },
  ] as any, // 👈 important for mongoose Document
  pagination: {
    total: 2,
    page: 1,
    limit: 10,
    pages: 1,
  },
};


      mockAuthRequest.query = {};
      mockBookingService.getAllBookings.mockResolvedValue(expectedResult);

      await getAllBookings(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockBookingService.getAllBookings).toHaveBeenCalledWith(
        'user123',
        'user',
        {
          page: NaN,
          limit: NaN,
          status: undefined,
        }
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should return 500 on server error', async () => {
      mockAuthRequest.query = { page: '1', limit: '10' };
      mockBookingService.getAllBookings.mockRejectedValue(
        new Error('Database error')
      );

      await getAllBookings(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'Database error',
      });
    });
  });

  describe('getBookingById', () => {
    it('should return booking by id successfully', async () => {
      const expectedBooking = {
        id: 'booking123',
        packageId: 'pkg1',
        userId: 'user123',
        status: 'confirmed',
      } as any

      mockAuthRequest.params = { id: 'booking123' };
      mockBookingService.getBookingById.mockResolvedValue(expectedBooking);

      await getBookingById(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockBookingService.getBookingById).toHaveBeenCalledWith(
        'booking123',
        'user123',
        'user'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedBooking);
    });

    it('should return 404 if booking not found', async () => {
      mockAuthRequest.params = { id: 'nonexistent' };
      mockBookingService.getBookingById.mockRejectedValue(
        new Error('Booking not found')
      );

      await getBookingById(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Booking not found',
        error: 'Booking not found',
      });
    });

    it('should return 403 if access denied', async () => {
      mockAuthRequest.params = { id: 'booking123' };
      mockBookingService.getBookingById.mockRejectedValue(
        new Error('Access denied')
      );

      await getBookingById(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Access denied',
        error: 'Access denied',
      });
    });

    it('should return 500 for other errors', async () => {
      mockAuthRequest.params = { id: 'booking123' };
      mockBookingService.getBookingById.mockRejectedValue(
        new Error('Database connection failed')
      );

      await getBookingById(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database connection failed',
        error: 'Database connection failed',
      });
    });
  });

  describe('createBooking', () => {
    it('should create booking successfully and return 201', async () => {
      const bookingData = {
        packageId: 'pkg1',
        numberOfTravelers: 2,
        travelDate: '2024-12-25',
      };
      const expectedResult = {
        id: 'booking123',
        ...bookingData,
        userId: 'user123',
        status: 'pending',
      }as any;

      mockAuthRequest.body = bookingData;
      mockBookingService.createBooking.mockResolvedValue(expectedResult);

      await createBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockBookingService.createBooking).toHaveBeenCalledWith(
        bookingData,
        'user123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should return 404 if package not found', async () => {
      mockAuthRequest.body = { packageId: 'nonexistent' };
      mockBookingService.createBooking.mockRejectedValue(
        new Error('Package not found')
      );

      await createBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Package not found',
        error: 'Package not found',
      });
    });

    it('should return 400 if package not available', async () => {
      mockAuthRequest.body = { packageId: 'pkg1' };
      mockBookingService.createBooking.mockRejectedValue(
        new Error('Package not available for selected dates')
      );

      await createBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Package not available for selected dates',
        error: 'Package not available for selected dates',
      });
    });

    it('should return 400 if travelers exceeds maximum', async () => {
      mockAuthRequest.body = { packageId: 'pkg1', numberOfTravelers: 100 };
      mockBookingService.createBooking.mockRejectedValue(
        new Error('Number of travelers exceeds maximum capacity')
      );

      await createBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Number of travelers exceeds maximum capacity',
        error: 'Number of travelers exceeds maximum capacity',
      });
    });

    it('should return 500 for server errors', async () => {
      mockAuthRequest.body = { packageId: 'pkg1' };
      mockBookingService.createBooking.mockRejectedValue(
        new Error('Database error')
      );

      await createBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database error',
        error: 'Database error',
      });
    });
  });

  describe('updateBooking', () => {
    it('should update booking successfully', async () => {
      const updateData = { status: 'confirmed' };
      const expectedResult = {
        id: 'booking123',
        status: 'confirmed',
        userId: 'user123',
      }as any;

      mockAuthRequest.params = { id: 'booking123' };
      mockAuthRequest.body = updateData;
      mockBookingService.updateBooking.mockResolvedValue(expectedResult);

      await updateBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockBookingService.updateBooking).toHaveBeenCalledWith(
        'booking123',
        updateData,
        'user123',
        'user'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should return 404 if booking not found', async () => {
      mockAuthRequest.params = { id: 'nonexistent' };
      mockAuthRequest.body = { status: 'confirmed' };
      mockBookingService.updateBooking.mockRejectedValue(
        new Error('Booking not found')
      );

      await updateBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Booking not found',
        error: 'Booking not found',
      });
    });

    it('should return 403 if access denied', async () => {
      mockAuthRequest.params = { id: 'booking123' };
      mockAuthRequest.body = { status: 'confirmed' };
      mockBookingService.updateBooking.mockRejectedValue(
        new Error('Access denied')
      );

      await updateBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Access denied',
        error: 'Access denied',
      });
    });

    it('should return 403 if only admin can perform action', async () => {
      mockAuthRequest.params = { id: 'booking123' };
      mockAuthRequest.body = { status: 'cancelled' };
      mockBookingService.updateBooking.mockRejectedValue(
        new Error('Only admin can cancel confirmed bookings')
      );

      await updateBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Only admin can cancel confirmed bookings',
        error: 'Only admin can cancel confirmed bookings',
      });
    });

    it('should return 400 if update exceeds maximum', async () => {
      mockAuthRequest.params = { id: 'booking123' };
      mockAuthRequest.body = { numberOfTravelers: 100 };
      mockBookingService.updateBooking.mockRejectedValue(
        new Error('Update exceeds maximum capacity')
      );

      await updateBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Update exceeds maximum capacity',
        error: 'Update exceeds maximum capacity',
      });
    });

    it('should return 500 for server errors', async () => {
      mockAuthRequest.params = { id: 'booking123' };
      mockAuthRequest.body = { status: 'confirmed' };
      mockBookingService.updateBooking.mockRejectedValue(
        new Error('Database error')
      );

      await updateBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database error',
        error: 'Database error',
      });
    });
  });

  describe('deleteBooking', () => {
    it('should delete booking successfully', async () => {
      const expectedResult = {
        message: 'Booking deleted successfully',
        id: 'booking123',
      };

      mockAuthRequest.params = { id: 'booking123' };
      mockBookingService.deleteBooking.mockResolvedValue(expectedResult);

      await deleteBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockBookingService.deleteBooking).toHaveBeenCalledWith(
        'booking123',
        'user123',
        'user'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should return 404 if booking not found', async () => {
      mockAuthRequest.params = { id: 'nonexistent' };
      mockBookingService.deleteBooking.mockRejectedValue(
        new Error('Booking not found')
      );

      await deleteBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Booking not found',
        error: 'Booking not found',
      });
    });

    it('should return 403 if access denied', async () => {
      mockAuthRequest.params = { id: 'booking123' };
      mockBookingService.deleteBooking.mockRejectedValue(
        new Error('Access denied')
      );

      await deleteBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Access denied',
        error: 'Access denied',
      });
    });

    it('should return 500 for server errors', async () => {
      mockAuthRequest.params = { id: 'booking123' };
      mockBookingService.deleteBooking.mockRejectedValue(
        new Error('Database error')
      );

      await deleteBooking(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database error',
        error: 'Database error',
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle missing user in request for getAllBookings', async () => {
      mockAuthRequest.user = undefined;
      mockAuthRequest.query = { page: '1', limit: '10' };

      await getAllBookings(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      // Should return 500 error due to undefined user
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: "Cannot read properties of undefined (reading 'id')",
      });
    });

    it('should handle admin role for getAllBookings', async () => {
      mockAuthRequest.user = {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
      };
      mockAuthRequest.query = { page: '1', limit: '10' };

      const expectedResult = { bookings: [], total: 0, page: 1, limit: 10 }as any;
      mockBookingService.getAllBookings.mockResolvedValue(expectedResult);

      await getAllBookings(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockBookingService.getAllBookings).toHaveBeenCalledWith(
        'admin123',
        'admin',
        expect.any(Object)
      );
    });
  });
});