import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      500: "#B38939",
      600: "#8A6D2F",
    },
    gray: {
      800: "#051E2F",
      100: "#fff",
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === "dark" ? "#0a1528" : "gray.100",
        // bg: props.colorMode === "dark" ? "gray.800" : "gray.100",
        color: props.colorMode === "dark" ? "gray.100" : "gray.800",
      },
    }),
  },
});

export default theme;