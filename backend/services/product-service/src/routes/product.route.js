import express from "express";

import { addProduct } from "../controllers/product.controller.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.post("/add", upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 },]), addProduct);

export default router;