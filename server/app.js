import cors from "cors";
import express from "express";
import resumeRoutes from "./routes/resumeRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", resumeRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

