import jwt from 'jsonwebtoken';
import { AuthService } from '../../../services/authService';
import { LoginRequest, RegisterRequest } from '../../../dto/auth.dto';
import User from '../../../models/User';
jest.mock('jsonwebtoken');
jest.mock('../../../models/User');

describe('AuthService', () => {
  let authService: AuthService;
  
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockToken = 'mock.jwt.token';
  const mockJwtSecret = 'test-jwt-secret';

  const mockUserData = {
    _id: mockUserId,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    password: 'hashedPassword123'
  };

  beforeAll(() => {
    process.env.JWT_SECRET = mockJwtSecret;
  });

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  describe('register', () => {
    const registerRequest: RegisterRequest = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!'
    };

    it('should successfully register a new user', async () => {
      const mockSave = jest.fn().mockResolvedValue(mockUserData);
      const mockUserInstance = {
        ...mockUserData,
        _id: { toString: () => mockUserId },
        save: mockSave
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as unknown as jest.Mock).mockImplementation(() => mockUserInstance);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = await authService.register(registerRequest);

      expect(User.findOne).toHaveBeenCalledWith({ email: registerRequest.email });
      expect(User.findOne).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUserId },
        mockJwtSecret,
        { expiresIn: '7d' }
      );
      expect(result).toEqual({
        message: 'User registered successfully',
        token: mockToken,
        user: {
          id: mockUserId,
          name: mockUserData.name,
          email: mockUserData.email,
          role: mockUserData.role
        }
      });
    });

    it('should throw error when user already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUserData);

      await expect(authService.register(registerRequest))
        .rejects
        .toThrow('User already exists with this email');

      expect(User.findOne).toHaveBeenCalledWith({ email: registerRequest.email });
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should throw error when database save fails', async () => {
      const mockError = new Error('Database connection failed');
      const mockSave = jest.fn().mockRejectedValue(mockError);

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave
      }));

      await expect(authService.register(registerRequest))
        .rejects
        .toThrow('Database connection failed');

      expect(User.findOne).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should create user with correct data', async () => {
      const mockSave = jest.fn().mockResolvedValue(mockUserData);
      let capturedUserData: any;

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as unknown as jest.Mock).mockImplementation((data) => {
        capturedUserData = data;
        return {
          ...mockUserData,
          _id: { toString: () => mockUserId },
          save: mockSave
        };
      });
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      await authService.register(registerRequest);

      expect(capturedUserData).toEqual({
        name: registerRequest.name,
        email: registerRequest.email,
        password: registerRequest.password
      });
    });
  });

  describe('login', () => {
    const loginRequest: LoginRequest = {
      email: 'john@example.com',
      password: 'Password123!'
    };

    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        ...mockUserData,
        _id: { toString: () => mockUserId },
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = await authService.login(loginRequest);

      expect(User.findOne).toHaveBeenCalledWith({ email: loginRequest.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginRequest.password);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUserId },
        mockJwtSecret,
        { expiresIn: '7d' }
      );
      expect(result).toEqual({
        message: 'Login successful',
        token: mockToken,
        user: {
          id: mockUserId,
          name: mockUserData.name,
          email: mockUserData.email,
          role: mockUserData.role
        }
      });
    });

    it('should throw error when user does not exist', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(loginRequest))
        .rejects
        .toThrow('Invalid credentials');

      expect(User.findOne).toHaveBeenCalledWith({ email: loginRequest.email });
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should throw error when password is incorrect', async () => {
      const mockUser = {
        ...mockUserData,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.login(loginRequest))
        .rejects
        .toThrow('Invalid credentials');

      expect(User.findOne).toHaveBeenCalledWith({ email: loginRequest.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginRequest.password);
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should throw error when comparePassword fails', async () => {
      const mockError = new Error('Password comparison failed');
      const mockUser = {
        ...mockUserData,
        comparePassword: jest.fn().mockRejectedValue(mockError)
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.login(loginRequest))
        .rejects
        .toThrow('Password comparison failed');

      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginRequest.password);
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should handle database error during user lookup', async () => {
      const mockError = new Error('Database query failed');
      (User.findOne as jest.Mock).mockRejectedValue(mockError);

      await expect(authService.login(loginRequest))
        .rejects
        .toThrow('Database query failed');

      expect(User.findOne).toHaveBeenCalledWith({ email: loginRequest.email });
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should successfully return user profile', async () => {
      const mockUserProfile = {
        _id: mockUserId,
        name: mockUserData.name,
        email: mockUserData.email,
        role: mockUserData.role
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUserProfile);
      (User.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await authService.getProfile(mockUserId);

      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockSelect).toHaveBeenCalledWith('-password');
      expect(result).toEqual({ user: mockUserProfile });
    });

    it('should throw error when user is not found', async () => {
      const mockSelect = jest.fn().mockResolvedValue(null);
      (User.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(authService.getProfile(mockUserId))
        .rejects
        .toThrow('User not found');

      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockSelect).toHaveBeenCalledWith('-password');
    });

    it('should exclude password field from response', async () => {
      const mockUserProfile = {
        _id: mockUserId,
        name: mockUserData.name,
        email: mockUserData.email,
        role: mockUserData.role
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUserProfile);
      (User.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await authService.getProfile(mockUserId);

      expect(mockSelect).toHaveBeenCalledWith('-password');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should handle database error during profile fetch', async () => {
      const mockError = new Error('Database read error');
      const mockSelect = jest.fn().mockRejectedValue(mockError);
      (User.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(authService.getProfile(mockUserId))
        .rejects
        .toThrow('Database read error');

      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockSelect).toHaveBeenCalledWith('-password');
    });

    it('should work with different user IDs', async () => {
      const differentUserId = '507f1f77bcf86cd799439099';
      const mockUserProfile = {
        _id: differentUserId,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'admin'
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUserProfile);
      (User.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await authService.getProfile(differentUserId);

      expect(User.findById).toHaveBeenCalledWith(differentUserId);
      expect(result.user._id).toBe(differentUserId);
    });
  });

  describe('generateToken (private method)', () => {
    it('should generate token with correct configuration during registration', async () => {
      const mockSave = jest.fn().mockResolvedValue(mockUserData);
      const mockUserInstance = {
        ...mockUserData,
        _id: { toString: () => mockUserId },
        save: mockSave
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as unknown as jest.Mock).mockImplementation(() => mockUserInstance);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123!'
      });

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUserId },
        mockJwtSecret,
        { expiresIn: '7d' }
      );
    });

    it('should use same token generation for login', async () => {
      const mockUser = {
        ...mockUserData,
        _id: { toString: () => mockUserId },
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      await authService.login({
        email: 'john@example.com',
        password: 'Password123!'
      });

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUserId },
        mockJwtSecret,
        { expiresIn: '7d' }
      );
    });

    it('should use JWT_SECRET from environment', async () => {
      const mockUser = {
        ...mockUserData,
        _id: { toString: () => mockUserId },
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      await authService.login({
        email: 'john@example.com',
        password: 'Password123!'
      });

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        mockJwtSecret,
        expect.any(Object)
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty email in registration', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const invalidRequest = {
        name: 'John Doe',
        email: '',
        password: 'Password123!'
      };

      const mockSave = jest.fn().mockResolvedValue({
        ...mockUserData,
        email: ''
      });
      (User as unknown as jest.Mock).mockImplementation(() => ({
        ...mockUserData,
        _id: { toString: () => mockUserId },
        save: mockSave
      }));
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      await authService.register(invalidRequest);

      expect(User.findOne).toHaveBeenCalledWith({ email: '' });
    });

    it('should handle special characters in user data', async () => {
      const specialRequest: RegisterRequest = {
        name: "O'Brien-Smith",
        email: 'test+special@example.com',
        password: 'P@ssw0rd!#$'
      };

      const mockSave = jest.fn().mockResolvedValue(mockUserData);
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as unknown as jest.Mock).mockImplementation(() => ({
        ...mockUserData,
        _id: { toString: () => mockUserId },
        save: mockSave
      }));
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = await authService.register(specialRequest);

      expect(result.message).toBe('User registered successfully');
      expect(result.token).toBe(mockToken);
    });
  });
});