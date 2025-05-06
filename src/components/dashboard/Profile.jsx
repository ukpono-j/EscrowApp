import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaUpload, FaSave, FaTimes, FaUser, FaCalendarAlt, FaUniversity, FaCreditCard, FaWallet } from "react-icons/fa";
import { motion } from "framer-motion";
import UserProfile from "../../assets/profile_icon.png";
import {
  Box,
  Text,
  useColorMode,
  useColorModeValue,
  Button,
  Flex,
  Heading,
  Input,
  Grid,
  GridItem,
  FormLabel,
  FormControl,
  Icon,
  Avatar,
  Spinner,
  Badge,
  Container,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const Profile = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Color mode values
  const cardBg = useColorModeValue("white", "#0F1722");
  const textColor = useColorModeValue("gray.800", "white");
  const subtleTextColor = useColorModeValue("gray.600", "gray.300");
  const labelColor = useColorModeValue("blue.600", "blue.300");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const inputBg = useColorModeValue("gray.50", "#1A2331");
  const inputHoverBg = useColorModeValue("gray.100", "#232D3F");
  const gradientStart = useColorModeValue("blue.400", "blue.500");
  const gradientEnd = useColorModeValue("purple.500", "purple.600");
  const highlightColor = useColorModeValue("blue.500", "blue.400");
  const avatarBorderColor = useColorModeValue("blue.400", "blue.500");
  const cancelBtnBg = useColorModeValue("gray.200", "gray.700");
  const cancelBtnHoverBg = useColorModeValue("gray.300", "gray.600");
  const fieldBg = useColorModeValue("gray.50", "#1A2331");
  const blueShadow = useColorModeValue('rgba(66, 153, 225, 0.3)', 'rgba(66, 153, 225, 0.5)');
  const backgroundBlue = useColorModeValue("blue.50", "blue.900");
  const backgroundPurple = useColorModeValue("purple.50", "purple.900");
  const hoverGradient = `linear(to-r, ${useColorModeValue('blue.500', 'blue.600')}, ${useColorModeValue('purple.600', 'purple.700')})`;

  // State variables
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [editedUserDetails, setEditedUserDetails] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    bank: "",
    accountNumber: "",
  });
  const [walletBalance, setWalletBalance] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fundingAmount, setFundingAmount] = useState(0);
  const [isFunding, setIsFunding] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [checkStatusInterval, setCheckStatusInterval] = useState(null);

  // Improved pollPaymentStatus function
  const pollPaymentStatus = (reference, maxAttempts = 30) => {
    if (!reference) return;

    // Clear any existing interval
    if (checkStatusInterval) {
      clearInterval(checkStatusInterval);
    }

    // Show toast only once at the start
    const toastId = toast({
      title: "Payment Processing",
      description: "We're checking your payment status. This may take a moment.",
      status: "info",
      duration: null, // Keep toast until explicitly closed
      isClosable: true,
    });

    let attempts = 0;

    const checkInterval = setInterval(async () => {
      attempts += 1;
      try {
        const response = await axios.get(
          `${BASE_URL}/api/wallet/verify-funding/${reference}`,
          {
            headers: {
              "auth-token": localStorage.getItem("auth-token"),
            },
          }
        );

        if (response.data.success) {
          // Payment successful
          clearInterval(checkInterval);
          setCheckStatusInterval(null);
          toast.close(toastId); // Close the processing toast

          setWalletBalance({
            balance: response.data.data.newBalance,
            currency: walletBalance?.currency || 'NGN',
          });

          toast({
            title: "Funding Successful",
            description: `Your wallet has been funded with ${response.data.data.transaction.amount} ${walletBalance?.currency || 'NGN'}`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });

          localStorage.removeItem("pendingPaymentRef");
        } else if (response.data.data?.transaction?.status === 'failed') {
          // Payment failed
          clearInterval(checkInterval);
          setCheckStatusInterval(null);
          toast.close(toastId);

          toast({
            title: "Payment Failed",
            description: "Your payment couldn't be processed. Please try again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });

          localStorage.removeItem("pendingPaymentRef");
        } else if (attempts >= maxAttempts) {
          // Timeout after max attempts (~5 minutes)
          clearInterval(checkInterval);
          setCheckStatusInterval(null);
          toast.close(toastId);

          toast({
            title: "Payment Timeout",
            description: "Payment verification timed out. Please check your payment status later.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });

          localStorage.removeItem("pendingPaymentRef");
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setCheckStatusInterval(null);
          toast.close(toastId);

          toast({
            title: "Payment Timeout",
            description: "Payment verification timed out. Please check your payment status later.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });

          localStorage.removeItem("pendingPaymentRef");
        }
      }
    }, 10000); // Check every 10 seconds

    setCheckStatusInterval(checkInterval);
  };

  // Consolidated useEffect for initialization and polling
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in to view your profile",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    axios.defaults.headers.common["auth-token"] = token;

    // Fetch user details and wallet balance
    const fetchUserDetails = axios.get(`${BASE_URL}/api/users/user-details`);
    const fetchWalletBalance = axios.get(`${BASE_URL}/api/wallet/balance`);

    Promise.all([fetchUserDetails, fetchWalletBalance])
      .then(([userResponse, walletResponse]) => {
        setUserDetails(userResponse.data);
        setEditedUserDetails({
          firstName: userResponse.data.firstName,
          lastName: userResponse.data.lastName,
          dateOfBirth: userResponse.data.dateOfBirth,
          bank: userResponse.data.bank,
          accountNumber: userResponse.data.accountNumber,
        });
        setWalletBalance(walletResponse.data);

        // Check for pending payment reference
        const pendingRef = localStorage.getItem("pendingPaymentRef");
        if (pendingRef && !checkStatusInterval) {
          pollPaymentStatus(pendingRef);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast({
          title: "Error fetching data",
          description: "We couldn't load your profile or wallet information",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })
      .finally(() => {
        setLoading(false);
      });

    // Cleanup interval on unmount
    return () => {
      if (checkStatusInterval) {
        clearInterval(checkStatusInterval);
      }
    };
  }, []); // Empty dependency array to run once on mount

  // Handle URL callback for PaymentPoint verification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    if (reference) {
      verifyFunding(reference);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (selectedImageFile) {
      const filePreview = URL.createObjectURL(selectedImageFile);
      setPreview(filePreview);
    } else {
      setPreview(null);
    }
  }, [selectedImageFile]);

  const handleUpdateDetails = () => {
    setSaving(true);
    axios
      .put(
        `${BASE_URL}/api/users/update-user-details`,
        { ...editedUserDetails },
        {
          headers: {
            "auth-token": localStorage.getItem("auth-token"),
          },
        }
      )
      .then((response) => {
        setUserDetails(response.data);
        setEditMode(false);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .catch((error) => {
        console.error("Error updating user details:", error);
        toast({
          title: "Update failed",
          description: "We couldn't update your profile",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleImageUpload = () => {
    setUploading(true);
    const formData = new FormData();
    formData.append("image", selectedImageFile);

    axios
      .post(`${BASE_URL}/api/users/setAvatar`, formData, {
        headers: {
          "auth-token": localStorage.getItem("auth-token"),
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        setUserDetails(response.data.user);
        setSelectedImageFile(null);
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .catch((error) => {
        console.error("Error updating avatar:", error);
        toast({
          title: "Upload failed",
          description: "We couldn't upload your profile picture",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditedUserDetails({
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      dateOfBirth: userDetails.dateOfBirth,
      bank: userDetails.bank,
      accountNumber: userDetails.accountNumber,
    });
  };

  const initiateFunding = async () => {
    if (fundingAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to fund",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!phoneNumber && !userDetails?.phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a valid phone number to continue",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsFunding(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/fund`,
        {
          amount: fundingAmount,
          email: userDetails.email,
          phoneNumber: phoneNumber || userDetails.phoneNumber,
        },
        {
          headers: {
            "auth-token": localStorage.getItem("auth-token"),
          },
        }
      );

      if (response.data.success) {
        toast({
          title: "Funding Initiated",
          description: "Virtual account has been created for your payment",
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        if (response.data.data.virtualAccount) {
          const { accountNumber, accountName, bankName } = response.data.data.virtualAccount;
          toast({
            title: "Payment Details",
            description: `Transfer ${fundingAmount} NGN to ${accountNumber} (${bankName}) under ${accountName}`,
            status: "info",
            duration: 15000,
            isClosable: true,
          });
        }

        localStorage.setItem("pendingPaymentRef", response.data.data.reference);
        pollPaymentStatus(response.data.data.reference); // Start polling immediately
      } else {
        throw new Error(response.data.message || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Error initiating funding:", error);
      toast({
        title: "Funding Error",
        description: error.response?.data?.error || error.message || "We couldn't process your funding request",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsFunding(false);
      onClose();
      setFundingAmount(0);
      setPhoneNumber('');
    }
  };

  const verifyFunding = (reference) => {
    axios
      .get(`${BASE_URL}/api/wallet/verify-funding/${reference}`, {
        headers: {
          "auth-token": localStorage.getItem("auth-token"),
        },
      })
      .then((response) => {
        if (response.data.success) {
          setWalletBalance({
            balance: response.data.data.newBalance,
            currency: walletBalance?.currency || 'NGN',
          });
          toast({
            title: "Funding Successful",
            description: `Your wallet has been funded with ${response.data.data.transaction.amount} ${walletBalance?.currency || 'NGN'}`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          localStorage.removeItem("pendingPaymentRef");
          if (checkStatusInterval) {
            clearInterval(checkStatusInterval);
            setCheckStatusInterval(null);
          }
        } else {
          throw new Error(response.data.message || "Payment verification failed");
        }
      })
      .catch((error) => {
        console.error("Error verifying funding:", error);
        toast({
          title: "Funding Failed",
          description: error.message || "We couldn't verify your payment",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
  };

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center" direction="column">
        <Box position="relative" w="100px" h="100px">
          <motion.div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: `4px solid ${colorMode === 'dark' ? '#3182CE' : '#63B3ED'}`,
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <Box position="absolute" top="35%" left="35%">
            <Spinner size="lg" color={highlightColor} />
          </Box>
        </Box>
        <Text mt={6} fontSize="xl" fontWeight="semibold" color={highlightColor}>
          Loading your profile...
        </Text>
      </Flex>
    );
  }

  return (
    <Box pt={7} minH="100vh">
      <Container maxW="4xl" px={4}>
        <Flex justify="space-between" align="center" mb={8}>
          <Heading
            as="h1"
            fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
            fontWeight="bold"
            bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
            bgClip="text"
          >
            My Profile
          </Heading>

          <Button
            onClick={() => setEditMode(!editMode)}
            variant="ghost"
            colorScheme={editMode ? "red" : "blue"}
            leftIcon={editMode ? <FaTimes /> : <FaEdit />}
            size="md"
            fontWeight="medium"
            _hover={{
              bg: editMode ? "red.100" : "blue.100",
              color: editMode ? "red.600" : "blue.600",
            }}
          >
            {editMode ? "Cancel" : "Edit Profile"}
          </Button>
        </Flex>

        {userDetails && (
          <Box
            bg={cardBg}
            rounded="xl"
            shadow="lg"
            p={{ base: 4, md: 6 }}
            borderWidth="1px"
            borderColor={borderColor}
            overflow="hidden"
            position="relative"
          >
            <Box
              position="absolute"
              top="-50px"
              right="-50px"
              w="200px"
              h="200px"
              borderRadius="full"
              bg={backgroundBlue}
              opacity="0.4"
              zIndex="0"
            />
            <Box
              position="absolute"
              bottom="-30px"
              left="-30px"
              w="150px"
              h="150px"
              borderRadius="full"
              bg={backgroundPurple}
              opacity="0.3"
              zIndex="0"
            />

            <Grid
              templateColumns={{ base: "1fr", md: "auto 1fr" }}
              gap={{ base: 8, md: 10 }}
              position="relative"
              zIndex="1"
            >
              <Flex direction="column" align="center">
                <Box position="relative" className="group">
                  <Box
                    position="relative"
                    w="150px"
                    h="150px"
                    rounded="full"
                    overflow="hidden"
                    borderWidth="4px"
                    borderColor={avatarBorderColor}
                    boxShadow={`0 0 15px ${blueShadow}`}
                  >
                    <img
                      src={preview || `${BASE_URL}/${userDetails.avatarImage}`}
                      alt="Profile"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = UserProfile;
                      }}
                    />

                    <Box
                      position="absolute"
                      top="0"
                      left="0"
                      w="100%"
                      h="100%"
                      bg="blackAlpha.400"
                      opacity="0"
                      _groupHover={{ opacity: 1 }}
                      transition="all 0.3s"
                      rounded="full"
                    />
                  </Box>

                  <label htmlFor="avatar-upload">
                    <Box
                      position="absolute"
                      bottom="5px"
                      right="5px"
                      bg={highlightColor}
                      p="10px"
                      rounded="full"
                      cursor="pointer"
                      transform="scale(1)"
                      _hover={{ transform: "scale(1.1)" }}
                      transition="all 0.3s"
                      boxShadow="md"
                    >
                      <Icon as={FaUpload} color="white" boxSize="18px" />
                    </Box>
                  </label>

                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedImageFile(e.target.files[0])}
                    hidden
                  />
                </Box>

                {selectedImageFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ width: '100%' }}
                  >
                    <Button
                      mt={4}
                      onClick={handleImageUpload}
                      isLoading={uploading}
                      loadingText="Uploading..."
                      leftIcon={<FaUpload />}
                      colorScheme="blue"
                      bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
                      _hover={{
                        bgGradient: hoverGradient,
                      }}
                      size="md"
                      width="full"
                    >
                      Upload Avatar
                    </Button>
                  </motion.div>
                )}

                <Box mt={6} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                    {userDetails.firstName} {userDetails.lastName}
                  </Text>
                  <Text color={labelColor}>{userDetails.email}</Text>

                  <Badge mt={3} colorScheme="blue" fontSize="sm" px={2} py={1} borderRadius="md">
                    Active User
                  </Badge>

                  {/* Wallet Balance Display */}
                  <Box mt={4}>
                    <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                      Wallet Balance
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color={highlightColor}>
                      {walletBalance ? `${walletBalance.balance} ${walletBalance.currency}` : "Loading..."}
                    </Text>
                    <Button
                      mt={3}
                      onClick={onOpen}
                      leftIcon={<FaWallet />}
                      colorScheme="blue"
                      bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
                      _hover={{
                        bgGradient: hoverGradient,
                      }}
                      size="md"
                    >
                      Fund Wallet
                    </Button>
                  </Box>
                </Box>
              </Flex>

              <Box flex="1">
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} mb={6}>
                  <FormControl>
                    <Flex align="center" mb={1}>
                      <Icon as={FaUser} color={labelColor} mr={2} />
                      <FormLabel color={labelColor} fontSize="sm" fontWeight="medium" mb={0}>
                        First Name
                      </FormLabel>
                    </Flex>

                    {editMode ? (
                      <Input
                        value={editedUserDetails.firstName}
                        onChange={(e) => setEditedUserDetails({ ...editedUserDetails, firstName: e.target.value })}
                        bg={inputBg}
                        borderColor={borderColor}
                        _hover={{ bg: inputHoverBg }}
                        _focus={{ borderColor: highlightColor, boxShadow: `0 0 0 1px ${highlightColor}` }}
                      />
                    ) : (
                      <Box
                        p={3}
                        bg={fieldBg}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        fontWeight="medium"
                        fontSize="md"
                        color={textColor}
                      >
                        {userDetails.firstName}
                      </Box>
                    )}
                  </FormControl>

                  <FormControl>
                    <Flex align="center" mb={1}>
                      <Icon as={FaUser} color={labelColor} mr={2} />
                      <FormLabel color={labelColor} fontSize="sm" fontWeight="medium" mb={0}>
                        Last Name
                      </FormLabel>
                    </Flex>

                    {editMode ? (
                      <Input
                        value={editedUserDetails.lastName}
                        onChange={(e) => setEditedUserDetails({ ...editedUserDetails, lastName: e.target.value })}
                        bg={inputBg}
                        borderColor={borderColor}
                        _hover={{ bg: inputHoverBg }}
                        _focus={{ borderColor: highlightColor, boxShadow: `0 0 0 1px ${highlightColor}` }}
                      />
                    ) : (
                      <Box
                        p={3}
                        bg={fieldBg}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        fontWeight="medium"
                        fontSize="md"
                        color={textColor}
                      >
                        {userDetails.lastName}
                      </Box>
                    )}
                  </FormControl>
                </Grid>

                <FormControl mb={6}>
                  <Flex align="center" mb={1}>
                    <Icon as={FaCalendarAlt} color={labelColor} mr={2} />
                    <FormLabel color={labelColor} fontSize="sm" fontWeight="medium" mb={0}>
                      Date of Birth
                    </FormLabel>
                  </Flex>

                  {editMode ? (
                    <Input
                      type="date"
                      value={editedUserDetails.dateOfBirth}
                      onChange={(e) => setEditedUserDetails({ ...editedUserDetails, dateOfBirth: e.target.value })}
                      bg={inputBg}
                      borderColor={borderColor}
                      _hover={{ bg: inputHoverBg }}
                      _focus={{ borderColor: highlightColor, boxShadow: `0 0 0 1px ${highlightColor}` }}
                    />
                  ) : (
                    <Box
                      p={3}
                      bg={fieldBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      fontWeight="medium"
                      fontSize="md"
                      color={textColor}
                    >
                      {userDetails.dateOfBirth || "Not Provided"}
                    </Box>
                  )}
                </FormControl>

                <FormControl mb={6}>
                  <Flex align="center" mb={1}>
                    <Icon as={FaUniversity} color={labelColor} mr={2} />
                    <FormLabel color={labelColor} fontSize="sm" fontWeight="medium" mb={0}>
                      Bank
                    </FormLabel>
                  </Flex>

                  {editMode ? (
                    <Input
                      value={editedUserDetails.bank}
                      onChange={(e) => setEditedUserDetails({ ...editedUserDetails, bank: e.target.value })}
                      bg={inputBg}
                      borderColor={borderColor}
                      _hover={{ bg: inputHoverBg }}
                      _focus={{ borderColor: highlightColor, boxShadow: `0 0 0 1px ${highlightColor}` }}
                    />
                  ) : (
                    <Box
                      p={3}
                      bg={fieldBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      fontWeight="medium"
                      fontSize="md"
                      color={textColor}
                    >
                      {userDetails.bank || "Not Provided"}
                    </Box>
                  )}
                </FormControl>

                <FormControl mb={6}>
                  <Flex align="center" mb={1}>
                    <Icon as={FaCreditCard} color={labelColor} mr={2} />
                    <FormLabel color={labelColor} fontSize="sm" fontWeight="medium" mb={0}>
                      Account Number
                    </FormLabel>
                  </Flex>

                  {editMode ? (
                    <Input
                      value={editedUserDetails.accountNumber}
                      onChange={(e) => setEditedUserDetails({ ...editedUserDetails, accountNumber: e.target.value })}
                      bg={inputBg}
                      borderColor={borderColor}
                      _hover={{ bg: inputHoverBg }}
                      _focus={{ borderColor: highlightColor, boxShadow: `0 0 0 1px ${highlightColor}` }}
                    />
                  ) : (
                    <Box
                      p={3}
                      bg={fieldBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                      fontWeight="medium"
                      fontSize="md"
                      color={textColor}
                    >
                      {userDetails.accountNumber || "Not Provided"}
                    </Box>
                  )}
                </FormControl>

                {editMode && (
                  <Flex justify="flex-end" mt={8}>
                    <Button
                      onClick={cancelEdit}
                      mr={4}
                      bg={cancelBtnBg}
                      color={textColor}
                      _hover={{ bg: cancelBtnHoverBg }}
                      size="md"
                    >
                      Cancel
                    </Button>

                    <Button
                      onClick={handleUpdateDetails}
                      isLoading={saving}
                      loadingText="Saving..."
                      leftIcon={<FaSave />}
                      colorScheme="blue"
                      bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
                      _hover={{
                        bgGradient: hoverGradient,
                      }}
                      size="md"
                    >
                      Save Changes
                    </Button>
                  </Flex>
                )}
              </Box>
            </Grid>
          </Box>
        )}

        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent bg={cardBg} borderColor={borderColor}>
            <ModalHeader>
              <Text color={textColor} fontWeight="bold">
                Fund Your Wallet
              </Text>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={4}>
                <FormLabel color={labelColor}>Amount (NGN)</FormLabel>
                <NumberInput
                  min={100}
                  value={fundingAmount}
                  onChange={(valueString) => setFundingAmount(parseFloat(valueString))}
                  precision={2}
                >
                  <NumberInputField
                    bg={inputBg}
                    borderColor={borderColor}
                    _hover={{ bg: inputHoverBg }}
                    _focus={{ borderColor: highlightColor, boxShadow: `0 0 0 1px ${highlightColor}` }}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel color={labelColor}>Phone Number</FormLabel>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber || userDetails?.phoneNumber || ''}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  bg={inputBg}
                  borderColor={borderColor}
                  _hover={{ bg: inputHoverBg }}
                  _focus={{ borderColor: highlightColor, boxShadow: `0 0 0 1px ${highlightColor}` }}
                />
                <Text fontSize="xs" color={subtleTextColor} mt={1}>
                  Required for payment processing
                </Text>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="ghost"
                onClick={onClose}
                mr={3}
                color={textColor}
                _hover={{ bg: cancelBtnHoverBg }}
              >
                Cancel
              </Button>
              <Button
                onClick={initiateFunding}
                isLoading={isFunding}
                loadingText="Processing..."
                colorScheme="blue"
                bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
                _hover={{
                  bgGradient: hoverGradient,
                }}
              >
                Proceed to Payment
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default Profile;