import React from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Text,
  Container,
  Flex,
  Badge,
  useColorMode,
  Image,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import HeroImage from "../../assets/PhoneMockup (3).png";
import "./Hero.css";

const Hero = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  return (
    <Box
      className="hero-section"
      position="relative"
      overflow="hidden"
      bg={isDark ? "gray.900" : "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)"}
      color={isDark ? "white" : "gray.800"}
      py={{ base: "80px", sm: "100px", md: "120px", lg: "140px" }}
      px={{ base: 4, sm: 6, md: 8 }}
    >
      {/* Background pattern */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="100%"
        opacity={isDark ? "0.05" : "0.03"}
        backgroundImage="url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
        zIndex="0"
        pointerEvents="none"
      />

      <Container maxW="7xl" position="relative" zIndex="1">
        <Flex
          direction={{ base: "column", lg: "row" }}
          align="center"
          justify="space-between"
          gap={{ base: 8, lg: 12 }}
        >
          {/* Left content - Text and CTA */}
          <Box
            width={{ base: "100%", lg: "50%" }}
            textAlign={{ base: "center", lg: "left" }}
          >
            <Badge
              bg={isDark ? "#B38939" : "#192331"}
              color="white"
              px={4}
              py={2}
              borderRadius="full"
              mb={6}
              mt={10}
              boxShadow="md"
              fontSize={{ base: "sm", md: "md" }}
              letterSpacing="wide"
            >
              TRUSTED BY MILLIONS
            </Badge>

            <Text
              as="h1"
              fontSize={{ base: "2xl", sm: "3xl", md: "4xl", lg: "5xl" }}
              fontWeight="extrabold"
              lineHeight="1.2"
              bgGradient={isDark ? "linear(to-r, #e9d8b4, #B38939)" : "linear(to-r, #192331, #354458)"}
              bgClip="text"
              mb={6}
            >
              Shop Online without fear of scams
            </Text>

            <Text
              fontSize={{ base: "md", md: "lg" }}
              color={isDark ? "gray.300" : "gray.600"}
              lineHeight="1.8"
              mb={8}
              maxW={{ base: "100%", md: "80%", lg: "90%" }}
              mx={{ base: "auto", lg: "0" }}
            >
              <Text as="span" fontWeight="semibold" color="#B38939">Sylo</Text> is Nigeria’s trusted escrow platform, protecting buyers and sellers by securely holding funds until delivery is confirmed. Whether you're buying a phone on Instagram or selling goods to rural customers, our platform ensures that every transaction is handled with integrity and security, especially in the $6.7 billion off-grid market.
            </Text>

            <Flex
              gap={4}
              direction={{ base: "column", sm: "row" }}
              justify={{ base: "center", lg: "flex-start" }}
              align="center"
            >
              <Link to="/login">
                <Box
                  as="button"
                  bg="#B38939"
                  color="white"
                  px={{ base: 6, md: 8 }}
                  py={{ base: 3, md: 4 }}
                  borderRadius="full"
                  fontWeight="bold"
                  fontSize={{ base: "md", md: "lg" }}
                  transition="all 0.3s ease"
                  _hover={{
                    bg: "#a17732",
                    transform: "translateY(-2px)",
                    boxShadow: "lg",
                  }}
                  boxShadow={isDark ? "0 0 15px rgba(179, 137, 57, 0.3)" : "md"}
                  className="glow-button"
                  width={{ base: "100%", sm: "auto" }}
                >
                  Start Transactions
                </Box>
              </Link>

              <Link to="/learn-more">
                <Box
                  as="button"
                  bg="transparent"
                  color={isDark ? "white" : "#192331"}
                  px={{ base: 6, md: 8 }}
                  py={{ base: 3, md: 4 }}
                  borderRadius="full"
                  border={`2px solid ${isDark ? "white" : "#192331"}`}
                  fontWeight="semibold"
                  fontSize={{ base: "md", md: "lg" }}
                  transition="all 0.3s ease"
                  _hover={{
                    bg: isDark ? "whiteAlpha.200" : "#192331",
                    color: isDark ? "white" : "white",
                  }}
                  width={{ base: "100%", sm: "auto" }}
                >
                  Learn More
                </Box>
              </Link>
            </Flex>

            <Flex
              mt={10}
              gap={4}
              align="center"
              justify={{ base: "center", lg: "flex-start" }}
              wrap="wrap"
            >
              <Box textAlign="center" minW="100px">
                <Text fontWeight="bold" fontSize={{ base: "xl", md: "2xl" }} color={isDark ? "#B38939" : "#192331"}>
                  20M+
                </Text>
                <Text fontSize="sm" color={isDark ? "gray.400" : "gray.500"}>Active Users</Text>
              </Box>
              <Box width="1px" height="30px" bg={isDark ? "gray.700" : "gray.300"} display={{ base: "none", md: "block" }} />
              <Box textAlign="center" minW="100px">
                <Text fontWeight="bold" fontSize={{ base: "xl", md: "2xl" }} color={isDark ? "#B38939" : "#192331"}>
                  99.9%
                </Text>
                <Text fontSize="sm" color={isDark ? "gray.400" : "gray.500"}>Success Rate</Text>
              </Box>
              <Box width="1px" height="30px" bg={isDark ? "gray.700" : "gray.300"} display={{ base: "none", md: "block" }} />
              <Box textAlign="center" minW="100px">
                <Text fontWeight="bold" fontSize={{ base: "xl", md: "2xl" }} color={isDark ? "#B38939" : "#192331"}>
                  50+
                </Text>
                <Text fontSize="sm" color={isDark ? "gray.400" : "gray.500"}>Countries</Text>
              </Box>
            </Flex>
          </Box>

          {/* Right content - Enhanced Hero visualization */}
          <Box
            width={{ base: "100%", lg: "50%" }}
            position="relative"
            height={{ base: "300px", sm: "400px", md: "450px", lg: "500px" }}
          >
            <Box
              position="relative"
              width="100%"
              height="100%"
              borderRadius="2xl"
              overflow="hidden"
              boxShadow={isDark ? "0 10px 30px rgba(0,0,0,0.5)" : "0 10px 30px rgba(0,0,0,0.1)"}
              bg={isDark ? "gray.800" : "white"}
              className="platform-showcase"
            >
              {/* Device frame */}
              <Box
                position="absolute"
                top="5%"
                left="5%"
                right="5%"
                bottom="5%"
                borderRadius="xl"
                overflow="hidden"
                bg={isDark ? "gray.800" : "white"}
                border={isDark ? "1px solid #2D3748" : "1px solid #E2E8F0"}
                boxShadow={isDark ? "0 15px 30px rgba(0,0,0,0.3)" : "0 15px 30px rgba(0,0,0,0.08)"}
              >
                <Box
                  bg={isDark ? "gray.700" : "gray.100"}
                  p={2}
                  borderBottom={isDark ? "1px solid #2D3748" : "1px solid #E2E8F0"}
                  display="flex"
                  alignItems="center"
                >
                  <Flex gap={2} ml={2}>
                    <Box borderRadius="full" bg={isDark ? "red.400" : "red.500"} w={3} h={3} />
                    <Box borderRadius="full" bg={isDark ? "yellow.400" : "yellow.500"} w={3} h={3} />
                    <Box borderRadius="full" bg={isDark ? "green.400" : "green.500"} w={3} h={3} />
                  </Flex>
                  <Box
                    bg={isDark ? "gray.600" : "gray.200"}
                    borderRadius="md"
                    px={4}
                    py={1}
                    mx="auto"
                    fontSize={{ base: "xs", md: "sm" }}
                    width="60%"
                    textAlign="center"
                  >
                    app.sylo.com/dashboard
                  </Box>
                </Box>

                <Box p={{ base: 2, md: 4 }} height="calc(100% - 40px)" className="moving-content">
                  <Image
                    src={HeroImage}
                    alt="Sylo Platform"
                    width="100%"
                    height="100%"
                    objectFit="contain"
                    borderRadius="md"
                    transform="scale(1.05)"
                    transition="transform 0.3s ease"
                  />
                </Box>
              </Box>

              {/* Floating feature badges */}
              <Box
                position="absolute"
                top={{ base: "10%", md: "15%" }}
                right={{ base: "5px", md: "-20px" }}
                bg={isDark ? "gray.700" : "white"}
                borderRadius="lg"
                p={3}
                boxShadow={isDark ? "0 8px 16px rgba(0,0,0,0.3)" : "0 8px 16px rgba(0,0,0,0.1)"}
                zIndex="10"
                className="feature-badge badge-right"
                border={isDark ? "1px solid #4A5568" : "1px solid #E2E8F0"}
              >
                <Flex alignItems="center" gap={2}>
                  <Box className="icon-wrapper" bg="#B38939" p={2} borderRadius="full">
                    <Box as="span" fontSize="xl" role="img" aria-label="Shield">🔒</Box>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize={{ base: "xs", md: "sm" }}>
                      Secure Transactions
                    </Text>
                    <Text fontSize={{ base: "2xs", md: "xs" }} color={isDark ? "gray.400" : "gray.500"}>
                      End-to-end encryption
                    </Text>
                  </Box>
                </Flex>
              </Box>

              <Box
                position="absolute"
                left={{ base: "5px", md: "-20px" }}
                bottom={{ base: "15%", md: "25%" }}
                bg={isDark ? "gray.700" : "white"}
                borderRadius="lg"
                p={3}
                boxShadow={isDark ? "0 8px 16px rgba(0,0,0,0.3)" : "0 8px 16px rgba(0,0,0,0.1)"}
                zIndex="10"
                className="feature-badge badge-left"
                border={isDark ? "1px solid #4A5568" : "1px solid #E2E8F0"}
              >
                <Flex alignItems="center" gap={2}>
                  <Box className="icon-wrapper" bg="#192331" p={2} borderRadius="full">
                    <Box as="span" fontSize="xl" role="img" aria-label="Chart">📊</Box>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" fontSize={{ base: "xs", md: "sm" }}>
                      Real-time Analytics
                    </Text>
                    <Text fontSize={{ base: "2xs", md: "xs" }} color={isDark ? "gray.400" : "gray.500"}>
                      Track your transactions
                    </Text>
                  </Box>
                </Flex>
              </Box>

              {/* Activity pulse indicator */}
              <Box
                position="absolute"
                bottom="10%"
                right="15%"
                zIndex="10"
                className="pulse-indicator"
              >
                <Box
                  width={{ base: "12px", md: "15px" }}
                  height={{ base: "12px", md: "15px" }}
                  borderRadius="full"
                  bg="#4CAF50"
                  position="relative"
                  _after={{
                    content: '""',
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    borderRadius: "full",
                    bg: "#4CAF50",
                    opacity: "0.5",
                    animation: "pulse 2s infinite",
                  }}
                />
              </Box>

              {/* Stats grid */}
              <Grid
                templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
                gap={3}
                position="absolute"
                bottom={{ base: "-20px", md: "-25px" }}
                left="50%"
                transform="translateX(-50%)"
                width={{ base: "90%", md: "80%" }}
                zIndex="20"
              >
                {[
                  { value: "$2.4B+", label: "Transactions" },
                  { value: "3,400+", label: "Companies" },
                  { value: "24/7", label: "Support" },
                  { value: "99.9%", label: "Uptime" },
                ].map((stat, index) => (
                  <GridItem key={index}>
                    <Box
                      bg={isDark ? "gray.700" : "white"}
                      borderRadius="md"
                      p={3}
                      boxShadow={isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 4px 12px rgba(0,0,0,0.05)"}
                      textAlign="center"
                      className="stat-card"
                      border={isDark ? "1px solid #4A5568" : "1px solid #E2E8F0"}
                    >
                      <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color="#B38939">
                        {stat.value}
                      </Text>
                      <Text fontSize={{ base: "xs", md: "sm" }} color={isDark ? "gray.400" : "gray.500"}>
                        {stat.label}
                      </Text>
                    </Box>
                  </GridItem>
                ))}
              </Grid>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default Hero;