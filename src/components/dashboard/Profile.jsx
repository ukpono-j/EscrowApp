import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaEdit, FaUpload, FaSave, FaTimes, FaUser, FaCalendarAlt, FaUniversity, FaCreditCard, FaWallet, FaSync, FaCopy, FaCheck, FaExclamationTriangle, FaMoneyBillWave } from "react-icons/fa";
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
  Select,
} from "@chakra-ui/react";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3001";

// Payment Information Modal Component
const PaymentInfoModal = ({ isOpen, onClose, paymentDetails, onStatusCheck, userName }) => {
  const [copiedItems, setCopiedItems] = useState({});
  const toast = useToast();

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
              Please transfer exactly this amount to the secure PaymentPoint intermediary account below. Use the provided reference to ensure your payment is credited to your wallet.
            </Text>
          </Box>

          <PaymentItem label="Bank Name" value={virtualAccount.bankName} itemKey="bankName" />
          <PaymentItem label="Account Number" value={virtualAccount.accountNumber} itemKey="accountNumber" />
          <PaymentItem
            label="Account Name"
            value={`PaymentPoint Intermediary (for ${userName})`}
            itemKey="accountName"
          />
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

// Withdrawal Modal Component
const WithdrawalModal = ({ isOpen, onClose, walletBalance, onWithdraw }) => {
  const toast = useToast();
  const cardBg = useColorModeValue("white", "#0F1722");
  const textColor = useColorModeValue("gray.800", "white");
  const subtleTextColor = useColorModeValue("gray.600", "gray.300");
  const labelColor = useColorModeValue("blue.600", "blue.300");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const gradientStart = useColorModeValue("blue.400", "blue.500");
  const gradientEnd = useColorModeValue("purple.500", "purple.600");
  const hoverGradient = `linear(to-r, ${useColorModeValue('blue.500', 'blue.600')}, ${useColorModeValue('purple.600', 'purple.700')})`;
  const inputBg = useColorModeValue("gray.50", "#1A2331");
  const inputHoverBg = useColorModeValue("gray.100", "#232D3F");

  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // List of common Nigerian banks (you can expand this list)
  const banks = [
    { name: "Opay", code: "OPAY" },
    { name: "GTBank", code: "058" },
    { name: "First Bank", code: "011" },
    { name: "Zenith Bank", code: "057" },
    { name: "Access Bank", code: "044" },
    { name: "UBA", code: "033" },
    { name: "Kuda", code: "KUDA" },
  ];

  const handleVerifyAccount = async () => {
    if (!selectedBank || !accountNumber || accountNumber.length !== 10) {
      toast({
        title: "Invalid Input",
        description: "Please select a bank and enter a valid 10-digit account number.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/verify-account`,
        { bankCode: selectedBank, accountNumber },
        { headers: { 'auth-token': localStorage.getItem('auth-token') } }
      );

      if (response.data.success) {
        setAccountName(response.data.accountName);
        toast({
          title: "Account Verified",
          description: `Account belongs to ${response.data.accountName}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(response.data.message || "Account verification failed");
      }
    } catch (error) {
      console.error("Account verification error:", error);
      setAccountName("");
      toast({
        title: "Verification Failed",
        description: error.response?.data?.message || "Unable to verify account. Please check the details and try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitWithdrawal = async () => {
    if (!selectedBank || !accountNumber || !accountName || withdrawalAmount <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please verify the account and enter a valid withdrawal amount.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (withdrawalAmount > walletBalance?.balance) {
      toast({
        title: "Insufficient Balance",
        description: "Withdrawal amount exceeds your wallet balance.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsWithdrawing(true);
    try {
      await onWithdraw({ amount: withdrawalAmount, bankCode: selectedBank, accountNumber, accountName });
      toast({
        title: "Withdrawal Initiated",
        description: "Your withdrawal request has been submitted successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
      // Reset form
      setWithdrawalAmount(0);
      setSelectedBank("");
      setAccountNumber("");
      setAccountName("");
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Unable to process withdrawal. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent bg={cardBg} borderColor={borderColor}>
        <ModalHeader>
          <Flex align="center">
            <Icon as={FaMoneyBillWave} color={gradientStart} mr={2} />
            <Text color={textColor} fontWeight="bold">
              Withdraw Funds
            </Text>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel color={labelColor}>Select Bank</FormLabel>
            <Select
              placeholder="Choose your bank"
              value={selectedBank}
              onChange={(e) => {
                setSelectedBank(e.target.value);
                setAccountName("");
              }}
              bg={inputBg}
              _hover={{ bg: inputHoverBg }}
              color={textColor}
            >
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel color={labelColor}>Account Number</FormLabel>
            <Flex>
              <Input
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  setAccountName("");
                }}
                placeholder="Enter 10-digit account number"
                maxLength={10}
                bg={inputBg}
                _hover={{ bg: inputHoverBg }}
                color={textColor}
                mr={2}
              />
              <Button
                onClick={handleVerifyAccount}
                isLoading={isVerifying}
                colorScheme="blue"
                variant="outline"
              >
                Verify
              </Button>
            </Flex>
          </FormControl>

          {accountName && (
            <Box mb={4} p={3} borderRadius="md" bg="green.50" borderLeftWidth="4px" borderLeftColor="green.400">
              <Text fontSize="sm" color="green.700">
                Account Name: {accountName}
              </Text>
            </Box>
          )}

          <FormControl mb={4}>
            <FormLabel color={labelColor}>Withdrawal Amount (NGN)</FormLabel>
            <NumberInput
              min={0}
              max={walletBalance?.balance || 0}
              value={withdrawalAmount}
              onChange={(valueString) => setWithdrawalAmount(parseFloat(valueString) || 0)}
              precision={2}
            >
              <NumberInputField bg={inputBg} _hover={{ bg: inputHoverBg }} color={textColor} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Text fontSize="sm" color={subtleTextColor} mt={1}>
              Available Balance: ₦{walletBalance?.balance?.toFixed(2) || "0.00"}
            </Text>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={handleSubmitWithdrawal}
            isLoading={isWithdrawing}
            colorScheme="blue"
            bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
            _hover={{ bgGradient: hoverGradient }}
            w="100%"
          >
            Submit Withdrawal
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
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
      setPaymentModalOpen(false);
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
    let retryCount = 0;
    const maxRetries = 5;

    const checkInterval = setInterval(async () => {
      if (!isMountedRef.current) {
        clearInterval(checkInterval);
        setCheckStatusInterval(null);
        toast.close(toastId);
        localStorage.removeItem('pendingPaymentRef');
        return;
      }

      attempts += 1;
      console.log('Polling payment status:', { reference, attempt: attempts });

      try {
        const response = await axios.get(
          `${BASE_URL}/api/wallet/verify-funding/${reference}`,
          {
            headers: {
              'auth-token': localStorage.getItem('auth-token'),
            },
            timeout: 15000,
          }
        );

        console.log('Payment status response:', response.data);

        retryCount = 0;

        if (response.data.success && response.data.data.transaction.status === 'completed') {
          clearInterval(checkInterval);
          setCheckStatusInterval(null);
          toast.close(toastId);

          setRefreshingBalance(true);
          const balanceResponse = await fetchWalletBalance();
          setRefreshingBalance(false);

          setPaymentModalOpen(false);
          setPaymentDetails(null);
          localStorage.removeItem('pendingPaymentRef');

          toast({
            title: 'Funding Successful',
            description: `Your wallet has been funded with ₦${response.data.data.transaction.amount.toFixed(2)}`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
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

          setPaymentModalOpen(false);
          setPaymentDetails(null);
          localStorage.removeItem('pendingPaymentRef');
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setCheckStatusInterval(null);
          toast.close(toastId);

          setRefreshingBalance(true);
          const balanceResponse = await fetchWalletBalance();
          setRefreshingBalance(false);

          if (balanceResponse && previousBalanceRef.current !== null && balanceResponse.balance > previousBalanceRef.current) {
            toast({
              title: 'Funding Successful',
              description: `Your wallet has been funded with ₦${(balanceResponse.balance - previousBalanceRef.current).toFixed(2)}`,
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
            setPaymentModalOpen(false);
            setPaymentDetails(null);
            localStorage.removeItem('pendingPaymentRef');
          } else {
            toast({
              title: 'Payment Verification Timeout',
              description: 'Payment verification took too long. Please check your wallet later or contact support.',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
            setPaymentModalOpen(false);
            setPaymentDetails(null);
            localStorage.removeItem('pendingPaymentRef');
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', {
          reference,
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        retryCount += 1;
        if (error.response?.status === 404 || error.code === 'ECONNABORTED' || retryCount >= maxRetries) {
          clearInterval(checkInterval);
          setCheckStatusInterval(null);
          toast.close(toastId);

          setRefreshingBalance(true);
          const balanceResponse = await fetchWalletBalance();
          setRefreshingBalance(false);

          if (balanceResponse && previousBalanceRef.current !== null && balanceResponse.balance > previousBalanceRef.current) {
            toast({
              title: 'Funding Successful',
              description: `Your wallet has been funded with ₦${(balanceResponse.balance - previousBalanceRef.current).toFixed(2)}`,
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
            setPaymentModalOpen(false);
            setPaymentDetails(null);
            localStorage.removeItem('pendingPaymentRef');
          } else {
            toast({
              title: 'Payment Verification Error',
              description: 'Unable to verify payment. Please try again later or contact support.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            setPaymentModalOpen(false);
            setPaymentDetails(null);
            localStorage.removeItem('pendingPaymentRef');
          }
        }
      }
    }, 10000);

    setCheckStatusInterval(checkInterval);
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/wallet/balance`, {
        headers: { 'auth-token': localStorage.getItem('auth-token') },
      });
      const newBalance = response.data.balance;

      setWalletBalance((prev) => ({
        ...prev,
        ...response.data,
        balance: newBalance,
      }));

      if (previousBalanceRef.current !== null && newBalance > previousBalanceRef.current) {
        const fundedAmount = newBalance - previousBalanceRef.current;
        toast({
          title: 'Wallet Funded',
          description: `Your wallet has been credited with ₦${fundedAmount.toFixed(2)}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else if (previousBalanceRef.current === null) {
        toast({
          title: 'Wallet Balance Loaded',
          description: `Your current balance is ₦${newBalance.toFixed(2)}`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }

      previousBalanceRef.current = newBalance;
      console.log('Wallet balance updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet balance:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast({
        title: 'Error',
        description: 'Unable to fetch wallet balance. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    }
  };

  const fetchUserDetails = async () => {
    if (fetchAttempts >= maxFetchAttempts || !isMountedRef.current) {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Unable to fetch user details after multiple attempts. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${BASE_URL}/api/users/user-details`, {
        headers: { 'auth-token': token },
      });
      setUserDetails(response.data);
      setEditedUserDetails({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        dateOfBirth: response.data.dateOfBirth ? new Date(response.data.dateOfBirth).toISOString().split('T')[0] : '',
        bank: response.data.bank || '',
        accountNumber: response.data.accountNumber || '',
      });
      setPhoneNumber(response.data.phoneNumber || '');
      setLoading(false);
      setFetchAttempts(0);
    } catch (error) {
      console.error('Error fetching user details:', error);
      if ((error.response?.status === 404 || error.response?.status === 401) && isMountedRef.current) {
        setFetchAttempts(prev => prev + 1);
        setTimeout(() => fetchUserDetails(), 2000);
      } else {
        setLoading(false);
        toast({
          title: 'Error',
          description: 'Unable to fetch user details. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleWithdraw = async ({ amount, bankCode, accountNumber, accountName }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/withdraw`,
        { amount, bankCode, accountNumber, accountName },
        { headers: { 'auth-token': localStorage.getItem('auth-token') } }
      );

      if (response.data.success) {
        await fetchWalletBalance();
      } else {
        throw new Error(response.data.message || "Withdrawal failed");
      }
    } catch (error) {
      console.error("Error initiating withdrawal:", error);
      throw new Error(error.response?.data?.message || "Unable to process withdrawal. Please try again.");
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const token = localStorage.getItem('auth-token');
    if (token) {
      fetchUserDetails();
      fetchWalletBalance();

      const pendingRef = localStorage.getItem('pendingPaymentRef');
      if (pendingRef) {
        setPaymentModalOpen(true);
        pollPaymentStatus(pendingRef);
      }
    } else {
      setLoading(false);
      toast({
        title: 'Authentication Error',
        description: 'Please log in to view your profile.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    return () => {
      isMountedRef.current = false;
      if (checkStatusInterval) {
        clearInterval(checkStatusInterval);
      }
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedImageFile) {
      toast({
        title: 'No Image Selected',
        description: 'Please select an image to upload.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedImageFile);

    try {
      const response = await axios.post(`${BASE_URL}/api/users/setAvatar`, formData, {
        headers: {
          'auth-token': localStorage.getItem('auth-token'),
          'Content-Type': 'multipart/form-data',
        },
      });

      setUserDetails(response.data.user);
      setPreview(null);
      setSelectedImageFile(null);
      toast({
        title: 'Avatar Updated',
        description: 'Your profile picture has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload avatar. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (!editMode) {
      setEditedUserDetails({
        firstName: userDetails?.firstName || '',
        lastName: userDetails?.lastName || '',
        dateOfBirth: userDetails?.dateOfBirth ? new Date(userDetails.dateOfBirth).toISOString().split('T')[0] : '',
        bank: userDetails?.bank || '',
        accountNumber: userDetails?.accountNumber || '',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUserDetails({ ...editedUserDetails, [name]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put(
        `${BASE_URL}/api/users/update-user-details`,
        {
          ...editedUserDetails,
          dateOfBirth: editedUserDetails.dateOfBirth ? new Date(editedUserDetails.dateOfBirth) : undefined,
        },
        {
          headers: { 'auth-token': localStorage.getItem('auth-token') },
        }
      );

      setUserDetails(response.data.user);
      setEditMode(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile details have been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFundWallet = async () => {
    if (fundingAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to fund your wallet.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!phoneNumber || !/^\d{10,11}$/.test(phoneNumber)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please provide a valid phone number (10-11 digits).',
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
          email: userDetails?.email,
          phoneNumber,
        },
        {
          headers: { 'auth-token': localStorage.getItem('auth-token') },
        }
      );

      if (response.data.success) {
        setPaymentDetails({
          virtualAccount: response.data.data.virtualAccount,
          reference: response.data.data.reference,
          amount: fundingAmount,
        });
        setPaymentModalOpen(true);
        localStorage.setItem('pendingPaymentRef', response.data.data.reference);
        pollPaymentStatus(response.data.data.reference);
      } else {
        throw new Error(response.data.message || 'Failed to initiate funding');
      }
    } catch (error) {
      console.error('Error initiating wallet funding:', error);
      let errorMessage = error.response?.data?.message || 'Unable to initiate wallet funding. Please try again.';
      if (error.response?.data?.message.includes('timeout')) {
        errorMessage = 'The payment provider is currently unavailable. Please try again later or contact support.';
      } else if (error.response?.data?.message.includes('server error')) {
        errorMessage = 'The payment provider encountered an internal error. Please try again later or contact support at support@yourapp.com.';
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

  const handleRefreshBalance = async () => {
    setRefreshingBalance(true);
    await fetchWalletBalance();
    setRefreshingBalance(false);
  };

  const handleCheckPaymentStatus = () => {
    if (paymentDetails?.reference) {
      pollPaymentStatus(paymentDetails.reference);
    } else {
      toast({
        title: 'No Payment Reference',
        description: 'No active payment to verify. Please initiate a new funding request.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg={backgroundBlue}>
        <Spinner size="xl" color={highlightColor} />
      </Flex>
    );
  }

  return (
    <Box
      minH="100vh"
      bgGradient={`linear(to-br, ${backgroundBlue}, ${backgroundPurple})`}
      py={8}
    >
      <Container maxW="container.lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            bg={cardBg}
            borderRadius="xl"
            p={{ base: 4, md: 8 }}
            boxShadow={`0 8px 32px ${blueShadow}`}
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Heading size="lg" mb={6} color={textColor} textAlign="center">
              Your Profile
            </Heading>

            <Grid
              templateColumns={{ base: "1fr", md: "1fr 2fr" }}
              gap={6}
              alignItems="start"
            >
              {/* Avatar Section */}
              <Box textAlign="center">
                <Avatar
                  size="2xl"
                  src={preview || (userDetails?.avatarImage ? `${BASE_URL}/${userDetails.avatarImage}` : UserProfile)}
                  borderWidth="3px"
                  borderColor={avatarBorderColor}
                  mb={4}
                  boxShadow={`0 4px 12px ${blueShadow}`}
                />
                <FormControl mb={4}>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    display="none"
                    id="avatar-upload"
                  />
                  <Button
                    as="label"
                    htmlFor="avatar-upload"
                    colorScheme="blue"
                    leftIcon={<FaUpload />}
                    isLoading={uploading}
                    variant="outline"
                    bg={fieldBg}
                    _hover={{ bg: inputHoverBg }}
                    w="full"
                  >
                    Choose Image
                  </Button>
                </FormControl>
                {preview && (
                  <Button
                    colorScheme="blue"
                    onClick={handleUpload}
                    isLoading={uploading}
                    leftIcon={<FaSave />}
                    w="full"
                    bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
                    _hover={{ bgGradient: hoverGradient }}
                  >
                    Upload Image
                  </Button>
                )}
              </Box>

              {/* Profile Details Section */}
              <Box>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="xl" fontWeight="bold" color={textColor}>
                    Personal Information
                  </Text>
                  <Button
                    leftIcon={editMode ? <FaTimes /> : <FaEdit />}
                    onClick={handleEditToggle}
                    colorScheme="blue"
                    variant="ghost"
                    size="sm"
                  >
                    {editMode ? "Cancel" : "Edit"}
                  </Button>
                </Flex>

                <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={4}>
                  <FormControl>
                    <FormLabel color={labelColor}>
                      <Flex align="center">
                        <Icon as={FaUser} mr={2} />
                        First Name
                      </Flex>
                    </FormLabel>
                    {editMode ? (
                      <Input
                        name="firstName"
                        value={editedUserDetails.firstName}
                        onChange={handleInputChange}
                        bg={inputBg}
                        _hover={{ bg: inputHoverBg }}
                        color={textColor}
                      />
                    ) : (
                      <Text color={textColor}>{userDetails?.firstName || "Not Provided"}</Text>
                    )}
                  </FormControl>

                  <FormControl>
                    <FormLabel color={labelColor}>
                      <Flex align="center">
                        <Icon as={FaUser} mr={2} />
                        Last Name
                      </Flex>
                    </FormLabel>
                    {editMode ? (
                      <Input
                        name="lastName"
                        value={editedUserDetails.lastName}
                        onChange={handleInputChange}
                        bg={inputBg}
                        _hover={{ bg: inputHoverBg }}
                        color={textColor}
                      />
                    ) : (
                      <Text color={textColor}>{userDetails?.lastName || "Not Provided"}</Text>
                    )}
                  </FormControl>

                  <FormControl>
                    <FormLabel color={labelColor}>
                      <Flex align="center">
                        <Icon as={FaCalendarAlt} mr={2} />
                        Date of Birth
                      </Flex>
                    </FormLabel>
                    {editMode ? (
                      <Input
                        type="date"
                        name="dateOfBirth"
                        value={editedUserDetails.dateOfBirth}
                        onChange={handleInputChange}
                        bg={inputBg}
                        _hover={{ bg: inputHoverBg }}
                        color={textColor}
                      />
                    ) : (
                      <Text color={textColor}>{formatDate(userDetails?.dateOfBirth)}</Text>
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
                        name="bank"
                        value={editedUserDetails.bank}
                        onChange={handleInputChange}
                        bg={inputBg}
                        _hover={{ bg: inputHoverBg }}
                        color={textColor}
                      />
                    ) : (
                      <Text color={textColor}>{userDetails?.bank || "Not Provided"}</Text>
                    )}
                  </FormControl>

                  <FormControl>
                    <FormLabel color={labelColor}>
                      <Flex align="center">
                        <Icon as={FaCreditCard} mr={2} />
                        Account Number
                      </Flex>
                    </FormLabel>
                    {editMode ? (
                      <Input
                        name="accountNumber"
                        value={editedUserDetails.accountNumber}
                        onChange={handleInputChange}
                        bg={inputBg}
                        _hover={{ bg: inputHoverBg }}
                        color={textColor}
                      />
                    ) : (
                      <Text color={textColor}>{userDetails?.accountNumber || "Not Provided"}</Text>
                    )}
                  </FormControl>
                </Grid>

                {editMode && (
                  <Flex mt={6} justify="space-between">
                    <Button
                      onClick={handleSave}
                      isLoading={saving}
                      colorScheme="blue"
                      leftIcon={<FaSave />}
                      bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
                      _hover={{ bgGradient: hoverGradient }}
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={handleEditToggle}
                      bg={cancelBtnBg}
                      _hover={{ bg: cancelBtnHoverBg }}
                      leftIcon={<FaTimes />}
                    >
                      Cancel
                    </Button>
                  </Flex>
                )}
              </Box>
            </Grid>

            {/* Wallet Section */}
            <Box mt={8} p={6} bg={fieldBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  Wallet
                </Text>
                <Button
                  onClick={handleRefreshBalance}
                  isLoading={refreshingBalance}
                  leftIcon={<FaSync />}
                  colorScheme="blue"
                  variant="ghost"
                  size="sm"
                >
                  Refresh
                </Button>
              </Flex>
              <Text fontSize="2xl" color={highlightColor} fontWeight="bold">
                ₦{walletBalance?.balance?.toFixed(2) || '0.00'} {walletBalance?.currency || 'NGN'}
              </Text>
              <Text fontSize="sm" color={subtleTextColor} mt={1}>
                Total Deposits: ₦{walletBalance?.totalDeposits?.toFixed(2) || '0.00'}
              </Text>

              <Flex mt={6} direction={{ base: "column", sm: "row" }} gap={4}>
                <Box flex="1">
                  <FormControl>
                    <FormLabel color={labelColor}>Fund Wallet (NGN)</FormLabel>
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
                  <FormControl mt={4}>
                    <FormLabel color={labelColor}>Phone Number</FormLabel>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      bg={inputBg}
                      _hover={{ bg: inputHoverBg }}
                      color={textColor}
                    />
                  </FormControl>
                  <Button
                    mt={4}
                    onClick={handleFundWallet}
                    isLoading={isFunding}
                    colorScheme="blue"
                    leftIcon={<FaWallet />}
                    bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
                    _hover={{ bgGradient: hoverGradient }}
                    w="full"
                  >
                    Fund Wallet
                  </Button>
                </Box>
                <Box flex="1">
                  <Button
                    mt={{ base: 4, sm: 10 }}
                    onClick={onWithdrawalModalOpen}
                    colorScheme="blue"
                    leftIcon={<FaMoneyBillWave />}
                    bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
                    _hover={{ bgGradient: hoverGradient }}
                    w="full"
                  >
                    Withdraw Funds
                  </Button>
                </Box>
              </Flex>
            </Box>
          </Box>
        </motion.div>
      </Container>

      <PaymentInfoModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          if (checkStatusInterval) {
            clearInterval(checkStatusInterval);
            setCheckStatusInterval(null);
          }
          localStorage.removeItem('pendingPaymentRef');
        }}
        paymentDetails={paymentDetails}
        onStatusCheck={handleCheckPaymentStatus}
        userName={`${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim() || userDetails?.email.split('@')[0]}
      />

      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={onWithdrawalModalClose}
        walletBalance={walletBalance}
        onWithdraw={handleWithdraw}
      />
    </Box>
  );
};

export default Profile;