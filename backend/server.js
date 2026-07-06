const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");

const connectDB = require("./config/db");
const setupSocketServer = require("./utils/socketServer");
const { connectRedis } = require("./utils/redis");
const logger = require("./utils/logger");

// 🔍 Environment Variable Checks
logger.info("🔍 Validating core environment variables...");

const requiredEnvVars = [
  'JWT_SECRET', 
  'REFRESH_TOKEN_SECRET', 
  'MONGO_URI', 
  'FIREBASE_PROJECT_ID', 
  'CLOUDINARY_CLOUD_NAME'
];

const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
  logger.error(`❌ CRITICAL: Missing required environment variables: ${missingVars.join(', ')}`);
  logger.error('👉 Please refer to .env.example to configure these properly.');
  process.exit(1);
}
logger.info("✅ All core environment variables are configured.");

const server = http.createServer(app);

// Graceful shutdown
// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, starting graceful shutdown...");
  server.close(async () => {
    console.log("HTTP server closed");
    await mongoose.connection.close(false);
    console.log("MongoDB connection closed");
    process.exit(0);
  });
  // Force exit if graceful close hangs (e.g. a keep-alive connection never ends)
  setTimeout(() => {
    console.error("⚠️ Graceful shutdown timed out, forcing exit");
    process.exit(0);
  }, 10_000).unref();
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, starting graceful shutdown...");
  server.close(async () => {
    console.log("HTTP server closed");
    await mongoose.connection.close(false);
    console.log("MongoDB connection closed");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("⚠️ Graceful shutdown timed out, forcing exit");
    process.exit(0);
  }, 10_000).unref();
});

// 🛡️ Global Error Handlers - EXIT so PM2/Docker can restart cleanly
// NOTE: We use console.error (sync to stderr) intentionally here.
// Winston file transports are async — process.exit() can kill the process
// before Winston flushes to disk, losing the crash log.
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
  // Force exit if server.close() hangs on an open connection
  setTimeout(() => {
    console.error("⚠️ server.close() timed out after 10s, forcing exit");
    process.exit(1);
  }, 10_000).unref();
});

// ================== SERVER STARTUP ==================
(async () => {
  try {
    await connectDB();
    logger.info("✅ MongoDB Connected");

    // Initialize Redis
    await connectRedis();

    // Initialize Background Workers
    require('./jobs/workers');

    const PORT = process.env.PORT || 5000;

    if (process.env.NODE_ENV !== "production") {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      console.warn("⚠️ SSL verification disabled (DEV ONLY)");
    }

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.error(`   Run this command to free it: netstat -ano | findstr :${PORT}`);
        console.error(`   Then kill the PID shown with:  taskkill /F /PID <PID>\n`);
        process.exit(1);
      } else {
        throw err;
      }
    });

    // Initialize Socket.io (Await Redis Adapter Connection)
    console.log("🔄 Initializing Socket.io server...");
    const {
      io,
      broadcastOrderUpdate,
      broadcastBulkOrderUpdate,
      broadcastDeliveryPickup,
      broadcastNavigationStarted,
      broadcastDeliveryCompleted,
      broadcastEmergencyAlert,
      broadcastReplacementRequest,
    } = await setupSocketServer(server);

    app.set("io", io);
    app.set("broadcastOrderUpdate", broadcastOrderUpdate);
    app.set("broadcastDeliveryPickup", broadcastDeliveryPickup);
    app.set("broadcastNavigationStarted", broadcastNavigationStarted);
    app.set("broadcastDeliveryCompleted", broadcastDeliveryCompleted);
    app.set("broadcastEmergencyAlert", broadcastEmergencyAlert);
    app.set("broadcastReplacementRequest", broadcastReplacementRequest);
    console.log("✅ Socket.io server initialized and adapter attached");

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`🔌 WebSocket active at ws://0.0.0.0:${PORT}`);
      console.log(`🏥 Health check: http://0.0.0.0:${PORT}/api/health`);
      console.log(`📦 Bulk Orders API: http://0.0.0.0:${PORT}/api/bulk-orders`);
      console.log(`💰 Admin Payments: http://0.0.0.0:${PORT}/api/admin/payments`);
      console.log(`📱 Notifications system: ACTIVE`);
      console.log(`👨‍💼 Admin features: ENABLED`);
      console.log(`✅ All routes loaded successfully`);
    });
  } catch (err) {
    console.error("❌ Server Startup Error:", err.message);
    process.exit(1);
  }
})();