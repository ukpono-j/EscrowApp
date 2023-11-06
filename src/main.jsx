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
