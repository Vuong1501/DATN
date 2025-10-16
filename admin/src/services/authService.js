import axios from "axios";

const API_URL = "http://localhost:3001/users/auth";

const loginAdmin = async (data) => {
    const res = await axios.post(`${API_URL}/login`, data, { withCredentials: true });
    return res.data;
};
const refreshAccessToken = async () => {
    const res = await axios.post(`${API_URL}/refreshToken`, {}, { withCredentials: true });
    return res.data;
};

const getAdminProfile = async token => {
    const res = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

const logoutUser = () => {
    return axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
};

export { loginAdmin, refreshAccessToken, getAdminProfile, logoutUser };