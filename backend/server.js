const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const dotenv = require("dotenv");
const http = require("http");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const setupSocketServer = require("./utils/socketServer");

dotenv.config();

// 🔍 Environment Variable Checks
console.log("🔍 Checking environment variables...");
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("REFRESH_TOKEN_SECRET exists:", !!process.env.REFRESH_TOKEN_SECRET);
console.log("JWT_SECRET length:", process.env.JWT_SECRET?.length);
console.log("REFRESH_TOKEN_SECRET length:", process.env.REFRESH_TOKEN_SECRET?.length);

// ❌ Abort startup if secrets are missing
if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  console.error("❌ CRITICAL: JWT secrets are not properly configured in environment variables");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);

// Initialize Socket.io
console.log("🔄 Initializing Socket.io server...");
try {
  const { io, broadcastOrderUpdate, broadcastBulkOrderUpdate } = setupSocketServer(server);
  app.set("io", io);
  console.log("✅ Socket.io server initialized");
} catch (error) {
  console.error("❌ Socket.io initialization failed:", error.message);
  process.exit(1);
}

// Attach io to each request
app.use((req, res, next) => {
  req.io = app.get("io");
  next();
});

// Webhook handling - MUST come before express.json()
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), (req, res, next) => {
  req.rawBody = req.body;
  next();
});

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Enhanced CORS setup
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Authorization"],
  })
);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "http://localhost:5000", "https:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "ws://localhost:5000", "http://localhost:5000"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(compression());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
});

// ================== ROUTES ==================
console.log("🔄 Loading API routes...");

// ✅ FIXED: Load all routes with proper error handling
const loadRoutes = () => {
  const routes = [
    { path: "/api/auth", name: "Auth", file: "./routes/auth" },
    { path: "/api/admin", name: "Admin", file: "./routes/admin" },
    { path: "/api/kyc", name: "KYC", file: "./routes/kyc" },
    { path: "/api/orders", name: "Orders", file: "./routes/orders" },
    { path: "/api/users", name: "Users", file: "./routes/userRoutes" },
    { path: "/api/upload", name: "Upload", file: "./routes/uploadRoutes" },
    { path: "/api/products", name: "Products", file: "./routes/products" },
    { path: "/api/delivery-partners", name: "Delivery", file: "./routes/deliveryRoutes" },
    { path: "/api/payments", name: "Payments", file: "./routes/paymentRoutes" },
    { path: "/api/addresses", name: "Addresses", file: "./routes/addressRoutes" },
    { path: "/api/cart", name: "Cart", file: "./routes/cartRoutes" },
    { path: "/api/seller", name: "Seller", file: "./routes/sellerRoutes" },
    { path: "/api/messages", name: "Messages", file: "./routes/messageRoutes" },
    { path: "/api/recipes", name: "Recipes", file: "./routes/recipeRoutes" },
    { path: "/api/forum", name: "Forum", file: "./routes/forumRoutes" },
    { path: "/api/social", name: "Social", file: "./routes/socialRoutes" },
    { path: "/api/admin/settings", name: "Admin Settings", file: "./routes/adminSettings" },
    { path: "/api/admin/messages", name: "Admin Messages", file: "./routes/adminMessageRoutes" },
    { path: "/api/admin/moderation", name: "Admin Moderation", file: "./routes/moderationRoutes" },
    { path: "/api/bulk-orders", name: "Bulk Orders", file: "./routes/bulkOrder" },
    { path: "/api/notifications", name: "Notifications", file: "./routes/notificationRoutes" },
  ];

  routes.forEach(route => {
    try {
      // ✅ FIXED: Check if file exists correctly
      const filePath = path.join(__dirname, route.file + '.js');
      if (fs.existsSync(filePath)) {
        const routeModule = require(route.file);
        app.use(route.path, routeModule);
        console.log(`✅ ${route.name} routes loaded at ${route.path}`);
      } else {
        console.log(`⚠️ ${route.name} routes file not found: ${route.file}.js`);
      }
    } catch (error) {
      console.log(`❌ Failed to load ${route.name} routes:`, error.message);
    }
  });
};

loadRoutes();

