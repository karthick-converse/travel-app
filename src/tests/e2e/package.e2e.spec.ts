import request from "supertest";
import app from "../../app";
import { connectTestDB, closeTestDB } from "../setup/db";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
jest.setTimeout(20000);

describe("Package Controller - E2e Tests", () => {
  let token: string;
  let packageId: string;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set in test environment");
    }

    await connectTestDB();

    // Clean up any existing test user
    const User = mongoose.model("User");
    await User.deleteMany({ email: "package@test.com" });

    // Register a test admin user
    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Admin",
      email: "package@test.com",
      password: "Password@123",
      role: "admin",
    });


    if (registerRes.status !== 201 && registerRes.status !== 200) {
      throw new Error(`Registration failed with status ${registerRes.status}`);
    }

    // Login to get JWT token
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "package@test.com",
      password: "Password@123",
    });


    if (loginRes.status !== 200) {
      throw new Error(`Login failed with status ${loginRes.status}`);
    }

    // Check if token exists
    if (!loginRes.body.token) {
      throw new Error("Failed to get authentication token");
    }

    token = loginRes.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    try {
      const Package = mongoose.model("Package");
      await Package.deleteMany({ title: "Beach Holiday Package" });

      const User = mongoose.model("User");
      await User.deleteMany({ email: "package@test.com" });
    } catch (error) {
    }

    await closeTestDB();
  });

  // -------------------------
  // CREATE PACKAGE
  // -------------------------
  it("should create a new package", async () => {
    const res = await request(app)
      .post("/api/packages")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Beach Holiday Package",
        destination: "Maldives",
        price: 1500,
        duration: 7,
        maxPeople: 10,
        description: "Relaxing beach vacation with all amenities",
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("package");
    expect(res.body.package).toHaveProperty("_id");
    packageId = res.body.package._id; // Fixed: access nested _id
  });

  // -------------------------
  // GET ALL PACKAGES
  // -------------------------
  it("should return all packages with pagination", async () => {
    const res = await request(app).get(
      "/api/packages?page=1&limit=10&destination=Maldives&isActive=true"
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.packages)).toBe(true);
  });

  // -------------------------
  // GET PACKAGE BY ID
  // -------------------------
  it("should return a package by ID", async () => {
    if (!packageId) {
      throw new Error("Package ID not available. Create test may have failed.");
    }

    const res = await request(app).get(`/api/packages/${packageId}`);


    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("package");
    expect(res.body.package).toHaveProperty("_id", packageId);
  });

  it("should return 404 if package not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/packages/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Package not found");
  });

  // -------------------------
  // UPDATE PACKAGE
  // -------------------------
  it("should update a package", async () => {
    if (!packageId) {
      throw new Error("Package ID not available. Create test may have failed.");
    }

    const res = await request(app)
      .put(`/api/packages/${packageId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 1800 });

    expect(res.status).toBe(200);
    expect(res.body.package.price).toBe(1800);
  });

  it("should return 404 if package to update is not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/packages/${fakeId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 2000 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Package not found");
  });

  // -------------------------
  // DELETE PACKAGE
  // -------------------------
  it("should delete a package", async () => {
    if (!packageId) {
      throw new Error("Package ID not available. Create test may have failed.");
    }

    const res = await request(app)
      .delete(`/api/packages/${packageId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Package deleted successfully");
  });

  it("should return 404 if package to delete is not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/packages/${fakeId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Package not found");
  });
});
