import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import websocketService from "./services/websocketService.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(helmet());
// Only apply rate limiting in production
if (process.env.NODE_ENV === "production") {
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
}

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Routes
app.use("/api", routes);

// Health check
app.get("/api/health", (req, res) =>
  res.json({ ok: true, message: "Server is running" })
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    // Initialize WebSocket server
    websocketService.initialize(httpServer);

    httpServer.listen(process.env.PORT || 5000, () => {
      console.log(`API running on port ${process.env.PORT || 5000}`);
      console.log(`WebSocket server ready for connections`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
