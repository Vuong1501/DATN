

import React from "react";

const NewsletterBox = () => {
    const onSubmitHandle = (event) => {
        event.preventDefault();
    }
    return (
        <div className="text-center" >
            <p className="text-2xl font-medium text-gray-800"> Subsribes now & get 20% off</p>
            <p className="text-gray-400 mt-3">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the.
            </p>
            <form onSubmit={onSubmitHandle} className="w-full sm:w-1/2 flex items-center gap-3 mx-auto my-6 border pl-3">
                <input className="w-full sm:flex-1 outline-none" type="email" placeholder="Enter your email" required />
                <button className="bg-black text-white text-xs px-10 py-4" type="submit">SUBSRIBE</button>
            </form>
        </div>
    )
}
export default NewsletterBox;