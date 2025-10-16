import { useContext } from "react";
import { AuthContextAdmin } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedAdminRoute = ({ children }) => {
    const { admin, accessToken, loading } = useContext(AuthContextAdmin);
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></span>
            </div>
        );
    }
    if (!admin || !accessToken) return <Navigate to="/admin/login" />;
    return children;
};
export { ProtectedAdminRoute };