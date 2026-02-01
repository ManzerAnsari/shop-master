import React from "react";
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-brand-50 flex flex-col justify-center items-center">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
