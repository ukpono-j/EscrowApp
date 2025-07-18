import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import {
  useToast, Box, Text, Input, Button, FormControl, FormLabel,
  VStack, HStack, Flex, Container, Heading, InputGroup, InputRightElement,
  ScaleFade, FormErrorMessage, InputLeftElement
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FiEye, FiEyeOff, FiArrowRight, FiMail, FiLock, FiUser,
  FiCalendar, FiCheckCircle, FiShield, FiPhone
} from "react-icons/fi";
import "./Register.css";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionContainer = motion(Container);

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    phoneNumber: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const toast = useToast();

  // Set mounted state for animations
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Color mode values
  const accentColor = "#B38939";
  const buttonBgColor = "#031420";
  const buttonHoverBgColor = "#B38939";

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
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

  // Form field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Calculate password strength when password changes
    if (name === 'password') {
      calculatePasswordStrength(value);
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 1;

    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    setPasswordStrength(strength);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Validate email
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Validate date of birth
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(formData.dateOfBirth);
      if (isNaN(dob.getTime())) {
        newErrors.dateOfBirth = "Invalid date of birth";
      } else {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age = age - 1;
        }
        if (age < 18) {
          newErrors.dateOfBirth = "You must be at least 18 years old";
        }
      }
    }

    // Validate phone number (optional)
    if (formData.phoneNumber && !/^(0\d{10}|\+234\d{10})$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be 11 digits starting with 0 or +234";
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password) || !/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password = "Password must include uppercase, number, and special character";
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Form Error",
        description: "Please fix the errors in the form",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber
      });

      const { token, wallet } = response.data;

      // Store token
      localStorage.setItem('access-token', token);

      // Prepare success message with virtual account details
      let successMessage = "Your account and wallet have been created. Redirecting to your dashboard...";
      if (wallet?.virtualAccountNumber && wallet?.bankName) {
        successMessage += `\n\nFund your wallet using:\nAccount Number: ${wallet.virtualAccountNumber}\nBank: ${wallet.bankName}`;
      }

      toast({
        title: "Account Created Successfully",
        description: successMessage,
        status: "success",
        duration: 7000,
        isClosable: true,
        position: "top"
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error.response?.data || error);
      let errorMessage = 'Unable to register. Please try again.';

      if (error.response?.data?.error) {
        switch (error.response.data.error) {
          case 'All fields are required':
            errorMessage = 'Please fill in all required fields.';
            break;
          case 'Invalid email format':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'Invalid date of birth':
            errorMessage = 'Please enter a valid date of birth.';
            break;
          case 'You must be at least 18 years old':
            errorMessage = 'You must be at least 18 years old to register.';
            break;
          case 'Email already in use':
            errorMessage = 'This email is already registered. Please use a different email or log in.';
            break;
          case 'Wallet already exists for this user':
            errorMessage = 'An account with this email already has a wallet. Please contact support.';
            break;
          case 'Virtual account creation failed':
            errorMessage = 'Failed to create a virtual account with Paystack. Please try again or contact support.';
            break;
          case 'Database error: Duplicate transaction reference':
            errorMessage = 'A server error occurred with transaction references. Please try again or contact support.';
            break;
          case 'Database error: Duplicate key':
            errorMessage = `Registration failed due to duplicate data: ${JSON.stringify(error.response.data.details)}. Please contact support.`;
            break;
          case 'Password must be at least 8 characters and include uppercase, number, and special character':
            errorMessage = 'Password must be at least 8 characters and include an uppercase letter, number, and special character.';
            break;
          default:
            errorMessage = error.response.data.error;
        }
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator color
  const getStrengthColor = (strength) => {
    if (strength === 0) return "gray.400";
    if (strength <= 2) return "red.500";
    if (strength <= 3) return "yellow.500";
    if (strength <= 4) return "green.400";
    return accentColor;
  };

  return (
    <Box
      className="register-page"
      minHeight="100vh"
      bgGradient="linear(to-br, #1A202C, #1A202C, #1A202C)"
      position="relative"
      overflow="hidden"
    >
      {/* Animated Background Elements */}
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
            scale: { duration: 1.5 }
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
            scale: { duration: 1.5, delay: 0.5 }
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
            scale: { duration: 1.5, delay: 0.8 }
          }}
        />
      </Box>

      {/* Main Content Container */}
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
          direction={{ base: "column", lg: "row" }}
          width="full"
          maxWidth="1100px"
          align="center"
          justify="center"
          gap={{ base: 6, lg: 12 }}
          variants={itemVariants}
        >
          {/* Left Column - Brand Message */}
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
                bgGradient={`linear(to-r, ${accentColor}, #C99A45)`}
                bgClip="text"
                lineHeight="1.2"
                fontWeight="bold"
                mb={6}
                className="welcome-heading"
              >
                Join Our Community
              </Heading>

              <Text
                fontSize="lg"
                color="#fff"
                lineHeight="tall"
                maxW="500px"
                mb={6}
                className="welcome-text"
              >
                Create your account today and experience secure transactions with our trusted escrow service. Your financial security is our priority.
              </Text>

              <VStack align="flex-start" spacing={4} mt={8} className="features-list">
                <HStack>
                  <Box color={accentColor}>
                    <FiCheckCircle size={20} />
                  </Box>
                  <Text color="#fff">Secure transactions guaranteed</Text>
                </HStack>
                <HStack>
                  <Box color={accentColor}>
                    <FiCheckCircle size={20} />
                  </Box>
                  <Text color="#fff">24/7 customer support</Text>
                </HStack>
                <HStack>
                  <Box color={accentColor}>
                    <FiCheckCircle size={20} />
                  </Box>
                  <Text color="#fff">Fast and reliable process</Text>
                </HStack>
              </VStack>

              <Box
                width="100px"
                height="4px"
                background={accentColor}
                borderRadius="md"
                mt={8}
                className="accent-bar"
              />
            </MotionBox>
          </MotionBox>

          {/* Right Column - Registration Form */}
          <MotionBox
            flex="1"
            width={{ base: "100%", sm: "90%", md: "500px" }}
            variants={itemVariants}
            className="register-form-wrapper"
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
                {/* Form Header */}
                <VStack
                  spacing={1}
                  mb={6}
                  align="flex-start"
                >
                  <Heading size="lg" color="white" fontWeight="semibold">
                    Create Account
                  </Heading>
                  <Text fontSize="sm" color="gray.300">
                    All fields are required*
                  </Text>
                </VStack>

                {/* Registration Form */}
                <form onSubmit={handleSubmit}>
                  <VStack spacing={4}>
                    {/* Name Fields - Side by Side on larger screens */}
                    <Flex
                      width="100%"
                      direction={{ base: "column", sm: "row" }}
                      gap={{ base: 4, sm: 3 }}
                    >
                      <FormControl isRequired isInvalid={!!errors.firstName}>
                        <FormLabel fontSize="sm" color="gray.300">
                          First Name
                        </FormLabel>
                        <InputGroup size={{ base: "md", md: "md" }}>
                          <InputLeftElement
                            pointerEvents="none"
                            color="gray.400"
                            children={<FiUser />}
                          />
                          <Input
                            type="text"
                            name="firstName"
                            placeholder="First Name"
                            value={formData.firstName}
                            onChange={handleChange}
                            focusBorderColor={accentColor}
                            color="white"
                            fontSize={{ base: "sm", md: "md" }}
                            borderRadius="md"
                            className="input-field"
                            _hover={{ bg: "gray.600" }}
                            _focus={{ bg: "gray.600" }}
                          />
                        </InputGroup>
                        <FormErrorMessage>{errors.firstName}</FormErrorMessage>
                      </FormControl>

                      <FormControl isRequired isInvalid={!!errors.lastName}>
                        <FormLabel fontSize="sm" color="gray.300">
                          Last Name
                        </FormLabel>
                        <InputGroup size={{ base: "md", md: "md" }}>
                          <InputLeftElement
                            pointerEvents="none"
                            color="gray.400"
                            children={<FiUser />}
                          />
                          <Input
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            value={formData.lastName}
                            onChange={handleChange}
                            focusBorderColor={accentColor}
                            color="white"
                            fontSize={{ base: "sm", md: "md" }}
                            borderRadius="md"
                            className="input-field"
                            _hover={{ bg: "gray.600" }}
                            _focus={{ bg: "gray.600" }}
                          />
                        </InputGroup>
                        <FormErrorMessage>{errors.lastName}</FormErrorMessage>
                      </FormControl>
                    </Flex>

                    <FormControl isRequired isInvalid={!!errors.email}>
                      <FormLabel fontSize="sm" color="gray.300">
                        Email Address
                      </FormLabel>
                      <InputGroup size={{ base: "md", md: "md" }}>
                        <InputLeftElement
                          pointerEvents="none"
                          color="gray.400"
                          children={<FiMail />}
                        />
                        <Input
                          type="email"
                          name="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          focusBorderColor={accentColor}
                          color="white"
                          fontSize={{ base: "sm", md: "md" }}
                          borderRadius="md"
                          className="input-field"
                          _hover={{ bg: "gray.600" }}
                          _focus={{ bg: "gray.600" }}
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.email}</FormErrorMessage>
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.phoneNumber}>
                      <FormLabel fontSize="sm" color="gray.300">
                        Phone Number
                      </FormLabel>
                      <InputGroup size={{ base: "md", md: "md" }}>
                        <InputLeftElement
                          pointerEvents="none"
                          color="gray.400"
                          children={<FiPhone />}
                        />
                        <Input
                          type="tel"
                          name="phoneNumber"
                          placeholder="e.g., 08012345678 or +2348012345678"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          focusBorderColor={accentColor}
                          color="white"
                          fontSize={{ base: "sm", md: "md" }}
                          borderRadius="md"
                          className="input-field"
                          _hover={{ bg: "gray.600" }}
                          _focus={{ bg: "gray.600" }}
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.phoneNumber}</FormErrorMessage>
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.dateOfBirth}>
                      <FormLabel fontSize="sm" color="gray.300">
                        Date of Birth
                      </FormLabel>
                      <InputGroup size={{ base: "md", md: "md" }}>
                        <InputLeftElement
                          pointerEvents="none"
                          color="gray.400"
                          children={<FiCalendar />}
                        />
                        <Input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          focusBorderColor={accentColor}
                          color="white"
                          fontSize={{ base: "sm", md: "md" }}
                          borderRadius="md"
                          className="input-field date-input"
                          _hover={{ bg: "gray.600" }}
                          _focus={{ bg: "gray.600" }}
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.dateOfBirth}</FormErrorMessage>
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.password}>
                      <FormLabel fontSize="sm" color="gray.300">
                        Password
                      </FormLabel>
                      <InputGroup size={{ base: "md", md: "md" }}>
                        <InputLeftElement
                          pointerEvents="none"
                          color="gray.400"
                          children={<FiLock />}
                        />
                        <Input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Create password (min. 8 characters)"
                          value={formData.password}
                          onChange={handleChange}
                          focusBorderColor={accentColor}
                          color="white"
                          fontSize={{ base: "sm", md: "md" }}
                          borderRadius="md"
                          className="input-field"
                          _hover={{ bg: "gray.600" }}
                          _focus={{ bg: "gray.600" }}
                        />
                        <InputRightElement>
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
                      <FormErrorMessage>{errors.password}</FormErrorMessage>

                      {/* Password strength indicator */}
                      {formData.password && (
                        <Flex mt={2} align="center">
                          <Box width="100%" height="4px" borderRadius="full" overflow="hidden">
                            <Box
                              height="100%"
                              width={`${passwordStrength * 20}%`}
                              bg={getStrengthColor(passwordStrength)}
                              transition="width 0.3s ease, background-color 0.3s ease"
                            />
                          </Box>
                          <Text fontSize="xs" color={getStrengthColor(passwordStrength)} ml={2}>
                            {passwordStrength <= 2 ? "Weak" : passwordStrength <= 3 ? "Fair" : passwordStrength <= 4 ? "Good" : "Strong"}
                          </Text>
                        </Flex>
                      )}
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                      <FormLabel fontSize="sm" color="gray.300">
                        Confirm Password
                      </FormLabel>
                      <InputGroup size={{ base: "md", md: "md" }}>
                        <InputLeftElement
                          pointerEvents="none"
                          color="gray.400"
                          children={<FiShield />}
                        />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Re-enter your password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          focusBorderColor={accentColor}
                          color="white"
                          fontSize={{ base: "sm", md: "md" }}
                          borderRadius="md"
                          className="input-field"
                          _hover={{ bg: "gray.600" }}
                          _focus={{ bg: "gray.600" }}
                        />
                        <InputRightElement>
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
                      <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                    </FormControl>

                    <Button
                      type="submit"
                      size={{ base: "md", md: "lg" }}
                      width="full"
                      mt={5}
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
                      loadingText="Creating Account"
                      borderRadius="lg"
                      fontSize={{ base: "md", md: "md" }}
                      rightIcon={<FiArrowRight />}
                      transition="all 0.3s ease"
                    >
                      Create Account
                    </Button>
                  </VStack>
                </form>

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

            {/* Login Link */}
            <MotionBox
              textAlign="center"
              mt={6}
              mb={{ base: 8, md: 0 }}
              variants={itemVariants}
            >
              <Text fontSize={{ base: "sm", md: "md" }} color="gray.600">
                Already have an account?{" "}
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

export default Register;