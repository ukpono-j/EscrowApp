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
  Select,
  Input,
  Image,
  Heading,
  Badge,
  Progress,
  useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FaUpload, FaCheck, FaIdCard, FaUser, FaCalendarAlt, FaFileAlt, FaShieldAlt } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3001";
const MotionBox = motion(Box);

// Sylo brand colors
const BRAND_COLORS = {
  primary: "#1A202C",
  secondary: "#051E2F", 
  gold: "#B38939",
  lightGold: "#BB954D",
  background: "#0A0E13",
  surface: "#1A202C",
  accent: "#2D3748"
};

const FileUploadCard = React.memo(({ label, previewSrc, onChange, name, error, icon }) => (
  <FormControl isInvalid={!!error} mb={4}>
    <FormLabel fontWeight="600" fontSize="sm" color="white" display="flex" alignItems="center">
      {icon}
      <Text ml={2}>{label}</Text>
    </FormLabel>
    <Box
      position="relative"
      h="140px"
      w="100%"
      borderRadius="lg"
      borderWidth="2px"
      borderColor={previewSrc ? BRAND_COLORS.gold : error ? "red.400" : "gray.600"}
      overflow="hidden"
      transition="all 0.2s"
      bg={BRAND_COLORS.surface}
      _hover={{ 
        borderColor: error ? "red.500" : BRAND_COLORS.lightGold, 
        transform: "translateY(-1px)",
        boxShadow: `0 4px 20px ${BRAND_COLORS.gold}20`
      }}
    >
      {previewSrc ? (
        <Image src={previewSrc} alt={`${label} Preview`} objectFit="cover" w="100%" h="100%" />
      ) : (
        <Flex align="center" justify="center" h="100%" flexDirection="column">
          <FaFileAlt size="20px" color={BRAND_COLORS.gold} />
          <Text fontSize="xs" mt={2} color="gray.400">Click to upload</Text>
        </Flex>
      )}
      <Flex
        position="absolute"
        bottom="8px"
        right="8px"
        w="36px"
        h="36px"
        borderRadius="full"
        bg={`${BRAND_COLORS.gold}E6`}
        align="center"
        justify="center"
        cursor="pointer"
        _hover={{ bg: BRAND_COLORS.gold, transform: "scale(1.05)" }}
      >
        <Input
          type="file"
          name={name}
          onChange={onChange}
          position="absolute"
          opacity="0"
          w="36px"
          h="36px"
          cursor="pointer"
          accept="image/jpeg,image/png"
        />
        <FaUpload color="white" size="14px" />
      </Flex>
    </Box>
    {error && <FormErrorMessage>{error}</FormErrorMessage>}
  </FormControl>
));

