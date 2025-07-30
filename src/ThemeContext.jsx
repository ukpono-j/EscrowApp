import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      500: "#B38939", // Primary brand color (used in sidebar)
      600: "#8A6D2F", // Secondary brand color (gradient)
    },
    gray: {
      800: "#051E2F", // Dark background for sidebar and body
      100: "#FAFAFA", // Light background
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === "dark" ? "gray.800" : "gray.100",
        color: props.colorMode === "dark" ? "gray.100" : "gray.800",
      },
    }),
  },
});

export default theme;