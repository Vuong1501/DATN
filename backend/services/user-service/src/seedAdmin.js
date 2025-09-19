import bcrypt from "bcrypt";
import User from "./models/user.model.js";
import sequelize from "./config/db.js";

(async () => {
    try {
        // Kết nối DB
        await sequelize.authenticate();
        console.log("✅ Database connected");

        // Hash mật khẩu admin
        const hashPassword = await bcrypt.hash("admin123", 10);

        // Kiểm tra xem admin đã tồn tại chưa
        const existAdmin = await User.findOne({ where: { email: "admin@gmail.com" } });
        if (existAdmin) {
            console.log("⚠️ Admin đã tồn tại:", existAdmin.email);
            process.exit(0);
        }

        // Tạo admin mới
        const admin = await User.create({
            username: "admin",
            email: "admin@gmail.com",
            password: hashPassword,
            provider: "local",
            role: "admin"
        });

        console.log("✅ Admin created:", admin.toJSON());
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding admin:", error);
        process.exit(1);
    }
})();