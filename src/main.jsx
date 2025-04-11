if (typeof window !== "undefined" && !window.ethereum) {
  Object.defineProperty(window, "ethereum", {
    value: {
      request: async ({ method, params }) => {
        console.log(`Ethereum method called: ${method}`, params);
        return null;
      },
    },
    writable: false,
  });
}


import React from "react";
import ReactDOM from "react-dom";
import App from "./App.jsx";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { createRoot } from "react-dom/client"; // Update the import statement

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <React.StrictMode>
      <ChakraProvider>
        <App />
      </ChakraProvider>
    </React.StrictMode>
  </BrowserRouter>
);

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker registered:', reg))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}

// if (!window.ethereum) {
//   Object.defineProperty(window, "ethereum", {
//     value: yourEthereumObject,
//     writable: false
//   });
// }
