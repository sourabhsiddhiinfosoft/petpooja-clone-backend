import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
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
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();
const app = express();

app.use(helmet());
// app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(cors({
  origin: [
    'https://petpooja-clone-frontend.vercel.app'
  ],
  credentials: true
}));

app.get("/", (req,res)=> res.json({status:"ok", service:"Restaurant Management System Backend updated 26 sep"}));

app.get("/test", (req, res) => res.json({ status: "ok", service: "Testing backend is running" }));

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
app.use("/api/owner/dashboard",adminDashboardRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
