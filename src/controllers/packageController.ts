import { Request, Response } from 'express';
import { body } from 'express-validator';
import Package from '../models/Package';

export const packageValidation = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('destination').trim().notEmpty().withMessage('Destination is required'),
  body('price').isNumeric().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
  body('maxPeople').isInt({ min: 1 }).withMessage('Max people must be at least 1'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('features').optional().isArray().withMessage('Features must be an array')
];

export const getAllPackages = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    if (req.query.destination) {
      filter.destination = { $regex: req.query.destination, $options: 'i' };
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const packages = await Package.find(filter).skip(skip).limit(limit);
    const total = await Package.countDocuments(filter);

    res.json({
      packages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getPackageById = async (req: Request, res: Response) => {
  try {
    const travelPackage = await Package.findById(req.params.id);
    
    if (!travelPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json({ package: travelPackage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const createPackage = async (req: Request, res: Response) => {
  try {
    const packageData = req.body;
    const newPackage = new Package(packageData);
    await newPackage.save();

    res.status(201).json({
      message: 'Package created successfully',
      package: newPackage
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const updatePackage = async (req: Request, res: Response) => {
  try {
    const packageData = req.body;
    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      packageData,
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json({
      message: 'Package updated successfully',
      package: updatedPackage
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const deletePackage = async (req: Request, res: Response) => {
  try {
    const deletedPackage = await Package.findByIdAndDelete(req.params.id);
    
    if (!deletedPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};