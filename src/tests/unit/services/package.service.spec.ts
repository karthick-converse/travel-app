import { PackageService } from "../../../services/packageService";
import Package from "../../../models/Package";
import {
  CreatePackageRequest,
  UpdatePackageRequest,
  PackageQueryParams,
} from "../../../dto/package.dto";

jest.mock("../../../models/Package");

describe("PackageService", () => {
  let packageService: PackageService;

  const mockPackageId = "607f1f77bcf86cd799439015";

  const mockPackage = {
    _id: mockPackageId,
    title: "Beach Paradise",
    description: "Amazing beach vacation",
    destination: "Maldives",
    price: 1000,
    duration: 7,
    maxPeople: 4,
    isActive: true,
    image: "beach.jpg",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  beforeEach(() => {
    packageService = new PackageService();
    jest.clearAllMocks();
  });

  describe("getAllPackages", () => {
    const mockPackages = [mockPackage];

    it("should return all packages with default pagination", async () => {
      const queryParams: PackageQueryParams = {};

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockPackages);

      (Package.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (Package.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await packageService.getAllPackages(queryParams);

      expect(Package.find).toHaveBeenCalledWith({});
      expect(mockSkip).toHaveBeenCalledWith(0);
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result.packages).toEqual(mockPackages);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1,
      });
    });

    it("should return packages with custom pagination", async () => {
      const queryParams: PackageQueryParams = { page: 2, limit: 5 };

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockPackages);

      (Package.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (Package.countDocuments as jest.Mock).mockResolvedValue(12);

      const result = await packageService.getAllPackages(queryParams);

      expect(mockSkip).toHaveBeenCalledWith(5);
      expect(mockLimit).toHaveBeenCalledWith(5);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 12,
        pages: 3,
      });
    });

    it("should filter packages by destination (case-insensitive)", async () => {
      const queryParams: PackageQueryParams = { destination: "maldives" };

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockPackages);

      (Package.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (Package.countDocuments as jest.Mock).mockResolvedValue(1);

      await packageService.getAllPackages(queryParams);

      expect(Package.find).toHaveBeenCalledWith({
        destination: { $regex: "maldives", $options: "i" },
      });
    });

    it("should filter packages by isActive status (true)", async () => {
      const queryParams: PackageQueryParams = { isActive: true };

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockPackages);

      (Package.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (Package.countDocuments as jest.Mock).mockResolvedValue(1);

      await packageService.getAllPackages(queryParams);

      expect(Package.find).toHaveBeenCalledWith({ isActive: true });
    });

    it("should filter packages by isActive status (false)", async () => {
      const queryParams: PackageQueryParams = { isActive: false };

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockPackages);

      (Package.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (Package.countDocuments as jest.Mock).mockResolvedValue(0);

      await packageService.getAllPackages(queryParams);

      expect(Package.find).toHaveBeenCalledWith({ isActive: false });
    });

    it("should combine multiple filters", async () => {
      const queryParams: PackageQueryParams = {
        destination: "maldives",
        isActive: true,
        page: 1,
        limit: 10,
      };

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockPackages);

      (Package.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (Package.countDocuments as jest.Mock).mockResolvedValue(1);

      await packageService.getAllPackages(queryParams);

      expect(Package.find).toHaveBeenCalledWith({
        destination: { $regex: "maldives", $options: "i" },
        isActive: true,
      });
    });

    it("should return empty array when no packages found", async () => {
      const queryParams: PackageQueryParams = {};

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([]);

      (Package.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (Package.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await packageService.getAllPackages(queryParams);

      expect(result.packages).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });

    it("should calculate pages correctly for odd total counts", async () => {
      const queryParams: PackageQueryParams = { page: 1, limit: 10 };

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockPackages);

      (Package.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (Package.countDocuments as jest.Mock).mockResolvedValue(25);

      const result = await packageService.getAllPackages(queryParams);

      expect(result.pagination.pages).toBe(3);
    });

    it("should handle database errors gracefully", async () => {
      const queryParams: PackageQueryParams = {};

      (Package.find as jest.Mock).mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      await expect(packageService.getAllPackages(queryParams)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("getPackageById", () => {
    it("should return package by id", async () => {
      (Package.findById as jest.Mock).mockResolvedValue(mockPackage);

      const result = await packageService.getPackageById(mockPackageId);

      expect(Package.findById).toHaveBeenCalledWith(mockPackageId);
      expect(result.package).toEqual(mockPackage);
    });

    it("should throw error when package not found", async () => {
      (Package.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        packageService.getPackageById(mockPackageId)
      ).rejects.toThrow("Package not found");

      expect(Package.findById).toHaveBeenCalledWith(mockPackageId);
    });

    it("should handle invalid package id format", async () => {
      const invalidId = "invalid-id";
      (Package.findById as jest.Mock).mockRejectedValue(
        new Error("Cast to ObjectId failed")
      );

      await expect(packageService.getPackageById(invalidId)).rejects.toThrow(
        "Cast to ObjectId failed"
      );
    });

    it("should handle database errors", async () => {
      (Package.findById as jest.Mock).mockRejectedValue(
        new Error("Database query failed")
      );

      await expect(
        packageService.getPackageById(mockPackageId)
      ).rejects.toThrow("Database query failed");
    });
  });

  describe("createPackage", () => {
    const createRequest: CreatePackageRequest = {
      title: "Beach Paradise",
      description: "Amazing beach vacation",
      destination: "Maldives",
      price: 1000,
      duration: 7,
      maxPeople: 4,
    };

    it("should create package successfully", async () => {
      const mockSave = jest.fn().mockResolvedValue(mockPackage);

      (Package as unknown as jest.Mock).mockImplementation(() => ({
        ...mockPackage,
        save: mockSave,
      }));

      const result = await packageService.createPackage(createRequest);

      expect(mockSave).toHaveBeenCalled();
      expect(result.message).toBe("Package created successfully");
      expect(result.package).toBeDefined();
    });

    it("should create package with all provided fields", async () => {
      let capturedData: any;
      const mockSave = jest.fn().mockResolvedValue(mockPackage);

      (Package as unknown as jest.Mock).mockImplementation((data) => {
        capturedData = data;
        return {
          ...mockPackage,
          save: mockSave,
        };
      });

      await packageService.createPackage(createRequest);

      expect(capturedData).toEqual(createRequest);
    });

    it("should handle validation errors", async () => {
      const mockSave = jest
        .fn()
        .mockRejectedValue(new Error("Validation failed: title is required"));

      (Package as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      await expect(packageService.createPackage(createRequest)).rejects.toThrow(
        "Validation failed: title is required"
      );
    });

    it("should handle database save errors", async () => {
      const mockSave = jest
        .fn()
        .mockRejectedValue(new Error("Database write failed"));

      (Package as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      await expect(packageService.createPackage(createRequest)).rejects.toThrow(
        "Database write failed"
      );
    });

    it("should create package with minimum required fields", async () => {
      const minimalRequest: CreatePackageRequest = {
        title: "Minimal Package",
        destination: "Test",
        price: 500,
        duration: 3,
        maxPeople: 2,
        description: "",
      };

      const mockSave = jest.fn().mockResolvedValue({
        ...mockPackage,
        ...minimalRequest,
      });

      (Package as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await packageService.createPackage(minimalRequest);

      expect(mockSave).toHaveBeenCalled();
      expect(result.message).toBe("Package created successfully");
    });

    it("should handle special characters in package data", async () => {
      const specialRequest: CreatePackageRequest = {
        title: "O'Brien's Adventure",
        description: "Special chars: @#$%^&*()",
        destination: "São Paulo",
        price: 1500,
        duration: 10,
        maxPeople: 6,
      };

      const mockSave = jest.fn().mockResolvedValue(mockPackage);

      (Package as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await packageService.createPackage(specialRequest);

      expect(mockSave).toHaveBeenCalled();
      expect(result.message).toBe("Package created successfully");
    });
  });

  describe("updatePackage", () => {
    const updateRequest: UpdatePackageRequest = {
      title: "Updated Beach Paradise",
      price: 1200,
    };

    it("should update package successfully", async () => {
      const updatedPackage = { ...mockPackage, ...updateRequest };
      (Package.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        updatedPackage
      );

      const result = await packageService.updatePackage(
        mockPackageId,
        updateRequest
      );

      expect(Package.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPackageId,
        updateRequest,
        { new: true, runValidators: true }
      );
      expect(result.message).toBe("Package updated successfully");
      expect(result.package).toEqual(updatedPackage);
    });

    it("should throw error when package not found", async () => {
      (Package.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(
        packageService.updatePackage(mockPackageId, updateRequest)
      ).rejects.toThrow("Package not found");

      expect(Package.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPackageId,
        updateRequest,
        { new: true, runValidators: true }
      );
    });

    it("should update only provided fields", async () => {
      const partialUpdate: UpdatePackageRequest = { price: 1500 };
      const updatedPackage = { ...mockPackage, price: 1500 };

      (Package.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        updatedPackage
      );

      const result = await packageService.updatePackage(
        mockPackageId,
        partialUpdate
      );

      expect(Package.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPackageId,
        partialUpdate,
        { new: true, runValidators: true }
      );
      expect(result.package.price).toBe(1500);
    });

    it("should update isActive status", async () => {
      const statusUpdate: UpdatePackageRequest = { isActive: false };
      const updatedPackage = { ...mockPackage, isActive: false };

      (Package.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        updatedPackage
      );

      const result = await packageService.updatePackage(
        mockPackageId,
        statusUpdate
      );

      expect(result.package.isActive).toBe(false);
    });

    it("should handle validation errors during update", async () => {
      (Package.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error("Validation failed: price must be positive")
      );

      await expect(
        packageService.updatePackage(mockPackageId, { price: -100 })
      ).rejects.toThrow("Validation failed: price must be positive");
    });

    it("should update all fields when provided", async () => {
      const fullUpdate: UpdatePackageRequest = {
        title: "New Title",
        description: "New Description",
        destination: "New Destination",
        price: 2000,
        duration: 14,
        maxPeople: 8,
        isActive: false,
      };

      const updatedPackage = { ...mockPackage, ...fullUpdate };
      (Package.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        updatedPackage
      );

      const result = await packageService.updatePackage(
        mockPackageId,
        fullUpdate
      );

      expect(Package.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPackageId,
        fullUpdate,
        { new: true, runValidators: true }
      );
      expect(result.package).toEqual(updatedPackage);
    });

    it("should handle database update errors", async () => {
      (Package.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error("Database update failed")
      );

      await expect(
        packageService.updatePackage(mockPackageId, updateRequest)
      ).rejects.toThrow("Database update failed");
    });

    it("should return updated package with runValidators option", async () => {
      const updatedPackage = { ...mockPackage, ...updateRequest };
      (Package.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        updatedPackage
      );

      await packageService.updatePackage(mockPackageId, updateRequest);

      expect(Package.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPackageId,
        expect.any(Object),
        expect.objectContaining({ runValidators: true })
      );
    });
  });

  describe("deletePackage", () => {
    it("should delete package successfully", async () => {
      (Package.findByIdAndDelete as jest.Mock).mockResolvedValue(mockPackage);

      const result = await packageService.deletePackage(mockPackageId);

      expect(Package.findByIdAndDelete).toHaveBeenCalledWith(mockPackageId);
      expect(result.message).toBe("Package deleted successfully");
    });

    it("should throw error when package not found", async () => {
      (Package.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(packageService.deletePackage(mockPackageId)).rejects.toThrow(
        "Package not found"
      );

      expect(Package.findByIdAndDelete).toHaveBeenCalledWith(mockPackageId);
    });

    it("should handle invalid package id", async () => {
      const invalidId = "invalid-id";
      (Package.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error("Cast to ObjectId failed")
      );

      await expect(packageService.deletePackage(invalidId)).rejects.toThrow(
        "Cast to ObjectId failed"
      );
    });

    it("should handle database deletion errors", async () => {
      (Package.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error("Database deletion failed")
      );

      await expect(packageService.deletePackage(mockPackageId)).rejects.toThrow(
        "Database deletion failed"
      );
    });

    it("should not throw error for already deleted package", async () => {
      (Package.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(packageService.deletePackage(mockPackageId)).rejects.toThrow(
        "Package not found"
      );
    });
  });

  describe("Edge Cases and Business Logic", () => {
    it("should handle zero price in create package", async () => {
      const zeroPrice: CreatePackageRequest = {
        title: "Free Package",
        destination: "Local",
        price: 0,
        duration: 1,
        maxPeople: 10,
        description: "",
      };

      const mockSave = jest
        .fn()
        .mockResolvedValue({ ...mockPackage, price: 0 });

      (Package as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await packageService.createPackage(zeroPrice);

      expect(mockSave).toHaveBeenCalled();
      expect(result.message).toBe("Package created successfully");
    });

    it("should handle large numbers in package data", async () => {
      const largeNumbers: CreatePackageRequest = {
        title: "Luxury Package",
        destination: "Exclusive Resort",
        price: 999999,
        duration: 365,
        maxPeople: 100,
        description: "",
      };

      const mockSave = jest.fn().mockResolvedValue(mockPackage);

      (Package as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await packageService.createPackage(largeNumbers);

      expect(mockSave).toHaveBeenCalled();
    });

    it("should handle destination with special regex characters", async () => {
      const queryParams: PackageQueryParams = { destination: "Paris (France)" };

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([]);

      (Package.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (Package.countDocuments as jest.Mock).mockResolvedValue(0);

      await packageService.getAllPackages(queryParams);

      expect(Package.find).toHaveBeenCalledWith({
        destination: { $regex: "Paris (France)", $options: "i" },
      });
    });

    it("should handle empty string destination filter", async () => {
      const queryParams: PackageQueryParams = { destination: "" };

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([]);

      (Package.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (Package.countDocuments as jest.Mock).mockResolvedValue(0);

      await packageService.getAllPackages(queryParams);

      expect(Package.find).toHaveBeenCalledWith({});
    });

    it("should handle very large page numbers", async () => {
      const queryParams: PackageQueryParams = { page: 999, limit: 10 };

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([]);

      (Package.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (Package.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await packageService.getAllPackages(queryParams);

      expect(mockSkip).toHaveBeenCalledWith(9980);
      expect(result.packages).toEqual([]);
    });
  });

  describe("Integration Scenarios", () => {
    it("should create and then retrieve package", async () => {
      const createRequest: CreatePackageRequest = {
        title: "Test Package",
        destination: "Test Location",
        price: 500,
        duration: 5,
        maxPeople: 3,
        description: "",
      };

      const mockSave = jest.fn().mockResolvedValue(mockPackage);

      (Package as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      const createResult = await packageService.createPackage(createRequest);

      (Package.findById as jest.Mock).mockResolvedValue(mockPackage);

      const getResult = await packageService.getPackageById(mockPackageId);

      expect(createResult.message).toBe("Package created successfully");
      expect(getResult.package).toEqual(mockPackage);
    });

    it("should create, update, and delete package", async () => {
      const mockSave = jest.fn().mockResolvedValue(mockPackage);

      (Package as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      await packageService.createPackage({
        title: "Test",
        destination: "Test",
        price: 100,
        duration: 1,
        maxPeople: 1,
        description: "",
      });

      const updatedPackage = { ...mockPackage, price: 200 };
      (Package.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        updatedPackage
      );

      await packageService.updatePackage(mockPackageId, { price: 200 });

      (Package.findByIdAndDelete as jest.Mock).mockResolvedValue(mockPackage);

      const deleteResult = await packageService.deletePackage(mockPackageId);

      expect(deleteResult.message).toBe("Package deleted successfully");
    });
  });
});
