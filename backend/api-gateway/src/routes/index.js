import express from "express";
import userRoutes from "./user.route.js";
import productRoutes from "./product.route.js";
import inventoryRoutes from "./inventory.route.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/product", productRoutes);
router.use("/inventory", inventoryRoutes);

export default router;
