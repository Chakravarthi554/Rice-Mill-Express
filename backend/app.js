const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const statusMonitor = require("express-status-monitor");
const morgan = require("morgan");
const fs = require("fs");
const logger = require("./utils/logger");

const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

if (process.env.SENTRY_DSN) {
  const { version } = require('./package.json');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: `ricemill-backend@${version}`,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

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

app.set("trust proxy", 1);

// Socket.io initialization has been moved to the async startup block (see bottom of file)

// Attach io and broadcast functions to each request
app.use((req, res, next) => {
  req.io = app.get("io");
  req.broadcastOrderUpdate = app.get("broadcastOrderUpdate");
  req.broadcastDeliveryPickup = app.get("broadcastDeliveryPickup");
  req.broadcastNavigationStarted = app.get("broadcastNavigationStarted");
  req.broadcastDeliveryCompleted = app.get("broadcastDeliveryCompleted");
  req.broadcastEmergencyAlert = app.get("broadcastEmergencyAlert");
  req.broadcastReplacementRequest = app.get("broadcastReplacementRequest");
  next();
});

// Webhook handling - MUST come before express.json()
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), (req, res, next) => {
  req.rawBody = req.body;
  next();
});

// Status monitor (must be before body parsers)
if (process.env.STATUS_USER && process.env.STATUS_PASS) {
  const basicAuth = require('express-basic-auth');
  app.use('/status', basicAuth({
    users: { [process.env.STATUS_USER]: process.env.STATUS_PASS },
    challenge: true,
  }));
  app.use(statusMonitor({
    socketPath: '/status-socket.io' // Prevent hijacking the global /socket.io endpoint
  }));
} else {
  console.warn("⚠️ WARNING: STATUS_USER or STATUS_PASS not set. The /status monitoring route has been disabled for security.");
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF Protection
// Only apply to routes that are not webhooks or file uploads if needed, 
// but for now we apply globally and frontend will fetch the token.
const csrfProtection = csrf({ cookie: true });
const conditionalCsrf = (req, res, next) => {
  const excludedPaths = [
    '/api/v1/auth/firebase-login', 
    '/api/v1/auth/login', 
    '/api/v1/auth/register', 
    '/api/v1/auth/refresh-token',
    '/api/v1/orders',
    '/api/v1/payments'
  ];
  
  const shouldExclude = excludedPaths.some(path => req.originalUrl.includes(path));
  console.log(`🛡️ CSRF Check for ${req.method} ${req.originalUrl} | Bypass? ${shouldExclude}`);
  
  if (shouldExclude) {
    return next();
  }
  return csrfProtection(req, res, next);
};

app.use('/api/v1/auth', conditionalCsrf);
app.use('/api/v1/orders', conditionalCsrf);
app.use('/api/v1/payments', conditionalCsrf);

app.get('/api/v1/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Data sanitization against NoSQL query injection
// NOTE: express-mongo-sanitize's default middleware reassigns req.query,
// which is a read-only getter in Express 5. We sanitize each target manually.
app.use((req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body);
  }
  if (req.params) {
    req.params = mongoSanitize.sanitize(req.params);
  }
  // req.query is a read-only getter in Express 5 — sanitize values in-place
  if (req.query) {
    const sanitizedQuery = mongoSanitize.sanitize(req.query);
    for (const key of Object.keys(req.query)) {
      if (!(key in sanitizedQuery)) {
        delete req.query[key];
      }
    }
    for (const [key, value] of Object.entries(sanitizedQuery)) {
      req.query[key] = value;
    }
  }
  next();
});

// Enhanced CORS setup
const getLocalIPs = () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
};

const PORT = process.env.PORT || 5000;
const localIPs = getLocalIPs();
console.log("\n" + "=".repeat(50));
console.log("📡 SERVER DETECTED THESE NETWORK ADDRESSES:");
localIPs.forEach(ip => {
    console.log(`   👉 http://${ip}:${PORT}`);
});
console.log("\n📱 TO FIX YOUR MOBILE APP:");
console.log("1. Open: mobile/src/config/env.js");
console.log("2. Copy/Paste this line:");
if (localIPs.length > 0) {
    console.log(`   export const API_URL = 'http://${localIPs[0]}:${PORT}';`);
} else {
    console.log("   (No external IPs found! Connect to Hotspot or WiFi)");
}
console.log("=".repeat(50) + "\n");

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://rice-mill-frontend-chakravarthi.s3-website.eu-north-1.amazonaws.com",
  "http://13.62.55.108:5001",
  "https://c111b7c7.rice-mill-frontend.pages.dev",
  process.env.FRONTEND_URL,
  ...localIPs.map(ip => `http://${ip}:${PORT}`),
  ...localIPs.map(ip => `http://${ip}:8081`),
  ...localIPs.map(ip => `exp://${ip}:${PORT}`),
  ...localIPs.map(ip => `exp://${ip}:8081`),
];

