import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import {
  useToast, Box, Text, Input, Button, FormControl, FormLabel,
  VStack, Flex, Container, Heading, InputGroup, InputRightElement,
  ScaleFade, useColorModeValue
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiEye, FiEyeOff, FiArrowRight, FiMail, FiLock } from "react-icons/fi";
import Logo from "../assets/logo1.png";
import "./Login.css";
import { useDispatch } from 'react-redux';
import { setUserDetails } from '../store/slices/userSlice';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionContainer = motion(Container);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const dispatch = useDispatch();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const bgColor = useColorModeValue("white", "gray.900");
  const formBgColor = useColorModeValue("gray.50", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const accentColor = "#B38939";
  const buttonBgColor = useColorModeValue("#031420", "#051e2f");
  const buttonHoverBgColor = "#B38939";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      setIsLoading(false);
      return;
    }

    // Clear any existing tokens before login attempt
    localStorage.removeItem("access-token");
    localStorage.removeItem("refresh-token");

    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Login attempt ${attempt} for email: ${email}`);
        const response = await axios.post('/api/auth/login', {
          email,
          password,
        }, {
          timeout: 30000,
        });

        console.log("Login response:", response.data);

        if (response.data?.success && response.data?.message === "Login successful") {
          const { accessToken, refreshToken, user } = response.data;
          console.log("Storing tokens:", { accessToken, refreshToken });
          localStorage.setItem("access-token", accessToken);
          localStorage.setItem("refresh-token", refreshToken);
          axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
          dispatch(setUserDetails(user));

          toast({
            title: "Login Successful",
            description: "Welcome back!",
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "top",
          });

          console.log("Navigating to /dashboard");
          navigate("/dashboard");
          break;
        } else {
          throw new Error(response.data?.error || "Unexpected response format");
        }
      } catch (error) {
        console.error(`Login error (Attempt ${attempt}):`, error);
        if (attempt === maxRetries) {
          let errorTitle = "Login Failed";
          let errorMessage = "An unexpected error occurred. Please try again.";

          if (error.response) {
            if (error.response.status === 400) {
              errorTitle = "Invalid Input";
              errorMessage = "Please provide both email and password.";
            } else if (error.response.status === 404) {
              errorTitle = "User Not Found";
              errorMessage = "No account exists with this email. Would you like to register?";
              navigate("/register", { state: { email } });
            } else if (error.response.status === 401) {
              errorTitle = "Invalid Credentials";
              errorMessage = "Incorrect email or password. Try resetting your password if you forgot it.";
            } else if (error.response.status === 500) {
              errorTitle = "Server Error";
              errorMessage = "Something went wrong on the server. Please try again later.";
            } else {
              errorMessage = error.response.data?.error || errorMessage;
            }
          } else if (error.code === "ECONNABORTED") {
            errorTitle = "Connection Timeout";
            errorMessage = "The server took too long to respond. Please check your connection and try again.";
          } else if (error.request) {
            errorTitle = "Connection Error";
            errorMessage = "Unable to connect to the server. Please check your internet connection or try again later.";
          } else {
            errorMessage = error.message || errorMessage;
          }

          toast({
            title: errorTitle,
            description: (
              <>
                {errorMessage}
                {error.response?.status === 401 && (
                  <>
                    {" "}
                    <Link to="/forgot-password" style={{ color: "#B38939", textDecoration: "underline" }}>
                      Reset Password
                    </Link>
                  </>
                )}
              </>
            ),
            status: "error",
            duration: 7000,
            isClosable: true,
            position: "top",
          });
        }
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      } finally {
        if (attempt === maxRetries) {
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <Box
      className="login-page"
      minHeight="100vh"
      bgGradient="linear(to-br, #1A202C, #1A202C, #1A202C)"
      position="relative"
      overflow="hidden"
    >
      <Box className="background-shapes">
        <MotionBox
          position="absolute"
          top="15%"
          right={{ base: "-5%", md: "10%" }}
          width={{ base: "200px", md: "300px" }}
          height={{ base: "200px", md: "300px" }}
          borderRadius="full"
          background={`${accentColor}15`}
          filter="blur(60px)"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: mounted ? 1 : 0.8,
            opacity: mounted ? 0.7 : 0,
            y: [0, -20, 0],
          }}
          transition={{
            y: { repeat: Infinity, duration: 10, ease: "easeInOut" },
            opacity: { duration: 1.5 },
            scale: { duration: 1.5 }
          }}
        />
        <MotionBox
          position="absolute"
          bottom="5%"
          left={{ base: "-5%", md: "5%" }}
          width={{ base: "150px", md: "200px" }}
          height={{ base: "150px", md: "200px" }}
          borderRadius="full"
          background={`${accentColor}10`}
          filter="blur(50px)"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: mounted ? 1 : 0.8,
            opacity: mounted ? 0.6 : 0,
            y: [0, 20, 0],
          }}
          transition={{
            y: { repeat: Infinity, duration: 12, ease: "easeInOut" },
            opacity: { duration: 1.5, delay: 0.5 },
            scale: { duration: 1.5, delay: 0.5 }
          }}
        />
        <MotionBox
          position="absolute"
          top="60%"
          right={{ base: "10%", md: "30%" }}
          width={{ base: "100px", md: "150px" }}
          height={{ base: "100px", md: "150px" }}
          borderRadius="full"
          background={`${buttonBgColor}15`}
          filter="blur(40px)"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: mounted ? 1 : 0.8,
            opacity: mounted ? 0.5 : 0,
            x: [0, 15, 0],
          }}
          transition={{
            x: { repeat: Infinity, duration: 15, ease: "easeInOut" },
            opacity: { duration: 1.5, delay: 0.8 },
            scale: { duration: 1.5, delay: 0.8 }
          }}
        />
      </Box>

      <MotionContainer
        maxW="container.xl"
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        pt={{ base: "80px", md: "0" }}
        px={{ base: 4, md: 6 }}
      >
        <MotionFlex
          direction={{ base: "column", lg: "row" }}
          width="full"
          maxWidth="1100px"
          align="center"
          justify="center"
          gap={{ base: 8, lg: 12 }}
          variants={itemVariants}
        >
          <MotionBox
            flex="1"
            display={{ base: "none", lg: "flex" }}
            flexDirection="column"
            alignItems="flex-start"
            justifyContent="center"
            pr={{ lg: 6, xl: 10 }}
            variants={itemVariants}
          >
            <MotionBox
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Heading
                as="h1"
                size="2xl"
                bgGradient={`linear(to-r, ${accentColor}, #B38939)`}
                bgClip="text"
                lineHeight="1.2"
                fontWeight="bold"
                mb={6}
                className="welcome-heading"
              >
                <span>Welcome Back!</span>
              </Heading>

              <Text
                fontSize="lg"
                color="#fff"
                lineHeight="tall"
                maxW="500px"
                mb={8}
                className="welcome-text"
              >
                Sign in to continue your journey with our secure escrow service.
                Protecting your transactions every step of the way.
              </Text>

              <Box
                width="100px"
                height="4px"
                background={accentColor}
                borderRadius="md"
                className="accent-bar"
              />
            </MotionBox>
          </MotionBox>

          <MotionBox
            flex="1"
            width={{ base: "100%", sm: "90%", md: "450px" }}
            variants={itemVariants}
            className="login-form-wrapper"
          >
            <ScaleFade initialScale={0.9} in={true}>
              <Box
                borderRadius="xl"
                bg={buttonBgColor}
                boxShadow="2xl"
                p={{ base: 5, sm: 6, md: 8 }}
                position="relative"
                overflow="hidden"
                className="form-container"
              >
                <VStack
                  spacing={1}
                  mb={6}
                  align="flex-start"
                  display={{ base: "flex", lg: "flex" }}
                >
                  <Heading size="lg" color="white" fontWeight="semibold">
                    Log In
                  </Heading>
                  <Text fontSize="sm" color="gray.300">
                    All fields are required*
                  </Text>
                </VStack>

                <form onSubmit={handleSubmit}>
                  <VStack spacing={5}>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" color="gray.300">
                        Email Address
                      </FormLabel>
                      <InputGroup size={{ base: "md", md: "lg" }}>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          focusBorderColor={accentColor}
                          color="white"
                          fontSize={{ base: "sm", md: "md" }}
                          borderRadius="md"
                          pl={10}
                          _hover={{ bg: "gray.600" }}
                          _focus={{ bg: "gray.600" }}
                        />
                        <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="gray.400" zIndex="1">
                          <FiMail />
                        </Box>
                      </InputGroup>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="sm" color="gray.300">
                        Password
                      </FormLabel>
                      <InputGroup size={{ base: "md", md: "lg" }}>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          focusBorderColor={accentColor}
                          color="white"
                          fontSize={{ base: "sm", md: "md" }}
                          borderRadius="md"
                          pl={10}
                          _hover={{ bg: "gray.600" }}
                          _focus={{ bg: "gray.600" }}
                        />
                        <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="gray.400" zIndex="1">
                          <FiLock />
                        </Box>
                        <InputRightElement h="full">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                            color="gray.400"
                            _hover={{ color: "white" }}
                          >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                          </Button>
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>

                    <Box alignSelf="flex-end">
                      <Link to="/forgot-password">
                        <Text
                          fontSize="sm"
                          color="gray.300"
                          fontWeight="medium"
                          _hover={{ color: accentColor, textDecoration: "underline" }}
                          className="forgot-password"
                        >
                          Forgot password?
                        </Text>
                      </Link>
                    </Box>

                    <Button
                      type="submit"
                      size={{ base: "md", md: "lg" }}
                      width="full"
                      mt={3}
                      bg={accentColor}
                      color="white"
                      fontWeight="medium"
                      borderWidth="2px"
                      borderColor={accentColor}
                      _hover={{
                        bg: "#A47F35",
                        transform: "translateY(-2px)",
                        boxShadow: "lg"
                      }}
                      _active={{
                        transform: "translateY(0)",
                        boxShadow: "md"
                      }}
                      isLoading={isLoading}
                      borderRadius="lg"
                      fontSize={{ base: "md", md: "md" }}
                      rightIcon={<FiArrowRight />}
                      loadingText="Logging in"
                      className="login-button"
                      transition="all 0.3s ease"
                    >
                      Login
                    </Button>
                  </VStack>
                </form>

                <Box
                  position="absolute"
                  bottom="0"
                  left="0"
                  height="3px"
                  width="100%"
                  bgGradient={`linear(to-r, ${accentColor}, #031420)`}
                />
              </Box>
            </ScaleFade>

            <MotionBox
              textAlign="center"
              mt={6}
              variants={itemVariants}
            >
              <Text fontSize={{ base: "sm", md: "md" }} color="gray.600">
                Don't have an account?{" "}
                <Link to="/register">
                  <Text
                    as="span"
                    color={accentColor}
                    fontWeight="bold"
                    _hover={{ textDecoration: "underline" }}
                    className="register-link"
                  >
                    Register Now
                  </Text>
                </Link>
              </Text>
            </MotionBox>
          </MotionBox>
        </MotionFlex>
      </MotionContainer>
    </Box>
  );
};

export default Login;