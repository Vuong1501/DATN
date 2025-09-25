import useAxiosPrivate from "../hook/useAxiosPrivate";
import axios from "axios";

const API_URL = "http://localhost:3001/users/auth";

// Dùng ngay sau login (chưa có interceptor)
export const getUserProfile = async (token) => {
    const res = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

// export const useUserService = () => {
//     const axiosPrivate = useAxiosPrivate();

//     const getUserProfile = async () => {
//         const res = await axiosPrivate.get("/users/auth/me");
//         return res.data;
//     };

//     return { getUserProfile };
// };