import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Showcase from "../pages/Showcase/Showcase";
import Dashboard from "../pages/Dashboard/Dashboard";
import Inventory from "../pages/Inventory/Inventory";
import InventoryFormPage from "../pages/Inventory/InventoryFormPage";
import Sales from "../pages/Sales/Sales";
import SalesEntryPage from "../pages/Sales/SalesEntryPage";
import Reports from "../pages/Reports/Reports";
import Settings from "../pages/Settings/Settings";
import SmartCalendar from "../pages/SmartCalendar/SmartCalendar";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";
import AuthRoute from "./AuthRoute";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "login",
            element: <Login />,
          },
          {
            path: "register",
            element: <Register />,
          },
          {
            index: true,
            element: <Navigate to="login" replace />,
          },
        ],
      },
    ],
  },
  {
    path: "/showcase",
    element: <Showcase />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: "inventory",
            element: <Inventory />,
          },
          {
            path: "inventory/add",
            element: <InventoryFormPage />,
          },
          {
            path: "inventory/edit/:id",
            element: <InventoryFormPage />,
          },
          {
            path: "sales",
            element: <Sales />,
          },
          {
            path: "sales/new",
            element: <SalesEntryPage />,
          },
          {
            path: "reports",
            element: <Reports />,
          },
          {
            path: "settings",
            element: <Settings />,
          },
          {
            path: "calendar",
            element: <SmartCalendar />,
          },
        ],
      },
    ],
  },
]);
