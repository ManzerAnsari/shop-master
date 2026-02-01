import React, { useState, useEffect } from "react";
import {
  App,
  Card,
  Form,
  Input,
  Select,
  Button,
  Switch,
  Divider,
  Space,
  Avatar,
  Modal,
} from "antd";
import { Icon } from "@iconify/react";
import { useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";
import userService from "../../services/userService";

const { Option } = Select;
const { TextArea } = Input;

const Settings = () => {
  const { message } = App.useApp();
  const dispatch = useDispatch();
  const [profileForm] = Form.useForm();
  const [shopForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  const [preferences, setPreferences] = useState({
    currency: "USD",
    language: "en",
    theme: "light",
    notifications: true,
    emailUpdates: false,
  });

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Fetch user data once
      const userData = await userService.getProfile();

      const profile = {
        ...userData,
        name: `${userData.firstName} ${userData.lastName}`,
      };
      const shop = {
        shopName: userData.shopName,
        ...userData.shopSettings,
      };
      const prefs = userData.preferences || {
        currency: "USD",
        language: "en",
        theme: "light",
        notifications: true,
        emailUpdates: false,
      };

      // Update form values
      profileForm.setFieldsValue(profile);
      shopForm.setFieldsValue(shop);
      preferencesForm.setFieldsValue(prefs);
      setPreferences(prefs);
      setTheme(prefs.theme);
    } catch (error) {
      console.error("Error fetching user data:", error);
      message.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (values) => {
    try {
      setLoading(true);
      // Split full name into first and last name
      const names = values.name.trim().split(" ");
      const firstName = names[0];
      const lastName = names.slice(1).join(" ") || "";

      const payload = {
        ...values,
        firstName,
        lastName,
      };
      delete payload.name;

      await userService.updateProfile(payload);
      message.success("Profile updated successfully!");

      // Refresh data to update UI
      fetchUserData();
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleShopSave = async (values) => {
    try {
      setLoading(true);
      await userService.updateShopSettings(values);
      message.success("Shop settings updated successfully!");
    } catch (error) {
      console.error("Error updating shop settings:", error);
      message.error("Failed to update shop settings");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSave = async (values) => {
    try {
      setLoading(true);
      await userService.updatePreferences(values);
      setPreferences({ ...preferences, ...values });
      message.success("Preferences updated successfully!");
    } catch (error) {
      console.error("Error updating preferences:", error);
      message.error("Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "Logout Confirmation",
      content: "Are you sure you want to logout?",
      icon: (
        <Icon
          icon="material-symbols:logout"
          width="24"
          height="24"
          style={{ color: "#faad14" }}
        />
      ),
      okText: "Yes, Logout",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: () => {
        dispatch(logout());
        message.success("Logged out successfully");
      },
    });
  };

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark mb-1">
            Settings
          </h1>
          <p className="text-primary-medium">
            Manage your account and shop preferences
          </p>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
        <div className="flex items-center gap-2 mb-6">
          <Icon
            icon="material-symbols:person"
            width="24"
            height="24"
            className="text-primary-dark"
          />
          <h3 className="text-lg font-bold text-primary-dark m-0">
            User Profile
          </h3>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center gap-4 min-w-[200px]">
            <Avatar
              size={120}
              icon={
                <Icon icon="material-symbols:person" width="60" height="60" />
              }
              className="bg-primary-medium"
            />
            <Button
              type="text"
              icon={
                <Icon icon="material-symbols:upload" width="18" height="18" />
              }
              className="text-primary-medium hover:text-primary-dark"
            >
              Change Avatar
            </Button>
          </div>

          <div className="flex-1 max-w-2xl">
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleProfileSave}
              className="space-y-4"
            >
              <Form.Item
                name="name"
                label={
                  <span className="font-semibold text-primary-dark">
                    Full Name
                  </span>
                }
                rules={[{ required: true, message: "Please enter your name" }]}
              >
                <Input
                  size="large"
                  prefix={
                    <Icon
                      icon="material-symbols:badge"
                      width="18"
                      height="18"
                      className="text-gray-400"
                    />
                  }
                  placeholder="Enter your full name"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label={
                  <span className="font-semibold text-primary-dark">
                    Email Address
                  </span>
                }
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input
                  size="large"
                  prefix={
                    <Icon
                      icon="material-symbols:mail"
                      width="18"
                      height="18"
                      className="text-gray-400"
                    />
                  }
                  placeholder="your.email@example.com"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label={
                  <span className="font-semibold text-primary-dark">
                    Phone Number
                  </span>
                }
              >
                <Input
                  size="large"
                  prefix={
                    <Icon
                      icon="material-symbols:phone"
                      width="18"
                      height="18"
                      className="text-gray-400"
                    />
                  }
                  placeholder="+1 234 567 8900"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  className="bg-primary-dark hover:bg-primary-medium"
                  icon={
                    <Icon icon="material-symbols:save" width="20" height="20" />
                  }
                >
                  Save Profile
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>

      {/* Shop Settings Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
        <div className="flex items-center gap-2 mb-6">
          <Icon
            icon="material-symbols:store"
            width="24"
            height="24"
            className="text-primary-dark"
          />
          <h3 className="text-lg font-bold text-primary-dark m-0">
            Shop Settings
          </h3>
        </div>

        <div className="max-w-2xl">
          <Form
            form={shopForm}
            layout="vertical"
            onFinish={handleShopSave}
            className="space-y-4"
          >
            <Form.Item
              name="shopName"
              label={
                <span className="font-semibold text-primary-dark">
                  Shop Name
                </span>
              }
              rules={[{ required: true, message: "Please enter shop name" }]}
            >
              <Input
                size="large"
                prefix={
                  <Icon
                    icon="material-symbols:storefront"
                    width="18"
                    height="18"
                    className="text-gray-400"
                  />
                }
                placeholder="Enter your shop name"
              />
            </Form.Item>

            <Form.Item
              name="address"
              label={
                <span className="font-semibold text-primary-dark">
                  Shop Address
                </span>
              }
              rules={[{ required: true, message: "Please enter shop address" }]}
            >
              <TextArea rows={3} placeholder="Enter complete shop address" />
            </Form.Item>

            <Form.Item
              name="businessType"
              label={
                <span className="font-semibold text-primary-dark">
                  Type of Business
                </span>
              }
              rules={[
                { required: true, message: "Please select business type" },
              ]}
            >
              <Select size="large" placeholder="Select business type">
                <Option value="electronics">Electronics</Option>
                <Option value="clothing">Clothing & Fashion</Option>
                <Option value="grocery">Grocery & Food</Option>
                <Option value="pharmacy">Pharmacy</Option>
                <Option value="hardware">Hardware</Option>
                <Option value="books">Books & Stationery</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="phone"
              label={
                <span className="font-semibold text-primary-dark">
                  Shop Phone
                </span>
              }
            >
              <Input
                size="large"
                prefix={
                  <Icon
                    icon="material-symbols:call"
                    width="18"
                    height="18"
                    className="text-gray-400"
                  />
                }
                placeholder="+1 234 567 8900"
              />
            </Form.Item>

            <Form.Item
              name="description"
              label={
                <span className="font-semibold text-primary-dark">
                  Shop Description
                </span>
              }
            >
              <TextArea rows={3} placeholder="Brief description of your shop" />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className="bg-primary-dark hover:bg-primary-medium"
                icon={
                  <Icon icon="material-symbols:save" width="20" height="20" />
                }
              >
                Save Shop Settings
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-accent-light">
        <div className="flex items-center gap-2 mb-6">
          <Icon
            icon="material-symbols:tune"
            width="24"
            height="24"
            className="text-primary-dark"
          />
          <h3 className="text-lg font-bold text-primary-dark m-0">
            Preferences
          </h3>
        </div>

        <Form
          form={preferencesForm}
          layout="vertical"
          initialValues={preferences}
          onFinish={handlePreferencesSave}
          className="max-w-4xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Form.Item
              name="currency"
              label={
                <span className="font-semibold text-primary-dark">
                  Currency
                </span>
              }
            >
              <Select size="large">
                <Option value="USD">USD - US Dollar ($)</Option>
                <Option value="EUR">EUR - Euro (€)</Option>
                <Option value="GBP">GBP - British Pound (£)</Option>
                <Option value="INR">INR - Indian Rupee (₹)</Option>
                <Option value="JPY">JPY - Japanese Yen (¥)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="language"
              label={
                <span className="font-semibold text-primary-dark">
                  Language
                </span>
              }
            >
              <Select size="large">
                <Option value="en">English</Option>
                <Option value="es">Spanish</Option>
                <Option value="fr">French</Option>
                <Option value="de">German</Option>
                <Option value="hi">Hindi</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-4 rounded-xl bg-accent-light/30 border border-accent-light">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-medium shadow-sm">
                  <Icon
                    icon="material-symbols:dark-mode"
                    width="24"
                    height="24"
                  />
                </div>
                <div>
                  <div className="font-semibold text-primary-dark">
                    Dark Mode
                  </div>
                  <div className="text-sm text-primary-medium">
                    Switch between light and dark theme
                  </div>
                </div>
              </div>
              <Form.Item name="theme" valuePropName="checked" noStyle>
                <Switch
                  checkedChildren="Dark"
                  unCheckedChildren="Light"
                  onChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </Form.Item>
            </div>

            <div className="flex justify-between items-center p-4 rounded-xl bg-accent-light/30 border border-accent-light">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-medium shadow-sm">
                  <Icon
                    icon="material-symbols:notifications"
                    width="24"
                    height="24"
                  />
                </div>
                <div>
                  <div className="font-semibold text-primary-dark">
                    Push Notifications
                  </div>
                  <div className="text-sm text-primary-medium">
                    Receive alerts for low stock and sales
                  </div>
                </div>
              </div>
              <Form.Item name="notifications" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>

            <div className="flex justify-between items-center p-4 rounded-xl bg-accent-light/30 border border-accent-light">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-medium shadow-sm">
                  <Icon icon="material-symbols:mail" width="24" height="24" />
                </div>
                <div>
                  <div className="font-semibold text-primary-dark">
                    Email Updates
                  </div>
                  <div className="text-sm text-primary-medium">
                    Get weekly reports via email
                  </div>
                </div>
              </div>
              <Form.Item name="emailUpdates" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>
          </div>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              className="bg-primary-dark hover:bg-primary-medium"
              icon={
                <Icon icon="material-symbols:save" width="20" height="20" />
              }
            >
              Save Preferences
            </Button>
          </Form.Item>
        </Form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-200">
        <div className="flex items-center gap-2 mb-6">
          <Icon
            icon="material-symbols:warning"
            width="24"
            height="24"
            className="text-red-500"
          />
          <h3 className="text-lg font-bold text-red-500 m-0">Danger Zone</h3>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
          <div>
            <div className="font-semibold text-primary-dark mb-1">
              Logout from your account
            </div>
            <div className="text-sm text-primary-medium">
              You will be logged out and redirected to the login page
            </div>
          </div>
          <Button
            danger
            size="large"
            icon={
              <Icon icon="material-symbols:logout" width="20" height="20" />
            }
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
