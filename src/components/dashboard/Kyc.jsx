import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import axios from "axios";
import { useToast, Box, Text, Spinner, Flex, VStack, HStack, Button, FormControl, FormLabel, Select, Input, Image, useColorModeValue, Heading, Badge } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FaUpload, FaCheck, FaIdCard, FaUser, FaCalendarAlt, FaFileAlt } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const MotionBox = motion(Box);

const FileUploadCard = ({ label, previewSrc, onChange, name }) => {
  const borderColor = useColorModeValue("#3182CE", "#63B3ED");

  return (
    <FormControl mb={4}>
      <FormLabel fontWeight="600" textTransform="uppercase" fontSize="sm">
        {label}
      </FormLabel>
      <Box
        position="relative"
        h="150px"
        w="100%"
        borderRadius="xl"
        borderWidth="1px"
        borderColor={previewSrc ? "blue.400" : "gray.300"}
        overflow="hidden"
        transition="all 0.3s"
        _hover={{ borderColor: "blue.500", transform: "translateY(-2px)" }}
      >
        {previewSrc ? (
          <Image
            src={previewSrc}
            alt={`${label} Preview`}
            objectFit="cover"
            w="100%"
            h="100%"
          />
        ) : (
          <Flex
            align="center"
            justify="center"
            h="100%"
            flexDirection="column"
            bg="gray.800"
          >
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
          />
          <FaUpload color="#fff" />
        </Flex>
      </Box>
    </FormControl>
  );
};

const Kyc = () => {
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [formData, setFormData] = useState({
    documentType: "",
    documentPhoto: null,
    personalPhoto: null,
    firstName: "",
    lastName: "",
    dateOfBirth: "",
  });
  const [isKycSubmitted, setIsKycSubmitted] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // State to store file previews
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState(null);
  const [personalPhotoPreview, setPersonalPhotoPreview] = useState(null);

  const bgColor = useColorModeValue("gray.900", "gray.900");
  const cardBgColor = useColorModeValue("#111518", "#0D1117");
  const textColor = useColorModeValue("white", "white");
  const buttonBgColor = useColorModeValue("blue.500", "blue.400");

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Function to handle sidebar collapse state changes
  const handleSidebarCollapseChange = (isCollapsed) => {
    setIsSidebarCollapsed(isCollapsed);
  };

  const handleShowProfile = () => {
    setShowToggleContainer(false);
    setShowProfile(true);
  };

  const handleMyTransaction = () => {
    setShowToggleContainer(true);
    setShowProfile(false);
  };

  // Function to convert a File to base64 string
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Function to convert base64 string back to File
  const base64ToFile = async (dataUrl, fileName, mimeType) => {
    if (!dataUrl) return null;
    
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: mimeType });
  };

  // Function to save form data with image files to localStorage
  const saveFormDataToLocalStorage = async () => {
    // Convert File objects to base64 strings
    let documentPhotoBase64 = null;
    let personalPhotoBase64 = null;
    
    if (formData.documentPhoto) {
      documentPhotoBase64 = await fileToBase64(formData.documentPhoto);
    }
    
    if (formData.personalPhoto) {
      personalPhotoBase64 = await fileToBase64(formData.personalPhoto);
    }
    
    const dataToSave = {
      documentType: formData.documentType,
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      // Store base64 data and metadata for the files
      documentPhoto: documentPhotoBase64 ? {
        data: documentPhotoBase64,
        name: formData.documentPhoto?.name || 'document-photo.jpg',
        type: formData.documentPhoto?.type || 'image/jpeg'
      } : null,
      personalPhoto: personalPhotoBase64 ? {
        data: personalPhotoBase64,
        name: formData.personalPhoto?.name || 'personal-photo.jpg',
        type: formData.personalPhoto?.type || 'image/jpeg'
      } : null
    };
    
    try {
      localStorage.setItem('kycFormData', JSON.stringify(dataToSave));
    } catch (error) {
      // Handle cases where localStorage might be full
      console.error("Error saving to localStorage:", error);
      toast({
        title: "Warning",
        description: "Unable to save your form progress locally due to storage limitations.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      
      // Try to save without the images as fallback
      const smallerDataToSave = {
        documentType: formData.documentType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth
      };
      localStorage.setItem('kycFormData', JSON.stringify(smallerDataToSave));
    }
  };

  // Function to load saved form data including images
  const loadSavedFormData = async () => {
    try {
      const savedData = localStorage.getItem('kycFormData');
      if (!savedData) return;
      
      const parsedData = JSON.parse(savedData);
      
      // Set text fields
      setFormData(prevData => ({
        ...prevData,
        documentType: parsedData.documentType || '',
        firstName: parsedData.firstName || '',
        lastName: parsedData.lastName || '',
        dateOfBirth: parsedData.dateOfBirth || ''
      }));
      
      // Restore document photo if available
      if (parsedData.documentPhoto?.data) {
        const documentFile = await base64ToFile(
          parsedData.documentPhoto.data,
          parsedData.documentPhoto.name,
          parsedData.documentPhoto.type
        );
        
        if (documentFile) {
          setFormData(prevData => ({
            ...prevData,
            documentPhoto: documentFile
          }));
          setDocumentPhotoPreview(parsedData.documentPhoto.data);
        }
      }
      
      // Restore personal photo if available
      if (parsedData.personalPhoto?.data) {
        const personalFile = await base64ToFile(
          parsedData.personalPhoto.data,
          parsedData.personalPhoto.name,
          parsedData.personalPhoto.type
        );
        
        if (personalFile) {
          setFormData(prevData => ({
            ...prevData,
            personalPhoto: personalFile
          }));
          setPersonalPhotoPreview(parsedData.personalPhoto.data);
        }
      }
    } catch (error) {
      console.error("Error loading saved form data:", error);
    }
  };

  // Function to clear saved form data
  const clearSavedFormData = () => {
    localStorage.removeItem('kycFormData');
  };

  // Call saveFormDataToLocalStorage whenever form data changes
  useEffect(() => {
    // Don't save if KYC is already submitted
    if (isKycSubmitted) return;
    
    // Only save if there's actual data to save
    if (formData.documentType || formData.firstName || formData.lastName || formData.dateOfBirth ||
        formData.documentPhoto || formData.personalPhoto) {
      // Debounce the save operation to prevent excessive storage operations
      const saveTimeout = setTimeout(() => {
        saveFormDataToLocalStorage();
      }, 500);
      
      return () => clearTimeout(saveTimeout);
    }
  }, [formData, isKycSubmitted]);

  // Load saved form data on component mount
  useEffect(() => {
    // Only load saved data if KYC hasn't been submitted yet
    if (!isKycSubmitted && !isLoading) {
      loadSavedFormData();
    }
  }, [isKycSubmitted, isLoading]);

  // Modified handleInputChange for better image handling
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "documentPhoto" || name === "personalPhoto") {
      const file = files ? files[0] : null;
      
      if (file) {
        // Create a preview URL
        const previewUrl = URL.createObjectURL(file);
        
        // Update preview state
        if (name === "documentPhoto") {
          setDocumentPhotoPreview(previewUrl);
        } else if (name === "personalPhoto") {
          setPersonalPhotoPreview(previewUrl);
        }
        
        // Update form data
        setFormData(prevData => ({
          ...prevData,
          [name]: file
        }));
      }
    } else {
      // Handle regular input fields
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  useEffect(() => {
    // Fetch KYC status from your backend
    const fetchKycStatus = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("auth-token");
        if (token) {
          axios.defaults.headers.common["auth-token"] = token;
        }
        const response = await axios.get(`${BASE_URL}/api/kyc/kyc-details`, {
          headers: {
            "auth-token": token,
          },
        });

        setIsKycSubmitted(response.data.isKycSubmitted);
      } catch (error) {
        console.error("Error fetching KYC status:", error);
        // Check if the error is because user doesn't have KYC data yet
        if (error.response && error.response.status === 404) {
          // User doesn't have KYC yet, show a friendly prompt instead of an error
          toast({
            title: "KYC Required",
            description: "Please complete your KYC verification to continue.",
            status: "info",
            duration: 5000,
            isClosable: true,
          });
          // Set isKycSubmitted to false since user hasn't submitted KYC
          setIsKycSubmitted(false);
        } else {
          // This is an actual error with the API or connection
          toast({
            title: "Connection Error",
            description: "Unable to check KYC status. Please try again later.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchKycStatus();
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.documentType || !formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.documentPhoto || !formData.personalPhoto) {
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
      const token = localStorage.getItem("auth-token");

      const formDataToSend = new FormData();
      formDataToSend.append("documentType", formData.documentType);
      formDataToSend.append("documentPhoto", formData.documentPhoto);
      formDataToSend.append("personalPhoto", formData.personalPhoto);
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);

      // Format dateOfBirth to ISO string format
      formDataToSend.append("dateOfBirth", new Date(formData.dateOfBirth).toISOString());

      await axios.post(`${BASE_URL}/api/kyc/submit-kyc`, formDataToSend, {
        headers: {
          "auth-token": token,
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "KYC Submitted Successfully",
        description: "We'll review your documents and update your status soon.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Reset the form state
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
      
      // Clear saved form data from localStorage
      clearSavedFormData();

      // Update KYC status
      setIsKycSubmitted(true);
    } catch (error) {
      console.error("Error submitting KYC:", error);
      toast({
        title: "Submission Error",
        description: error.response?.data?.message || "Failed to submit KYC. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const renderKycStatus = () => {
    if (isLoading) {
      return (
        <Flex direction="column" align="center" justify="center" h="70vh">
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.700"
            color="blue.500"
            size="xl"
          />
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
            <Box
              bg="green.500"
              borderRadius="full"
              p={3}
              mb={4}
            >
              <FaCheck size="32px" color="white" />
            </Box>
            <Heading size="lg" color="white" mb={4}>
              KYC Verification Submitted
            </Heading>
            <Text color="gray.300" mb={6}>
              Your verification documents have been submitted successfully and are currently under review.
              We'll notify you once the verification process is complete.
            </Text>
            <Badge colorScheme="green" p={2} borderRadius="md">
              Pending Review
            </Badge>
          </Flex>
        </MotionBox>
      );
    }

    return renderKycForm();
  };

  const renderKycForm = () => {
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
        overflow="hidden"
      >
        <MotionBox variants={itemVariants} mb={6} textAlign="center">
          <Heading color={textColor} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            KYC Verification
          </Heading>
          <Text color="gray.400" fontSize="sm" mt={2}>
            Submit the following information to complete your verification process
          </Text>
        </MotionBox>

        <MotionBox variants={itemVariants}>
          <FormControl mb={5}>
            <FormLabel fontWeight="600" textTransform="uppercase" fontSize="sm" color={textColor}>
              <Flex align="center">
                <FaIdCard style={{ marginRight: '8px' }} />
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
              <option value="Nin Slip">NIN Slip</option>
              <option value="Passport">Passport</option>
            </Select>
          </FormControl>
        </MotionBox>

        <MotionBox variants={itemVariants}>
          <Flex className="text-[white]" direction={{ base: "column", md: "row" }} gap={5}>
            <FileUploadCard
              label="Upload Document Photo"
              previewSrc={documentPhotoPreview}
              onChange={handleInputChange}
              name="documentPhoto"
            />
            <FileUploadCard
              label="Personal Photo"
              previewSrc={personalPhotoPreview}
              onChange={handleInputChange}
              name="personalPhoto"
            />
          </Flex>
        </MotionBox>

        <MotionBox variants={itemVariants}>
          <Flex direction={{ base: "column", md: "row" }} gap={5} mb={5}>
            <FormControl>
              <FormLabel fontWeight="600" textTransform="uppercase" fontSize="sm" color={textColor}>
                <Flex align="center">
                  <FaUser style={{ marginRight: '8px' }} />
                  First Name (As on Document)
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
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="600" textTransform="uppercase" fontSize="sm" color={textColor}>
                <Flex align="center">
                  <FaUser style={{ marginRight: '8px' }} />
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
            </FormControl>
          </Flex>
        </MotionBox>

        <MotionBox variants={itemVariants}>
          <FormControl mb={8}>
            <FormLabel fontWeight="600" textTransform="uppercase" fontSize="sm" color={textColor}>
              <Flex align="center">
                <FaCalendarAlt style={{ marginRight: '8px' }} />
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
              transition="all 0.3s"
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
              transition="all 0.3s"
              boxShadow="0 4px 10px -3px rgba(66, 153, 225, 0.6)"
            >
              Submit
            </Button>
          </Flex>
        </MotionBox>
      </MotionBox>
    );
  };

  // Update the return statement to handle both mobile and desktop views properly
  return (
    <div className="border flex items-center border-black">
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
        onCollapseChange={handleSidebarCollapseChange}
      />

      {/* Desktop view */}
      <div
        className={`fixed top-0 right-0 h-screen overflow-y-auto transition-all duration-300 ${isSidebarCollapsed
            ? "w-[calc(100%-80px)]"
            : "w-[calc(100%-280px)]"
          } md:block hidden`}
      >
        <Box
          className={showToggleContainer ? "toggleContainer" : "hidden"}
          h="auto"
          pb={6}
        >
          <Flex
            direction="column"
            align="center"
            justify="center"
            py={{ base: 16, md: 24 }}
            px={3}
            fontFamily="Poppins, sans-serif"
          >
            {renderKycStatus()}
          </Flex>
        </Box>
      </div>

      {/* Mobile view */}
      <div
        className={`fixed top-0 left-0 right-0 h-screen overflow-y-auto pt-[60px] pb-[80px] z-10 bg-gray-900 ${showToggleContainer ? "block" : "hidden"
          } md:hidden`}
      >
        <Box
          className={showToggleContainer ? "toggleContainer" : "hidden"}
          h="auto"
          pb={6}
        >
          <Flex
            direction="column"
            align="center"
            justify="center"
            py={{ base: 8, md: 24 }}
            px={3}
            fontFamily="Poppins, sans-serif"
          >
            {renderKycStatus()}
          </Flex>
        </Box>
      </div>

      <BottomNav
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
      />
    </div>
  );
};

export default Kyc;