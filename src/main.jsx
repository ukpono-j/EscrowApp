import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import theme from "./ThemeContext.jsx"; // we'll create this
import "./index.css";

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered:', reg))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}

// Initialize ethereum object ONLY if it doesn't exist and we're in a browser
if (typeof window !== "undefined" && !window.ethereum) {
  try {
    Object.defineProperty(window, "ethereum", {
      value: {
        request: async ({ method, params }) => {
          // console.log(`Ethereum method called: ${method}`, params);
          return null;
        },
        on: (eventName, callback) => {
          // console.log(`Ethereum event listener added: ${eventName}`);
          return null;
        },
        isConnected: () => false,
      },
      writable: true, // Allow it to be overwritten by extensions
      configurable: true
    });
  } catch (error) {
    // console.log("Failed to define ethereum:", error);
  }
}

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <App />
      </ChakraProvider>
    </React.StrictMode>
  </BrowserRouter>
);