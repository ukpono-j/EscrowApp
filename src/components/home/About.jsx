import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Box, Image, Text, Flex, Heading, VStack, useColorMode } from "@chakra-ui/react";
import AboutImage from "../../assets/PhoneMockup (1).png";
import "./About.css";

const About = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const aboutSection = document.getElementById("about");
      if (aboutSection) {
        const rect = aboutSection.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
          setIsVisible(true);
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Box
      as="section"
      id="about"
      className="about-section"
      py={{ base: 12, md: 20, lg: 24 }}
      bg={isDark ? "linear-gradient(to bottom, #1a202c, #2d3748)" : "linear-gradient(to bottom, #f8f9fa, #e9ecef)"}
      color={isDark ? "white" : "gray.800"}
    >
      <Box className="about-container" maxW="7xl" mx="auto" px={{ base: 4, sm: 6, md: 8 }}>
        <Flex
          className="about-grid"
          direction={{ base: "column", lg: "row" }}
          align="center"
          gap={{ base: 8, lg: 12 }}
        >
          {/* Image Column */}
          <Box
            className={`about-image-column ${isVisible ? "animate-in" : ""}`}
            w={{ base: "100%", lg: "50%" }}
            order={{ base: 1, lg: 0 }}
          >
            <Box className="image-wrapper" position="relative" maxW={{ base: "400px", md: "500px" }} mx="auto">
              <Box
                className="image-border"
                borderRadius="xl"
                overflow="hidden"
                boxShadow={{ base: "lg", md: "xl" }}
                bg={isDark ? "gray.800" : "white"}
                border={isDark ? "1px solid #2D3748" : "1px solid #E2E8F0"}
              >
                <Box p={{ base: 3, md: 4 }} className="moving-content">
                  <Image
                    src={AboutImage}
                    alt="About Sylo Platform"
                    w="100%"
                    h={{ base: "300px", sm: "400px", md: "500px" }}
                    objectFit="contain"
                    borderRadius="md"
                  />
                </Box>
              </Box>
              <Box className="accent-shape top-left" borderColor="#B38939" />
              <Box className="accent-shape bottom-right" borderColor="#B38939" />
              <Box className="glow-effect" bg={isDark ? "radial-gradient(circle at 50% 50%, rgba(179, 137, 57, 0.3), transparent 70%)" : "radial-gradient(circle at 50% 50%, rgba(179, 137, 57, 0.2), transparent 70%)"} />
              <Box className="floating-element gold-circle" />
              <Box className="floating-element blue-square" />
            </Box>
          </Box>

          {/* Content Column */}
          <Box
            className={`about-content-column ${isVisible ? "animate-in" : ""}`}
            w={{ base: "100%", lg: "50%" }}
            textAlign={{ base: "center", lg: "left" }}
          >
            <VStack className="content-wrapper" spacing={6} align={{ base: "center", lg: "start" }} maxW="600px" mx="auto">
              <Box className="heading-container">
                <Text
                  className="subheading"
                  fontSize={{ base: "sm", md: "md" }}
                  color="#B38939"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  fontWeight="bold"
                >
                  About Sylo:
                </Text>
                <Heading
                  as="h2"
                  className="main-heading"
                  fontSize={{ base: "2xl", sm: "3xl", md: "4xl" }}
                  fontWeight="extrabold"
                  lineHeight="1.2"
                  color={isDark ? "white" : "gray.800"}
                >
                  Built for Trust, Powered by Security
                </Heading>
                <Box
                  className="heading-accent"
                  bg={isDark ? "linear-gradient(to right, #B38939, #D5AF6D)" : "linear-gradient(to right, #B38939, #F2D794)"}
                />
              </Box>

              <VStack className="text-content" spacing={4} fontSize={{ base: "md", md: "lg" }} color={isDark ? "gray.300" : "gray.600"} lineHeight="1.8">
                <Text>
                  Sylo bridges the gap between buyers and sellers in Nigeria. Our escrow process holds funds safely until delivery is confirmed, eliminating fraud and fear. From freelancers to small businesses, Sylo gives everyone a fair chance in digital trade.
                </Text>
                <Box className="highlight-box" borderLeft="3px solid #B38939" pl={4} py={4} my={6}>
                  <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="semibold" color={isDark ? "gray.200" : "gray.700"}>
                    With Sylo, no one gets paid until the job is done right.
                  </Text>
                </Box>
              </VStack>

              <Link to="/register">
                <Box
                  as="button"
                  className="gold-button"
                  bg={isDark ? "linear-gradient(to right, #B38939, #D5AF6D)" : "#B38939"}
                  color="white"
                  px={{ base: 6, md: 8 }}
                  py={{ base: 3, md: 4 }}
                  borderRadius="full"
                  fontWeight="bold"
                  fontSize={{ base: "md", md: "lg" }}
                  boxShadow={isDark ? "0 0 15px rgba(179, 137, 57, 0.3)" : "md"}
                  transition="all 0.3s ease"
                  _hover={{ bg: isDark ? "#a17732" : "#a17732", transform: "translateY(-2px)", boxShadow: "lg" }}
                  _focus={{ outline: "3px solid #B38939", outlineOffset: "4px" }}
                  w={{ base: "100%", sm: "auto" }}
                >
                  Get Started now
                </Box>
              </Link>
            </VStack>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default About;