const Kyc = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    documentType: "",
    documentPhoto: null,
    personalPhoto: null,
    firstName: "",
    lastName: "",
    dateOfBirth: "",
  });
  const [errors, setErrors] = useState({});
  const [isKycSubmitted, setIsKycSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [previews, setPreviews] = useState({ documentPhoto: null, personalPhoto: null });

  // Optimized validation functions
  const validateFile = useCallback((file) => {
    if (!file) return "File required";
    if (!["image/jpeg", "image/png"].includes(file.type)) return "JPEG/PNG only";
    if (file.size > 5 * 1024 * 1024) return "Max 5MB";
    return null;
  }, []);

  const validateAge = useCallback((date) => {
    if (!date) return "Date required";
    const age = new Date().getFullYear() - new Date(date).getFullYear();
    return age < 18 ? "Must be 18+" : null;
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value, files } = e.target;
    
    if (files) {
      const file = files[0];
      const error = validateFile(file);
      if (error) {
        setErrors(prev => ({ ...prev, [name]: error }));
        return;
      }
      setFormData(prev => ({ ...prev, [name]: file }));
      setPreviews(prev => ({ ...prev, [name]: URL.createObjectURL(file) }));
      setErrors(prev => ({ ...prev, [name]: null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      const error = name === "dateOfBirth" ? validateAge(value) : 
                   value ? null : `${name.replace(/([A-Z])/g, " $1")} required`;
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [validateFile, validateAge]);

  // Fetch KYC status
  useEffect(() => {
    const fetchKycStatus = async () => {
      const token = localStorage.getItem("access-token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await instance.get(`${BASE_URL}/api/kyc/kyc-details`);
        setIsKycSubmitted(response.data.isKycSubmitted);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        } else if (error.response?.status !== 404) {
          toast({
            title: "Connection Error",
            description: "Unable to check KYC status",
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

  // Optimized upload function
  const uploadFiles = async (docPhoto, personalPhoto) => {
    const formData = new FormData();
    formData.append("documentPhoto", docPhoto);
    formData.append("personalPhoto", personalPhoto);

    const response = await instance.post(`${BASE_URL}/api/kyc/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
    });

    if (!response.data.success) throw new Error("Upload failed");
    return response.data;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Quick validation
    const newErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (!value) newErrors[key] = "Required";
    });

    if (formData.dateOfBirth) {
      const ageError = validateAge(formData.dateOfBirth);
      if (ageError) newErrors.dateOfBirth = ageError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Upload files
      const { documentPhotoPath, personalPhotoPath } = await uploadFiles(
        formData.documentPhoto, 
        formData.personalPhoto
      );

      // Submit KYC
      const kycData = {
        documentType: formData.documentType,
        documentPhotoPath,
        personalPhotoPath,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
      };

      const response = await instance.post(`${BASE_URL}/api/kyc/submit-kyc`, kycData);
      
      if (!response.data.success) throw new Error("Submission failed");

      toast({
        title: "Success!",
        description: "KYC submitted for review",
        status: "success",
        duration: 3000,
      });

      setIsKycSubmitted(true);
      setFormData({ documentType: "", documentPhoto: null, personalPhoto: null, firstName: "", lastName: "", dateOfBirth: "" });
      setPreviews({ documentPhoto: null, personalPhoto: null });
      setErrors({});

    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error.message,
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const inputStyles = {
    bg: BRAND_COLORS.surface,
    color: "white",
    borderColor: "gray.600",
    _hover: { borderColor: BRAND_COLORS.gold },
    _focus: { borderColor: BRAND_COLORS.lightGold, boxShadow: `0 0 0 1px ${BRAND_COLORS.gold}` },
    h: "44px",
    borderRadius: "lg",
  };

  if (isLoading) {
    return (
      <Box bg={BRAND_COLORS.background} minH="100vh">
        <Sidebar onCollapseChange={setIsSidebarCollapsed} />
        <Box ml={isSidebarCollapsed ? "80px" : "280px"} display={{ base: "none", md: "block" }}>
          <Flex h="100vh" align="center" justify="center" direction="column">
            <Spinner thickness="4px" speed="0.65s" emptyColor="gray.600" color={BRAND_COLORS.gold} size="xl" />
            <Text mt={4} color="white" fontWeight="medium">Loading KYC status...</Text>
          </Flex>
        </Box>
      </Box>
    );
  }

  if (isKycSubmitted) {
    return (
      <Box bg={BRAND_COLORS.background} minH="100vh">
        <Sidebar onCollapseChange={setIsSidebarCollapsed} />
        <Box ml={isSidebarCollapsed ? "80px" : "280px"} display={{ base: "none", md: "block" }}>
          <Flex h="100vh" align="center" justify="center">
            <MotionBox
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              bg={BRAND_COLORS.surface}
              p={8}
              borderRadius="xl"
              textAlign="center"
              maxW="500px"
              border="2px solid"
              borderColor={BRAND_COLORS.gold}
            >
              <Box bg={BRAND_COLORS.gold} borderRadius="full" p={4} mx="auto" mb={4} w="fit-content">
                <FaCheck size="32px" color="white" />
              </Box>
              <Heading size="lg" color="white" mb={4}>KYC Submitted</Heading>
              <Text color="gray.300" mb={6}>Your documents are under review</Text>
              <Badge bg={BRAND_COLORS.lightGold} color="white" p={2} borderRadius="md">
                <FaShieldAlt style={{ marginRight: "8px", display: "inline" }} />
                Under Review
              </Badge>
            </MotionBox>
          </Flex>
        </Box>
      </Box>
    );
  }

  return (
    <Box bg={BRAND_COLORS.background} minH="100vh">
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
            maxW="800px"
            bg={BRAND_COLORS.surface}
            p={8}
            borderRadius="xl"
            border="2px solid"
            borderColor={BRAND_COLORS.accent}
          >
            {/* Header */}
            <VStack spacing={1} mb={8} textAlign="center">
              <Box bg={BRAND_COLORS.gold} borderRadius="full" p={3} mb={2}>
                <FaShieldAlt size="24px" color="white" />
              </Box>
              <Heading color="white" fontSize="2xl" fontWeight="bold">
                <span>Identity Verification</span>
              </Heading>
              <Text color="gray.400" fontSize="sm">
                Secure your account with KYC verification
              </Text>
            </VStack>

            {/* Document Type */}
            <FormControl isInvalid={!!errors.documentType} mb={6}>
              <FormLabel fontWeight="600" fontSize="sm" color="white" display="flex" alignItems="center">
                <FaIdCard color={BRAND_COLORS.gold} />
                <Text ml={2}>Document Type</Text>
              </FormLabel>
              <Select
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                placeholder="Select ID Type"
                {...inputStyles}
              >
                <option value="Drivers License" style={{ background: BRAND_COLORS.surface }}>Driver's License</option>
                <option value="NIN Slip" style={{ background: BRAND_COLORS.surface }}>NIN Slip</option>
                <option value="Passport" style={{ background: BRAND_COLORS.surface }}>Passport</option>
              </Select>
              <FormErrorMessage>{errors.documentType}</FormErrorMessage>
            </FormControl>

            {/* File Uploads */}
            <Flex direction={{ base: "column", md: "row" }} gap={6} mb={6}>
              <FileUploadCard
                label="Document Photo"
                previewSrc={previews.documentPhoto}
                onChange={handleInputChange}
                name="documentPhoto"
                error={errors.documentPhoto}
                icon={<FaIdCard color={BRAND_COLORS.gold} />}
              />
              <FileUploadCard
                label="Personal Photo"
                previewSrc={previews.personalPhoto}
                onChange={handleInputChange}
                name="personalPhoto"
                error={errors.personalPhoto}
                icon={<FaUser color={BRAND_COLORS.gold} />}
              />
            </Flex>

            {/* Upload Progress */}
            {uploadProgress > 0 && (
              <Box mb={6}>
                <Text fontSize="sm" color="gray.300" mb={2}>Uploading... {uploadProgress}%</Text>
                <Progress value={uploadProgress} colorScheme="yellow" bg="gray.700" borderRadius="full" />
              </Box>
            )}

            {/* Name Fields */}
            <Flex direction={{ base: "column", md: "row" }} gap={4} mb={6}>
              <FormControl isInvalid={!!errors.firstName}>
                <FormLabel fontWeight="600" fontSize="sm" color="white" display="flex" alignItems="center">
                  <FaUser color={BRAND_COLORS.gold} />
                  <Text ml={2}>First Name</Text>
                </FormLabel>
                <Input
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  {...inputStyles}
                />
                <FormErrorMessage>{errors.firstName}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.lastName}>
                <FormLabel fontWeight="600" fontSize="sm" color="white" display="flex" alignItems="center">
                  <FaUser color={BRAND_COLORS.gold} />
                  <Text ml={2}>Last Name</Text>
                </FormLabel>
                <Input
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  {...inputStyles}
                />
                <FormErrorMessage>{errors.lastName}</FormErrorMessage>
              </FormControl>
            </Flex>

            {/* Date of Birth */}
            <FormControl isInvalid={!!errors.dateOfBirth} mb={8}>
              <FormLabel fontWeight="600" fontSize="sm" color="white" display="flex" alignItems="center">
                <FaCalendarAlt color={BRAND_COLORS.gold} />
                <Text ml={2}>Date of Birth</Text>
              </FormLabel>
              <Input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                {...inputStyles}
              />
              <FormErrorMessage>{errors.dateOfBirth}</FormErrorMessage>
            </FormControl>

            {/* Action Buttons */}
            <Flex justify="flex-end" gap={3}>
              <Button
                variant="outline"
                borderColor={BRAND_COLORS.gold}
                color="white"
                borderRadius="lg"
                h="44px"
                px={6}
                _hover={{ bg: `${BRAND_COLORS.gold}20` }}
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                bg={BRAND_COLORS.gold}
                color="white"
                isLoading={isSubmitting}
                loadingText="Submitting"
                borderRadius="lg"
                h="44px"
                px={6}
                _hover={{ bg: BRAND_COLORS.lightGold }}
                disabled={isSubmitting}
              >
                Submit KYC
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
            bg={BRAND_COLORS.surface}
            p={6}
            borderRadius="xl"
            border="1px solid"
            borderColor={BRAND_COLORS.accent}
          >
            <VStack spacing={1} mb={6} textAlign="center">
              <Box bg={BRAND_COLORS.gold} borderRadius="full" p={2} mb={2}>
                <FaShieldAlt size="20px" color="white" />
              </Box>
              <Heading color="white" fontSize="xl">KYC Verification</Heading>
              <Text color="gray.400" fontSize="xs">Complete your identity verification</Text>
            </VStack>

            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.documentType}>
                <FormLabel fontSize="sm" color="white">Document Type</FormLabel>
                <Select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  {...inputStyles}
                  h="40px"
                >
                  <option value="Drivers License">Driver's License</option>
                  <option value="NIN Slip">NIN Slip</option>
                  <option value="Passport">Passport</option>
                </Select>
                <FormErrorMessage>{errors.documentType}</FormErrorMessage>
              </FormControl>

              <FileUploadCard
                label="Document"
                previewSrc={previews.documentPhoto}
                onChange={handleInputChange}
                name="documentPhoto"
                error={errors.documentPhoto}
                icon={<FaIdCard color={BRAND_COLORS.gold} />}
              />

              <FileUploadCard
                label="Selfie"
                previewSrc={previews.personalPhoto}
                onChange={handleInputChange}
                name="personalPhoto"
                error={errors.personalPhoto}
                icon={<FaUser color={BRAND_COLORS.gold} />}
              />

              {uploadProgress > 0 && (
                <Box w="100%">
                  <Progress value={uploadProgress} colorScheme="yellow" bg="gray.700" borderRadius="full" />
                </Box>
              )}

              <Flex gap={2} w="100%">
                <FormControl isInvalid={!!errors.firstName}>
                  <FormLabel fontSize="sm" color="white">First Name</FormLabel>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    {...inputStyles}
                    h="40px"
                  />
                  <FormErrorMessage>{errors.firstName}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.lastName}>
                  <FormLabel fontSize="sm" color="white">Last Name</FormLabel>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    {...inputStyles}
                    h="40px"
                  />
                  <FormErrorMessage>{errors.lastName}</FormErrorMessage>
                </FormControl>
              </Flex>

              <FormControl isInvalid={!!errors.dateOfBirth}>
                <FormLabel fontSize="sm" color="white">Date of Birth</FormLabel>
                <Input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  {...inputStyles}
                  h="40px"
                />
                <FormErrorMessage>{errors.dateOfBirth}</FormErrorMessage>
              </FormControl>

              <Flex w="100%" gap={2}>
                <Button
                  variant="outline"
                  borderColor={BRAND_COLORS.gold}
                  color="white"
                  flex={1}
                  h="40px"
                  onClick={() => navigate("/dashboard")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  bg={BRAND_COLORS.gold}
                  color="white"
                  isLoading={isSubmitting}
                  flex={2}
                  h="40px"
                >
                  Submit
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