import express from "express";
import cors from "cors";
import routes from "./routes/index.js";

// App Config
const app = express();
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true
}));
app.use(express.json());
app.use("/api", routes);
app.listen(process.env.PORT, () => {
    console.log(`🚪 API Gateway running on port ${process.env.PORT}`);
});