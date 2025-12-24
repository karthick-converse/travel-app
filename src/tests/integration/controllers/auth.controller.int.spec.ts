import { Request, Response } from "express";
import {
  register,
  login,
  getProfile,
} from "../../../controllers/authController";
import User from "../../../models/User";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../../types/index";
import { connectTestDB, closeTestDB } from "../../setup/db";

dotenv.config();
jest.setTimeout(30000);

describe("Auth Controller + Service (REAL DB)", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeAll(async () => {
    connectTestDB();
  });

  afterAll(async () => {
    closeTestDB();
  });

  beforeEach(async () => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();

    // Clear all users before each test
    await User.deleteMany({});
  });

  describe("register", () => {
    it("should create a new user", async () => {
      req.body = {
        name: "Karthi",
        email: "karthi@test.com",
        password: "Password@123",
      };

      await register(req as Request, res as Response);

      const users = await User.find();
      expect(users.length).toBe(1);
      expect(users[0].name).toBe("Karthi");
      expect(users[0].email).toBe("karthi@test.com");
      expect(users[0].password).not.toBe("Password@123"); // Should be hashed

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            name: "Karthi",
            email: "karthi@test.com",
          }),
          token: expect.any(String),
        })
      );
    });

    it("should return 400 if user already exists", async () => {
      // Create user first
      await User.create({
        name: "Karthi",
        email: "karthi@test.com",
        password: "hashedpassword",
      });

      req.body = {
        name: "Karthi",
        email: "karthi@test.com",
        password: "Password@123",
      };

      await register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User already exists with this email",
        })
      );

      // Verify only one user exists
      const userCount = await User.countDocuments({
        email: "karthi@test.com",
      });
      expect(userCount).toBe(1);
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      // Create a test user before login tests
      req.body = {
        name: "Karthi",
        email: "login@test.com",
        password: "Password@123",
      };
      await register(req as Request, res as Response);
      jest.clearAllMocks();
    });

    it("should login with valid credentials", async () => {
      req.body = {
        email: "login@test.com",
        password: "Password@123",
      };

      await login(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            email: "login@test.com",
          }),
          token: expect.any(String),
        })
      );

      // Verify password is not in response
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.user.password).toBeUndefined();
    });

    it("should return 400 for invalid password", async () => {
      req.body = {
        email: "login@test.com",
        password: "WrongPassword",
      };

      await login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid credentials",
        })
      );
    });

    it("should return 400 for non-existent user", async () => {
      req.body = {
        email: "nonexistent@test.com",
        password: "Password@123",
      };

      await login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid credentials",
        })
      );
    });

    it("should return 400 for missing email", async () => {
      req.body = {
        password: "Password@123",
      };

      await login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });

    it("should return valid JWT token", async () => {
      req.body = {
        email: "login@test.com",
        password: "Password@123",
      };

      await login(req as Request, res as Response);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      const token = response.token;

      // Verify token is valid
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBeDefined();
      expect(typeof decoded.id).toBe("string");
    });
  });

  describe("getProfile", () => {
    let userId: string;
    let authReq: Partial<AuthRequest>;

    beforeEach(async () => {
      // Create a test user
      const user = await User.create({
        name: "Karthi",
        email: "profile@test.com",
        password: "hashedpassword123",
      });
      userId = user._id.toString();

      authReq = {
        ...req,
        user: {
          id: userId,
          email: "",
          role: "",
        },
      };
    });

    it("should get user profile", async () => {
      await getProfile(authReq as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            email: "profile@test.com",
            name: "Karthi",
          }),
        })
      );

      // Verify password is not in response
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.user.password).toBeUndefined();
    });

    it("should return correct user data after profile update", async () => {
      // Update user in database
      await User.findByIdAndUpdate(userId, { name: "Updated Name" });

      await getProfile(authReq as AuthRequest, res as Response);

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.user.name).toBe("Updated Name");
    });
  });
});
