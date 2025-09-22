import axios from "axios";

const API_URL = "http://localhost:3001/users/auth";

const registerUser = async (data) => {
    const res = await axios.post(`${API_URL}/register`, data);
    return res.data;
}

const loginUser = async (data) => {
    const res = await axios.post(`${API_URL}/login`, data, { withCredentials: true });
    return res.data;
};

const refreshAccessToken = async () => {
    const res = await axios.post(`${API_URL}/refreshToken`, {}, { withCredentials: true });
    return res.data;
};

const logoutUser = () => {
    return axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
};

export { loginUser, refreshAccessToken, logoutUser, registerUser };