const allowedOriginRegex = [
  /^exp:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^exp:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^exp:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^https:\/\/.*\.loca\.lt$/,
  /^https:\/\/.*\.ngrok-free\.app$/,
  /^https:\/\/.*\.lhr\.life$/,
  /^https:\/\/.*\.localhost\.run$/,
  /^https:\/\/.*\.pages\.dev$/,
];

// 🌐 Aggressive Network Logger (Must be at TOP)
app.use((req, res, next) => {
    console.log(`🔌 [BRIDGE HIT] ${new Date().toLocaleTimeString()} - ${req.method} ${req.url} (Origin: ${req.get('origin') || 'None'})`);
    next();
});

// ✅ Request Timeout Middleware to prevent hanging connections
app.use((req, res, next) => {
  const isUpload = req.originalUrl.includes('/api/upload') || req.originalUrl.includes('/uploads');
  const timeoutMs = isUpload ? 300000 : 30000;

  req.setTimeout(timeoutMs, () => {
    console.warn(`⚠️ Request socket timeout: ${req.method} ${req.originalUrl}`);
  });

  res.setTimeout(timeoutMs, () => {
    console.error(`⚠️ Request response timeout: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
      res.status(503).json({ 
        message: "Request Timeout: The server took too long to respond.",
        path: req.originalUrl
      });
    }
  });

  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (allowedOriginRegex.some(pattern => pattern.test(origin))) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Bypass-Tunnel-Reminder", "bypass-tunnel-reminder", "ngrok-skip-browser-warning"],
    exposedHeaders: ["Authorization"],
  })
);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", `http://localhost:${PORT}`, "https:", "blob:", "*.loca.lt", "*.ngrok-free.app", "*.lhr.life", "*.localhost.run"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", `ws://localhost:${PORT}`, `http://localhost:${PORT}`, "https://*.loca.lt", "wss://*.loca.lt", "https://*.ngrok-free.app", "wss://*.ngrok-free.app", "https://*.lhr.life", "wss://*.lhr.life", "https://*.localhost.run", "wss://*.localhost.run"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(compression());

// Structured request logging via Morgan → Winston
const morganStream = {
  write: (message) => logger.info(message.trim()),
};
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: morganStream }));

// Standardized Response Envelope
const responseEnvelope = require('./middleware/responseEnvelope');
app.use(responseEnvelope);

// Pagination Guardrails (caps limit at 50, defaults page=1, limit=20)
const { paginationGuardrails } = require('./middleware/pagination');
app.use(paginationGuardrails);

// ================== SWAGGER ==================
require('./swagger')(app);

// ================== ROUTES ==================
console.log("🔄 Loading API routes...");

// ✅ FIXED: Load all routes with proper error handling
const loadRoutes = () => {
  const routes = [
    { path: "/api/v1/auth", name: "Auth", file: "./routes/auth" },
    { path: "/api/v1/admin", name: "Admin", file: "./routes/admin" },
    { path: "/api/v1/kyc", name: "KYC", file: "./routes/kyc" },
    { path: "/api/v1/orders", name: "Orders", file: "./routes/orders" },
    { path: "/api/v1/users", name: "Users", file: "./routes/userRoutes" },
    { path: "/api/v1/upload", name: "Upload", file: "./routes/uploadRoutes" },
    { path: "/api/v1/products", name: "Products", file: "./routes/products" },
    { path: "/api/v1/delivery-partners", name: "Delivery", file: "./routes/deliveryRoutes" },
    { path: "/api/v1/payments", name: "Payments", file: "./routes/paymentRoutes" },
    { path: "/api/v1/addresses", name: "Addresses", file: "./routes/addressRoutes" },
    { path: "/api/v1/cart", name: "Cart", file: "./routes/cartRoutes" },
    { path: "/api/v1/seller", name: "Seller", file: "./routes/sellerRoutes" },
    { path: "/api/v1/messages", name: "Messages", file: "./routes/messageRoutes" },
    { path: "/api/v1/chat", name: "Chat", file: "./routes/chatRoutes" },
    { path: "/api/v1/admin/chat", name: "Admin Chat", file: "./routes/adminChatRoutes" },
    { path: "/api/v1/recipes", name: "Recipes", file: "./routes/recipeRoutes" },
    { path: "/api/v1/legal", name: "Legal", file: "./routes/legalRoutes" },
    { path: "/api/v1/rewards", name: "Rewards", file: "./routes/rewardsRoutes" },
    { path: "/api/v1/forum", name: "Forum", file: "./routes/forumRoutes" },
    { path: "/api/v1/social", name: "Social", file: "./routes/socialRoutes" },
    { path: "/api/v1/admin/settings", name: "Admin Settings", file: "./routes/adminSettings" },
    { path: "/api/v1/settings", name: "Public Settings", file: "./routes/publicSettings" },
    { path: "/api/v1/admin/messages", name: "Admin Messages", file: "./routes/adminMessageRoutes" },
    { path: "/api/v1/admin/moderation", name: "Admin Moderation", file: "./routes/moderationRoutes" },
    { path: "/api/v1/bulk-orders", name: "Bulk Orders", file: "./routes/bulkOrder" },
    { path: "/api/v1/notifications", name: "Notifications", file: "./routes/notificationRoutes" },
    { path: "/api/v1/delivery", name: "Delivery Confirmation", file: "./routes/deliveryConfirmationRoutes" },
    { path: "/api/v1/replacements", name: "Replacements", file: "./routes/replacementRoutes" },
    { path: "/api/v1/dp", name: "Delivery Partner System", file: "./routes/deliveryPartnerNewRoutes" },
    { path: "/api/v1/campaigns", name: "Campaigns", file: "./routes/campaignRoutes" },
    { path: "/api/v1/support", name: "Support", file: "./routes/supportRoutes" },
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
      console.log(`❌ Failed to load ${route.name} routes:`, error.stack);
    }
  });
};

