import express from "express";
import { addCategory, getAllCategory } from "../controllers/category.controller.js";

const router = express.Router();

router.post("/add", addCategory);
router.get("/getAll", getAllCategory);

export default router;