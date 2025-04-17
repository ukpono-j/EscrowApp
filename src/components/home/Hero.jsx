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
  GridItem
} from "@chakra-ui/react";
import HeroImage from "../../assets/hero.png";
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
      py={{base: "130px", md: "140px", lg: "160px"}}
      px={{base: 4, md: 6, lg: 8}}
    >
      {/* Background elements */}
      <Box 
        position="absolute" 
        top="0" 
        right="0" 
        width="100%" 
        height="100%" 
        opacity="0.03"
        backgroundImage="url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
        zIndex="0"
        pointerEvents="none"
      />
      
      <Container maxW="1440px" position="relative" zIndex="1">
        <Flex
          direction={{ base: "column", lg: "row" }}
          align="center"
          justify="space-between"
          position="relative"
        >
          {/* Left content - Text and CTA */}
          <Box 
            width={{ base: "100%", lg: "45%" }}
            pr={{ base: 0, lg: 10 }}
            mb={{ base: 12, lg: 0 }}
            textAlign={{ base: "left", lg: "left" }}
          >
            <Badge 
              bg={isDark ? "#B38939" : "#192331"} 
              color="white" 
              px={3} 
              py={1} 
              borderRadius="full" 
              mb={4}
              boxShadow="md"
              fontSize="sm"
              letterSpacing="0.5px"
            >
              TRUSTED BY MILLIONS
            </Badge>
            
            <Text
              as="h1"
              fontSize={{ base: "36px", sm: "44px", md: "52px", lg: "60px" }}
              fontWeight="900"
              lineHeight="1.1"
              bgGradient={isDark ? "linear(to-r, #e9d8b4, #B38939)" : "linear(to-r, #192331, #354458)"}
              bgClip="text"
              mb={6}
              letterSpacing="-0.02em"
            >
              Secure Your Deals with Confidence
            </Text>
            
            <Text
              fontSize={{ base: "16px", md: "18px" }}
              color={isDark ? "gray.300" : "#4A5568"}
              lineHeight="1.7"
              fontWeight="400"
              mb={8}
              maxW={{ base: "100%", md: "90%", lg: "100%" }}
              // mx={{ base: "auto", lg: "0" }}
            >
              Experience peace of mind with <Text as="span" fontWeight="600" color="#B38939">Sylo</Text>, 
              your trusted partner for secure and transparent business dealings. Our platform ensures that 
              every transaction is handled with integrity, providing a seamless experience for both buyers and sellers.
            </Text>
            
            <Flex 
              gap={4} 
              direction={{ base: "column", sm: "row" }}
              justify={{ base: "flef-start", lg: "flex-start" }}
              align="center"
            >
              <Link to="/login">
                <Box
                  as="button"
                  bg="#B38939"
                  color="white"
                  px={8}
                  py={4}
                  borderRadius="full"
                  fontWeight="700"
                  fontSize={{ base: "16px", md: "18px" }}
                  transition="all 0.3s ease"
                  _hover={{
                    bg: "#a17732",
                    transform: "translateY(-2px)",
                    boxShadow: "lg",
                  }}
                  boxShadow={isDark ? "0 0 20px rgba(179, 137, 57, 0.4)" : "md"}
                  className="glow-button"
                  width={{ base: "full", sm: "auto" }}
                >
                  Start Transactions
                </Box>
              </Link>
              
              <Link to="/learn-more">
                <Box
                  as="button"
                  bg="transparent"
                  color={isDark ? "white" : "#192331"}
                  px={8}
                  py={4}
                  borderRadius="full"
                  border={`2px solid ${isDark ? "white" : "#192331"}`}
                  fontWeight="600"
                  fontSize={{ base: "16px", md: "18px" }}
                  transition="all 0.3s ease"
                  _hover={{
                    bg: isDark ? "whiteAlpha.200" : "#192331",
                    color: isDark ? "white" : "white",
                  }}
                  width={{ base: "full", sm: "auto" }}
                >
                  Learn More
                </Box>
              </Link>
            </Flex>
            
            <Flex 
              mt={10} 
              gap={6} 
              align="center"
              justify={{ base: "flex-start", lg: "flex-start" }}
              display={{ base: "none", md: "flex" }}
            >
              <Box textAlign="center">
                <Text fontWeight="700" fontSize="24px" color={isDark ? "#B38939" : "#192331"}>20M+</Text>
                <Text fontSize="14px" color={isDark ? "gray.400" : "#4A5568"}>Active Users</Text>
              </Box>
              <Box width="1px" height="30px" bg={isDark ? "gray.700" : "#CBD5E0"} />
              <Box textAlign="center">
                <Text fontWeight="700" fontSize="24px" color={isDark ? "#B38939" : "#192331"}>99.9%</Text>
                <Text fontSize="14px" color={isDark ? "gray.400" : "#4A5568"}>Success Rate</Text>
              </Box>
              <Box width="1px" height="30px" bg={isDark ? "gray.700" : "#CBD5E0"} />
              <Box textAlign="center">
                <Text fontWeight="700" fontSize="24px" color={isDark ? "#B38939" : "#192331"}>50+</Text>
                <Text fontSize="14px" color={isDark ? "gray.400" : "#4A5568"}>Countries</Text>
              </Box>
            </Flex>
          </Box>
          
          {/* Right content - Enhanced Hero visualization */}
          <Box 
            width={{ base: "100%", lg: "55%" }}
            position="relative"
            height={{ base: "400px", md: "480px", lg: "540px" }}
          >
            {/* Main platform showcase */}
            <Box
              position="relative"
              width="100%"
              height="100%"
              borderRadius="xl"
              overflow="hidden"
              boxShadow={isDark ? "dark-lg" : "xl"}
              bg={isDark ? "gray.800" : "white"}
              className="platform-showcase"
            >
              {/* Device frame */}
              <Box
                position="absolute"
                top="5%"
                left="0"
                right="0"
                bottom="0"
                borderRadius="xl"
                overflow="hidden"
                bg={isDark ? "gray.800" : "white"}
                border={isDark ? "1px solid #2D3748" : "1px solid #E2E8F0"}
                boxShadow={isDark ? "0 20px 40px rgba(0,0,0,0.4)" : "0 20px 40px rgba(0,0,0,0.1)"}
                mx="auto"
                width="90%"
                height="90%"
                zIndex="2"
              >
                {/* Browser-like header */}
                <Box
                  bg={isDark ? "gray.700" : "#F7FAFC"}
                  p={2}
                  borderBottom={isDark ? "1px solid #2D3748" : "1px solid #E2E8F0"}
                  display="flex"
                  alignItems="center"
                >
                  <Flex gap={2} ml={2}>
                    <Box borderRadius="full" bg={isDark ? "red.400" : "red.500"} w={3} h={3}></Box>
                    <Box borderRadius="full" bg={isDark ? "yellow.400" : "yellow.500"} w={3} h={3}></Box>
                    <Box borderRadius="full" bg={isDark ? "green.400" : "green.500"} w={3} h={3}></Box>
                  </Flex>
                  <Box
                    bg={isDark ? "gray.600" : "#EDF2F7"}
                    borderRadius="md"
                    px={4}
                    py={1}
                    mx="auto"
                    fontSize="xs"
                    width="60%"
                    textAlign="center"
                  >
                    app.sylo.com/dashboard
                  </Box>
                </Box>
                
                {/* Content area with the main hero image */}
                <Box p={4} height="calc(100% - 40px)" className="moving-content" position="relative">
                  <Image
                    src={HeroImage}
                    alt="Sylo Platform"
                    width="100%"
                    height="100%"
                    objectFit="cover"
                    borderRadius="md"
                  />
                </Box>
              </Box>
              
              {/* Floating features badges */}
              <Box
                position="absolute"
                top="15%"
                right="-30px"
                bg={isDark ? "gray.700" : "white"}
                borderRadius="lg"
                p={3}
                boxShadow={isDark ? "dark-lg" : "lg"}
                zIndex="10"
                className="feature-badge badge-right"
                border={isDark ? "1px solid #4A5568" : "1px solid #E2E8F0"}
              >
                <Flex alignItems="center" gap={2}>
                  <Box className="icon-wrapper" bg="#B38939" p={2} borderRadius="full">
                    <Box as="span" fontSize="xl" role="img" aria-label="Shield">🔒</Box>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">Secure Transactions</Text>
                    <Text fontSize="xs" color={isDark ? "gray.400" : "gray.500"}>End-to-end encryption</Text>
                  </Box>
                </Flex>
              </Box>
              
              <Box
                position="absolute"
                left="-30px"
                bottom="25%"
                bg={isDark ? "gray.700" : "white"}
                borderRadius="lg"
                p={3}
                boxShadow={isDark ? "dark-lg" : "lg"}
                zIndex="10"
                className="feature-badge badge-left"
                border={isDark ? "1px solid #4A5568" : "1px solid #E2E8F0"}
              >
                <Flex alignItems="center" gap={2}>
                  <Box className="icon-wrapper" bg="#192331" p={2} borderRadius="full">
                    <Box as="span" fontSize="xl" role="img" aria-label="Chart">📊</Box>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm">Real-time Analytics</Text>
                    <Text fontSize="xs" color={isDark ? "gray.400" : "gray.500"}>Track your transactions</Text>
                  </Box>
                </Flex>
              </Box>
              
              {/* Activity pulse indicators */}
              <Box
                position="absolute"
                bottom="10%"
                right="20%"
                zIndex="10"
                className="pulse-indicator"
              >
                <Box
                  width="15px"
                  height="15px"
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
                    animation: "pulse 2s infinite"
                  }}
                ></Box>
              </Box>
              
              <Grid
                templateColumns="repeat(4, 1fr)"
                gap={2}
                position="absolute"
                bottom="-25px"
                left="50%"
                transform="translateX(-50%)"
                width="80%"
                zIndex="20"
              >
                <GridItem colSpan={1}>
                  <Box
                    bg={isDark ? "gray.700" : "white"}
                    borderRadius="md"
                    p={2}
                    boxShadow={isDark ? "dark-lg" : "lg"}
                    textAlign="center"
                    className="stat-card"
                    border={isDark ? "1px solid #4A5568" : "1px solid #E2E8F0"}
                  >
                    <Text fontSize="sm" fontWeight="bold" color="#B38939">$2.4B+</Text>
                    <Text fontSize="xs" color={isDark ? "gray.400" : "gray.500"}>Transactions</Text>
                  </Box>
                </GridItem>
                <GridItem colSpan={1}>
                  <Box
                    bg={isDark ? "gray.700" : "white"}
                    borderRadius="md"
                    p={2}
                    boxShadow={isDark ? "dark-lg" : "lg"}
                    textAlign="center"
                    className="stat-card"
                    border={isDark ? "1px solid #4A5568" : "1px solid #E2E8F0"}
                  >
                    <Text fontSize="sm" fontWeight="bold" color="#B38939">3,400+</Text>
                    <Text fontSize="xs" color={isDark ? "gray.400" : "gray.500"}>Companies</Text>
                  </Box>
                </GridItem>
                <GridItem colSpan={1}>
                  <Box
                    bg={isDark ? "gray.700" : "white"}
                    borderRadius="md"
                    p={2}
                    boxShadow={isDark ? "dark-lg" : "lg"}
                    textAlign="center"
                    className="stat-card"
                    border={isDark ? "1px solid #4A5568" : "1px solid #E2E8F0"}
                  >
                    <Text fontSize="sm" fontWeight="bold" color="#B38939">24/7</Text>
                    <Text fontSize="xs" color={isDark ? "gray.400" : "gray.500"}>Support</Text>
                  </Box>
                </GridItem>
                <GridItem colSpan={1}>
                  <Box
                    bg={isDark ? "gray.700" : "white"}
                    borderRadius="md"
                    p={2}
                    boxShadow={isDark ? "dark-lg" : "lg"}
                    textAlign="center" 
                    className="stat-card"
                    border={isDark ? "1px solid #4A5568" : "1px solid #E2E8F0"}
                  >
                    <Text fontSize="sm" fontWeight="bold" color="#B38939">99.9%</Text>
                    <Text fontSize="xs" color={isDark ? "gray.400" : "gray.500"}>Uptime</Text>
                  </Box>
                </GridItem>
              </Grid>
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default Hero;