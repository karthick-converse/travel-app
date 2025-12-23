import { UserService } from "../../../services/userService";
import User from "../../../models/User";
import { UpdateUserRequest, UserQueryParams } from "../../../dto/user.dto";

jest.mock("../../../models/User");

describe("UserService", () => {
  let userService: UserService;

  const mockUserId = "507f1f77bcf86cd799439011";
  const mockAdminId = "507f1f77bcf86cd799439012";
  const mockOtherUserId = "507f1f77bcf86cd799439013";

  const mockUser = {
    _id: mockUserId,
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  const mockAdmin = {
    _id: mockAdminId,
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe("getAllUsers", () => {
    const mockUsers = [mockUser, mockAdmin];

    it("should return all users with default pagination", async () => {
      const queryParams: UserQueryParams = {};

      const mockSelect = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockUsers);

      (User.find as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (User.countDocuments as jest.Mock).mockResolvedValue(2);

      const result = await userService.getAllUsers(queryParams);

      expect(User.find).toHaveBeenCalledWith();
      expect(mockSelect).toHaveBeenCalledWith("-password");
      expect(mockSkip).toHaveBeenCalledWith(0);
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result.users).toEqual(mockUsers);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      });
    });

    it("should return users with custom pagination", async () => {
      const queryParams: UserQueryParams = { page: 2, limit: 5 };

      const mockSelect = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockUsers);

      (User.find as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (User.countDocuments as jest.Mock).mockResolvedValue(12);

      const result = await userService.getAllUsers(queryParams);

      expect(mockSkip).toHaveBeenCalledWith(5);
      expect(mockLimit).toHaveBeenCalledWith(5);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 12,
        pages: 3,
      });
    });

    it("should exclude password field from results", async () => {
      const queryParams: UserQueryParams = {};

      const mockSelect = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockUsers);

      (User.find as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (User.countDocuments as jest.Mock).mockResolvedValue(2);

      await userService.getAllUsers(queryParams);

      expect(mockSelect).toHaveBeenCalledWith("-password");
    });

    it("should return empty array when no users found", async () => {
      const queryParams: UserQueryParams = {};

      const mockSelect = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([]);

      (User.find as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await userService.getAllUsers(queryParams);

      expect(result.users).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });

    it("should calculate pages correctly", async () => {
      const queryParams: UserQueryParams = { page: 1, limit: 10 };

      const mockSelect = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockUsers);

      (User.find as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (User.countDocuments as jest.Mock).mockResolvedValue(25);

      const result = await userService.getAllUsers(queryParams);

      expect(result.pagination.pages).toBe(3);
    });

    it("should handle database errors", async () => {
      const queryParams: UserQueryParams = {};

      (User.find as jest.Mock).mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      await expect(userService.getAllUsers(queryParams)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("getUserById", () => {
    it("should return user by id without password", async () => {
      const mockSelect = jest.fn().mockResolvedValue(mockUser);

      (User.findById as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await userService.getUserById(mockUserId);

      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockSelect).toHaveBeenCalledWith("-password");
      expect(result.user).toEqual(mockUser);
    });

    it("should throw error when user not found", async () => {
      const mockSelect = jest.fn().mockResolvedValue(null);

      (User.findById as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await expect(userService.getUserById(mockUserId)).rejects.toThrow(
        "User not found"
      );

      expect(User.findById).toHaveBeenCalledWith(mockUserId);
    });

    it("should handle invalid user id format", async () => {
      const invalidId = "invalid-id";

      (User.findById as jest.Mock).mockImplementation(() => {
        throw new Error("Cast to ObjectId failed");
      });

      await expect(userService.getUserById(invalidId)).rejects.toThrow(
        "Cast to ObjectId failed"
      );
    });

    it("should handle database errors", async () => {
      const mockSelect = jest
        .fn()
        .mockRejectedValue(new Error("Database query failed"));

      (User.findById as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await expect(userService.getUserById(mockUserId)).rejects.toThrow(
        "Database query failed"
      );
    });
  });

  describe("updateUser", () => {
    const updateRequest: UpdateUserRequest = {
      name: "John Updated",
      email: "johnupdated@example.com",
    };

    it("should allow user to update their own profile", async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const mockSelect = jest.fn().mockResolvedValue({
        ...mockUser,
        ...updateRequest,
      });

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await userService.updateUser(
        mockUserId,
        updateRequest,
        mockUserId,
        "user"
      );

      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(result.message).toBe("User updated successfully");
      expect(result.user!.name).toBe(updateRequest.name);
    });

    it("should allow admin to update any user profile", async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const mockSelect = jest.fn().mockResolvedValue({
        ...mockUser,
        ...updateRequest,
      });

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await userService.updateUser(
        mockUserId,
        updateRequest,
        mockAdminId,
        "admin"
      );

      expect(result.message).toBe("User updated successfully");
    });

    it("should throw error when non-admin tries to update other user", async () => {
      await expect(
        userService.updateUser(
          mockOtherUserId,
          updateRequest,
          mockUserId,
          "user"
        )
      ).rejects.toThrow("Access denied");

      expect(User.findById).not.toHaveBeenCalled();
    });

    it("should throw error when user not found", async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.updateUser(mockUserId, updateRequest, mockUserId, "user")
      ).rejects.toThrow("User not found");
    });

    it("should throw error when email already in use by another user", async () => {
      const existingUser = {
        _id: mockOtherUserId,
        email: "johnupdated@example.com",
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue(existingUser);

      await expect(
        userService.updateUser(mockUserId, updateRequest, mockUserId, "user")
      ).rejects.toThrow("Email already in use");

      expect(User.findOne).toHaveBeenCalledWith({
        email: updateRequest.email,
      });
    });

    it("should allow updating email to same email", async () => {
      const sameEmailUpdate: UpdateUserRequest = {
        name: "John Updated",
        email: mockUser.email,
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const mockSelect = jest.fn().mockResolvedValue({
        ...mockUser,
        name: sameEmailUpdate.name,
      });

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await userService.updateUser(
        mockUserId,
        sameEmailUpdate,
        mockUserId,
        "user"
      );

      expect(result.message).toBe("User updated successfully");
    });

    it("should update only name when email not provided", async () => {
      const nameOnlyUpdate: UpdateUserRequest = {
        name: "John Updated",
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const mockSelect = jest.fn().mockResolvedValue({
        ...mockUser,
        name: nameOnlyUpdate.name,
      });

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await userService.updateUser(
        mockUserId,
        nameOnlyUpdate,
        mockUserId,
        "user"
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        { name: nameOnlyUpdate.name },
        { new: true, runValidators: true }
      );
      expect(result.user!.name).toBe(nameOnlyUpdate.name);
    });

    it("should update only email when name not provided", async () => {
      const emailOnlyUpdate: UpdateUserRequest = {
        email: "newemail@example.com",
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const mockSelect = jest.fn().mockResolvedValue({
        ...mockUser,
        email: emailOnlyUpdate.email,
      });

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await userService.updateUser(
        mockUserId,
        emailOnlyUpdate,
        mockUserId,
        "user"
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        { email: emailOnlyUpdate.email },
        { new: true, runValidators: true }
      );
      expect(result.user!.email).toBe(emailOnlyUpdate.email);
    });

    it("should exclude password from updated user response", async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const mockSelect = jest.fn().mockResolvedValue(mockUser);

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await userService.updateUser(
        mockUserId,
        updateRequest,
        mockUserId,
        "user"
      );

      expect(mockSelect).toHaveBeenCalledWith("-password");
    });

    it("should handle validation errors", async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      (User.findByIdAndUpdate as jest.Mock).mockImplementation(() => {
        throw new Error("Validation failed: email is invalid");
      });

      await expect(
        userService.updateUser(
          mockUserId,
          { email: "invalid-email" },
          mockUserId,
          "user"
        )
      ).rejects.toThrow("Validation failed: email is invalid");
    });

    it("should not check email uniqueness when email not changed", async () => {
      const updateWithoutEmail: UpdateUserRequest = {
        name: "New Name",
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const mockSelect = jest.fn().mockResolvedValue(mockUser);

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await userService.updateUser(
        mockUserId,
        updateWithoutEmail,
        mockUserId,
        "user"
      );

      expect(User.findOne).not.toHaveBeenCalled();
    });

    it("should use runValidators option", async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const mockSelect = jest.fn().mockResolvedValue(mockUser);

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await userService.updateUser(
        mockUserId,
        updateRequest,
        mockUserId,
        "user"
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Object),
        expect.objectContaining({ runValidators: true })
      );
    });
  });

  describe("deleteUser", () => {
 

    it("should throw error when user not found", async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(userService.deleteUser(mockUserId)).rejects.toThrow(
        "User not found"
      );

      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(User.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it("should handle invalid user id", async () => {
      const invalidId = "invalid-id";

      (User.findById as jest.Mock).mockImplementation(() => {
        throw new Error("Cast to ObjectId failed");
      });

      await expect(userService.deleteUser(invalidId)).rejects.toThrow(
        "Cast to ObjectId failed"
      );

      expect(User.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it("should handle database deletion errors", async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error("Database deletion failed")
      );

      await expect(userService.deleteUser(mockUserId)).rejects.toThrow(
        "Database deletion failed"
      );
    });

    it("should verify user exists before deletion", async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

      await userService.deleteUser(mockUserId);

      expect(User.findById).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe("Authorization and Access Control", () => {
    it("should prevent regular user from updating another user", async () => {
      const updateRequest: UpdateUserRequest = {
        name: "Hacker Name",
      };

      await expect(
        userService.updateUser(
          mockOtherUserId,
          updateRequest,
          mockUserId,
          "user"
        )
      ).rejects.toThrow("Access denied");
    });

    it("should allow admin to update any user regardless of userId", async () => {
      const updateRequest: UpdateUserRequest = {
        name: "Admin Updated",
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const mockSelect = jest.fn().mockResolvedValue(mockUser);

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await userService.updateUser(
        mockUserId,
        updateRequest,
        mockAdminId,
        "admin"
      );

      expect(result.message).toBe("User updated successfully");
    });

    it("should check authorization before checking user existence", async () => {
      const updateRequest: UpdateUserRequest = {
        name: "Test",
      };

      await expect(
        userService.updateUser(
          mockOtherUserId,
          updateRequest,
          mockUserId,
          "user"
        )
      ).rejects.toThrow("Access denied");

      expect(User.findById).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty update request", async () => {
      const emptyUpdate: UpdateUserRequest = {};

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const mockSelect = jest.fn().mockResolvedValue(mockUser);

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await userService.updateUser(
        mockUserId,
        emptyUpdate,
        mockUserId,
        "user"
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        {},
        { new: true, runValidators: true }
      );
      expect(result.message).toBe("User updated successfully");
    });

    it("should handle special characters in name", async () => {
      const specialNameUpdate: UpdateUserRequest = {
        name: "O'Brien-Smith Jr.",
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const mockSelect = jest.fn().mockResolvedValue({
        ...mockUser,
        name: specialNameUpdate.name,
      });

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await userService.updateUser(
        mockUserId,
        specialNameUpdate,
        mockUserId,
        "user"
      );

      expect(result.user!.name).toBe(specialNameUpdate.name);
    });

    it("should handle very long names", async () => {
      const longNameUpdate: UpdateUserRequest = {
        name: "A".repeat(100),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const mockSelect = jest.fn().mockResolvedValue({
        ...mockUser,
        name: longNameUpdate.name,
      });

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await userService.updateUser(
        mockUserId,
        longNameUpdate,
        mockUserId,
        "user"
      );

      expect(result.user!.name).toBe(longNameUpdate.name);
    });

    it("should handle email case sensitivity", async () => {
      const upperCaseEmail: UpdateUserRequest = {
        email: "JOHN@EXAMPLE.COM",
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const mockSelect = jest.fn().mockResolvedValue({
        ...mockUser,
        email: upperCaseEmail.email,
      });

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await userService.updateUser(
        mockUserId,
        upperCaseEmail,
        mockUserId,
        "user"
      );

      expect(User.findOne).toHaveBeenCalledWith({
        email: upperCaseEmail.email,
      });
      expect(result.user!.email).toBe(upperCaseEmail.email);
    });

    it("should handle page 1 with zero users", async () => {
      const queryParams: UserQueryParams = { page: 1, limit: 10 };

      const mockSelect = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([]);

      (User.find as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await userService.getAllUsers(queryParams);

      expect(result.users).toEqual([]);
      expect(result.pagination.pages).toBe(0);
    });

    it("should handle very large page numbers", async () => {
      const queryParams: UserQueryParams = { page: 1000, limit: 10 };

      const mockSelect = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([]);

      (User.find as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        skip: mockSkip,
      });
      mockSkip.mockReturnValue({
        limit: mockLimit,
      });

      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      const result = await userService.getAllUsers(queryParams);

      expect(mockSkip).toHaveBeenCalledWith(9990);
      expect(result.users).toEqual([]);
    });
  });

  describe("Integration Scenarios", () => {
    it("should retrieve user after update", async () => {
      const updateRequest: UpdateUserRequest = {
        name: "Updated Name",
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const updatedUser = { ...mockUser, name: updateRequest.name };
      const mockSelect = jest.fn().mockResolvedValue(updatedUser);

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const updateResult = await userService.updateUser(
        mockUserId,
        updateRequest,
        mockUserId,
        "user"
      );

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser),
      });

      const getResult = await userService.getUserById(mockUserId);

      expect(updateResult.user!.name).toBe(updateRequest.name);
      expect(getResult.user.name).toBe(updateRequest.name);
    });
  });
});
