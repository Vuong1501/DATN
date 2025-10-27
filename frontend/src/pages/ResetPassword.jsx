import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/authService.js";
import { toast } from "react-toastify";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.warn("Mật khẩu và xác nhận mật khẩu không khớp.");
            return;
        }
        try {
            console.log("token >>>", token);
            console.log("password >>>", password);

            const res = await resetPassword({ token, newPassword: password });
            console.log("res >>>>", res);

            toast.success("Mật khẩu của bạn đã được đặt lại thành công.");
            navigate("/login");
        } catch (error) {
            toast.error("Đã xảy ra lỗi khi đặt lại mật khẩu. Vui lòng thử lại.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-semibold mb-4">Đặt lại mật khẩu</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-80">
                <input
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border rounded p-2"
                    required
                />
                <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border rounded p-2"
                    required
                />
                <button
                    type="submit"
                    className="bg-black text-white font-light px-6 py-2 mt-4 border border-gray-500 rounded-md mx-auto block"
                >
                    Đặt lại mật khẩu
                </button>
            </form>
        </div>

    );
};
export default ResetPassword;