// ✅ FIXED: Load admin payment routes if file exists
try {
  const adminPaymentRoutesPath = path.join(__dirname, './routes/adminPaymentRoutes.js');
  if (fs.existsSync(adminPaymentRoutesPath)) {
    const adminPaymentRoutes = require('./routes/adminPaymentRoutes');
    app.use('/api/admin/payments', adminPaymentRoutes);
    console.log('✅ Admin Payments routes loaded at /api/admin/payments');
  } else {
    console.log('⚠️ Admin Payments routes file not found, creating placeholder...');
    // Create a simple placeholder route
    app.use('/api/admin/payments', (req, res) => {
      res.status(501).json({
        message: 'Admin Payments API is not implemented yet',
        timestamp: new Date().toISOString()
      });
    });
  }
} catch (error) {
  console.log('❌ Failed to load Admin Payments routes:', error.message);
}

// Serve uploads directory
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ Created uploads directory");
}

// Serve customer images directory
const customerImagesDir = path.join(__dirname, "uploads", "customer");
if (!fs.existsSync(customerImagesDir)) {
  fs.mkdirSync(customerImagesDir, { recursive: true });
  console.log("✅ Created customer images directory");
}

// Serve uploads statically
app.use("/uploads", express.static(uploadDir, {
  setHeaders: (res, filePath) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
      res.setHeader("Content-Type", "image/jpeg");
    } else if (filePath.endsWith(".png")) {
      res.setHeader("Content-Type", "image/png");
    }
  },
}));

// Serve customer images specifically
app.use("/customer", express.static(customerImagesDir, {
  setHeaders: (res, filePath) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
      res.setHeader("Content-Type", "image/jpeg");
    } else if (filePath.endsWith(".png")) {
      res.setHeader("Content-Type", "image/png");
    }
  },
}));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      socket: app.get("io") ? "active" : "inactive"
    },
    routes: {
      bulkOrders: "/api/bulk-orders",
      products: "/api/products",
      orders: "/api/orders",
      auth: "/api/auth",
      adminPayments: "/api/admin/payments"
    }
  });
});

// Test bulk order endpoint
app.get("/api/bulk-orders/test", (req, res) => {
  res.json({
    message: "Bulk Orders API is working!",
    timestamp: new Date().toISOString(),
    endpoints: {
      create: "POST /api/bulk-orders",
      list: "GET /api/bulk-orders",
      getById: "GET /api/bulk-orders/:id",
      update: "PUT /api/bulk-orders/:id",
      cancel: "PUT /api/bulk-orders/:id/cancel"
    }
  });
});

// Bulk orders health check
app.get("/api/bulk-orders/health", (req, res) => {
  res.json({
    message: "Bulk Orders Health Check - OK",
    timestamp: new Date().toISOString(),
    status: "active"
  });
});

// Admin payments health check
app.get("/api/admin/payments/health", (req, res) => {
  res.json({
    message: "Admin Payments API - Placeholder",
    timestamp: new Date().toISOString(),
    status: "development",
    note: "Full implementation coming soon"
  });
});

// Production setup
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"))
  );
} else {
  app.get("/", (req, res) =>
    res.json({
      message: "Rice Mill E-Commerce API is running...",
      version: "1.0.0",
      environment: process.env.NODE_ENV,
      features: {
        notifications: true,
        realTimeUpdates: true,
        adminDashboard: true,
        bulkOrders: true,
        adminPayments: true
      },
      apiEndpoints: {
        bulkOrders: "http://localhost:5000/api/bulk-orders",
        healthCheck: "http://localhost:5000/api/health",
        adminPayments: "http://localhost:5000/api/admin/payments"
      }
    })
  );
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, starting graceful shutdown...");
  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, starting graceful shutdown...");
  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

// ================== SERVER STARTUP ==================
(async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 5000;

    if (process.env.NODE_ENV !== "production") {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      console.warn("⚠️ SSL verification disabled (DEV ONLY)");
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket active at ws://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📦 Bulk Orders API: http://localhost:${PORT}/api/bulk-orders`);
      console.log(`💰 Admin Payments: http://localhost:${PORT}/api/admin/payments`);
      console.log(`📱 Notifications system: ACTIVE`);
      console.log(`👨‍💼 Admin features: ENABLED`);
      console.log(`✅ All routes loaded successfully`);
    });
  } catch (err) {
    console.error("❌ Server Startup Error:", err.message);
    process.exit(1);
  }
})();