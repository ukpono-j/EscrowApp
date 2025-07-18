import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './store';
import theme from "./ThemeContext.jsx";
import "./index.css";

// Error Boundary for App
class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => console.log("Service Worker registered:", reg))
      .catch((err) => console.log("Service Worker registration failed:", err));
  });
}

// Initialize ethereum object
if (typeof window !== "undefined" && !window.ethereum) {
  try {
    Object.defineProperty(window, "ethereum", {
      value: {
        request: async ({ method, params }) => {
          return null;
        },
        on: (eventName, callback) => {
          return null;
        },
        isConnected: () => false,
      },
      writable: true,
      configurable: true,
    });
  } catch (error) {
    console.error("Failed to define ethereum:", error);
  }
}

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AppErrorBoundary>
    <Provider store={store}>
      <BrowserRouter>
        <React.StrictMode>
          <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <App />
          </ChakraProvider>
        </React.StrictMode>
      </BrowserRouter>
    </Provider>
  </AppErrorBoundary>
);