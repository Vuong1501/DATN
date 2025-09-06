import express from "express";
import { connectCloudinary } from "./config/cloudinary.js";
const app = express();
connectCloudinary();
app.listen(3002, () => {
    console.log("Product service running on port 3002");
});