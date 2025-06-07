import React, { useEffect, useRef, useState, useCallback } from "react";
import { FaShoppingCart, FaStore } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  useToast,
  Box,
  Text,
  Flex,
  Avatar,
  Progress,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Stack,
  Heading,
  VStack,
  HStack,
  Divider,
  useColorMode,
  useColorModeValue,
  Spinner,
  Center,
  Fade,
} from "@chakra-ui/react";
import defaultProfileImage from "../../assets/profile_icon.png";
import nigeriaBanks, { getBankNameFromCode } from "../../data/banksList";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Utility function to validate user response
const validateUserResponse = (responseData) => {
  if (responseData.success && responseData.data?.user) {
    return responseData.data.user;
  }
  console.error("Invalid user data structure:", responseData);
  throw new Error(responseData.error || "Invalid user data received");
};

// Generic utility to validate API response success
const validateApiResponse = (responseData, endpoint) => {
  if (responseData.success) {
    return responseData.data || {};
  }
  console.error(`Invalid response from ${endpoint}:`, responseData);
  throw new Error(responseData.error || "Invalid response received");
};

// Modal Component
const AcceptTransactionModal = ({
  isOpen,
  onClose,
  userDetails,
  paymentAmount,
  selectedUserType,
  textColor,
  accentColor,
  accentHoverColor,
  bgSecondary,
  cardBorder,
  shadowColor,
  modalHeaderBg,
  modalHeaderBorder,
  modalButtonHoverBg,
  createNewTransaction,
  createNewTransactionForBuyer,
}) => {
  const formatCurrency = (amount) =>
    parseFloat(amount || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.7)"
      zIndex={999}
      display={isOpen ? "flex" : "none"}
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg={bgSecondary}
        borderRadius="xl"
        maxW="400px"
        w="full"
        overflow="hidden"
        boxShadow="0px 10px 30px rgba(0, 0, 0, 0.3)"
        border={cardBorder}
      >
        <Box
          p={4}
          bg={modalHeaderBg}
          borderBottomWidth="1px"
          borderColor={modalHeaderBorder}
        >
          <Flex justify="space-between" align="center">
            <Heading size="md" color={textColor}>
              Create Escrow Transaction
            </Heading>
            <Button
              variant="ghost"
              p={1}
              onClick={onClose}
              color={textColor}
              _hover={{ bg: modalButtonHoverBg }}
            >
              <MdClose size={24} />
            </Button>
          </Flex>
        </Box>
        <Box p={5}>
          <Flex align="center" mb={4}>
            <Avatar
              src={
                userDetails.avatarImage
                  ? `${BASE_URL}/api/avatar/${userDetails.avatarImage}`
                  : defaultProfileImage
              }
              size="md"
              bg={accentColor}
              boxShadow={`0px 2px 8px ${shadowColor}`}
            />
            <Box ml={3}>
              <Text fontWeight="bold" color={textColor}>
                {userDetails.fullName || "Transaction"}
              </Text>
              <Text fontSize="sm" color={accentColor}>
                {formatCurrency(paymentAmount)} NGN
              </Text>
            </Box>
          </Flex>
          <VStack spacing={4}>
            <Text color={textColor}>
              You are about to create a transaction as a {selectedUserType}.
            </Text>
            <Button
              onClick={
                selectedUserType === "buyer"
                  ? createNewTransactionForBuyer
                  : createNewTransaction
              }
              bg={accentColor}
              color="white"
              _hover={{ bg: accentHoverColor }}
              borderRadius="full"
              size="lg"
              w="full"
            >
              Confirm Transaction
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              borderColor={accentColor}
              color={textColor}
              borderRadius="full"
              size="lg"
              w="full"
            >
              Cancel
            </Button>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

const TransactionCreation = () => {
  console.log("TransactionCreation: Component rendering");

  // State for paymentAmount (raw number) and displayAmount (formatted string)
  const [paymentAmount, setPaymentAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  console.log("State: paymentAmount =", paymentAmount, "displayAmount =", displayAmount);

  // Theme Hooks
  const { colorMode } = useColorMode();
  const bgMain = useColorModeValue("white", "#0F1624");
  const bgSecondary = useColorModeValue("#F7FAFC", "#1E293B");
  const bgTertiary = useColorModeValue("#EDF2F7", "#2D3748");
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("#957432", "#957432");
  const accentColor = "#957432";
  const accentHoverColor = "#A88D50";
  const shadowColor = useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0.3)");
  const inputBg = useColorModeValue("white", "#0F1624");
  const cardBorder = useColorModeValue("1px solid #E2E8F0", "none");
  // Modal-specific theme values
  const modalHeaderBg = useColorModeValue("gray.50", "#0F1624");
  const modalHeaderBorder = useColorModeValue("gray.200", "gray.700");
  const modalButtonHoverBg = useColorModeValue("gray.100", "gray.700");
  // Button hover values
  const disabledButtonHoverBg = useColorModeValue("gray.300", "#2D3748");
  const nextButtonHoverBg = useColorModeValue("gray.100", "rgba(149, 116, 50, 0.2)");
  console.log("Theme: colorMode =", colorMode);

  const toast = useToast();
  const navigate = useNavigate();

  // Other state Hooks
  const [step, setStep] = useState(1);
  const [nextButtonActive, setNextButtonActive] = useState(false);
  const [paymentBank, setPaymentBank] = useState("");
  const [paymentAccountNumber, setPaymentAccountNumber] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [email, setEmail] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("");
  const [acceptTransactionModel, setAcceptTransactionModel] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [banks, setBanks] = useState([]);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [uniqueBanks, setUniqueBanks] = useState([]);
  const [formValid, setFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  console.log("State: isLoading =", isLoading, "userDetails =", userDetails, "banks =", banks);

  // Ref Hooks
  const userDetailsFetched = useRef(false);
  const banksFetched = useRef(false);

  // Function to format numbers with commas and two decimal places
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Handle input change for Price/Amount
  const handleAmountChange = (e) => {
    const input = e.target.value.replace(/,/g, ""); // Remove commas
    if (input === "" || /^\d*\.?\d{0,2}$/.test(input)) {
      setPaymentAmount(input);
      setDisplayAmount(
        input
          ? parseFloat(input).toLocaleString("en-NG", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })
          : ""
      );
    }
  };

  // Memoized callback Hooks
  const handleBankSelection = useCallback(
    (e) => {
      const code = e.target.value;
      setSelectedBankCode(code);
      const selectedBank = uniqueBanks.find((bank) => bank.code === code);
      setPaymentBank(selectedBank ? selectedBank.name : getBankNameFromCode(code));
    },
    [uniqueBanks]
  );

  const verifyBankAccount = useCallback(async () => {
    if (!selectedBankCode || !paymentAccountNumber) {
      toast({
        title: "Validation Error",
        description: "Please provide an account number and select a bank",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (paymentAccountNumber.length !== 10) {
      toast({
        title: "Invalid Account Number",
        description: "Please enter a valid 10-digit account number",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      const token = localStorage.getItem("auth-token");
      const bankName = getBankNameFromCode(selectedBankCode);
      toast({
        title: "Verifying account...",
        description: `${bankName} - ${paymentAccountNumber}`,
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      const response = await axios.post(
        `${BASE_URL}/api/transactions/bank/verify`,
        {
          account_number: paymentAccountNumber,
          bank_code: selectedBankCode,
          bank_name: paymentBank,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );
      console.log("Verify bank response:", response.data);
      const responseData = validateApiResponse(response.data, "/api/transactions/bank/verify");
      if (responseData.status) {
        toast({
          title: "Account verified!",
          description: responseData.data?.account_name || "Account verified",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Verification failed",
          description: responseData.message || "Could not verify account details",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Verify bank error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      let errorMessage = "Network error or invalid account details";
      if (error.response) {
        if (error.response.status === 422) errorMessage = "Invalid account details";
        else if (error.response.status === 403 || error.response.status === 401) {
          errorMessage = "Authorization error. Please re-login";
          navigate("/");
        } else if (error.response?.data?.error) errorMessage = error.response.data.error;
      }
      toast({
        title: "Verification failed",
        description: errorMessage,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }, [selectedBankCode, paymentAccountNumber, paymentBank, toast, navigate]);

  const acceptTransactionFunction = useCallback(
    (e) => {
      e.preventDefault();
      if (!formValid) {
        toast({
          title: "Please fill all required fields",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      setAcceptTransactionModel(true);
    },
    [formValid, toast]
  );

  const createNewTransaction = useCallback(
    (e) => {
      e.preventDefault();
      if (!formValid) {
        toast({
          title: "Please fill all required fields",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      const requestData = {
        paymentName: userDetails.fullName || "User",
        email: email || userDetails.email,
        paymentAmount: parseFloat(paymentAmount),
        paymentDescription,
        selectedUserType,
        paymentBank: selectedUserType === "buyer" ? "Pending" : paymentBank,
        paymentBankCode: selectedUserType === "buyer" ? "000" : selectedBankCode,
        paymentAccountNumber: selectedUserType === "buyer" ? "0" : paymentAccountNumber,
      };
      const token = localStorage.getItem("auth-token");
      axios
        .post(`${BASE_URL}/api/transactions/create-transaction`, requestData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(async (response) => {
          console.log("Create transaction response:", response.data);
          const responseData = validateApiResponse(response.data, "/api/transactions/create-transaction");
          const transactionId = responseData.transactionId || "Unknown";
  
          try {
            const verifyResponse = await axios.get(`${BASE_URL}/api/transactions/${transactionId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Transaction verification response:", verifyResponse.data);
            const verifiedData = validateApiResponse(verifyResponse.data, `/api/transactions/${transactionId}`);
            if (!verifiedData._id) {
              throw new Error("Transaction not found after creation");
            }
          } catch (verifyError) {
            console.error("Error verifying transaction:", verifyError);
            toast({
              title: "Transaction created but not found",
              description: "The transaction was created but could not be retrieved. Please check the transaction list manually.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
          }
  
          toast({
            title: "Successfully created a transaction",
            description: `Transaction ID: ${transactionId}`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          navigate("/transactions/tab");
        })
        .catch((error) => {
          console.error("Transaction creation error:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          const errorMessage = error.response?.data?.error || error.message;
          toast({
            title: "Error occurred during transaction",
            description: errorMessage,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        });
    },
    [
      formValid,
      userDetails.fullName,
      userDetails.email,
      email,
      paymentAmount,
      paymentDescription,
      selectedUserType,
      paymentBank,
      selectedBankCode,
      paymentAccountNumber,
      navigate,
      toast,
    ]
  );

  const createNewTransactionForBuyer = useCallback(
    (e) => {
      if (e) e.preventDefault();
      const requestData = {
        paymentName: userDetails.fullName || "Buyer",
        email: userDetails.email || email || "",
        paymentAmount: parseFloat(paymentAmount),
        paymentDescription,
        selectedUserType: "buyer",
        paymentBank: "Pending",
        paymentBankCode: "000",
        paymentAccountNumber: "0",
      };
      const token = localStorage.getItem("auth-token");
      axios
        .post(`${BASE_URL}/api/transactions/create-transaction`, requestData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(async (response) => {
          console.log("Create buyer transaction response:", response.data);
          const responseData = validateApiResponse(response.data, "/api/transactions/create-transaction");
          const transactionId = responseData.transactionId || "Unknown";
  
          try {
            const verifyResponse = await axios.get(`${BASE_URL}/api/transactions/${transactionId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Transaction verification response:", verifyResponse.data);
            const verifiedData = validateApiResponse(verifyResponse.data, `/api/transactions/${transactionId}`);
            if (!verifiedData._id) {
              throw new Error("Transaction not found after creation");
            }
          } catch (verifyError) {
            console.error("Error verifying transaction:", verifyError);
            toast({
              title: "Transaction created but not found",
              description: "The transaction was created but could not be retrieved. Please check the transaction list manually.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
          }
  
          toast({
            title: "Successfully created a transaction",
            description: `Your transaction ID: ${transactionId}. Share this with the seller.`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          navigate("/transactions/tab");
        })
        .catch((error) => {
          console.error("Transaction creation error:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          const errorMessages =
            error.response?.data?.errors?.map((err) => err.msg).join(", ") || error.message;
          toast({
            title: "Error occurred during transaction",
            description: errorMessages,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        });
    },
    [userDetails.fullName, userDetails.email, email, paymentAmount, paymentDescription, navigate, toast]
  );

  const handleRadioClick = useCallback((userType) => {
    setSelectedUserType(userType);
    setNextButtonActive(true);
  }, []);

  const handleNextClick = useCallback(() => {
    if (step === 1 && selectedUserType) {
      setStep(2);
      setNextButtonActive(false);
    }
  }, [step, selectedUserType]);

  const handlePreviousClick = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
      setNextButtonActive(false);
    }
  }, [step]);

  // Effect Hooks
  useEffect(() => {
    console.log("useEffect: Fetching user details");
    if (userDetailsFetched.current) {
      console.log("User details already fetched, skipping");
      return;
    }
    const fetchUserDetails = async () => {
      setIsLoading(true);
      console.log("Fetching user details, isLoading set to true");
      const timeout = setTimeout(() => {
        toast({
          title: "Taking too long?",
          description: "Please check your network connection.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }, 10000);
      const token = localStorage.getItem("auth-token");
      if (!token) {
        console.warn("No auth token found, redirecting to login");
        toast({
          title: "Authentication Error",
          description: "Please log in to continue",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        navigate("/");
        setIsLoading(false);
        clearTimeout(timeout);
        return;
      }
      try {
        console.log("Making request to /api/users/user-details");
        const response = await axios.get(`${BASE_URL}/api/users/user-details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("User details response:", response.data);
        const user = validateUserResponse(response.data);
        if (!user.email) {
          console.warn("No email in user details:", user);
        }
        setUserDetails(user);
        setEmail(user.email || "");
        userDetailsFetched.current = true;
      } catch (error) {
        console.error("Error fetching user details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        setErrorMessage(
          error.response?.data?.error || error.message || "Unable to fetch user details"
        );
        toast({
          title: "Error fetching user details",
          description:
            error.response?.data?.error || error.message || "Unable to fetch user details",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        if (error.response?.status === 401 || error.response?.status === 404) {
          console.log("Unauthorized or not found, redirecting to login");
          localStorage.removeItem("auth-token");
          navigate("/");
        }
      } finally {
        console.log("Finished fetching user details, setting isLoading to false");
        setIsLoading(false);
        clearTimeout(timeout);
      }
    };
    fetchUserDetails();
  }, [toast, navigate]);

  useEffect(() => {
    console.log("useEffect: Fetching banks");
    if (banksFetched.current) {
      console.log("Banks already fetched, skipping");
      return;
    }
    const cachedBanks = localStorage.getItem("apiBanks");
    const cacheTimestamp = localStorage.getItem("apiBanksTimestamp");
    const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity;
    if (cachedBanks && cacheAge < 24 * 60 * 60 * 1000) {
      try {
        const parsedBanks = JSON.parse(cachedBanks);
        if (Array.isArray(parsedBanks) && parsedBanks.length > 0) {
          console.log("Using cached banks:", parsedBanks);
          setBanks(parsedBanks);
          banksFetched.current = true;
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error("Error parsing cached banks:", e);
      }
    }
    const fetchBanks = async () => {
      setIsLoading(true);
      console.log("Fetching banks, isLoading set to true");
      const timeout = setTimeout(() => {
        toast({
          title: "Taking too long?",
          description: "Please check your network connection.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }, 10000);
      try {
        const token = localStorage.getItem("auth-token");
        if (!token) {
          throw new Error("No authentication token found");
        }
        console.log("Making request to /api/transactions/banks");
        const response = await axios.get(`${BASE_URL}/api/transactions/banks`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        console.log("Banks response:", response.data);
        const responseData = validateApiResponse(response.data, "/api/transactions/banks");
        const apiBanks = responseData.data?.length > 0 ? responseData.data : nigeriaBanks;
        setBanks(apiBanks);
        localStorage.setItem("apiBanks", JSON.stringify(apiBanks));
        localStorage.setItem("apiBanksTimestamp", Date.now().toString());
        banksFetched.current = true;
      } catch (error) {
        console.error("Error fetching banks:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        setErrorMessage(error.response?.data?.error || "Failed to fetch banks from server");
        toast({
          title: "Using default bank list",
          description: error.response?.data?.error || "Failed to fetch banks from server",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        setBanks(nigeriaBanks);
        localStorage.setItem("apiBanks", JSON.stringify(nigeriaBanks));
        localStorage.setItem("apiBanksTimestamp", Date.now().toString());
        if (error.response?.status === 401 || error.response?.status === 404) {
          console.log("Unauthorized or not found, redirecting to login");
          localStorage.removeItem("auth-token");
          navigate("/");
        }
      } finally {
        console.log("Finished fetching banks, setting isLoading to false");
        setIsLoading(false);
        clearTimeout(timeout);
      }
    };
    fetchBanks();
  }, [toast, navigate]);

  useEffect(() => {
    if (banks.length > 0 && uniqueBanks.length === 0) {
      console.log("Filtering unique banks");
      const bankMap = new Map();
      banks.forEach((bank) => {
        if (!bankMap.has(bank.code)) bankMap.set(bank.code, bank);
      });
      setUniqueBanks(Array.from(bankMap.values()));
    }
  }, [banks, uniqueBanks]);

  useEffect(() => {
    console.log("Validating form");
    if (selectedUserType === "buyer") {
      setFormValid(paymentDescription.trim() !== "" && paymentAmount.trim() !== "");
    } else {
      setFormValid(
        email.trim() !== "" &&
        paymentAmount.trim() !== "" &&
        selectedBankCode.trim() !== "" &&
        paymentAccountNumber.trim() !== "" &&
        paymentDescription.trim() !== ""
      );
    }
  }, [email, paymentAmount, selectedBankCode, paymentAccountNumber, paymentDescription, selectedUserType]);

  // Render
  console.log("Rendering component, isLoading =", isLoading, "errorMessage =", errorMessage);
  return (
    <Box
      minH="100vh"
      className="px-7 pt-32 pb-20"
      w="full"
      color={textColor}
      transition="background 0.3s ease, color 0.3s ease"
    >
      {isLoading ? (
        <Center minH="100vh">
          <VStack spacing={4}>
            <Spinner size="xl" color={accentColor} thickness="4px" />
            <Text fontSize="lg" color={textColor}>
              Loading transaction details...
            </Text>
          </VStack>
        </Center>
      ) : errorMessage ? (
        <Center minH="100vh">
          <VStack spacing={4}>
            <Text fontSize="lg" color="red.500">
              Error: {errorMessage}
            </Text>
            <Button
              onClick={() => navigate("/")}
              bg={accentColor}
              color="white"
              _hover={{ bg: accentHoverColor }}
            >
              Go to Login
            </Button>
          </VStack>
        </Center>
      ) : (
        <Fade in={!isLoading}>
          <VStack spacing={8} maxW="900px" mx="auto">
            <Text
              as="h1"
              fontSize={{ base: "2xl", md: "3xl" }}
              className="font-bold"
              textAlign="center"
              bgGradient={
                colorMode === "light"
                  ? "linear(to-r, #957432, #C9A55A)"
                  : "linear(to-r, #957432, #C9A55A)"
              }
              bgClip="text"
              letterSpacing="tight"
            >
              Create Transaction
            </Text>
            <Box w="full" maxW="500px" position="relative" mb={10}>
              <Progress
                value={(step / 2) * 100}
                size="sm"
                colorScheme="yellow"
                bg={bgTertiary}
                borderRadius="full"
                sx={{ "& > div": { background: accentColor } }}
              />
              <HStack justify="space-between" w="full" position="absolute" top="-16px">
                {[1, 2].map((number) => (
                  <Flex
                    key={number}
                    w="40px"
                    h="40px"
                    borderRadius="full"
                    bg={step >= number ? accentColor : bgTertiary}
                    color={step >= number ? "white" : textColor}
                    justify="center"
                    align="center"
                    fontWeight="bold"
                    boxShadow={`0px 4px 10px ${shadowColor}`}
                    transition="all 0.3s ease"
                    border={step >= number ? "none" : cardBorder}
                  >
                    {number}
                  </Flex>
                ))}
              </HStack>
            </Box>
            <Heading
              as="h2"
              fontSize={{ base: "xl", md: "2xl" }}
              textAlign="center"
              fontWeight="600"
              mb={8}
              color={textColor}
            >
              {step === 1 ? "I'm a" : "Transaction Details"}
            </Heading>
            {step === 1 && (
              <HStack spacing={6} flexWrap={{ base: "wrap", md: "nowrap" }} justify="center">
                <Box
                  as="label"
                  htmlFor="buyer"
                  cursor="pointer"
                  bg={bgSecondary}
                  borderRadius="xl"
                  p={6}
                  w={{ base: "full", md: "250px" }}
                  textAlign="center"
                  boxShadow={`0px 4px 20px ${shadowColor}`}
                  transition="all 0.3s ease"
                  _hover={{
                    transform: "translateY(-5px)",
                    boxShadow: `0px 8px 25px ${shadowColor}`,
                  }}
                  borderWidth="2px"
                  borderColor={selectedUserType === "buyer" ? accentColor : "transparent"}
                >
                  <input
                    type="radio"
                    id="buyer"
                    name="userType"
                    className="sr-only"
                    onClick={() => handleRadioClick("buyer")}
                    required
                  />
                  <VStack spacing={4}>
                    <Flex
                      w="60px"
                      h="60px"
                      borderRadius="full"
                      bg={selectedUserType === "buyer" ? accentColor : bgTertiary}
                      color="white"
                      justify="center"
                      align="center"
                      fontSize="2xl"
                      mx="auto"
                    >
                      <FaShoppingCart />
                    </Flex>
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                      Buyer
                    </Text>
                  </VStack>
                </Box>
                <Box
                  as="label"
                  htmlFor="seller"
                  cursor="pointer"
                  bg={bgSecondary}
                  borderRadius="xl"
                  p={6}
                  w={{ base: "full", md: "250px" }}
                  textAlign="center"
                  boxShadow={`0px 4px 20px ${shadowColor}`}
                  transition="all 0.3s ease"
                  _hover={{
                    transform: "translateY(-5px)",
                    boxShadow: `0px 8px 25px ${shadowColor}`,
                  }}
                  borderWidth="2px"
                  borderColor={selectedUserType === "seller" ? accentColor : "transparent"}
                >
                  <input
                    type="radio"
                    id="seller"
                    name="userType"
                    className="sr-only"
                    onClick={() => handleRadioClick("seller")}
                    required
                  />
                  <VStack spacing={4}>
                    <Flex
                      w="60px"
                      h="60px"
                      borderRadius="full"
                      bg={selectedUserType === "seller" ? accentColor : bgTertiary}
                      color="white"
                      justify="center"
                      align="center"
                      fontSize="2xl"
                      mx="auto"
                    >
                      <FaStore />
                    </Flex>
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                      Seller
                    </Text>
                  </VStack>
                </Box>
              </HStack>
            )}
            {step === 2 && (
              <Box
                bg={bgSecondary}
                borderRadius="xl"
                p={6}
                w="full"
                maxW="600px"
                boxShadow={`0px 8px 30px ${shadowColor}`}
                border={cardBorder}
              >
                <form id="transactionForm" onSubmit={acceptTransactionFunction}>
                  <VStack spacing={5} align="start">
                    <Box w="full">
                      <Text fontWeight="bold" fontSize="lg" mb={4} color={textColor}>
                        Product Details
                      </Text>
                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" color={textColor}>
                          Product Description
                        </FormLabel>
                        <Textarea
                          placeholder="Enter product description"
                          value={paymentDescription}
                          onChange={(e) => setPaymentDescription(e.target.value)}
                          bg={inputBg}
                          color={textColor}
                          borderColor={borderColor}
                          borderRadius="xl"
                          _hover={{ borderColor: accentColor }}
                          _focus={{
                            borderColor: accentColor,
                            boxShadow: `0 0 0 1px ${accentColor}`,
                          }}
                          h="100px"
                          required
                        />
                      </FormControl>
                      <FormControl isRequired mt={4}>
                        <FormLabel fontWeight="bold" color={textColor}>
                          Price/Amount
                        </FormLabel>
                        <Input
                          type="text"
                          placeholder="Enter price/amount"
                          value={displayAmount}
                          onChange={handleAmountChange}
                          bg={inputBg}
                          color={textColor}
                          borderColor={borderColor}
                          borderRadius="full"
                          _hover={{ borderColor: accentColor }}
                          _focus={{
                            borderColor: accentColor,
                            boxShadow: `0 0 0 1px ${accentColor}`,
                          }}
                          required
                          title="Please enter a valid number (e.g., 300000 or 300000.00)"
                        />
                      </FormControl>
                    </Box>
                    {selectedUserType === "seller" && (
                      <>
                        <Box w="full">
                          <Text fontWeight="bold" fontSize="lg" mb={4} color={textColor}>
                            Payment Details
                          </Text>
                          <FormControl isRequired>
                            <FormLabel fontWeight="bold" color={textColor}>
                              Email Address
                            </FormLabel>
                            <Input
                              type="email"
                              placeholder="Enter Email Address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              bg={inputBg}
                              color={textColor}
                              borderColor={borderColor}
                              borderRadius="full"
                              _hover={{ borderColor: accentColor }}
                              _focus={{
                                borderColor: accentColor,
                                boxShadow: `0 0 0 1px ${accentColor}`,
                              }}
                              required
                            />
                          </FormControl>
                          <FormControl isRequired mt={4}>
                            <FormLabel fontWeight="bold" color={textColor}>
                              Bank Name
                            </FormLabel>
                            <Select
                              placeholder="Select Bank"
                              value={selectedBankCode}
                              onChange={handleBankSelection}
                              bg={inputBg}
                              color={textColor}
                              borderColor={borderColor}
                              borderRadius="full"
                              _hover={{ borderColor: accentColor }}
                              _focus={{
                                borderColor: accentColor,
                                boxShadow: `0 0 0 1px ${accentColor}`,
                              }}
                              required
                            >
                              {uniqueBanks.map((bank) => (
                                <option key={bank.code} value={bank.code}>
                                  {bank.name}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl isRequired mt={4}>
                            <FormLabel fontWeight="bold" color={textColor}>
                              Account Number
                            </FormLabel>
                            <Input
                              type="text"
                              placeholder="Enter account number"
                              value={paymentAccountNumber}
                              onChange={(e) => setPaymentAccountNumber(e.target.value)}
                              onBlur={() => {
                                if (paymentAccountNumber.length === 10 && selectedBankCode) {
                                  verifyBankAccount();
                                }
                              }}
                              bg={inputBg}
                              color={textColor}
                              borderColor={borderColor}
                              borderRadius="full"
                              _hover={{ borderColor: accentColor }}
                              _focus={{
                                borderColor: accentColor,
                                boxShadow: `0 0 0 1px ${accentColor}`,
                              }}
                              required
                              pattern="[0-9]+"
                              title="Please enter a valid 10-digit account number (numbers only)"
                              minLength={10}
                              maxLength={10}
                            />
                          </FormControl>
                        </Box>
                        <Box w="full" mt={2}>
                          <Text fontWeight="bold" color={textColor}>
                            Amount: {formatCurrency(paymentAmount)} NGN
                          </Text>
                        </Box>
                      </>
                    )}
                    <Button
                      type="submit"
                      size="lg"
                      borderRadius="full"
                      w="full"
                      mt={4}
                      bg={formValid ? accentColor : disabledButtonHoverBg}
                      color="white"
                      _hover={{ bg: formValid ? accentHoverColor : disabledButtonHoverBg }}
                      boxShadow={formValid ? `0px 4px 10px ${shadowColor}` : "none"}
                      isDisabled={!formValid}
                    >
                      Start Transaction
                    </Button>
                  </VStack>
                </form>
              </Box>
            )}
            <HStack spacing={4} mt={8}>
              {step > 1 && (
                <Button
                  onClick={handlePreviousClick}
                  variant="outline"
                  borderColor={accentColor}
                  color={textColor}
                  borderRadius="full"
                  size="lg"
                  px={8}
                  _hover={{ bg: nextButtonHoverBg }}
                >
                  Previous
                </Button>
              )}
              {step < 2 && (
                <Button
                  onClick={handleNextClick}
                  isDisabled={!nextButtonActive}
                  borderRadius="full"
                  size="lg"
                  px={8}
                  color="white"
                  bg={nextButtonActive ? accentColor : disabledButtonHoverBg}
                  opacity={nextButtonActive ? 1 : 0.7}
                  _hover={{ bg: nextButtonActive ? accentHoverColor : disabledButtonHoverBg }}
                  boxShadow={nextButtonActive ? `0px 4px 10px ${shadowColor}` : "none"}
                >
                  Next
                </Button>
              )}
            </HStack>
          </VStack>
        </Fade>
      )}
      <AcceptTransactionModal
        isOpen={acceptTransactionModel}
        onClose={() => setAcceptTransactionModel(false)}
        userDetails={userDetails}
        paymentAmount={paymentAmount}
        selectedUserType={selectedUserType}
        textColor={textColor}
        accentColor={accentColor}
        accentHoverColor={accentHoverColor}
        bgSecondary={bgSecondary}
        cardBorder={cardBorder}
        shadowColor={shadowColor}
        modalHeaderBg={modalHeaderBg}
        modalHeaderBorder={modalHeaderBorder}
        modalButtonHoverBg={modalButtonHoverBg}
        createNewTransaction={createNewTransaction}
        createNewTransactionForBuyer={createNewTransactionForBuyer}
      />
    </Box>
  );
};

export default TransactionCreation;