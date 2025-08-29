import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "../utils/axiosConfig";
import {
  useToast, Box, Text, Input, Button, FormControl, FormLabel,
  VStack, Flex, Container, Heading, ScaleFade, FormErrorMessage,
  InputGroup, InputLeftElement
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import "./VerifyEmail.css";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionContainer = motion(Container);

const VerifyEmail = () => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();

  const { userId, email } = location.state || {};

  useEffect(() => {
    setMounted(true);
    if (!userId || !email) {
      toast({
        title: "Invalid Access",
        description: "Please register first to verify your email.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      navigate("/register");
    }
    return () => setMounted(false);
  }, [userId, email, navigate, toast]);

  const accentColor = "#B38939";
  const buttonBgColor = "#031420";
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
    setError("");

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/verify-email`, {
        userId,
        otp,
      });

      if (response.data.success) {
        toast({
          title: "Email Verified",
          description: "Your email has been verified successfully. Logging you in...",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top",
        });

        localStorage.setItem("access-token", response.data.accessToken);
        localStorage.setItem("refresh-token", response.data.refreshToken);
        localStorage.setItem("userId", response.data.user.id);
        axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.accessToken}`;

        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        throw new Error(response.data?.error || "Unexpected response format");
      }
    } catch (error) {
      let errorMessage = "Unable to verify OTP. Please try again.";

      if (error.response?.data?.error) {
        switch (error.response.data.error) {
          case "Invalid user ID":
            errorMessage = "Invalid user ID. Please register again.";
            break;
          case "User not found":
            errorMessage = "User not found. Please register again.";
            break;
          case "Email already verified":
            errorMessage = "Email is already verified. Please log in.";
            break;
          case "Invalid OTP":
            errorMessage = "Invalid OTP. Please check and try again.";
            break;
          case "OTP has expired. Please register again.":
            errorMessage = "OTP has expired. Please register again.";
            break;
          default:
            errorMessage = error.response.data.error;
        }
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }

      setError(errorMessage);
      toast({
        title: "Verification Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });

      if (errorMessage.includes("register again")) {
        setTimeout(() => {
          navigate("/register");
        }, 2000);
      } else if (errorMessage.includes("already verified")) {
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError("");

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, {
        email,
        resendOtp: true,
      });

      if (response.data.success) {
        toast({
          title: "OTP Resent",
          description: "A new OTP has been sent to your email.",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
      } else {
        throw new Error(response.data?.error || "Unexpected response format");
      }
    } catch (error) {
      let errorMessage = "Unable to resend OTP. Please try again.";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }

      toast({
        title: "Resend Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Box
      className="verify-email-page"
      minHeight="100vh"
      bgGradient="linear(to-br, #1A202C, #1A202C, #1A202C)"
      position="relative"
      overflow="hidden"
    >
      <Box className="background-shapes">
        <MotionBox
          position="absolute"
          top={{ base: "5%", md: "15%" }}
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
            scale: { duration: 1.5 },
          }}
        />
        <MotionBox
          position="absolute"
          bottom="5%"
          left={{ base: "-10%", md: "5%" }}
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
            scale: { duration: 1.5, delay: 0.5 },
          }}
        />
        <MotionBox
          position="absolute"
          top="60%"
          right={{ base: "5%", md: "20%" }}
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
            scale: { duration: 1.5, delay: 0.8 },
          }}
        />
      </Box>

      <MotionContainer
        maxW="container.xl"
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        pt={{ base: "80px", md: "0" }}
        px={{ base: 4, md: 6 }}
        py={{ base: 8, md: 12 }}
      >
        <MotionFlex
          direction="column"
          width="full"
          maxWidth={{ base: "100%", sm: "90%", md: "450px" }}
          align="center"
          justify="center"
          variants={itemVariants}
        >
          <MotionBox
            width="full"
            variants={itemVariants}
            className="verify-email-form-wrapper"
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
                <VStack spacing={1} mb={6} align="flex-start">
                  <Heading size="lg" color="white" fontWeight="semibold">
                    Verify Your Email
                  </Heading>
                  <Text fontSize="sm" color="gray.300">
                    Enter the 6-digit OTP sent to {email}
                  </Text>
                </VStack>

                <form onSubmit={handleSubmit}>
                  <VStack spacing={5}>
                    <FormControl isRequired isInvalid={!!error}>
                      <FormLabel fontSize="sm" color="gray.300">
                        OTP Code
                      </FormLabel>
                      <InputGroup size={{ base: "md", md: "lg" }}>
                        <InputLeftElement
                          pointerEvents="none"
                          color="gray.400"
                          children={<FiLock />}
                        />
                        <Input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => {
                            setOtp(e.target.value);
                            setError("");
                          }}
                          focusBorderColor={accentColor}
                          color="white"
                          fontSize={{ base: "sm", md: "md" }}
                          borderRadius="md"
                          maxLength={6}
                          _hover={{ bg: "gray.600" }}
                          _focus={{ bg: "gray.600" }}
                        />
                      </InputGroup>
                      <FormErrorMessage>{error}</FormErrorMessage>
                    </FormControl>

                    <Button
                      type="submit"
                      size={{ base: "md", md: "lg" }}
                      width="full"
                      bg={accentColor}
                      color="white"
                      fontWeight="medium"
                      borderWidth="2px"
                      borderColor={accentColor}
                      _hover={{
                        bg: "#A47F35",
                        transform: "translateY(-2px)",
                        boxShadow: "lg",
                      }}
                      _active={{
                        transform: "translateY(0)",
                        boxShadow: "md",
                      }}
                      isLoading={isLoading}
                      loadingText="Verifying"
                      borderRadius="lg"
                      fontSize={{ base: "md", md: "md" }}
                      rightIcon={<FiArrowRight />}
                      transition="all 0.3s ease"
                    >
                      Verify Email
                    </Button>

                    <Button
                      variant="link"
                      size="sm"
                      color="gray.300"
                      _hover={{ color: accentColor, textDecoration: "underline" }}
                      onClick={handleResendOTP}
                      isLoading={resendLoading}
                      loadingText="Resending OTP"
                    >
                      Resend OTP
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
                Already verified?{" "}
                <Link to="/login">
                  <Text
                    as="span"
                    color={accentColor}
                    fontWeight="bold"
                    _hover={{ textDecoration: "underline" }}
                    className="login-link"
                  >
                    Log In
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

export default VerifyEmail;