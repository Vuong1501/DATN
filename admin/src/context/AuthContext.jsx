import { createContext, useState, useEffect } from "react";
import { loginAdmin, refreshAccessToken, getAdminProfile } from "../services/authService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AuthContextAdmin = createContext(); //tạo ra context rỗng 

const AuthProviderAdmin = (props) => {
    const [accessToken, setAccessToken] = useState(null);
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const initAuth = async () => {
            try {
                const data = await refreshAccessToken();
                setAccessToken(data.accessToken);

                const adminData = await getAdminProfile(data.accessToken);
                setAdmin(adminData);

            } catch (error) {
                console.log("Không thể refresh token:", error.message);
                setAccessToken(null);
                setAdmin(null);
            } finally {
                setLoading(false); // ✅ hết trạng thái kiểm tra
            }
        };
        initAuth();
    }, []);
    const login = async (email, password) => {
        console.log("Login function called");
        try {
            const data = await loginAdmin({ email, password });

            if (data.role !== "admin") {
                toast.error("Tài khoản không có quyền truy cập admin!");
                return;
            }

            setAccessToken(data.accessToken);
            const adminData = await getAdminProfile(data.accessToken);
            setAdmin(adminData);

            toast.success("Đăng nhập thành công!");
            navigate("/admin/dashboard");
        } catch (error) {
            toast.error("Đăng nhập thất bại!");
        }
    };

    const value = { accessToken, login, admin, loading };
    return <AuthContextAdmin.Provider value={value}>{props.children}</AuthContextAdmin.Provider>
};
export default AuthProviderAdmin;