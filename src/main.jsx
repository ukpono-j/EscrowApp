import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { HistoryRouter, history } from "./utils/navigate"; // Import HistoryRouter and history
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
      .catch((err) => console.error("Service Worker registration failed:", err));
  });
}

// Initialize ethereum object
if (typeof window !== "undefined" && !window.ethereum) {
  try {
    Object.defineProperty(window, "ethereum", {
      value: {
        request: async ({ method, params }) => {
          console.warn(`Ethereum request (${method}) not handled by mock`);
          return null;
        },
        on: (eventName, callback) => {
          console.warn(`Ethereum event (${eventName}) not handled by mock`);
          return null;
        },
        isConnected: () => false,
      },
      writable: true,
      configurable: true,
    });
    console.log("Mock ethereum object defined");
  } catch (error) {
    console.error("Failed to define ethereum:", error);
  }
}

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AppErrorBoundary>
    <Provider store={store}>
      <HistoryRouter history={history}>
        <React.StrictMode>
          <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <App />
          </ChakraProvider>
        </React.StrictMode>
      </HistoryRouter>
    </Provider>
  </AppErrorBoundary>
);