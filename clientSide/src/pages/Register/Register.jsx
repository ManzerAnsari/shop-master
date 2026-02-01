import { useState } from "react";
import {
  App,
  Form,
  Input,
  Button,
  Card,
  Steps,
  Select,
  DatePicker,
  Row,
  Col,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../lib/axios";

const { Option } = Select;

const Register = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // ===== Improved onFinish: validate all fields and gather complete form data =====
  const onFinish = async () => {
    setLoading(true);
    try {
      // validate all fields across steps (throws if invalid)
      await form.validateFields();

      // Get all values from the form (preserve true to include unmounted items)
      const allValues = form.getFieldsValue(true);

      // Remove confirmPassword if present
      const { confirmPassword, dateOfBirth, ...rest } = allValues;

      // Build registerData with nested address object
      const registerData = {
        username: rest.username,
        password: rest.password,
        email: rest.email,
        firstName: rest.firstName,
        lastName: rest.lastName,
        phone: rest.phone,
        shopName: rest.shopName,
        dateOfBirth: dateOfBirth?.format
          ? dateOfBirth.format("YYYY-MM-DD")
          : dateOfBirth,
        gender: rest.gender,
        address: {
          street: rest.street || "",
          city: rest.city || "",
          state: rest.state || "",
          zipCode: rest.zipCode || "",
          country: rest.country || "",
        },
      };

      await api.post("/auth/register", registerData);
      message.success("Registration successful! Please login.");
      navigate("/auth/login");
    } catch (error) {
      // If validation error, AntD already shows messages; only show server error here
      const serverMessage =
        error?.response?.data?.message ||
        (error?.message && error.message) ||
        "Registration failed";
      if (error?.errorFields) {
        // validation error — do nothing (AntD will display field errors)
      } else {
        message.error(serverMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    try {
      if (current === 0) {
        await form.validateFields([
          "username",
          "email",
          "password",
          "confirmPassword",
        ]);
      } else if (current === 1) {
        await form.validateFields([
          "firstName",
          "lastName",
          "phone",
          "dateOfBirth",
          "gender",
        ]);
      }
      setCurrent((c) => c + 1);
    } catch (err) {
      console.log("Validation failed on step:", current, err);
    }
  };

  const prev = () => {
    setCurrent((c) => Math.max(0, c - 1));
  };

  const steps = [
    {
      title: "Account",
      icon: <Icon icon="material-symbols:person" width="24" />,
    },
    {
      title: "Personal",
      icon: <Icon icon="material-symbols:badge" width="24" />,
    },
    {
      title: "Shop & Address",
      icon: <Icon icon="material-symbols:store" width="24" />,
    },
  ];

  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-gray-50">
      <Card className="shadow-2xl w-full max-w-[600px] rounded-2xl m-5">
        <div className="flex flex-col justify-center items-center mb-4">
          <Icon
            icon="material-symbols:store"
            width="64"
            className="text-primary-medium mb-2"
          />
          <h1 className="text-[32px] font-bold text-primary-dark">
            Shop Master
          </h1>
          <p className="text-primary-medium text-[14px]">
            Join Shop Master and start managing your inventory today
          </p>
        </div>

        <div className="mb-8">
          <Steps current={current} items={steps} />
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          preserve={true}
        >
          {/* Step 1: Account Information */}
          {current === 0 && (
            <div>
              <h3 className="text-[18px] font-semibold text-primary-dark mb-5 flex items-center">
                <Icon
                  icon="material-symbols:lock"
                  width="20"
                  className="mr-2 align-middle"
                />
                Account Credentials
              </h3>

              <Form.Item
                label={
                  <span className="font-semibold text-primary-dark">
                    Username
                  </span>
                }
                name="username"
                rules={[
                  { required: true, message: "Please enter username" },
                  { min: 3, message: "Username must be at least 3 characters" },
                ]}
                preserve={true}
              >
                <Input
                  prefix={<Icon icon="material-symbols:person" width="18" />}
                  placeholder="Choose a unique username"
                  size="large"
                  className="rounded-md"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="font-semibold text-primary-dark">
                    Email Address
                  </span>
                }
                name="email"
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
                preserve={true}
              >
                <Input
                  prefix={<Icon icon="material-symbols:mail" width="18" />}
                  placeholder="your.email@example.com"
                  size="large"
                  className="rounded-md"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="font-semibold text-primary-dark">
                        Password
                      </span>
                    }
                    name="password"
                    rules={[
                      { required: true, message: "Please enter password" },
                      {
                        min: 6,
                        message: "Password must be at least 6 characters",
                      },
                    ]}
                    preserve={true}
                  >
                    <Input.Password
                      prefix={<Icon icon="material-symbols:lock" width="18" />}
                      placeholder="Enter password"
                      size="large"
                      className="rounded-md"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="font-semibold text-primary-dark">
                        Confirm Password
                      </span>
                    }
                    name="confirmPassword"
                    dependencies={["password"]}
                    rules={[
                      { required: true, message: "Please confirm password" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Passwords do not match")
                          );
                        },
                      }),
                    ]}
                    preserve={true}
                  >
                    <Input.Password
                      prefix={
                        <Icon icon="material-symbols:lock-check" width="18" />
                      }
                      placeholder="Confirm password"
                      size="large"
                      className="rounded-md"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {current === 1 && (
            <div>
              <h3 className="text-[18px] font-semibold text-primary-dark mb-5 flex items-center">
                <Icon
                  icon="material-symbols:badge"
                  width="20"
                  className="mr-2 align-middle"
                />
                Personal Information
              </h3>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="font-semibold text-primary-dark">
                        First Name
                      </span>
                    }
                    name="firstName"
                    rules={[
                      { required: true, message: "Please enter first name" },
                    ]}
                    preserve={true}
                  >
                    <Input
                      prefix={
                        <Icon icon="material-symbols:person" width="18" />
                      }
                      placeholder="John"
                      size="large"
                      className="rounded-md"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="font-semibold text-primary-dark">
                        Last Name
                      </span>
                    }
                    name="lastName"
                    rules={[
                      { required: true, message: "Please enter last name" },
                    ]}
                    preserve={true}
                  >
                    <Input
                      prefix={
                        <Icon icon="material-symbols:person" width="18" />
                      }
                      placeholder="Doe"
                      size="large"
                      className="rounded-md"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="font-semibold text-primary-dark">
                        Phone Number
                      </span>
                    }
                    name="phone"
                    rules={[
                      { required: true, message: "Please enter phone number" },
                    ]}
                    preserve={true}
                  >
                    <Input
                      prefix={<Icon icon="material-symbols:phone" width="18" />}
                      placeholder="+1 234 567 8900"
                      size="large"
                      className="rounded-md"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="font-semibold text-primary-dark">
                        Date of Birth
                      </span>
                    }
                    name="dateOfBirth"
                    preserve={true}
                  >
                    <DatePicker
                      className="w-full rounded-md"
                      size="large"
                      placeholder="Select date"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label={
                  <span className="font-semibold text-primary-dark">
                    Gender
                  </span>
                }
                name="gender"
                preserve={true}
              >
                <Select
                  size="large"
                  placeholder="Select gender"
                  className="rounded-md"
                >
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                  <Option value="other">Other</Option>
                  <Option value="">Prefer not to say</Option>
                </Select>
              </Form.Item>
            </div>
          )}

          {/* Step 3: Shop & Address */}
          {current === 2 && (
            <div>
              <h3 className="text-[18px] font-semibold text-primary-dark mb-5 flex items-center">
                <Icon
                  icon="material-symbols:store"
                  width="20"
                  className="mr-2 align-middle"
                />
                Shop & Address Information
              </h3>

              <Form.Item
                label={
                  <span className="font-semibold text-primary-dark">
                    Shop Name
                  </span>
                }
                name="shopName"
                rules={[{ required: true, message: "Please enter shop name" }]}
                preserve={true}
              >
                <Input
                  prefix={
                    <Icon icon="material-symbols:storefront" width="18" />
                  }
                  placeholder="My Awesome Shop"
                  size="large"
                  className="rounded-md"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="font-semibold text-primary-dark">
                    Street Address
                  </span>
                }
                name="street"
                preserve={true}
              >
                <Input
                  prefix={<Icon icon="material-symbols:home" width="18" />}
                  placeholder="123 Main Street"
                  size="large"
                  className="rounded-md"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="font-semibold text-primary-dark">
                        City
                      </span>
                    }
                    name="city"
                    preserve={true}
                  >
                    <Input
                      placeholder="New York"
                      size="large"
                      className="rounded-md"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="font-semibold text-primary-dark">
                        State/Province
                      </span>
                    }
                    name="state"
                    preserve={true}
                  >
                    <Input
                      placeholder="NY"
                      size="large"
                      className="rounded-md"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="font-semibold text-primary-dark">
                        ZIP/Postal Code
                      </span>
                    }
                    name="zipCode"
                    preserve={true}
                  >
                    <Input
                      placeholder="10001"
                      size="large"
                      className="rounded-md"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="font-semibold text-primary-dark">
                        Country
                      </span>
                    }
                    name="country"
                    preserve={true}
                  >
                    <Input
                      placeholder="United States"
                      size="large"
                      className="rounded-md"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {current > 0 && (
              <Button
                size="large"
                onClick={prev}
                icon={<Icon icon="material-symbols:arrow-back" width="20" />}
              >
                Previous
              </Button>
            )}
            {current < steps.length - 1 && (
              <Button
                type="primary"
                size="large"
                onClick={next}
                className="ml-auto bg-primary-medium border-primary-medium hover:bg-primary-dark"
                icon={<Icon icon="material-symbols:arrow-forward" width="20" />}
              >
                Next
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                className="ml-auto bg-[#52c41a] border-[#52c41a] hover:bg-[#389e0d]"
                icon={<Icon icon="material-symbols:check-circle" width="20" />}
              >
                Complete Registration
              </Button>
            )}
          </div>
        </Form>

        <div className="mt-6 text-center pt-6 border-t border-[#f0f0f0]">
          <span className="text-[#666]">Already have an account? </span>
          <Link to="/auth/login" className="text-primary-medium font-semibold">
            Login here
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
