import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Provider, useDispatch } from "react-redux";
import store from "./store";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { Spin } from "antd";
import { meAPI, refreshAPI } from "./services/auth.js";
import { setUser, setTokens, getStoredRefreshToken } from "./store/authSlice.js";

const queryClient = new QueryClient();

/**
 * Gates the app until initial auth state is determined (refresh + /me or fail).
 * Prevents router from running with empty auth, which would flash redirect to login.
 */
function AuthGate({ children }) {
  const dispatch = useDispatch();

  const { data, isSuccess, isError, isPending } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      let accessToken = store.getState().auth.accessToken;
      const refreshToken =
        getStoredRefreshToken() || store.getState().auth.refreshToken;
      if (!accessToken && refreshToken) {
        const tokens = await refreshAPI(refreshToken);
        dispatch(
          setTokens({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken ?? refreshToken,
          })
        );
      } else if (!accessToken) {
        throw new Error("No auth");
      }
      return meAPI();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (isSuccess && data) {
      dispatch(setUser(data));
    }
  }, [isSuccess, data, dispatch]);

  // Don't render router until we know auth state – avoids flash to login on reload
  if (isPending) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#F5EFE7",
          gap: 16,
        }}
      >
        <Spin size="large" />
        <span style={{ color: "#3E5879", fontWeight: 500 }}>
          Loading...
        </span>
      </div>
    );
  }

  return children;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthGate>
          <App />
        </AuthGate>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
