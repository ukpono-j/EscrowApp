import React, { useState, useEffect, useRef } from "react";
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
  useColorModeValue,
  Image,
} from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [navbarHeight, setNavbarHeight] = useState(60);
  const navbarRef = useRef(null);

  const mobileMenuBg = useColorModeValue("#FAFAFA", "#1A202C");
  const menuBgColor = useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(26, 32, 44, 0.95)");
  const textHoverColor = useColorModeValue("#B38939", "#E2C07C");
  const accentColor = "#B38939";

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.offsetHeight;
        setNavbarHeight(height);
      }
    };

    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    return () => window.removeEventListener("resize", updateNavbarHeight);
  }, []);

  const scrollTo = (element) => {
    scroller.scrollTo(element, {
      duration: 800,
      delay: 0,
      smooth: "easeInOutQuart",
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const menuItems = [
    { name: "About Us", to: "about", type: "scroll" },
    { name: "Services", to: "services", type: "scroll" },
    { name: "FAQ", to: "faq", type: "scroll" },
    { name: "Contact Us", to: "footer", type: "scroll" },
  ];

  const menuItemStyle = {
    fontSize: ["md", "lg", "xl"],
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
      transition: "width 0.3s ease",
    },
  };

  const hoverUnderlineStyle = {
    width: "100%",
  };

  return (
    <Box
      ref={navbarRef}
      className="navbar"
      pl={["12px", "16px", "24px", "40px"]}
      pr={["12px", "16px", "24px", "40px"]}
      left={0}
      justifyContent="space-between"
      position="fixed"
      zIndex={50}
      top={0}
      pt={["12px", "14px", "16px"]}
      pb={["12px", "14px", "16px"]}
      w="100%"
      display="flex"
      alignItems="center"
      bg={mobileMenuBg}
      style={{
        boxShadow: scrollPosition > 20 ? "0px 2px 20px rgba(0, 0, 0, 0.1)" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <Box fontWeight="bold" cursor="pointer" fontSize={["xl", "2xl", "2xl"]}>
        <Link to="/" className="outline-none" onClick={() => scrollTo("home")}>
          <Image
            src={Logo}
            alt="Sylo Logo"
            w={["clamp(100px, 30vw, 120px)", "clamp(120px, 25vw, 140px)", "clamp(140px, 20vw, 160px)", "clamp(150px, 15vw, 170px)"]}
            maxH={["clamp(28px, 10vw, 32px)", "clamp(32px, 8vw, 36px)", "clamp(36px, 6vw, 40px)", "clamp(38px, 5vw, 44px)"]}
            objectFit="contain"
            className="logo-responsive"
          />
        </Link>
      </Box>
      <Box flex="1" display="flex" justifyContent="flex-end" alignItems="center">
        <Text
          className="desktop-menu"
          fontSize={["sm", "md", "16px"]}
          sx={{ "--space-x": ["4px", "6px", "8px", "10px"] }}
          display={["none", "none", "none", "flex"]} // Hide on mobile, show on lg (1024px) and above
          alignItems="center"
          style={{ gap: "var(--space-x)" }}
        >
          <ScrollLink
            className="cursor-pointer hover:text-[#B38939] transition-colors duration-300"
            to="about"
            smooth={true}
            duration={800}
          >
            About Us
          </ScrollLink>
          <ScrollLink
            className="cursor-pointer hover:text-[#B38939] transition-colors duration-300"
            to="services"
            smooth={true}
            duration={800}
          >
            Services
          </ScrollLink>
          <ScrollLink
            className="cursor-pointer hover:text-[#B38939] transition-colors duration-300"
            to="faq"
            smooth={true}
            duration={800}
          >
            FAQ
          </ScrollLink>
          <ScrollLink
            className="cursor-pointer hover:text-[#B38939] transition-colors duration-300"
            to="footer"
            smooth={true}
            duration={800}
          >
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
        <Box ml={["2", "3", "4"]}>
          <ThemeToggle />
        </Box>
      </Box>
      <Box display="flex" alignItems="center">
        <Box
          className="mobile-menu-button"
          display={["flex", "flex", "flex", "none"]} // Show on mobile, hide on lg (1024px) and above
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Box
            as={isMenuOpen ? AiOutlineClose : AiOutlineMenu}
            className="text-[clamp(48px, 16vw, 52px)] cursor-pointer" // Increased size for mobile
            transition="transform 0.3s ease"
            transform={isMenuOpen ? "rotate(90deg)" : "rotate(0)"}
            color={isMenuOpen ? accentColor : "currentColor"}
          />
        </Box>
      </Box>

      <ScaleFade in={isMenuOpen} initialScale={0.9}>
        {isMenuOpen && (
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="lg:hidden z-30 fixed left-0 w-full"
            style={{
              top: `${navbarHeight}px`,
              height: `calc(100vh - ${navbarHeight}px)`,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
            overflowY="auto"
          >
            <Box
              className="menu-content py-[clamp(20px, 6vw, 28px)] px-[clamp(12px, 4vw, 20px)] flex flex-col"
              bg={menuBgColor}
              h="100%"
              boxShadow="0px -4px 20px rgba(0, 0, 0, 0.1)"
            >
              <Box
                position="absolute"
                top="5%"
                right="10%"
                w={["24px", "32px"]}
                h={["24px", "32px"]}
                borderRadius="full"
                bg={`${accentColor}30`}
                zIndex={1}
              />
              <Box
                position="absolute"
                top="30%"
                left="10%"
                w={["16px", "20px"]}
                h={["16px", "20px"]}
                borderRadius="full"
                bg={`${accentColor}20`}
                zIndex={1}
              />
              <Box
                position="absolute"
                bottom="20%"
                right="20%"
                w={["32px", "48px"]}
                h={["32px", "48px"]}
                borderRadius="full"
                bg={`${accentColor}15`}
                zIndex={1}
              />

              <Flex direction="column" align="center" justify="center" mt={6} position="relative" zIndex={2}>
                {menuItems.map((item) => (
                  <MotionBox key={item.name} variants={itemVariants} mb={[6, 8]} textAlign="center">
                    {item.type === "scroll" ? (
                      <ScrollLink
                        to={item.to}
                        className="block text-[clamp(16px, 4vw, 18px)] font-medium menu-item"
                        smooth={true}
                        duration={800}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Box
                          as={Text}
                          sx={menuItemStyle}
                          _hover={{
                            color: textHoverColor,
                            _after: hoverUnderlineStyle,
                          }}
                        >
                          {item.name}
                        </Box>
                      </ScrollLink>
                    ) : (
                      <Link
                        to={item.to}
                        className="block text-[clamp(16px, 4vw, 18px)] font-medium menu-item"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Box
                          as={Text}
                          sx={menuItemStyle}
                          _hover={{
                            color: textHoverColor,
                            _after: hoverUnderlineStyle,
                          }}
                        >
                          {item.name}
                        </Box>
                      </Link>
                    )}
                  </MotionBox>
                ))}

                <MotionBox variants={itemVariants} width="full" maxWidth={["clamp(200px, 70vw, 260px)", "280px"]} mt={4}>
                  <Link
                    to="/login"
                    className="flex items-center justify-center px-7 py-3 rounded-full text-white text-[15px] bg-[#B38939] w-full button-effect"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      boxShadow: "0 6px 15px rgba(179, 137, 57, 0.3)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    Log In
                  </Link>
                </MotionBox>

                <MotionBox variants={itemVariants} width="full" maxWidth={["clamp(200px, 70vw, 260px)", "280px"]} mt={4}>
                  <Link
                    to="/register"
                    className="flex items-center justify-center px-7 py-3 rounded-full text-[15px] bg-transparent border-2 border-[#B38939] w-full button-effect"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      transition: "all 0.3s ease",
                    }}
                  >
                    Register
                  </Link>
                </MotionBox>

                <MotionBox variants={itemVariants} mt={[8, 12]} display="flex" justifyContent="center" gap={[4, 6]}>
                  <Box
                    w={["8px", "10px"]}
                    h={["8px", "10px"]}
                    borderRadius="full"
                    bg={`${accentColor}50`}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box w={["4px", "6px"]} h={["4px", "6px"]} borderRadius="full" bg={accentColor} />
                  </Box>
                  <Box
                    w={["8px", "10px"]}
                    h={["8px", "10px"]}
                    borderRadius="full"
                    bg={`${accentColor}30`}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box w={["4px", "6px"]} h={["4px", "6px"]} borderRadius="full" bg={accentColor} />
                  </Box>
                  <Box
                    w={["8px", "10px"]}
                    h={["8px", "10px"]}
                    borderRadius="full"
                    bg={`${accentColor}50`}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box w={["4px", "6px"]} h={["4px", "6px"]} borderRadius="full" bg={accentColor} />
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