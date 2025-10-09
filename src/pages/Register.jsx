import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  useToast, Box, Text, Input, Button, FormControl, FormLabel,
  VStack, HStack, Flex, Container, Heading, InputGroup, InputRightElement,
  ScaleFade, FormErrorMessage, InputLeftElement, PinInput, PinInputField,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FiEye, FiEyeOff, FiArrowRight, FiMail, FiLock, FiUser,
  FiCalendar, FiCheckCircle, FiShield, FiPhone
} from "react-icons/fi";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const MotionBox = motion(Box);

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
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  
  const navigate = useNavigate();
  const toast = useToast();

  const accentColor = "#B38939";

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      calculatePasswordStrength(value);
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const calculatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
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
          age--;
        }
        if (age < 18) newErrors.dateOfBirth = "You must be at least 18 years old";
      }
    }
    if (formData.phoneNumber && !/^(0\d{10}|\+234\d{10})$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be 11 digits starting with 0 or +234";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password) || !/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password = "Password must include uppercase, number, and special character";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestOTP = async (e) => {
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
      await axios.post(`${BASE_URL}/api/auth/register/request-otp`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber
      });

      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top"
      });

      setShowOTPModal(true);
      setOtpTimer(300); // 5 minutes
    } catch (error) {
      console.error('Request OTP error:', error.response?.data || error);
      let errorMessage = 'Unable to send OTP. Please try again.';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast({
        title: "Request Failed",
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

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
      return;
    }

    setIsVerifying(true);

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register/verify-otp`, {
        email: formData.email,
        otp: otp
      });

      toast({
        title: "Registration Successful",
        description: "Your email has been verified. Redirecting to dashboard...",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top"
      });

      // Store tokens
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setShowOTPModal(false);
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error('Verify OTP error:', error.response?.data || error);
      let errorMessage = 'Invalid OTP. Please try again.';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      if (error.response?.data?.attemptsRemaining) {
        errorMessage += ` (${error.response.data.attemptsRemaining} attempts remaining)`;
      }

      toast({
        title: "Verification Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/auth/register/request-otp`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber
      });

      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your email",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top"
      });

      setOtp("");
      setOtpTimer(300);
    } catch (error) {
      toast({
        title: "Resend Failed",
        description: error.response?.data?.error || "Unable to resend OTP",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = (strength) => {
    if (strength === 0) return "gray.400";
    if (strength <= 2) return "red.500";
    if (strength <= 3) return "yellow.500";
    if (strength <= 4) return "green.400";
    return accentColor;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      minHeight="100vh"
      bgGradient="linear(to-br, #1A202C, #1A202C, #1A202C)"
      position="relative"
      overflow="hidden"
    >
      <Container
        maxW="container.xl"
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        pt={{ base: "80px", md: "0" }}
        px={{ base: 4, md: 6 }}
        py={{ base: 8, md: 12 }}
      >
        <Flex
          direction={{ base: "column", lg: "row" }}
          width="full"
          maxWidth="1100px"
          align="center"
          justify="center"
          gap={{ base: 6, lg: 12 }}
        >
          <Box
            flex="1"
            display={{ base: "none", lg: "flex" }}
            flexDirection="column"
            alignItems="flex-start"
            justifyContent="center"
            pr={{ lg: 6, xl: 10 }}
          >
            <Heading
              as="h1"
              size="2xl"
              bgGradient={`linear(to-r, ${accentColor}, #C99A45)`}
              bgClip="text"
              lineHeight="1.2"
              fontWeight="bold"
              mb={6}
            >
              Join Our Community
            </Heading>
            <Text fontSize="lg" color="#fff" lineHeight="tall" maxW="500px" mb={6}>
              Create your account today and experience secure transactions with our trusted escrow service.
            </Text>
            <VStack align="flex-start" spacing={4} mt={8}>
              <HStack>
                <Box color={accentColor}><FiCheckCircle size={20} /></Box>
                <Text color="#fff">Secure email verification</Text>
              </HStack>
              <HStack>
                <Box color={accentColor}><FiCheckCircle size={20} /></Box>
                <Text color="#fff">24/7 customer support</Text>
              </HStack>
              <HStack>
                <Box color={accentColor}><FiCheckCircle size={20} /></Box>
                <Text color="#fff">Fast and reliable process</Text>
              </HStack>
            </VStack>
          </Box>

          <Box flex="1" width={{ base: "100%", sm: "90%", md: "500px" }}>
            <ScaleFade initialScale={0.9} in={true}>
              <Box
                borderRadius="xl"
                bg="#031420"
                boxShadow="2xl"
                p={{ base: 5, sm: 6, md: 8 }}
                position="relative"
                overflow="hidden"
              >
                <VStack spacing={1} mb={6} align="flex-start">
                  <Heading size="lg" color="white" fontWeight="semibold">
                    Create Account
                  </Heading>
                  <Text fontSize="sm" color="gray.300">
                    All fields are required*
                  </Text>
                </VStack>

                <form onSubmit={handleRequestOTP}>
                  <VStack spacing={4}>
                    <Flex width="100%" direction={{ base: "column", sm: "row" }} gap={{ base: 4, sm: 3 }}>
                      <FormControl isRequired isInvalid={!!errors.firstName}>
                        <FormLabel fontSize="sm" color="gray.300">First Name</FormLabel>
                        <InputGroup size={{ base: "md", md: "md" }}>
                          <InputLeftElement pointerEvents="none" color="gray.400" children={<FiUser />} />
                          <Input
                            type="text"
                            name="firstName"
                            placeholder="First Name"
                            value={formData.firstName}
                            onChange={handleChange}
                            focusBorderColor={accentColor}
                            color="white"
                            borderRadius="md"
                            _hover={{ bg: "gray.600" }}
                            _focus={{ bg: "gray.600" }}
                          />
                        </InputGroup>
                        <FormErrorMessage>{errors.firstName}</FormErrorMessage>
                      </FormControl>

                      <FormControl isRequired isInvalid={!!errors.lastName}>
                        <FormLabel fontSize="sm" color="gray.300">Last Name</FormLabel>
                        <InputGroup size={{ base: "md", md: "md" }}>
                          <InputLeftElement pointerEvents="none" color="gray.400" children={<FiUser />} />
                          <Input
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            value={formData.lastName}
                            onChange={handleChange}
                            focusBorderColor={accentColor}
                            color="white"
                            borderRadius="md"
                            _hover={{ bg: "gray.600" }}
                            _focus={{ bg: "gray.600" }}
                          />
                        </InputGroup>
                        <FormErrorMessage>{errors.lastName}</FormErrorMessage>
                      </FormControl>
                    </Flex>

                    <FormControl isRequired isInvalid={!!errors.email}>
                      <FormLabel fontSize="sm" color="gray.300">Email Address</FormLabel>
                      <InputGroup size={{ base: "md", md: "md" }}>
                        <InputLeftElement pointerEvents="none" color="gray.400" children={<FiMail />} />
                        <Input
                          type="email"
                          name="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          focusBorderColor={accentColor}
                          color="white"
                          borderRadius="md"
                          _hover={{ bg: "gray.600" }}
                          _focus={{ bg: "gray.600" }}
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.email}</FormErrorMessage>
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.phoneNumber}>
                      <FormLabel fontSize="sm" color="gray.300">Phone Number</FormLabel>
                      <InputGroup size={{ base: "md", md: "md" }}>
                        <InputLeftElement pointerEvents="none" color="gray.400" children={<FiPhone />} />
                        <Input
                          type="tel"
                          name="phoneNumber"
                          placeholder="08012345678 or +2348012345678"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          focusBorderColor={accentColor}
                          color="white"
                          borderRadius="md"
                          _hover={{ bg: "gray.600" }}
                          _focus={{ bg: "gray.600" }}
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.phoneNumber}</FormErrorMessage>
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.dateOfBirth}>
                      <FormLabel fontSize="sm" color="gray.300">Date of Birth</FormLabel>
                      <InputGroup size={{ base: "md", md: "md" }}>
                        <InputLeftElement pointerEvents="none" color="gray.400" children={<FiCalendar />} />
                        <Input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          focusBorderColor={accentColor}
                          color="white"
                          borderRadius="md"
                          _hover={{ bg: "gray.600" }}
                          _focus={{ bg: "gray.600" }}
                        />
                      </InputGroup>
                      <FormErrorMessage>{errors.dateOfBirth}</FormErrorMessage>
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.password}>
                      <FormLabel fontSize="sm" color="gray.300">Password</FormLabel>
                      <InputGroup size={{ base: "md", md: "md" }}>
                        <InputLeftElement pointerEvents="none" color="gray.400" children={<FiLock />} />
                        <Input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Create password (min. 8 characters)"
                          value={formData.password}
                          onChange={handleChange}
                          focusBorderColor={accentColor}
                          color="white"
                          borderRadius="md"
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
                      {formData.password && (
                        <Flex mt={2} align="center">
                          <Box width="100%" height="4px" borderRadius="full" overflow="hidden">
                            <Box
                              height="100%"
                              width={`${passwordStrength * 20}%`}
                              bg={getStrengthColor(passwordStrength)}
                              transition="width 0.3s ease"
                            />
                          </Box>
                          <Text fontSize="xs" color={getStrengthColor(passwordStrength)} ml={2}>
                            {passwordStrength <= 2 ? "Weak" : passwordStrength <= 3 ? "Fair" : passwordStrength <= 4 ? "Good" : "Strong"}
                          </Text>
                        </Flex>
                      )}
                    </FormControl>

                    <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                      <FormLabel fontSize="sm" color="gray.300">Confirm Password</FormLabel>
                      <InputGroup size={{ base: "md", md: "md" }}>
                        <InputLeftElement pointerEvents="none" color="gray.400" children={<FiShield />} />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Re-enter your password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          focusBorderColor={accentColor}
                          color="white"
                          borderRadius="md"
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
                      bg={accentColor}
                      color="white"
                      fontWeight="medium"
                      _hover={{ bg: "#A47F35", transform: "translateY(-2px)", boxShadow: "lg" }}
                      isLoading={isLoading}
                      loadingText="Sending OTP"
                      borderRadius="lg"
                      rightIcon={<FiArrowRight />}
                    >
                      Continue
                    </Button>
                  </VStack>
                </form>
              </Box>
            </ScaleFade>

            <Box textAlign="center" mt={6}>
              <Text fontSize={{ base: "sm", md: "md" }} color="gray.600">
                Already have an account?{" "}
                <Link to="/login">
                  <Text as="span" color={accentColor} fontWeight="bold" _hover={{ textDecoration: "underline" }}>
                    Log In
                  </Text>
                </Link>
              </Text>
            </Box>
          </Box>
        </Flex>
      </Container>

      {/* OTP Verification Modal */}
      <Modal isOpen={showOTPModal} onClose={() => setShowOTPModal(false)} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="#031420" color="white" mx={4}>
          <ModalHeader>Verify Your Email</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.300" textAlign="center">
                We've sent a 6-digit verification code to{" "}
                <Text as="span" fontWeight="bold" color={accentColor}>
                  {formData.email}
                </Text>
              </Text>

              <HStack justify="center" spacing={2}>
                <PinInput
                  otp
                  size="lg"
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleVerifyOTP}
                  focusBorderColor={accentColor}
                >
                  <PinInputField bg="gray.700" color="white" />
                  <PinInputField bg="gray.700" color="white" />
                  <PinInputField bg="gray.700" color="white" />
                  <PinInputField bg="gray.700" color="white" />
                  <PinInputField bg="gray.700" color="white" />
                  <PinInputField bg="gray.700" color="white" />
                </PinInput>
              </HStack>

              {otpTimer > 0 && (
                <Text fontSize="sm" color="gray.400">
                  Code expires in {formatTime(otpTimer)}
                </Text>
              )}

              <Button
                width="full"
                bg={accentColor}
                color="white"
                onClick={handleVerifyOTP}
                isLoading={isVerifying}
                loadingText="Verifying"
                _hover={{ bg: "#A47F35" }}
                isDisabled={otp.length !== 6}
              >
                Verify Email
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendOTP}
                isDisabled={otpTimer > 0}
                color={accentColor}
                _hover={{ bg: "gray.700" }}
              >
                {otpTimer > 0 ? `Resend in ${formatTime(otpTimer)}` : "Resend OTP"}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Register;