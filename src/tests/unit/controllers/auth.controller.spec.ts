import { Request, Response } from "express";
import { AuthRequest } from "../../../types";

// Mock the AuthService before importing the controller
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  getProfile: jest.fn(),
};

jest.mock("../../../services/authService", () => {
  return {
    AuthService: jest.fn().mockImplementation(() => mockAuthService)
  };
});

// Import controller after mocking
import {
  register,
  login,
  getProfile,
} from "../../../controllers/authController";

describe("Auth Controller", () => {
  let mockRequest: Partial<Request>;
  let mockAuthRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };

    mockAuthRequest = {
      body: {},
      user: {
        id: "user123",
        email: "test@example.com",
        role: "",
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register a user successfully and return 201", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      };

      const expectedResult = {
        message: "User registered successfully",
        token: "jwt-token",
        user: {
          id: "123",
          name: "Test User",
          email: "test@example.com",
          role: "user",
        },
      };

      mockRequest.body = userData;
      mockAuthService.register.mockResolvedValue(expectedResult);

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.register).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it("should return 400 if user already exists", async () => {
      const userData = {
        email: "existing@example.com",
        password: "password123",
      };

      mockRequest.body = userData;
      mockAuthService.register.mockRejectedValue(
        new Error("User already exists with this email")
      );

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.register).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User already exists with this email",
        error: "User already exists with this email",
      });
    });

    it("should return 500 for other registration errors", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      };

      mockRequest.body = userData;
      mockAuthService.register.mockRejectedValue(
        new Error("Database connection failed")
      );

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Database connection failed",
        error: "Database connection failed",
      });
    });
  });

  describe("login", () => {
    it("should login successfully and return user data with token", async () => {
      const credentials = {
        email: "test@gmail.comc",
        password: "password123",
      };
      const expectedResult = {
        message: "User registered successfully",
        token: "jwt-token",
        user: {
          id: "123",
          name: "Test User",
          email: "test@gmail.com",
          role: "user",
        },
      };

      mockRequest.body = credentials;
      mockAuthService.login.mockResolvedValue(expectedResult);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.login).toHaveBeenCalledWith(credentials);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid credentials", async () => {
      const credentials = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      mockRequest.body = credentials;
      mockAuthService.login.mockRejectedValue(new Error("Invalid credentials"));

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.login).toHaveBeenCalledWith(credentials);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid credentials",
        error: "Invalid credentials",
      });
    });

    it("should return 500 for server errors during login", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      mockRequest.body = credentials;
      mockAuthService.login.mockRejectedValue(
        new Error("Internal server error")
      );

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Internal server error",
        error: "Internal server error",
      });
    });
  });

  describe("getProfile", () => {
    // it("should return user profile successfully", async () => {

    // const user= {
    //       id: "123",
    //       name: "Test User",
    //       email: "test@gmail.com",
    //       role: "user",
    //     },

    //   mockAuthService.getProfile.mockResolvedValue(user);

    //   await getProfile(
    //     mockAuthRequest as AuthRequest,
    //     mockResponse as Response
    //   );

    //   expect(mockAuthService.getProfile).toHaveBeenCalledWith("user123");
    //   expect(mockResponse.json).toHaveBeenCalledWith(user);
    //   expect(mockResponse.status).not.toHaveBeenCalled();
    // });

    it("should return 404 if user not found", async () => {
      mockAuthService.getProfile.mockRejectedValue(new Error("User not found"));

      await getProfile(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockAuthService.getProfile).toHaveBeenCalledWith("user123");
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User not found",
        error: "User not found",
      });
    });

    it("should return 500 for other errors when getting profile", async () => {
      mockAuthService.getProfile.mockRejectedValue(new Error("Database error"));

      await getProfile(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Database error",
        error: "Database error",
      });
    });

    it("should handle missing user in request", async () => {
      const mockAuthRequestWithoutUser = {
        body: {},
        user: undefined,
      };

      await getProfile(
        mockAuthRequestWithoutUser as AuthRequest,
        mockResponse as Response
      );

      // Should return 500 error due to undefined user
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Cannot read properties of undefined (reading 'id')",
        error: "Cannot read properties of undefined (reading 'id')",
      });
    });
  });
});
