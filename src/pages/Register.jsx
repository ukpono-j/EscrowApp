import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import {
  useToast,
  Box,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Flex,
  Container,
  Heading,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  FormErrorMessage,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiMail,
  FiLock,
  FiUser,
  FiCalendar,
  FiPhone,
  FiCheckCircle,
} from "react-icons/fi";

const MotionBox = motion(Box);

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    phoneNumber: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const navigate = useNavigate();
  const toast = useToast();

  const accentColor = "#B38939";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      calculatePasswordStrength(value);
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const calculatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const getStrengthColor = (strength) => {
    if (strength <= 1) return "red.500";
    if (strength <= 3) return "orange.500";
    if (strength <= 4) return "yellow.500";
    return "green.500";
  };

  const getStrengthText = (strength) => {
    if (strength <= 1) return "Weak";
    if (strength <= 3) return "Fair";
    if (strength <= 4) return "Good";
    return "Strong";
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^(0\d{10}|\+234\d{10})$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Invalid format (use 080xxxxxxxx or +23480xxxxxxxx)";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(formData.dateOfBirth);
      const age = new Date().getFullYear() - dob.getFullYear();
      if (age < 18) newErrors.dateOfBirth = "You must be at least 18 years old";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (
      !/[A-Z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password) ||
      !/[^A-Za-z0-9]/.test(formData.password)
    ) {
      newErrors.password = "Must contain uppercase, number & special character";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm password";
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
        title: "Validation Error", 
        description: "Please check all fields", 
        status: "error", 
        duration: 5000, 
        isClosable: true, 
        position: "top" 
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("/api/auth/register", {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber.trim(),
      });

      const { accessToken, refreshToken, user } = response.data;

      // Store tokens
      localStorage.setItem("access-token", accessToken);
      localStorage.setItem("refresh-token", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      toast({ 
        title: "Registration Successful", 
        description: "Welcome! Redirecting...", 
        status: "success", 
        duration: 5000, 
        isClosable: true 
      });

      // setTimeout(() => navigate("/dashboard"), 1500);
      setTimeout(() => navigate("/onbroading"), 1500);
    } catch (error) {
      let message = "Registration failed";
      if (error?.response?.data?.error) {
        message = error.response.data.error;
      }
      toast({ 
        title: "Registration Failed", 
        description: message, 
        status: "error", 
        duration: 6000, 
        isClosable: true, 
        position: "top" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, gray.900, #1a202c)"
      position="relative"
      overflow="hidden"
    >
      <Container
        maxW="container.xl"
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        py={{ base: 10, md: 16 }}
      >
        <Flex
          direction={{ base: "column", lg: "row" }}
          w="full"
          maxW="1100px"
          gap={{ base: 10, lg: 16 }}
          align="center"
        >
          {/* Left side - promotional text */}
          <Box
            flex="1"
            display={{ base: "none", lg: "block" }}
            color="whiteAlpha.900"
          >
            <Heading
              as="h1"
              fontSize={{ lg: "4xl", xl: "5xl" }}
              bgGradient={`linear(to-r, ${accentColor}, orange.300)`}
              bgClip="text"
              mb={6}
              lineHeight="1.1"
            >
              Join Sylo Today
            </Heading>
            <Text fontSize="lg" mb={8} opacity={0.9}>
              Experience secure, transparent, and fast escrow transactions.
            </Text>

            <VStack align="start" spacing={4}>
              <HStack>
                <FiCheckCircle color={accentColor} size={20} />
                <Text>Instant account creation</Text>
              </HStack>
              <HStack>
                <FiCheckCircle color={accentColor} size={20} />
                <Text>Protected payments</Text>
              </HStack>
              <HStack>
                <FiCheckCircle color={accentColor} size={20} />
                <Text>24/7 support</Text>
              </HStack>
            </VStack>
          </Box>

          {/* Right side - form */}
          <MotionBox
            flex="1"
            w="full"
            maxW="500px"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box
              bg="gray.800"
              p={{ base: 6, md: 8 }}
              borderRadius="2xl"
              boxShadow="2xl"
              border="1px solid"
              borderColor="gray.700"
            >
              <VStack spacing={6} align="stretch">
                <VStack spacing={2} textAlign="center" mb={4}>
                  <Heading size="xl" color="white">
                    Create Account
                  </Heading>
                  <Text color="gray.400" fontSize="sm">
                    All fields are required
                  </Text>
                </VStack>

                <form onSubmit={handleSubmit} noValidate>
                  <VStack spacing={5}>
                    <HStack spacing={4} w="full" flexDir={{ base: "column", sm: "row" }}>
                      <FormControl isInvalid={!!errors.firstName} isRequired>
                        <FormLabel fontSize="sm" color="gray.300">
                          First Name
                        </FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <FiUser color="gray.500" />
                          </InputLeftElement>
                          <Input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="John"
                            bg="gray.700"
                            borderColor="gray.600"
                            _hover={{ borderColor: accentColor }}
                            _focus={{ borderColor: accentColor, boxShadow: "none" }}
                            color="white"
                          />
                        </InputGroup>
                        <FormErrorMessage>{errors.firstName}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.lastName} isRequired>
                        <FormLabel fontSize="sm" color="gray.300">
                          Last Name
                        </FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <FiUser color="gray.500" />
                          </InputLeftElement>
                          <Input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Doe"
                            bg="gray.700"
                            borderColor="gray.600"
                            _hover={{ borderColor: accentColor }}
                            _focus={{ borderColor: accentColor, boxShadow: "none" }}
                            color="white"
                          />
                        </InputGroup>
                        <FormErrorMessage>{errors.lastName}</FormErrorMessage>
                      </FormControl>
                    </HStack>

                    {/* Email */}
                    <FormControl isInvalid={!!errors.email} isRequired>
                      <FormLabel fontSize="sm" color="gray.300">
                        Email Address
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <FiMail color="gray.500" />
                        </InputLeftElement>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          bg="gray.700"
                          borderColor="gray.600"
                          _hover={{ borderColor: accentColor }}
                          _focus={{ borderColor: accentColor, boxShadow: "none" }}
                          color="white"
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.email}</FormErrorMessage>
                    </FormControl>

                    {/* Phone */}
                    <FormControl isInvalid={!!errors.phoneNumber} isRequired>
                      <FormLabel fontSize="sm" color="gray.300">
                        Phone Number
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <FiPhone color="gray.500" />
                        </InputLeftElement>
                        <Input
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          placeholder="08012345678"
                          bg="gray.700"
                          borderColor="gray.600"
                          _hover={{ borderColor: accentColor }}
                          _focus={{ borderColor: accentColor, boxShadow: "none" }}
                          color="white"
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.phoneNumber}</FormErrorMessage>
                    </FormControl>

                    {/* Date of Birth */}
                    <FormControl isInvalid={!!errors.dateOfBirth} isRequired>
                      <FormLabel fontSize="sm" color="gray.300">
                        Date of Birth
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <FiCalendar color="gray.500" />
                        </InputLeftElement>
                        <Input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          _hover={{ borderColor: accentColor }}
                          _focus={{ borderColor: accentColor, boxShadow: "none" }}
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.dateOfBirth}</FormErrorMessage>
                    </FormControl>

                    {/* Password */}
                    <FormControl isInvalid={!!errors.password} isRequired>
                      <FormLabel fontSize="sm" color="gray.300">
                        Password
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <FiLock color="gray.500" />
                        </InputLeftElement>
                        <Input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••"
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          _hover={{ borderColor: accentColor }}
                          _focus={{ borderColor: accentColor, boxShadow: "none" }}
                        />
                        <InputRightElement>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowPassword(!showPassword)}
                            color="gray.400"
                            _hover={{ color: "white" }}
                          >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                          </Button>
                        </InputRightElement>
                      </InputGroup>
                      <FormErrorMessage>{errors.password}</FormErrorMessage>

                      {formData.password && (
                        <Box mt={2}>
                          <Flex align="center" gap={2}>
                            <Box flex="1" h="3px" bg="gray.600" borderRadius="full" overflow="hidden">
                              <Box
                                h="100%"
                                w={`${(passwordStrength / 5) * 100}%`}
                                bg={getStrengthColor(passwordStrength)}
                                transition="width 0.3s ease"
                              />
                            </Box>
                            <Text fontSize="xs" color={getStrengthColor(passwordStrength)}>
                              {getStrengthText(passwordStrength)}
                            </Text>
                          </Flex>
                        </Box>
                      )}
                    </FormControl>

                    {/* Confirm Password */}
                    <FormControl isInvalid={!!errors.confirmPassword} isRequired>
                      <FormLabel fontSize="sm" color="gray.300">
                        Confirm Password
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <FiLock color="gray.500" />
                        </InputLeftElement>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="••••••••"
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          _hover={{ borderColor: accentColor }}
                          _focus={{ borderColor: accentColor, boxShadow: "none" }}
                        />
                        <InputRightElement>
                          <Button
                            size="sm"
                            variant="ghost"
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
                      colorScheme="yellow"
                      size="lg"
                      w="full"
                      isLoading={isLoading}
                      loadingText="Creating Account..."
                      rightIcon={<FiArrowRight />}
                      _hover={{ bg: "yellow.500" }}
                      mt={4}
                    >
                      Create Account
                    </Button>
                  </VStack>
                </form>

                <Text textAlign="center" color="gray.500" fontSize="sm" mt={6}>
                  Already have an account?{" "}
                  <Link to="/login" style={{ color: accentColor, fontWeight: "medium" }}>
                    Sign in
                  </Link>
                </Text>
              </VStack>
            </Box>
          </MotionBox>
        </Flex>
      </Container>
    </Box>
  );
};

export default Register;