import axiosAdmin from "../apiConfig/axiosAdmin";
import axios from "axios";

const API_URL_PRODUCT = "http://localhost:8080/api/product";

const getCategory = async () => {
    const res = await axios.get(`${API_URL_PRODUCT}/getCategory`);
    return res.data;
};

const addProduct = async (formData) => {
    try {
        const res = await axiosAdmin.post("/add", formData);
        return res.data;
    } catch (error) {
        if (error.response && error.response.data) {
            return error.response.data;
        }
        return { errors: ["Server error or connection failed"] };
    }
}
export { getCategory, addProduct };