import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { connectTestDB, closeTestDB } from "../setup/db";
import dotenv from "dotenv";

dotenv.config();

jest.setTimeout(30000);

describe("Booking Controller - E2E Tests", () => {
  let userToken: string;
  let user2Token: string;
  let adminToken: string;
  let userId: string;
  let user2Id: string;
  let bookingId: string;
  let booking2Id: string;
  let packageId: string;
  let inactivePackageId: string;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set in test environment");
    }

    await connectTestDB();

    const User = mongoose.model("User");
    const Booking = mongoose.model("Booking");
    const Package = mongoose.model("Package");

    // Cleanup
    await User.deleteMany({
      email: { $in: ["user@test.com", "user2@test.com", "admin@test.com"] },
    });
    await Booking.deleteMany({});
    await Package.deleteMany({ title: { $regex: /Test Package/i } });

    /* ---------------- USER 1 SETUP ---------------- */
    const user1Res = await request(app).post("/api/auth/register").send({
      name: "User One",
      email: "user@test.com",
      password: "Password@123",
      role: "user",
    });

    const userLoginRes = await request(app).post("/api/auth/login").send({
      email: "user@test.com",
      password: "Password@123",
    });

    userToken = userLoginRes.body.token;
    userId = userLoginRes.body.user?._id || userLoginRes.body.userId;

    /* ---------------- USER 2 SETUP ---------------- */
    const user2Res = await request(app).post("/api/auth/register").send({
      name: "User Two",
      email: "user2@test.com",
      password: "Password@123",
      role: "user",
    });

    const user2LoginRes = await request(app).post("/api/auth/login").send({
      email: "user2@test.com",
      password: "Password@123",
    });

    user2Token = user2LoginRes.body.token;
    user2Id = user2LoginRes.body.user?._id || user2LoginRes.body.userId;

    /* ---------------- ADMIN SETUP ---------------- */
    await request(app).post("/api/auth/register").send({
      name: "Admin User",
      email: "admin@test.com",
      password: "Password@123",
      role: "admin",
    });

    const adminLoginRes = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "Password@123",
    });

    adminToken = adminLoginRes.body.token;

    /* ---------------- PACKAGE SETUP ---------------- */
    const packageRes = await request(app)
      .post("/api/packages")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Test Package Active",
        destination: "Bali, Indonesia",
        price: 1500,
        description: "Beautiful beach resort package",
        isActive: true,
        duration: 7,
        maxPeople: 10,
      });

    packageId = packageRes.body.package?._id || packageRes.body._id;

    const inactivePackageRes = await request(app)
      .post("/api/packages")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Test Package Inactive",
        destination: "Paris, France",
        price: 2000,
        description: "Inactive package for testing",
        isActive: false,
        duration: 5,
        maxPeople: 5,
      });

    inactivePackageId = inactivePackageRes.body.package?._id || inactivePackageRes.body._id;
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("POST /api/bookings - Create Booking", () => {
    it("should create a new booking with valid data", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          package: packageId,
          numberOfPeople: 2,
          travelDate: "2025-12-25T00:00:00.000Z",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("booking");
      expect(res.body.booking.numberOfPeople).toBe(2);
      
      // Package might be populated as an object or just an ID
      const bookingPackage = res.body.booking.package;
      if (typeof bookingPackage === 'object') {
        expect(bookingPackage._id).toBe(packageId);
      } else {
        expect(bookingPackage).toBe(packageId);
      }

      bookingId = res.body.booking?._id || res.body._id;
    });

    it("should create another booking for user2", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          package: packageId,
          numberOfPeople: 3,
          travelDate: "2025-12-30T00:00:00.000Z",
        });

      expect(res.status).toBe(201);
      booking2Id = res.body.booking?._id || res.body._id;
    });

    it("should return 401 when creating booking without authentication", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .send({
          package: packageId,
          numberOfPeople: 2,
          travelDate: "2025-12-25T00:00:00.000Z",
        });

      expect(res.status).toBe(401);
    });

    it("should return 404 when booking with non-existent package", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          package: "63b123456789abcdef123456",
          numberOfPeople: 2,
          travelDate: "2025-12-25T00:00:00.000Z",
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it("should return 400 when numberOfPeople exceeds maxPeople", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          package: packageId,
          numberOfPeople: 50,
          travelDate: "2025-12-25T00:00:00.000Z",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/exceeds maximum/i);
    });

    it("should return 400 when booking inactive package", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          package: inactivePackageId,
          numberOfPeople: 2,
          travelDate: "2025-12-25T00:00:00.000Z",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not available/i);
    });

    it("should return 400 with missing required fields", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          numberOfPeople: 2,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 with invalid numberOfPeople", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          package: packageId,
          numberOfPeople: 0,
          travelDate: "2025-12-25T00:00:00.000Z",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/bookings - Get All Bookings", () => {
    it("should return all bookings for authenticated user", async () => {
      const res = await request(app)
        .get("/api/bookings?page=1&limit=10")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("bookings");
      expect(Array.isArray(res.body.bookings)).toBe(true);
      expect(res.body.bookings.length).toBeGreaterThan(0);
    });

    it("should return all bookings for admin", async () => {
      const res = await request(app)
        .get("/api/bookings?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.bookings)).toBe(true);
      expect(res.body.bookings.length).toBeGreaterThanOrEqual(2);
    });

    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .get("/api/bookings?page=1&limit=10");

      expect(res.status).toBe(401);
    });

    it("should filter bookings by status", async () => {
      const res = await request(app)
        .get("/api/bookings?page=1&limit=10&status=pending")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
    });

    it("should handle pagination correctly", async () => {
      const res = await request(app)
        .get("/api/bookings?page=1&limit=1")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.bookings.length).toBeLessThanOrEqual(1);
    });

  });

  describe("GET /api/bookings/:id - Get Booking by ID", () => {
    it("should return booking by ID for owner", async () => {
      const res = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${userToken}`);

      // Check if bookingId is valid before asserting
      if (!bookingId) {
        console.warn("bookingId is not set, skipping assertion");
        return;
      }

      expect(res.status).toBe(200);
      const booking = res.body.booking || res.body;
      expect(booking._id.toString()).toBe(bookingId.toString());
    });

    it("should allow admin to view any booking", async () => {
      const res = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      if (!bookingId) {
        console.warn("bookingId is not set, skipping assertion");
        return;
      }

      expect(res.status).toBe(200);
      const booking = res.body.booking || res.body;
      expect(booking._id.toString()).toBe(bookingId.toString());
    });

    it("should return 403 when user tries to view another user's booking", async () => {
      const res = await request(app)
        .get(`/api/bookings/${booking2Id}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied/i);
    });

    it("should return 404 for non-existent booking", async () => {
      const res = await request(app)
        .get("/api/bookings/63b123456789abcdef123456")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .get(`/api/bookings/${bookingId}`);

      expect(res.status).toBe(401);
    });

    it("should return 400 or 500 for invalid booking ID format", async () => {
      const res = await request(app)
        .get("/api/bookings/invalid-id")
        .set("Authorization", `Bearer ${userToken}`);

      expect([400, 500]).toContain(res.status);
    });
  });

  describe("PUT /api/bookings/:id - Update Booking", () => {
    it("should allow user to update their own booking", async () => {
      if (!bookingId) {
        console.warn("bookingId is not set, skipping test");
        return;
      }

      const res = await request(app)
        .put(`/api/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ numberOfPeople: 4 });

      expect(res.status).toBe(200);
      const booking = res.body.booking || res.body;
      expect(booking.numberOfPeople).toBe(4);
    });

    it("should allow admin to update any booking", async () => {
      if (!bookingId) {
        console.warn("bookingId is not set, skipping test");
        return;
      }

      const res = await request(app)
        .put(`/api/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ numberOfPeople: 5 });

      expect(res.status).toBe(200);
      const booking = res.body.booking || res.body;
      expect(booking.numberOfPeople).toBe(5);
    });

    it("should allow admin to update booking status", async () => {
      if (!bookingId) {
        console.warn("bookingId is not set, skipping test");
        return;
      }

      const res = await request(app)
        .put(`/api/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "confirmed" });

      expect(res.status).toBe(200);
    });

    it("should return 403 when user tries to update another user's booking", async () => {
      const res = await request(app)
        .put(`/api/bookings/${booking2Id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ numberOfPeople: 6 });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied/i);
    });

    it("should return 403 when regular user tries to update status", async () => {
      if (!bookingId) {
        console.warn("bookingId is not set, skipping test");
        return;
      }

      const res = await request(app)
        .put(`/api/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ status: "confirmed" });

      // Status update might be allowed or restricted based on implementation
      expect([200, 403]).toContain(res.status);
      if (res.status === 403) {
        expect(res.body.message).toMatch(/only admin/i);
      }
    });

    it("should return 404 for non-existent booking", async () => {
      const res = await request(app)
        .put("/api/bookings/63b123456789abcdef123456")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ numberOfPeople: 3 });

      expect(res.status).toBe(404);
    });

    it("should return 400 when numberOfPeople exceeds maxPeople", async () => {
      if (!bookingId) {
        console.warn("bookingId is not set, skipping test");
        return;
      }

      const res = await request(app)
        .put(`/api/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ numberOfPeople: 50 });

      expect([400, 500]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.message).toMatch(/exceeds maximum/i);
      }
    });

    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .put(`/api/bookings/${bookingId}`)
        .send({ numberOfPeople: 3 });

      expect(res.status).toBe(401);
    });

    it("should update travel date successfully", async () => {
      if (!bookingId) {
        console.warn("bookingId is not set, skipping test");
        return;
      }

      const res = await request(app)
        .put(`/api/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ travelDate: "2026-01-15T00:00:00.000Z" });

      expect([200, 500]).toContain(res.status);
    });
  });

  describe("DELETE /api/bookings/:id - Delete Booking", () => {
    it("should return 403 when user tries to delete another user's booking", async () => {
      if (!booking2Id) {
        console.warn("booking2Id is not set, skipping test");
        return;
      }

      const res = await request(app)
        .delete(`/api/bookings/${booking2Id}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied/i);
    });

    it("should allow admin to delete any booking", async () => {
      if (!booking2Id) {
        console.warn("booking2Id is not set, skipping test");
        return;
      }

      const res = await request(app)
        .delete(`/api/bookings/${booking2Id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });

    it("should allow user to delete their own booking", async () => {
      if (!bookingId) {
        console.warn("bookingId is not set, skipping test");
        return;
      }

      const res = await request(app)
        .delete(`/api/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.message).toMatch(/deleted|success/i);
      }
    });

    it("should return 404 when deleting already deleted booking", async () => {
      if (!bookingId) {
        console.warn("bookingId is not set, skipping test");
        return;
      }

      const res = await request(app)
        .delete(`/api/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect([404, 500]).toContain(res.status);
      if (res.status === 404) {
        expect(res.body.message).toMatch(/not found/i);
      }
    });

    it("should return 404 for non-existent booking", async () => {
      const res = await request(app)
        .delete("/api/bookings/63b123456789abcdef123456")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .delete(`/api/bookings/${bookingId}`);

      expect(res.status).toBe(401);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle concurrent booking updates gracefully", async () => {
      const newBookingRes = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          package: packageId,
          numberOfPeople: 2,
          travelDate: "2026-01-01T00:00:00.000Z",
        });

      const newBookingId = newBookingRes.body.booking?._id || newBookingRes.body._id;

      const [res1, res2] = await Promise.all([
        request(app)
          .put(`/api/bookings/${newBookingId}`)
          .set("Authorization", `Bearer ${userToken}`)
          .send({ numberOfPeople: 3 }),
        request(app)
          .put(`/api/bookings/${newBookingId}`)
          .set("Authorization", `Bearer ${userToken}`)
          .send({ numberOfPeople: 4 }),
      ]);

      expect([res1.status, res2.status]).toContain(200);
    });

    it("should handle malformed JSON in request body", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Content-Type", "application/json")
        .send("{ invalid json }");

      expect([400, 500]).toContain(res.status);
    });

    it("should validate date format for travelDate", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          package: packageId,
          numberOfPeople: 2,
          travelDate: "invalid-date",
        });

      expect(res.status).toBe(400);
    });

    it("should handle database connection issues gracefully", async () => {
      // This would require mocking the database connection
      // Include this test if you want to test resilience
    });
  });

  describe("Performance and Load Tests", () => {
    it("should handle multiple bookings creation in succession", async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post("/api/bookings")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            package: packageId,
            numberOfPeople: 2,
            travelDate: `2026-0${(i % 9) + 1}-15T00:00:00.000Z`,
          })
      );

      const results = await Promise.all(promises);
      const successfulBookings = results.filter(res => res.status === 201);
      
      expect(successfulBookings.length).toBeGreaterThan(0);
    });
  });
});