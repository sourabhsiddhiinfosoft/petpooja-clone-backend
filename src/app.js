import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createProxyMiddleware } from 'http-proxy-middleware';
import "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import areaRoutes from "./routes/areaRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import kotRoutes from "./routes/kotRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import ownerDashboardRoutes from "./routes/ownerDashboardRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";
import branchRoutes from "./routes/branchRoutes.js"

dotenv.config();
const app = express();

// --- Configuration ---
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000; 
const FRONTEND_DEV_URL = `http://localhost:${FRONTEND_PORT}`;

// ----------------------------------------------------------------------
// 1. CONDITIONAL HELMET/CSP SETUP 
// ----------------------------------------------------------------------
if (process.env.NODE_ENV === "production") {
    // In production, use full helmet protection
    app.use(helmet());
} else {
    // In development, disable Content Security Policy (CSP) to allow inline scripts for HMR
    app.use(helmet({
        contentSecurityPolicy: false,
    }));
}

// --- Global Middleware ---
app.use(express.json());
app.use(morgan("dev"));

// --- CORS Configuration ---
const allowedOrigins = [
    'https://petpooja-clone-frontend.vercel.app/',
    'http://localhost:3000'
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. file systems)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else if (process.env.NODE_ENV !== "production") {
            // Allow all requests in development to support ngrok and local IPs
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));

// --- API Test Route (Keep / minimal to ensure proxy works) ---
// NOTE: We rely on the proxy to handle the main "/" route for the frontend.
app.get("/test", (req, res) => res.json({ status: "ok", service: "Testing backend is running..." }));


// --- API Routes (MUST ALL BE PREFIXED WITH /api/) ---
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/kots",kotRoutes);
app.use("/api/staff",staffRoutes);
app.use("/api/owners",ownerRoutes);
app.use("/api/admin/dashboard",adminDashboardRoutes);
app.use("/api/owner/dashboard",ownerDashboardRoutes);
app.use("/api/branches", branchRoutes);

// Serve static uploads (for local multer)
if (process.env.NODE_ENV !== "production") {
  app.use("/uploads", express.static("uploads"));
}

// ----------------------------------------------------------------------
// 2. FRONTEND PROXY MIDDLEWARE (With enhanced debugging and connection fixes)
// ----------------------------------------------------------------------
if (process.env.NODE_ENV !== "production") {
    console.log(`[Proxy] Forwarding non-API requests to: ${FRONTEND_DEV_URL}`);
    app.use(
        '/',
        createProxyMiddleware({
            target: FRONTEND_DEV_URL,
            changeOrigin: true,
            ws: true, // WebSocket support for HMR
            secure: false, // 👈 FIX: Essential when proxying HTTPS (ngrok) to HTTP (localhost:5173)
            logLevel: 'debug', // 👈 DIAGNOSTIC: Prints connection activity in your backend console
        })
    );
}

// --- Error Handlers ---
app.use(notFound);
app.use(errorHandler);

export default app;





// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import helmet from "helmet";
// import morgan from "morgan";
// import "./config/db.js";
// import authRoutes from "./routes/authRoutes.js";
// import restaurantRoutes from "./routes/restaurantRoutes.js";
// import menuRoutes from "./routes/menuRoutes.js";
// import orderRoutes from "./routes/orderRoutes.js";
// import inventoryRoutes from "./routes/inventoryRoutes.js";
// import reportRoutes from "./routes/reportRoutes.js";
// import categoryRoutes from "./routes/categoryRoutes.js";
// import areaRoutes from "./routes/areaRoutes.js";
// import tableRoutes from "./routes/tableRoutes.js";
// import kotRoutes from "./routes/kotRoutes.js";
// import staffRoutes from "./routes/staffRoutes.js";
// import ownerRoutes from "./routes/ownerRoutes.js";
// import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
// import { notFound, errorHandler } from "./middlewares/errorHandler.js";

// dotenv.config();
// const app = express();

// app.use(helmet());
// // app.use(cors());
// app.use(express.json());
// app.use(morgan("dev"));

// app.use(cors({
//   origin: [
//     'https://petpooja-clone-frontend.vercel.app',
//     'http://localhost:3000'
//   ],
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true
// }));

// app.get("/", (req,res)=> res.json({status:"ok", service:"Restaurant Management System Backend"}));

// app.get("/test", (req, res) => res.json({ status: "ok", service: "Testing backend is running" }));

// app.use("/api/auth", authRoutes);
// app.use("/api/restaurants", restaurantRoutes);
// app.use("/api/menu", menuRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/inventory", inventoryRoutes);
// app.use("/api/reports", reportRoutes);
// app.use("/api/categories", categoryRoutes);
// app.use("/api/areas", areaRoutes);
// app.use("/api/tables", tableRoutes);
// app.use("/api/kots",kotRoutes);
// app.use("/api/staff",staffRoutes);
// app.use("/api/owners",ownerRoutes);
// app.use("/api/admin/dashboard",adminDashboardRoutes);
// app.use("/api/owner/dashboard",adminDashboardRoutes);
// app.use(notFound);
// app.use(errorHandler);

// export default app;

