# Travel Site Backend

A comprehensive Node.js backend API for a travel booking site built with Express, MongoDB, and TypeScript.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **User Management**: Complete CRUD operations for user profiles
- **Package Management**: Travel package creation, updates, and management
- **Booking System**: Full booking lifecycle management
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Security**: Helmet, CORS, rate limiting, and input validation
- **TypeScript**: Full type safety and modern JavaScript features

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Language**: TypeScript
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, bcryptjs

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd travel-site-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/travel-site
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

5. Build the project:
```bash
npm run build
```

6. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Packages
- `GET /api/packages` - Get all packages
- `GET /api/packages/:id` - Get package by ID
- `POST /api/packages` - Create package (admin only)
- `PUT /api/packages/:id` - Update package (admin only)
- `DELETE /api/packages/:id` - Delete package (admin only)

### Bookings
- `GET /api/bookings` - Get all bookings (user sees own, admin sees all)
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

## API Documentation

Once the server is running, visit `http://localhost:3000/api-docs` to access the interactive Swagger documentation.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start production server
- `npm test` - Run tests

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # Express routes
├── types/           # TypeScript type definitions
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## User Roles

- **user**: Can view packages, create/manage own bookings, update own profile
- **admin**: Full access to all resources including user management and package management

## Error Handling

The API returns consistent error responses:

```json
{
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.