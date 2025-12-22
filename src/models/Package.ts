import mongoose, { Schema, Document } from 'mongoose';

export interface IPackage extends Document {
  title: string;
  description: string;
  destination: string;
  price: number;
  duration: number;
  maxPeople: number;
  images: string[];
  features: string[];
  isActive: boolean;
}

const packageSchema = new Schema<IPackage>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 day']
  },
  maxPeople: {
    type: Number,
    required: [true, 'Max people is required'],
    min: [1, 'Max people must be at least 1']
  },
  images: [{
    type: String,
    trim: true
  }],
  features: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IPackage>('Package', packageSchema);