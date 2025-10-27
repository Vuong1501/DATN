import sequelize from "../config/db.js";
import { getRedis } from "../../common/redis/redis.js";
import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
import { google } from "googleapis";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const EXCHANGE = "notification_exchange";

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Hàm tạo URL để redirect user sang Google login
const getGoogleAuthURL = () => {
    const scopes = [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
    ];

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: scopes
    });
};

// Đổi code lấy thông tin user từ Google
const getGoogleUser = async (code) => {
    try {
        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);

        // verify id_token (nếu có)
        if (tokens.id_token) {
            const ticket = await oauth2Client.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            // payload có các thông tin user đã được xác thực
        }

        const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });

        const { data } = await oauth2.userinfo.get();

        return { data, tokens };
    } catch (err) {
        throw new Error("Google OAuth failed: " + err.message);
    }
};

const loginWithGoogle = async (code) => {
    try {
        const { data: googleUser, tokens } = await getGoogleUser(code);

        let user = await User.findOne({
            where: { provider: "google", providerId: googleUser.id }
        });

        if (!user) {
            // nếu DB có user với cùng email (local), bạn có thể liên kết thay vì tạo mới
            const existingByEmail = await User.findOne({ where: { email: googleUser.email } });

            if (existingByEmail) {
                existingByEmail.provider = "google";
                existingByEmail.providerId = googleUser.id;
                await existingByEmail.save();
                user = existingByEmail;
            } else {
                user = await User.create({
                    username: googleUser.name,
                    email: googleUser.email,
                    provider: "google",
                    providerId: googleUser.id,
                    role: "user"
                });
            }
        }
        // tạo access token
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // tạo refresh token
        const refreshToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        return { user, accessToken, refreshToken };
    } catch (err) {
        throw err;
    }
};

const refreshAccessToken = (refreshToken) => {
    try {
        if (!refreshToken) {
            throw new Error("Refresh token is required");
        }
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        // tạo access token mới
        const newAccessToken = jwt.sign(
            { id: decoded.id, email: decoded.email, role: decoded.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return { accessToken: newAccessToken };
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new Error("Refresh token expired");
        } else if (error.name === "JsonWebTokenError") {
            throw new Error("Invalid refresh token");
        } else {
            throw error;
        }
    }
};

const registerService = async ({ username, email, password }) => {
    try {
        const existUser = await User.findOne({ where: { email } });
        if (existUser) {
            throw new Error("Email đã được sử dụng");
        }
        const hashPassword = await bcrypt.hash(password, 10)
        const newUser = await User.create({
            username,
            email,
            password: hashPassword,
            provider: "local",
            role: "user"
        });
        return {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
        };
    } catch (error) {
        throw error;
    }
};

const loginService = async ({ email, password }) => {
    try {
        //tìm user
        const user = await User.findOne({ where: { email, provider: "local" } });
        if (!user) {
            throw new Error("Email không tồn tại");
        }
        //so sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Mật khẩu không đúng");
        }
        //tạo access và refresh token
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        const refreshToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );
        return { accessToken, refreshToken, role: user.role };
    } catch (error) {
        throw error;
    }
};

const createAdminService = async ({ username, email, password }) => {
    const existUser = await User.findOne({ where: { email } });
    if (existUser) {
        throw new Error("Email đã tồn tại");
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const newAdmin = await User.create({
        username,
        email,
        password: hashPassword,
        provider: "local",
        role: "admin"
    });

    return {
        id: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role
    }
};

const logoutService = async (res) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
    });
    return true;
};

const getCurrentUserService = async (userId) => {
    try {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'role', 'provider'],
            raw: true
        });
        if (!user) throw new Error("User không tồn tại");
        return user;
    } catch (error) {
        throw error;
    };
};

const forgotPasswordService = async (email) => {
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new Error("Email không tồn tại");
        //Tạo token reset password
        const token = crypto.randomBytes(20).toString("hex");
        // Lưu token vào redis

        const redis = getRedis();
        await redis.set(`resetToken:${token}`, user.id.toString(), { EX: 900 });
        // // Lấy TTL ban đầu
        // let ttl = await redis.ttl(`resetToken:${token}`);
        // console.log(`Token đã lưu: resetToken:${token}`);
        // console.log(`UserID: ${user.id}`);
        // console.log(`TTL ban đầu: ${ttl}s`);

        // //Log TTL mỗi 5 giây để xem Redis đếm ngược
        // const interval = setInterval(async () => {
        //     const ttlNow = await redis.ttl(`resetToken:${token}`);

        //     if (ttlNow === -2) {
        //         console.log("Token đã hết hạn và bị xóa khỏi Redis!");
        //         clearInterval(interval);
        //     } else {
        //         console.log(`TTL còn lại: ${ttlNow}s`);
        //     }
        // }, 5000); // mỗi 5 giây log một lần

        // gửi token qua rabbitmq
        const channel = getChannel();
        await channel.assertExchange(EXCHANGE, "direct", { durable: true });

        const message = {
            type: "forgot_password",
            to: user.email,
            subject: "Yêu cầu đặt lại mật khẩu",
            html: `
                <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào link bên dưới để đặt lại:</p>
                <a href="http://localhost:5173/reset-password/${token}">Đặt lại mật khẩu</a>
                <p>Link có hiệu lực trong 15 phút.</p>
            `
        };

        // đoạn test
        //     const message = {
        //         type: "forgot_password",
        //         to: "failtest@example.com", // 👈 ép lỗi để test retry
        //         subject: "Test Retry Flow",
        //         html: `
        //     <p>Đây là email test retry flow.</p>
        //     <p>Không gửi được mail này sẽ vào retry queue.</p>
        // `,
        //     };

        // publish theo routing key "forgot_password"
        channel.publish(
            EXCHANGE,
            "forgot_password",
            Buffer.from(JSON.stringify(message)),
            { persistent: true }
        );

        console.log(`[UserService] Sent forgot password mail to: ${user.email}`);

        return { message: "Đã gửi email đặt lại mật khẩu" };
    } catch (error) {
        throw error;
    }
};

const resetPasswordService = async (token, newPassword) => {
    const redis = getRedis();
    const userId = await redis.get(`resetToken:${token}`);
    if (!userId) throw new Error("Token không hợp lệ hoặc đã hết hạn");

    const user = await User.findByPk(userId);
    if (!user) throw new Error("Người dùng không tồn tại");
    const hashPassword = await bcrypt.hash(newPassword, 10)

    user.password = hashPassword;
    await user.save();

    // Xóa token khỏi Redis sau khi dùng
    await redis.del(`resetToken:${token}`);

    return { message: "Đặt lại mật khẩu thành công" };
};

export {
    getGoogleAuthURL, loginWithGoogle, refreshAccessToken,
    registerService, loginService, createAdminService, logoutService,
    getCurrentUserService, forgotPasswordService, resetPasswordService
};