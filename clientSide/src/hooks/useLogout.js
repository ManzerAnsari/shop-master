import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useDispatch } from "react-redux";
import { logoutAPI } from "../services/auth";
import { logout, getStoredRefreshToken } from "../store/authSlice";
import store from "../store";

export const useLogout = () => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: () => {
      const refreshToken =
        store.getState().auth.refreshToken ?? getStoredRefreshToken();
      return logoutAPI(refreshToken);
    },
    onSuccess: () => {
      dispatch(logout());
      queryClient.clear();
      message.success("Logged out");
    },
    onError: () => {
      dispatch(logout());
      queryClient.clear();
      message.success("Logged out");
    },
  });
};
