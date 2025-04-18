// src/pages/ForgotPassword.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    useToast, Box, Text, Input, Button, FormControl, FormLabel,
    VStack, Flex, Container, Heading, InputGroup, InputRightElement,
    ScaleFade, useColorModeValue, PinInput, PinInputField, HStack
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiEye, FiEyeOff, FiArrowRight, FiMail, FiLock, FiArrowLeft } from "react-icons/fi";
import Logo from "../assets/logo1.png";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionContainer = motion(Container);

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [otpError, setOtpError] = useState("");
    const navigate = useNavigate();
    const toast = useToast();

    // Set mounted state for animations
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Color mode values
    const accentColor = "#B38939";
    const buttonBgColor = useColorModeValue("#031420", "#051e2f");
    const buttonHoverBgColor = "#B38939";

    // Animation variants
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

    // Handle OTP Input Change
    const handleOtpChange = (value) => {
        setOtp(value);
        setOtpError("");
    };

    // Handle Email Submit
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!email) {
            toast({
                title: "Email required",
                description: "Please enter your email address",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${BASE_URL}/api/auth/forgot-password`, {
                email,
            });

            if (response.data.success) {
                toast({
                    title: "OTP Generated",
                    description: "Check your email for the OTP code",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                    position: "top",
                });

                // If in development mode, show the OTP directly on screen
                if (response.data.devMode && response.data.devOtp) {
                    toast({
                        title: "Development Mode",
                        description: `OTP for testing: ${response.data.devOtp}`,
                        status: "info",
                        duration: 15000,  // Longer duration so you have time to see it
                        isClosable: true,
                        position: "bottom",
                    });

                    // Optionally pre-fill the OTP for testing
                    // setOtp(response.data.devOtp);
                }

                setStep(2); // Move to OTP step
            }
        } catch (error) {
            console.error(error);

            const errorMessage = error.response?.data?.error || "Failed to send OTP. Please try again.";

            toast({
                title: "Error",
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

    // Handle OTP Submit
    const handleOtpSubmit = (e) => {
        e.preventDefault();

        if (otp.length !== 6) {
            setOtpError("Please enter the complete 6-digit OTP");
            return;
        }

        setStep(3); // Move to reset password step
    };

    // Handle Password Reset
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!newPassword || !confirmPassword) {
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

        if (newPassword !== confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "New password and confirmation must match",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            toast({
                title: "Password too short",
                description: "Password must be at least 8 characters long",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top",
            });
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${BASE_URL}/api/auth/reset-password`, {
                email,
                otp,
                newPassword,
            });

            if (response.data.success) {
                toast({
                    title: "Password Reset Successful",
                    description: "You can now log in with your new password",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                    position: "top",
                });

                // Navigate to login after short delay
                setTimeout(() => {
                    navigate("/login");
                }, 1000);
            }
        } catch (error) {
            console.error(error);

            const errorMessage = error.response?.data?.error || "Failed to reset password. Please try again.";

            toast({
                title: "Error",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top",
            });

            // If OTP is invalid or expired, go back to email step
            if (error.response?.status === 400) {
                setStep(1);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <form onSubmit={handleEmailSubmit}>
                        <VStack spacing={5}>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" color="gray.300">
                                    Email Address
                                </FormLabel>
                                <InputGroup size={{ base: "md", md: "lg" }}>
                                    <Input
                                        type="email"
                                        placeholder="Enter your registered email"
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

                            <Button
                                type="submit"
                                size={{ base: "md", md: "lg" }}
                                width="full"
                                mt={3}
                                bg={buttonBgColor}
                                color="white"
                                fontWeight="medium"
                                borderWidth="2px"
                                borderColor={accentColor}
                                _hover={{
                                    bg: buttonHoverBgColor,
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
                                loadingText="Sending OTP"
                                transition="all 0.3s ease"
                            >
                                Send OTP
                            </Button>
                        </VStack>
                    </form>
                );

            case 2:
                return (
                    <form onSubmit={handleOtpSubmit}>
                        <VStack spacing={5}>
                            <Box textAlign="center" mb={2}>
                                <Text color="gray.300" fontSize="sm">
                                    We've sent a 6-digit OTP to
                                </Text>
                                <Text color="white" fontWeight="medium">
                                    {email}
                                </Text>
                            </Box>

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
                                    onClick={() => setStep(1)}
                                    _hover={{ color: "white" }}
                                    size={{ base: "sm", md: "md" }}
                                >
                                    Back
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
                                >
                                    Verify
                                </Button>
                            </Flex>
                        </VStack>
                    </form>
                );

            case 3:
                return (
                    <form onSubmit={handlePasswordReset}>
                        <VStack spacing={5}>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" color="gray.300">
                                    New Password
                                </FormLabel>
                                <InputGroup size={{ base: "md", md: "lg" }}>
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
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

                            <FormControl isRequired>
                                <FormLabel fontSize="sm" color="gray.300">
                                    Confirm Password
                                </FormLabel>
                                <InputGroup size={{ base: "md", md: "lg" }}>
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            color="gray.400"
                                            _hover={{ color: "white" }}
                                        >
                                            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                        </Button>
                                    </InputRightElement>
                                </InputGroup>
                            </FormControl>

                            <Flex width="full" justifyContent="space-between" mt={4}>
                                <Button
                                    variant="ghost"
                                    color="gray.300"
                                    leftIcon={<FiArrowLeft />}
                                    onClick={() => setStep(2)}
                                    _hover={{ color: "white" }}
                                    size={{ base: "sm", md: "md" }}
                                >
                                    Back
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
                                    size={{ base: "md", md: "md" }}
                                    isLoading={isLoading}
                                    loadingText="Resetting"
                                >
                                    Reset Password
                                </Button>
                            </Flex>
                        </VStack>
                    </form>
                );

            default:
                return null;
        }
    };

    // Step titles
    const getStepTitle = () => {
        switch (step) {
            case 1:
                return "Forgot Password";
            case 2:
                return "Verify OTP";
            case 3:
                return "Reset Password";
            default:
                return "Forgot Password";
        }
    };

    return (
        <Box
            minHeight="100vh"
            bgGradient="linear(to-br, #1A202C, #1A202C, #1A202C)"
            position="relative"
            overflow="hidden"
        >
            {/* Animated Background Elements */}
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

            {/* Main Content Container */}
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
                    {/* Form Container */}
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
                                {/* Form Header */}
                                <VStack
                                    spacing={1}
                                    mb={6}
                                    align="flex-start"
                                >
                                    <Heading size="lg" color="white" fontWeight="semibold">
                                        {getStepTitle()}
                                    </Heading>
                                    <Text fontSize="sm" color="gray.300">
                                        {step === 1 ? "Enter your email to receive an OTP" :
                                            step === 2 ? "Enter the 6-digit code sent to your email" :
                                                "Create a new password for your account"}
                                    </Text>
                                </VStack>

                                {/* Dynamic Form Content */}
                                {renderStepContent()}

                                {/* Decorative accent line */}
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

                        {/* Back to Login Link */}
                        <MotionBox
                            textAlign="center"
                            mt={6}
                            variants={itemVariants}
                        >
                            <Link to="/login">
                                <Text
                                    fontSize="sm"
                                    color="gray.400"
                                    _hover={{ color: accentColor }}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <FiArrowLeft style={{ marginRight: "8px" }} /> Back to Login
                                </Text>
                            </Link>
                        </MotionBox>
                    </MotionBox>
                </MotionFlex>
            </MotionContainer>
        </Box>
    );
};

export default ForgotPassword;