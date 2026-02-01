import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Drawer, Avatar, Dropdown } from "antd";
import { Icon } from "@iconify/react";
import { useLogout } from "../hooks/useLogout";
import { useSelector } from "react-redux";

const { Header, Sider, Content } = Layout;

// SidebarContent defined OUTSIDE MainLayout to prevent re-renders
const SidebarContent = React.memo(
  ({
    isDrawer = false,
    isCollapsed = false,
    selectedKey,
    menuItems,
    onMenuClick,
    onClose,
  }) => (
    <>
      <div
        className="h-20 flex items-center justify-between px-4 border-b mb-6"
        style={{ borderColor: "#2a4364" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "#3E5879" }}
          >
            <Icon
              icon="material-symbols:shopping-bag"
              width="28"
              height="28"
              style={{ color: "#F5EFE7" }}
            />
          </div>
          {(!isCollapsed || isDrawer) && (
            <span
              className="text-2xl font-bold tracking-tight whitespace-nowrap"
              style={{ color: "#F5EFE7" }}
            >
              Shop Master
            </span>
          )}
        </div>
        {/* Close button only visible in drawer mode */}
        {isDrawer && (
          <Button
            type="text"
            icon={<Icon icon="material-symbols:close" width="20" height="20" />}
            onClick={onClose}
            style={{ color: "#F5EFE7" }}
          />
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={onMenuClick}
        style={{
          background: "transparent",
          border: "none",
          fontSize: "15px",
        }}
        className="px-4"
      />
    </>
  )
);

const MainLayout = () => {
  const navigate = useNavigate();
  const { mutate: logout, isPending } = useLogout();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileDrawerOpen]);

  // Get current selected key based on route
  const selectedKey = useMemo(() => {
    const path = location.pathname;
    if (path === "/" || path === "") return "1";
    if (path.includes("inventory")) return "2";
    if (path.includes("sales")) return "3";
    if (path.includes("reports")) return "4";
    if (path.includes("calendar")) return "5";
    if (path.includes("settings")) return "6";
    return "1";
  }, [location.pathname]);

  // Helper function to get user initials
  const getUserInitials = useCallback((user) => {
    if (!user) return "U";
    if (user.firstName) {
      const names = user.firstName.trim().split(" ");
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  }, []);

  // Define menu structure with icon names (not JSX) to prevent re-renders
  const menuItems = useMemo(
    () => [
      {
        key: "1",
        icon: "material-symbols:dashboard",
        label: "Dashboard",
        onClick: () => navigate("/"),
      },
      {
        key: "2",
        icon: "material-symbols:inventory",
        label: "Inventory",
        onClick: () => navigate("/inventory"),
      },
      {
        key: "3",
        icon: "material-symbols:bar-chart",
        label: "Sales",
        onClick: () => navigate("/sales"),
      },
      {
        key: "4",
        icon: "material-symbols:description",
        label: "Reports",
        onClick: () => navigate("/reports"),
      },
      {
        key: "5",
        icon: "material-symbols:calendar-month",
        label: "Calendar",
        onClick: () => navigate("/calendar"),
      },
      {
        key: "6",
        icon: "material-symbols:settings",
        label: "Settings",
        onClick: () => navigate("/settings"),
      },
    ],
    [navigate]
  );

  // Transform menu items to include rendered icons
  const renderedMenuItems = useMemo(
    () =>
      menuItems.map((item) => ({
        ...item,
        icon: <Icon icon={item.icon} width="20" height="20" />,
      })),
    [menuItems]
  );

  // Dropdown menu items for user profile
  const userMenuItems = useMemo(
    () => [
      {
        key: "user-info",
        label: (
          <div
            className="px-2 py-3 border-b"
            style={{ borderColor: "#D8C4B6" }}
          >
            <div className="flex items-center gap-3">
              <Avatar
                size={48}
                style={{
                  backgroundColor: "#3E5879",
                  color: "#F5EFE7",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                {getUserInitials(user)}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div
                  className="font-semibold text-sm truncate"
                  style={{ color: "#213555" }}
                >
                  {user?.firstName || "User"}
                </div>
                <div
                  className="text-xs truncate"
                  style={{ color: "#3E5879", opacity: 0.8 }}
                >
                  {user?.email || "user@example.com"}
                </div>
              </div>
            </div>
          </div>
        ),
        disabled: true,
      },
      {
        type: "divider",
      },
      {
        key: "logout",
        label: (
          <div className="flex items-center gap-2 px-2 py-2">
            <Icon
              icon="material-symbols:logout"
              width="18"
              height="18"
              style={{ color: "#3E5879" }}
            />
            <span className="font-medium" style={{ color: "#3E5879" }}>
              Logout
            </span>
          </div>
        ),
        onClick: () => logout(),
        disabled: isPending,
      },
    ],
    [user, logout, isPending, getUserInitials]
  );

  // Memoized menu click handler for desktop
  const handleMenuClick = useCallback(
    ({ key }) => {
      const item = menuItems.find((m) => m.key === key);
      if (item?.onClick) {
        item.onClick();
      }
    },
    [menuItems]
  );

  // Memoized menu click handler for mobile drawer
  const handleDrawerMenuClick = useCallback(
    ({ key }) => {
      const item = menuItems.find((m) => m.key === key);
      if (item?.onClick) {
        item.onClick();
        setMobileDrawerOpen(false);
      }
    },
    [menuItems]
  );

  return (
    <Layout className="h-screen">
      {/* Desktop Sidebar - Fixed and collapsible */}
      {!isMobile && (
        <Sider
          theme="dark"
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          width={280}
          className="shadow-xl"
          style={{ background: "#213555" }}
        >
          <SidebarContent
            isCollapsed={collapsed}
            selectedKey={selectedKey}
            menuItems={renderedMenuItems}
            onMenuClick={handleMenuClick}
          />
        </Sider>
      )}

      {/* Mobile Drawer - Overlays on content */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          closable={false}
          styles={{
            body: { padding: 0, background: "#213555" },
            header: { display: "none" },
            wrapper: { boxShadow: "2px 0 8px rgba(0,0,0,0.15)" },
          }}
          size={280}
          maskClosable={true}
        >
          <SidebarContent
            isDrawer={true}
            selectedKey={selectedKey}
            menuItems={renderedMenuItems}
            onMenuClick={handleDrawerMenuClick}
            onClose={() => setMobileDrawerOpen(false)}
          />
        </Drawer>
      )}

      {/* Main Layout */}
      <Layout className="w-full">
        {/* Header */}
        <Header
          className="h-14 md:h-16 lg:h-20 flex justify-between items-center px-3 md:px-6 lg:px-8 shadow-md border-b"
          style={{ background: "#D8C4B6", borderColor: "#c9b5a7" }}
        >
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            {/* Burger Menu Button - Only on mobile/tablet */}
            {isMobile && (
              <Button
                type="text"
                icon={
                  <Icon icon="material-symbols:menu" width="24" height="24" />
                }
                onClick={() => setMobileDrawerOpen(true)}
                className="flex items-center justify-center hover:bg-white/20 transition-colors"
                style={{ color: "#213555", padding: "8px" }}
              />
            )}
            <h1
              className="text-base md:text-xl lg:text-2xl font-bold truncate"
              style={{ color: "#213555" }}
            >
              Overview
            </h1>
          </div>

          {/* User Profile Section */}
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4 shrink-0">
            {/* Desktop: Show welcome message */}
            <div
              className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              style={{
                background: "rgba(62, 88, 121, 0.08)",
                border: "1px solid rgba(62, 88, 121, 0.15)",
              }}
            >
              <Icon
                icon="material-symbols:waving-hand"
                width="18"
                height="18"
                style={{ color: "#3E5879" }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "#3E5879" }}
              >
                Welcome back, {user?.firstName?.split(" ")[0] || "User"}
              </span>
            </div>

            {/* User Dropdown */}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div
                className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2 rounded-lg cursor-pointer transition-all hover:shadow-md"
                style={{
                  background: "rgba(255, 255, 255, 0.6)",
                  border: "1px solid rgba(62, 88, 121, 0.2)",
                }}
              >
                <Avatar
                  size={isMobile ? 32 : 36}
                  style={{
                    backgroundColor: "#3E5879",
                    color: "#F5EFE7",
                    fontSize: isMobile ? "14px" : "16px",
                    fontWeight: "600",
                    border: "2px solid rgba(62, 88, 121, 0.15)",
                  }}
                >
                  {getUserInitials(user)}
                </Avatar>
                <div className="hidden md:flex flex-col min-w-0">
                  <span
                    className="text-xs lg:text-sm font-semibold truncate"
                    style={{ color: "#213555", maxWidth: "120px" }}
                  >
                    {user?.firstName || "User"}
                  </span>
                  <span
                    className="text-xs truncate"
                    style={{
                      color: "#3E5879",
                      opacity: 0.7,
                      maxWidth: "120px",
                    }}
                  >
                    {user?.email || "user@example.com"}
                  </span>
                </div>
                <Icon
                  icon="material-symbols:keyboard-arrow-down"
                  width="20"
                  height="20"
                  style={{ color: "#3E5879" }}
                  className="hidden md:block"
                />
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content Area */}
        <Content
          className="p-3 md:p-5 lg:p-8 overflow-auto"
          style={{ background: "#F5EFE7" }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
