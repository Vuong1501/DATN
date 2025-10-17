import React from 'react'
import { useState } from 'react';

function List() {
    const [list, setList] = useState([]);
    // gọi api 
    const fetchList = async () => {
        try {
            const response = await fetch('https://api.example.com/items');
            const data = await response.json();
            setList(data);
        } catch (error) {
            console.error('Error fetching list:', error);
        };
    }
    return (
        <>
            <p className='mb-2'>All products list</p>
            <div className='flex flex-col gap-2'>
                <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm'>
                    <b >Image</b>
                    <b>Name</b>
                    <b>Category</b>
                    <b>Price</b>
                    <b className='text-center'>Action</b>
                </div>
                {/* Product list */}
                {list.map((item, index) => (
                    <div key={index} className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm'>
                        <img src={item.image[0]} alt="" />
                        <p>{item.name}</p>
                        <p>{item.category}</p>
                        <p>${item.price}</p>
                        <p>x</p>
                        {/* <p onClick={() => } className='text-right md:text-center cursor-pointer text-lg'></p> */}
                        <div className='w-16 h-16'>
                            <img src={item.image} alt={item.name} className='w-full h-full object-cover' />
                        </div>
                        <div className='flex gap-2 justify-center'>
                            <button className='px-2 py-1 bg-blue-500 text-white rounded text-xs'>Edit</button>
                            <button className='px-2 py-1 bg-red-500 text-white rounded text-xs'>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

export default List;
