import express from 'express';
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  bookingValidation
} from '../controllers/bookingController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - package
 *         - numberOfPeople
 *         - travelDate
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the booking
 *         user:
 *           type: string
 *           description: The user ID who made the booking
 *         package:
 *           type: string
 *           description: The package ID being booked
 *         numberOfPeople:
 *           type: number
 *           description: Number of people for the booking
 *         totalPrice:
 *           type: number
 *           description: Total price for the booking
 *         bookingDate:
 *           type: string
 *           format: date-time
 *           description: When the booking was made
 *         travelDate:
 *           type: string
 *           format: date-time
 *           description: When the travel will occur
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *           description: The booking status
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *         description: Filter by booking status
 *     responses:
 *       200:
 *         description: List of bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, getAllBookings);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Booking not found
 */
router.get('/:id', authenticate, getBookingById);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - package
 *               - numberOfPeople
 *               - travelDate
 *             properties:
 *               package:
 *                 type: string
 *                 description: Package ID
 *               numberOfPeople:
 *                 type: number
 *                 minimum: 1
 *               travelDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, bookingValidation, handleValidationErrors, createBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   put:
 *     summary: Update booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numberOfPeople:
 *                 type: number
 *                 minimum: 1
 *               travelDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled]
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Booking not found
 */
router.put('/:id', authenticate, updateBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Delete booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Booking not found
 */
router.delete('/:id', authenticate, deleteBooking);

export default router;