loadRoutes();

// ✅ FIXED: Load admin payment routes if file exists
try {
  const adminPaymentRoutesPath = path.join(__dirname, './routes/adminPaymentRoutes.js');
  if (fs.existsSync(adminPaymentRoutesPath)) {
    const adminPaymentRoutes = require('./routes/adminPaymentRoutes');
    app.use('/api/v1/admin/payments', adminPaymentRoutes);
    console.log('✅ Admin Payments routes loaded at /api/v1/admin/payments');
  } else {
    console.log('⚠️ Admin Payments routes file not found, creating placeholder...');
    // Create a simple placeholder route
    app.use('/api/v1/admin/payments', (req, res) => {
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

// Serve uploads statically (ACAO handled by cors() middleware, no need to override)
app.use("/uploads", express.static(uploadDir, {
  setHeaders: (res, filePath) => {
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
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
      res.setHeader("Content-Type", "image/jpeg");
    } else if (filePath.endsWith(".png")) {
      res.setHeader("Content-Type", "image/png");
    }
  },
}));

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
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
      bulkOrders: "/api/v1/bulk-orders",
      products: "/api/v1/products",
      orders: "/api/v1/orders",
      auth: "/api/v1/auth",
      adminPayments: "/api/v1/admin/payments"
    }
  });
});

// Test bulk order endpoint
app.get("/api/v1/bulk-orders/test", (req, res) => {
  res.json({
    message: "Bulk Orders API is working!",
    timestamp: new Date().toISOString(),
    endpoints: {
      create: "POST /api/v1/bulk-orders",
      list: "GET /api/v1/bulk-orders",
      getById: "GET /api/v1/bulk-orders/:id",
      update: "PUT /api/v1/bulk-orders/:id",
      cancel: "PUT /api/v1/bulk-orders/:id/cancel"
    }
  });
});

// Bulk orders health check
app.get("/api/v1/bulk-orders/health", (req, res) => {
  res.json({
    message: "Bulk Orders Health Check - OK",
    timestamp: new Date().toISOString(),
    status: "active"
  });
});

// Admin payments health check
app.get("/api/v1/admin/payments/health", (req, res) => {
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
  app.get(/.*/, (req, res) =>
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
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}
app.use(notFound);
app.use(errorHandler);

module.exports = app;