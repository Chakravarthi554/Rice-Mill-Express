# 🌾 Rice Mill Express

> **Full-Stack E-Commerce Platform for Rice Products**
> Co-Founders: Chakravarthi & Prasanna

[![CI](https://github.com/Chakravarthi554/Rice-Mill-Express/actions/workflows/test.yml/badge.svg)](https://github.com/Chakravarthi554/Rice-Mill-Express/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Mobile App](#mobile-app)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🏗 Overview

Rice Mill Express is an enterprise-grade e-commerce platform connecting rice mills, sellers, delivery partners, and customers. The platform features:

- **Multi-role system** — Customer, Seller, Admin, Delivery Partner
- **Real-time order tracking** via WebSocket (Socket.io)
- **Payment integration** with Razorpay + wallet system
- **Delivery partner management** with KYC, incentives, and route optimization
- **Community features** — Forum, recipes, social interactions, rewards & loyalty
- **Bulk ordering** for B2B clients
- **PWA support** for the web frontend
- **Offline-first mobile** with redux-persist + AsyncStorage

---

## 🏛 Architecture

```
┌────────────────────────────────────────────────┐
│                   Clients                       │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ React    │  │ React     │  │ Swagger      │ │
│  │ Frontend │  │ Native    │  │ API Docs     │ │
│  │ (PWA)    │  │ Mobile    │  │ /api-docs    │ │
│  └────┬─────┘  └─────┬─────┘  └──────┬───────┘ │
└───────┼───────────────┼───────────────┼─────────┘
        │               │               │
        ▼               ▼               ▼
┌────────────────────────────────────────────────┐
│              Express.js API (v1)                │
│  ┌─────────┐ ┌──────┐ ┌───────┐ ┌───────────┐ │
│  │ Auth    │ │ CORS │ │ Rate  │ │ CSRF      │ │
│  │ (JWT +  │ │      │ │ Limit │ │ Protection│ │
│  │ Firebase│ │      │ │       │ │           │ │
│  └─────────┘ └──────┘ └───────┘ └───────────┘ │
│  ┌─────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │Winston  │ │ Sentry       │ │ Pagination  │ │
│  │ Logger  │ │ Error Track  │ │ Guardrails  │ │
│  └─────────┘ └──────────────┘ └─────────────┘ │
└────────┬───────────────┬───────────────┬───────┘
         │               │               │
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌─────────────┐
│  MongoDB     │ │  Redis       │ │  Firebase   │
│  (Atlas)     │ │  (Cache +    │ │  (Auth +    │
│              │ │   Socket.io) │ │   Firestore)│
└──────────────┘ └──────────────┘ └─────────────┘
```

---

## 🛠 Tech Stack

| Layer       | Technology                                           |
| ----------- | ---------------------------------------------------- |
| **Backend** | Node.js, Express.js, Socket.io, Winston, Sentry      |
| **Database**| MongoDB (Mongoose ODM), Redis (caching + pub/sub)     |
| **Auth**    | JWT + Firebase Auth, 2FA OTP, Google OAuth            |
| **Frontend**| React 18, Redux, React Router, PWA (Service Worker)   |
| **Mobile**  | React Native (Expo 52), Redux Toolkit, redux-persist  |
| **DevOps**  | Docker Compose, GitHub Actions CI, Husky + lint-staged|
| **Monitoring**| Sentry (error tracking), Winston (structured logs)  |
| **Docs**    | Swagger / OpenAPI 3.0                                 |

---

## 📁 Project Structure

```
rice-mill-app/
├── backend/                   # Express.js API server
│   ├── config/                # Firebase, Sentry, Redis configs
│   ├── controllers/           # Route handler logic
│   ├── middleware/             # Auth, rate-limit, pagination, cache, CSRF
│   ├── models/                # Mongoose schemas (User, Order, Product, etc.)
│   ├── routes/                # Express route definitions (31 modules)
│   ├── services/              # Firebase sync, email, notifications
│   ├── utils/                 # Logger, socket server, health monitor
│   ├── tests/                 # Mocha + Chai + Sinon unit tests
│   ├── swagger.js             # OpenAPI spec generator
│   └── app.js                 # Application entry point
│
├── frontend/                  # React web application (PWA)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route-level page components
│   │   ├── redux/             # Actions, reducers, store
│   │   ├── utils/             # API clients (axios), helpers
│   │   └── context/           # React context providers
│   └── public/                # Static assets, manifest.json, SW
│
├── mobile/                    # React Native (Expo) mobile app
│   ├── src/
│   │   ├── screens/           # Screen components
│   │   ├── redux/             # Slices, reducers, store (w/ persist)
│   │   ├── services/          # API client
│   │   ├── config/            # Environment config
│   │   └── components/        # Shared mobile components
│   └── app.json               # Expo config (OTA, deep linking)
│
├── docker-compose.yml         # Multi-service orchestration
├── migrations/                # Database migration scripts
└── .github/workflows/         # CI/CD pipelines
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local or Atlas connection string)
- **Redis** (optional — gracefully degrades if absent)
- **Firebase** project with Auth enabled

### 1. Clone the repository

```bash
git clone https://github.com/Chakravarthi554/Rice-Mill-Express.git
cd Rice-Mill-Express
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env        # Fill in your secrets
npm install
npm run dev                  # Starts with nodemon on port 5001
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm start                    # Starts React dev server on port 3000
```

### 4. Mobile setup

```bash
cd mobile
npm install
npx expo start               # Scan QR with Expo Go
```

### 5. Docker (all services)

```bash
docker-compose up --build     # API + MongoDB + Redis
```

---

## 🔐 Environment Variables

Copy `backend/.env.example` and fill in the required values:

| Variable                | Required | Description                       |
| ----------------------- | -------- | --------------------------------- |
| `MONGO_URI`             | ✅       | MongoDB connection string          |
| `JWT_SECRET`            | ✅       | Secret for signing JWT tokens      |
| `REFRESH_TOKEN_SECRET`  | ✅       | Secret for refresh tokens          |
| `FIREBASE_PROJECT_ID`   | ✅       | Firebase project identifier        |
| `FIREBASE_CLIENT_EMAIL` | ✅       | Firebase service account email     |
| `FIREBASE_PRIVATE_KEY`  | ✅       | Firebase private key (PEM)         |
| `RAZORPAY_KEY_ID`       | ✅       | Razorpay API key                   |
| `RAZORPAY_KEY_SECRET`   | ✅       | Razorpay secret                    |
| `REDIS_HOST`            | ❌       | Redis host (default: 127.0.0.1)    |
| `REDIS_PORT`            | ❌       | Redis port (default: 6379)         |
| `SENTRY_DSN`            | ❌       | Sentry error tracking DSN          |
| `NODE_ENV`              | ❌       | `development` or `production`      |

---

## 📡 API Reference

All routes are versioned under `/api/v1/`. Swagger documentation is available at:

```
http://localhost:5001/api-docs
```

### Core Endpoints

| Module          | Base Path                    | Description                    |
| --------------- | ---------------------------- | ------------------------------ |
| Auth            | `/api/v1/auth`               | Login, register, OTP, 2FA      |
| Products        | `/api/v1/products`           | CRUD, search, reviews          |
| Orders          | `/api/v1/orders`             | Create, track, cancel           |
| Cart            | `/api/v1/cart`               | Add, remove, update qty         |
| Payments        | `/api/v1/payments`           | Razorpay integration, refunds   |
| Users           | `/api/v1/users`              | Profile, addresses, history     |
| Delivery        | `/api/v1/dp`                 | Partner dashboard, tracking     |
| Bulk Orders     | `/api/v1/bulk-orders`        | B2B bulk ordering               |
| Notifications   | `/api/v1/notifications`      | Push, in-app notifications      |
| Forum           | `/api/v1/forum`              | Community posts, comments       |
| Recipes         | `/api/v1/recipes`            | User-submitted recipes          |
| Rewards         | `/api/v1/rewards`            | Loyalty points, redemption      |
| Admin           | `/api/v1/admin`              | User mgmt, analytics, settings  |
| Health          | `/api/v1/health`             | System health check             |

---

## 📱 Mobile App

The mobile app is built with **Expo 52** and supports:

- **OTA Updates** via `expo-updates` (configured in `app.json`)
- **Deep Linking** — Universal links on iOS, intent filters on Android
- **Offline-First** — Redux state persisted to AsyncStorage via `redux-persist`
- **Push Notifications** — Firebase Cloud Messaging
- **i18n** — Multi-language support via `i18next`

### Build for production

```bash
cd mobile
eas build --platform android    # or --platform ios
```

---

## 🧪 Testing

### Backend unit tests

```bash
cd backend
npx mocha tests/               # Run all test suites
npx nyc mocha tests/           # With code coverage
```

### Frontend tests

```bash
cd frontend
npm test                        # Jest + React Testing Library
```

### CI Pipeline

GitHub Actions runs on every push:
- ✅ `npm test` (backend + frontend)
- ✅ `npm audit --audit-level=high` (dependency security)
- ✅ `nyc` code coverage gate

---

## 🐳 Deployment

### Docker Compose

```bash
docker-compose up -d
```

Services:
- **api** — Express.js on port 5001
- **mongo** — MongoDB on port 27017
- **redis** — Redis on port 6379

### Production checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure MongoDB Atlas connection string
- [ ] Set up Redis (ElastiCache / managed)
- [ ] Configure Sentry DSN for error tracking
- [ ] Set up Firebase service account
- [ ] Configure Razorpay live keys
- [ ] Enable HTTPS via reverse proxy (nginx)
- [ ] Set up log aggregation (Winston → CloudWatch / ELK)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Quality

- **Pre-commit hooks** — Husky + lint-staged auto-format on commit
- **ESLint** — Airbnb base config
- **Prettier** — Consistent code formatting

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ❤️ by Chakravarthi & Prasanna
</p>
