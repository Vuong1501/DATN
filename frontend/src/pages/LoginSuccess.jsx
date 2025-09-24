import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const LoginSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setAuthData } = useContext(AuthContext);

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            // lưu accessToken + user info vào context

            // làm thêm đoạn gọi api lấy thông tin của user vào đây
            setAuthData({
                accessToken: token,
                // user: { id, email, username },
            });
            toast.success("Đăng nhập Google thành công");
            navigate("/");
        }
    }, [searchParams, setAuthData, navigate]);
    return <p className="text-center mt-10">Đang xử lý đăng nhập Google...</p>;
};
export default LoginSuccess;