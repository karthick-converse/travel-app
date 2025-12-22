import { Request, Response } from 'express';
import { PackageService } from '../services/packageService';
import { createPackageDto, updatePackageDto } from '../dto/package.dto';

const packageService = new PackageService();

export const packageValidation = createPackageDto;
export const updatePackageValidation = updatePackageDto;

export const getAllPackages = async (req: Request, res: Response) => {
  try {
    const queryParams = {
      page: parseInt(req.query.page as string),
      limit: parseInt(req.query.limit as string),
      destination: req.query.destination as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
    };
    
    const result = await packageService.getAllPackages(queryParams);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getPackageById = async (req: Request, res: Response) => {
  try {
    const result = await packageService.getPackageById(req.params.id);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    const status = message === 'Package not found' ? 404 : 500;
    res.status(status).json({ message, error: message });
  }
};

export const createPackage = async (req: Request, res: Response) => {
  try {
    const result = await packageService.createPackage(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const updatePackage = async (req: Request, res: Response) => {
  try {
    const result = await packageService.updatePackage(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    const status = message === 'Package not found' ? 404 : 500;
    res.status(status).json({ message, error: message });
  }
};

export const deletePackage = async (req: Request, res: Response) => {
  try {
    const result = await packageService.deletePackage(req.params.id);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    const status = message === 'Package not found' ? 404 : 500;
    res.status(status).json({ message, error: message });
  }
};