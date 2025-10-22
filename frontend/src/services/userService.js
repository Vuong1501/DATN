import axiosClient from "../apiConfig/axiosClient.js";

export const getUserProfile = async () => {
    const res = await axiosClient.get("/users/auth/me");
    return res.data;
};
