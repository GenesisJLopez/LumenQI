import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
// Fix for Vite createViteServer missing import
import { createServer as createViteServer } from "vite";
(global as any).createViteServer = createViteServer;
import { setupVite, serveStatic, log } from "./vite";

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
  try {
    log('Starting server initialization...');
    
    const server = await registerRoutes(app);
    log('Routes registered successfully');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error: ${status} - ${message}`);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      log('Setting up Vite development server...');
      await setupVite(app, server);
      log('Vite setup completed');
    } else {
      log('Setting up static file serving...');
      serveStatic(app);
    }

    // Cloud Run uses PORT environment variable, defaulting to 8080 if not specified
    // Use 0.0.0.0 for accessibility and avoid host conflicts
    const port = parseInt(process.env.PORT || '8080', 10);
    
    server.listen(port, "0.0.0.0", () => {
      log(`Server running successfully on port ${port}`);
    });

    // Handle server errors
    server.on('error', (err: any) => {
      log(`Server error: ${err.message}`);
      if (err.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use`);
      }
      process.exit(1);
    });

  } catch (error) {
    log(`Fatal error during server initialization: ${error}`);
    console.error('Full error:', error);
    process.exit(1);
  }
})();
