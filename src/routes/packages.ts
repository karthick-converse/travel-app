import express from 'express';
import {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  packageValidation
} from '../controllers/packageController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Package:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - destination
 *         - price
 *         - duration
 *         - maxPeople
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the package
 *         title:
 *           type: string
 *           description: The package title
 *         description:
 *           type: string
 *           description: The package description
 *         destination:
 *           type: string
 *           description: The travel destination
 *         price:
 *           type: number
 *           description: The package price
 *         duration:
 *           type: number
 *           description: Duration in days
 *         maxPeople:
 *           type: number
 *           description: Maximum number of people
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of package features
 *         isActive:
 *           type: boolean
 *           description: Whether the package is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/packages:
 *   get:
 *     summary: Get all packages
 *     tags: [Packages]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Filter by destination
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of packages retrieved successfully
 */
router.get('/', getAllPackages);

/**
 * @swagger
 * /api/packages/{id}:
 *   get:
 *     summary: Get package by ID
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *     responses:
 *       200:
 *         description: Package retrieved successfully
 *       404:
 *         description: Package not found
 */
router.get('/:id', getPackageById);

/**
 * @swagger
 * /api/packages:
 *   post:
 *     summary: Create a new package (Admin only)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Package'
 *     responses:
 *       201:
 *         description: Package created successfully
 *       403:
 *         description: Access denied
 */
router.post('/', authenticate, authorize('admin'), packageValidation, handleValidationErrors, createPackage);

/**
 * @swagger
 * /api/packages/{id}:
 *   put:
 *     summary: Update package (Admin only)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Package'
 *     responses:
 *       200:
 *         description: Package updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Package not found
 */
router.put('/:id', authenticate, authorize('admin'), packageValidation, handleValidationErrors, updatePackage);

/**
 * @swagger
 * /api/packages/{id}:
 *   delete:
 *     summary: Delete package (Admin only)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *     responses:
 *       200:
 *         description: Package deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Package not found
 */
router.delete('/:id', authenticate, authorize('admin'), deletePackage);

export default router;