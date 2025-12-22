import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  package: mongoose.Types.ObjectId;
  numberOfPeople: number;
  totalPrice: number;
  bookingDate: Date;
  travelDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
}

const bookingSchema = new Schema<IBooking>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  package: {
    type: Schema.Types.ObjectId,
    ref: 'Package',
    required: [true, 'Package is required']
  },
  numberOfPeople: {
    type: Number,
    required: [true, 'Number of people is required'],
    min: [1, 'Number of people must be at least 1']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  travelDate: {
    type: Date,
    required: [true, 'Travel date is required'],
    validate: {
      validator: function(value: Date) {
        return value > new Date();
      },
      message: 'Travel date must be in the future'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export default mongoose.model<IBooking>('Booking', bookingSchema);