import React, { useState } from "react";
import { forgotPassword } from "../services/authService.js";
import { toast } from "react-toastify";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await forgotPassword({ email });
            toast.success("Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư đến của bạn.");
        } catch (error) {
            toast.error("Đã xảy ra lỗi khi gửi email đặt lại mật khẩu. Vui lòng thử lại sau.");
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-md w-96">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center tracking-wide">Quên mật khẩu</h2>
                <input
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                    required
                />
                <button type="submit" className="bg-black text-white font-light px-6 py-2 mt-4 border border-gray-500 rounded-md mx-auto block">
                    Gửi email đặt lại
                </button>
            </form>
        </div>
    );
}

export default ForgotPassword;