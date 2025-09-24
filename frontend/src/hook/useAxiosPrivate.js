import { useEffect, useContext, useRef } from "react";
import axiosPrivate from "../apiConfig/axiosPrivate";
import { AuthContext } from "../context/AuthContext";
import { refreshAccessToken } from "../services/authService";

const useAxiosPrivate = () => {
    const { accessToken, authData } = useContext(AuthContext);
    const refreshPromiseRef = useRef(null); // biến giữ promise refresh đang chạy

    useEffect(() => {
        // Request interceptor: gắn token
        const requestIntercept = axiosPrivate.interceptors.request.use(
            (config) => {
                if (accessToken && !config.headers["Authorization"]) {
                    config.headers["Authorization"] = `Bearer ${accessToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
        // Response interceptor: refresh nếu 401
        const responseIntercept = axiosPrivate.interceptors.response.use(
            (response) => response,
            async (error) => {
                const prevRequest = error?.config;
                if (error?.response?.status === 401 && !prevRequest?.sent) {
                    prevRequest.sent = true;
                    try {
                        // Nếu chưa có refresh đang chạy, tạo refreshPromise
                        if (!refreshPromiseRef.current) {
                            refreshPromiseRef.current = refreshAccessToken()
                                .then((data) => {
                                    authData({ accessToken: data.accessToken });
                                    return data.accessToken;
                                })
                                .finally(() => {
                                    refreshPromiseRef.current = null; // reset sau khi xong
                                });
                        }
                        // Chờ refreshPromise hoàn tất và lấy token mới
                        const newAccessToken = await refreshPromiseRef.current;
                        prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
                        return axiosPrivate(prevRequest); // retry request
                    } catch (err) {
                        return Promise.reject(err);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axiosPrivate.interceptors.request.eject(requestIntercept);
            axiosPrivate.interceptors.response.eject(responseIntercept);
        };
    }, [accessToken, authData]);
    return axiosPrivate;
};
export default useAxiosPrivate;