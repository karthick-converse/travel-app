import mongoose from "mongoose";
import { PackageService } from "../../../services/packageService";
import Package from "../../../models/Package";
import { connectTestDB, closeTestDB } from "../../setup/db";

describe("PackageService Integration Tests", () => {
  let packageService: PackageService;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    packageService = new PackageService();
  });

  afterEach(async () => {
    await Package.deleteMany({});
  });

  describe("createPackage", () => {
    it("should create a package successfully", async () => {
      const packageData = {
        title: "Beach Paradise",
        description: "Relaxing beach vacation with crystal clear waters",
        destination: "Maldives",
        price: 2500,
        duration: 7,
        maxPeople: 10,
        isActive: true,
      };

      const result = await packageService.createPackage(packageData);

      expect(result.message).toBe("Package created successfully");
      expect(result.package).toBeDefined();
      expect(result.package.title).toBe("Beach Paradise");
      expect(result.package.destination).toBe("Maldives");
      expect(result.package.price).toBe(2500);
      expect(result.package.duration).toBe(7);
      expect(result.package.maxPeople).toBe(10);
      expect(result.package.isActive).toBe(true);
    });

    it("should create a package with default isActive as true", async () => {
      const packageData = {
        title: "Mountain Trek",
        description: "Adventurous mountain trekking experience",
        destination: "Nepal",
        price: 1800,
        duration: 10,
        maxPeople: 8,
      };

      const result = await packageService.createPackage(packageData);

      expect(result.package).toBeDefined();
      expect(result.package.isActive).toBe(true);
    });

    it("should create multiple packages", async () => {
      const package1 = {
        title: "Safari Adventure",
        description: "Wildlife safari in Africa",
        destination: "Kenya",
        price: 3000,
        duration: 14,
        maxPeople: 6,
      };

      const package2 = {
        title: "City Tour",
        description: "Explore historical cities",
        destination: "Paris",
        price: 2000,
        duration: 5,
        maxPeople: 15,
      };

      await packageService.createPackage(package1);
      await packageService.createPackage(package2);

      const allPackages = await Package.find({});
      expect(allPackages).toHaveLength(2);
    });

    it("should validate required fields", async () => {
      const invalidPackageData = {
        title: "Invalid Package",
        // Missing required fields
      };

      await expect(
        packageService.createPackage(invalidPackageData as any)
      ).rejects.toThrow();
    });
  });

  describe("getAllPackages", () => {
    beforeEach(async () => {
      await Package.create([
        {
          title: "Beach Paradise",
          description: "Beach vacation",
          destination: "Maldives",
          price: 2500,
          duration: 7,
          maxPeople: 10,
          isActive: true,
        },
        {
          title: "Mountain Trek",
          description: "Mountain adventure",
          destination: "Nepal",
          price: 1800,
          duration: 10,
          maxPeople: 8,
          isActive: true,
        },
        {
          title: "Desert Safari",
          description: "Desert experience",
          destination: "Dubai",
          price: 2200,
          duration: 5,
          maxPeople: 12,
          isActive: false,
        },
        {
          title: "Island Hopping",
          description: "Island tour",
          destination: "Maldives",
          price: 3000,
          duration: 12,
          maxPeople: 6,
          isActive: true,
        },
      ]);
    });

    it("should return all packages with default pagination", async () => {
      const result = await packageService.getAllPackages({});

      expect(result.packages).toHaveLength(4);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(4);
      expect(result.pagination.pages).toBe(1);
    });

    it("should paginate packages correctly", async () => {
      const result = await packageService.getAllPackages({
        page: 1,
        limit: 2,
      });

      expect(result.packages).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(4);
      expect(result.pagination.pages).toBe(2);
    });

    it("should return second page of results", async () => {
      const result = await packageService.getAllPackages({
        page: 2,
        limit: 2,
      });

      expect(result.packages).toHaveLength(2);
      expect(result.pagination.page).toBe(2);
    });

    it("should filter packages by destination (case-insensitive)", async () => {
      const result = await packageService.getAllPackages({
        destination: "maldives",
      });

      expect(result.packages).toHaveLength(2);
      result.packages.forEach((pkg) => {
        expect(pkg.destination.toLowerCase()).toContain("maldives");
      });
    });

    it("should filter packages by partial destination match", async () => {
      const result = await packageService.getAllPackages({
        destination: "mal",
      });

      expect(result.packages).toHaveLength(2);
    });

    it("should filter packages by isActive status (true)", async () => {
      const result = await packageService.getAllPackages({
        isActive: true,
      });

      expect(result.packages).toHaveLength(3);
      result.packages.forEach((pkg) => {
        expect(pkg.isActive).toBe(true);
      });
    });

    it("should filter packages by isActive status (false)", async () => {
      const result = await packageService.getAllPackages({
        isActive: false,
      });

      expect(result.packages).toHaveLength(1);
      expect(result.packages[0].isActive).toBe(false);
    });

    it("should combine destination and isActive filters", async () => {
      const result = await packageService.getAllPackages({
        destination: "Maldives",
        isActive: true,
      });

      expect(result.packages).toHaveLength(2);
      result.packages.forEach((pkg) => {
        expect(pkg.destination).toBe("Maldives");
        expect(pkg.isActive).toBe(true);
      });
    });

    it("should return empty array when no packages match filter", async () => {
      const result = await packageService.getAllPackages({
        destination: "Antarctica",
      });

      expect(result.packages).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });

    it("should handle pagination with filters", async () => {
      const result = await packageService.getAllPackages({
        isActive: true,
        page: 1,
        limit: 2,
      });

      expect(result.packages).toHaveLength(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.pages).toBe(2);
    });
  });

  describe("getPackageById", () => {
    let testPackage: any;

    beforeEach(async () => {
      testPackage = await Package.create({
        title: "Beach Paradise",
        description: "Relaxing beach vacation",
        destination: "Maldives",
        price: 2500,
        duration: 7,
        maxPeople: 10,
        isActive: true,
      });
    });

    it("should return package by valid ID", async () => {
      const result = await packageService.getPackageById(
        testPackage._id.toString()
      );

      expect(result.package).toBeDefined();
      expect(result.package._id.toString()).toBe(testPackage._id.toString());
      expect(result.package.title).toBe("Beach Paradise");
      expect(result.package.destination).toBe("Maldives");
    });

    it("should throw error when package not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(packageService.getPackageById(fakeId)).rejects.toThrow(
        "Package not found"
      );
    });

    it("should throw error with invalid ObjectId format", async () => {
      await expect(
        packageService.getPackageById("invalid-id")
      ).rejects.toThrow();
    });

    it("should return complete package details", async () => {
      const result = await packageService.getPackageById(
        testPackage._id.toString()
      );

      expect(result.package.title).toBeDefined();
      expect(result.package.description).toBeDefined();
      expect(result.package.destination).toBeDefined();
      expect(result.package.price).toBeDefined();
      expect(result.package.duration).toBeDefined();
      expect(result.package.maxPeople).toBeDefined();
      expect(result.package.isActive).toBeDefined();
    });
  });

  describe("updatePackage", () => {
    let testPackage: any;

    beforeEach(async () => {
      testPackage = await Package.create({
        title: "Beach Paradise",
        description: "Relaxing beach vacation",
        destination: "Maldives",
        price: 2500,
        duration: 7,
        maxPeople: 10,
        isActive: true,
      });
    });

    it("should update package title", async () => {
      const updateData = {
        title: "Updated Beach Paradise",
      };

      const result = await packageService.updatePackage(
        testPackage._id.toString(),
        updateData
      );

      expect(result.message).toBe("Package updated successfully");
      expect(result.package.title).toBe("Updated Beach Paradise");
    });

    it("should update package price", async () => {
      const updateData = {
        price: 3000,
      };

      const result = await packageService.updatePackage(
        testPackage._id.toString(),
        updateData
      );

      expect(result.package.price).toBe(3000);
    });

    it("should update package isActive status", async () => {
      const updateData = {
        isActive: false,
      };

      const result = await packageService.updatePackage(
        testPackage._id.toString(),
        updateData
      );

      expect(result.package.isActive).toBe(false);
    });

    it("should update multiple fields at once", async () => {
      const updateData = {
        title: "Premium Beach Paradise",
        price: 3500,
        duration: 10,
        maxPeople: 8,
      };

      const result = await packageService.updatePackage(
        testPackage._id.toString(),
        updateData
      );

      expect(result.package.title).toBe("Premium Beach Paradise");
      expect(result.package.price).toBe(3500);
      expect(result.package.duration).toBe(10);
      expect(result.package.maxPeople).toBe(8);
    });

    it("should not change fields that are not provided", async () => {
      const updateData = {
        price: 3000,
      };

      const result = await packageService.updatePackage(
        testPackage._id.toString(),
        updateData
      );

      expect(result.package.title).toBe("Beach Paradise");
      expect(result.package.destination).toBe("Maldives");
      expect(result.package.price).toBe(3000);
    });

    it("should throw error when package not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        title: "Updated Title",
      };

      await expect(
        packageService.updatePackage(fakeId, updateData)
      ).rejects.toThrow("Package not found");
    });

    it("should validate updated data with runValidators", async () => {
      const invalidUpdateData = {
        price: -100, // Assuming price should be positive
      };

      // This test assumes your Package model has validation for positive price
      // Adjust based on your actual model validations
      await expect(
        packageService.updatePackage(
          testPackage._id.toString(),
          invalidUpdateData
        )
      ).rejects.toThrow();
    });

    it("should return updated package with all fields", async () => {
      const updateData = {
        description: "Updated description with more details",
      };

      const result = await packageService.updatePackage(
        testPackage._id.toString(),
        updateData
      );

      expect(result.package._id.toString()).toBe(testPackage._id.toString());
      expect(result.package.description).toBe(
        "Updated description with more details"
      );
    });
  });

  describe("deletePackage", () => {
    let testPackage: any;

    beforeEach(async () => {
      testPackage = await Package.create({
        title: "Beach Paradise",
        description: "Relaxing beach vacation",
        destination: "Maldives",
        price: 2500,
        duration: 7,
        maxPeople: 10,
        isActive: true,
      });
    });

    it("should delete package successfully", async () => {
      const result = await packageService.deletePackage(
        testPackage._id.toString()
      );

      expect(result.message).toBe("Package deleted successfully");

      const deletedPackage = await Package.findById(testPackage._id);
      expect(deletedPackage).toBeNull();
    });

    it("should throw error when package not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(packageService.deletePackage(fakeId)).rejects.toThrow(
        "Package not found"
      );
    });

    it("should throw error with invalid ObjectId format", async () => {
      await expect(
        packageService.deletePackage("invalid-id")
      ).rejects.toThrow();
    });

    it("should completely remove package from database", async () => {
      await packageService.deletePackage(testPackage._id.toString());

      const count = await Package.countDocuments({});
      expect(count).toBe(0);
    });

    it("should not affect other packages when deleting one", async () => {
      const anotherPackage = await Package.create({
        title: "Mountain Trek",
        description: "Mountain adventure",
        destination: "Nepal",
        price: 1800,
        duration: 10,
        maxPeople: 8,
      });

      await packageService.deletePackage(testPackage._id.toString());

      const remainingPackage = await Package.findById(anotherPackage._id);
      expect(remainingPackage).toBeDefined();
      expect(remainingPackage!.title).toBe("Mountain Trek");
    });

    it("should handle deleting already deleted package", async () => {
      await packageService.deletePackage(testPackage._id.toString());

      await expect(
        packageService.deletePackage(testPackage._id.toString())
      ).rejects.toThrow("Package not found");
    });
  });

  describe("Edge Cases and Complex Scenarios", () => {
    it("should handle empty database for getAllPackages", async () => {
      const result = await packageService.getAllPackages({});

      expect(result.packages).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });

    it("should handle very large page numbers", async () => {
      await Package.create({
        title: "Test Package",
        description: "Test",
        destination: "Test",
        price: 1000,
        duration: 5,
        maxPeople: 5,
      });

      const result = await packageService.getAllPackages({
        page: 999,
        limit: 10,
      });

      expect(result.packages).toHaveLength(0);
    });

    it("should handle special characters in destination search", async () => {
      await Package.create({
        title: "Special Package",
        description: "Test",
        destination: "São Paulo",
        price: 1000,
        duration: 5,
        maxPeople: 5,
      });

      const result = await packageService.getAllPackages({
        destination: "São",
      });

      expect(result.packages).toHaveLength(1);
    });

    it("should maintain data integrity across multiple operations", async () => {
      const packageData = {
        title: "Test Package",
        description: "Test description",
        destination: "Test Destination",
        price: 1500,
        duration: 7,
        maxPeople: 10,
      };

      const created = await packageService.createPackage(packageData);
      const retrieved = await packageService.getPackageById(
        created.package._id.toString()
      );
      const updated = await packageService.updatePackage(
        created.package._id.toString(),
        { price: 2000 }
      );

      expect(retrieved.package._id.toString()).toBe(
        created.package._id.toString()
      );
      expect(updated.package._id.toString()).toBe(
        created.package._id.toString()
      );
      expect(updated.package.price).toBe(2000);
    });
  });
});
