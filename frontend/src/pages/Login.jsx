
import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { registerUser } from "../services/authService.js";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const { login } = useContext(AuthContext);
    const [currentState, setCurrentState] = useState("Login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const navigate = useNavigate();

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        try {
            if (currentState === "Login") {
                login(email, password);
            } else {
                const data = await registerUser({ username: name, email, password });
                toast.success("Đăng kí thành công");
                setCurrentState("Login");
                navigate("/login");
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Đăng kí thất bại");
        };

    };

    return (
        <form onSubmit={onSubmitHandler} className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800">
            <div className="inline-flex items-center gap-2 mb-2 mt-10">
                <p className="prata-regular text-3xl">{currentState}</p>
                <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
            </div>
            {currentState === 'Login' ? '' : (
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-800"
                    placeholder="Name"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
            )}
            <input
                type="email"
                className="w-full px-3 py-2 border border-gray-800"
                placeholder="Email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
            />
            <input
                type="password"
                className="w-full px-3 py-2 border border-gray-800"
                placeholder="Password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <div className="w-full flex justify-between text-sm mt-[-8px]">
                <p className=" cursor-pointer">Forgot your password?</p>
                {
                    currentState === 'Login'
                        ? <p onClick={() => setCurrentState('Sign Up')} className=" cursor-pointer">Create account</p>
                        : <p onClick={() => setCurrentState('Login')} className=" cursor-pointer">Login Here</p>
                }

            </div>
            <button className="bg-black text-white font-light px-8 py-2 mt-4">{currentState === 'Login' ? 'Sign In' : 'Sign Up'}</button>
        </form>
    )
}
export default Login;