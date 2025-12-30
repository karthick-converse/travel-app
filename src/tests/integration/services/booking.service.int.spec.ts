import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { BookingService } from "../../../services/bookingService";
import Booking from "../../../models/Booking";
import Package from "../../../models/Package";
import User from "../../../models/User";
import { UpdateBookingRequest } from "../../../dto/booking.dto";
import { connectTestDB, closeTestDB } from "../../setup/db";

describe("BookingService Integration Tests", () => {
  let bookingService: BookingService;
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
    bookingService = new BookingService();

    // Create test user
    testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "user",
    });

    // Create admin user
    adminUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      role: "admin",
    });

    // Create test package
    testPackage = await Package.create({
      title: "Beach Paradise",
      description: "Relaxing beach vacation",
      destination: "Maldives",
      price: 1500,
      duration: 7,
      maxPeople: 5,
      isActive: true,
    });
  });

  afterEach(async () => {
    await Booking.deleteMany({});
    await Package.deleteMany({});
    await User.deleteMany({});
  });

  describe("createBooking", () => {
    it("should create a booking successfully", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const result = await bookingService.createBooking(
        {
          package: testPackage._id.toString(),
          numberOfPeople: 2,
          travelDate: futureDate.toISOString(),
        },
        testUser._id.toString()
      );

      expect(result.message).toBe("Booking created successfully");
      expect(result.booking).toBeDefined();
    });

    it("should throw error when package not found", async () => {
      const bookingData = {
        package: new mongoose.Types.ObjectId().toString(),
        numberOfPeople: 2,
        travelDate: "2024-12-25",
      };

      await expect(
        bookingService.createBooking(bookingData, testUser._id.toString())
      ).rejects.toThrow("Package not found");
    });

    it("should throw error when package is not active", async () => {
      testPackage.isActive = false;
      await testPackage.save();

      const bookingData = {
        package: testPackage._id.toString(),
        numberOfPeople: 2,
        travelDate: "2024-12-25",
      };

      await expect(
        bookingService.createBooking(bookingData, testUser._id.toString())
      ).rejects.toThrow("Package is not available");
    });

    it("should throw error when number of people exceeds maximum", async () => {
      const bookingData = {
        package: testPackage._id.toString(),
        numberOfPeople: 10,
        travelDate: "2024-12-25",
      };

      await expect(
        bookingService.createBooking(bookingData, testUser._id.toString())
      ).rejects.toThrow("Number of people exceeds maximum allowed (5)");
    });

    it("should calculate total price correctly", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const bookingData = {
        package: testPackage._id.toString(),
        numberOfPeople: 3,
        travelDate: futureDate.toISOString(),
      };

      const result = await bookingService.createBooking(
        bookingData,
        testUser._id.toString()
      );

      expect(result.booking.totalPrice).toBe(4500); // 1500 * 3
    });
  });

  describe("getAllBookings", () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      // Create multiple bookings
      await Booking.create({
        user: testUser._id,
        package: testPackage._id,
        numberOfPeople: 2,
        totalPrice: 3000,
        travelDate: futureDate,
        status: "pending",
      });

      await Booking.create({
        user: testUser._id,
        package: testPackage._id,
        numberOfPeople: 3,
        totalPrice: 4500,
        travelDate: futureDate,
        status: "confirmed",
      });

      await Booking.create({
        user: adminUser._id,
        package: testPackage._id,
        numberOfPeople: 1,
        totalPrice: 1500,
        travelDate: futureDate,
        status: "pending",
      });
    });

    it("should return only user's bookings for regular users", async () => {
      const result = await bookingService.getAllBookings(
        testUser._id.toString(),
        "user",
        {}
      );

      expect(result.bookings).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it("should return all bookings for admin", async () => {
      const result = await bookingService.getAllBookings(
        adminUser._id.toString(),
        "admin",
        {}
      );

      expect(result.bookings).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it("should filter bookings by status", async () => {
      const result = await bookingService.getAllBookings(
        adminUser._id.toString(),
        "admin",
        { status: "pending" }
      );

      expect(result.bookings).toHaveLength(2);
      result.bookings.forEach((booking) => {
        expect(booking.status).toBe("pending");
      });
    });

    it("should paginate results correctly", async () => {
      const result = await bookingService.getAllBookings(
        adminUser._id.toString(),
        "admin",
        { page: 1, limit: 2 }
      );

      expect(result.bookings).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.pages).toBe(2);
    });

    it("should populate user and package details", async () => {
      const result = await bookingService.getAllBookings(
        testUser._id.toString(),
        "user",
        {}
      );

      const booking = result.bookings[0] as any;

      expect(booking.user).toBeDefined();
      expect(booking.user.name).toBe("Test User");

      expect(booking.package).toBeDefined();
      expect(booking.package.title).toBe("Beach Paradise");
    });
  });

  describe("getBookingById", () => {
    let testBooking: any;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    beforeEach(async () => {
      testBooking = await Booking.create({
        user: testUser._id,
        package: testPackage._id,
        numberOfPeople: 2,
        totalPrice: 3000,
        travelDate: futureDate,
        status: "pending",
      });
    });

    it("should return booking for the owner", async () => {
      const result = await bookingService.getBookingById(
        testBooking._id.toString(),
        testUser._id.toString(),
        "user"
      );

      expect(result.booking).toBeDefined();
      expect(result.booking._id.toString()).toBe(testBooking._id.toString());
    });

    it("should return booking for admin", async () => {
      const result = await bookingService.getBookingById(
        testBooking._id.toString(),
        adminUser._id.toString(),
        "admin"
      );

      expect(result.booking).toBeDefined();
      expect(result.booking._id.toString()).toBe(testBooking._id.toString());
    });

    it("should throw error when booking not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        bookingService.getBookingById(fakeId, testUser._id.toString(), "user")
      ).rejects.toThrow("Booking not found");
    });

    it("should throw error when user tries to access another user's booking", async () => {
      const otherUser = await User.create({
        name: "Other User",
        email: "other@example.com",
        password: "password123",
        role: "user",
      });

      await expect(
        bookingService.getBookingById(
          testBooking._id.toString(),
          otherUser._id.toString(),
          "user"
        )
      ).rejects.toThrow("Access denied");
    });
  });

  describe("updateBooking", () => {
    let testBooking: any;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      testBooking = await Booking.create({
        user: testUser._id,
        package: testPackage._id,
        numberOfPeople: 2,
        totalPrice: 3000,
        travelDate: futureDate,
        status: "pending",
      });
    });

    it("should update numberOfPeople and recalculate totalPrice", async () => {
      const updateData = {
        numberOfPeople: 4,
      };

      const result = await bookingService.updateBooking(
        testBooking._id.toString(),
        updateData,
        testUser._id.toString(),
        "user"
      );

      expect(result.booking!.numberOfPeople).toBe(4);
      expect(result.booking!.totalPrice).toBe(6000); // 1500 * 4
    });

    it("should update travelDate", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const updateData = {
        travelDate: futureDate.toISOString(),
      };

      const result = await bookingService.updateBooking(
        testBooking._id.toString(),
        updateData,
        testUser._id.toString(),
        "user"
      );

      expect(result.booking!.travelDate).toEqual(futureDate);
    });

    it("should allow admin to update status", async () => {
      const updateData: UpdateBookingRequest = {
        status: "confirmed",
      };

      const result = await bookingService.updateBooking(
        testBooking._id.toString(),
        updateData,
        adminUser._id.toString(),
        "admin"
      );

      expect(result.booking!.status).toBe("confirmed");
    });

    it("should throw error when regular user tries to update status", async () => {
      const updateData: UpdateBookingRequest = {
        status: "confirmed",
      };

      await expect(
        bookingService.updateBooking(
          testBooking._id.toString(),
          updateData,
          testUser._id.toString(),
          "user"
        )
      ).rejects.toThrow("Only admin can update booking status");
    });

    it("should throw error when numberOfPeople exceeds maximum", async () => {
      const updateData = {
        numberOfPeople: 10,
      };

      await expect(
        bookingService.updateBooking(
          testBooking._id.toString(),
          updateData,
          testUser._id.toString(),
          "user"
        )
      ).rejects.toThrow("Number of people exceeds maximum allowed (5)");
    });

    it("should throw error when user tries to update another user's booking", async () => {
      const otherUser = await User.create({
        name: "Other User",
        email: "other@example.com",
        password: "password123",
        role: "user",
      });

      const updateData = {
        numberOfPeople: 3,
      };

      await expect(
        bookingService.updateBooking(
          testBooking._id.toString(),
          updateData,
          otherUser._id.toString(),
          "user"
        )
      ).rejects.toThrow("Access denied");
    });

    it("should throw error when booking not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        numberOfPeople: 3,
      };

      await expect(
        bookingService.updateBooking(
          fakeId,
          updateData,
          testUser._id.toString(),
          "user"
        )
      ).rejects.toThrow("Booking not found");
    });
  });

  describe("deleteBooking", () => {
    let testBooking: any;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    beforeEach(async () => {
      testBooking = await Booking.create({
        user: testUser._id,
        package: testPackage._id,
        numberOfPeople: 2,
        totalPrice: 3000,
        travelDate: futureDate,
        status: "pending",
      });
    });

    it("should delete booking by owner", async () => {
      const result = await bookingService.deleteBooking(
        testBooking._id.toString(),
        testUser._id.toString(),
        "user"
      );

      expect(result.message).toBe("Booking deleted successfully");

      const deletedBooking = await Booking.findById(testBooking._id);
      expect(deletedBooking).toBeNull();
    });

    it("should delete booking by admin", async () => {
      const result = await bookingService.deleteBooking(
        testBooking._id.toString(),
        adminUser._id.toString(),
        "admin"
      );

      expect(result.message).toBe("Booking deleted successfully");

      const deletedBooking = await Booking.findById(testBooking._id);
      expect(deletedBooking).toBeNull();
    });

    it("should throw error when booking not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        bookingService.deleteBooking(fakeId, testUser._id.toString(), "user")
      ).rejects.toThrow("Booking not found");
    });

    it("should throw error when user tries to delete another user's booking", async () => {
      const otherUser = await User.create({
        name: "Other User",
        email: "other@example.com",
        password: "password123",
        role: "user",
      });

      await expect(
        bookingService.deleteBooking(
          testBooking._id.toString(),
          otherUser._id.toString(),
          "user"
        )
      ).rejects.toThrow("Access denied");
    });
  });
});
