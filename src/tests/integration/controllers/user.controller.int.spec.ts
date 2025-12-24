import e, { Response } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../../../controllers/userController";
import User from "../../../models/User";
import { AuthRequest } from "../../../types/index";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectTestDB, closeTestDB } from "../../setup/db";

dotenv.config();
jest.setTimeout(20000);

describe("UserService - Integration Tests", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let adminUser: any;
  let userId: string;
  beforeAll(async () => {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set in test environment");
    }
    connectTestDB();
  });

  afterAll(async () => {
    closeTestDB();
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

    // Create admin user
    adminUser = await User.create({
      name: "Admin",
      email: "pack@test.com",
      password: "Password@123",
      role: "admin",
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe("getAllUsers", () => {
    beforeEach(async () => {
      // Create multiple users for testing
      await User.create([
        {
          name: "Admin",
          email: "package@test.com",
          password: "Password@123",
          role: "admin",
        },
        {
          name: "testexample",
          email: "examp@test.com",
          password: "Password@123",
          role: "admin",
        },
        {
          name: "Admin",
          email: "Admin@test.com",
          password: "Password@123",
          role: "admin",
        },
      ]);
    });

    it("should return all packages with pagination", async () => {
      req.query = { page: "1", limit: "10" };

      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
      };

      await getAllUsers(req as AuthRequest, res as Response);
      const result = (res.json as jest.Mock).mock.calls[0][0];

      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users.length).toBe(4);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(4);
    });

    it("should paginate results correctly", async () => {
      req.query = { page: "1", limit: "2", destination: "Maldives" };

      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
      };
      await getAllUsers(req as AuthRequest, res as Response);
      const result = (res.json as jest.Mock).mock.calls[0][0];
      expect(result.users.length).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.pages).toBe(2); // 3 users / 2 per page
    });

    it("should return second page correctly", async () => {
      req.query = { page: "1", limit: "2", destination: "Maldives" };

      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
      };

      await getAllUsers(req as AuthRequest, res as Response);
      const result = (res.json as jest.Mock).mock.calls[0][0];

      expect(result.users.length).toBe(2);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe("getUserById", () => {
    beforeEach(async () => {
      const user = await User.create({
        name: "Admin",
        email: "package@test.com",
        password: "Password@123",
        role: "admin",
      });
      userId = user._id.toString();
    });

    it("should return a user by ID", async () => {
      req.params = { id: userId };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };
      await getUserById(req as AuthRequest, res as Response);
      const result = (res.json as jest.Mock).mock.calls[0][0];
      expect(result.user).toBeDefined();
      expect(result.user._id.toString()).toBe(userId);
      expect(result.user.name).toBe("Admin");
    });

    it("should throw error if user not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      req.params = { id: fakeId };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };
      await getUserById(req as AuthRequest, res as Response);
      const result = (res.json as jest.Mock).mock.calls[0][0];

      expect(res.status).toHaveBeenCalledWith(404);
      expect(result).toEqual(
        expect.objectContaining({ message: "User not found" })
      );
    });
  });

  describe("updateUser", () => {
    beforeEach(async () => {
      const user = await User.create({
        name: "Admin",
        email: "package@test.com",
        password: "Password@123",
        role: "admin",
      });
      userId = user._id.toString();
    });

    it("should update a user", async () => {
      req.params = { id: userId };

      req.body = {
        name: "navaneethan",
      };

      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };

      await updateUser(req as AuthRequest, res as Response);

      const result = (res.json as jest.Mock).mock.calls[0][0];

      expect(result.message).toBe("User updated successfully");
      expect(result.user).toBeDefined();
      expect(result.user!.name).toBe("navaneethan");
    });

    it("should update multiple fields", async () => {
      req.params = { id: userId };

      req.body = {
        name: "Updated Package",
        email: "updated@example.com",
      };

      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };

      await updateUser(req as AuthRequest, res as Response);

      const result = (res.json as jest.Mock).mock.calls[0][0];

      expect(result.message).toBe("User updated successfully");
      expect(result.user).toBeDefined();
      expect(result.user.name).toBe("Updated Package");
      expect(result.user.email).toBe("updated@example.com");
    });

    it("should throw error if package to update is not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updateData = { price: 2000 };
      req.params = { id: fakeId };
      req.body = { updateData };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };
      await updateUser(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User not found",
        })
      );
    });
  });

  describe("deleteUser", () => {
    beforeEach(async () => {
      const user = await User.create({
        name: "Admin",
        email: "package@test.com",
        password: "Password@123",
        role: "admin",
      });
      userId = user._id.toString();
    });

    it("should delete a user", async () => {
      req.params = { id: userId };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };
      await deleteUser(req as AuthRequest, res as Response);
      const result = (res.json as jest.Mock).mock.calls[0][0];
      expect(result.message).toBe("User deleted successfully");

      // Verify user is deleted
      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });

    it("should throw error if package to delete is not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      req.params = { id: fakeId };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };
      await deleteUser(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "User not found" })
      );
    });
  });
});
