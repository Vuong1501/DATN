import express from "express";
import { googleLogin, googleCallback, refreshTokenController, registerUserController, loginController, createAdminController } from "../controllers/user.controller.js";
import { validateRegister, validateLogin } from "../validate/user.validate.js";
import { authAdmin } from "../middleware/authAdmin.js";

const router = express.Router();

router.get("/auth/google", googleLogin);
router.get("/auth/google/callback", googleCallback);
router.post("/auth/refreshToken", refreshTokenController);
router.post("/auth/register", validateRegister, registerUserController);
router.post("/auth/login", validateLogin, loginController);
router.post("/auth/admin/create", authAdmin, validateRegister, createAdminController);

export default router;