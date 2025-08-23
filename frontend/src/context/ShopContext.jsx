import { createContext, useState } from "react";
import { products } from "../assets/assets";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
    const currency = '$';
    const delivery_fee = 10;
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const navigate = useNavigate();

    const addTocart = async (itemId, size) => {
        // thông báo phải chọn size
        if (!size) {
            toast.error("Select Product Size");
            return;
        }
        let cartData = structuredClone(cartItems);
        // xem trong giỏ hàng có sản phẩm này chưa, nếu chưa thì là 1, rồi thì + thêm 1
        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            }
            else {
                cartData[itemId][size] = 1;
            }
        }
        else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCartItems(cartData);
    }

    const getCartCount = () => {
        let totalCount = 0;
        // lặp qua id của sản phẩm đó
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) {
                    console.log("errr", error);
                }
            }
        }
        return totalCount;
    }

    // update lai so luong san pham tron gio hang
    const updateQuantity = async (itemId, size, quantity) => {
        let cartData = structuredClone(cartItems);

        cartData[itemId][size] = quantity;

        setCartItems(cartData);
    }
    // tong don hang
    const getCartAmout = () => {
        let totalAmout = 0
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalAmout += itemInfo.price * cartItems[items][item];
                    }
                } catch (error) {
                    console.log("err", error);
                }
            }
        }
        return totalAmout;
    }

    // 

    const value = {
        products, currency, delivery_fee, search, setSearch, showSearch, setShowSearch, cartItems, setCartItems, addTocart,
        getCartCount, updateQuantity, getCartAmout, navigate
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider;