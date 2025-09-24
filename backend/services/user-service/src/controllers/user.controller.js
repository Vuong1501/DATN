import {
    getGoogleAuthURL, loginWithGoogle, refreshAccessToken,
    registerService, loginService, createAdminService, logoutService,
    getCurrentUserService
} from "../service/user.service.js";

const googleLogin = (req, res) => {
    const url = getGoogleAuthURL();
    res.redirect(url);
};

const googleCallback = async (req, res) => {
    try {
        const code = req.query.code;

        const { accessToken, refreshToken } = await loginWithGoogle(code);
        // Gửi refresh Token qua httpOnly
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        const redirectUrl = `http://localhost:5173/login-success?token=${accessToken}`;
        res.redirect(redirectUrl);
    } catch (error) {
        res.redirect(`http://localhost:5173/login/failed?error=${encodeURIComponent(error.message)}`);
    }
};

const refreshTokenController = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token is required" });
        }

        const { accessToken } = await refreshAccessToken(refreshToken);
        res.json({ accessToken });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

// Register
const registerUserController = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await registerService({ username, email, password });
        return res.status(201).json({
            message: "Đăng ký thành công",
            user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    };
};

const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await loginService({ email, password });
        // Gửi refresh Token qua httpOnly
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        return res.status(200).json({
            message: "Đăng nhập thành công",
            accessToken
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createAdminController = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newAdmin = await createAdminService({ username, email, password });
        return res.status(200).json({
            message: "Đăng ký thành công",
            admin: newAdmin
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const logoutController = async (req, res) => {
    try {
        await logoutService(res);
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCurrentUserController = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await getCurrentUserService(userId);

        return res.status(200).json({ user });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}


export {
    googleLogin, googleCallback, refreshTokenController,
    registerUserController, loginController, createAdminController,
    logoutController, getCurrentUserController
};
