import React from 'react'
import Navbar from './component/Navbar';
import Sidebar from './component/Sidebar';
import { Route, Routes, Navigate } from 'react-router-dom';
import Add from './pages/Add';
import List from './pages/List';
import Orders from './pages/Orders';
import Login from './component/Login';
import Dashboard from './pages/Dashboard';
import { ProtectedAdminRoute } from './routes/ProtectedAdminRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer />

      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" />} />
        {/*Route đăng nhập nằm ngoài layout */}
        <Route path="/admin/login" element={<Login />} />

        {/*Các route yêu cầu đăng nhập */}
        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <div>
                <Navbar />
                <hr />
                <div className="flex w-full">
                  <Sidebar />
                  <div className="w-[70%] mx-auto ml-[max(5vw, 25px)] my-8 text-gray-600 text-base">
                    <Routes>
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="add" element={<Add />} />
                      <Route path="list" element={<List />} />
                      <Route path="orders" element={<Orders />} />
                    </Routes>
                  </div>
                </div>
              </div>
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
