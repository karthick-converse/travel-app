import {  Response } from "express";
import {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
} from "../../../controllers/packageController";
import Package from "../../../models/Package";
import User from "../../../models/User";
import { AuthRequest } from "../../../types/index";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectTestDB, closeTestDB } from "../../setup/db";

dotenv.config();
jest.setTimeout(20000);

describe("PackageService - Integration Tests", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let adminUser: any;
  let packageId: string;

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

    // Clear collections
    await User.deleteMany({});
    await Package.deleteMany({});
    // Create admin user
    adminUser = await User.create({
      name: "Admin",
      email: "package@test.com",
      password: "Password@123",
      role: "admin",
    });
  });

  afterEach(async () => {
    await Package.deleteMany({});
    await User.deleteMany({});
  });

  // -------------------------
  // CREATE PACKAGE
  // -------------------------
  describe("createPackage", () => {
    it("should create a new package", async () => {
      req.body = {
        title: "Beach Holiday Package",
        destination: "Maldives",
        price: 1500,
        duration: 7,
        maxPeople: 10,
        description: "Relaxing beach vacation with all amenities",
        isActive: true,
      };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
      };

      await createPackage(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Package created successfully",
          package: expect.objectContaining({
            title: "Beach Holiday Package",
            destination: "Maldives",
            price: 1500,
          }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          package: expect.objectContaining({
            destination: "Maldives",
            price: 1500,
          }),
        })
      );

      packageId = (
        res.json as jest.Mock
      ).mock.calls[0][0].package._id.toString();
    });

    it("should create package with default isActive as true", async () => {
      req.body = {
        title: "Beach Holiday Package",
        destination: "Maldives",
        price: 1500,
        duration: 7,
        maxPeople: 10,
        description: "Relaxing beach vacation with all amenities",
        // isActive NOT provided
      };

      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
      };

      await createPackage(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Package created successfully",
          package: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });

    it("should throw error for missing required fields", async () => {
      req.body = {
        title: "Beach Holiday Package",
        destination: "Maldives",
        // price missing
        duration: 7,
        maxPeople: 10,
        description: "Relaxing beach vacation",
      };

      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
      };

      await createPackage(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Server error",
          error: "Package validation failed: price: Price is required",
        })
      );
    });
  });

  // -------------------------
  // GET ALL PACKAGES
  // -------------------------
  describe("getAllPackages", () => {
    beforeEach(async () => {
      // Create multiple packages for testing
      await Package.create([
        {
          title: "Beach Paradise",
          destination: "Maldives",
          price: 1500,
          duration: 7,
          maxPeople: 10,
          description: "Beach vacation",
          isActive: true,
        },
        {
          title: "Mountain Adventure",
          destination: "Nepal",
          price: 2000,
          duration: 10,
          maxPeople: 5,
          description: "Mountain trek",
          isActive: true,
        },
        {
          title: "City Tour",
          destination: "Paris",
          price: 1000,
          duration: 5,
          maxPeople: 15,
          description: "City exploration",
          isActive: false,
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

      await getAllPackages(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          packages: expect.any(Array),
          pagination: expect.any(Object),
        })
      );

      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.packages.length).toBe(3);
    });

    it("should filter packages by destination", async () => {
      req.query = { page: "1", limit: "1", destination: "Maldives" };

      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: adminUser.role,
      };

      await getAllPackages(req as AuthRequest, res as Response);

      const result = (res.json as jest.Mock).mock.calls[0][0];
      expect(result.packages.length).toBe(1);
      expect(result.packages[0].destination).toBe("Maldives");
    });

    it("should filter by both destination and isActive", async () => {
      req.query = {
        page: "1",
        limit: "5",
        isactive: "true",
        destination: "Maldives",
      };

      await getAllPackages(req as AuthRequest, res as Response);

      const result = (res.json as jest.Mock).mock.calls[0][0];

      expect(result.packages[0].destination).toBe("Maldives");
      expect(result.packages[0].isActive).toBe(true);
    });

    it("should paginate results correctly", async () => {
      req.query = { page: "1", limit: "2" };

      await getAllPackages(req as AuthRequest, res as Response);

      const result = (res.json as jest.Mock).mock.calls[0][0];

      expect(result.packages.length).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.pages).toBe(2);
    });

    it("should return second page correctly", async () => {
      req.query = { page: "2", limit: "1" };

      await getAllPackages(req as AuthRequest, res as Response);

      const result = (res.json as jest.Mock).mock.calls[0][0];

      expect(result.packages.length).toBe(1);
      expect(result.pagination.page).toBe(2);
    });
  });

  // -------------------------
  // GET PACKAGE BY ID
  // -------------------------
  describe("getPackageById", () => {
    beforeEach(async () => {
      const pkg = await Package.create({
        title: "Test Package",
        destination: "Test Destination",
        price: 1000,
        duration: 5,
        maxPeople: 10,
        description: "Test description",
        isActive: true,
      });
      packageId = pkg._id.toString();
    });

    it("should return a package by ID", async () => {
      req.params = { id: packageId };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };

      await getPackageById(req as AuthRequest, res as Response);

      const result = (res.json as jest.Mock).mock.calls[0][0];

      expect(result.package).toBeDefined();
      expect(result.package._id.toString()).toBe(packageId);
      expect(result.package.title).toBe("Test Package");
    });

    it("should return 404 if package not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      req.params = { id: fakeId };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };

      await getPackageById(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Package not found",
        })
      );
    });
  });

  // // -------------------------
  // // UPDATE PACKAGE
  // // -------------------------
  describe("updatePackage", () => {
    beforeEach(async () => {
      const pkg = await Package.create({
        title: "Original Package",
        destination: "Original Destination",
        price: 1000,
        duration: 5,
        maxPeople: 10,
        description: "Original description",
        isActive: true,
      });
      packageId = pkg._id.toString();
    });

    it("should update a package", async () => {
      const updateData = {
        price: 1800,
      };

      req.params = { id: packageId };
      req.body = { updateData };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };

      await updatePackage(req as AuthRequest, res as Response);
      const result = (res.json as jest.Mock).mock.calls[0][0];

      expect(result.message).toBe("Package updated successfully");
      expect(result.package).toBeDefined();
      expect(result.package!.price).toBe(1000);
      expect(result.package!.title).toBe("Original Package"); // Unchanged fields
    });

    it("should update multiple fields", async () => {
      const updateData = {
        title: "Updated Package",
        price: 2000,
        duration: 10,
        isActive: false,
      };

      req.params = { id: packageId };
      req.body = { updateData };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };

      await updatePackage(req as AuthRequest, res as Response);
      const result = (res.json as jest.Mock).mock.calls[0][0];
      expect(result.message).toBe("Package updated successfully");
      expect(result.package!.title).toBe("Original Package");
      expect(result.package!.price).toBe(1000);
      expect(result.package!.duration).toBe(5);
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
      await updatePackage(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Package not found",
        })
      );
    });
  });

  // // -------------------------
  // // DELETE PACKAGE
  // // -------------------------
  describe("deletePackage", () => {
    beforeEach(async () => {
      const pkg = await Package.create({
        title: "Package to Delete",
        destination: "Test Destination",
        price: 1000,
        duration: 5,
        maxPeople: 10,
        description: "Test description",
        isActive: true,
      });
      packageId = pkg._id.toString();
    });

    it("should delete a package", async () => {
      req.params = { id: packageId };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };
      await deletePackage(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Package deleted successfully",
        })
      );

      // Verify package is deleted
      const deletedPackage = await Package.findById(packageId);
      expect(deletedPackage).toBeNull();
    });

    it("should throw error if package to delete is not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      req.params = { id: fakeId };
      req.user = {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: "admin",
      };
      await deletePackage(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Package not found" })
      );
    });
  });
});
