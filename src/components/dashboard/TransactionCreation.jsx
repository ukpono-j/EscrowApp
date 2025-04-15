import React, { useEffect, useState } from "react";
import { FaShoppingCart, FaCheck, FaTimes, FaStore } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "@chakra-ui/react";
import { Box, Text, Flex, Avatar, Progress, Button, FormControl, FormLabel, Input, Textarea, Select, Stack, Heading, VStack, HStack, Divider } from "@chakra-ui/react";
import { MdClose } from "react-icons/md";
import defaultProfileImage from '../../assets/profile_icon.png';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const TransactionCreation = () => {
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
    <Box minH="100vh" className="font-[Poppins]" w="full" px={4} py={8}>
      <VStack spacing={8} maxW="900px" mx="auto">
        <Text as="h1" fontSize={{base: "2xl", md: "3xl"}} className="font-bold" textAlign="center">
          Create Transaction
        </Text>
        
        {/* Progress bar */}
        <Box w="full" maxW="500px" position="relative" mb={10}>
          <Progress 
            value={(step/3) * 100} 
            size="sm" 
            colorScheme="blue" 
            bg="#1E293B" 
            borderRadius="full"
          />
          <HStack justify="space-between" w="full" position="absolute" top="-16px">
            {[1, 2, 3].map((number) => (
              <Flex 
                key={number} 
                w="40px" 
                h="40px" 
                borderRadius="full" 
                bg={step >= number ? "#957432" : "#957432"}
                color="white"
                justify="center" 
                align="center"
                fontWeight="bold"
                boxShadow="0px 4px 10px rgba(0, 0, 0, 0.2)"
                transition="all 0.3s ease"
              >
                {number}
              </Flex>
            ))}
          </HStack>
        </Box>

        <Heading 
          as="h2" 
          fontSize={{base: "xl", md: "2xl"}} 
          textAlign="center" 
          fontWeight="600"
          mb={8}
        >
          {stepTitles[step - 1]}
        </Heading>

        {/* Step 1: User Type */}
        {step === 1 && (
          <HStack spacing={6} flexWrap={{base: "wrap", md: "nowrap"}} justify="center">
            <Box
              as="label"
              htmlFor="buyer"
              cursor="pointer"
                bg="#1E293B"
              borderRadius="xl"
              p={6}
              w={{base: "full", md: "250px"}}
              textAlign="center"
              boxShadow="0px 4px 20px rgba(0, 0, 0, 0.1)"
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-5px)", boxShadow: "0px 8px 25px rgb(141, 110, 48)" }}
              borderWidth="2px"
              borderColor={selectedUserType === "buyer" ? "#957432" : "transparent"}
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
                  bg={selectedUserType === "buyer" ? "#957432" : "#2D3748"}
                  color="white"
                  justify="center"
                  align="center"
                  fontSize="2xl"
                  mx="auto"
                >
                  <FaShoppingCart />
                </Flex>
                <h3 fontSize="lg" className="text-white" fontWeight="bold">Buyer</h3>
              </VStack>
            </Box>

            <Box
              as="label"
              htmlFor="seller"
              cursor="pointer"
              bg="#1E293B"
              borderRadius="xl"
              p={6}
              w={{base: "full", md: "250px"}}
              textAlign="center"
              boxShadow="0px 4px 20px rgba(0, 0, 0, 0.1)"
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-5px)", boxShadow: "0px 8px 25px rgb(141, 110, 48)" }}
              borderWidth="2px"
              borderColor={selectedUserType === "seller" ? "#957432" : "transparent"}
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
                  bg={selectedUserType === "seller" ? "#957432" : "#2D3748"}
                  color="white"
                  justify="center"
                  align="center"
                  fontSize="2xl"
                  mx="auto"
                >
                  <FaStore />
                </Flex>
                <h3 fontSize="lg" className="text-white" fontWeight="bold">Seller</h3>
              </VStack>
            </Box>
          </HStack>
        )}

        {/* Step 2: Courier Option */}
        {step === 2 && (
          <HStack spacing={6} flexWrap={{base: "wrap", md: "nowrap"}} justify="center">
            <Box
              as="label"
              htmlFor="yes"
              cursor="pointer"
              bg="#1E293B"
              borderRadius="xl"
              p={6}
              w={{base: "full", md: "250px"}}
              textAlign="center"
              boxShadow="0px 4px 20px rgba(0, 0, 0, 0.1)"
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-5px)", boxShadow: "0px 8px 25px rgb(134, 102, 38)" }}
              borderWidth="2px"
              borderColor={willUseCourier ? "#957432" : "transparent"}
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
                  bg={willUseCourier ? "#957432" : "#2D3748"}
                  color="white"
                  justify="center"
                  align="center"
                  fontSize="2xl"
                  mx="auto"
                >
                  <FaCheck />
                </Flex>
                <Text fontSize="lg" fontWeight="medium">Yes</Text>
              </VStack>
            </Box>

            <Box
              as="label"
              htmlFor="no"
              cursor="pointer"
              bg="#1E293B"
              borderRadius="xl"
              p={6}
              w={{base: "full", md: "250px"}}
              textAlign="center"
              boxShadow="0px 4px 20px rgba(0, 0, 0, 0.1)"
              transition="all 0.3s ease"
              _hover={{ transform: "translateY(-5px)", boxShadow: "0px 8px 25px rgba(49, 138, 230, 0.2)" }}
              borderWidth="2px"
              borderColor={willUseCourier === false && nextButtonActive ? "#957432" : "transparent"}
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
                  bg={willUseCourier === false && nextButtonActive ? "#957432" : "#2D3748"}
                  color="white"
                  justify="center"
                  align="center"
                  fontSize="2xl"
                  mx="auto"
                >
                  <FaTimes />
                </Flex>
                <Text fontSize="lg" fontWeight="medium">No</Text>
              </VStack>
            </Box>
          </HStack>
        )}

        {/* Step 3: Payment Details */}
        {step === 3 && (
          <Box bg="#1E293B" borderRadius="xl" p={6} w="full" maxW="600px" boxShadow="0px 8px 30px rgba(0, 0, 0, 0.15)">
            <VStack spacing={5} align="start">
              <FormControl isRequired>
                <FormLabel fontWeight="bold">Name</FormLabel>
                <Input
                  type="text"
                  placeholder="Enter Payment Name"
                  value={paymentName}
                  onChange={(e) => setPaymentName(e.target.value)}
                  bg="#0F1624"
                  borderColor="#957432"
                  borderRadius="full"
                  _hover={{ borderColor: "#957432" }}
                  _focus={{ borderColor: "#957432", boxShadow: "0 0 0 1px #957432" }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="bold">Email Address</FormLabel>
                <Input
                  type="email"
                  placeholder="Enter Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  bg="#0F1624"
                  borderColor="#957432"
                  borderRadius="full"
                  _hover={{ borderColor: "#957432" }}
                  _focus={{ borderColor: "#957432", boxShadow: "0 0 0 1px #957432" }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="bold">Payment Amount</FormLabel>
                <Input
                  type="number"
                  placeholder="Enter payment amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  bg="#0F1624"
                  borderColor="#957432"
                  borderRadius="full"
                  _hover={{ borderColor: "#957432" }}
                  _focus={{ borderColor: "#957432", boxShadow: "0 0 0 1px #957432" }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="bold">Bank Name</FormLabel>
                <Select
                  placeholder="Select Bank"
                  value={selectedBankCode}
                  onChange={(e) => {
                    const selectedBank = uniqueBanks.find(bank => bank.code === e.target.value);
                    setSelectedBankCode(e.target.value);
                    setPaymentBank(selectedBank ? selectedBank.name : "");
                  }}
                  bg="#0F1624"
                  borderColor="#957432"
                  borderRadius="full"
                  _hover={{ borderColor: "#957432" }}
                  _focus={{ borderColor: "#957432", boxShadow: "0 0 0 1px #957432" }}
                >
                  {uniqueBanks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="bold">Account Number</FormLabel>
                <Input
                  type="text"
                  placeholder="Enter account number"
                  value={paymentAccountNumber}
                  onChange={(e) => setPaymentAccountNumber(e.target.value)}
                  bg="#0F1624"
                  borderColor="#957432"
                  borderRadius="full"
                  _hover={{ borderColor: "#957432" }}
                  _focus={{ borderColor: "#957432", boxShadow: "0 0 0 1px #957432" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="bold">Payment Description</FormLabel>
                <Textarea
                  placeholder="Enter payment description"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  bg="#0F1624"
                  borderColor="#957432"
                  borderRadius="xl"
                  _hover={{ borderColor: "#957432" }}
                  _focus={{ borderColor: "#957432", boxShadow: "0 0 0 1px #957432" }}
                  h="100px"
                />
              </FormControl>

              {/* Transaction Summary */}
              <Box w="full" bg="#0F1624" p={4} borderRadius="lg" mt={2}>
                <Text fontWeight="bold" mb={2}>Transaction Summary</Text>
                <Flex justify="space-between" mb={1}>
                  <Text>Amount:</Text>
                  <Text>{paymentAmount || "0.00"} NGN</Text>
                </Flex>
                <Flex justify="space-between" mb={1}>
                  <Text>Transaction Fee (0.8%):</Text>
                  <Text>{transactionFee} NGN</Text>
                </Flex>
                <Divider my={2} borderColor="gray.600" />
                <Flex justify="space-between" fontWeight="bold">
                  <Text>Total Amount:</Text>
                  <Text>{totalAmount} NGN</Text>
                </Flex>
              </Box>

              <Button
                onClick={acceptTransactionFunction}
                colorScheme="blue"
                textColor="White"
                size="lg"
                borderRadius="full"
                w="full"
                mt={4}
                bg="#957432"
                _hover={{ bg: "#957432" }}
                boxShadow="0px 4px 10px rgb(149, 116, 50)"
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
              borderColor="#957432"
              color="white"
              borderRadius="full"
              size="lg"
              px={8}
              _hover={{ bg: "rgb(144, 111, 44)" }}
            >
              Previous
            </Button>
          )}
          
          {step < 3 && (
            <Button
              onClick={handleNextClick}
              isDisabled={!nextButtonActive}
              // colorScheme="blue"
              borderRadius="full"
              size="lg"
              px={8}
              bg={nextButtonActive ? "#957432" : "#1E293B"}
              _hover={{ bg: nextButtonActive ? "#957432" : "#1E293B" }}
              boxShadow={nextButtonActive ? "0px 4px 10px rgb(144, 111, 44)" : "none"}
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
            bg="#1E293B"
            borderRadius="xl"
            maxW="400px"
            w="full"
            overflow="hidden"
            boxShadow="0px 10px 30px rgba(0, 0, 0, 0.3)"
          >
            <Box p={4} bg="#0F1624" borderBottomWidth="1px" borderColor="gray.700">
              <Flex justify="space-between" align="center">
                <Heading size="md">Accept Escrow Transaction</Heading>
                <Button
                  variant="ghost"
                  p={1}
                  onClick={() => setAcceptTransactionModel(false)}
                  _hover={{ bg: "gray.700" }}
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
                />
                <Box ml={3}>
                  <Text fontWeight="bold">{paymentName || "Transaction"}</Text>
                  <Text fontSize="sm">{totalAmount} NGN</Text>
                </Box>
              </Flex>

              <Text fontSize="sm" mb={4}>
                You are about to accept the escrow transaction. Make sure you understand the terms before proceeding.
              </Text>

              <Box bg="#0F1624" p={4} borderRadius="md" fontSize="sm">
                <Heading size="xs" mb={3}>Terms</Heading>
                
                <Flex justify="space-between" mb={2}>
                  <Text>Payment Method</Text>
                  <Text>Wire Transfer</Text>
                </Flex>
                
                <Flex justify="space-between" mb={2}>
                  <Text>Transaction Amount</Text>
                  <Text>{paymentAmount} NGN</Text>
                </Flex>
                
                <Flex justify="space-between" mb={2}>
                  <Text>Transaction Fee</Text>
                  <Text>0.8%</Text>
                </Flex>
                
                <Flex justify="space-between" mb={2}>
                  <Text>Bank</Text>
                  <Text>{paymentBank}</Text>
                </Flex>
                
                <Flex justify="space-between" mb={2}>
                  <Text>Account Number</Text>
                  <Text>{paymentAccountNumber}</Text>
                </Flex>
                
                <Divider my={2} borderColor="gray.600" />
                
                <Flex justify="space-between" fontWeight="bold">
                  <Text>Total Amount</Text>
                  <Text>{totalAmount} NGN</Text>
                </Flex>
              </Box>

              <Button
                colorScheme="blue"
                size="lg"
                w="full"
                textColor="white"
                mt={4}
                borderRadius="full"
                bg="#957432"
                _hover={{ bg: "#957432" }}
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