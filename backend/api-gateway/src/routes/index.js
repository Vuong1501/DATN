import express from "express";
import userRoutes from "./user.route.js";
import productRoutes from "./product.route.js";
import inventoryRoutes from "./inventory.route.js";
import cartRoutes from "./cart.route.js";
import orderRoutes from "./order.route.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/product", productRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/cart", cartRoutes);
router.use("/order", orderRoutes);

export default router;
