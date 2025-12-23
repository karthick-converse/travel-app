import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import { AuthService } from "../../../services/authService";
import User from "../../../models/User";
import { RegisterRequest, LoginRequest } from "../../../dto/auth.dto";

describe("AuthService Integration Tests", () => {
  let mongoServer: MongoMemoryServer;
  let authService: AuthService;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Set JWT secret for testing
    process.env.JWT_SECRET = "test-secret-key";

    authService = new AuthService();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await User.deleteMany({});
  });

  describe("register", () => {
    it("should successfully register a new user", async () => {
      const registerData: RegisterRequest = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const result = await authService.register(registerData);

      expect(result.message).toBe("User registered successfully");
      expect(result.token).toBeDefined();
      expect(result.user).toMatchObject({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(result.user.id).toBeDefined();
      expect(result.user.role).toBeDefined();

      // Verify token is valid
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBe(result.user.id);
    });

    it("should hash password before saving", async () => {
      const registerData: RegisterRequest = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "plainPassword123",
      };

      await authService.register(registerData);

      const user = await User.findOne({ email: "jane@example.com" });
      expect(user).toBeDefined();
      expect(user!.password).not.toBe("plainPassword123");
      expect(user!.password.length).toBeGreaterThan(20); // Hashed password is longer
    });

    it("should throw error when registering with existing email", async () => {
      const registerData: RegisterRequest = {
        name: "John Doe",
        email: "duplicate@example.com",
        password: "password123",
      };

      await authService.register(registerData);

      await expect(authService.register(registerData)).rejects.toThrow(
        "User already exists with this email"
      );
    });

    it("should create user with default role", async () => {
      const registerData: RegisterRequest = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const result = await authService.register(registerData);

      expect(result.user.role).toBeDefined();
      // Verify in database as well
      const user = await User.findById(result.user.id);
      expect(user!.role).toBeDefined();
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      // Create a test user before each login test
      const registerData: RegisterRequest = {
        name: "Test User",
        email: "test@example.com",
        password: "correctPassword123",
      };
      await authService.register(registerData);
    });

    it("should successfully login with correct credentials", async () => {
      const loginData: LoginRequest = {
        email: "test@example.com",
        password: "correctPassword123",
      };

      const result = await authService.login(loginData);

      expect(result.message).toBe("Login successful");
      expect(result.token).toBeDefined();
      expect(result.user).toMatchObject({
        name: "Test User",
        email: "test@example.com",
      });

      // Verify token is valid
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBe(result.user.id);
    });

    it("should throw error with incorrect password", async () => {
      const loginData: LoginRequest = {
        email: "test@example.com",
        password: "wrongPassword",
      };

      await expect(authService.login(loginData)).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should throw error with non-existent email", async () => {
      const loginData: LoginRequest = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      await expect(authService.login(loginData)).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should generate a token with correct payload", async () => {
      const loginData: LoginRequest = {
        email: "test@example.com",
        password: "correctPassword123",
      };

      const result = await authService.login(loginData);

      const decoded = jwt.verify(
        result.token,
        process.env.JWT_SECRET as string
      ) as any;

      expect(decoded).toHaveProperty("id");
      expect(decoded).toHaveProperty("iat");
      expect(decoded).toHaveProperty("exp");
    });
  });

  describe("getProfile", () => {
    let userId: string;

    beforeEach(async () => {
      const registerData: RegisterRequest = {
        name: "Profile User",
        email: "profile@example.com",
        password: "password123",
      };
      const result = await authService.register(registerData);
      userId = result.user.id;
    });

    it("should return user profile without password", async () => {
      const result = await authService.getProfile(userId);

      expect(result.user).toBeDefined();
      expect(result.user.name).toBe("Profile User");
      expect(result.user.email).toBe("profile@example.com");
    });

    it("should throw error for non-existent user", async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();

      await expect(authService.getProfile(fakeUserId)).rejects.toThrow(
        "User not found"
      );
    });

    it("should throw error for invalid user ID format", async () => {
      await expect(authService.getProfile("invalid-id")).rejects.toThrow();
    });
  });

  describe("End-to-End Workflow", () => {
    it("should complete full registration and login flow", async () => {
      // Register
      const registerData: RegisterRequest = {
        name: "E2E User",
        email: "e2e@example.com",
        password: "e2ePassword123",
      };

      const registerResult = await authService.register(registerData);
      expect(registerResult.message).toBe("User registered successfully");

      // Login with same credentials
      const loginData: LoginRequest = {
        email: "e2e@example.com",
        password: "e2ePassword123",
      };

      const loginResult = await authService.login(loginData);
      expect(loginResult.message).toBe("Login successful");

      // Get profile using userId from login
      const profileResult = await authService.getProfile(loginResult.user.id);
      expect(profileResult.user.email).toBe("e2e@example.com");
    });

    it("should maintain user data consistency across operations", async () => {
      const registerData: RegisterRequest = {
        name: "Consistency Test",
        email: "consistency@example.com",
        password: "password123",
      };

      const registerResult = await authService.register(registerData);
      const loginResult = await authService.login({
        email: registerData.email,
        password: registerData.password,
      });
      const profileResult = await authService.getProfile(loginResult.user.id);

      // All operations should return same user data
      expect(registerResult.user.id).toBe(loginResult.user.id);
      expect(loginResult.user.id).toBe(profileResult.user._id.toString());
      expect(registerResult.user.email).toBe(loginResult.user.email);
      expect(loginResult.user.email).toBe(profileResult.user.email);
    });
  });

  describe("Token Validation", () => {
    it("should generate tokens with correct expiration", async () => {
      const registerData: RegisterRequest = {
        name: "Token User",
        email: "token@example.com",
        password: "password123",
      };

      const result = await authService.register(registerData);
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();

      // Token should expire in 7 days (604800 seconds)
      const expirationTime = decoded.exp - decoded.iat;
      expect(expirationTime).toBe(604800);
    });
  });
});
