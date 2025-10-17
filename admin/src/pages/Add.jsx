import React, { useState, useEffect } from 'react';
import { getCategory, addProduct } from '../services/productService';
import { assets } from '../assets/assets';
import { toast } from "react-toastify";

function Add() {

    const [image1, setImage1] = useState(false);
    const [image2, setImage2] = useState(false);
    const [image3, setImage3] = useState(false);
    const [image4, setImage4] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [sizes, setSizes] = useState([]);
    const [bestseller, setBestseller] = useState(false);

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [category, setCategory] = useState("");
    const [subCategory, setSubCategory] = useState("");

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCategory = async () => {
            const res = await getCategory();
            setCategories(res.categories || res);
        };
        fetchCategory();
    }, []);
    // Khi chọn 1 category → lọc ra các danh mục con
    useEffect(() => {
        const subs = categories.filter(c => c.parent_id === parseInt(category));
        setSubCategories(subs);
    }, [category, categories]);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            if (!name || !description || !price || !category) {
                toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
                return;
            }

            if (!image1 && !image2 && !image3 && !image4) {
                toast.error("Vui lòng chọn ít nhất 1 ảnh sản phẩm!");
                return;
            }

            if (isNaN(price) || price <= 0) {
                toast.error("Giá sản phẩm phải là số dương!");
                return;
            }
            const formData = new FormData();
            image1 && formData.append("images", image1);
            image2 && formData.append("images", image2);
            image3 && formData.append("images", image3);
            image4 && formData.append("images", image4);
            formData.append("name", name);
            formData.append("description", description);
            formData.append("price", price);
            formData.append("category_id", subCategory || category);
            formData.append("sizes", sizes.join(","));
            formData.append("bestseller", bestseller);
            const newProduct = await addProduct(formData);

            if (newProduct.errors) {
                toast.error(newProduct.errors[0]);
                return;
            }

            if (newProduct.success) {
                toast.success("Thêm sản phẩm thành công!");
                // reset form
                setImage1(false);
                setImage2(false);
                setImage3(false);
                setImage4(false);
                setName("");
                setDescription("");
                setPrice("");
                setSizes([]);
                setBestseller(false);
                setCategory("");
                setSubCategory("");
            } else {
                toast.error(newProduct.message || "Thêm thất bại!");
            };
        } catch (error) {
            console.error("Lỗi lấy category:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={onSubmitHandler}
            className="flex flex-col w-full items-start gap-3"
        >
            {/* Ảnh */}
            <div>
                <p className="mb-2">Upload Image</p>
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <label key={i} htmlFor={`image${i}`}>
                            <img
                                className="w-20 cursor-pointer"
                                src={
                                    !eval(`image${i}`)
                                        ? assets.upload_area
                                        : URL.createObjectURL(eval(`image${i}`))
                                }
                                alt=""
                            />
                            <input
                                onChange={(e) => eval(`setImage${i}`)(e.target.files[0])}
                                type="file"
                                id={`image${i}`}
                                hidden
                            />
                        </label>
                    ))}
                </div>
            </div>

            {/* Tên & mô tả */}
            <div className="w-full">
                <p className="mb-2">Product name</p>
                <input
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    className="w-full max-w-[500px] px-3 py-2"
                    type="text"
                    placeholder="type here"
                />
            </div>

            <div className="w-full">
                <p className="mb-2">Product Description</p>
                <textarea
                    onChange={(e) => setDescription(e.target.value)}
                    value={description}
                    className="w-full max-w-[500px] px-3 py-2"
                    placeholder="Write content here"
                />
            </div>

            {/* Category + Subcategory + Price */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:gap-8">
                <div>
                    <p className="mb-2">Product category</p>
                    <select
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2"
                    >
                        <option value="">-- Select category --</option>
                        {categories
                            .filter((c) => !c.parent_id)
                            .map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                    </select>
                </div>

                <div>
                    <p className="mb-2">Sub category</p>
                    <select
                        onChange={(e) => setSubCategory(e.target.value)}
                        className="w-full px-3 py-2"
                    >
                        <option value="">-- Select sub-category --</option>
                        {subCategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                                {sub.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <p className="mb-2">Price</p>
                    <input
                        onChange={(e) => setPrice(e.target.value)}
                        value={price}
                        className="w-full px-3 py-2 sm:w[-120px]"
                        type="number"
                    />
                </div>
            </div>

            {/* Sizes */}
            <div>
                <p className="mb-2">Sizes</p>
                <div className="flex gap-3">
                    {["S", "M", "L", "XL"].map((s) => (
                        <div
                            key={s}
                            onClick={() =>
                                setSizes((prev) =>
                                    prev.includes(s)
                                        ? prev.filter((size) => size !== s)
                                        : [...prev, s]
                                )
                            }
                        >
                            <p
                                className={`${sizes.includes(s) ? "bg-pink-100" : "bg-slate-200"
                                    } px-3 py-1 cursor-pointer`}
                            >
                                {s}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bestseller */}
            <div className="flex gap-2 mt-2">
                <input
                    onChange={() => setBestseller((prev) => !prev)}
                    checked={bestseller}
                    type="checkbox"
                    id="bestseller"
                />
                <label className="cursor-pointer" htmlFor="bestseller">
                    Add to bestseller
                </label>
            </div>

            <button
                disabled={loading}
                className={`w-28 py-3 mt-4 text-white rounded transition 
    ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-black hover:bg-gray-800"}`}
                type="submit"
            >
                {loading ? (
                    <div className="flex justify-center items-center gap-2">
                        <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                            ></path>
                        </svg>
                        Adding...
                    </div>
                ) : (
                    "Add"
                )}
            </button>
        </form>
    );
};

export default Add;
