import useAxiosPrivate from "../hook/useAxiosPrivate";

export const useUserService = () => {
    const axiosPrivate = useAxiosPrivate();

    const getUserProfile = async () => {
        const res = await axiosPrivate.get("/users/auth/me");
        return res.data;
    };

    return { getUserProfile };
};