import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import { getUserProfile } from "../services/userService";

const LoginSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { authData } = useContext(AuthContext);

    useEffect(() => {
        const token = searchParams.get("token");

        const fetchUser = async () => {
            try {
                if (token) {
                    // gọi API để lấy user info
                    const user = await getUserProfile(token);

                    // cập nhật lại context có cả user
                    authData({ accessToken: token, user });

                    toast.success("Đăng nhập Google thành công");
                    navigate("/");
                }
            } catch (error) {
                console.log("Lấy thông tin user thất bại");
            };
        }
        fetchUser();
    }, []);
    return <p className="text-center mt-10">Đang xử lý đăng nhập Google...</p>;
};
export default LoginSuccess;