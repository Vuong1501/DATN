import axios from "axios";
import { refreshAccessToken } from "../services/authService";

let accessToken = null; // biến toàn cục trong module này

// Hàm cho phép AuthContext cập nhật token vào interceptor
export const setAccessToken = (token) => {
    accessToken = token;
};

const axiosClient = axios.create({
    baseURL: "http://localhost:8080/api",
    withCredentials: true,
});

// Cờ để tránh gọi refresh chồng nhau
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

//Gắn token vào mỗi request
axiosClient.interceptors.request.use(
    (config) => {
        if (accessToken && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Refresh token nếu bị 401
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Đợi refresh hoàn tất
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((newToken) => {
                        originalRequest.headers.Authorization = "Bearer " + newToken;
                        return axiosClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const res = await refreshAccessToken();
                const newToken = res.accessToken;

                // Cập nhật vào biến toàn cục
                setAccessToken(newToken);

                processQueue(null, newToken);
                originalRequest.headers.Authorization = "Bearer " + newToken;
                return axiosClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);


export default axiosClient;