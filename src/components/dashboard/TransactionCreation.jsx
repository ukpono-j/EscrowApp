import React, { useEffect, useRef, useState } from "react";
import { FaShoppingCart, FaCheck, FaTimes, FaStore } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
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
  useColorModeValue
} from "@chakra-ui/react";
import { MdClose } from "react-icons/md";
import defaultProfileImage from '../../assets/profile_icon.png';
import nigeriaBanks, { getBankNameFromCode } from "../../data/banksList";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const TransactionCreation = () => {
  const { colorMode } = useColorMode();

  // Dynamic color values based on color mode
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

  const [step, setStep] = useState(1);
  const [nextButtonActive, setNextButtonActive] = useState(false);
  const navigate = useNavigate();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentBank, setPaymentBank] = useState("");
  const [paymentAccountNumber, setPaymentAccountNumber] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [email, setEmail] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("");
  const [willUseCourier, setWillUseCourier] = useState(false);
  const toast = useToast();
  const [acceptTransactionModel, setAcceptTransactionModel] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [banks, setBanks] = useState([]);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [uniqueBanks, setUniqueBanks] = useState([]);
  const [errors, setErrors] = useState([]);
  const [formValid, setFormValid] = useState(false);
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierDetails, setCourierDetails] = useState("");

  const transactionFee = paymentAmount ? (paymentAmount * 0.008).toFixed(2) : "0.00";
  const totalAmount = paymentAmount ? (parseFloat(paymentAmount) + parseFloat(transactionFee)).toFixed(2) : "0.00";

  // User details fetching
  const userDetailsAlreadyFetched = useRef(false);
  useEffect(() => {
    if (userDetailsAlreadyFetched.current) return;
    const fetchUserDetails = async () => {
      const token = localStorage.getItem("auth-token");
      if (token) axios.defaults.headers.common["auth-token"] = token;
      try {
        const response = await axios.get(`${BASE_URL}/api/users/user-details`);
        setUserDetails(response.data);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
      userDetailsAlreadyFetched.current = true;
    };
    fetchUserDetails();
  }, []);

  // Banks fetching
  const banksAlreadyFetched = useRef(false);
  useEffect(() => {
    if (banksAlreadyFetched.current) return;
    const cachedBanks = localStorage.getItem('apiBanks');
    if (cachedBanks) {
      try {
        const parsedBanks = JSON.parse(cachedBanks);
        if (Array.isArray(parsedBanks) && parsedBanks.length > 0) {
          setBanks(parsedBanks);
          banksAlreadyFetched.current = true;
          return;
        }
      } catch (e) {
        console.error("Error parsing cached banks:", e);
      }
    }
    const fetchBanks = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        setErrors([]);
        const response = await axios.get(`${BASE_URL}/api/transactions/banks`, {
          headers: { "auth-token": token },
          timeout: 10000
        });
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          const apiBanks = response.data.data.length > 0 ? response.data.data : nigeriaBanks;
          setBanks(apiBanks);
          localStorage.setItem('apiBanks', JSON.stringify(apiBanks));
        } else {
          setBanks(nigeriaBanks);
          localStorage.setItem('apiBanks', JSON.stringify(nigeriaBanks));
          toast({
            title: "Using default bank list",
            description: "Could not load live bank data",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
        }
        banksAlreadyFetched.current = true;
      } catch (error) {
        console.error("Error fetching banks:", error);
        setBanks(nigeriaBanks);
        localStorage.setItem('apiBanks', JSON.stringify(nigeriaBanks));
        toast({
          title: "Using default bank list",
          description: "Network error occurred",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        banksAlreadyFetched.current = true;
      }
    };
    fetchBanks();
  }, [toast]);

  // Unique banks filtering
  useEffect(() => {
    if (banks.length > 0 && uniqueBanks.length === 0) {
      const bankMap = new Map();
      banks.forEach(bank => {
        if (!bankMap.has(bank.code)) bankMap.set(bank.code, bank);
      });
      setUniqueBanks(Array.from(bankMap.values()));
    }
  }, [banks]);

  // Form validation
  useEffect(() => {
    if (selectedUserType === "buyer") {
      setFormValid(courierName.trim() !== "");
    } else {
      setFormValid(
        paymentName.trim() !== "" &&
        email.trim() !== "" &&
        paymentAmount.trim() !== "" &&
        selectedBankCode.trim() !== "" &&
        paymentAccountNumber.trim() !== ""
      );
    }
  }, [paymentName, email, paymentAmount, selectedBankCode, paymentAccountNumber, selectedUserType, courierName]);

  const handleBankSelection = (e) => {
    const code = e.target.value;
    setSelectedBankCode(code);
    const selectedBank = uniqueBanks.find(bank => bank.code === code);
    setPaymentBank(selectedBank ? selectedBank.name : getBankNameFromCode(code));
  };

  const verifyBankAccount = async () => {
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
          bank_name: paymentBank
        },
        {
          headers: { "auth-token": token },
          timeout: 10000
        }
      );
      if (response.data.status) {
        const accountName = response.data.data.account_name;
        toast({
          title: "Account verified!",
          description: accountName,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        if (!paymentName.trim()) setPaymentName(accountName);
      } else {
        toast({
          title: "Verification failed",
          description: response.data.message || "Could not verify account details",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error verifying account:", error);
      let errorMessage = "Network error or invalid account details";
      if (error.response) {
        if (error.response.status === 422) errorMessage = "Invalid account details";
        else if (error.response.status === 403 || error.response.status === 401) errorMessage = "Authorization error. Please re-login";
        else if (error.response?.data?.message) errorMessage = error.response.data.message;
      } else if (error.request) {
        errorMessage = "No response from server. Check your internet connection";
      }
      toast({
        title: "Verification failed",
        description: errorMessage,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const acceptTransactionFunction = (e) => {
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
  };

  const createNewTransaction = (e) => {
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
      paymentName,
      email,
      paymentAmount: totalAmount,
      paymentDescription,
      selectedUserType,
      courierName,
      trackingNumber,
      courierDetails,
      paymentBank,
      paymentBankCode: selectedBankCode,
      paymentAccountNumber,
    };
    const token = localStorage.getItem("auth-token");
    if (token) axios.defaults.headers.common["auth-token"] = token;
    axios
      .post(`${BASE_URL}/api/transactions/create-transaction`, requestData)
      .then((response) => {
        const transactionId = response.data.transactionId;
        toast({
          title: "Successfully created a transaction",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        navigate("/transactions/tab");
      })
      .catch((error) => {
        console.error("Transaction creation error:", error);
        if (error.response && error.response.data && error.response.data.errors) {
          setErrors(error.response.data.errors);
        } else {
          toast({
            title: "Error occurred during transaction",
            description: error.response?.data?.error || error.message,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      });
  };

  const handleRadioClick = (userType) => {
    setSelectedUserType(userType);
    setNextButtonActive(true);
  };

  const handleNextClick = () => {
    if (step === 1 && selectedUserType) {
      setStep(2);
      setNextButtonActive(false);
    } else if (step === 2 && selectedUserType === "buyer") {
      acceptTransactionForBuyer();
    } else if (selectedUserType && step < 3) {
      setStep(step + 1);
      setNextButtonActive(false);
    }
  };

  const acceptTransactionForBuyer = () => {
    setAcceptTransactionModel(true);
  };

  const createNewTransactionForBuyer = (e) => {
    if (e) e.preventDefault();
    const requestData = {
      paymentName: userDetails.fullName || "Buyer",
      email: userDetails.email || "",
      paymentAmount: "0",
      paymentDescription: courierDetails || "Transaction created by buyer",
      selectedUserType: "buyer",
      courierName,
      trackingNumber,
      courierDetails,
      paymentBank: "Pending",
      paymentBankCode: "000",
      paymentAccountNumber: "0000000000",
      isBuyerOnly: true,
    };
    const token = localStorage.getItem("auth-token");
    if (token) axios.defaults.headers.common["auth-token"] = token;
    axios
      .post(`${BASE_URL}/api/transactions/create-transaction`, requestData)
      .then((response) => {
        const transactionId = response.data.transactionId;
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
        console.error("Transaction creation error:", error);
        if (error.response && error.response.data && error.response.data.errors) {
          const errorMessages = error.response.data.errors.map(err => err.msg).join(", ");
          toast({
            title: "Validation error",
            description: errorMessages,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setErrors(error.response.data.errors);
        } else {
          toast({
            title: "Error occurred during transaction",
            description: error.response?.data?.error || error.message,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      });
  };

  const handlePreviousClick = () => {
    if (step > 1) {
      setStep(step - 1);
      setNextButtonActive(false);
    }
  };

  const stepTitles = [
    "I'm a",
    "Will you be using post/courier for this transaction?",
    "Payment Details",
  ];

  return (
    <Box
      minH="100vh"
      className="px-7 pt-32 pb-20"
      w="full"
      color={textColor}
      transition="background 0.3s ease, color 0.3s ease"
    >
      <VStack spacing={8} maxW="900px" mx="auto">
        <Text
          as="h1"
          fontSize={{ base: "2xl", md: "3xl" }}
          className="font-bold"
          textAlign="center"
          bgGradient={colorMode === "light" ? "linear(to-r, #957432, #C9A55A)" : "linear(to-r, #957432, #C9A55A)"}
          bgClip="text"
          letterSpacing="tight"
        >
          Create Transaction
        </Text>
        <Box w="full" maxW="500px" position="relative" mb={10}>
          <Progress
            value={(step / 3) * 100}
            size="sm"
            colorScheme="yellow"
            bg={bgTertiary}
            borderRadius="full"
            sx={{ '& > div': { background: accentColor } }}
          />
          <HStack justify="space-between" w="full" position="absolute" top="-16px">
            {[1, 2, 3].map((number) => (
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
          {stepTitles[step - 1]}
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
              _hover={{ transform: "translateY(-5px)", boxShadow: `0px 8px 25px ${shadowColor}` }}
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
                <Text fontSize="lg" fontWeight="bold" color={textColor}>Buyer</Text>
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
              _hover={{ transform: "translateY(-5px)", boxShadow: `0px 8px 25px ${shadowColor}` }}
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
                <Text fontSize="lg" fontWeight="bold" color={textColor}>Seller</Text>
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
            <VStack spacing={5} align="start">
              <FormControl isRequired>
                <FormLabel fontWeight="bold" color={textColor}>Courier Service Name</FormLabel>
                <Input
                  type="text"
                  placeholder="Enter courier service name (e.g., DHL, FedEx)"
                  value={courierName}
                  onChange={(e) => {
                    setCourierName(e.target.value);
                    setNextButtonActive(e.target.value.trim() !== "");
                  }}
                  bg={inputBg}
                  color={textColor}
                  borderColor={borderColor}
                  borderRadius="full"
                  _hover={{ borderColor: accentColor }}
                  _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                  required
                />
              </FormControl>
              <FormControl>
                <FormLabel fontWeight="bold" color={textColor}>Tracking Number (Optional)</FormLabel>
                <Input
                  type="text"
                  placeholder="Enter tracking number if available"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  bg={inputBg}
                  color={textColor}
                  borderColor={borderColor}
                  borderRadius="full"
                  _hover={{ borderColor: accentColor }}
                  _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontWeight="bold" color={textColor}>Additional Courier Details (Optional)</FormLabel>
                <Textarea
                  placeholder="Enter additional courier details"
                  value={courierDetails}
                  onChange={(e) => setCourierDetails(e.target.value)}
                  bg={inputBg}
                  color={textColor}
                  borderColor={borderColor}
                  borderRadius="xl"
                  _hover={{ borderColor: accentColor }}
                  _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                  h="100px"
                />
              </FormControl>
            </VStack>
          </Box>
        )}
        {step === 3 && (
          <Box
            bg={bgSecondary}
            borderRadius="xl"
            p={6}
            w="full"
            maxW="600px"
            boxShadow={`0px 8px 30px ${shadowColor}`}
            border={cardBorder}
          >
            <form id="paymentForm" onSubmit={acceptTransactionFunction}>
              <VStack spacing={5} align="start">
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color={textColor}>Name</FormLabel>
                  <Input
                    type="text"
                    placeholder="Enter Payment Name"
                    value={paymentName}
                    onChange={(e) => setPaymentName(e.target.value)}
                    bg={inputBg}
                    color={textColor}
                    borderColor={borderColor}
                    borderRadius="full"
                    _hover={{ borderColor: accentColor }}
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                    required
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color={textColor}>Email Address</FormLabel>
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
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                    required
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color={textColor}>Payment Amount</FormLabel>
                  <Input
                    type="number"
                    placeholder="Enter payment amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    bg={inputBg}
                    color={textColor}
                    borderColor={borderColor}
                    borderRadius="full"
                    _hover={{ borderColor: accentColor }}
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                    required
                    min="1"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color={textColor}>Bank Name</FormLabel>
                  <Select
                    placeholder="Select Bank"
                    value={selectedBankCode}
                    onChange={handleBankSelection}
                    bg={inputBg}
                    color={textColor}
                    borderColor={borderColor}
                    borderRadius="full"
                    _hover={{ borderColor: accentColor }}
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                    required
                  >
                    {uniqueBanks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color={textColor}>Account Number</FormLabel>
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
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                    required
                    pattern="[0-9]+"
                    title="Please enter a valid account number (numbers only)"
                    minLength={10}
                    maxLength={10}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color={textColor}>Payment Description</FormLabel>
                  <Textarea
                    placeholder="Enter payment description"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    bg={inputBg}
                    required
                    color={textColor}
                    borderColor={borderColor}
                    borderRadius="xl"
                    _hover={{ borderColor: accentColor }}
                    _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                    h="100px"
                  />
                </FormControl>
                <Box
                  w="full"
                  bg={useColorModeValue("gray.50", "#0F1624")}
                  p={4}
                  borderRadius="lg"
                  mt={2}
                  border={cardBorder}
                >
                  <Text fontWeight="bold" mb={2} color={textColor}>Transaction Summary</Text>
                  <Flex justify="space-between" mb={1}>
                    <Text color={textColor}>Amount:</Text>
                    <Text color={textColor}>{paymentAmount || "0.00"} NGN</Text>
                  </Flex>
                  <Flex justify="space-between" mb={1}>
                    <Text color={textColor}>Transaction Fee (0.8%):</Text>
                    <Text color={textColor}>{transactionFee} NGN</Text>
                  </Flex>
                  <Divider my={2} borderColor={useColorModeValue("gray.300", "gray.600")} />
                  <Flex justify="space-between" fontWeight="bold">
                    <Text color={textColor}>Total Amount:</Text>
                    <Text color={accentColor}>{totalAmount} NGN</Text>
                  </Flex>
                </Box>
                <Button
                  type="submit"
                  size="lg"
                  borderRadius="full"
                  w="full"
                  mt={4}
                  bg={formValid ? accentColor : useColorModeValue("gray.300", "#2D3748")}
                  color="white"
                  _hover={{ bg: formValid ? accentHoverColor : useColorModeValue("gray.300", "#2D3748") }}
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
              _hover={{ bg: useColorModeValue("gray.100", "rgba(149, 116, 50, 0.2)") }}
            >
              Previous
            </Button>
          )}
          {step < 3 && (
            <Button
              onClick={handleNextClick}
              isDisabled={!nextButtonActive}
              borderRadius="full"
              size="lg"
              px={8}
              color="white"
              bg={nextButtonActive ? accentColor : useColorModeValue("gray.300", "#2D3748")}
              opacity={nextButtonActive ? 1 : 0.7}
              _hover={{ bg: nextButtonActive ? accentHoverColor : useColorModeValue("gray.300", "#2D3748") }}
              boxShadow={nextButtonActive ? `0px 4px 10px ${shadowColor}` : "none"}
            >
              Next
            </Button>
          )}
        </HStack>
      </VStack>
      {acceptTransactionModel && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.7)"
          zIndex={999}
          display="flex"
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
            <Box p={4} bg={useColorModeValue("gray.50", "#0F1624")} borderBottomWidth="1px" borderColor={useColorModeValue("gray.200", "gray.700")}>
              <Flex justify="space-between" align="center">
                <Heading size="md" color={textColor}>Accept Escrow Transaction</Heading>
                <Button
                  variant="ghost"
                  p={1}
                  onClick={() => setAcceptTransactionModel(false)}
                  color={textColor}
                  _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                >
                  <MdClose size={24} />
                </Button>
              </Flex>
            </Box>
            <Box p={5}>
              <Flex align="center" mb={4}>
                <Avatar
                  src={userDetails.avatarImage ? `${BASE_URL}/${userDetails.avatarImage}` : defaultProfileImage}
                  size="md"
                  bg={accentColor}
                  boxShadow={`0px 2px 8px ${shadowColor}`}
                />
                <Box ml={3}>
                  <Text fontWeight="bold" color={textColor}>
                    {selectedUserType === "buyer" ? userDetails.fullName || "Buyer Transaction" : paymentName || "Transaction"}
                  </Text>
                  {selectedUserType === "seller" && (
                    <Text fontSize="sm" color={accentColor}>{totalAmount} NGN</Text>
                  )}
                </Box>
              </Flex>
              <Text fontSize="sm" mb={4} color={textColor}>
                You are about to {selectedUserType === "buyer" ? "create" : "accept"} the escrow transaction.
                Make sure you understand the terms before proceeding.
              </Text>
              <Box
                bg={useColorModeValue("gray.50", "#0F1624")}
                p={4}
                borderRadius="md"
                fontSize="sm"
                border={cardBorder}
              >
                <Heading size="xs" mb={3} color={textColor}>Terms</Heading>
                <Flex justify="space-between" mb={2}>
                  <Text color={textColor}>Courier Service</Text>
                  <Text color={textColor}>{courierName || "Not specified"}</Text>
                </Flex>
                {trackingNumber && (
                  <Flex justify="space-between" mb={2}>
                    <Text color={textColor}>Tracking Number</Text>
                    <Text color={textColor}>{trackingNumber}</Text>
                  </Flex>
                )}
                {selectedUserType === "seller" && (
                  <>
                    <Flex justify="space-between" mb={2}>
                      <Text color={textColor}>Payment Method</Text>
                      <Text color={textColor}>Wire Transfer</Text>
                    </Flex>
                    <Flex justify="space-between" mb={2}>
                      <Text color={textColor}>Transaction Amount</Text>
                      <Text color={textColor}>{paymentAmount} NGN</Text>
                    </Flex>
                    <Flex justify="space-between" mb={2}>
                      <Text color={textColor}>Transaction Fee</Text>
                      <Text color={textColor}>0.8%</Text>
                    </Flex>
                    <Flex justify="space-between" mb={2}>
                      <Text color={textColor}>Bank</Text>
                      <Text color={textColor}>{paymentBank || "Not specified"}</Text>
                    </Flex>
                    <Flex justify="space-between" mb={2}>
                      <Text color={textColor}>Account Number</Text>
                      <Text color={textColor}>{paymentAccountNumber}</Text>
                    </Flex>
                    <Divider my={2} borderColor={useColorModeValue("gray.300", "gray.600")} />
                    <Flex justify="space-between" fontWeight="bold">
                      <Text color={textColor}>Total Amount</Text>
                      <Text color={accentColor}>{totalAmount} NGN</Text>
                    </Flex>
                  </>
                )}
              </Box>
              <Button
                size="lg"
                w="full"
                mt={4}
                borderRadius="full"
                bg={accentColor}
                color="white"
                _hover={{ bg: accentHoverColor }}
                onClick={(e) => {
                  setAcceptTransactionModel(false);
                  if (selectedUserType === "buyer") {
                    createNewTransactionForBuyer(e);
                  } else {
                    createNewTransaction(e);
                  }
                }}
              >
                {selectedUserType === "buyer" ? "Create Transaction" : "Accept"}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TransactionCreation;