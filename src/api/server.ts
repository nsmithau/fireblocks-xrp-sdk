import express from "express";
import { FbksXrpApiService } from "./ApiService";
import cors from "cors";
import { BasePath } from "@fireblocks/ts-sdk";
import dotenv from "dotenv";
import { configureDexRoutes, configureTokenRoutes } from "./routes";
import { Logger } from "../utils/logger";
import { ApiServiceConfig } from "../pool/types";
import { errorHandler } from "./middleware";
import { ValidationError } from "../errors/errors";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";

// Load environment variables
dotenv.config();

// Initialize logger for the server
const logger = new Logger("server");

// Create Express app
const app = express();
app.use(express.json());
app.use(cors());
const fbksXrpApiServiceConfigs: ApiServiceConfig = {
  apiKey: process.env.FIREBLOCKS_API_KEY || "",
  apiSecret: process.env.FIREBLOCKS_API_SECRET || "",
  assetId: process.env.FIREBLOCKS_ASSET_ID || "XRP_TEST",
  basePath: (process.env.FIREBLOCKS_BASE_PATH as BasePath) || BasePath.US,
  poolConfig: {
    maxPoolSize: parseInt(process.env.POOL_MAX_SIZE || "100"),
    idleTimeoutMs: parseInt(process.env.POOL_IDLE_TIMEOUT_MS || "1800000"),
    cleanupIntervalMs: parseInt(
      process.env.POOL_CLEANUP_INTERVAL_MS || "300000"
    ),
  },
};

// Validate required environment variables
if (fbksXrpApiServiceConfigs.apiKey === "") {
  logger.error("FIREBLOCKS_API_KEY is not set in environment variables");
  throw new ValidationError(
    "InvalidEnvParams",
    "FIREBLOCKS_API_KEY is required"
  );
}
if (fbksXrpApiServiceConfigs.apiSecret === "") {
  logger.error("FIREBLOCKS_API_SECRET is not set in environment variables");
  throw new ValidationError(
    "InvalidEnvParams",
    "FIREBLOCKS_API_SECRET is required"
  );
}

// Read the generated swagger.json
const swaggerFile = path.join("./", "swagger.json");
if (fs.existsSync(swaggerFile)) {
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerFile, "utf8"));

  // Setup Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  logger.info("Swagger documentation enabled");
} else {
  logger.warn(
    'swagger.json not found. Run "npm run generate-swagger" to generate it.'
  );
}
// Serve the generated TypeDoc HTML docs at /type-docs
app.use("/type-docs", express.static(path.join(process.cwd(), "docs")));

// Initialize API service
const fbksApiService = new FbksXrpApiService(fbksXrpApiServiceConfigs);

// Apply routes
app.use(configureTokenRoutes(fbksApiService));
app.use(configureDexRoutes(fbksApiService));
app.use((req: any, res: any) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Register global error handler
app.use(errorHandler);

// Start the server
const PORT = parseInt(process.env.PORT) || 3000;

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info(`XRP SDK API server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");

  // Close server to stop accepting new connections
  server.close(async () => {
    logger.info("HTTP server closed");

    // Shut down API service and SDK instances
    await fbksApiService.shutdown();
    logger.info("API service shut down");

    process.exit(0);
  });
});
