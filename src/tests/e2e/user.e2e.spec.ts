import request from "supertest";
import app from "../../app";
import dotenv from "dotenv";

dotenv.config();
import { connectTestDB, closeTestDB } from "../setup/db";

let adminToken: string;
let userToken: string;
let userId: string;

describe("User Controller - E2e Tests", () => {
  beforeAll(async () => {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set in test environment");
    }

    await connectTestDB();

    await request(app).post("/api/auth/register").send({
      name: "Admin",
      email: "admin@test.com",
      password: "Password@123",
      role: "admin",
    });

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "Password@123",
    });

    adminToken = adminLogin.body.token;

    await request(app).post("/api/auth/register").send({
      name: "User",
      email: "user@test.com",
      password: "Password@123",
      role: "user",
    });

    const userLogin = await request(app).post("/api/auth/login").send({
      email: "user@test.com",
      password: "Password@123",
    });

    userToken = userLogin.body.token;
    userId = userLogin.body.user.id;

    if (!userId) {
      throw new Error("Failed to extract userId from login response");
    }
  });

  afterAll(async () => {
    await closeTestDB();
  });

  /* ---------- TESTS ---------- */

  it("should return all users with pagination", async () => {
    const res = await request(app)
      .get("/api/users?page=1&limit=10")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it("should return a user by ID", async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    // ✅ Match actual response structure
    expect(res.body.user._id).toBe(userId);
  });

  it("should return 404 if user not found", async () => {
    const fakeId = "64b8f9f9f9f9f9f9f9f9f9f9";

    const res = await request(app)
      .get(`/api/users/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it("should update a user by admin", async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated User" });

    expect(res.status).toBe(200);

    // ✅ Access updated user correctly
    expect(res.body.user.name).toBe("Updated User");
  });

  it("should return 400 if email already in use", async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "admin@test.com" });

    expect(res.status).toBe(400);
  });

  it("should delete a user", async () => {
    // Make sure userId is valid and exists
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");
  });

  it("should return 404 if user to delete is not found", async () => {
    // Delete the same user again
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });
});
