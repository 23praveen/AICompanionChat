import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.sqlite";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Manually set environment variables for this session
process.env.NVIDIA_API_KEY = "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";
process.env.GOOGLE_API_KEY = "AIzaSyBBocaqzNh8F4a4u2zqihJf0ygUI-Kr3Vs";

// Log API keys (masked for security) to verify they're loaded
console.log("NVIDIA API Key loaded:", process.env.NVIDIA_API_KEY ? "✓" : "✗");
console.log("Google API Key loaded:", process.env.GOOGLE_API_KEY ? "✓" : "✗");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error("Server error:", err);
    res.status(status).json({ message });
    // Don't throw the error after sending response
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start the server
  const PORT = process.env.PORT || 3000; // Changed from 5000 to 3000 to avoid ENOTSUP error
  server.listen(Number(PORT), "127.0.0.1", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();