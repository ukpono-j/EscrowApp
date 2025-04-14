// Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link as ScrollLink, scroller } from "react-scroll";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import { Link } from "react-router-dom";
import Logo from "../assets/logo1.png";
import "./Navbar.css";
import ThemeToggle from "../ThemeToggle";
import { 
  Box, 
  Text, 
  Flex, 
  ScaleFade, 
  useColorModeValue 
} from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileMenuBg = useColorModeValue("#FAFAFA", "#1A202C");
  const accentColor = "#B38939";
  const textHoverColor = useColorModeValue("#B38939", "#E2C07C");
  const [scrollPosition, setScrollPosition] = useState(0);

  // Track scroll position to add effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (element) => {
    scroller.scrollTo(element, {
      duration: 800,
      delay: 0,
      smooth: "easeInOutQuart",
    });
  };

  // Menu item variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const menuItems = [
    { name: "About Us", to: "about", type: "scroll" },
    { name: "Services", to: "services", type: "scroll" },
    { name: "FAQ", to: "faq", type: "scroll" },
    { name: "Contact Us", to: "footer", type: "scroll" }
  ];

  // Custom style for menu item hover effect
  const menuItemStyle = {
    fontSize: "xl",
    fontWeight: "500",
    position: "relative",
    display: "inline-block",
    transition: "color 0.3s ease",
    _hover: { color: textHoverColor },
    _after: {
      content: '""',
      position: "absolute",
      width: "0%",
      height: "2px",
      bottom: "-4px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: accentColor,
      transition: "width 0.3s ease"
    }
  };

  // Style for underline animation on hover
  const hoverUnderlineStyle = {
    width: "100%"
  };

  return (
    <Box 
      className="navbar pl-5 pr-5 md:pl-[60px] md:pr-[60px] left-0 justify-between fixed z-50 top-0 pt-5 pb-5 w-[100%] flex items-center"
      bg={mobileMenuBg}
      style={{
        boxShadow: scrollPosition > 20 ? "0px 2px 20px rgba(0, 0, 0, 0.1)" : "none",
        transition: "box-shadow 0.3s ease"
      }}
    >
      <div className="font-bold cursor-pointer md:text-2xl text-2xl">
        <Link to="/" className="outline-none" onClick={() => scrollTo("home")}>
          <img src={Logo} alt="Logo Detail" className="w-[130px]" />
        </Link>
      </div>
      <div className="flex w-full justify-end">
        <Text className="hidden text-[16px] md:flex space-x-6 items-center">
          <ScrollLink className="cursor-pointer hover:text-[#B38939] transition-colors duration-300" to="about" smooth={true} duration={800}>
            About Us
          </ScrollLink>
          <ScrollLink className="cursor-pointer hover:text-[#B38939] transition-colors duration-300" to="services" smooth={true} duration={800}>
            Services
          </ScrollLink>
          <ScrollLink className="cursor-pointer hover:text-[#B38939] transition-colors duration-300" to="faq" smooth={true} duration={800}>
            FAQ
          </ScrollLink>
          <ScrollLink className="cursor-pointer hover:text-[#B38939] transition-colors duration-300" to="footer" smooth={true} duration={800}>
            Contact Us
          </ScrollLink>
          <Link
            to="/login"
            className="ml-3 flex items-center justify-center px-9 py-3 rounded-full text-white text-[17px] bg-[#B38939] border-2 border-[#B38939] transition-all duration-300 hover:bg-[#9E782F] hover:border-[#9E782F]"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="ml-3 flex items-center justify-center px-9 py-3 rounded-full text-[17px] bg-[transparent] border-2 border-[#B38939] transition-all duration-300 hover:bg-[#B38939] hover:text-white"
          >
            Register
          </Link>
        </Text>
        <div className="ml-4">
          <ThemeToggle />
        </div>
      </div>
      <div className="flex items-center">
        <Box 
          className="md:hidden flex items-center"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Box 
            as={isMenuOpen ? AiOutlineClose : AiOutlineMenu}
            className="text-3xl cursor-pointer"
            transition="transform 0.3s ease"
            transform={isMenuOpen ? "rotate(90deg)" : "rotate(0)"}
            color={isMenuOpen ? accentColor : "currentColor"}
          />
        </Box>
      </div>
      
      {/* Mobile Menu with Enhanced Styling */}
      <ScaleFade in={isMenuOpen} initialScale={0.9}>
        {isMenuOpen && (
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="md:hidden z-30 fixed top-[80px] left-0 w-full h-screen overflow-y-auto"
            position="fixed"
            style={{
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)"
            }}
          >
            <Box 
              className="menu-content py-8 px-6 flex flex-col"
              bg={useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(26, 32, 44, 0.95)")}
              h="100%"
              boxShadow="0px -4px 20px rgba(0, 0, 0, 0.1)"
            >
              {/* Decorative elements */}
              <Box position="absolute" top="5%" right="10%" w="40px" h="40px" borderRadius="full" bg={`${accentColor}30`} />
              <Box position="absolute" top="30%" left="10%" w="25px" h="25px" borderRadius="full" bg={`${accentColor}20`} />
              <Box position="absolute" bottom="20%" right="20%" w="60px" h="60px" borderRadius="full" bg={`${accentColor}15`} />
              
              {/* Menu Items with animations */}
              <Flex direction="column" align="center" justify="center" mt={6} position="relative" zIndex={2}>
                {menuItems.map((item) => (
                  <MotionBox
                    key={item.name}
                    variants={itemVariants}
                    mb={8}
                    textAlign="center"
                  >
                    {item.type === "scroll" ? (
                      <ScrollLink
                        to={item.to}
                        className="block text-xl font-medium menu-item"
                        smooth={true}
                        duration={800}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Box
                          as={Text}
                          sx={menuItemStyle}
                          _hover={{
                            color: textHoverColor,
                            _after: hoverUnderlineStyle
                          }}
                        >
                          {item.name}
                        </Box>
                      </ScrollLink>
                    ) : (
                      <Link
                        to={item.to}
                        className="block text-xl font-medium menu-item"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Box
                          as={Text}
                          sx={menuItemStyle}
                          _hover={{
                            color: textHoverColor,
                            _after: hoverUnderlineStyle
                          }}
                        >
                          {item.name}
                        </Box>
                      </Link>
                    )}
                  </MotionBox>
                ))}
                
                {/* Login and Register Buttons with animations */}
                <MotionBox 
                  variants={itemVariants} 
                  width="full" 
                  maxWidth="280px" 
                  mt={4}
                >
                  <Link
                    to="/login"
                    className="flex items-center justify-center px-7 py-3 rounded-full text-white text-[15px] bg-[#B38939] w-full button-effect"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      boxShadow: "0 6px 15px rgba(179, 137, 57, 0.3)",
                      transition: "all 0.3s ease"
                    }}
                  >
                    Log In
                  </Link>
                </MotionBox>
                
                <MotionBox 
                  variants={itemVariants} 
                  width="full" 
                  maxWidth="280px" 
                  mt={4}
                >
                  <Link
                    to="/register"
                    className="flex items-center justify-center px-7 py-3 rounded-full text-[15px] bg-transparent border-2 border-[#B38939] w-full button-effect"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      transition: "all 0.3s ease"
                    }}
                  >
                    Register
                  </Link>
                </MotionBox>
                
                {/* Social Media Icons or Additional Elements */}
                <MotionBox 
                  variants={itemVariants} 
                  mt={12} 
                  display="flex" 
                  justifyContent="center"
                  gap={6}
                >
                  <Box w={10} h={10} borderRadius="full" bg={`${accentColor}50`} display="flex" alignItems="center" justifyContent="center">
                    <Box w={6} h={6} borderRadius="full" bg={accentColor} />
                  </Box>
                  <Box w={10} h={10} borderRadius="full" bg={`${accentColor}30`} display="flex" alignItems="center" justifyContent="center">
                    <Box w={6} h={6} borderRadius="full" bg={accentColor} />
                  </Box>
                  <Box w={10} h={10} borderRadius="full" bg={`${accentColor}50`} display="flex" alignItems="center" justifyContent="center">
                    <Box w={6} h={6} borderRadius="full" bg={accentColor} />
                  </Box>
                </MotionBox>
              </Flex>
            </Box>
          </MotionBox>
        )}
      </ScaleFade>
    </Box>
  );
};

export default Navbar;