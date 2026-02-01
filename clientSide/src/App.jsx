import React from "react";
import { RouterProvider } from "react-router-dom";
import { App as AntApp, ConfigProvider } from "antd";
import { router } from "./routes";

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#3E5879",
          colorBgLayout: "#F5EFE7",
          colorBgContainer: "#ffffff",
          colorText: "#213555",
          colorTextHeading: "#213555",
          borderRadius: 8,
          fontFamily: "Inter, system-ui, sans-serif",
          controlHeight: 45, // Taller inputs and buttons
        },
        components: {
          Layout: {
            headerBg: "#D8C4B6",
            siderBg: "#213555",
            bodyBg: "#F5EFE7",
          },
          Menu: {
            darkItemBg: "#213555",
            darkItemSelectedBg: "#3E5879",
            darkItemHoverBg: "#2a4364",
            darkItemColor: "#D8C4B6",
            darkItemSelectedColor: "#F5EFE7",
          },
          Button: {
            colorPrimary: "#3E5879",
            colorPrimaryHover: "#4d6b8f",
            algorithm: true, // Enable default algorithms
          },
          Input: {
            activeBorderColor: "#3E5879",
            hoverBorderColor: "#4d6b8f",
            activeShadow: "0 0 0 2px rgba(62, 88, 121, 0.1)", // Soft focus ring
          },
          Select: {
            colorPrimary: "#3E5879",
            controlItemBgActive: "#F5EFE7",
          },
          InputNumber: {
            activeBorderColor: "#3E5879",
            hoverBorderColor: "#4d6b8f",
          },
          DatePicker: {
            cellHeight: 24, // Smaller calendar cells
            cellWidth: 36, // Smaller calendar cell width
          },
        },
      }}
    >
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
