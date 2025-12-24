import request from "supertest";
import app from "../../app";
import dotenv from "dotenv";

import { connectTestDB, closeTestDB } from "../setup/db";


dotenv.config();
jest.setTimeout(10000); // 20 seconds

describe("Auth Controller", () => {
  beforeAll(async () => {
     if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set in test environment");
    }
    await connectTestDB();
  });

  describe("Auth Controller - Register (E2e)", () => {
    it(" should register a new user successfully", async () => {
      const payload = {
        name: "Karthi",
        email: "karthi_test@example.com",
        password: "Password@123",
      };

      const res = await request(app).post("/api/auth/register").send(payload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(payload.email);
    });

    it(" should return 400 if user already exists", async () => {
      const payload = {
        name: "Karthi",
        email: "karthi_test@example.com",
        password: "Password@123",
      };

      const res = await request(app).post("/api/auth/register").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("User already exists with this email");
    });
  });
  describe("Auth Controller - Login (E2e)", () => {
    beforeAll(async () => {
      await connectTestDB();

      // Create a user before login test
      await request(app).post("/api/auth/register").send({
        name: "Karthi",
        email: "karthi_login@test.com",
        password: "Password@123",
      });
    });

    afterAll(async () => {
      await closeTestDB();
    });

    it("should login successfully with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "karthi_login@test.com",
        password: "Password@123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token"); // or user
    });

    it("should return 400 for invalid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "karthi_login@test.com",
        password: "WrongPassword",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("should return 400 for missing login data", async () => {
      const res = await request(app).post("/api/auth/login").send({});

      expect(res.status).toBe(400);
    });
  });

  describe("Auth Controller - Get Profile (E2e)", () => {
    let token: string;

    beforeAll(async () => {
      await connectTestDB();

      // Register user
      await request(app).post("/api/auth/register").send({
        name: "Karthi",
        email: "profile@test.com",
        password: "Password@123",
      });

      // Login user
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "profile@test.com",
        password: "Password@123",
      });

      token = loginRes.body.token;
    });

    afterAll(async () => {
      await closeTestDB();
    });
    it("should return user profile for authenticated user", async () => {
      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("user.email", "profile@test.com");
      expect(res.body).toHaveProperty("user.name", "Karthi");
    });

    it("should return 401 if token is missing", async () => {
      const res = await request(app).get("/api/auth/profile");

      expect(res.status).toBe(401);
    });
  });
});
