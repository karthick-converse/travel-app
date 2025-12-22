import { BookingService } from "../../../services/bookingService";
import Booking from "../../../models/Booking";
import Package from "../../../models/Package";
import {
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingQueryParams,
} from "../../../dto/booking.dto";

jest.mock("../../../models/Booking");
jest.mock("../../../models/Package");

describe("BookingService", () => {
  let bookingService: BookingService;

  const mockUserId = "507f1f77bcf86cd799439011";
  const mockAdminId = "507f1f77bcf86cd799439012";
  const mockBookingId = "607f1f77bcf86cd799439013";
  const mockPackageId = "707f1f77bcf86cd799439014";

  const mockPackage = {
    _id: mockPackageId,
    title: "Beach Paradise",
    destination: "Maldives",
    price: 1000,
    duration: 7,
    maxPeople: 4,
    isActive: true,
  };

  const mockBooking = {
    _id: mockBookingId,
    user: { _id: mockUserId, name: "John Doe", email: "john@example.com" },
    package: mockPackage,
    numberOfPeople: 2,
    totalPrice: 2000,
    travelDate: new Date("2024-12-25"),
    status: "pending",
    createdAt: new Date("2024-01-01"),
  };

  beforeEach(() => {
    bookingService = new BookingService();
    jest.clearAllMocks();
  });

  describe("getAllBookings", () => {
    const mockBookings = [mockBooking];

    it("should return all bookings for admin user", async () => {
      const queryParams: BookingQueryParams = { page: 1, limit: 10 };

      const mockFind = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockResolvedValue(mockBookings);

      (Booking.find as jest.Mock).mockImplementation(mockFind);
      mockFind.mockReturnValue({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        sort: mockSort,
      });

      (Booking.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await bookingService.getAllBookings(
        mockAdminId,
        "admin",
        queryParams
      );

      expect(Booking.find).toHaveBeenCalledWith({});
      expect(result.bookings).toEqual(mockBookings);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1,
      });
    });

    it("should return only user bookings for regular user", async () => {
      const queryParams: BookingQueryParams = { page: 1, limit: 10 };

      const mockFind = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockResolvedValue(mockBookings);

      (Booking.find as jest.Mock).mockImplementation(mockFind);
      mockFind.mockReturnValue({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        sort: mockSort,
      });

      (Booking.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await bookingService.getAllBookings(
        mockUserId,
        "user",
        queryParams
      );

      expect(Booking.find).toHaveBeenCalledWith({ user: mockUserId });
      expect(result.bookings).toEqual(mockBookings);
    });

    it("should filter bookings by status", async () => {
      const queryParams: BookingQueryParams = {
        page: 1,
        limit: 10,
        status: "confirmed",
      };

      const mockFind = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockResolvedValue(mockBookings);

      (Booking.find as jest.Mock).mockImplementation(mockFind);
      mockFind.mockReturnValue({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        sort: mockSort,
      });

      (Booking.countDocuments as jest.Mock).mockResolvedValue(1);

      await bookingService.getAllBookings(mockAdminId, "admin", queryParams);

      expect(Booking.find).toHaveBeenCalledWith({ status: "confirmed" });
    });

    it("should handle pagination correctly", async () => {
      const queryParams: BookingQueryParams = { page: 2, limit: 5 };

      const mockFind = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockResolvedValue(mockBookings);

      (Booking.find as jest.Mock).mockImplementation(mockFind);
      mockFind.mockReturnValue({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        sort: mockSort,
      });

      (Booking.countDocuments as jest.Mock).mockResolvedValue(12);

      const result = await bookingService.getAllBookings(
        mockAdminId,
        "admin",
        queryParams
      );

      expect(mockSkip).toHaveBeenCalledWith(5);
      expect(mockLimit).toHaveBeenCalledWith(5);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 12,
        pages: 3,
      });
    });

    it("should use default pagination values when not provided", async () => {
      const queryParams: BookingQueryParams = {};

      const mockFind = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockResolvedValue(mockBookings);

      (Booking.find as jest.Mock).mockImplementation(mockFind);
      mockFind.mockReturnValue({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        sort: mockSort,
      });

      (Booking.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await bookingService.getAllBookings(
        mockAdminId,
        "admin",
        queryParams
      );

      expect(mockSkip).toHaveBeenCalledWith(0);
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe("getBookingById", () => {
    it("should return booking for admin user", async () => {
      const mockFindById = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockReturnThis();

      (Booking.findById as jest.Mock).mockImplementation(mockFindById);
      mockFindById.mockReturnValue({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        populate: mockPopulate,
      });
      mockPopulate.mockResolvedValueOnce(mockBooking);

      const result = await bookingService.getBookingById(
        mockBookingId,
        mockAdminId,
        "admin"
      );

      expect(Booking.findById).toHaveBeenCalledWith(mockBookingId);
      expect(result.booking).toEqual(mockBooking);
    });

    it("should return booking for owner user", async () => {
      const mockFindById = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockReturnThis();

      (Booking.findById as jest.Mock).mockImplementation(mockFindById);
      mockFindById.mockReturnValue({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        populate: mockPopulate,
      });
      mockPopulate.mockResolvedValueOnce(mockBooking);

      const result = await bookingService.getBookingById(
        mockBookingId,
        mockUserId,
        "user"
      );

      expect(result.booking).toEqual(mockBooking);
    });

    it("should throw error when booking not found", async () => {
      const mockFindById = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockReturnThis();

      (Booking.findById as jest.Mock).mockImplementation(mockFindById);
      mockFindById.mockReturnValue({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        populate: mockPopulate,
      });
      mockPopulate.mockResolvedValueOnce(null);

      await expect(
        bookingService.getBookingById(mockBookingId, mockUserId, "user")
      ).rejects.toThrow("Booking not found");
    });

    it("should throw error when non-owner user tries to access booking", async () => {
      const otherUserId = "507f1f77bcf86cd799439099";
      const mockFindById = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockReturnThis();

      (Booking.findById as jest.Mock).mockImplementation(mockFindById);
      mockFindById.mockReturnValue({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        populate: mockPopulate,
      });
      mockPopulate.mockResolvedValueOnce(mockBooking);

      await expect(
        bookingService.getBookingById(mockBookingId, otherUserId, "user")
      ).rejects.toThrow("Access denied");
    });
  });

  describe("createBooking", () => {
    const createBookingRequest: CreateBookingRequest = {
      package: mockPackageId,
      numberOfPeople: 2,
      travelDate: "2024-12-25",
    };

    it("should create booking successfully", async () => {
      (Package.findById as jest.Mock).mockResolvedValue(mockPackage);

      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockPopulate = jest.fn().mockResolvedValue(mockBooking);

      (Booking as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        populate: mockPopulate,
      }));

      const result = await bookingService.createBooking(
        createBookingRequest,
        mockUserId
      );

      expect(Package.findById).toHaveBeenCalledWith(mockPackageId);
      expect(mockSave).toHaveBeenCalled();
      expect(mockPopulate).toHaveBeenCalled();

      expect(result.message).toBe("Booking created successfully");
      expect(result.booking).toEqual(mockBooking); // ✅ NOW PASSES
    });

    it("should throw error when package not found", async () => {
      (Package.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        bookingService.createBooking(createBookingRequest, mockUserId)
      ).rejects.toThrow("Package not found");
    });

    it("should throw error when package is not active", async () => {
      const inactivePackage = { ...mockPackage, isActive: false };
      (Package.findById as jest.Mock).mockResolvedValue(inactivePackage);

      await expect(
        bookingService.createBooking(createBookingRequest, mockUserId)
      ).rejects.toThrow("Package is not available");
    });

    it("should throw error when numberOfPeople exceeds maxPeople", async () => {
      const invalidRequest: CreateBookingRequest = {
        package: mockPackageId,
        numberOfPeople: 10,
        travelDate: "2024-12-25",
      };

      (Package.findById as jest.Mock).mockResolvedValue(mockPackage);

      await expect(
        bookingService.createBooking(invalidRequest, mockUserId)
      ).rejects.toThrow("Number of people exceeds maximum allowed (4)");
    });

    it("should calculate total price correctly", async () => {
      (Package.findById as jest.Mock).mockResolvedValue(mockPackage);

      let capturedBookingData: any;
      const mockSave = jest.fn().mockResolvedValue(mockBooking);
      const mockPopulate = jest.fn().mockResolvedValue(mockBooking);

      (Booking as unknown as jest.Mock).mockImplementation((data) => {
        capturedBookingData = data;
        return {
          save: mockSave,
          populate: mockPopulate,
        };
      });

      await bookingService.createBooking(createBookingRequest, mockUserId);

      expect(capturedBookingData.totalPrice).toBe(2000); // 1000 * 2
      expect(capturedBookingData.numberOfPeople).toBe(2);
    });

    it("should convert travelDate to Date object", async () => {
      (Package.findById as jest.Mock).mockResolvedValue(mockPackage);

      let capturedBookingData: any;
      const mockSave = jest.fn().mockResolvedValue(mockBooking);
      const mockPopulate = jest.fn().mockResolvedValue(mockBooking);

      (Booking as unknown as jest.Mock).mockImplementation((data) => {
        capturedBookingData = data;
        return {
          save: mockSave,
          populate: mockPopulate,
        };
      });

      await bookingService.createBooking(createBookingRequest, mockUserId);

      expect(capturedBookingData.travelDate).toBeInstanceOf(Date);
    });
  });

  describe("updateBooking", () => {
    const updateRequest: UpdateBookingRequest = {
      numberOfPeople: 3,
      travelDate: "2024-12-30",
    };

    it("should update booking successfully by owner", async () => {
      const bookingWithUserId = { ...mockBooking, user: mockUserId };
      (Booking.findById as jest.Mock).mockResolvedValue(bookingWithUserId);
      (Package.findById as jest.Mock).mockResolvedValue(mockPackage);

      const mockPopulate = jest.fn().mockResolvedValue(mockBooking);
      (Booking.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: mockPopulate,
      });

      const result = await bookingService.updateBooking(
        mockBookingId,
        updateRequest,
        mockUserId,
        "user"
      );

      expect(Booking.findById).toHaveBeenCalledWith(mockBookingId);
      expect(result.message).toBe("Booking updated successfully");
    });

    it("should update booking successfully by admin", async () => {
      const bookingWithUserId = { ...mockBooking, user: mockUserId };
      (Booking.findById as jest.Mock).mockResolvedValue(bookingWithUserId);
      (Package.findById as jest.Mock).mockResolvedValue(mockPackage);

      const mockPopulate = jest.fn().mockResolvedValue(mockBooking);
      (Booking.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: mockPopulate,
      });

      const result = await bookingService.updateBooking(
        mockBookingId,
        updateRequest,
        mockAdminId,
        "admin"
      );

      expect(result.message).toBe("Booking updated successfully");
    });

    it("should throw error when booking not found", async () => {
      (Booking.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        bookingService.updateBooking(
          mockBookingId,
          updateRequest,
          mockUserId,
          "user"
        )
      ).rejects.toThrow("Booking not found");
    });

    it("should throw error when non-owner tries to update", async () => {
      const otherUserId = "507f1f77bcf86cd799439099";
      const bookingWithUserId = { ...mockBooking, user: mockUserId };
      (Booking.findById as jest.Mock).mockResolvedValue(bookingWithUserId);

      await expect(
        bookingService.updateBooking(
          mockBookingId,
          updateRequest,
          otherUserId,
          "user"
        )
      ).rejects.toThrow("Access denied");
    });

    it("should throw error when non-admin tries to update status", async () => {
      const statusUpdate: UpdateBookingRequest = { status: "confirmed" };
      const bookingWithUserId = { ...mockBooking, user: mockUserId };
      (Booking.findById as jest.Mock).mockResolvedValue(bookingWithUserId);

      await expect(
        bookingService.updateBooking(
          mockBookingId,
          statusUpdate,
          mockUserId,
          "user"
        )
      ).rejects.toThrow("Only admin can update booking status");
    });

    it("should allow admin to update status", async () => {
      const statusUpdate: UpdateBookingRequest = { status: "confirmed" };
      const bookingWithUserId = { ...mockBooking, user: mockUserId };
      (Booking.findById as jest.Mock).mockResolvedValue(bookingWithUserId);

      const mockPopulate = jest.fn().mockResolvedValue(mockBooking);
      (Booking.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: mockPopulate,
      });

      const result = await bookingService.updateBooking(
        mockBookingId,
        statusUpdate,
        mockAdminId,
        "admin"
      );

      expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBookingId,
        expect.objectContaining({ status: "confirmed" }),
        { new: true, runValidators: true }
      );
      expect(result.message).toBe("Booking updated successfully");
    });

    it("should recalculate totalPrice when numberOfPeople changes", async () => {
      const bookingWithUserId = {
        ...mockBooking,
        user: mockUserId,
        package: mockPackageId,
      };
      (Booking.findById as jest.Mock).mockResolvedValue(bookingWithUserId);
      (Package.findById as jest.Mock).mockResolvedValue(mockPackage);

      const mockPopulate = jest.fn().mockResolvedValue(mockBooking);
      (Booking.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: mockPopulate,
      });

      await bookingService.updateBooking(
        mockBookingId,
        { numberOfPeople: 3 },
        mockUserId,
        "user"
      );

      expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBookingId,
        expect.objectContaining({
          numberOfPeople: 3,
          totalPrice: 3000, // 1000 * 3
        }),
        { new: true, runValidators: true }
      );
    });

    it("should throw error when updated numberOfPeople exceeds maxPeople", async () => {
      const bookingWithUserId = {
        ...mockBooking,
        user: mockUserId,
        package: mockPackageId,
      };
      (Booking.findById as jest.Mock).mockResolvedValue(bookingWithUserId);
      (Package.findById as jest.Mock).mockResolvedValue(mockPackage);

      await expect(
        bookingService.updateBooking(
          mockBookingId,
          { numberOfPeople: 10 },
          mockUserId,
          "user"
        )
      ).rejects.toThrow("Number of people exceeds maximum allowed (4)");
    });

    it("should update only travelDate when provided", async () => {
      const bookingWithUserId = { ...mockBooking, user: mockUserId };
      (Booking.findById as jest.Mock).mockResolvedValue(bookingWithUserId);

      const mockPopulate = jest.fn().mockResolvedValue(mockBooking);
      (Booking.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: mockPopulate,
      });

      await bookingService.updateBooking(
        mockBookingId,
        { travelDate: "2024-12-30" },
        mockUserId,
        "user"
      );

      expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(
        mockBookingId,
        expect.objectContaining({
          travelDate: expect.any(Date),
        }),
        { new: true, runValidators: true }
      );
    });
  });

  describe("deleteBooking", () => {
    it("should delete booking successfully by owner", async () => {
      const bookingWithUserId = { ...mockBooking, user: mockUserId };
      (Booking.findById as jest.Mock).mockResolvedValue(bookingWithUserId);
      (Booking.findByIdAndDelete as jest.Mock).mockResolvedValue(
        bookingWithUserId
      );

      const result = await bookingService.deleteBooking(
        mockBookingId,
        mockUserId,
        "user"
      );

      expect(Booking.findById).toHaveBeenCalledWith(mockBookingId);
      expect(Booking.findByIdAndDelete).toHaveBeenCalledWith(mockBookingId);
      expect(result.message).toBe("Booking deleted successfully");
    });

    it("should delete booking successfully by admin", async () => {
      const bookingWithUserId = { ...mockBooking, user: mockUserId };
      (Booking.findById as jest.Mock).mockResolvedValue(bookingWithUserId);
      (Booking.findByIdAndDelete as jest.Mock).mockResolvedValue(
        bookingWithUserId
      );

      const result = await bookingService.deleteBooking(
        mockBookingId,
        mockAdminId,
        "admin"
      );

      expect(Booking.findByIdAndDelete).toHaveBeenCalledWith(mockBookingId);
      expect(result.message).toBe("Booking deleted successfully");
    });

    it("should throw error when booking not found", async () => {
      (Booking.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        bookingService.deleteBooking(mockBookingId, mockUserId, "user")
      ).rejects.toThrow("Booking not found");

      expect(Booking.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it("should throw error when non-owner tries to delete", async () => {
      const otherUserId = "507f1f77bcf86cd799439099";
      const bookingWithUserId = { ...mockBooking, user: mockUserId };
      (Booking.findById as jest.Mock).mockResolvedValue(bookingWithUserId);

      await expect(
        bookingService.deleteBooking(mockBookingId, otherUserId, "user")
      ).rejects.toThrow("Access denied");

      expect(Booking.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it("should handle database error during deletion", async () => {
      const bookingWithUserId = { ...mockBooking, user: mockUserId };
      (Booking.findById as jest.Mock).mockResolvedValue(bookingWithUserId);
      (Booking.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error("Database deletion failed")
      );

      await expect(
        bookingService.deleteBooking(mockBookingId, mockUserId, "user")
      ).rejects.toThrow("Database deletion failed");
    });
  });

  describe("Authorization and Access Control", () => {
    it("should enforce user isolation in getAllBookings", async () => {
      const queryParams: BookingQueryParams = {};

      const mockFind = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockResolvedValue([]);

      (Booking.find as jest.Mock).mockImplementation(mockFind);
      mockFind.mockReturnValue({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        sort: mockSort,
      });

      (Booking.countDocuments as jest.Mock).mockResolvedValue(0);

      await bookingService.getAllBookings(mockUserId, "user", queryParams);

      expect(Booking.find).toHaveBeenCalledWith({ user: mockUserId });
    });

    it("should allow admin to access any booking", async () => {
      const mockFindById = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockReturnThis();

      (Booking.findById as jest.Mock).mockImplementation(mockFindById);
      mockFindById.mockReturnValue({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        populate: mockPopulate,
      });
      mockPopulate.mockResolvedValueOnce(mockBooking);

      const result = await bookingService.getBookingById(
        mockBookingId,
        mockAdminId,
        "admin"
      );

      expect(result.booking).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero pagination results", async () => {
      const queryParams: BookingQueryParams = { page: 1, limit: 10 };

      const mockFind = jest.fn().mockReturnThis();
      const mockPopulate = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockResolvedValue([]);

      (Booking.find as jest.Mock).mockImplementation(mockFind);
      mockFind.mockReturnValue({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        populate: mockPopulate,
      });
      mockPopulate.mockReturnValueOnce({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        sort: mockSort,
      });

      (Booking.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await bookingService.getAllBookings(
        mockUserId,
        "user",
        queryParams
      );

      expect(result.bookings).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });

    it("should handle booking with minimum numberOfPeople (1)", async () => {
      const minRequest: CreateBookingRequest = {
        package: mockPackageId,
        numberOfPeople: 1,
        travelDate: "2024-12-25",
      };

      (Package.findById as jest.Mock).mockResolvedValue(mockPackage);

      const mockSave = jest.fn().mockResolvedValue(mockBooking);
      const mockPopulate = jest.fn().mockResolvedValue(mockBooking);

      (Booking as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        populate: mockPopulate,
      }));

      await bookingService.createBooking(minRequest, mockUserId);

      expect(mockSave).toHaveBeenCalled();
    });

    it("should handle booking with exact maxPeople", async () => {
      const maxRequest: CreateBookingRequest = {
        package: mockPackageId,
        numberOfPeople: 4,
        travelDate: "2024-12-25",
      };

      (Package.findById as jest.Mock).mockResolvedValue(mockPackage);

      const mockSave = jest.fn().mockResolvedValue(mockBooking);
      const mockPopulate = jest.fn().mockResolvedValue(mockBooking);

      (Booking as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        populate: mockPopulate,
      }));

      await bookingService.createBooking(maxRequest, mockUserId);

      expect(mockSave).toHaveBeenCalled();
    });
  });
});
