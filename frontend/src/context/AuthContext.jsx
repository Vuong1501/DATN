import { createContext, useState, useEffect } from "react";
import { loginUser, refreshAccessToken, logoutUser } from "../services/authService.js";
import { getUserProfile } from "../services/userService.js";
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

                const userData = await getUserProfile(data.accessToken);
                setUser(userData);

            } catch (error) {
                console.log("Không thể refresh token:", error.message);
            };
        };
        initAuth();
    }, []);


    const login = async (email, password) => {
        try {
            // Gọi login, nhận accessToken
            const dataUser = await loginUser({ email, password });
            setAccessToken(dataUser.accessToken);
            // gọi hàm getUserProfile để nhận thông tin use sau khi login
            const user = await getUserProfile(dataUser.accessToken);
            setUser(user);

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
            setUser(null);
            toast.success("Đã đăng xuất");
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

