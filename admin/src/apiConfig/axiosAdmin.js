import axios from "axios";
import { refreshAccessToken } from "../services/authService";

let accessToken = null; // biến toàn cục trong module này

const axiosAdmin = axios.create({
    baseURL: "http://localhost:8080/api",
    withCredentials: true, // để gửi cookie refreshToken nếu có
});

// Hàm set token để AuthContext có thể cập nhật khi đăng nhập / refresh
export const setAdminToken = (token) => {
    accessToken = token;
    if (token) {
        axiosAdmin.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete axiosAdmin.defaults.headers.common["Authorization"];
    }
};

// Interceptor REQUEST: tự gắn token vào header
axiosAdmin.interceptors.request.use(
    (config) => {
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor RESPONSE: tự refresh token nếu bị 401
axiosAdmin.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 (hết hạn access token)
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const data = await refreshAccessToken(); // gọi API refresh
                const newToken = data.accessToken;
                setAdminToken(newToken); // cập nhật lại token mới

                // Gắn token mới vào request cũ rồi gửi lại
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                return axiosAdmin(originalRequest);
            } catch (err) {
                console.error("Không thể refresh token admin:", err.message);
                // Nếu refresh fail → logout
                window.location.href = "/admin/login";
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosAdmin;
