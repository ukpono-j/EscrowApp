import React, { useState, useEffect, useRef } from "react";
import { Link as ScrollLink, scroller } from "react-scroll";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import { Link } from "react-router-dom";
import Logo from "../assets/logo1.png";
import "./Navbar.css";
// import ThemeToggle from "../ThemeToggle";
import {
  Box,
  Text,
  Flex,
  ScaleFade,
  useColorModeValue,
  Image,
  Button,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [navbarHeight, setNavbarHeight] = useState(60);
  const [isScrolled, setIsScrolled] = useState(false);
  const navbarRef = useRef(null);

  // Enhanced color scheme
  const bgColor = useColorModeValue(
    "rgba(255, 255, 255, 0.95)",
    "rgba(26, 32, 44, 0.95)"
  );
  const scrolledBgColor = useColorModeValue(
    "rgba(255, 255, 255, 0.98)",
    "rgba(26, 32, 44, 0.98)"
  );
  const mobileMenuBg = useColorModeValue("#fff", "#1A202C");
  const textColor = useColorModeValue("#2D3748", "#E2E8F0");
  const textHoverColor = useColorModeValue("#B38939", "#E2C07C");
  const accentColor = "#B38939";
  const buttonHoverColor = "#9E782F";

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollPosition(currentScrollY);
      setIsScrolled(currentScrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        setNavbarHeight(navbarRef.current.offsetHeight);
      }
    };

    updateNavbarHeight();
    const resizeObserver = new ResizeObserver(updateNavbarHeight);
    if (navbarRef.current) {
      resizeObserver.observe(navbarRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const scrollTo = (element) => {
    scroller.scrollTo(element, {
      duration: 800,
      delay: 0,
      smooth: "easeInOutQuart",
      offset: -navbarHeight,
    });
  };

  const handleMenuItemClick = (element) => {
    setIsMenuOpen(false);
    if (element) {
      setTimeout(() => scrollTo(element), 300);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const menuItems = [
    { name: "About Us", to: "about", type: "scroll" },
    { name: "Services", to: "services", type: "scroll" },
    { name: "FAQ", to: "faq", type: "scroll" },
    { name: "Contact Us", to: "footer", type: "scroll" },
  ];

  return (
    <>
      <Box
        ref={navbarRef}
        className="navbar"
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
        w="100%"
        px={["16px", "20px", "24px", "32px", "40px"]}
        py={["12px", "14px", "16px", "18px"]}
        bg={isScrolled ? scrolledBgColor : bgColor}
        backdropFilter="blur(10px)"
        WebkitBackdropFilter="blur(10px)"
        borderBottom={isScrolled ? "1px solid" : "none"}
        borderBottomColor={useColorModeValue("rgba(0,0,0,0.1)", "rgba(255,255,255,0.1)")}
        boxShadow={isScrolled ? "0 4px 20px rgba(0, 0, 0, 0.1)" : "none"}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <Flex align="center" justify="space-between" maxW="1400px" mx="auto">
          {/* Logo */}
          <Box cursor="pointer" flexShrink={0}>
            <Link to="/" onClick={() => scrollTo("home")}>
              <Image
                src={Logo}
                alt="Sylo Escrow Logo"
                h={["32px", "36px", "40px", "44px", "48px"]}
                w="auto"
                objectFit="contain"
                transition="all 0.3s ease"
                _hover={{ transform: "scale(1.05)" }}
                loading="eager"
              />
            </Link>
          </Box>

          {/* Desktop Menu */}
          <Flex
            display={["none", "none", "none", "flex"]}
            align="center"
            gap={["20px", "24px", "28px", "32px"]}
            flex={1}
            justify="center"
            ml={8}
          >
            {menuItems.map((item) => (
              <ScrollLink
                key={item.name}
                to={item.to}
                smooth={true}
                duration={800}
                offset={-navbarHeight}
                className="navbar-link"
                spy={true}
                activeClass="active"
              >
                <Text
                  fontSize={["14px", "15px", "16px"]}
                  fontWeight="500"
                  color={textColor}
                  cursor="pointer"
                  position="relative"
                  transition="all 0.3s ease"
                  _hover={{
                    color: textHoverColor,
                    transform: "translateY(-1px)",
                  }}
                  _after={{
                    content: '""',
                    position: "absolute",
                    bottom: "-4px",
                    left: "0",
                    width: "0",
                    height: "2px",
                    bg: accentColor,
                    transition: "width 0.3s ease",
                  }}
                  sx={{
                    "&:hover::after": {
                      width: "100%",
                    },
                  }}
                >
                  {item.name}
                </Text>
              </ScrollLink>
            ))}
          </Flex>

          {/* Desktop Auth Buttons & Theme Toggle */}
          <Flex
            display={["none", "none", "none", "flex"]}
            align="center"
            gap={["12px", "16px"]}
            ml={4}
          >
            {/* <ThemeToggle /> */}
            <Button
              as={Link}
              to="/login"
              size="sm"
              px={["20px", "24px"]}
              py={["8px", "10px"]}
              borderRadius="full"
              bg={accentColor}
              color="white"
              fontSize={["14px", "15px"]}
              fontWeight="500"
              border="2px solid"
              borderColor={accentColor}
              transition="all 0.3s ease"
              _hover={{
                bg: buttonHoverColor,
                borderColor: buttonHoverColor,
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(179, 137, 57, 0.3)",
              }}
              _active={{
                transform: "translateY(0)",
              }}
            >
              Log In
            </Button>
            <Button
              as={Link}
              to="/register"
              size="sm"
              px={["20px", "24px"]}
              py={["8px", "10px"]}
              borderRadius="full"
              bg="transparent"
              color={textColor}
              fontSize={["14px", "15px"]}
              fontWeight="500"
              border="2px solid"
              borderColor={accentColor}
              transition="all 0.3s ease"
              _hover={{
                bg: accentColor,
                color: "white",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(179, 137, 57, 0.3)",
              }}
              _active={{
                transform: "translateY(0)",
              }}
            >
              Register
            </Button>
          </Flex>

          {/* Mobile Menu Button & Theme Toggle */}
          <Flex
            display={["flex", "flex", "flex", "none"]}
            align="center"
            gap={["12px", "16px"]}
          >
            {/* <ThemeToggle /> */}
            <Button
              variant="ghost"
              size="sm"
              p={2}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              color={isMenuOpen ? accentColor : textColor}
              transition="all 0.3s ease"
              _hover={{
                bg: `${accentColor}20`,
                transform: "scale(1.1)",
              }}
              _active={{
                transform: "scale(0.95)",
              }}
            >
              <Box
                as={isMenuOpen ? AiOutlineClose : AiOutlineMenu}
                w={["24px", "28px"]}
                h={["24px", "28px"]}
                transition="all 0.3s ease"
                transform={isMenuOpen ? "rotate(90deg)" : "rotate(0)"}
              />
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <MotionBox
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            position="fixed"
            top={`${navbarHeight}px`}
            left={0}
            right={0}
            bottom={0}
            zIndex={999}
            bg={mobileMenuBg}
            backdropFilter="blur(10px)"
            WebkitBackdropFilter="blur(10px)"
            display={["block", "block", "block", "none"]}
            overflowY="auto"
          >
            <Box
              px={["20px", "24px"]}
              py={["32px", "40px"]}
              maxW="400px"
              mx="auto"
              h="100%"
              position="relative"
            >
              {/* Decorative Elements */}
              <Box
                position="absolute"
                top="10%"
                right="10%"
                w={["40px", "48px"]}
                h={["40px", "48px"]}
                borderRadius="full"
                bg={`${accentColor}15`}
                zIndex={1}
              />
              <Box
                position="absolute"
                top="25%"
                left="5%"
                w={["24px", "32px"]}
                h={["24px", "32px"]}
                borderRadius="full"
                bg={`${accentColor}10`}
                zIndex={1}
              />
              <Box
                position="absolute"
                bottom="25%"
                right="15%"
                w={["56px", "64px"]}
                h={["56px", "64px"]}
                borderRadius="full"
                bg={`${accentColor}08`}
                zIndex={1}
              />

              <Flex
                direction="column"
                align="center"
                justify="center"
                h="100%"
                gap={["24px", "32px"]}
                position="relative"
                zIndex={2}
              >
                {/* Menu Items */}
                {menuItems.map((item, index) => (
                  <MotionBox
                    key={item.name}
                    variants={itemVariants}
                    custom={index}
                    w="100%"
                    textAlign="center"
                  >
                    <ScrollLink
                      to={item.to}
                      smooth={true}
                      duration={800}
                      offset={-navbarHeight}
                      onClick={() => handleMenuItemClick(item.to)}
                    >
                      <Text
                        fontSize={["18px", "20px"]}
                        fontWeight="600"
                        color={textColor}
                        cursor="pointer"
                        transition="all 0.3s ease"
                        _hover={{
                          color: textHoverColor,
                          transform: "translateY(-2px)",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {item.name}
                      </Text>
                    </ScrollLink>
                  </MotionBox>
                ))}

                {/* Auth Buttons */}
                <MotionBox
                  variants={itemVariants}
                  w="100%"
                  maxW="280px"
                  mt={["20px", "32px"]}
                >
                  <Button
                    as={Link}
                    to="/login"
                    w="100%"
                    size="lg"
                    py={["12px", "16px"]}
                    borderRadius="full"
                    bg={accentColor}
                    color="white"
                    fontSize={["16px", "17px"]}
                    fontWeight="600"
                    border="2px solid"
                    borderColor={accentColor}
                    transition="all 0.3s ease"
                    boxShadow="0 6px 20px rgba(179, 137, 57, 0.3)"
                    onClick={() => setIsMenuOpen(false)}
                    _hover={{
                      bg: buttonHoverColor,
                      borderColor: buttonHoverColor,
                      transform: "translateY(-3px)",
                      boxShadow: "0 8px 25px rgba(179, 137, 57, 0.4)",
                    }}
                  >
                    Log In
                  </Button>
                </MotionBox>

                <MotionBox variants={itemVariants} w="100%" maxW="280px">
                  <Button
                    as={Link}
                    to="/register"
                    w="100%"
                    size="lg"
                    py={["12px", "16px"]}
                    borderRadius="full"
                    bg="transparent"
                    color={textColor}
                    fontSize={["16px", "17px"]}
                    fontWeight="600"
                    border="2px solid"
                    borderColor={accentColor}
                    transition="all 0.3s ease"
                    onClick={() => setIsMenuOpen(false)}
                    _hover={{
                      bg: accentColor,
                      color: "white",
                      transform: "translateY(-3px)",
                      boxShadow: "0 8px 25px rgba(179, 137, 57, 0.3)",
                    }}
                  >
                    Register
                  </Button>
                </MotionBox>

                {/* Decorative Dots */}
                <MotionBox
                  variants={itemVariants}
                  display="flex"
                  justify="center"
                  gap={["12px", "16px"]}
                  mt={["24px", "32px"]}
                >
                  {[0, 1, 2].map((index) => (
                    <Box
                      key={index}
                      w={["10px", "12px"]}
                      h={["10px", "12px"]}
                      borderRadius="full"
                      bg={`${accentColor}${index === 1 ? "60" : "30"}`}
                      transition="all 0.3s ease"
                    />
                  ))}
                </MotionBox>
              </Flex>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;