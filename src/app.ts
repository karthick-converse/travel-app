import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";

// Routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import packageRoutes from "./routes/packages";
import bookingRoutes from "./routes/bookings";

const app = express();

// Security middleware
app.use(helmet());
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:3000",
//   })
// );

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Travel Site API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/bookings", bookingRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", error);

    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
);

export default app;
