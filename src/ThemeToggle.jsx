import { useColorMode, IconButton } from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";

const MotionIconButton = motion(IconButton);

const ThemeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === "dark";

  return (
    <MotionIconButton
      aria-label="Toggle theme"
      icon={isDark ? <SunIcon boxSize={["6", "6", "6"]} /> : <MoonIcon boxSize={["6", "6", "6"]} />}
      onClick={toggleColorMode}
      size="md" // Standardized size across breakpoints
      variant="ghost"
      color="brand.500"
      borderRadius="full"
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.95, rotate: 20 }}
      transition={{ type: "spring", stiffness: 300 }}
      p={2} // Remove padding to minimize space
      minW="auto" // Prevent button from taking extra width
    />
  );
};

export default ThemeToggle;