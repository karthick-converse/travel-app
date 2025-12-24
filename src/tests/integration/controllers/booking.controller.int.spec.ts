import { Request, Response } from "express";
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
} from "../../../controllers/bookingController";
import Booking from "../../../models/Booking";
import Package from "../../../models/Package";
import User from "../../../models/User";
import { AuthRequest } from "../../../types/index";
import dotenv from "dotenv";
import { connectTestDB, closeTestDB } from "../../setup/db";

dotenv.config();
jest.setTimeout(30000);

describe("Booking Controller - Integration Tests", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let testUser: any;
  let adminUser: any;
  let testPackage: any;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    req = {
      body: {},
      params: {},
      query: {},
      user: undefined,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();

    // Clear collections
    await User.deleteMany({});
    await Booking.deleteMany({});
    await Package.deleteMany({});

    // Create test users
    testUser = await User.create({
      name: "Test User",
      email: "testuser@test.com",
      password: "hashedpassword123",
      role: "user",
    });

    adminUser = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      password: "hashedpassword123",
      role: "admin",
    });

    // Create test package
    testPackage = await Package.create({
      title: "Test Package",
      destination: "Test Destination",
      description: "A test travel package",
      price: 1000,
      duration: 5, // ✅ correct
      availableDates: [
        new Date("2025-12-25T00:00:00.000Z"),
        new Date("2025-12-26T00:00:00.000Z"),
      ],
      image: "test-image.jpg",
      maxPeople: 10,
    });
  });

  afterEach(async () => {
    await Booking.deleteMany({});
    await Package.deleteMany({});
    await User.deleteMany({});
  });

  describe("createBooking", () => {
    it("should create a new booking successfully", async () => {
      const futureDate = new Date("2025-12-25T00:00:00.000Z");
      req.body = {
        package: testPackage._id.toString(),
        numberOfPeople: 2,
        travelDate: futureDate.toISOString(),
      };
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: testUser.role,
      };

      await createBooking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Booking created successfully",
          booking: expect.objectContaining({
            numberOfPeople: 2,
          }),
        })
      );

      // Verify booking in database
      const bookings = await Booking.find();
      expect(bookings.length).toBe(1);
      expect(bookings[0].numberOfPeople).toBe(2);
    });

    it("should return 404 if package not found", async () => {
      const futureDate = new Date("2025-12-25T00:00:00.000Z");
      const fakePackageId = "63b123456789abcdef123456";

      req.body = {
        package: fakePackageId,
        numberOfPeople: 2,
        travelDate: futureDate.toISOString(),
      };
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: testUser.role,
      };

      await createBooking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Package not found",
        })
      );
    });

    it("should return 400 if number of people exceeds maximum", async () => {
      const futureDate = new Date("2025-12-25T00:00:00.000Z");
      req.body = {
        package: testPackage._id.toString(),
        numberOfPeople: 15, // Exceeds maxPeople (10)
        travelDate: futureDate.toISOString(),
      };
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: testUser.role,
      };

      await createBooking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("exceeds maximum"),
        })
      );
    });
  });

  describe("getAllBookings", () => {
    beforeEach(async () => {
      // Create test bookings
      const futureDate = new Date("2025-12-25T00:00:00.000Z");
      await Booking.create({
        user: testUser._id,
        package: testPackage._id,
        numberOfPeople: 2,
        travelDate: futureDate,
        totalPrice: 2000,
        status: "pending",
      });

      await Booking.create({
        user: testUser._id,
        package: testPackage._id,
        numberOfPeople: 3,
        travelDate: futureDate,
        totalPrice: 3000,
        status: "confirmed",
      });
    });

    it("should return all bookings for user", async () => {
      req.query = { page: "1", limit: "10" };
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: "user",
      };

      await getAllBookings(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          bookings: expect.any(Array),
          pagination: expect.any(Object),
        })
      );

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.bookings.length).toBe(2);
    });

    it("should return all bookings for admin", async () => {
      req.query = { page: "1", limit: "10" };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };

      await getAllBookings(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          bookings: expect.any(Array),
          pagination: expect.any(Object),
        })
      );

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.bookings.length).toBeGreaterThan(0);
    });

    it("should filter bookings by status", async () => {
      req.query = { page: "1", limit: "10", status: "confirmed" };
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: "user",
      };

      await getAllBookings(req as AuthRequest, res as Response);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.bookings.length).toBe(1);
      expect(response.bookings[0].status).toBe("confirmed");
    });
  });

  describe("getBookingById", () => {
    let testBooking: any;

    beforeEach(async () => {
      const futureDate = new Date("2025-12-25T00:00:00.000Z");
      testBooking = await Booking.create({
        user: testUser._id,
        package: testPackage._id,
        numberOfPeople: 2,
        travelDate: futureDate,
        totalPrice: 2000,
        status: "pending",
      });
    });

    it("should return booking by ID for owner", async () => {
      req.params = { id: testBooking._id.toString() };
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: "user",
      };

      await getBookingById(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          booking: expect.objectContaining({
            _id: testBooking._id,
            numberOfPeople: 2,
          }),
        })
      );
    });

    it("should return booking by ID for admin", async () => {
      req.params = { id: testBooking._id.toString() };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };

      await getBookingById(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          booking: expect.any(Object),
        })
      );
    });

    it("should return 404 if booking not found", async () => {
      const fakeId = "63b123456789abcdef123456";
      req.params = { id: fakeId };
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: "user",
      };

      await getBookingById(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Booking not found",
        })
      );
    });

    it("should return 403 if user tries to access another user's booking", async () => {
      const anotherUser = await User.create({
        name: "Another User",
        email: "another@test.com",
        password: "hashedpassword123",
        role: "user",
      });

      req.params = { id: testBooking._id.toString() };
      req.user = {
        id: anotherUser._id.toString(),
        email: anotherUser.email,
        role: "user",
      };

      await getBookingById(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Access denied",
        })
      );
    });
  });

  describe("updateBooking", () => {
    let testBooking: any;

    beforeEach(async () => {
      const futureDate = new Date("2025-12-25T00:00:00.000Z");
      testBooking = await Booking.create({
        user: testUser._id,
        package: testPackage._id,
        numberOfPeople: 2,
        travelDate: futureDate,
        totalPrice: 2000,
        status: "pending",
      });
    });

    it("should update booking by owner", async () => {
      req.params = { id: testBooking._id.toString() };
      req.body = { numberOfPeople: 3 };
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: "user",
      };

      await updateBooking(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          booking: expect.objectContaining({
            numberOfPeople: 3,
          }),
        })
      );

      // Verify in database
      const updatedBooking = await Booking.findById(testBooking._id);
      expect(updatedBooking?.numberOfPeople).toBe(3);
    });

    it("should allow admin to update any booking", async () => {
      req.params = { id: testBooking._id.toString() };
      req.body = { numberOfPeople: 5, status: "confirmed" };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };

      await updateBooking(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          booking: expect.objectContaining({
            numberOfPeople: 5,
            status: "confirmed",
          }),
        })
      );
    });

    it("should return 404 if booking not found", async () => {
      const fakeId = "63b123456789abcdef123456";
      req.params = { id: fakeId };
      req.body = { numberOfPeople: 3 };
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: "user",
      };

      await updateBooking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Booking not found",
        })
      );
    });

    it("should return 403 if user tries to update another user's booking", async () => {
      const anotherUser = await User.create({
        name: "Another User",
        email: "another@test.com",
        password: "hashedpassword123",
        role: "user",
      });

      req.params = { id: testBooking._id.toString() };
      req.body = { numberOfPeople: 3 };
      req.user = {
        id: anotherUser._id.toString(),
        email: anotherUser.email,
        role: "user",
      };

      await updateBooking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Access denied",
        })
      );
    });

    it("should return 400 if numberOfPeople exceeds maximum", async () => {
      req.params = { id: testBooking._id.toString() };
      req.body = { numberOfPeople: 15 }; // Exceeds maxPeople (10)
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: "user",
      };

      await updateBooking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("exceeds maximum"),
        })
      );
    });
  });

  describe("deleteBooking", () => {
    let testBooking: any;

    beforeEach(async () => {
      const futureDate = new Date("2025-12-25T00:00:00.000Z");
      testBooking = await Booking.create({
        user: testUser._id,
        package: testPackage._id,
        numberOfPeople: 2,
        travelDate: futureDate,
        totalPrice: 2000,
        status: "pending",
      });
    });

    it("should delete booking by owner", async () => {
      req.params = { id: testBooking._id.toString() };
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: "user",
      };

      await deleteBooking(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Booking deleted successfully",
        })
      );

      // Verify deletion in database
      const deletedBooking = await Booking.findById(testBooking._id);
      expect(deletedBooking).toBeNull();
    });

    it("should allow admin to delete any booking", async () => {
      req.params = { id: testBooking._id.toString() };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };

      await deleteBooking(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Booking deleted successfully",
        })
      );

      // Verify deletion
      const deletedBooking = await Booking.findById(testBooking._id);
      expect(deletedBooking).toBeNull();
    });

    it("should return 404 if booking not found", async () => {
      const fakeId = "63b123456789abcdef123456";
      req.params = { id: fakeId };
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: "user",
      };

      await deleteBooking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Booking not found",
        })
      );
    });

    it("should return 403 if user tries to delete another user's booking", async () => {
      const anotherUser = await User.create({
        name: "Another User",
        email: "another@test.com",
        password: "hashedpassword123",
        role: "user",
      });

      req.params = { id: testBooking._id.toString() };
      req.user = {
        id: anotherUser._id.toString(),
        email: anotherUser.email,
        role: "user",
      };

      await deleteBooking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Access denied",
        })
      );
    });

    it("should throw error when trying to delete already deleted booking", async () => {
      req.params = { id: testBooking._id.toString() };
      req.user = {
        id: testUser._id.toString(),
        email: testUser.email,
        role: "user",
      };

      // Delete first time
      await deleteBooking(req as AuthRequest, res as Response);
      jest.clearAllMocks();

      // Try to delete again
      await deleteBooking(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Booking not found",
        })
      );
    });
  });
});
