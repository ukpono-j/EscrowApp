import { extendTheme } from "@chakra-ui/react";

// Define custom theme colors (optional)
const theme = extendTheme({
  config: {
    initialColorMode: "dark", // or 'dark'
    useSystemColorMode: false,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === "dark" ? "#1A202C" : "#FAFAFA",
        color: props.colorMode === "dark" ? "#FAFAFA" : "#1A202C",
      },
    }),
  },
});

export default theme;
