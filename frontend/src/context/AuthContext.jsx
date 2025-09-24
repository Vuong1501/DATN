import { createContext, useState, useContext, useEffect } from "react";
import { loginUser, refreshAccessToken, logoutUser } from "../services/authService.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(); //tạo ra context rỗng 

const AuthProvider = (props) => {
    const [accessToken, setAccessToken] = useState(null);
    const [user, setUser] = useState(null); // thông tin user sau khi đăng nhập

    const navigate = useNavigate();

    useEffect(() => {
        const initAuth = async () => {
            try {
                const data = await refreshAccessToken();

                setAccessToken(data.accessToken);
            } catch (error) {
                console.log("Không thể refresh token:", error.message);
            };
        };
        initAuth();
    }), [];

    const login = async (email, password) => {
        try {
            const dataUser = await loginUser({ email, password });
            setAccessToken(dataUser.accessToken);
            toast.success("Đăng nhập thành công");
            navigate("/");
        } catch (error) {
            toast.error("Đăng nhập thất bại");
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
            setAccessToken(null);
            toast.success("Đăng xuất thành công");
            navigate("/login");
        } catch (error) {
            toast.error("Đăng xuất thất bại");
        }
    };
    const authData = ({ accessToken, user }) => {
        setAccessToken(accessToken);
        setUser(user);
    };

    const value = { accessToken, user, login, logout, authData };

    return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export default AuthProvider;

