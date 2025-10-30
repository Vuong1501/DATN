import express from "express";

import { addProduct, getCategories, getAllProduct, updateProduct } from "../controllers/product.controller.js";
import { validateAddProduct, validateUpdateProduct } from "../validate/product.validate.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.get("/getCategory", getCategories);
router.post("/add", upload.array("images", 5), validateAddProduct, addProduct);
router.put("/update/:id", upload.array("images", 5), validateUpdateProduct, updateProduct);
router.get("/getAllProduct", getAllProduct);

export default router;