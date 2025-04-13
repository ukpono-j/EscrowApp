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
      icon={isDark ? <SunIcon /> : <MoonIcon />}
      onClick={toggleColorMode}
      size="md"
      variant="ghost"
      colorScheme={isDark ? "#D6AE56" : "blue"}
      borderRadius="full"
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.95, rotate: 20 }}
      transition={{ type: "spring", stiffness: 300 }}
    />
  );
};

export default ThemeToggle;
