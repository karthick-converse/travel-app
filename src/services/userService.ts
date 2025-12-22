import User from '../models/User';
import { UpdateUserRequest, UserQueryParams } from '../dto/user.dto';

export class UserService {
  async getAllUsers(queryParams: UserQueryParams) {
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const skip = (page - 1) * limit;

    const users = await User.find().select('-password').skip(skip).limit(limit);
    const total = await User.countDocuments();

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(userId: string) {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    return { user };
  }

  async updateUser(targetUserId: string, data: UpdateUserRequest, currentUserId: string, userRole: string) {
    const { name, email } = data;

    // Users can only update their own profile unless they're admin
    if (userRole !== 'admin' && currentUserId !== targetUserId) {
      throw new Error('Access denied');
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      throw new Error('User not found');
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('Email already in use');
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { ...(name && { name }), ...(email && { email }) },
      { new: true, runValidators: true }
    ).select('-password');

    return { 
      message: 'User updated successfully', 
      user: updatedUser 
    };
  }

  async deleteUser(userId: string) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    await User.findByIdAndDelete(userId);
    return { message: 'User deleted successfully' };
  }
}