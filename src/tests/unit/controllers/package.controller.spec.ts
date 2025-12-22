import { Request, Response } from 'express';

// Mock the PackageService before importing the controller
const mockPackageService = {
  getAllPackages: jest.fn(),
  getPackageById: jest.fn(),
  createPackage: jest.fn(),
  updatePackage: jest.fn(),
  deletePackage: jest.fn(),
};

jest.mock('../../../services/packageService', () => {
  return {
    PackageService: jest.fn().mockImplementation(() => mockPackageService)
  };
});

// Import controller after mocking
import {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
} from '../../../controllers/packageController';

describe('Package Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPackages', () => {
    it('should return all packages with pagination', async () => {
      const expectedResult = {
        packages: [
          {
            id: 'pkg1',
            title: 'Beach Paradise',
            destination: 'Maldives',
            price: 2000,
            isActive: true,
          },
          {
            id: 'pkg2',
            title: 'Mountain Adventure',
            destination: 'Nepal',
            price: 1500,
            isActive: true,
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockRequest.query = {
        page: '1',
        limit: '10',
        destination: 'Maldives',
        isActive: 'true',
      };

      mockPackageService.getAllPackages.mockResolvedValue(expectedResult);

      await getAllPackages(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.getAllPackages).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        destination: 'Maldives',
        isActive: true,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should handle isActive as false', async () => {
      const expectedResult = {
        packages: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockRequest.query = {
        page: '1',
        limit: '10',
        isActive: 'false',
      };

      mockPackageService.getAllPackages.mockResolvedValue(expectedResult);

      await getAllPackages(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.getAllPackages).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        destination: undefined,
        isActive: false,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should handle isActive as undefined when not true or false', async () => {
      const expectedResult = {
        packages: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockRequest.query = {
        page: '1',
        limit: '10',
        isActive: 'invalid',
      };

      mockPackageService.getAllPackages.mockResolvedValue(expectedResult);

      await getAllPackages(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.getAllPackages).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        destination: undefined,
        isActive: undefined,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should handle missing query parameters', async () => {
      const expectedResult = {
        packages: [],
        total: 0,
        page: NaN,
        limit: NaN,
      };

      mockRequest.query = {};
      mockPackageService.getAllPackages.mockResolvedValue(expectedResult);

      await getAllPackages(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.getAllPackages).toHaveBeenCalledWith({
        page: NaN,
        limit: NaN,
        destination: undefined,
        isActive: undefined,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should handle destination filter', async () => {
      const expectedResult = {
        packages: [
          {
            id: 'pkg1',
            title: 'Beach Paradise',
            destination: 'Maldives',
            price: 2000,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockRequest.query = {
        page: '1',
        limit: '10',
        destination: 'Maldives',
      };

      mockPackageService.getAllPackages.mockResolvedValue(expectedResult);

      await getAllPackages(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.getAllPackages).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        destination: 'Maldives',
        isActive: undefined,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should return 500 on server error', async () => {
      mockRequest.query = { page: '1', limit: '10' };
      mockPackageService.getAllPackages.mockRejectedValue(
        new Error('Database connection failed')
      );

      await getAllPackages(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'Database connection failed',
      });
    });
  });

  describe('getPackageById', () => {
    it('should return package by id successfully', async () => {
      const expectedPackage = {
        id: 'pkg123',
        title: 'Beach Paradise',
        destination: 'Maldives',
        price: 2000,
        duration: 7,
        description: 'Amazing beach vacation',
        isActive: true,
      };

      mockRequest.params = { id: 'pkg123' };
      mockPackageService.getPackageById.mockResolvedValue(expectedPackage);

      await getPackageById(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.getPackageById).toHaveBeenCalledWith('pkg123');
      expect(mockResponse.json).toHaveBeenCalledWith(expectedPackage);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 404 if package not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPackageService.getPackageById.mockRejectedValue(
        new Error('Package not found')
      );

      await getPackageById(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.getPackageById).toHaveBeenCalledWith(
        'nonexistent'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Package not found',
        error: 'Package not found',
      });
    });

    it('should return 500 for other errors', async () => {
      mockRequest.params = { id: 'pkg123' };
      mockPackageService.getPackageById.mockRejectedValue(
        new Error('Database error')
      );

      await getPackageById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database error',
        error: 'Database error',
      });
    });
  });

  describe('createPackage', () => {
    it('should create package successfully and return 201', async () => {
      const packageData = {
        title: 'Beach Paradise',
        destination: 'Maldives',
        price: 2000,
        duration: 7,
        description: 'Amazing beach vacation',
        availableDates: ['2024-12-25', '2024-12-26'],
        maxTravelers: 20,
        isActive: true,
      };

      const expectedResult = {
        id: 'pkg123',
        ...packageData,
        createdAt: '2024-12-22T00:00:00Z',
      };

      mockRequest.body = packageData;
      mockPackageService.createPackage.mockResolvedValue(expectedResult);

      await createPackage(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.createPackage).toHaveBeenCalledWith(
        packageData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should return 500 on creation error', async () => {
      const packageData = {
        title: 'Beach Paradise',
        destination: 'Maldives',
        price: 2000,
      };

      mockRequest.body = packageData;
      mockPackageService.createPackage.mockRejectedValue(
        new Error('Failed to create package')
      );

      await createPackage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'Failed to create package',
      });
    });

    it('should handle validation errors', async () => {
      const invalidPackageData = {
        title: '',
        price: -100,
      };

      mockRequest.body = invalidPackageData;
      mockPackageService.createPackage.mockRejectedValue(
        new Error('Validation failed')
      );

      await createPackage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'Validation failed',
      });
    });
  });

  describe('updatePackage', () => {
    it('should update package successfully', async () => {
      const updateData = {
        price: 2500,
        isActive: false,
      };

      const expectedResult = {
        id: 'pkg123',
        title: 'Beach Paradise',
        destination: 'Maldives',
        price: 2500,
        isActive: false,
        updatedAt: '2024-12-22T00:00:00Z',
      };

      mockRequest.params = { id: 'pkg123' };
      mockRequest.body = updateData;
      mockPackageService.updatePackage.mockResolvedValue(expectedResult);

      await updatePackage(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.updatePackage).toHaveBeenCalledWith(
        'pkg123',
        updateData
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 404 if package not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { price: 2500 };
      mockPackageService.updatePackage.mockRejectedValue(
        new Error('Package not found')
      );

      await updatePackage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Package not found',
        error: 'Package not found',
      });
    });

    it('should return 500 for server errors', async () => {
      mockRequest.params = { id: 'pkg123' };
      mockRequest.body = { price: 2500 };
      mockPackageService.updatePackage.mockRejectedValue(
        new Error('Database update failed')
      );

      await updatePackage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database update failed',
        error: 'Database update failed',
      });
    });

    it('should handle partial updates', async () => {
      const partialUpdate = {
        title: 'Updated Beach Paradise',
      };

      const expectedResult = {
        id: 'pkg123',
        title: 'Updated Beach Paradise',
        destination: 'Maldives',
        price: 2000,
        isActive: true,
      };

      mockRequest.params = { id: 'pkg123' };
      mockRequest.body = partialUpdate;
      mockPackageService.updatePackage.mockResolvedValue(expectedResult);

      await updatePackage(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.updatePackage).toHaveBeenCalledWith(
        'pkg123',
        partialUpdate
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('deletePackage', () => {
    it('should delete package successfully', async () => {
      const expectedResult = {
        message: 'Package deleted successfully',
        id: 'pkg123',
      };

      mockRequest.params = { id: 'pkg123' };
      mockPackageService.deletePackage.mockResolvedValue(expectedResult);

      await deletePackage(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.deletePackage).toHaveBeenCalledWith('pkg123');
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 404 if package not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPackageService.deletePackage.mockRejectedValue(
        new Error('Package not found')
      );

      await deletePackage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Package not found',
        error: 'Package not found',
      });
    });

    it('should return 500 for server errors', async () => {
      mockRequest.params = { id: 'pkg123' };
      mockPackageService.deletePackage.mockRejectedValue(
        new Error('Database deletion failed')
      );

      await deletePackage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database deletion failed',
        error: 'Database deletion failed',
      });
    });

    it('should handle deletion of active packages', async () => {
      const expectedResult = {
        message: 'Package deleted successfully',
        id: 'pkg123',
        warning: 'Active package was deleted',
      };

      mockRequest.params = { id: 'pkg123' };
      mockPackageService.deletePackage.mockResolvedValue(expectedResult);

      await deletePackage(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.deletePackage).toHaveBeenCalledWith('pkg123');
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('should handle empty request body for create', async () => {
      mockRequest.body = {};
      mockPackageService.createPackage.mockRejectedValue(
        new Error('Required fields missing')
      );

      await createPackage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'Required fields missing',
      });
    });

    it('should handle empty request body for update', async () => {
      mockRequest.params = { id: 'pkg123' };
      mockRequest.body = {};
      mockPackageService.updatePackage.mockResolvedValue({
        id: 'pkg123',
        title: 'Unchanged Package',
      });

      await updatePackage(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.updatePackage).toHaveBeenCalledWith(
        'pkg123',
        {}
      );
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle multiple filters in getAllPackages', async () => {
      const expectedResult = {
        packages: [],
        total: 0,
        page: 2,
        limit: 20,
      };

      mockRequest.query = {
        page: '2',
        limit: '20',
        destination: 'Nepal',
        isActive: 'true',
      };

      mockPackageService.getAllPackages.mockResolvedValue(expectedResult);

      await getAllPackages(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.getAllPackages).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        destination: 'Nepal',
        isActive: true,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should handle non-numeric page and limit values', async () => {
      mockRequest.query = {
        page: 'invalid',
        limit: 'also-invalid',
      };

      const expectedResult = {
        packages: [],
        total: 0,
        page: NaN,
        limit: NaN,
      };

      mockPackageService.getAllPackages.mockResolvedValue(expectedResult);

      await getAllPackages(mockRequest as Request, mockResponse as Response);

      expect(mockPackageService.getAllPackages).toHaveBeenCalledWith({
        page: NaN,
        limit: NaN,
        destination: undefined,
        isActive: undefined,
      });
    });
  });
});