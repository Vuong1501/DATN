import express from "express";
import {
    googleLogin, googleCallback, refreshTokenController, registerUserController,
    loginController, createAdminController, logoutController, getCurrentUserController,
    forgotPasswordController, resetPasswordController, usersController
} from "../controllers/user.controller.js";
import { validateRegister, validateLogin } from "../validate/user.validate.js";

const router = express.Router();

router.get("/auth/google", googleLogin);
router.get("/auth/google/callback", googleCallback);
router.post("/auth/refreshToken", refreshTokenController);
router.post("/auth/register", validateRegister, registerUserController);
router.post("/auth/login", validateLogin, loginController);
router.post("/auth/logout", logoutController);
router.get("/auth/me", getCurrentUserController);
router.post("/auth/forgotPassword", forgotPasswordController);
router.post("/auth/resetPassword", resetPasswordController);

//admin
router.post("/auth/admin/create", validateRegister, createAdminController);
router.get("/auth/admin/users", usersController);

export default router;