import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "../utils/axiosConfig";
import {
  useToast, Box, Text, Button, FormControl, FormLabel,
  VStack, Flex, Container, Heading, ScaleFade,
  PinInput, PinInputField, HStack, useColorModeValue
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiArrowRight, FiArrowLeft } from "react-icons/fi";
import "./VerifyEmail.css"; // Create this file if you want custom styles

const BASE_URL = import.meta.env.VITE_BASE_URL;

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionContainer = motion(Container);

const VerifyEmail = () => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const email = location.state?.email || "";

  useEffect(() => {
    setMounted(true);
    if (!email) {
      toast({
        title: "No Email Provided",
        description: "Please go back to login and try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      navigate("/login");
    }
    return () => setMounted(false);
  }, [email, navigate, toast]);

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

  const handleOtpChange = (value) => {
    setOtp(value);
    setOtpError("");
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/verify-email`, {
        email,
        otp,
      });

      if (response.data.success) {
        localStorage.setItem("access-token", response.data.accessToken);
        localStorage.setItem("refresh-token", response.data.refreshToken);
        localStorage.setItem("userId", response.data.user.id);
        axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.accessToken}`;

        toast({
          title: "Verification Successful",
          description: "Your email is verified. Welcome!",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top",
        });

        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        throw new Error(response.data?.error || "Unexpected response format");
      }
    } catch (error) {
      console.error("Verification error:", error);
      const errorMessage = error.response?.data?.error || "Failed to verify OTP. Please try again.";
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/resend-verification`, { email });

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
      console.error("Resend OTP error:", error);
      const errorMessage = error.response?.data?.error || "Failed to resend OTP. Please try again.";
      
      toast({
        title: "Resend OTP Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
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
          direction="column"
          width="full"
          maxWidth="450px"
          align="center"
          justify="center"
          variants={itemVariants}
        >
          <MotionBox
            width="100%"
            variants={itemVariants}
          >
            <ScaleFade initialScale={0.9} in={true}>
              <Box
                borderRadius="xl"
                bg={buttonBgColor}
                boxShadow="2xl"
                p={{ base: 5, sm: 6, md: 8 }}
                position="relative"
                overflow="hidden"
              >
                <VStack spacing={1} mb={6} align="flex-start">
                  <Heading size="lg" color="white" fontWeight="semibold">
                    Verify Email
                  </Heading>
                  <Text fontSize="sm" color="gray.300">
                    Enter the 6-digit code sent to {email}
                  </Text>
                </VStack>

                <form onSubmit={handleOtpSubmit}>
                  <VStack spacing={5}>
                    <FormControl isRequired isInvalid={!!otpError}>
                      <FormLabel fontSize="sm" color="gray.300" textAlign="center">
                        Enter OTP
                      </FormLabel>
                      <HStack justify="center" spacing={{ base: 2, md: 4 }}>
                        <PinInput
                          size={{ base: "md", md: "lg" }}
                          type="number"
                          value={otp}
                          onChange={handleOtpChange}
                          focusBorderColor={accentColor}
                          otp
                        >
                          {[...Array(6)].map((_, i) => (
                            <PinInputField
                              key={i}
                              color="white"
                              bg="gray.700"
                              borderColor="gray.600"
                              _hover={{ bg: "gray.600" }}
                              _focus={{ bg: "gray.600" }}
                            />
                          ))}
                        </PinInput>
                      </HStack>
                      {otpError && (
                        <Text color="red.300" fontSize="sm" mt={2} textAlign="center">
                          {otpError}
                        </Text>
                      )}
                    </FormControl>

                    <Flex width="full" justifyContent="space-between" mt={4}>
                      <Button
                        variant="ghost"
                        color="gray.300"
                        leftIcon={<FiArrowLeft />}
                        onClick={() => navigate("/login")}
                        _hover={{ color: "white" }}
                        size={{ base: "sm", md: "md" }}
                      >
                        Back to Login
                      </Button>
                      <Button
                        type="submit"
                        bg={buttonBgColor}
                        color="white"
                        borderWidth="2px"
                        borderColor={accentColor}
                        _hover={{
                          bg: buttonHoverBgColor,
                          transform: "translateY(-2px)",
                        }}
                        _active={{
                          transform: "translateY(0)",
                        }}
                        rightIcon={<FiArrowRight />}
                        size={{ base: "sm", md: "md" }}
                        isDisabled={otp.length !== 6}
                        isLoading={isLoading}
                        loadingText="Verifying"
                      >
                        Verify
                      </Button>
                    </Flex>

                    <Button
                      variant="link"
                      color="gray.300"
                      fontSize="sm"
                      onClick={handleResendOtp}
                      isDisabled={isLoading}
                      _hover={{ color: accentColor }}
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
          </MotionBox>
        </MotionFlex>
      </MotionContainer>
    </Box>
  );
};

export default VerifyEmail;