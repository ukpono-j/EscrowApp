import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaUpload, FaSave, FaTimes, FaUser, FaCalendarAlt, FaUniversity, FaCreditCard, FaWallet, FaSync, FaCopy, FaCheck, FaExclamationTriangle } from "react-icons/fa";
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
  Divider,
} from "@chakra-ui/react";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Payment Information Modal Component
const PaymentInfoModal = ({ isOpen, onClose, paymentDetails, onStatusCheck }) => {
  const [copiedItems, setCopiedItems] = useState({});
  const toast = useToast();
  
  // Color mode values
  const cardBg = useColorModeValue("white", "#0F1722");
  const textColor = useColorModeValue("gray.800", "white");
  const subtleTextColor = useColorModeValue("gray.600", "gray.300");
  const labelColor = useColorModeValue("blue.600", "blue.300");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const highlightColor = useColorModeValue("blue.500", "blue.400");
  const gradientStart = useColorModeValue("blue.400", "blue.500");
  const gradientEnd = useColorModeValue("purple.500", "purple.600");
  const hoverGradient = `linear(to-r, ${useColorModeValue('blue.500', 'blue.600')}, ${useColorModeValue('purple.600', 'purple.700')})`;
  const boxBgColor = useColorModeValue("blue.50", "gray.700");
  
  if (!paymentDetails) return null;
  
  const { virtualAccount, reference, amount } = paymentDetails;
  
  const copyToClipboard = (text, itemKey) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedItems({ ...copiedItems, [itemKey]: true });
      setTimeout(() => {
        setCopiedItems({ ...copiedItems, [itemKey]: false });
      }, 3000);
      
      toast({
        title: "Copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    });
  };
  
  const PaymentItem = ({ label, value, itemKey }) => (
    <Box 
      mb={3} 
      p={3} 
      borderRadius="md" 
      bg={boxBgColor} 
      position="relative"
    >
      <Text fontSize="sm" fontWeight="medium" color={subtleTextColor} mb={1}>
        {label}
      </Text>
      <Flex align="center" justify="space-between">
        <Text fontSize="md" fontWeight="bold" color={textColor} mb={0}>
          {value}
        </Text>
        <Button
          size="sm"
          colorScheme={copiedItems[itemKey] ? "green" : "blue"}
          variant="ghost"
          onClick={() => copyToClipboard(value, itemKey)}
          leftIcon={copiedItems[itemKey] ? <FaCheck /> : <FaCopy />}
        >
          {copiedItems[itemKey] ? "Copied" : "Copy"}
        </Button>
      </Flex>
    </Box>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent bg={cardBg} borderColor={borderColor}>
        <ModalHeader>
          <Flex align="center">
            <Icon as={FaWallet} color={highlightColor} mr={2} />
            <Text color={textColor} fontWeight="bold">
              Fund Your Wallet
            </Text>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box mb={4}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontWeight="bold" color={textColor}>Amount to Transfer:</Text>
              <Badge colorScheme="green" fontSize="md" px={2} py={1}>
                ₦{amount}
              </Badge>
            </Flex>
            <Text fontSize="sm" color={subtleTextColor} mb={4}>
              Please transfer exactly this amount to the account below
            </Text>
          </Box>
          
          <PaymentItem label="Bank Name" value={virtualAccount.bankName} itemKey="bankName" />
          <PaymentItem label="Account Number" value={virtualAccount.accountNumber} itemKey="accountNumber" />
          <PaymentItem label="Account Name" value={virtualAccount.accountName} itemKey="accountName" />
          <PaymentItem label="Reference" value={reference} itemKey="reference" />
          
          <Box mt={3} p={3} borderRadius="md" bg="orange.50" borderLeftWidth="4px" borderLeftColor="orange.400">
            <Flex>
              <Icon as={FaExclamationTriangle} color="orange.500" mt={1} mr={2} />
              <Text fontSize="sm" color="orange.700">
                Please don't close this window until after your transfer. 
                Your payment will be confirmed within 5-10 minutes.
              </Text>
            </Flex>
          </Box>
        </ModalBody>
        <Divider my={2} />
        <ModalFooter>
          <Button
            onClick={onStatusCheck}
            colorScheme="blue"
            bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
            _hover={{
              bgGradient: hoverGradient,
            }}
            w="100%"
          >
            Check Payment Status
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

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
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  
  // New state variables for payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Function to format date to YYYY-MM-DD
  const formatDate = (dateString) => {
    if (!dateString) return "Not Provided";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Extracts YYYY-MM-DD
  };

  // Improved pollPaymentStatus function with corrected endpoint
  const pollPaymentStatus = (reference, maxAttempts = 60) => {
    if (!reference) return;

    if (checkStatusInterval) {
      clearInterval(checkStatusInterval);
    }

    const toastId = toast({
      title: 'Payment Processing',
      description: 'Checking your payment status. This may take a few minutes.',
      status: 'info',
      duration: null,
      isClosable: true,
    });

    let attempts = 0;
    let retryCount = 0;
    const maxRetries = 5;

    const checkInterval = setInterval(async () => {
      attempts += 1;
      try {
        const response = await axios.get(
          `${BASE_URL}/api/wallet/verify-funding/${reference}`, // Fixed endpoint to match backend route
          {
            headers: {
              'auth-token': localStorage.getItem('auth-token'),
            },
            timeout: 15000,
          }
        );

        retryCount = 0;

        if (response.data.success) {
          clearInterval(checkInterval);
          setCheckStatusInterval(null);
          toast.close(toastId);

          setRefreshingBalance(true);
          await fetchWalletBalance();
          setRefreshingBalance(false);
          
          // Close payment modal if successful
          setPaymentModalOpen(false);
          setPaymentDetails(null);

          toast({
            title: 'Funding Successful',
            description: `Your wallet has been funded with ${response.data.data.transaction.amount} ${walletBalance?.currency || 'NGN'}`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          localStorage.removeItem('pendingPaymentRef');
        } else if (response.data.data?.transaction?.status === 'failed') {
          clearInterval(checkInterval);
          setCheckStatusInterval(null);
          toast.close(toastId);

          toast({
            title: 'Payment Failed',
            description: 'Your payment could not be processed. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });

          localStorage.removeItem('pendingPaymentRef');
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setCheckStatusInterval(null);
          toast.close(toastId);

          toast({
            title: 'Payment Verification Timeout',
            description: 'Payment verification took too long. Please check your wallet later or contact support.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });

          localStorage.removeItem('pendingPaymentRef');
        }
      } catch (error) {
        console.error('Error checking payment status:', {
          reference,
          message: error.message,
          status: error.response?.status,
        });
        retryCount += 1;
        if (error.response?.status === 404 || error.code === 'ECONNABORTED' || retryCount >= maxRetries) {
          clearInterval(checkInterval);
          setCheckStatusInterval(null);
          toast.close(toastId);

          toast({
            title: 'Payment Verification Error',
            description: 'Unable to verify payment. Please try again later or contact support.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });

          localStorage.removeItem('pendingPaymentRef');
        }
      }
    }, 10000);

    setCheckStatusInterval(checkInterval);
  };

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/wallet/balance`, {
        headers: { 'auth-token': localStorage.getItem('auth-token') },
      });
      setWalletBalance(response.data);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh wallet balance',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
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

    const fetchUserDetails = axios.get(`${BASE_URL}/api/users/user-details`);
    const fetchWalletBalanceInitial = axios.get(`${BASE_URL}/api/wallet/balance`);

    Promise.all([fetchUserDetails, fetchWalletBalanceInitial])
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

    return () => {
      if (checkStatusInterval) {
        clearInterval(checkStatusInterval);
      }
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    if (reference && !checkStatusInterval) {
      localStorage.setItem('pendingPaymentRef', reference);
      pollPaymentStatus(reference);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [checkStatusInterval]);

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

  // Updated initiateFunding function
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
          timeout: 15000,
        }
      );

      if (response.data.success) {
        const { virtualAccount, reference } = response.data.data;
        
        // Store payment details for the modal
        setPaymentDetails({
          virtualAccount,
          reference,
          amount: fundingAmount
        });
        
        // Store reference in localStorage for tracking
        localStorage.setItem("pendingPaymentRef", reference);
        
        // Close the funding modal and open payment info modal
        onClose();
        setPaymentModalOpen(true);
        
        // Start polling in the background
        pollPaymentStatus(reference);
      } else {
        throw new Error(response.data.message || "Failed to initiate funding");
      }
    } catch (error) {
      console.error("Funding error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred during funding";
      toast({
        title: "Funding Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsFunding(false);
      setFundingAmount(0);
      setPhoneNumber('');
    }
  };

  // Function to manually check payment status
  const checkPaymentStatus = () => {
    if (paymentDetails?.reference) {
      toast({
        title: "Checking Payment Status",
        description: "Please wait while we verify your payment...",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      pollPaymentStatus(paymentDetails.reference);
    }
  };

  if (loading || refreshingBalance) {
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
          {loading ? 'Loading your profile...' : 'Refreshing wallet balance...'}
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

                  <Box mt={4}>
                    <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                      Wallet Balance
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color={highlightColor}>
                      {refreshingBalance ? (
                        <Spinner size="sm" color={highlightColor} />
                      ) : walletBalance ? (
                        `${walletBalance.balance} ${walletBalance.currency}`
                      ) : (
                        "Loading..."
                      )}
                    </Text>
                    <Flex mt={3} gap={2}>
                      <Button
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
                      <Button
                        onClick={async () => {
                          setRefreshingBalance(true);
                          await fetchWalletBalance();
                          setRefreshingBalance(false);
                        }}
                        leftIcon={<FaSync />}
                        colorScheme="gray"
                        variant="outline"
                        size="md"
                        isLoading={refreshingBalance}
                      >
                        Refresh Balance
                      </Button>
                    </Flex>
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
                      {formatDate(userDetails.dateOfBirth)}
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

        <PaymentInfoModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          paymentDetails={paymentDetails}
          onStatusCheck={checkPaymentStatus}
        />
      </Container>
    </Box>
  );
};

export default Profile;