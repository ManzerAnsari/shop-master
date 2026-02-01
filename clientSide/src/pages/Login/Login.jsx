import { useState } from "react";
import { Form, Input, Button, Card, Checkbox } from "antd";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useLogin } from "../../hooks/useLogin";

const Login = () => {
  const loginMutation = useLogin();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    loginMutation.mutate(values, {
      onSettled: () => {
        setLoading(false);
      },
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full">
      <Card className="shadow-2xl w-full max-w-[500px] rounded-2xl m-5">
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
            Sign in to manage your inventory
          </p>
        </div>

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            label={
              <span className="flex justify-center items-center font-semibold text-primary-dark">
                Username or Email
              </span>
            }
            name="username"
            rules={[
              {
                required: true,
                message: "Please enter your username or email",
              },
            ]}
          >
            <Input
              prefix={<Icon icon="material-symbols:person" width="20" />}
              placeholder="Enter username or email"
              size="large"
              className="rounded-[10px]"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="flex justify-center items-center font-semibold text-primary-dark">
                Password
              </span>
            }
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password
              prefix={<Icon icon="material-symbols:lock" width="20" />}
              placeholder="Enter password"
              size="large"
              className="rounded-[10px]"
            />
          </Form.Item>

          <div className="flex justify-between mb-6">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <Link to="/auth/forgot-password" className="text-primary-medium">
              Forgot password?
            </Link>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            size="large"
            className="h-12 rounded-[10px] bg-[linear-gradient(135deg,#3E5879_0%,#213555_100%)] border-none font-semibold text-[16px]"
            icon={<Icon icon="material-symbols:login" width="20" />}
          >
            Sign In
          </Button>
        </Form>

        <div className="mt-6 text-center pt-6 border-t border-[#F0F0F0]">
          <span className="text-[#666666]">Don't have an account? </span>
          <Link
            to="/auth/register"
            className="text-primary-medium font-semibold"
          >
            Create one now
          </Link>
        </div>

        <div className="mt-4 text-center flex justify-center">
          <div className="text-[12px] text-[#999] mb-2">
            Secure login with cookie-based authentication
          </div>
          <Icon
            icon="material-symbols:shield-lock"
            width="16"
            className="text-[#52c41a]"
          />
        </div>
      </Card>
    </div>
  );
};

export default Login;
