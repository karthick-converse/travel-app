import { Request, Response } from 'express';
import { AuthRequest } from '../../../types';

// Mock the UserService before importing the controller
const mockUserService = {
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

jest.mock('../../../services/userService', () => {
  return {
    UserService: jest.fn().mockImplementation(() => mockUserService)
  };
});

// Import controller after mocking
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../../../controllers/userController';

describe('User Controller', () => {
  let mockRequest: Partial<Request>;
  let mockAuthRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    mockAuthRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
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

  describe('getAllUsers', () => {
    it('should return all users with pagination', async () => {
      const expectedResult = {
        users: [
          {
            id: 'user1',
            email: 'user1@example.com',
            name: 'User One',
            role: 'user',
          },
          {
            id: 'user2',
            email: 'user2@example.com',
            name: 'User Two',
            role: 'admin',
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockRequest.query = {
        page: '1',
        limit: '10',
      };

      mockUserService.getAllUsers.mockResolvedValue(expectedResult);

      await getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle missing pagination parameters', async () => {
      const expectedResult = {
        users: [],
        total: 0,
        page: NaN,
        limit: NaN,
      };

      mockRequest.query = {};
      mockUserService.getAllUsers.mockResolvedValue(expectedResult);

      await getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith({
        page: NaN,
        limit: NaN,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should handle different page and limit values', async () => {
      const expectedResult = {
        users: [],
        total: 100,
        page: 5,
        limit: 20,
      };

      mockRequest.query = {
        page: '5',
        limit: '20',
      };

      mockUserService.getAllUsers.mockResolvedValue(expectedResult);

      await getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith({
        page: 5,
        limit: 20,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should return 500 on server error', async () => {
      mockRequest.query = { page: '1', limit: '10' };
      mockUserService.getAllUsers.mockRejectedValue(
        new Error('Database connection failed')
      );

      await getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'Database connection failed',
      });
    });

    it('should handle non-numeric pagination values', async () => {
      const expectedResult = {
        users: [],
        total: 0,
        page: NaN,
        limit: NaN,
      };

      mockRequest.query = {
        page: 'invalid',
        limit: 'also-invalid',
      };

      mockUserService.getAllUsers.mockResolvedValue(expectedResult);

      await getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith({
        page: NaN,
        limit: NaN,
      });
    });
  });

  describe('getUserById', () => {
    it('should return user by id successfully', async () => {
      const expectedUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockRequest.params = { id: 'user123' };
      mockUserService.getUserById.mockResolvedValue(expectedUser);

      await getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getUserById).toHaveBeenCalledWith('user123');
      expect(mockResponse.json).toHaveBeenCalledWith(expectedUser);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockUserService.getUserById.mockRejectedValue(
        new Error('User not found')
      );

      await getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getUserById).toHaveBeenCalledWith('nonexistent');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not found',
        error: 'User not found',
      });
    });

    it('should return 500 for database errors', async () => {
      mockRequest.params = { id: 'user123' };
      mockUserService.getUserById.mockRejectedValue(
        new Error('Database query failed')
      );

      await getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database query failed',
        error: 'Database query failed',
      });
    });

    it('should handle admin users', async () => {
      const expectedUser = {
        id: 'admin123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      };

      mockRequest.params = { id: 'admin123' };
      mockUserService.getUserById.mockResolvedValue(expectedUser);

      await getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getUserById).toHaveBeenCalledWith('admin123');
      expect(mockResponse.json).toHaveBeenCalledWith(expectedUser);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const expectedResult = {
        id: 'user123',
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'user',
        updatedAt: '2024-12-22T00:00:00Z',
      };

      mockAuthRequest.params = { id: 'user123' };
      mockAuthRequest.body = updateData;
      mockUserService.updateUser.mockResolvedValue(expectedResult);

      await updateUser(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        'user123',
        updateData,
        'user123',
        'user'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      mockAuthRequest.params = { id: 'nonexistent' };
      mockAuthRequest.body = { name: 'New Name' };
      mockUserService.updateUser.mockRejectedValue(
        new Error('User not found')
      );

      await updateUser(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not found',
        error: 'User not found',
      });
    });

    it('should return 403 if access denied', async () => {
      mockAuthRequest.params = { id: 'otheruser123' };
      mockAuthRequest.body = { name: 'Hacked Name' };
      mockUserService.updateUser.mockRejectedValue(
        new Error('Access denied')
      );

      await updateUser(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        'otheruser123',
        { name: 'Hacked Name' },
        'user123',
        'user'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Access denied',
        error: 'Access denied',
      });
    });

    it('should return 400 if email already in use', async () => {
      mockAuthRequest.params = { id: 'user123' };
      mockAuthRequest.body = { email: 'existing@example.com' };
      mockUserService.updateUser.mockRejectedValue(
        new Error('Email already in use')
      );

      await updateUser(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Email already in use',
        error: 'Email already in use',
      });
    });

    it('should return 500 for server errors', async () => {
      mockAuthRequest.params = { id: 'user123' };
      mockAuthRequest.body = { name: 'New Name' };
      mockUserService.updateUser.mockRejectedValue(
        new Error('Database update failed')
      );

      await updateUser(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database update failed',
        error: 'Database update failed',
      });
    });

    it('should allow admin to update any user', async () => {
      const adminAuthRequest = {
        ...mockAuthRequest,
        user: {
          id: 'admin123',
          email: 'admin@example.com',
          role: 'admin',
        },
      };

      const updateData = { role: 'admin' };
      const expectedResult = {
        id: 'user123',
        role: 'admin',
        updatedAt: '2024-12-22T00:00:00Z',
      };

      adminAuthRequest.params = { id: 'user123' };
      adminAuthRequest.body = updateData;
      mockUserService.updateUser.mockResolvedValue(expectedResult);

      await updateUser(
        adminAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        'user123',
        updateData,
        'admin123',
        'admin'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'Only Name Changed' };
      const expectedResult = {
        id: 'user123',
        name: 'Only Name Changed',
        email: 'test@example.com',
        role: 'user',
      };

      mockAuthRequest.params = { id: 'user123' };
      mockAuthRequest.body = partialUpdate;
      mockUserService.updateUser.mockResolvedValue(expectedResult);

      await updateUser(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        'user123',
        partialUpdate,
        'user123',
        'user'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should handle empty update body', async () => {
      mockAuthRequest.params = { id: 'user123' };
      mockAuthRequest.body = {};

      const expectedResult = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };

      mockUserService.updateUser.mockResolvedValue(expectedResult);

      await updateUser(
        mockAuthRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        'user123',
        {},
        'user123',
        'user'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const expectedResult = {
        message: 'User deleted successfully',
        id: 'user123',
      };

      mockRequest.params = { id: 'user123' };
      mockUserService.deleteUser.mockResolvedValue(expectedResult);

      await deleteUser(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith('user123');
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockUserService.deleteUser.mockRejectedValue(
        new Error('User not found')
      );

      await deleteUser(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith('nonexistent');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not found',
        error: 'User not found',
      });
    });

    it('should return 500 for database errors', async () => {
      mockRequest.params = { id: 'user123' };
      mockUserService.deleteUser.mockRejectedValue(
        new Error('Database deletion failed')
      );

      await deleteUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database deletion failed',
        error: 'Database deletion failed',
      });
    });

    it('should handle deletion with associated data', async () => {
      const expectedResult = {
        message: 'User deleted successfully',
        id: 'user123',
        warning: 'Associated bookings were also deleted',
      };

      mockRequest.params = { id: 'user123' };
      mockUserService.deleteUser.mockResolvedValue(expectedResult);

      await deleteUser(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith('user123');
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should handle cascade deletion errors', async () => {
      mockRequest.params = { id: 'user123' };
      mockUserService.deleteUser.mockRejectedValue(
        new Error('Cannot delete user with active bookings')
      );

      await deleteUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Cannot delete user with active bookings',
        error: 'Cannot delete user with active bookings',
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle missing user in AuthRequest for updateUser', async () => {
      const invalidAuthRequest = {
        params: { id: 'user123' },
        body: { name: 'New Name' },
        user: undefined,
      };

      await updateUser(
        invalidAuthRequest as unknown as AuthRequest,
        mockResponse as Response
      );

      // Should return 500 error due to undefined user
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Cannot read properties of undefined (reading 'id')",
        error: "Cannot read properties of undefined (reading 'id')",
      });
    });

    it('should handle special characters in user IDs', async () => {
      const specialId = 'user-123-abc_def';
      const expectedUser = {
        id: specialId,
        email: 'test@example.com',
        name: 'Test User',
      };

      mockRequest.params = { id: specialId };
      mockUserService.getUserById.mockResolvedValue(expectedUser);

      await getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(specialId);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedUser);
    });

    it('should handle very large page numbers', async () => {
      const expectedResult = {
        users: [],
        total: 100,
        page: 1000,
        limit: 10,
      };

      mockRequest.query = {
        page: '1000',
        limit: '10',
      };

      mockUserService.getAllUsers.mockResolvedValue(expectedResult);

      await getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith({
        page: 1000,
        limit: 10,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should handle negative page numbers', async () => {
      const expectedResult = {
        users: [],
        total: 0,
        page: -1,
        limit: 10,
      };

      mockRequest.query = {
        page: '-1',
        limit: '10',
      };

      mockUserService.getAllUsers.mockResolvedValue(expectedResult);

      await getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith({
        page: -1,
        limit: 10,
      });
    });
  });
});