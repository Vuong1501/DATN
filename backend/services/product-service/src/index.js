import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./config/db.js";
import { connectRedis } from "../common/redis/redis.js";
import { connectRabbitMQ } from "../common/rabbitmq/rabbitmq.js";
import { connectCloudinary } from "./config/cloudinary.js";
// import userRouter from "./routes/user.route.js";
import productRouter from "./routes/product.route.js";

const app = express();
const {
    REDIS_URL,
    RABBITMQ_URL,
    PORT = 3002,
} = process.env; // lấy từ docker-compose
// middleware
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(cookieParser());

// routes
// app.use("/users", userRouter);
app.use("/product", productRouter);

connectCloudinary();
// nếu connect mysql lỗi thì dùng
// async function connectWithRetry(retries = 5, delay = 5000) {
//     while (retries) {
//         try {
//             await sequelize.authenticate();
//             console.log("✅ Database connected");
//             return;
//         } catch (err) {
//             retries -= 1;
//             console.error(
//                 `❌ DB connection failed (${err.message}). Retries left: ${retries}`
//             );
//             if (!retries) throw err;
//             await new Promise((res) => setTimeout(res, delay));
//         }
//     }
// }

async function startServer() {
    try {
        // await connectWithRetry(); nếu connect mysql lỗi thì dùng
        await sequelize.authenticate();
        const isDev = process.env.NODE_ENV !== "production"; // check môi trường
        await sequelize.sync({ alter: isDev });
        await connectRedis(REDIS_URL);
        await connectRabbitMQ(RABBITMQ_URL);

        app.listen(PORT, () => {
            console.log(`Product service running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start service:", err);
        process.exit(1);
    }
}

startServer();
// app.listen(3002, () => {
//     console.log("Product service running on port 3002");
// });