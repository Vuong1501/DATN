import express from "express";
import { loginUserController, registerUserController, adminLoginController } from "../controllers/user.controller.js";
import { validateRegister } from

const router = express.Router();

router.post('/register', registerUserController);
router.post('/login', loginUserController);
router.post('/admin', adminLoginController);

export default router; 