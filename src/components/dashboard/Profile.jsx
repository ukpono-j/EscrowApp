import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import jwtDecode from 'jwt-decode';
import { FaEdit, FaWallet, FaTimes, FaUser, FaCalendarAlt, FaUniversity, FaCreditCard, FaSync, FaMoneyBillWave, FaSave, FaPhone } from "react-icons/fa";
import { MdContentCopy } from "react-icons/md";
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
  IconButton,
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
  const toast = useToast();
  const textColor = useColorModeValue("gray.800", "white");
  const subtleTextColor = useColorModeValue("gray.600", "gray.300");
  const highlightColor = useColorModeValue("blue.500", "blue.400");
  const boxBg = useColorModeValue("gray.100", "gray.700");

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleManualReconcile = async () => {
    if (!paymentDetails?.reference && !paymentDetails?.paystackReference) {
      toast({
        title: "Error",
        description: "No reference available for reconciliation.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/reconcile`,
        { reference: paymentDetails.paystackReference || paymentDetails.reference },
        { headers: { Authorization: `Bearer ${localStorage.getItem("auth-token")}` } }
      );
      if (response.data.success) {
        toast({
          title: "Reconciliation Successful",
          description: `Your wallet has been funded with ₦${response.data.data.transaction.amount.toFixed(2)}.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        onClose();
      } else {
        toast({
          title: "Reconciliation Failed",
          description: response.data.message || "Unable to reconcile transaction.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Reconciliation Error",
        description: error.response?.data?.message || "Unable to reconcile transaction.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "md", md: "lg" }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color={textColor}>Fund Wallet</ModalHeader>
        <ModalCloseButton />
        <ModalBody px={{ base: 4, sm: 6 }} py={4}>
          {paymentDetails && paymentDetails.virtualAccount ? (
            <>
              <Text color={textColor} mb={2} fontSize={{ base: "sm", sm: "md" }}>
                Please make a transfer to the account below to fund your wallet:
              </Text>
              <Box p={4} bg={boxBg} borderRadius="md">
                <Flex align="center" justify="space-between" mb={2}>
                  <Text fontWeight="bold" color={textColor} fontSize={{ base: "sm", sm: "md" }}>
                    Account Name: {paymentDetails.virtualAccount.account_name || "N/A"}
                  </Text>
                  {paymentDetails.virtualAccount.account_name && (
                    <IconButton
                      aria-label="Copy account name"
                      icon={<MdContentCopy />}
                      size="xs"
                      bg="transparent"
                      color={subtleTextColor}
                      _hover={{ color: highlightColor }}
                      onClick={() => {
                        copyToClipboard(paymentDetails.virtualAccount.account_name);
                        toast({
                          title: "Copied",
                          description: "Account name copied to clipboard.",
                          status: "success",
                          duration: 3000,
                          isClosable: true,
                        });
                      }}
                    />
                  )}
                </Flex>
                <Flex align="center" justify="space-between" mb={2}>
                  <Text color={textColor} fontSize={{ base: "sm", sm: "md" }}>
                    Account Number: {paymentDetails.virtualAccount.account_number || "N/A"}
                  </Text>
                  {paymentDetails.virtualAccount.account_number && (
                    <IconButton
                      aria-label="Copy account number"
                      icon={<MdContentCopy />}
                      size="xs"
                      bg="transparent"
                      color={subtleTextColor}
                      _hover={{ color: highlightColor }}
                      onClick={() => {
                        copyToClipboard(paymentDetails.virtualAccount.account_number);
                        toast({
                          title: "Copied",
                          description: "Account number copied to clipboard.",
                          status: "success",
                          duration: 3000,
                          isClosable: true,
                        });
                      }}
                    />
                  )}
                </Flex>
                <Flex align="center" justify="space-between" mb={2}>
                  <Text color={textColor} fontSize={{ base: "sm", sm: "md" }}>
                    Bank: {paymentDetails.virtualAccount.bank_name || "N/A"}
                  </Text>
                  {paymentDetails.virtualAccount.bank_name && (
                    <IconButton
                      aria-label="Copy bank name"
                      icon={<MdContentCopy />}
                      size="xs"
                      bg="transparent"
                      color={subtleTextColor}
                      _hover={{ color: highlightColor }}
                      onClick={() => {
                        copyToClipboard(paymentDetails.virtualAccount.bank_name);
                        toast({
                          title: "Copied",
                          description: "Bank name copied to clipboard.",
                          status: "success",
                          duration: 3000,
                          isClosable: true,
                        });
                      }}
                    />
                  )}
                </Flex>
                <Flex align="center" justify="space-between" mb={2}>
                  <Text color={textColor} fontSize={{ base: "sm", sm: "md" }}>
                    Amount: ₦{paymentDetails.amount?.toFixed(2) || "0.00"}
                  </Text>
                  {paymentDetails.amount && (
                    <IconButton
                      aria-label="Copy amount"
                      icon={<MdContentCopy />}
                      size="xs"
                      bg="transparent"
                      color={subtleTextColor}
                      _hover={{ color: highlightColor }}
                      onClick={() => {
                        copyToClipboard(`₦${paymentDetails.amount.toFixed(2)}`);
                        toast({
                          title: "Copied",
                          description: "Amount copied to clipboard.",
                          status: "success",
                          duration: 3000,
                          isClosable: true,
                        });
                      }}
                    />
                  )}
                </Flex>
                <Flex align="center" justify="space-between">
                  <Text color={subtleTextColor} fontSize={{ base: "xs", sm: "sm" }} mt={2}>
                    Reference: {paymentDetails.reference || paymentDetails.paystackReference || "N/A"}
                  </Text>
                  {(paymentDetails.reference || paymentDetails.paystackReference) && (
                    <IconButton
                      aria-label="Copy reference"
                      icon={<MdContentCopy />}
                      size="xs"
                      bg="transparent"
                      color={subtleTextColor}
                      _hover={{ color: highlightColor }}
                      onClick={() => {
                        copyToClipboard(paymentDetails.reference || paymentDetails.paystackReference);
                        toast({
                          title: "Copied",
                          description: "Reference copied to clipboard.",
                          status: "success",
                          duration: 3000,
                          isClosable: true,
                        });
                      }}
                    />
                  )}
                </Flex>
              </Box>
              <Text color={subtleTextColor} mt={4} fontSize={{ base: "xs", sm: "sm" }}>
                After making the payment, click below to verify the transaction.
              </Text>
            </>
          ) : (
            <Text color={textColor} fontSize={{ base: "sm", sm: "md" }}>
              No payment details available. Please initiate a new funding request.
            </Text>
          )}
        </ModalBody>
        <ModalFooter flexDirection={{ base: "column", sm: "row" }} gap={{ base: 2, sm: 0 }}>
          <Button
            colorScheme="blue"
            onClick={onStatusCheck}
            size={{ base: "sm", sm: "md", md: "lg" }}
            fontSize={{ base: "sm", sm: "md" }}
            mr={{ base: 0, sm: 3 }}
            mb={{ base: 2, sm: 0 }}
            bgGradient="linear(to-r, blue.400, purple.500)"
            _hover={{ bgGradient: "linear(to-r, blue.500, purple.600)" }}
            isDisabled={!paymentDetails?.reference && !paymentDetails?.paystackReference}
          >
            Check Payment Status
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleManualReconcile}
            size={{ base: "sm", sm: "md", md: "lg" }}
            fontSize={{ base: "sm", sm: "md" }}
            mr={{ base: 0, sm: 3 }}
            mb={{ base: 2, sm: 0 }}
            bgGradient="linear(to-r, purple.400, purple.500)"
            _hover={{ bgGradient: "linear(to-r, purple.500, purple.600)" }}
            isDisabled={!paymentDetails?.reference && !paymentDetails?.paystackReference}
          >
            Manually Reconcile
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            color={highlightColor}
            size={{ base: "sm", sm: "md", md: "lg" }}
            fontSize={{ base: "sm", sm: "md" }}
          >
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
  const blueShadow = useColorModeValue('rgba(66, 153, 225, 0.3)', 'rgba(66, 153, 225, 0.5)');

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
  const previousBalanceRef = useRef(null);
  const isMountedRef = useRef(false);
  const toastIdRef = useRef(null); // Added to track toast ID
  const activePollingRef = useRef(null); // Added to track active polling reference

  const formatDate = (dateString) => {
    if (!dateString) return "Not Provided";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const pollPaymentStatus = async (reference, paystackReference, maxAttempts = 180, intervalMs = 15000) => {
    if (!reference && !paystackReference) {
      toast({
        title: 'Error',
        description: 'No payment reference available.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setPaymentDetails(null);
      onPaymentModalClose();
      localStorage.removeItem('pendingPaymentRef');
      return;
    }

    // Prevent duplicate polling for the same reference
    const refKey = reference || paystackReference;
    if (activePollingRef.current === refKey) {
      console.log(`Polling already active for reference: ${refKey}`);
      return;
    }

    // Clear any existing polling
    if (checkStatusInterval) {
      console.log('Clearing existing polling interval');
      clearInterval(checkStatusInterval);
      setCheckStatusInterval(null);
    }

    // Clear any existing toast
    if (toastIdRef.current) {
      toast.close(toastIdRef.current);
      toastIdRef.current = null;
    }

    // Set the active polling reference
    activePollingRef.current = refKey;

    // Create or update the toast
    if (!toastIdRef.current) {
      toastIdRef.current = toast({
        title: 'Payment Processing',
        description: 'Checking your payment status.',
        status: 'info',
        duration: null,
        isClosable: true,
      });
    }

    let attempts = 0;
    let retryCount = 0;
    const maxRetries = 3;

    const checkStatus = async () => {
      if (!isMountedRef.current) {
        console.log('Component unmounted, stopping polling');
        clearInterval(interval);
        toast.close(toastIdRef.current);
        toastIdRef.current = null;
        activePollingRef.current = null;
        setCheckStatusInterval(null);
        return;
      }

      attempts += 1;

      try {
        const referencesToCheck = [reference, paystackReference].filter(Boolean);
        let response;
        for (const ref of referencesToCheck) {
          try {
            response = await axios.get(
              `${BASE_URL}/api/wallet/funding-status/${ref}`,
              { headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` } }
            );
            console.log(`Payment status response for ${ref}:`, response.data);
            if (response.data.success) break;
          } catch (err) {
            console.warn(`Status check failed for ${ref}:`, err.message);
            continue;
          }
        }

        if (!response || !response.data.success) {
          throw new Error('No valid status response received');
        }

        if (response.data.success && response.data.data.transaction.status === 'completed') {
          clearInterval(interval);
          setCheckStatusInterval(null);
          activePollingRef.current = null;
          toast.close(toastIdRef.current);
          toastIdRef.current = null;
          setPaymentDetails(null);
          localStorage.removeItem('pendingPaymentRef');
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
          activePollingRef.current = null;
          toast.close(toastIdRef.current);
          toastIdRef.current = null;
          setPaymentDetails(null);
          localStorage.removeItem('pendingPaymentRef');
          toast({
            title: 'Payment Failed',
            description: 'Your payment could not be confirmed.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          onPaymentModalClose();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setCheckStatusInterval(null);
          activePollingRef.current = null;
          toast.close(toastIdRef.current);
          toastIdRef.current = null;
          toast({
            title: 'Payment Timeout',
            description: 'Payment verification timed out. Try manual reconciliation.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          setPaymentDetails((prev) => ({
            ...prev,
            reference: reference || paystackReference,
            paystackReference,
          }));
        }
      } catch (error) {
        console.error('Error polling payment status:', {
          attempt: attempts,
          reference: reference || paystackReference,
          message: error.message,
        });

        retryCount += 1;
        if (retryCount >= maxRetries || error.response?.status === 401 || error.response?.status === 404) {
          clearInterval(interval);
          setCheckStatusInterval(null);
          activePollingRef.current = null;
          toast.close(toastIdRef.current);
          toastIdRef.current = null;
          toast({
            title: 'Error',
            description: error.response?.data?.message || 'Unable to verify payment status.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          if (error.response?.status === 401) {
            localStorage.removeItem('auth-token');
            window.location.href = '/login';
          }
        }
      }
    };

    const interval = setInterval(checkStatus, intervalMs);
    setCheckStatusInterval(interval);
    checkStatus();
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
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` },
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
      const errorMessage = error.response?.data?.error || error.message || 'Unable to fetch user details.';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      if (error.response?.status === 401 || error.response?.status === 404) {
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
      }
    }
  };

  const fetchWalletBalance = async (retries = 3) => {
    setRefreshingBalance(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` },
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
    } catch (error) {
      console.error('Error fetching wallet balance:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (retries > 0) {
        console.log(`Retrying fetchWalletBalance (${retries} retries left)`);
        setTimeout(() => fetchWalletBalance(retries - 1), 2000);
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Unable to fetch wallet balance.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        if (error.response?.status === 401) {
          localStorage.removeItem('auth-token');
          window.location.href = '/login';
        }
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
        { headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` } }
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

    // Prevent funding if polling is active
    if (activePollingRef.current) {
      toast({
        title: 'Payment in Progress',
        description: 'A payment is already being processed. Please wait or cancel the current payment.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      onPaymentModalOpen();
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
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` },
          timeout: 30000,
        }
      );
      console.log('Fund wallet response:', response.data);
      if (!response.data.success || !response.data.data?.virtualAccount) {
        console.error('Invalid funding response:', response.data);
        toast({
          title: 'Funding Error',
          description: response.data.message || 'Failed to initiate funding. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      setPaymentDetails(response.data.data);
      setVirtualAccount(response.data.data.virtualAccount);
      localStorage.setItem('pendingPaymentRef', JSON.stringify({
        reference: response.data.data.reference,
        paystackReference: response.data.data.virtualAccount.provider_reference,
      }));
      onPaymentModalOpen();
      pollPaymentStatus(response.data.data.reference, response.data.data.virtualAccount.provider_reference);
    } catch (error) {
      console.error('Error initiating funding:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      let errorMessage = error.response?.data?.message || 'Unable to initiate funding. Please try again later.';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your network connection and try again.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid funding details. Please check and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
      } else if (error.response?.status === 408) {
        errorMessage = 'Request timed out. Please try again later or contact support.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Unable to create virtual account. Please try again or contact support.';
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
        { headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` } }
      );
      console.log('Withdraw response:', response.data);
      await fetchWalletBalance();
      return response.data;
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      throw error;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    const token = localStorage.getItem('auth-token');

    if (!token) {
      toast({
        title: 'Session Expired',
        description: 'Please log in to continue.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (!decoded || Date.now() >= decoded.exp * 1000) {
        toast({
          title: 'Session Expired',
          description: 'Your session has expired.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
        return;
      }
    } catch (error) {
      toast({
        title: 'Token Error',
        description: 'Invalid token format.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
      return;
    }

    const socket = io(BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to real-time updates.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      if (error.message.includes('Authentication error')) {
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
      }
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (error.message.includes('Authentication error')) {
        toast({
          title: 'Authentication Error',
          description: 'Your session has expired.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
      }
    });

    socket.on('balanceUpdate', (data) => {
      console.log('Received balance update:', data);
      setWalletBalance((prev) => ({
        ...prev,
        balance: data.balance,
      }));
      toast({
        title: 'Wallet Updated',
        description: `Your wallet has been funded with ₦${data.transaction.amount.toFixed(2)}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchWalletBalance();
      if (isPaymentModalOpen) {
        // Clear polling and toast on balance update
        if (checkStatusInterval) {
          clearInterval(checkStatusInterval);
          setCheckStatusInterval(null);
        }
        if (toastIdRef.current) {
          toast.close(toastIdRef.current);
          toastIdRef.current = null;
        }
        activePollingRef.current = null;
        setPaymentDetails(null);
        localStorage.removeItem('pendingPaymentRef');
        onPaymentModalClose();
      }
    });

    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchUserDetails(), fetchWalletBalance()]);
        if (userDetails?._id) {
          socket.emit('join-room', userDetails._id);
          console.log('Joined room:', userDetails._id);
        }
        const pendingRef = localStorage.getItem('pendingPaymentRef');
        if (pendingRef && !activePollingRef.current) {
          const { reference, paystackReference } = JSON.parse(pendingRef);
          setPaymentDetails((prev) => prev || { reference, paystackReference });
          onPaymentModalOpen();
          pollPaymentStatus(reference, paystackReference);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('auth-token');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      isMountedRef.current = false;
      socket.disconnect();
      if (checkStatusInterval) {
        clearInterval(checkStatusInterval);
        setCheckStatusInterval(null);
      }
      if (toastIdRef.current) {
        toast.close(toastIdRef.current);
        toastIdRef.current = null;
      }
      activePollingRef.current = null;
    };
  }, [userDetails?._id]);

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
                    _hover={{ bgGradient: `linear(to-r, blue.500, purple.600)` }}
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
                      _hover={{ bgGradient: `linear(to-r, blue.500, purple.600)` }}
                      isLoading={saving}
                      onClick={handleSave}
                    >
                      Save Changes
                    </Button>
                  </Flex>
                )}
              </Box>
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
                  _hover={{ bgGradient: `linear(to-r, blue.500, purple.600)` }}
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
          if (toastIdRef.current) {
            toast.close(toastIdRef.current);
            toastIdRef.current = null;
          }
          activePollingRef.current = null;
          setPaymentDetails(null);
          localStorage.removeItem('pendingPaymentRef');
          onPaymentModalClose();
        }}
        paymentDetails={paymentDetails}
        onStatusCheck={() => paymentDetails && pollPaymentStatus(paymentDetails.reference, paymentDetails.paystackReference)}
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