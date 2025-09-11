import { registerUser } from "../service/user.service.js";

//login
const loginUserController = (req, res) => {

}

// Register
const registerUserController = (req, res) => {
    const { username, password } = req.body;
    console.log("login data", username, password);

    res.json({ msg: "working" })
}

const adminLoginController = (req, res) => {

}

export { loginUserController, registerUserController, adminLoginController }
