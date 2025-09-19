import { getGoogleAuthURL, loginWithGoogle, refreshAccessToken, registerService, loginService, createAdminService } from "../service/user.service.js";

const googleLogin = (req, res) => {
    const url = getGoogleAuthURL();
    res.redirect(url);
};

const googleCallback = async (req, res) => {
    try {
        const code = req.query.code;
        const { user, accessToken, refreshToken } = await loginWithGoogle(code);
        res.json({ user, accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const refreshTokenController = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token is required" });
        }

        const { accessToken } = await refreshAccessToken(refreshToken);
        res.json({ accessToken });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


// Register
const registerUserController = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await registerService({ username, email, password });
        return res.status(201).json({
            message: "Đăng ký thành công",
            user
        })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await loginService({ email, password });
        return res.status(200).json({
            message: "Đăng nhập thành công",
            user,
            accessToken,
            refreshToken
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

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
}


export { googleLogin, googleCallback, refreshTokenController, registerUserController, loginController, createAdminController };
