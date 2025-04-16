import React, { useEffect, useState } from "react";
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

const BASE_URL = import.meta.env.VITE_BASE_URL;

const TransactionCreation = () => {
  const { colorMode } = useColorMode();

  // Dynamic color values based on color mode
  const bgMain = useColorModeValue("white", "#0F1624");
  const bgSecondary = useColorModeValue("#F7FAFC", "#1E293B");
  const bgTertiary = useColorModeValue("#EDF2F7", "#2D3748");
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("#957432", "#957432");
  const accentColor = "#957432"; // Keep gold accent color for both modes
  const accentHoverColor = "#A88D50"; // Lighter gold for hover states
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

  // Calculate the transaction fee and total amount
  const transactionFee = paymentAmount ? (paymentAmount * 0.008).toFixed(2) : "0.00";
  const totalAmount = paymentAmount ? (parseFloat(paymentAmount) + parseFloat(transactionFee)).toFixed(2) : "0.00";

  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = localStorage.getItem("auth-token");
      if (token) {
        axios.defaults.headers.common["auth-token"] = token;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/users/user-details`, {
          headers: {
            "auth-token": token,
          },
        });
        setUserDetails(response.data);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    // Filter to get only unique bank codes
    const bankMap = new Map();
    banks.forEach(bank => {
      if (!bankMap.has(bank.code)) {
        bankMap.set(bank.code, bank);
      }
    });
    setUniqueBanks(Array.from(bankMap.values()));
  }, [banks]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        const response = await axios.get(`${BASE_URL}/api/transactions/banks`, {
          headers: {
            "auth-token": token,
          },
        });

        setBanks(response.data.data);
      } catch (error) {
        console.error("Error fetching banks:", error);
        toast({
          title: "Error fetching banks",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchBanks();
  }, []);

  const acceptTransactionFunction = (e) => {
    e.preventDefault();
    if (!selectedBankCode) {
      toast({
        title: "Please select a bank",
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

    if (!selectedBankCode) {
      toast({
        title: "Bank code is required",
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
      willUseCourier,
      paymentBank,
      paymentBankCode: selectedBankCode,
      paymentAccountNumber,
    };

    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    axios
      .post(`${BASE_URL}/api/transactions/create-transaction`, requestData, {
        headers: {
          "auth-token": token,
        },
      })
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
        console.error(error);
        if (error.response && error.response.data && error.response.data.errors) {
          setErrors(error.response.data.errors);
        } else {
          toast({
            title: "Error occurred during transaction",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      });
  };

  // Function to handle radio button click
  const handleRadioClick = (userType) => {
    setSelectedUserType(userType);
    setNextButtonActive(true);
  };

  // Function to handle radio button click for courier service (yes/no)
  const handleCourierOptionClick = (option) => {
    setWillUseCourier(option === "yes");
    setNextButtonActive(true);
  };

  // Function to handle "Next" button click
  const handleNextClick = () => {
    if (selectedUserType && step < 3) {
      setStep(step + 1);
      setNextButtonActive(false);
    }
  };

  // Function to handle "Previous" button click
  const handlePreviousClick = () => {
    if (step > 1) {
      setStep(step - 1);
      setNextButtonActive(false);
    }
  };

  // Array of titles for each step
  const stepTitles = [
    "I'm a",
    "Will you be using post/courier for this transaction?",
    "Payment Details",
  ];

  return (
    <Box
      minH="100vh"
      className="font-[Poppins]"
      w="full"
      px={4}
      py={8}
      bg={bgMain}
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

        {/* Progress bar */}
        <Box w="full" maxW="500px" position="relative" mb={10}>
          <Progress
            value={(step / 3) * 100}
            size="sm"
            colorScheme="yellow"
            bg={bgTertiary}
            borderRadius="full"
            sx={{
              '& > div': {
                background: accentColor,
              }
            }}
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

        {/* Step 1: User Type */}
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

        {/* Step 2: Courier Option */}
        {step === 2 && (
          <HStack spacing={6} flexWrap={{ base: "wrap", md: "nowrap" }} justify="center">
            <Box
              as="label"
              htmlFor="yes"
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
              borderColor={willUseCourier ? accentColor : "transparent"}
            >
              <input
                type="radio"
                id="yes"
                name="courierOption"
                className="sr-only"
                onClick={() => handleCourierOptionClick("yes")}
              />
              <VStack spacing={4}>
                <Flex
                  w="60px"
                  h="60px"
                  borderRadius="full"
                  bg={willUseCourier ? accentColor : bgTertiary}
                  color="white"
                  justify="center"
                  align="center"
                  fontSize="2xl"
                  mx="auto"
                >
                  <FaCheck />
                </Flex>
                <Text fontSize="lg" fontWeight="medium" color={textColor}>Yes</Text>
              </VStack>
            </Box>

            <Box
              as="label"
              htmlFor="no"
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
              borderColor={willUseCourier === false && nextButtonActive ? accentColor : "transparent"}
            >
              <input
                type="radio"
                id="no"
                name="courierOption"
                className="sr-only"
                onClick={() => handleCourierOptionClick("no")}
              />
              <VStack spacing={4}>
                <Flex
                  w="60px"
                  h="60px"
                  borderRadius="full"
                  bg={willUseCourier === false && nextButtonActive ? accentColor : bgTertiary}
                  color="white"
                  justify="center"
                  align="center"
                  fontSize="2xl"
                  mx="auto"
                >
                  <FaTimes />
                </Flex>
                <Text fontSize="lg" fontWeight="medium" color={textColor}>No</Text>
              </VStack>
            </Box>
          </HStack>
        )}

        {/* Step 3: Payment Details */}
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
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="bold" color={textColor}>Bank Name</FormLabel>
                <Select
                  placeholder="Select Bank"
                  value={selectedBankCode}
                  onChange={(e) => {
                    const selectedBank = uniqueBanks.find(bank => bank.code === e.target.value);
                    setSelectedBankCode(e.target.value);
                    setPaymentBank(selectedBank ? selectedBank.name : "");
                  }}
                  bg={inputBg}
                  color={textColor}
                  borderColor={borderColor}
                  borderRadius="full"
                  _hover={{ borderColor: accentColor }}
                  _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
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
                  bg={inputBg}
                  color={textColor}
                  borderColor={borderColor}
                  borderRadius="full"
                  _hover={{ borderColor: accentColor }}
                  _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="bold" color={textColor}>Payment Description</FormLabel>
                <Textarea
                  placeholder="Enter payment description"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  bg={inputBg}
                  color={textColor}
                  borderColor={borderColor}
                  borderRadius="xl"
                  _hover={{ borderColor: accentColor }}
                  _focus={{ borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }}
                  h="100px"
                />
              </FormControl>

              {/* Transaction Summary */}
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
                onClick={acceptTransactionFunction}
                size="lg"
                borderRadius="full"
                w="full"
                mt={4}
                bg={accentColor}
                color="white"
                _hover={{ bg: accentHoverColor }}
                boxShadow={`0px 4px 10px ${shadowColor}`}
                letterSpacing="wide"
              >
                Start Transaction
              </Button>
            </VStack>
          </Box>
        )}

        {/* Navigation Buttons */}
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

      {/* Confirmation Modal */}
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
                  src={
                    userDetails.avatarImage
                      ? `${BASE_URL}/${userDetails.avatarImage}`
                      : defaultProfileImage
                  }
                  size="md"
                  bg={accentColor}
                  boxShadow={`0px 2px 8px ${shadowColor}`}
                />
                <Box ml={3}>
                  <Text fontWeight="bold" color={textColor}>{paymentName || "Transaction"}</Text>
                  <Text fontSize="sm" color={accentColor}>{totalAmount} NGN</Text>
                </Box>
              </Flex>

              <Text fontSize="sm" mb={4} color={textColor}>
                You are about to accept the escrow transaction. Make sure you understand the terms before proceeding.
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
                  <Text color={textColor}>{paymentBank}</Text>
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
                  createNewTransaction(e);
                }}
              >
                Accept
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TransactionCreation;