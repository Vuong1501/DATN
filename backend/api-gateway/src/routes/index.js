import express from "express";
import userRoutes from "./user.route.js";
import productRoutes from "./product.route.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/product", productRoutes);

export default router;
