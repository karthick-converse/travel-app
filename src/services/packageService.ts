import Package from '../models/Package';
import { CreatePackageRequest, UpdatePackageRequest, PackageQueryParams } from '../dto/package.dto';

export class PackageService {
  async getAllPackages(queryParams: PackageQueryParams) {
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    if (queryParams.destination) {
      filter.destination = { $regex: queryParams.destination, $options: 'i' };
    }
    if (queryParams.isActive !== undefined) {
      filter.isActive = queryParams.isActive;
    }

    const packages = await Package.find(filter).skip(skip).limit(limit);
    const total = await Package.countDocuments(filter);

    return {
      packages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getPackageById(packageId: string) {
    const travelPackage = await Package.findById(packageId);
    
    if (!travelPackage) {
      throw new Error('Package not found');
    }

    return { package: travelPackage };
  }

  async createPackage(data: CreatePackageRequest) {
    const newPackage = new Package(data);
    await newPackage.save();

    return {
      message: 'Package created successfully',
      package: newPackage
    };
  }

  async updatePackage(packageId: string, data: UpdatePackageRequest) {
    const updatedPackage = await Package.findByIdAndUpdate(
      packageId,
      data,
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      throw new Error('Package not found');
    }

    return {
      message: 'Package updated successfully',
      package: updatedPackage
    };
  }

  async deletePackage(packageId: string) {
    const deletedPackage = await Package.findByIdAndDelete(packageId);
    
    if (!deletedPackage) {
      throw new Error('Package not found');
    }

    return { message: 'Package deleted successfully' };
  }
}