import mongoose from "mongoose";
import { UserService } from "../../../services/userService";
import User from "../../../models/User";
import { connectTestDB, closeTestDB } from "../../setup/db";

describe("UserService Integration Tests", () => {
  let userService: UserService;

  beforeAll(async () => {
    await connectTestDB();
  });
  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    userService = new UserService();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe("getAllPackages", () => {
    beforeEach(async () => {
      await User.create([
        {
          name: "Jane Smith",
          email: "jane.smith@example.com",
          password: "password123",
          role: "user",
        },
        {
          name: "Michael Brown",
          email: "michael.brown@example.com",
          password: "password123",
          role: "user",
        },
        {
          name: "Emily Johnson",
          email: "emily.johnson@example.com",
          password: "password123",
          role: "user",
        },
        {
          name: "David Wilson",
          email: "david.wilson@example.com",
          password: "password123",
          role: "user",
        },
      ]);
    });

    it("should return all packages with default pagination", async () => {
      const result = await userService.getAllUsers({});

      expect(result.users).toHaveLength(4);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(4);
      expect(result.pagination.pages).toBe(1);
    });

    it("should paginate packages correctly", async () => {
      const result = await userService.getAllUsers({
        page: 1,
        limit: 2,
      });

      expect(result.users).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(4);
      expect(result.pagination.pages).toBe(2);
    });

    it("should return second page of results", async () => {
      const result = await userService.getAllUsers({
        page: 2,
        limit: 2,
      });

      expect(result.users).toHaveLength(2);
      expect(result.pagination.page).toBe(2);
    });

    it("should handle pagination with filters", async () => {
      const result = await userService.getAllUsers({
        page: 1,
        limit: 2,
      });

      expect(result.users).toHaveLength(2);
      expect(result.pagination.total).toBe(4);
      expect(result.pagination.pages).toBe(2);
    });
  });

  describe("getPackageById", () => {
    let testPackage: any;

    beforeEach(async () => {
      testPackage = await User.create({
        name: "karthick",
        email: "test@example.com",
        password: "password123",
        role: "user",
      });
    });

    it("should return package by valid ID", async () => {
      const result = await userService.getUserById(testPackage._id.toString());

      expect(result.user).toBeDefined();
      expect(result.user._id.toString()).toBe(testPackage._id.toString());
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.role).toBe("user");
    });

    it("should throw error when package not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(userService.getUserById(fakeId)).rejects.toThrow(
        "User not found"
      );
    });

    it("should throw error with invalid ObjectId format", async () => {
      await expect(userService.getUserById("invalid-id")).rejects.toThrow();
    });

    it("should return complete package details", async () => {
      const result = await userService.getUserById(testPackage._id.toString());

      expect(result.user._id).toBeDefined();
      expect(result.user.name).toBeDefined();
      expect(result.user.email).toBeDefined();
      expect(result.user.role).toBeDefined();
    });
  });

  describe("UserService - updateUser", () => {
    const userService = new UserService();
    let testUser: any;
    let adminUser: any;

    beforeEach(async () => {
      testUser = await User.create({
        name: "karthick",
        email: "test@example.com",
        password: "password123",
        role: "user",
      });

      adminUser = await User.create({
        name: "Admin",
        email: "admin@example.com",
        password: "password123",
        role: "admin",
      });
    });

    it("should allow admin to update any user", async () => {
      const result = await userService.updateUser(
        testUser._id.toString(),
        { name: "Updated karthick" },
        adminUser._id.toString(),
        "admin"
      );

      expect(result.message).toBe("User updated successfully");
      expect(result.user!.name).toBe("Updated karthick");
    });

    it("should allow user to update their own profile", async () => {
      const result = await userService.updateUser(
        testUser._id.toString(),
        { name: "Self Updated" },
        testUser._id.toString(),
        "user"
      );

      expect(result.user!.name).toBe("Self Updated");
    });

    it("should NOT allow user to update another user", async () => {
      await expect(
        userService.updateUser(
          adminUser._id.toString(),
          { name: "Hack Attempt" },
          testUser._id.toString(),
          "user"
        )
      ).rejects.toThrow("Access denied");
    });

    it("should update email if email is unique", async () => {
      const result = await userService.updateUser(
        testUser._id.toString(),
        { email: "newemail@example.com" },
        adminUser._id.toString(),
        "admin"
      );

      expect(result.user!.email).toBe("newemail@example.com");
    });

    it("should throw error if email already exists", async () => {
      await User.create({
        name: "Other",
        email: "duplicate@example.com",
        password: "password123",
        role: "user",
      });

      await expect(
        userService.updateUser(
          testUser._id.toString(),
          { email: "duplicate@example.com" },
          adminUser._id.toString(),
          "admin"
        )
      ).rejects.toThrow("Email already in use");
    });

    it("should throw error if user not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        userService.updateUser(
          fakeId,
          { name: "Does not exist" },
          adminUser._id.toString(),
          "admin"
        )
      ).rejects.toThrow("User not found");
    });

    it("should not update fields that are not provided", async () => {
      const result = await userService.updateUser(
        testUser._id.toString(),
        {},
        adminUser._id.toString(),
        "admin"
      );

      expect(result.user!.name).toBe("karthick");
      expect(result.user!.email).toBe("test@example.com");
    });

    it("should not return password field", async () => {
      const result = await userService.updateUser(
        testUser._id.toString(),
        { name: "Updated karthick" },
        adminUser._id.toString(),
        "admin"
      );

      expect((result.user as any).password).toBeUndefined();
    });
  });

  describe("deleteUser", () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await User.create({
        name: "karthick",
        email: "test@example.com",
        password: "password123",
        role: "user",
      });
    });

    it("should delete user successfully", async () => {
      const result = await userService.deleteUser(testUser._id.toString());
      expect(result.message).toBe("User deleted successfully");
    });

    it("should throw error when User not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(userService.deleteUser(fakeId)).rejects.toThrow(
        "User not found"
      );
    });

    it("should throw error with invalid ObjectId format", async () => {
      await expect(userService.deleteUser("invalid-id")).rejects.toThrow();
    });

    it("should completely remove user from database", async () => {
      await userService.deleteUser(testUser._id.toString());
      const count = await User.countDocuments({});
      expect(count).toBe(0);
    });

    it("should handle deleting already deleted user", async () => {
      await userService.deleteUser(testUser._id.toString());

      await expect(
        userService.deleteUser(testUser._id.toString())
      ).rejects.toThrow("User not found");
    });
  });
});
