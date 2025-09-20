import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import instance from "../../utils/axiosConfig";
import {
  Box,
  Text,
  Spinner,
  Flex,
  VStack,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Heading,
  Badge,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FaShieldAlt, FaIdCard, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3001";
const MotionBox = motion(Box);

const Kyc = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({ bvn: "" });
  const [errors, setErrors] = useState({});
  const [kycStatus, setKycStatus] = useState({ isSubmitted: false, status: "not_submitted" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768;
      const savedSidebarState = localStorage.getItem("sidebarCollapsed");
      return isMobile ? true : savedSidebarState ? JSON.parse(savedSidebarState) : false;
    }
    return false;
  });

  // Dynamic color scheme
  const bgColor = useColorModeValue("gray.100", "#1A202C");
  const cardBg = useColorModeValue("white", "#051E2F");
  const textColor = useColorModeValue("#051E2F", "white");
  const subtleTextColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "#051E2F");

  // Handle sidebar resize
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsSidebarCollapsed((prev) => {
        const savedSidebarState = localStorage.getItem("sidebarCollapsed");
        return mobile ? true : savedSidebarState ? JSON.parse(savedSidebarState) : prev;
      });
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Validate BVN
  const validateBVN = useCallback((bvn) => {
    if (!bvn) return "BVN is required";
    if (!/^\d{11}$/.test(bvn)) return "BVN must be an 11-digit number";
    return null;
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    // Only allow numbers and limit to 11 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 11);
    setFormData((prev) => ({ ...prev, [name]: numericValue }));
    const error = validateBVN(numericValue);
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, [validateBVN]);

  // Fetch KYC status
  useEffect(() => {
    const fetchKycStatus = async () => {
      const token = localStorage.getItem("access-token");
      if (!token) {
        console.log("No access token found, redirecting to login");
        navigate("/login");
        return;
      }

      try {
        const response = await instance.get(`${BASE_URL}/api/kyc/kyc-details`);
        console.log("KYC status response:", response.data);
        setKycStatus({
          isSubmitted: response.data.isKycSubmitted || false,
          status: response.data.kycDetails?.status || "not_submitted",
        });
      } catch (error) {
        console.error("Error fetching KYC status:", error.message, {
          status: error.response?.status,
          url: error.config?.url,
          details: error.response?.data,
        });
        if (error.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        } else if (error.response?.status === 404) {
          setKycStatus({ isSubmitted: false, status: "not_submitted" });
        } else {
          toast({
            title: "Connection Error",
            description: "Unable to check KYC status. Please try again.",
            status: "error",
            duration: 3000,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchKycStatus();
  }, [navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const bvnError = validateBVN(formData.bvn);
    if (bvnError) {
      setErrors({ bvn: bvnError });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await instance.post(`${BASE_URL}/api/kyc/submit-kyc`, {
        bvn: formData.bvn,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Submission failed");
      }

      toast({
        title: "Success!",
        description: `BVN verification submitted successfully. Status: ${response.data.status}.`,
        status: "success",
        duration: 4000,
      });

      setKycStatus({ isSubmitted: true, status: response.data.status });
      setFormData({ bvn: "" });
      setErrors({});
      setRetryCount(0);
    } catch (error) {
      console.error("BVN submission error:", error);
      
      let errorMessage = "An error occurred during BVN verification";
      let canRetry = false;

      if (error.response?.status === 408 || error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please try again.";
        canRetry = true;
      } else if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a few minutes before trying again.";
        canRetry = true;
      } else if (error.response?.status === 503) {
        errorMessage = "Service temporarily unavailable. Please try again later.";
        canRetry = true;
      } else if (error.response?.status === 400) {
        const apiError = error.response.data?.error;
        if (apiError?.toLowerCase().includes('invalid')) {
          errorMessage = "Invalid BVN provided. Please check and try again.";
        } else if (apiError?.toLowerCase().includes('already submitted')) {
          errorMessage = "BVN verification already submitted.";
          // Refresh status
          setKycStatus({ isSubmitted: true, status: "pending" });
        } else {
          errorMessage = apiError || errorMessage;
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        canRetry = error.response.status >= 500;
      }

      toast({
        title: "Verification Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      // Auto-retry logic for network errors
      if (canRetry && retryCount < 2 && (error.response?.status >= 500 || error.code === 'ECONNABORTED')) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleSubmit(e);
        }, 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles = {
    bg: cardBg,
    color: textColor,
    borderWidth: "1px",
    borderColor: useColorModeValue("gray.300", "gray.600"),
    _hover: { borderColor: "#B38939" },
    _focus: { borderColor: "#BB954D", boxShadow: `0 0 0 1px #B38939` },
    h: "44px",
    borderRadius: "lg",
  };

  // Status configuration
  const getStatusConfig = (status) => {
    switch (status) {
      case "approved":
        return {
          text: "Verified Successfully",
          color: "green.500",
          bgColor: "green.50",
          borderColor: "green.200",
          icon: FaCheckCircle,
          iconColor: "green.500",
          description: "Your BVN has been successfully verified and approved.",
          showTryAgain: false
        };
      case "rejected":
        return {
          text: "Verification Failed",
          color: "red.500",
          bgColor: "red.50",
          borderColor: "red.200",
          icon: FaTimesCircle,
          iconColor: "red.500",
          description: "Your BVN verification was rejected. Please check your details and try again.",
          showTryAgain: true
        };
      default:
        return {
          text: "Under Review",
          color: "#BB954D",
          bgColor: useColorModeValue("#FEF7E8", "#2D1B0A"),
          borderColor: "#B38939",
          icon: FaClock,
          iconColor: "#B38939",
          description: "Your BVN verification is currently being reviewed. This may take a few minutes.",
          showTryAgain: false
        };
    }
  };

  if (isLoading) {
    return (
      <Box bg={bgColor} minH="100vh">
        <Sidebar onCollapseChange={setIsSidebarCollapsed} />
        <Box ml={isSidebarCollapsed ? "80px" : "280px"} display={{ base: "none", md: "block" }}>
          <Flex h="100vh" align="center" justify="center" direction="column">
            <Spinner thickness="4px" speed="0.65s" emptyColor={subtleTextColor} color="#B38939" size="xl" />
            <Text mt={4} color={textColor} fontWeight="medium">Loading KYC status...</Text>
          </Flex>
        </Box>
      </Box>
    );
  }

  if (kycStatus.isSubmitted) {
    const statusConfig = getStatusConfig(kycStatus.status);
    const StatusIcon = statusConfig.icon;

    return (
      <Box bg={bgColor} minH="100vh">
        <Sidebar onCollapseChange={setIsSidebarCollapsed} />

        {/* Desktop Layout */}
        <Box ml={isSidebarCollapsed ? "80px" : "280px"} display={{ base: "none", md: "block" }}>
          <Flex h="100vh" align="center" justify="center" px={4}>
            <MotionBox
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              bg={cardBg}
              p={6}
              borderRadius="lg"
              textAlign="center"
              maxW="420px"
              w="100%"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="md"
            >
              <VStack spacing={4}>
                <Box bg={statusConfig.color} borderRadius="full" p={2.5}>
                  <StatusIcon size="20px" color="white" />
                </Box>
                <VStack spacing={1}>
                  <Heading size="md" color={textColor} fontWeight="600">
                    BVN Verification
                  </Heading>
                  <Text color={subtleTextColor} fontSize="sm">
                    {statusConfig.description}
                  </Text>
                </VStack>
                <Badge
                  bg={statusConfig.color}
                  color="white"
                  px={3}
                  py={1.5}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="600"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <StatusIcon size="10px" />
                  {statusConfig.text}
                </Badge>
                <VStack spacing={2} w="100%" pt={1}>
                  {statusConfig.showTryAgain && (
                    <Button
                      bg="#B38939"
                      color="white"
                      borderRadius="lg"
                      h="40px"
                      px={6}
                      fontSize="sm"
                      fontWeight="500"
                      w="100%"
                      _hover={{ bg: "#BB954D" }}
                      onClick={() => setKycStatus({ isSubmitted: false, status: "not_submitted" })}
                    >
                      Try Again
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    borderColor="#B38939"
                    color={textColor}
                    borderRadius="lg"
                    h="40px"
                    px={6}
                    fontSize="sm"
                    fontWeight="500"
                    w="100%"
                    _hover={{ bg: "#B38939", color: "white" }}
                    onClick={() => navigate("/dashboard")}
                  >
                    Back to Dashboard
                  </Button>
                </VStack>
              </VStack>
            </MotionBox>
          </Flex>
        </Box>

        {/* Mobile Layout */}
        <Box display={{ base: "block", md: "none" }} pt="60px" pb="80px" px={4}>
          <Flex justify="center" py={4}>
            <MotionBox
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              bg={cardBg}
              p={5}
              borderRadius="lg"
              textAlign="center"
              w="100%"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="sm"
            >
              <VStack spacing={3}>
                <Box bg={statusConfig.color} borderRadius="full" p={2}>
                  <StatusIcon size="18px" color="white" />
                </Box>
                <VStack spacing={1}>
                  <Heading size="sm" color={textColor} fontWeight="600">
                    BVN Verification
                  </Heading>
                  <Text color={subtleTextColor} fontSize="xs">
                    {statusConfig.description}
                  </Text>
                </VStack>
                <Badge
                  bg={statusConfig.color}
                  color="white"
                  px={3}
                  py={1}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="500"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <StatusIcon size="8px" />
                  {statusConfig.text}
                </Badge>
                <VStack spacing={2} w="100%" pt={1}>
                  {statusConfig.showTryAgain && (
                    <Button
                      bg="#B38939"
                      color="white"
                      borderRadius="lg"
                      h="36px"
                      fontSize="sm"
                      fontWeight="500"
                      w="100%"
                      _hover={{ bg: "#BB954D" }}
                      onClick={() => setKycStatus({ isSubmitted: false, status: "not_submitted" })}
                    >
                      Try Again
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    borderColor="#B38939"
                    color={textColor}
                    borderRadius="lg"
                    h="36px"
                    fontSize="sm"
                    fontWeight="500"
                    w="100%"
                    _hover={{ bg: "#B38939", color: "white" }}
                    onClick={() => navigate("/dashboard")}
                  >
                    Back to Dashboard
                  </Button>
                </VStack>
              </VStack>
            </MotionBox>
          </Flex>
        </Box>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      <Sidebar onCollapseChange={setIsSidebarCollapsed} />
      {/* Desktop Layout */}
      <Box ml={isSidebarCollapsed ? "80px" : "280px"} display={{ base: "none", md: "block" }}>
        <Flex justify="center" py={8} px={4}>
          <MotionBox
            as="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            w="100%"
            maxW="500px"
            bg={cardBg}
            p={8}
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="lg"
          >
            <VStack spacing={1} mb={8} textAlign="center">
              <Box bg="#B38939" borderRadius="full" p={3} mb={2}>
                <FaShieldAlt size="24px" color="white" />
              </Box>
              <Heading color={textColor} fontSize="2xl" fontWeight="bold">
                BVN Verification
              </Heading>
              <Text color={subtleTextColor} fontSize="sm">Verify your identity with your BVN</Text>
              {retryCount > 0 && (
                <Text color="#B38939" fontSize="xs" mt={1}>
                  Retry attempt {retryCount}/2
                </Text>
              )}
            </VStack>

            <FormControl isInvalid={!!errors.bvn} mb={8}>
              <FormLabel fontWeight="600" fontSize="sm" color={textColor} display="flex" alignItems="center">
                <FaIdCard color="#B38939" />
                <Text ml={2}>Bank Verification Number (BVN)</Text>
              </FormLabel>
              <Input
                type="text"
                name="bvn"
                placeholder="Enter your 11-digit BVN"
                value={formData.bvn}
                onChange={handleInputChange}
                maxLength={11}
                {...inputStyles}
              />
              <FormErrorMessage>{errors.bvn}</FormErrorMessage>
              <Text color={subtleTextColor} fontSize="xs" mt={1}>
                Your BVN is used to verify your identity securely
              </Text>
            </FormControl>

            <Flex justify="flex-end" gap={3}>
              <Button
                variant="outline"
                borderColor="#B38939"
                color={textColor}
                borderRadius="lg"
                h="44px"
                px={6}
                _hover={{ bg: "#B38939", color: "white" }}
                onClick={() => navigate("/dashboard")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                bg="#B38939"
                color="white"
                isLoading={isSubmitting}
                loadingText={retryCount > 0 ? "Retrying..." : "Verifying"}
                borderRadius="lg"
                h="44px"
                px={6}
                _hover={{ bg: "#BB954D" }}
                disabled={isSubmitting || !formData.bvn || formData.bvn.length !== 11}
              >
                {retryCount > 0 ? "Retry Verification" : "Verify BVN"}
              </Button>
            </Flex>
          </MotionBox>
        </Flex>
      </Box>

      {/* Mobile Layout */}
      <Box display={{ base: "block", md: "none" }} pt="60px" pb="80px" px={4}>
        <Flex justify="center" py={4}>
          <MotionBox
            as="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            w="100%"
            bg={cardBg}
            p={6}
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="lg"
          >
            <VStack spacing={1} mb={6} textAlign="center">
              <Box bg="#B38939" borderRadius="full" p={2} mb={2}>
                <FaShieldAlt size="20px" color="white" />
              </Box>
              <Heading color={textColor} fontSize="xl">BVN Verification</Heading>
              <Text color={subtleTextColor} fontSize="xs">Verify your identity with your BVN</Text>
              {retryCount > 0 && (
                <Text color="#B38939" fontSize="xs" mt={1}>
                  Retry {retryCount}/2
                </Text>
              )}
            </VStack>

            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.bvn}>
                <FormLabel fontSize="sm" color={textColor}>Bank Verification Number (BVN)</FormLabel>
                <Input
                  type="text"
                  name="bvn"
                  placeholder="Enter your 11-digit BVN"
                  value={formData.bvn}
                  onChange={handleInputChange}
                  maxLength={11}
                  {...inputStyles}
                  h="40px"
                />
                <FormErrorMessage>{errors.bvn}</FormErrorMessage>
                <Text color={subtleTextColor} fontSize="xs" mt={1}>
                  Used to verify your identity securely
                </Text>
              </FormControl>

              <Flex w="100%" gap={2}>
                <Button
                  variant="outline"
                  borderColor="#B38939"
                  color={textColor}
                  flex={1}
                  h="40px"
                  onClick={() => navigate("/dashboard")}
                  _hover={{ bg: "#B38939", color: "white" }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  bg="#B38939"
                  color="white"
                  isLoading={isSubmitting}
                  loadingText={retryCount > 0 ? "Retrying..." : "Verifying"}
                  flex={2}
                  h="40px"
                  _hover={{ bg: "#BB954D" }}
                  disabled={isSubmitting || !formData.bvn || formData.bvn.length !== 11}
                >
                  {retryCount > 0 ? "Retry" : "Verify"}
                </Button>
              </Flex>
            </VStack>
          </MotionBox>
        </Flex>
      </Box>
    </Box>
  );
};

export default Kyc;