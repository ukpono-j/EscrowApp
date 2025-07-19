import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import instance from "../../utils/axiosConfig"; // Your custom axios instance
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
  useColorModeValue,
  Heading,
  Badge,
  Progress,
  useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FaUpload, FaCheck, FaIdCard, FaUser, FaCalendarAlt, FaFileAlt } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3001";

const MotionBox = motion(Box);

const FileUploadCard = React.memo(({ label, previewSrc, onChange, name, error }) => {
  const borderColor = useColorModeValue("#3182CE", "#63B3ED");

  return (
    <FormControl isInvalid={!!error} mb={4}>
      <FormLabel fontWeight="600" textTransform="uppercase" fontSize="sm">
        {label}
      </FormLabel>
      <Box
        position="relative"
        h="150px"
        w="100%"
        borderRadius="xl"
        borderWidth="1px"
        borderColor={previewSrc ? "blue.400" : error ? "red.400" : "gray.300"}
        overflow="hidden"
        transition="all 0.3s"
        _hover={{ borderColor: error ? "red.500" : "blue.500", transform: "translateY(-2px)" }}
      >
        {previewSrc ? (
          <Image src={previewSrc} alt={`${label} Preview`} objectFit="cover" w="100%" h="100%" />
        ) : (
          <Flex align="center" justify="center" h="100%" flexDirection="column" bg="gray.800">
            <FaFileAlt size="24px" color="#4299E1" />
            <Text fontSize="xs" mt={2} color="gray.300">No file selected</Text>
          </Flex>
        )}
        <Flex
          position="absolute"
          bottom="10px"
          right="10px"
          w="40px"
          h="40px"
          borderRadius="full"
          bg="rgba(0, 0, 0, 0.7)"
          align="center"
          justify="center"
          cursor="pointer"
          borderWidth="2px"
          borderColor={borderColor}
          _hover={{ bg: "rgba(0, 0, 0, 0.8)", transform: "scale(1.05)" }}
        >
          <Input
            type="file"
            name={name}
            onChange={onChange}
            position="absolute"
            opacity="0"
            w="40px"
            h="40px"
            cursor="pointer"
            zIndex={2}
            accept="image/jpeg,image/png"
          />
          <FaUpload color="#fff" />
        </Flex>
      </Box>
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
});

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
  const [uploadProgress, setUploadProgress] = useState({ documentPhoto: 0, personalPhoto: 0 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState(null);
  const [personalPhotoPreview, setPersonalPhotoPreview] = useState(null);

  const bgColor = useColorModeValue("gray.900", "gray.900");
  const cardBgColor = useColorModeValue("#111518", "#0D1117");
  const textColor = useColorModeValue("white", "white");
  const buttonBgColor = useColorModeValue("blue.500", "blue.400");

  // Validate file
  const validateFile = (file) => {
    if (!file) return "No file selected";
    const validTypes = ["image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) return "Only JPEG or PNG files are allowed";
    if (file.size > 5 * 1024 * 1024) return "File size must be less than 5MB";
    if (!file.name) return "Invalid file name";
    return null;
  };

  // Validate date of birth
  const validateDateOfBirth = (date) => {
    if (!date) return "Date of birth is required";
    const dob = new Date(date);
    if (isNaN(dob.getTime())) return "Invalid date format";
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 18) return "You must be at least 18 years old";
    return null;
  };

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      const error = validateFile(file);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
        toast({
          title: "File Error",
          description: error,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
      const previewUrl = file ? URL.createObjectURL(file) : null;
      setFormData((prev) => ({ ...prev, [name]: file }));
      if (name === "documentPhoto") {
        setDocumentPhotoPreview(previewUrl);
      } else if (name === "personalPhoto") {
        setPersonalPhotoPreview(previewUrl);
      }
      setErrors((prev) => ({ ...prev, [name]: null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      const error =
        name === "dateOfBirth"
          ? validateDateOfBirth(value)
          : value
          ? null
          : `${name.replace(/([A-Z])/g, " $1").toLowerCase()} is required`;
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  }, [toast]);

  // Fetch KYC status
  useEffect(() => {
    const fetchKycStatus = async () => {
      const token = localStorage.getItem("access-token");
      if (!token) {
        toast({
          title: "Session Expired",
          description: "Please log in to continue.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        navigate("/login");
        return;
      }

      try {
        setIsLoading(true);
        const response = await instance.get(`${BASE_URL}/api/kyc/kyc-details`);
        setIsKycSubmitted(response.data.isKycSubmitted);
      } catch (error) {
        if (error.response?.status === 401) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          localStorage.removeItem("access-token");
          localStorage.removeItem("user-id");
          navigate("/login");
        } else if (error.response?.status === 404) {
          setIsKycSubmitted(false);
        } else {
          toast({
            title: "Connection Error",
            description: "Unable to check KYC status. Please try again later.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchKycStatus();
  }, [toast, navigate]);

  // Upload file to backend
  const uploadToServer = async (documentPhoto, personalPhoto) => {
    if (!documentPhoto || !personalPhoto) {
      throw new Error("Both document and personal photos are required");
    }

    const errorDoc = validateFile(documentPhoto);
    const errorPersonal = validateFile(personalPhoto);
    if (errorDoc || errorPersonal) {
      throw new Error(errorDoc || errorPersonal);
    }

    const formData = new FormData();
    formData.append("documentPhoto", documentPhoto);
    formData.append("personalPhoto", personalPhoto);

    try {
      const response = await instance.post(`${BASE_URL}/api/kyc/upload`, formData, {
        timeout: 30000, // 30-second timeout
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress((prev) => ({
            documentPhoto: percent,
            personalPhoto: percent, // Approximate both as same for simplicity
          }));
        },
      });

      if (!response.data.success || !response.data.documentPhotoPath || !response.data.personalPhotoPath) {
        throw new Error("Failed to upload photos to server");
      }

      return {
        documentPhotoPath: response.data.documentPhotoPath,
        personalPhotoPath: response.data.personalPhotoPath,
      };
    } catch (error) {
      console.error("Server upload error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 400) {
        throw new Error(`Invalid upload request: ${error.response?.data?.error || "Check file format or size"}`);
      } else if (error.response?.status === 401) {
        throw new Error("Unauthorized: Please log in again");
      } else if (error.response?.status === 408) {
        throw new Error("Upload timeout. Please try with smaller files (less than 5MB).");
      }
      throw new Error(`Failed to upload photos: ${error.message}`);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access-token");
    if (!token) {
      toast({
        title: "Session Expired",
        description: "Please log in to continue.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      navigate("/login");
      return;
    }

    // Validate form
    const newErrors = {};
    if (!formData.documentType) newErrors.documentType = "Document type is required";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dobError = validateDateOfBirth(formData.dateOfBirth);
      if (dobError) newErrors.dateOfBirth = dobError;
    }
    if (!formData.documentPhoto) newErrors.documentPhoto = "Document photo is required";
    if (!formData.personalPhoto) newErrors.personalPhoto = "Personal photo is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields and upload both photos.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress({ documentPhoto: 0, personalPhoto: 0 });

      // Upload images to server
      const { documentPhotoPath, personalPhotoPath } = await uploadToServer(
        formData.documentPhoto,
        formData.personalPhoto
      );

      // Send KYC data to backend
      const formDataToSend = {
        documentType: formData.documentType,
        documentPhotoPath,
        personalPhotoPath,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
      };

      const response = await instance.post(`${BASE_URL}/api/kyc/submit-kyc`, formDataToSend);
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to submit KYC to server");
      }

      toast({
        title: "KYC Submitted Successfully",
        description: "Your KYC documents have been uploaded and are under review.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setFormData({
        documentType: "",
        documentPhoto: null,
        personalPhoto: null,
        firstName: "",
        lastName: "",
        dateOfBirth: "",
      });
      setDocumentPhotoPreview(null);
      setPersonalPhotoPreview(null);
      setErrors({});
      setIsKycSubmitted(true);
    } catch (error) {
      console.error("KYC submission error:", {
        message: error.message,
        stack: error.stack,
      });
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit KYC. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress({ documentPhoto: 0, personalPhoto: 0 });
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    setFormData({
      documentType: "",
      documentPhoto: null,
      personalPhoto: null,
      firstName: "",
      lastName: "",
      dateOfBirth: "",
    });
    setDocumentPhotoPreview(null);
    setPersonalPhotoPreview(null);
    setErrors({});
    navigate("/dashboard");
  };

  // Sidebar and navigation handlers
  const handleSidebarCollapseChange = (isCollapsed) => setIsSidebarCollapsed(isCollapsed);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { when: "beforeChildren", staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  };

  const renderKycStatus = () => {
    if (isLoading) {
      return (
        <Flex direction="column" align="center" justify="center" h="70vh">
          <Spinner thickness="4px" speed="0.65s" emptyColor="gray.700" color="blue.500" size="xl" />
          <Text mt={4} fontWeight="medium">Loading your KYC status...</Text>
        </Flex>
      );
    }

    if (isKycSubmitted) {
      return (
        <MotionBox
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          bg={cardBgColor}
          p={8}
          borderRadius="xl"
          boxShadow="lg"
          textAlign="center"
          w="lg"
          maxW="90%"
        >
          <Flex direction="column" align="center" justify="center">
            <Box bg="blue.500" borderRadius="full" p={3} mb={4}>
              <FaCheck size="32px" color="white" />
            </Box>
            <Heading size="lg" color="white" mb={4}>
              KYC Uploaded
            </Heading>
            <Text color="gray.300" mb={6}>
              Your KYC documents have been submitted and are under review.
            </Text>
            <Badge colorScheme="blue" p={2} borderRadius="md">
              Pending
            </Badge>
          </Flex>
        </MotionBox>
      );
    }

    return (
      <MotionBox
        as="form"
        onSubmit={handleSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        w={{ base: "90%", md: "80%" }}
        maxW="900px"
        bg={cardBgColor}
        pt={9}
        pb={9}
        px={{ base: 4, md: 8 }}
        h="auto"
        borderRadius="xl"
        boxShadow="0 10px 30px -5px rgba(0, 0, 0, 0.3)"
      >
        <MotionBox variants={itemVariants} mb={6} textAlign="center">
          <Heading color={textColor} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            KYC Verification
          </Heading>
          <Text color="gray.400" fontSize="sm" mt={2}>
            Submit your information to complete the verification process
          </Text>
        </MotionBox>

        <MotionBox variants={itemVariants}>
          <FormControl isInvalid={!!errors.documentType} mb={5}>
            <FormLabel fontWeight="600" textTransform="uppercase" fontSize="sm" color={textColor}>
              <Flex align="center">
                <FaIdCard style={{ marginRight: "8px" }} />
                Official Document Type
              </Flex>
            </FormLabel>
            <Select
              name="documentType"
              value={formData.documentType}
              onChange={handleInputChange}
              placeholder="Select Document Type"
              bg="gray.800"
              color="white"
              borderColor="gray.600"
              _hover={{ borderColor: "blue.300" }}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
              fontSize="sm"
              h="45px"
              borderRadius="xl"
            >
              <option value="Drivers License">Driver's License</option>
              <option value="NIN Slip">NIN Slip</option>
              <option value="Passport">Passport</option>
            </Select>
            <FormErrorMessage>{errors.documentType}</FormErrorMessage>
          </FormControl>
        </MotionBox>

        <MotionBox variants={itemVariants}>
          <Flex direction={{ base: "column", md: "row" }} gap={5}>
            <FileUploadCard
              label="Upload Document Photo"
              previewSrc={documentPhotoPreview}
              onChange={handleInputChange}
              name="documentPhoto"
              error={errors.documentPhoto}
            />
            <FileUploadCard
              label="Personal Photo"
              previewSrc={personalPhotoPreview}
              onChange={handleInputChange}
              name="personalPhoto"
              error={errors.personalPhoto}
            />
          </Flex>
          {(uploadProgress.documentPhoto > 0 || uploadProgress.personalPhoto > 0) && (
            <VStack mt={2} spacing={2}>
              {uploadProgress.documentPhoto > 0 && (
                <Box w="100%">
                  <Text fontSize="xs" color="gray.300">Document Photo Upload</Text>
                  <Progress value={uploadProgress.documentPhoto} size="xs" colorScheme="blue" />
                </Box>
              )}
              {uploadProgress.personalPhoto > 0 && (
                <Box w="100%">
                  <Text fontSize="xs" color="gray.300">Personal Photo Upload</Text>
                  <Progress value={uploadProgress.personalPhoto} size="xs" colorScheme="blue" />
                </Box>
              )}
            </VStack>
          )}
        </MotionBox>

        <MotionBox variants={itemVariants}>
          <Flex direction={{ base: "column", md: "row" }} gap={5} mb={5}>
            <FormControl isInvalid={!!errors.firstName}>
              <FormLabel fontWeight="600" textTransform="uppercase" fontSize="sm" color={textColor}>
                <Flex align="center">
                  <FaUser style={{ marginRight: "8px" }} />
                  First Name
                </Flex>
              </FormLabel>
              <Input
                type="text"
                name="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleInputChange}
                bg="gray.800"
                color="white"
                borderColor="gray.600"
                _hover={{ borderColor: "blue.300" }}
                _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
                h="45px"
                borderRadius="xl"
              />
              <FormErrorMessage>{errors.firstName}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.lastName}>
              <FormLabel fontWeight="600" textTransform="uppercase" fontSize="sm" color={textColor}>
                <Flex align="center">
                  <FaUser style={{ marginRight: "8px" }} />
                  Last Name
                </Flex>
              </FormLabel>
              <Input
                type="text"
                name="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleInputChange}
                bg="gray.800"
                color="white"
                borderColor="gray.600"
                _hover={{ borderColor: "blue.300" }}
                _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
                h="45px"
                borderRadius="xl"
              />
              <FormErrorMessage>{errors.lastName}</FormErrorMessage>
            </FormControl>
          </Flex>
        </MotionBox>

        <MotionBox variants={itemVariants}>
          <FormControl isInvalid={!!errors.dateOfBirth} mb={8}>
            <FormLabel fontWeight="600" textTransform="uppercase" fontSize="sm" color={textColor}>
              <Flex align="center">
                <FaCalendarAlt style={{ marginRight: "8px" }} />
                Date Of Birth
              </Flex>
            </FormLabel>
            <Input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              bg="gray.800"
              color="white"
              borderColor="gray.600"
              _hover={{ borderColor: "blue.300" }}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
              h="45px"
              borderRadius="xl"
            />
            <FormErrorMessage>{errors.dateOfBirth}</FormErrorMessage>
          </FormControl>
        </MotionBox>

        <MotionBox variants={itemVariants}>
          <Flex justify="flex-end" gap={3} mt={4}>
            <Button
              variant="outline"
              borderWidth="2px"
              borderColor="blue.400"
              color="white"
              borderRadius="xl"
              h="45px"
              w={{ base: "full", sm: "110px" }}
              fontSize="sm"
              fontWeight="600"
              textTransform="uppercase"
              _hover={{ bg: "blue.900", transform: "translateY(-2px)" }}
              onClick={handleCancel}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              bg={buttonBgColor}
              color="white"
              isLoading={isSubmitting}
              loadingText="Submitting"
              borderRadius="xl"
              h="45px"
              w={{ base: "full", sm: "110px" }}
              fontSize="sm"
              fontWeight="600"
              textTransform="uppercase"
              _hover={{ bg: "blue.600", transform: "translateY(-2px)" }}
              disabled={isSubmitting}
            >
              Submit
            </Button>
          </Flex>
        </MotionBox>
      </MotionBox>
    );
  };

  return (
    <Box bg={bgColor}>
      <Sidebar onCollapseChange={handleSidebarCollapseChange} />
      <Box
        className={`fixed top-0 right-0 h-screen overflow-y-auto transition-all duration-300 ${
          isSidebarCollapsed ? "w-[calc(100%-80px)]" : "w-[calc(100%-280px)]"
        } md:block hidden`}
      >
        <Flex direction="column" align="center" justify="center" py={{ base: 16, md: 24 }} px={3}>
          {renderKycStatus()}
        </Flex>
      </Box>
      <Box
        className="fixed top-0 left-0 right-0 h-screen overflow-y-auto pt-[60px] pb-[80px] z-10 bg-gray-900 md:hidden"
      >
        <Flex direction="column" align="center" justify="center" py={{ base: 8, md: 24 }} px={3}>
          {renderKycStatus()}
        </Flex>
      </Box>
      <BottomNav />
    </Box>
  );
};

export default Kyc;