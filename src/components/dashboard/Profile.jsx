import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaEdit, FaWallet, FaTimes, FaUser, FaCalendarAlt, FaUniversity, FaCreditCard, FaSync, FaMoneyBillWave, FaSave, FaPhone } from "react-icons/fa";
import { motion } from "framer-motion";
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
  Select,
} from "@chakra-ui/react";
import multiavatar from "@multiavatar/multiavatar/esm";

const PAYSTACK_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Zenith Bank", code: "057" },
  { name: "United Bank for Africa", code: "033" },
  { name: "Wema Bank", code: "035" },
];

const BASE_URL = (import.meta.env.VITE_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

const PaymentInfoModal = ({ isOpen, onClose, paymentDetails, onStatusCheck, userName }) => {
  const textColor = useColorModeValue("gray.800", "white");
  const subtleTextColor = useColorModeValue("gray.600", "gray.300");
  const highlightColor = useColorModeValue("blue.500", "blue.400");

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color={textColor}>Fund Wallet</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {paymentDetails ? (
            <>
              <Text color={textColor} mb={2}>
                Please make a transfer to the account below to fund your wallet:
              </Text>
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold" color={textColor}>
                  Account Name: {paymentDetails.virtualAccount?.account_name || "N/A"}
                </Text>
                <Text color={textColor}>
                  Account Number: {paymentDetails.virtualAccount?.account_number || "N/A"}
                </Text>
                <Text color={textColor}>
                  Bank: {paymentDetails.virtualAccount?.bank_name || "N/A"}
                </Text>
                <Text color={textColor}>
                  Amount: ₦{paymentDetails.amount?.toFixed(2) || "0.00"}
                </Text>
                <Text color={subtleTextColor} fontSize="sm" mt={2}>
                  Reference: {paymentDetails.reference || "N/A"}
                </Text>
              </Box>
              <Text color={subtleTextColor} mt={4} fontSize="sm">
                After making the payment, click below to verify the transaction.
              </Text>
            </>
          ) : (
            <Text color={textColor}>No payment details available. Please initiate a new funding request.</Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            onClick={onStatusCheck}
            mr={3}
            bgGradient={`linear(to-r, blue.400, purple.500)`}
            _hover={{ bgGradient: `linear(to-r, blue.500, purple.600)` }}
          >
            Check Payment Status
          </Button>
          <Button variant="ghost" onClick={onClose} color={highlightColor}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const WithdrawalModal = ({ isOpen, onClose, walletBalance, onWithdraw }) => {
  const [amount, setAmount] = useState(0);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const textColor = useColorModeValue("gray.800", "white");
  const inputBg = useColorModeValue("gray.50", "#1A2331");
  const inputHoverBg = useColorModeValue("gray.100", "#232D3F");

  const handleSubmit = async () => {
    if (!amount || amount <= 0 || amount > (walletBalance?.balance || 0)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount within your wallet balance.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!bankCode) {
      toast({
        title: "Missing Bank",
        description: "Please select a bank.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!accountNumber || !/^\d{10}$/.test(accountNumber)) {
      toast({
        title: "Invalid Account Number",
        description: "Please enter a valid 10-digit account number.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!accountName || accountName.trim().length < 3) {
      toast({
        title: "Invalid Account Name",
        description: "Please enter a valid account name.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onWithdraw({ amount, bankCode, accountNumber, accountName });
      toast({
        title: "Withdrawal Initiated",
        description: "Your withdrawal request has been processed.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Unable to process withdrawal. Please try again.";
      toast({
        title: "Withdrawal Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color={textColor}>Withdraw Funds</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text color={textColor} mb={4}>
            Available Balance: ₦{walletBalance?.balance?.toFixed(2) || "0.00"}
          </Text>
          <FormControl mb={4}>
            <FormLabel color={textColor}>Amount (NGN)</FormLabel>
            <NumberInput
              min={0}
              max={walletBalance?.balance || 0}
              value={amount}
              onChange={(valueString) => setAmount(parseFloat(valueString) || 0)}
              precision={2}
            >
              <NumberInputField bg={inputBg} _hover={{ bg: inputHoverBg }} color={textColor} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
          <FormControl mb={4}>
            <FormLabel color={textColor}>Bank</FormLabel>
            <Select
              placeholder="Select bank"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              bg={inputBg}
              _hover={{ bg: inputHoverBg }}
              color={textColor}
            >
              {PAYSTACK_BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl mb={4}>
            <FormLabel color={textColor}>Account Number</FormLabel>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter 10-digit account number"
              bg={inputBg}
              _hover={{ bg: inputHoverBg }}
              color={textColor}
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel color={textColor}>Account Name</FormLabel>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Enter account name"
              bg={inputBg}
              _hover={{ bg: inputHoverBg }}
              color={textColor}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            mr={3}
            bgGradient={`linear(to-r, blue.400, purple.500)`}
            _hover={{ bgGradient: `linear(to-r, blue.500, purple.600)` }}
          >
            Withdraw
          </Button>
          <Button variant="ghost" onClick={onClose} color={textColor}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const Profile = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const { isOpen: isPaymentModalOpen, onOpen: onPaymentModalOpen, onClose: onPaymentModalClose } = useDisclosure();
  const { isOpen: isWithdrawalModalOpen, onOpen: onWithdrawalModalOpen, onClose: onWithdrawalModalClose } = useDisclosure();

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

  const [userDetails, setUserDetails] = useState(null);
  const [editedUserDetails, setEditedUserDetails] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    bank: "",
    accountNumber: "",
  });
  const [walletBalance, setWalletBalance] = useState(null);
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fundingAmount, setFundingAmount] = useState(0);
  const [isFunding, setIsFunding] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [checkStatusInterval, setCheckStatusInterval] = useState(null);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const previousBalanceRef = useRef(null);
  const maxFetchAttempts = 3;
  const isMountedRef = useRef(false);


  
  const formatDate = (dateString) => {
    if (!dateString) return "Not Provided";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const pollPaymentStatus = (reference, maxAttempts = 60) => {
    if (!reference) {
      console.error('No reference provided for polling payment status');
      toast({
        title: 'Error',
        description: 'No payment reference available. Please initiate a new funding request.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setPaymentDetails(null);
      onPaymentModalClose();
      localStorage.removeItem('pendingPaymentRef');
      return;
    }
  
    if (checkStatusInterval) {
      console.log('Clearing existing polling interval for reference:', reference);
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
  
    const interval = setInterval(async () => {
      if (!isMountedRef.current) {
        console.log('Component unmounted, stopping polling');
        clearInterval(interval);
        toast.close(toastId);
        return;
      }
  
      attempts += 1;
  
      try {
        const response = await axios.get(`${BASE_URL}/api/wallet/funding-status/${reference}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
  
        console.log('Payment status response:', response.data);
  
        if (response.data.success && response.data.data.transaction.status === 'completed') {
          clearInterval(interval);
          setCheckStatusInterval(null);
          setPaymentDetails(null);
          localStorage.removeItem('pendingPaymentRef');
          toast.close(toastId);
          toast({
            title: 'Payment Confirmed',
            description: `Your wallet has been funded with ₦${response.data.data.transaction.amount.toFixed(2)}.`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          fetchWalletBalance();
          onPaymentModalClose();
        } else if (response.data.data.transaction.status === 'failed') {
          clearInterval(interval);
          setCheckStatusInterval(null);
          setPaymentDetails(null);
          localStorage.removeItem('pendingPaymentRef');
          toast.close(toastId);
          toast({
            title: 'Payment Failed',
            description: 'Your payment could not be confirmed. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          onPaymentModalClose();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setCheckStatusInterval(null);
          toast.close(toastId);
          toast({
            title: 'Payment Timeout',
            description: 'Payment verification timed out. You can manually check the status or try again.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          // Keep paymentDetails and reference to allow manual status check
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setCheckStatusInterval(null);
          toast.close(toastId);
          toast({
            title: 'Error',
            description: 'Unable to verify payment status. You can manually check the status or try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          // Keep paymentDetails and reference to allow manual status check
        }
      }
    }, 10000); // Poll every 10 seconds
  
    setCheckStatusInterval(interval);
  };

  const validateUserResponse = (responseData) => {
    if (responseData.success && responseData.data?.user) {
      return responseData.data.user;
    }
    if (responseData._id && responseData.firstName && responseData.email) {
      console.warn('Legacy format detected');
      return responseData;
    }
    console.error('Invalid user data structure:', responseData);
    throw new Error(responseData.error || 'Invalid user data received');
  };
  
  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/users/user-details`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('User details response:', response.data);
  
      const user = validateUserResponse(response.data);
  
      if (!user.firstName || !user.email) {
        console.error('User data missing required fields:', user);
        throw new Error('User data missing required fields');
      }
  
      setUserDetails(user);
      setEditedUserDetails({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        dateOfBirth: formatDate(user.dateOfBirth),
        bank: user.bank || '',
        accountNumber: user.accountNumber || '',
      });
      setPhoneNumber(user.phoneNumber || '');
    } catch (error) {
      console.error('Error fetching user details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage = error.response?.data?.error || error.message || 'Unable to fetch user details. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      if (error.response?.status === 401 || error.response?.status === 404) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const fetchWalletBalance = async () => {
    setRefreshingBalance(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Wallet balance response:', response.data);
      setWalletBalance(response.data);
      setVirtualAccount(response.data.virtualAccount);
      if (previousBalanceRef.current !== null && previousBalanceRef.current !== response.data.balance) {
        toast({
          title: 'Balance Updated',
          description: `Your wallet balance is now ₦${response.data.balance.toFixed(2)}.`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
      previousBalanceRef.current = response.data.balance;
      setFetchAttempts(0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setFetchAttempts((prev) => prev + 1);
      if (fetchAttempts >= maxFetchAttempts) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Unable to fetch wallet balance. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setRefreshingBalance(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put(
        `${BASE_URL}/api/users/profile`,
        { ...editedUserDetails, phoneNumber },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      console.log('Save profile response:', response.data);
      setUserDetails(response.data.user);
      setEditMode(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Unable to update profile. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFundWallet = async () => {
    if (!fundingAmount || fundingAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to fund your wallet.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
  
    if (!phoneNumber || !/^(0\d{10}|\+234\d{10})$/.test(phoneNumber)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 11-digit phone number starting with 0 or +234.',
        status: 'warning',
        duration: 3000,
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
          phoneNumber,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      console.log('Fund wallet response:', response.data);
      setPaymentDetails(response.data.data);
      localStorage.setItem('pendingPaymentRef', response.data.data.reference);
      onPaymentModalOpen();
      pollPaymentStatus(response.data.data.reference);
    } catch (error) {
      console.error('Error initiating funding:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      let errorMessage = error.response?.data?.message || 'Unable to initiate funding. Please try again later.';
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid funding details. Please check and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response?.status === 500 && typeof error.response?.data?.message === 'string' && error.response?.data?.message.includes('Paystack API key')) {
        errorMessage = 'Funding is currently unavailable due to a configuration issue. Please contact support.';
      }
      toast({
        title: 'Funding Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsFunding(false);
    }
  };

  const handleWithdraw = async ({ amount, bankCode, accountNumber, accountName }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/withdraw`,
        { amount, bankCode, accountNumber, accountName },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      console.log('Withdraw response:', response.data);
      await fetchWalletBalance();
      return response.data;
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      throw error;
    }
  };

  const checkPendingPayment = () => {
    const pendingRef = localStorage.getItem('pendingPaymentRef');
    if (pendingRef) {
      console.log('Found pending payment reference:', pendingRef);
      setPaymentDetails((prev) => prev || { reference: pendingRef });
      onPaymentModalOpen();
      pollPaymentStatus(pendingRef);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchUserDetails(), fetchWalletBalance()]);
      checkPendingPayment();
      setLoading(false);
    };
    fetchData();

    return () => {
      isMountedRef.current = false;
      if (checkStatusInterval) {
        console.log('Cleaning up polling interval');
        clearInterval(checkStatusInterval);
      }
    };
  }, []);

  const avatarSvg = multiavatar(userDetails?.email || "default");

  return (
    <Container maxW="container.lg" py={8}>
      {loading ? (
        <Flex justify="center" align="center" minH="50vh">
          <Spinner size="xl" color={highlightColor} />
        </Flex>
      ) : !userDetails ? (
        <Flex justify="center" align="center" minH="50vh">
          <Text color={textColor} fontSize="xl">
            Unable to load profile. Please log in again.
          </Text>
        </Flex>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Grid templateColumns={{ base: '1fr', md: '1fr 2fr' }} gap={6}>
            {/* Left Column: User Avatar and Wallet */}
            <Box>
              <Box
                bg={cardBg}
                p={6}
                borderRadius="lg"
                boxShadow={`0 4px 10px ${blueShadow}`}
                mb={6}
                borderWidth={1}
                borderColor={borderColor}
              >
                <Flex justify="center" mb={4}>
                  <Avatar
                    size="2xl"
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`}
                    borderWidth={2}
                    borderColor={avatarBorderColor}
                  />
                </Flex>
                <Text fontSize="xl" fontWeight="bold" color={textColor} textAlign="center">
                  {userDetails.firstName} {userDetails.lastName}
                </Text>
                <Text color={subtleTextColor} textAlign="center">
                  {userDetails.email}
                </Text>
                <Divider my={4} />
                <Flex align="center" justify="space-between">
                  <Flex align="center">
                    <Icon as={FaWallet} color={highlightColor} mr={2} />
                    <Text color={textColor}>Wallet Balance</Text>
                  </Flex>
                  <Button
                    size="sm"
                    onClick={fetchWalletBalance}
                    isLoading={refreshingBalance}
                    color={highlightColor}
                    variant="ghost"
                  >
                    <FaSync />
                  </Button>
                </Flex>
                <Text fontSize="2xl" fontWeight="bold" color={highlightColor} mt={2}>
                  ₦{walletBalance?.balance?.toFixed(2) || '0.00'}
                </Text>
                {virtualAccount && (
                  <Box mt={4}>
                    <Text fontWeight="bold" color={textColor}>
                      Virtual Account
                    </Text>
                    <Text color={subtleTextColor} fontSize="sm">
                      Account Name: {virtualAccount.account_name}
                    </Text>
                    <Text color={subtleTextColor} fontSize="sm">
                      Account Number: {virtualAccount.account_number}
                    </Text>
                    <Text color={subtleTextColor} fontSize="sm">
                      Bank: {virtualAccount.bank_name}
                    </Text>
                  </Box>
                )}
                <Flex mt={4} direction="column" gap={2}>
                  <Button
                    bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
                    color="white"
                    _hover={{ bgGradient: hoverGradient }}
                    leftIcon={<FaMoneyBillWave />}
                    onClick={() => setFundingAmount(0)}
                  >
                    Fund Wallet
                  </Button>
                  <Button
                    variant="outline"
                    color={highlightColor}
                    borderColor={highlightColor}
                    _hover={{ bg: inputHoverBg }}
                    leftIcon={<FaCreditCard />}
                    onClick={onWithdrawalModalOpen}
                    isDisabled={!walletBalance?.balance}
                  >
                    Withdraw Funds
                  </Button>
                </Flex>
              </Box>
            </Box>
  
            {/* Right Column: User Details */}
            <Box>
              <Box
                bg={cardBg}
                p={6}
                borderRadius="lg"
                boxShadow={`0 4px 10px ${blueShadow}`}
                borderWidth={1}
                borderColor={borderColor}
              >
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="lg" color={textColor}>
                    Profile Details
                  </Heading>
                  {!editMode ? (
                    <Button
                      leftIcon={<FaEdit />}
                      color={highlightColor}
                      variant="ghost"
                      onClick={() => setEditMode(true)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <Button
                      leftIcon={<FaTimes />}
                      bg={cancelBtnBg}
                      _hover={{ bg: cancelBtnHoverBg }}
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </Flex>
                <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={4}>
                  <FormControl>
                    <FormLabel color={labelColor}>First Name</FormLabel>
                    {editMode ? (
                      <Input
                        value={editedUserDetails.firstName}
                        onChange={(e) =>
                          setEditedUserDetails({ ...editedUserDetails, firstName: e.target.value })
                        }
                        bg={inputBg}
                        _hover={{ bg: inputHoverBg }}
                        color={textColor}
                      />
                    ) : (
                      <Text color={textColor}>{userDetails.firstName || 'Not Provided'}</Text>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormLabel color={labelColor}>Last Name</FormLabel>
                    {editMode ? (
                      <Input
                        value={editedUserDetails.lastName}
                        onChange={(e) =>
                          setEditedUserDetails({ ...editedUserDetails, lastName: e.target.value })
                        }
                        bg={inputBg}
                        _hover={{ bg: inputHoverBg }}
                        color={textColor}
                      />
                    ) : (
                      <Text color={textColor}>{userDetails.lastName || 'Not Provided'}</Text>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormLabel color={labelColor}>Email</FormLabel>
                    <Text color={textColor}>{userDetails.email || 'Not Provided'}</Text>
                  </FormControl>
                  <FormControl>
                    <FormLabel color={labelColor}>Phone Number</FormLabel>
                    {editMode ? (
                      <Input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 08012345678 or +2348012345678"
                        bg={inputBg}
                        _hover={{ bg: inputHoverBg }}
                        color={textColor}
                      />
                    ) : (
                      <Text color={textColor}>{userDetails.phoneNumber || 'Not Provided'}</Text>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormLabel color={labelColor}>Date of Birth</FormLabel>
                    {editMode ? (
                      <Input
                        type="date"
                        value={editedUserDetails.dateOfBirth}
                        onChange={(e) =>
                          setEditedUserDetails({ ...editedUserDetails, dateOfBirth: e.target.value })
                        }
                        bg={inputBg}
                        _hover={{ bg: inputHoverBg }}
                        color={textColor}
                      />
                    ) : (
                      <Text color={textColor}>{formatDate(userDetails.dateOfBirth)}</Text>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormLabel color={labelColor}>
                      <Flex align="center">
                        <Icon as={FaUniversity} mr={2} />
                        Bank Name
                      </Flex>
                    </FormLabel>
                    {editMode ? (
                      <Input
                        value={editedUserDetails.bank}
                        onChange={(e) =>
                          setEditedUserDetails({ ...editedUserDetails, bank: e.target.value })
                        }
                        bg={inputBg}
                        _hover={{ bg: inputHoverBg }}
                        color={textColor}
                      />
                    ) : (
                      <Text color={textColor}>
                        {userDetails.bank && userDetails.accountNumber
                          ? `${userDetails.bank} - ${userDetails.accountNumber.slice(-4)}`
                          : 'Not Provided'}
                      </Text>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormLabel color={labelColor}>Account Number</FormLabel>
                    {editMode ? (
                      <Input
                        value={editedUserDetails.accountNumber}
                        onChange={(e) =>
                          setEditedUserDetails({ ...editedUserDetails, accountNumber: e.target.value })
                        }
                        bg={inputBg}
                        _hover={{ bg: inputHoverBg }}
                        color={textColor}
                      />
                    ) : (
                      <Text color={textColor}>{userDetails.accountNumber || 'Not Provided'}</Text>
                    )}
                  </FormControl>
                </Grid>
                {editMode && (
                  <Flex mt={6} justify="flex-end">
                    <Button
                      leftIcon={<FaSave />}
                      bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
                      color="white"
                      _hover={{ bgGradient: hoverGradient }}
                      isLoading={saving}
                      onClick={handleSave}
                    >
                      Save Changes
                    </Button>
                  </Flex>
                )}
              </Box>
  
              {/* Funding Section */}
              <Box
                bg={cardBg}
                p={6}
                mt={6}
                borderRadius="lg"
                boxShadow={`0 4px 10px ${blueShadow}`}
                borderWidth={1}
                borderColor={borderColor}
              >
                <Heading size="md" color={textColor} mb={4}>
                  Fund Your Wallet
                </Heading>
                <FormControl mb={4}>
                  <FormLabel color={labelColor}>Amount (NGN)</FormLabel>
                  <NumberInput
                    min={0}
                    value={fundingAmount}
                    onChange={(valueString) => setFundingAmount(parseFloat(valueString) || 0)}
                    precision={2}
                  >
                    <NumberInputField bg={inputBg} _hover={{ bg: inputHoverBg }} color={textColor} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel color={labelColor}>Phone Number</FormLabel>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 08012345678 or +2348012345678"
                    bg={inputBg}
                    _hover={{ bg: inputHoverBg }}
                    color={textColor}
                  />
                </FormControl>
                <Button
                  bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
                  color="white"
                  _hover={{ bgGradient: hoverGradient }}
                  isLoading={isFunding}
                  onClick={handleFundWallet}
                  leftIcon={<FaMoneyBillWave />}
                >
                  Fund Now
                </Button>
              </Box>
            </Box>
          </Grid>
        </motion.div>
      )}
  
      <PaymentInfoModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          if (checkStatusInterval) {
            clearInterval(checkStatusInterval);
            setCheckStatusInterval(null);
          }
          setPaymentDetails(null);
          localStorage.removeItem('pendingPaymentRef');
          onPaymentModalClose();
        }}
        paymentDetails={paymentDetails}
        onStatusCheck={() => paymentDetails?.reference && pollPaymentStatus(paymentDetails.reference)}
        userName={`${userDetails?.firstName} ${userDetails?.lastName}`}
      />
  
      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={onWithdrawalModalClose}
        walletBalance={walletBalance}
        onWithdraw={handleWithdraw}
      />
    </Container>
  );
};

export default Profile;