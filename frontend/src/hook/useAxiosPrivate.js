import { useEffect, useContext } from "react";
import axiosPrivate from "../apiConfig/axiosPrivate";
import { AuthContext } from "../context/AuthContext";
import { refreshAccessToken } from "../services/authService";


const useAxiosPrivate = () => {
    const { accessToken, authData } = useContext(AuthContext);

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
                        const data = await refreshAccessToken();
                        authData({ accessToken: data.accessToken });
                        prevRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;
                        return axiosPrivate(prevRequest);
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