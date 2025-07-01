import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import jwtDecode from 'jwt-decode';
import pino from 'pino'; // Added for centralized logging
import Bottleneck from 'bottleneck'; // Added for rate limiting
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
  { name: "Wema Bank", code: "035" }, // Consolidated ALAT by Wema and Wema Bank
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "090267" },
  { name: "Moniepoint Microfinance Bank", code: "50515" },
  { name: "OPay Digital Services Limited", code: "999992" }, // Corrected OPay code
  { name: "PalmPay", code: "999991" }, // Corrected PalmPay code
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Zenith Bank", code: "057" },
];

const BASE_URL = (import.meta.env.VITE_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

// Initialize pino logger
const logger = pino({
  level: 'info',
  browser: { asObject: true },
});

// Initialize Bottleneck rate limiter
const limiter = new Bottleneck({
  minTime: 1000, // 1 second between requests (60 req/min)
  maxConcurrent: 5, // Max 5 concurrent requests
});


const PaymentInfoModal = ({ isOpen, onClose, paymentDetails, onStatusCheck, userName }) => {
  const toast = useToast();
  const textColor = useColorModeValue("gray.800", "white");
  const subtleTextColor = useColorModeValue("gray.600", "gray.300");
  const highlightColor = useColorModeValue("blue.500", "blue.400");
  const boxBg = useColorModeValue("gray.100", "gray.700");

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
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
                      onClick={() => copyToClipboard(paymentDetails.virtualAccount.account_name)}
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
                      onClick={() => copyToClipboard(paymentDetails.virtualAccount.account_number)}
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
                      onClick={() => copyToClipboard(paymentDetails.virtualAccount.bank_name)}
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
                      onClick={() => copyToClipboard(`₦${paymentDetails.amount.toFixed(2)}`)}
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
                      onClick={() => copyToClipboard(paymentDetails.reference || paymentDetails.paystackReference)}
                    />
                  )}
                </Flex>
              </Box>
              <Text color={subtleTextColor} mt={4} fontSize={{ base: "xs", sm: "sm" }}>
                After making the payment, click below to verify the transaction.
              </Text>
            </>
          ) : (
            <Box>
              <Text color={textColor} fontSize={{ base: "sm", sm: "md" }} mb={4}>
                Unable to initiate funding. Please try again or contact support.
              </Text>
              <Button
                colorScheme="blue"
                onClick={() => {
                  setPaymentDetails(null);
                  onClose();
                }}
                size={{ base: "sm", sm: "md" }}
                bgGradient="linear(to-r, blue.400, purple.500)"
                _hover={{ bgGradient: "linear(to-r, blue.500, purple.600)" }}
              >
                Retry Funding
              </Button>
            </Box>
          )}
        </ModalBody>
        <ModalFooter flexDirection={{ base: "column", sm: "row" }} gap={{ base: 2, sm: 0 }}>
          {paymentDetails && (paymentDetails.reference || paymentDetails.paystackReference) ? (
            <>
              <Button
                colorScheme="blue"
                onClick={onStatusCheck}
                size={{ base: "sm", sm: "md", md: "lg" }}
                fontSize={{ base: "sm", sm: "md" }}
                mr={{ base: 0, sm: 3 }}
                mb={{ base: 2, sm: 0 }}
                bgGradient="linear(to-r, blue.400, purple.500)"
                _hover={{ bgGradient: "linear(to-r, blue.500, purple.600)" }}
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
              >
                Manually Reconcile
              </Button>
            </>
          ) : null}
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedAccountName, setVerifiedAccountName] = useState("");
  const [banks, setBanks] = useState(PAYSTACK_BANKS);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const toast = useToast();
  const textColor = useColorModeValue("gray.800", "white");
  const inputBg = useColorModeValue("gray.50", "#1A2331");
  const inputHoverBg = useColorModeValue("gray.100", "#232D3F");

  useEffect(() => {
    if (isOpen) {
      const fetchBanks = async () => {
        setIsLoadingBanks(true);
        try {
          const response = await limiter.schedule(() => axios.get(`${BASE_URL}/api/wallet/banks`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth-token")}` },
            timeout: 15000,
          }));

          logger.info({ action: 'fetch_banks', response: response.data }, 'Fetched banks');

          if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
            const normalizeName = (name) => name.trim().toLowerCase();
            let banks = response.data.data
              .map((bank) => ({
                name: bank.name.trim(),
                code: bank.code,
              }))
              .filter((bank) => bank.name && bank.code);

            const allBanksMap = new Map();
            banks.forEach((bank) => allBanksMap.set(bank.code, bank));
            PAYSTACK_BANKS.forEach((bank) => {
              if (!allBanksMap.has(bank.code)) {
                allBanksMap.set(bank.code, bank);
              }
            });

            const allBanks = Array.from(allBanksMap.values()).sort((a, b) => a.name.localeCompare(b.name));
            const expectedBanks = ['Access Bank', 'Opay', 'Kuda Bank', 'Zenith Bank'];
            const missingBanks = expectedBanks.filter(
              (name) => !allBanks.some((bank) => normalizeName(bank.name) === normalizeName(name))
            );

            if (missingBanks.length > 0) {
              logger.warn({ missingBanks }, `Missing banks in API response: ${missingBanks.join(', ')}`);
              toast({
                title: 'Warning',
                description: `Some banks are missing: ${missingBanks.join(', ')}. Using fallback list.`,
                status: 'warning',
                duration: 5000,
                isClosable: true,
              });
            }

            setBanks(allBanks);
            logger.info({ banks: allBanks.map((b) => b.name) }, `Fetched ${allBanks.length} banks`);
          } else {
            throw new Error('Invalid or empty bank list from API');
          }
        } catch (error) {
          logger.error(
            {
              action: 'fetch_banks',
              error: error.message,
              status: error.response?.status,
              data: error.response?.data,
            },
            'Error fetching banks'
          );
          toast({
            title: 'Warning',
            description: 'Unable to load bank list from server. Using fallback bank list.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          const normalizeName = (name) => name.trim().toLowerCase();
          const uniqueBanksMap = new Map(PAYSTACK_BANKS.map((bank) => [bank.code, bank]));
          const uniqueBanks = Array.from(uniqueBanksMap.values()).sort((a, b) => a.name.localeCompare(b.name));
          setBanks(uniqueBanks);
          logger.info({ banks: uniqueBanks.map((b) => b.name) }, `Using fallback bank list (${uniqueBanks.length} banks)`);
        } finally {
          setIsLoadingBanks(false);
        }
      };
      fetchBanks();
    }
  }, [isOpen, toast]);

  const verifyAccount = async () => {
    if (!bankCode || !/^\d{10}$/.test(accountNumber)) {
      toast({
        title: "Invalid Details",
        description: "Please select a bank and enter a valid 10-digit account number.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await limiter.schedule(() => axios.post(
        `${BASE_URL}/api/wallet/verify-account`,
        { bankCode, accountNumber },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth-token")}` },
          timeout: 15000,
        }
      ));

      logger.info({ action: 'verify_account', response: response.data }, 'Account verification response');

      if (response.data.success) {
        setVerifiedAccountName(response.data.accountName);
        setAccountName(response.data.accountName);
        toast({
          title: "Account Verified",
          description: `Account name: ${response.data.accountName}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(response.data.message || "Account verification failed");
      }
    } catch (error) {
      logger.error(
        {
          action: 'verify_account',
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
        'Account verification error'
      );
      let errorMessage = error.response?.data?.message || "Unable to verify account. Please check your details and try again.";
      if (error.response?.status === 401) {
        errorMessage = "Authentication error. Please log in again.";
        localStorage.removeItem("auth-token");
        window.location.href = "/login";
      } else if (error.response?.status === 500 && error.response?.data?.error.includes("PAYSTACK_SECRET_KEY")) {
        errorMessage = "Server configuration issue. Please contact support.";
      } else if (error.response?.status === 422) {
        errorMessage = error.response?.data?.error || "Invalid account details. Please verify the bank code and account number.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Please check your network and try again.";
      }
      toast({
        title: "Verification Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setVerifiedAccountName("");
      setAccountName("");
    } finally {
      setIsVerifying(false);
    }
  };

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

    if (!accountName || accountName !== verifiedAccountName) {
      toast({
        title: "Account Not Verified",
        description: "Please verify the account before withdrawing.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await onWithdraw({ amount, bankCode, accountNumber, accountName });
      logger.info({ action: 'withdraw_submit', response: response.data }, 'Withdrawal initiated');
      toast({
        title: "Withdrawal Initiated",
        description: `Your withdrawal request of ₦${amount.toFixed(2)} has been initiated. Reference: ${response.data.reference}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      logger.error(
        { action: 'withdraw_submit', error: error.message, status: error.response?.status },
        'Withdrawal error'
      );
      let errorMessage = error.response?.data?.message || "Unable to process withdrawal. Please try again.";
      if (error.response?.status === 400 && errorMessage.includes("Insufficient funds in payment gateway")) {
        errorMessage = "Insufficient funds in the platform's payment gateway. Please contact support to resolve this issue.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication error. Please log in again.";
        localStorage.removeItem("auth-token");
        window.location.href = "/login";
      }
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

  // ... (rest of WithdrawalModal unchanged)
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

  // Initialize pino logger and Bottleneck limiter
  const logger = pino({
    level: 'info',
    browser: { asObject: true },
  });

  const limiter = new Bottleneck({
    minTime: 1000, // 1 second between requests (60 req/min)
    maxConcurrent: 5, // Max 5 concurrent requests
  });

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

    const refKey = reference || paystackReference;
    if (activePollingRef.current === refKey) {
      logger.info({ reference: refKey }, 'Polling already active for reference');
      return;
    }

    if (checkStatusInterval) {
      logger.info('Clearing existing polling interval');
      clearInterval(checkStatusInterval);
      setCheckStatusInterval(null);
    }

    if (toastIdRef.current) {
      toast.close(toastIdRef.current);
      toastIdRef.current = null;
    }

    activePollingRef.current = refKey;

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
        logger.info('Component unmounted, stopping polling');
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
            response = await limiter.schedule(() => axios.get(
              `${BASE_URL}/api/wallet/funding-status/${ref}`,
              { headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` } }
            ));
            logger.info({ action: 'poll_payment_status', reference: ref, response: response.data }, 'Payment status response');
            if (response.data.success) break;
          } catch (err) {
            logger.warn({ action: 'poll_payment_status', reference: ref, error: err.message }, 'Status check failed');
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
          const syncResponse = await limiter.schedule(() => axios.post(`${BASE_URL}/api/wallet/sync`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` },
          }));
          logger.info({ action: 'sync_wallet', response: syncResponse.data }, 'Wallet sync response');
          setWalletBalance(syncResponse.data.data);
          setVirtualAccount(syncResponse.data.data.virtualAccount);
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
        logger.error(
          {
            action: 'poll_payment_status',
            attempt: attempts,
            reference: reference || paystackReference,
            error: error.message,
            status: error.response?.status,
          },
          'Error polling payment status'
        );

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
      logger.warn({ responseData }, 'Legacy format detected');
      return responseData;
    }
    logger.error({ responseData }, 'Invalid user data structure');
    throw new Error(responseData.error || 'Invalid user data received');
  };

  const fetchUserDetails = async () => {
    try {
      const response = await limiter.schedule(() => axios.get(`${BASE_URL}/api/users/user-details`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` },
      }));
      logger.info({ action: 'fetch_user_details', response: response.data }, 'User details response');

      const user = validateUserResponse(response.data);

      if (!user.firstName || !user.email) {
        logger.error({ user }, 'User data missing required fields');
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
      logger.error(
        {
          action: 'fetch_user_details',
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
        'Error fetching user details'
      );
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
      const response = await limiter.schedule(() => axios.get(`${BASE_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` },
        timeout: 15000,
      }));
      logger.info({ action: 'fetch_wallet_balance', response: response.data }, 'Wallet balance response');

      if (response.status !== 200) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format');
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch wallet balance');
      }

      const data = response.data.data || response.data;
      if (!data) {
        throw new Error('Missing wallet data');
      }

      const balance = data.balance !== undefined ? data.balance : data.newBalance;
      const virtualAccount = data.virtualAccount;
      const totalDeposits = data.totalDeposits || 0;
      const currency = data.currency || 'NGN';
      const walletId = data.walletId;
      const lastSynced = data.lastSynced;

      if (balance === undefined) {
        throw new Error('Balance data not found in response');
      }

      const balanceResponse = await limiter.schedule(() => axios.get(`${BASE_URL}/api/wallet/check-paystack-balance`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` },
        timeout: 10000,
      }));

      logger.info({ action: 'check_paystack_balance', response: balanceResponse.data }, 'Paystack balance response');

      if (balanceResponse.data.success && balanceResponse.data.data.transferBalance < balance) {
        toast({
          title: 'Balance Warning',
          description: 'Funds are not yet available for withdrawal. Contact support if this persists.',
          status: 'warning',
          duration: 7000,
          isClosable: true,
        });
      }

      if (response.data.warning) {
        logger.warn({ warning: response.data.warning }, 'Wallet balance warning');
        toast({
          title: 'Balance Warning',
          description: response.data.warning,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }

      const syncAge = lastSynced ? Date.now() - new Date(lastSynced).getTime() : Infinity;

      if (syncAge < 30 * 1000) {
        const walletData = {
          balance,
          totalDeposits,
          currency,
          walletId,
          virtualAccount,
          lastSynced,
        };

        setWalletBalance(walletData);
        setVirtualAccount(virtualAccount);

        if (previousBalanceRef.current !== null && previousBalanceRef.current !== balance) {
          toast({
            title: 'Balance Updated',
            description: `Your wallet balance is now ₦${balance.toFixed(2)}.`,
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
        }
        previousBalanceRef.current = balance;
      } else {
        logger.info('Balance is stale or missing lastSynced, triggering sync');
        const syncResponse = await limiter.schedule(() => axios.post(`${BASE_URL}/api/wallet/sync`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` },
          timeout: 15000,
        }));

        logger.info({ action: 'sync_wallet', response: syncResponse.data }, 'Sync response');

        if (syncResponse.status !== 200 || !syncResponse.data.success || !syncResponse.data.data) {
          throw new Error(syncResponse.data.error || 'Invalid sync response');
        }

        const syncData = syncResponse.data.data;
        const syncedBalance = syncData.newBalance !== undefined ? syncData.newBalance : syncData.balance;

        if (syncedBalance === undefined) {
          throw new Error('Synced balance data not found');
        }

        const updatedWalletData = {
          balance: syncedBalance,
          totalDeposits: syncData.totalDeposits || 0,
          currency: 'NGN',
          virtualAccount: virtualAccount,
          lastSynced: syncData.lastSynced,
        };

        setWalletBalance(updatedWalletData);
        setVirtualAccount(virtualAccount);

        toast({
          title: 'Balance Synced',
          description: `Your wallet balance is now ₦${syncedBalance.toFixed(2)}.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        previousBalanceRef.current = syncedBalance;
      }
    } catch (error) {
      logger.error(
        {
          action: 'fetch_wallet_balance',
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
        'Error fetching wallet balance'
      );

      let errorMessage = error.message || 'Unable to fetch wallet balance.';

      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Request timed out. Please check your network connection.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again or contact support.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      if (retries > 0) {
        logger.info({ retries }, `Retrying fetchWalletBalance (${retries} retries left)`);
        setTimeout(() => fetchWalletBalance(retries - 1), 2000);
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });

        setWalletBalance({
          balance: 0,
          currency: 'NGN',
          totalDeposits: 0,
          walletId: null,
          lastSynced: null,
        });
        setVirtualAccount(null);
      }
    } finally {
      setRefreshingBalance(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await limiter.schedule(() => axios.put(
        `${BASE_URL}/api/users/profile`,
        { ...editedUserDetails, phoneNumber },
        { headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` } }
      ));
      logger.info({ action: 'save_profile', response: response.data }, 'Save profile response');
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
      logger.error(
        { action: 'save_profile', error: error.message, status: error.response?.status },
        'Error saving profile'
      );
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
    logger.info({ fundingAmount, phoneNumber, userDetails }, 'handleFundWallet called');

    if (!fundingAmount || fundingAmount <= 0 || isNaN(fundingAmount)) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount to fund your wallet.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (fundingAmount < 100) {
      toast({
        title: 'Minimum Amount Required',
        description: 'The minimum funding amount is ₦100.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const phoneToUse = phoneNumber || userDetails?.phoneNumber;
    if (!phoneToUse || !/^(0\d{10}|\+234\d{10})$/.test(phoneToUse)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 11-digit phone number starting with 0 or +234.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!userDetails?.email || !userDetails?._id) {
      toast({
        title: 'User Information Missing',
        description: 'Please refresh the page and try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (activePollingRef.current || isFunding) {
      toast({
        title: 'Payment in Progress',
        description: 'A payment is already being processed. Please wait or cancel the current payment.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      if (!isPaymentModalOpen) {
        onPaymentModalOpen();
      }
      return;
    }

    setIsFunding(true);

    try {
      logger.info('Making funding request to backend');

      const requestData = {
        amount: parseFloat(fundingAmount),
        email: userDetails.email,
        phoneNumber: phoneToUse,
        userId: userDetails._id,
      };

      logger.info({ requestData }, 'Funding request data');

      const response = await limiter.schedule(() => axios.post(
        `${BASE_URL}/api/wallet/fund`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000,
        }
      ));

      logger.info({ action: 'fund_wallet', response: response.data }, 'Fund wallet response');

      if (!response.data.success) {
        throw new Error(response.data.error || 'Funding request failed');
      }

      if (!response.data.data?.virtualAccount) {
        logger.error({ response: response.data }, 'Invalid funding response - missing virtual account');
        throw new Error('Invalid response from server - missing virtual account details');
      }

      const { virtualAccount, reference, amount } = response.data.data;

      if (!virtualAccount.account_number || !virtualAccount.bank_name || !virtualAccount.account_name) {
        logger.error({ virtualAccount }, 'Invalid virtual account data');
        throw new Error('Invalid virtual account details received');
      }

      setPaymentDetails({
        virtualAccount,
        reference,
        amount,
        instructions: response.data.data.instructions
      });

      setVirtualAccount(virtualAccount);

      localStorage.setItem('pendingPaymentRef', JSON.stringify({
        reference,
        paystackReference: virtualAccount.provider_reference,
        amount,
        timestamp: Date.now()
      }));

      toast({
        title: 'Virtual Account Ready',
        description: `Transfer ₦${amount.toFixed(2)} to the account details shown to complete funding.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onPaymentModalOpen();

      pollPaymentStatus(reference, virtualAccount.provider_reference);
    } catch (error) {
      logger.error(
        {
          action: 'fund_wallet',
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
          stack: error.stack
        },
        'Error initiating funding'
      );

      let errorMessage = 'Unable to initiate funding. Please try again.';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Invalid funding details provided.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        localStorage.removeItem('auth-token');
        window.location.href = '/login';
        return;
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.response?.status === 503) {
        errorMessage = 'Payment service is temporarily unavailable. Please try again later.';
      } else if (error.code === 'ECONNABORTED' || error.code === 'NETWOK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Funding service not found. Please contact support.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later or contact support.';
      } else if (error.message.includes('Invalid response')) {
        errorMessage = error.message;
      } else if (error.message.includes('missing virtual account')) {
        errorMessage = 'Failed to create payment account. Please try again.';
      }

      toast({
        title: 'Funding Error',
        description: errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true,
      });

      localStorage.removeItem('pendingPaymentRef');
    } finally {
      setIsFunding(false);
    }
  };

  const handleWithdraw = async ({ amount, bankCode, accountNumber, accountName }, retries = 2) => {
    try {
      const response = await limiter.schedule(() => axios.post(
        `${BASE_URL}/api/wallet/withdraw`,
        { amount, bankCode, accountNumber, accountName },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth-token")}` },
          timeout: 30000,
        }
      ));
      logger.info({ action: 'withdraw', response: response.data }, 'Withdraw response');
      await fetchWalletBalance();
      return response.data;
    } catch (error) {
      logger.error(
        { action: 'withdraw', error: error.message, status: error.response?.status },
        'Withdrawal error'
      );
      let errorMessage = error.response?.data?.error || 'Unable to process withdrawal. Please try again.';
      if (error.response?.status === 502 && errorMessage.includes('insufficient funds')) {
        errorMessage = 'The platform is temporarily unable to process withdrawals due to payment system limitations. Please try again later or contact support at support@yourplatform.com.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication error. Please log in again.';
        localStorage.removeItem("auth-token");
        window.location.href = "/login";
      }
      toast({
        title: 'Withdrawal Failed',
        description: (
          <Box>
            <Text>{errorMessage}</Text>
            {errorMessage.includes('contact support') && (
              <Button
                size="sm"
                mt={2}
                colorScheme="blue"
                onClick={() => window.location.href = 'mailto:support@yourplatform.com'}
              >
                Contact Support
              </Button>
            )}
          </Box>
        ),
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
      if (retries > 0 && error.response?.status === 408) {
        logger.info({ retries }, `Retrying withdrawal (${retries} retries left)`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return handleWithdraw({ amount, bankCode, accountNumber, accountName }, retries - 1);
      }
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
      transports: ['websocket'],
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
      const syncAge = Date.now() - new Date(data.lastSynced).getTime();
      if (syncAge < 30 * 1000) {
        setWalletBalance((prev) => ({
          ...prev,
          balance: data.balance,
          lastSynced: data.lastSynced,
        }));
        toast({
          title: data.transaction.status === 'completed' ? 'Withdrawal Completed' : data.transaction.status === 'failed' ? 'Withdrawal Failed' : 'Withdrawal Initiated',
          description: `Your wallet balance is now ₦${data.balance.toFixed(2)}. Transaction: ₦${data.transaction.amount.toFixed(2)} (${data.transaction.reference})`,
          status: data.transaction.status === 'completed' ? 'success' : data.transaction.status === 'failed' ? 'error' : 'info',
          duration: 5000,
          isClosable: true,
        });
        if (isPaymentModalOpen) {
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
      } else {
        console.warn('Ignoring stale balance update:', data);
        fetchWalletBalance(); // Trigger a fresh fetch if update is stale
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
                {/* // Fixed Fund Wallet Button Implementation */}
                <Flex mt={4} direction="column" gap={2}>
                  {/* Add funding amount input field */}
                  {/* <FormControl>
                    <FormLabel color={textColor}>Funding Amount (₦)</FormLabel>
                    <Input
                      type="number"
                      placeholder="Enter amount to fund"
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(parseFloat(e.target.value) || 0)}
                      bg={inputBg}
                      border="1px solid"
                      borderColor={useColorModeValue("gray.300", "gray.600")}
                      _hover={{ borderColor: highlightColor }}
                      _focus={{ borderColor: highlightColor, boxShadow: `0 0 0 1px ${highlightColor}` }}
                      color={textColor}
                      min="100" // Minimum funding amount
                      step="100"
                    />
                  </FormControl> */}

                  {/* Add phone number input field if not already present */}
                  {/* <FormControl>
                    <FormLabel color={textColor}>Phone Number</FormLabel>
                    <Input
                      type="tel"
                      placeholder="Enter phone number (e.g., 08012345678)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      bg={inputBg}
                      border="1px solid"
                      borderColor={useColorModeValue("gray.300", "gray.600")}
                      _hover={{ borderColor: highlightColor }}
                      _focus={{ borderColor: highlightColor, boxShadow: `0 0 0 1px ${highlightColor}` }}
                      color={textColor}
                    />
                  </FormControl> */}

                  {/* <Button
                    bgGradient={`linear(to-r, ${gradientStart}, ${gradientEnd})`}
                    color="white"
                    _hover={{ bgGradient: `linear(to-r, blue.500, purple.600)` }}
                    leftIcon={<FaMoneyBillWave />}
                    onClick={handleFundWallet} // Call the actual funding function
                    isLoading={isFunding}
                    loadingText="Processing..."
                    isDisabled={!fundingAmount || fundingAmount <= 0}
                  >
                    Fund Wallet
                  </Button> */}

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