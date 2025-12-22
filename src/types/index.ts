import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Package {
  _id: string;
  title: string;
  description: string;
  destination: string;
  price: number;
  duration: number;
  maxPeople: number;
  images: string[];
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  _id: string;
  user: string;
  package: string;
  numberOfPeople: number;
  totalPrice: number;
  bookingDate: Date;
  travelDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}