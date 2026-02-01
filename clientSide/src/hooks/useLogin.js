// src/hooks/useLogin.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginAPI } from "../services/auth";
import { setUser, setTokens } from "../store/authSlice";

export const useLogin = () => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials) => loginAPI(credentials),
    onSuccess: (data) => {
      if (data?.user) {
        dispatch(setUser(data.user));
      }
      if (data?.accessToken) {
        dispatch(
          setTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken ?? null,
          })
        );
      }
      queryClient.invalidateQueries({ queryKey: ["me"] });
      message.success("Login successful");
      navigate("/");
    },
    onError: (error) => {
      const text =
        error?.response?.data?.message || error.message || "Login failed";
      message.error(text);
    },
  });
};
