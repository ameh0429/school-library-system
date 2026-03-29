import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import authorRoutes from "./routes/authorRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import attendantRoutes from "./routes/attendantRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// Connect to MongoDB
connectDB();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ success: true, message: "Library System API is running" });
});

// Routes
app.use("/api/v1/authors", authorRoutes);
app.use("/api/v1/books", bookRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/attendants", attendantRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Library System API v1 ready`);
});