import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import pino from 'pino/browser';
const logger = typeof window !== 'undefined' ? pino({ level: 'info', browser: { asObject: true } }) : console;
import { motion } from 'framer-motion';
import {
  Box, Text, Button, Flex, Heading, Input, Grid, FormControl, FormLabel, Icon, Avatar, Spinner,
  Container, useToast, useDisclosure, NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper, Divider, Select, useColorModeValue,
  Tabs, TabList, Tab, TabPanels, TabPanel, Badge, VStack, Progress, HStack, Card, CardHeader, CardBody,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, SimpleGrid
} from '@chakra-ui/react';
import { FaEdit, FaWallet, FaTimes, FaCreditCard, FaSync, FaMoneyBillWave, FaSave, FaUpload } from 'react-icons/fa';
import io from 'socket.io-client';
import moment from 'moment-timezone';
import axios from '../../utils/axiosConfig';
import { fetchInitialData, fundWallet, checkFundingStatus, fetchPendingWithdrawals, fetchTransactions } from '../../store/slices/walletThunks';
import { setWallet, setPaymentDetails, clearPaymentDetails } from '../../store/slices/walletSlice';
import PaymentInfoModal from './PaymentInfoModal';
import './Profile.css';

const PAYSTACK_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Opay', code: '999992' },
  { name: 'Kuda Bank', code: '090197' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Moniepoint Microfinance Bank', code: '090405' },
  { name: 'Palmpay', code: '999991' },
  { name: 'First Bank', code: '011' },
  { name: 'GTBank', code: '058' },
  { name: 'UBA', code: '033' },
  { name: 'Fidelity Bank', code: '070' },
];

const BASE_URL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

const retryAsync = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let lastError = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = initialDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error({
      message: 'Error in Profile component',
      error: error.message,
      stack: error.stack,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={4} bg="red.100" borderRadius="lg">
          <Text color="red.800">Something went wrong: {this.state.error.message}</Text>
          <Button mt={2} bg="#B38939" _hover={{ bg: "#BB954D" }} color="white" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

const FundAmountModal = ({ isOpen, onClose, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const bgColor = useColorModeValue('white', '#1A202C');
  const textColor = useColorModeValue('#051E2F', 'white');
  const borderColor = useColorModeValue('gray.200', '#051E2F');

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 100) {
      toast({
        title: 'Error',
        description: 'Please enter an amount of at least ₦100.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await retryAsync(() => onSubmit(amountNum));
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate funding. Please check your network and try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: 'full', sm: 'md' }}>
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius="xl" border="1px" borderColor={borderColor}>
        <ModalHeader color={textColor} fontWeight="bold">Enter Funding Amount</ModalHeader>
        <ModalCloseButton color={textColor} />
        <ModalBody px={{ base: 4, sm: 6 }} py={4}>
          <FormControl>
            <FormLabel color={textColor}>Amount (₦)</FormLabel>
            <NumberInput min={100} precision={2} value={amount} onChange={(value) => setAmount(value)}>
              <NumberInputField placeholder="Enter amount (minimum ₦100)" bg={useColorModeValue('gray.50', '#051E2F')} borderColor={borderColor} color={textColor} />
              <NumberInputStepper>
                <NumberIncrementStepper color={textColor} />
                <NumberDecrementStepper color={textColor} />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </ModalBody>
        <ModalFooter flexDir={{ base: 'column', sm: 'row' }} gap={2}>
          <Button
            bg="#B38939"
            _hover={{ bg: "#BB954D" }}
            color="white"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
            size={{ base: 'sm', sm: 'md' }}
            mr={{ sm: 3 }}
            mb={{ base: 2, sm: 0 }}
          >
            Proceed to Fund
          </Button>
          <Button variant="ghost" color={textColor} _hover={{ bg: useColorModeValue('gray.100', '#051E2F') }} onClick={onClose} size={{ base: 'sm', sm: 'md' }}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const WithdrawalModal = ({ isOpen, onClose, walletBalance }) => {
  const [amount, setAmount] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [accountName, setAccountName] = React.useState('');
  const [bankCode, setBankCode] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = React.useState([]);
  const [amountError, setAmountError] = React.useState('');
  const toast = useToast();
  const dispatch = useDispatch();
  const bgColor = useColorModeValue('white', '#1A202C');
  const textColor = useColorModeValue('#051E2F', 'white');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
  const cardBg = useColorModeValue('gray.50', '#051E2F');
  const borderColor = useColorModeValue('gray.200', '#051E2F');

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        const response = await dispatch(fetchPendingWithdrawals()).unwrap();
        setPendingWithdrawals(response.data?.data?.pendingWithdrawals || []);
      } catch (error) {
        setPendingWithdrawals([]);
        if (error.status !== 404) {
          toast({
            title: 'Error',
            description: error.message || 'Failed to fetch pending withdrawals.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    };
    if (isOpen) {
      fetchWithdrawals();
    }
  }, [isOpen, dispatch, toast]);

  useEffect(() => {
    const amountNum = parseFloat(amount);
    if (amount && (isNaN(amountNum) || amountNum < 100)) {
      setAmountError('Minimum withdrawal is ₦100.');
    } else if (amountNum > walletBalance) {
      setAmountError(`Insufficient balance. Available: ₦${walletBalance.toFixed(2)}`);
    } else {
      setAmountError('');
    }
  }, [amount, walletBalance]);

  const formatTimeRemaining = (expectedPayoutDate) => {
    const now = moment.tz('Africa/Lagos');
    const payoutDate = moment.tz(expectedPayoutDate, 'Africa/Lagos');
    const timeRemaining = payoutDate.diff(now);
    if (timeRemaining <= 0) return 'Expired';
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${hours}h ${minutes}m`;
  };

  const handleWithdraw = async () => {
    if (amountError) {
      toast({
        title: 'Error',
        description: amountError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!accountNumber || !/^\d{10}$/.test(accountNumber)) {
      toast({
        title: 'Error',
        description: 'Please provide a valid 10-digit account number.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!accountName) {
      toast({
        title: 'Error',
        description: 'Please provide an account name.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!bankCode) {
      toast({
        title: 'Error',
        description: 'Please select a bank.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/withdraw`,
        { amount: amountNum, accountNumber, accountName, bankCode },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` } }
      );
      if (response.data.success) {
        toast({
          title: 'Success',
          description: response.data.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setAmount('');
        setAccountNumber('');
        setAccountName('');
        setBankCode('');
        const updatedWithdrawals = await dispatch(fetchPendingWithdrawals()).unwrap();
        setPendingWithdrawals(updatedWithdrawals.data?.pendingWithdrawals || []);
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Withdrawal request failed. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: 'full', sm: 'lg' }}>
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius="xl" border="1px" borderColor={borderColor}>
        <ModalHeader color={textColor} fontWeight="bold">Withdraw Funds</ModalHeader>
        <ModalCloseButton color={textColor} />
        <ModalBody px={{ base: 4, sm: 6 }} py={4}>
          <FormControl mb={4} isInvalid={!!amountError}>
            <FormLabel color={textColor}>Amount (₦)</FormLabel>
            <NumberInput
              min={100}
              max={walletBalance}
              precision={2}
              value={amount}
              onChange={(value) => setAmount(value)}
            >
              <NumberInputField placeholder={`Enter amount (max ₦${walletBalance.toFixed(2)})`} bg={cardBg} borderColor={borderColor} color={textColor} />
              <NumberInputStepper>
                <NumberIncrementStepper color={textColor} />
                <NumberDecrementStepper color={textColor} />
              </NumberInputStepper>
            </NumberInput>
            {amountError && <Text color="red.500" fontSize="sm" mt={1}>{amountError}</Text>}
          </FormControl>
          <FormControl mb={4}>
            <FormLabel color={textColor}>Account Number</FormLabel>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter 10-digit account number"
              maxLength={10}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              bg={cardBg}
              borderColor={borderColor}
              color={textColor}
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel color={textColor}>Account Name</FormLabel>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Enter account name"
              bg={cardBg}
              borderColor={borderColor}
              color={textColor}
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel color={textColor}>Bank Name</FormLabel>
            <Select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              placeholder="Select bank"
              bg={cardBg}
              borderColor={borderColor}
              color={textColor}
            >
              {PAYSTACK_BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>{bank.name}</option>
              ))}
            </Select>
          </FormControl>
          {pendingWithdrawals.length > 0 && (
            <Box mt={4}>
              <Text fontWeight="bold" color={textColor} mb={2}>Pending Withdrawals</Text>
              {pendingWithdrawals.map((withdrawal) => (
                <Card key={withdrawal.reference} bg={cardBg} p={3} borderRadius="lg" mb={2} border="1px" borderColor={borderColor}>
                  <Text color={textColor}>Amount: ₦{withdrawal.amount.toFixed(2)}</Text>
                  <Text color={subtleTextColor}>Account: ****{withdrawal.accountNumber}</Text>
                  <Text color={subtleTextColor}>Name: {withdrawal.accountName}</Text>
                  <Text color={subtleTextColor}>Bank: {withdrawal.bankName || 'N/A'}</Text>
                  <Text color={subtleTextColor}>
                    Time Remaining: {formatTimeRemaining(withdrawal.expectedPayoutDate)}
                  </Text>
                </Card>
              ))}
            </Box>
          )}
        </ModalBody>
        <ModalFooter flexDir={{ base: 'column', sm: 'row' }} gap={2}>
          <Button
            bg="#B38939"
            _hover={{ bg: "#BB954D" }}
            color="white"
            onClick={handleWithdraw}
            isLoading={isSubmitting}
            loadingText="Processing..."
            isDisabled={!!amountError || !accountNumber || !/^\d{10}$/.test(accountNumber) || !accountName || !bankCode || isSubmitting}
            size={{ base: 'sm', sm: 'md' }}
            mr={{ sm: 3 }}
            mb={{ base: 2, sm: 0 }}
          >
            Submit Withdrawal
          </Button>
          <Button variant="ghost" color={textColor} _hover={{ bg: useColorModeValue('gray.100', '#051E2F') }} onClick={onClose} size={{ base: 'sm', sm: 'md' }}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isFundOpen, onOpen: onFundOpen, onClose: onFundClose } = useDisclosure();
  const { isOpen: isWithdrawOpen, onOpen: onWithdrawOpen, onClose: onWithdrawClose } = useDisclosure();
  const { isOpen: isAmountOpen, onOpen: onAmountOpen, onClose: onAmountClose } = useDisclosure();
  const { user, wallet, paymentDetails, loading, error } = useSelector((state) => state.wallet);
  const transactions = wallet?.transactions || [];
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [fundingAmount, setFundingAmount] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarRetryCount, setAvatarRetryCount] = useState(0);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);
  const bgColor = useColorModeValue('gray.100', '#1A202C');
  const cardBg = useColorModeValue('white', '#051E2F');
  const textColor = useColorModeValue('#051E2F', 'white');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', '#051E2F');
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [allPage, setAllPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [failedPage, setFailedPage] = useState(1);
  const itemsPerPage = 5;
  const hasShownAvatarToast = useRef(false);
  const editPanelBg = useColorModeValue('gray.50', '#2D3748');
  const inputFieldBg = useColorModeValue('white', '#2D3748');

  // Sidebar state (likely used in a parent component or layout)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768;
      const savedSidebarState = localStorage.getItem("sidebarCollapsed");
      return isMobile ? true : savedSidebarState ? JSON.parse(savedSidebarState) : false;
    }
    return false;
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsSidebarCollapsed((prev) => {
        const savedSidebarState = localStorage.getItem("sidebarCollapsed");
        return mobile ? true : savedSidebarState ? JSON.parse(savedSidebarState) : prev;
      });
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const FALLBACK_AVATAR = `${BASE_URL}/uploads/default-avatar.png`;

  // Memoize sorted transactions to optimize performance
  const sortedTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return [...transactions].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [transactions]);

  useEffect(() => {
    setIsAvatarLoading(true);
    setAvatarError(false);
    setAvatarRetryCount(0);

    if (avatarFile) {
      const previewUrl = URL.createObjectURL(avatarFile);
      setAvatarPreview(previewUrl);
      setIsAvatarLoading(false);
      return () => URL.revokeObjectURL(previewUrl); // Cleanup to prevent memory leaks
    } else if (user?.avatarImage) {
      const avatarUrl = user.avatarImage.startsWith('https://')
        ? `${user.avatarImage}?t=${Date.now()}`
        : `${BASE_URL}${user.avatarImage}?t=${Date.now()}`;
      logger.info('Attempting to load avatar:', { url: avatarUrl });
      setAvatarPreview(avatarUrl);
      setIsAvatarLoading(false);
    } else {
      setAvatarPreview(FALLBACK_AVATAR);
      setIsAvatarLoading(false);
      if (!hasShownAvatarToast.current && !localStorage.getItem('hasShownAvatarToast')) {
        toast({
          title: 'Complete Your Profile',
          description: 'Upload a profile picture to personalize your account!',
          status: 'info',
          duration: 5000,
          isClosable: true,
          action: {
            label: 'Upload Now',
            onClick: () => setIsEditing(true),
          },
        });
        hasShownAvatarToast.current = true;
        localStorage.setItem('hasShownAvatarToast', 'true');
      }
    }
  }, [user?.avatarImage, avatarFile, toast, setIsEditing]);

  const handleAvatarLoad = () => {
    logger.info('Avatar loaded successfully');
    setAvatarError(false);
    setAvatarRetryCount(0);
  };

  const handleAvatarError = () => {
    if (user?.avatarImage) {
      logger.error('Failed to load avatar');
      setAvatarPreview(FALLBACK_AVATAR);
      setAvatarError(true);
      setAvatarRetryCount(0);
    }
  };

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access-token');
    if (!token) {
      logger.warn('No token found for WebSocket connection');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        logger.warn('Token expired for WebSocket connection');
        return;
      }
      const socketInstance = io(BASE_URL.replace(/^http/, 'ws'), {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        logger.info('WebSocket connected', { socketId: socketInstance.id });
      });

      socketInstance.on('balanceUpdate', async (data) => {
        if (data.status === 'completed') {
          toast({
            title: 'Success',
            description: data.message || `Successfully funded ₦${data.amount.toFixed(2)}. Your wallet has been updated.`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          localStorage.removeItem(`pendingFunding_${data.reference}`);
          dispatch(clearPaymentDetails());
          await dispatch(fetchInitialData({ noCache: Date.now() })).unwrap();
          setAllPage(1);
          setPendingPage(1);
          setCompletedPage(1);
          setFailedPage(1);
        } else if (data.withdrawalRequest) {
          toast({
            title: 'Withdrawal Request',
            description: `Withdrawal request of ₦${data.withdrawalRequest.amount.toFixed(2)} submitted.`,
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
          await dispatch(fetchPendingWithdrawals()).unwrap();
          await dispatch(fetchInitialData({ noCache: Date.now() })).unwrap();
        }
      });

      socketInstance.on('connect_error', (error) => {
        logger.error('WebSocket connection error', { message: error.message });
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
        logger.info('WebSocket disconnected');
      };
    } catch (error) {
      logger.error('WebSocket token validation error', { message: error.message });
    }
  }, [dispatch, toast]);

  useEffect(() => {
    const checkPendingTransactions = async () => {
      const pendingKeys = Object.keys(localStorage).filter(key => key.startsWith('pendingFunding_'));
      for (const key of pendingKeys) {
        const ref = key.replace('pendingFunding_', '');
        try {
          const response = await retryAsync(() => dispatch(checkFundingStatus(ref)).unwrap());
          if (response.success && response.data.transaction?.status === 'completed') {
            toast({
              title: 'Success',
              description: `Successfully funded ₦${response.data.transaction.amount.toFixed(2)}. Your wallet has been updated.`,
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
            localStorage.removeItem(key);
            dispatch(clearPaymentDetails());
            await retryAsync(() => dispatch(fetchInitialData()).unwrap());
          }
        } catch (error) {
          logger.error('Failed to check pending transaction', {
            reference: ref,
            message: error.message,
          });
        }
      }
    };
    checkPendingTransactions();
  }, [dispatch, toast]);

  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem('access-token');
      if (!token) {
        setAuthError('No authentication token found. Please log in again.');
        setIsAuthLoading(false);
        navigate('/login');
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();
        if (isExpired) {
          logger.warn('Access token expired', { userId: decoded.id });
          localStorage.removeItem('access-token');
          localStorage.removeItem('refresh-token');
          setAuthError('Your session has expired. Please log in again.');
          setIsAuthLoading(false);
          navigate('/login');
          return;
        }

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const [initialDataResult, transactionsResult] = await Promise.allSettled([
          dispatch(fetchInitialData()).unwrap(),
          dispatch(fetchTransactions()).unwrap(),
        ]);

        if (initialDataResult.status === 'rejected') {
          logger.error('Initial data fetch failed', { error: initialDataResult.reason });
          throw initialDataResult.reason;
        }

        if (transactionsResult.status === 'rejected') {
          logger.warn('Transactions fetch failed, continuing with initial data', { error: transactionsResult.reason });
        }

        setIsAuthLoading(false);
      } catch (err) {
        logger.error('Authentication error', {
          message: err.message,
          status: err.status,
          data: err,
        });
        let errorMessage = err.error || 'Authentication failed. Please log in again.';
        if (err.status === 401) {
          localStorage.removeItem('access-token');
          localStorage.removeItem('refresh-token');
          navigate('/login');
        } else if (err.status === 404) {
          errorMessage = 'User account not found. Please contact support.';
        } else if (err.status === 503) {
          errorMessage = 'Database unavailable. Please try again later.';
        }
        setAuthError(errorMessage);
        setIsAuthLoading(false);
        toast({
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    initialize();
  }, [dispatch, navigate, toast]);

  useEffect(() => {
    if (user && !formData.firstName) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  useEffect(() => {
    setAllPage(1);
    setPendingPage(1);
    setCompletedPage(1);
    setFailedPage(1);
  }, [transactions.length]);

  const handleCheckFundingReadiness = async () => {
    if (isSubmitting) {
      toast({
        title: 'Please Wait',
        description: 'A funding request is already in progress. Please wait.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('access-token');
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'No authentication token found. Please log in again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          action: {
            label: 'Log In',
            onClick: () => navigate('/login'),
          },
        });
        return;
      }

      const response = await retryAsync(() =>
        axios.post(
          `${BASE_URL}/api/wallet/check-funding-readiness`,
          {},
          { headers: { Authorization: `Bearer ${token}` }, params: { noCache: Date.now() } }
        )
      );

      if (response.data.success) {
        onAmountOpen();
      } else {
        toast({
          title: 'Funding Unavailable',
          description: response.data.error || 'Funding is not available at the moment.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          action: {
            label: 'Retry',
            onClick: () => handleCheckFundingReadiness(),
          },
        });
      }
    } catch (error) {
      const status = error.response?.status;
      let errorMessage = 'Failed to check funding readiness. Please check your network and try again.';
      let action = { label: 'Retry', onClick: () => handleCheckFundingReadiness() };

      if (status === 404) {
        errorMessage = 'User account not found. Please log in again or contact support.';
        action = { label: 'Log In', onClick: () => navigate('/login') };
      } else if (status === 401) {
        errorMessage = 'Session expired or invalid. Please log in again.';
        action = { label: 'Log In', onClick: () => navigate('/login') };
      } else if (status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
        action = { label: 'Retry', onClick: () => handleCheckFundingReadiness() };
      }

      toast({
        title: 'Funding Unavailable',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        action,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFundWallet = async (amount) => {
    if (isSubmitting || loading) {
      toast({
        title: 'Please Wait',
        description: 'A funding request is already in progress. Please wait.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await retryAsync(() =>
        dispatch(fundWallet({
          amount,
          email: user.email,
          phoneNumber: user.phoneNumber,
          userId: user._id,
        })).unwrap()
      );
      if (response.success) {
        setFundingAmount(amount);
        dispatch(setPaymentDetails({ ...response.data, amount }));
        localStorage.setItem(`pendingFunding_${response.data.reference}`, JSON.stringify({ amount }));
        if (response.data.pendingTransactions?.length > 0) {
          toast({
            title: 'Pending Transactions',
            description: `You have ${response.data.pendingTransactions.length} pending transaction(s). Check the Transactions tab.`,
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        }
        if (response.data.authorization_url) {
          window.location.href = response.data.authorization_url;
        } else {
          onFundOpen();
        }
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to initiate funding.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      let errorMessage = error.message || 'Failed to initiate funding. Please check your network and try again.';
      if (error.response?.status === 502 && error.message.includes('Payment provider authentication failed')) {
        errorMessage = 'Payment provider configuration issue. Please contact support.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        navigate('/login');
      }
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    const ref = paymentDetails?.reference || paymentDetails?.paystackReference;
    if (!ref) {
      toast({ title: 'Error', description: 'No reference available.', status: 'error', duration: 5000, isClosable: true });
      return;
    }
    try {
      const response = await retryAsync(() => dispatch(checkFundingStatus(ref)).unwrap());
      if (response.success && response.data.transaction?.status === 'completed') {
        toast({
          title: 'Success',
          description: `Successfully funded ₦${response.data.transaction.amount.toFixed(2)}. Your wallet has been updated.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        localStorage.removeItem(`pendingFunding_${ref}`);
        dispatch(clearPaymentDetails());
        setFundingAmount(null);
        onFundClose();
        await retryAsync(() => dispatch(fetchInitialData()).unwrap());
      } else {
        toast({
          title: response.data.transaction?.status === 'failed' ? 'Failed' : 'Pending',
          description: response.message || 'Transaction is still processing. Please check again later.',
          status: response.data.transaction?.status === 'failed' ? 'error' : 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check funding status. Please check your network and try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image/(jpeg|png)')) {
        toast({
          title: 'Error',
          description: 'Please upload a valid image file (JPEG or PNG).',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Image size must be less than 5MB.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setAvatarError(false);
      setAvatarRetryCount(0);
      setIsAvatarLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSubmitting(true);
    setIsAvatarUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      if (avatarFile) {
        formDataToSend.append('avatarImage', avatarFile);
      }

      const token = localStorage.getItem('access-token');
      const response = await retryAsync(() =>
        axios.put(`${BASE_URL}/api/users/update-user-details`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        })
      );

      if (response.data.success) {
        toast({
          title: 'Success',
          description: 'Profile updated successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        setIsEditing(false);
        setAvatarFile(null);
        setIsAvatarUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        setAvatarError(false);
        setAvatarRetryCount(0);

        const result = await dispatch(fetchInitialData()).unwrap();

        if (result.user?.avatarImage) {
          const newAvatarUrl = result.user.avatarImage.startsWith('https://')
            ? result.user.avatarImage
            : `${BASE_URL}${result.user.avatarImage}`;
          setAvatarPreview(`${newAvatarUrl}?t=${Date.now()}`);
          setIsAvatarLoading(false);
        } else {
          setAvatarPreview(FALLBACK_AVATAR);
          setIsAvatarLoading(false);
        }
      } else {
        toast({
          title: 'Error',
          description: response.data.error || 'Failed to update profile.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsAvatarUploading(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update profile. Please check your network and try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsAvatarUploading(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      if (window.caches) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        } catch (cacheError) {
          logger.warn('Failed to clear browser cache', { message: cacheError.message });
        }
      }

      const result = await retryAsync(() => dispatch(fetchInitialData()).unwrap());
      toast({
        title: 'Success',
        description: `Wallet balance refreshed. New balance: ₦${(result.wallet?.balance || 0).toFixed(2)}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      if (result.user?.avatarImage) {
        const avatarUrl = `${BASE_URL}${result.user.avatarImage}?t=${Date.now()}`;
        setAvatarPreview(avatarUrl);
        setIsAvatarLoading(false);
        setAvatarError(false);
        setAvatarRetryCount(0);
      } else {
        setAvatarPreview(FALLBACK_AVATAR);
        setIsAvatarLoading(false);
      }
      setAllPage(1);
      setPendingPage(1);
      setCompletedPage(1);
      setFailedPage(1);
    } catch (error) {
      logger.error('Refresh wallet balance error', {
        message: error.message,
        status: error.status,
        data: error,
      });
      let errorMessage = error.error || 'Failed to refresh wallet balance. Please try again.';
      let action = null;
      if (error.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        action = { label: 'Log In', onClick: () => navigate('/login') };
        localStorage.removeItem('access-token');
        localStorage.removeItem('refresh-token');
      } else if (error.status === 404) {
        errorMessage = 'User account not found. Please contact support.';
      } else if (error.status === 503) {
        errorMessage = 'Database unavailable. Please try again later.';
      }
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
        action,
      });
      try {
        const txResult = await dispatch(fetchTransactions()).unwrap();
        toast({
          title: 'Partial Success',
          description: 'Wallet balance refresh failed, but transactions were updated.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      } catch (txError) {
        logger.error('Fallback fetchTransactions failed', {
          message: txError.message,
          status: txError.status,
        });
      }
    }
  };

  const handleRetryAuth = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    await handleRefresh();
    setIsAuthLoading(false);
  };

  const renderTransaction = (tx) => (
    <Card
      key={tx.reference || tx._id || Math.random()}
      bg={cardBg}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
      transition="all 0.3s"
      p={4}
    >
      <Flex justify="space-between" align="flex-start" w="100%">
        <VStack align="start" spacing={2} flex="1">
          <Flex align="center" wrap="wrap" gap={2}>
            <Text fontWeight="bold" color={textColor} fontSize="md">
              {tx.type ? (tx.type.charAt(0).toUpperCase() + tx.type.slice(1)) : 'Transaction'}
            </Text>
            <Badge
              colorScheme={
                tx.status === 'completed' || tx.status === 'success' ? 'green' :
                  tx.status === 'pending' ? 'yellow' : 'red'
              }
              fontSize="xs"
            >
              {tx.status ? (tx.status.charAt(0).toUpperCase() + tx.status.slice(1)) : 'Unknown'}
            </Badge>
          </Flex>
          <Text fontSize="lg" fontWeight="semibold" color={textColor}>
            ₦{(tx.amount || 0).toFixed(2)}
          </Text>
          {tx.reference && (
            <Text fontSize="xs" color={subtleTextColor} fontFamily="mono">
              Ref: {tx.reference}
            </Text>
          )}
        </VStack>
        <VStack align="end" spacing={1}>
          <Text fontSize="xs" color={subtleTextColor}>
            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}
          </Text>
          <Text fontSize="xs" color={subtleTextColor}>
            {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString() : ''}
          </Text>
        </VStack>
      </Flex>
    </Card>
  );

  const PaginationControls = ({ currentPage, setCurrentPage, totalItems }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <Flex justify="center" align="center" mt={6} gap={2} wrap="wrap">
        <Button
          size="sm"
          bg={currentPage === 1 ? "gray.300" : "#B38939"}
          _hover={{ bg: currentPage === 1 ? "gray.300" : "#BB954D" }}
          color={currentPage === 1 ? "gray.500" : "white"}
          onClick={() => setCurrentPage(1)}
          isDisabled={currentPage === 1}
          cursor={currentPage === 1 ? "not-allowed" : "pointer"}
        >
          First
        </Button>
        <Button
          size="sm"
          bg={currentPage === 1 ? "gray.300" : "#B38939"}
          _hover={{ bg: currentPage === 1 ? "gray.300" : "#BB954D" }}
          color={currentPage === 1 ? "gray.500" : "white"}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          isDisabled={currentPage === 1}
          cursor={currentPage === 1 ? "not-allowed" : "pointer"}
        >
          Previous
        </Button>
        {startPage > 1 && (
          <>
            <Button
              size="sm"
              bg={cardBg}
              color={textColor}
              _hover={{ bg: "#BB954D", color: "white" }}
              onClick={() => setCurrentPage(1)}
            >
              1
            </Button>
            {startPage > 2 && <Text color={textColor}>...</Text>}
          </>
        )}
        {pageNumbers.map((page) => (
          <Button
            key={page}
            size="sm"
            bg={currentPage === page ? "#B38939" : cardBg}
            color={currentPage === page ? "white" : textColor}
            _hover={{ bg: "#BB954D", color: "white" }}
            onClick={() => setCurrentPage(page)}
            fontWeight={currentPage === page ? "bold" : "normal"}
          >
            {page}
          </Button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <Text color={textColor}>...</Text>}
            <Button
              size="sm"
              bg={cardBg}
              color={textColor}
              _hover={{ bg: "#BB954D", color: "white" }}
              onClick={() => setCurrentPage(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}
        <Button
          size="sm"
          bg={currentPage === totalPages ? "gray.300" : "#B38939"}
          _hover={{ bg: currentPage === totalPages ? "gray.300" : "#BB954D" }}
          color={currentPage === totalPages ? "gray.500" : "white"}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          isDisabled={currentPage === totalPages}
          cursor={currentPage === totalPages ? "not-allowed" : "pointer"}
        >
          Next
        </Button>
        <Button
          size="sm"
          bg={currentPage === totalPages ? "gray.300" : "#B38939"}
          _hover={{ bg: currentPage === totalPages ? "gray.300" : "#BB954D" }}
          color={currentPage === totalPages ? "gray.500" : "white"}
          onClick={() => setCurrentPage(totalPages)}
          isDisabled={currentPage === totalPages}
          cursor={currentPage === totalPages ? "not-allowed" : "pointer"}
        >
          Last
        </Button>
        <Text color={subtleTextColor} fontSize="sm" ml={4}>
          Page {currentPage} of {totalPages} ({totalItems} total)
        </Text>
      </Flex>
    );
  };

  if (isAuthLoading) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg={bgColor}>
        <Spinner size="xl" color="#B38939" />
      </Flex>
    );
  }

  if (authError) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg={bgColor} flexDir="column">
        <Text color={textColor} fontSize="xl" mb={4}>{authError}</Text>
        <Button
          bg="#B38939"
          _hover={{ bg: "#BB954D" }}
          color="white"
          onClick={handleRetryAuth}
          isLoading={isAuthLoading}
          mb={2}
        >
          Retry
        </Button>
        <Button
          bg="red.500"
          _hover={{ bg: "red.600" }}
          color="white"
          onClick={() => {
            localStorage.removeItem('access-token');
            navigate('/login');
          }}
        >
          Log In Again
        </Button>
      </Flex>
    );
  }

  if (!user) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg={bgColor} flexDir="column">
        <Text color={textColor} fontSize="xl" mb={4}>Unable to load profile data. Please try again.</Text>
        <Button
          bg="#B38939"
          _hover={{ bg: "#BB954D" }}
          color="white"
          onClick={handleRetryAuth}
          isLoading={loading}
        >
          Retry
        </Button>
      </Flex>
    );
  }

  return (
    <ErrorBoundary>
      <Box minH="100vh" bg={bgColor} py={12}>
        <Container maxW="container.xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
              <VStack spacing={8} align="stretch" gridColumn={{ lg: 'span 1' }}>
                <Card bg={cardBg} borderRadius="xl" className="wallet-profile-card" border="1px" borderColor={borderColor} boxShadow="lg">
                  <CardHeader>
                    <Flex align="center" justify="center" flexDir="column">
                      {isAvatarLoading || isAvatarUploading ? (
                        <Flex align="center" justify="center" h="120px" w="120px" mb={4}>
                          <Spinner color="#B38939" size="lg" />
                        </Flex>
                      ) : (
                        <Avatar
                          size="2xl"
                          src={avatarPreview || FALLBACK_AVATAR}
                          onLoad={handleAvatarLoad}
                          onError={handleAvatarError}
                          mb={4}
                          border="2px"
                          borderColor="#B38939"
                          key={avatarPreview}
                        />
                      )}
                      <Heading size="lg" color={textColor} textAlign="center">
                        {user.firstName} {user.lastName}
                      </Heading>
                      <Text color={subtleTextColor} fontSize="sm" mt={2} textAlign="center">
                        {user.email}
                      </Text>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    {isEditing ? (
                      <VStack spacing={6} align="stretch" p={4} bg={editPanelBg} borderRadius="lg" boxShadow="md" border="1px" borderColor={borderColor}>
                        <Text fontSize="lg" fontWeight="semibold" color={textColor} textAlign="center">
                          Edit Your Profile
                        </Text>
                        <FormControl>
                          <FormLabel color={textColor} fontWeight="medium">First Name</FormLabel>
                          <Input
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="Enter first name"
                            bg={inputFieldBg}
                            borderColor={borderColor}
                            color={textColor}
                            borderRadius="md"
                            _focus={{ borderColor: '#B38939', boxShadow: '0 0 0 1px #B38939' }}
                            _hover={{ borderColor: '#BB954D' }}
                            transition="all 0.3s"
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel color={textColor} fontWeight="medium">Last Name</FormLabel>
                          <Input
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="Enter last name"
                            bg={inputFieldBg}
                            borderColor={borderColor}
                            color={textColor}
                            borderRadius="md"
                            _focus={{ borderColor: '#B38939', boxShadow: '0 0 0 1px #B38939' }}
                            _hover={{ borderColor: '#BB954D' }}
                            transition="all 0.3s"
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel color={textColor} fontWeight="medium">Phone Number</FormLabel>
                          <Input
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            placeholder="Enter phone number"
                            type="tel"
                            bg={inputFieldBg}
                            borderColor={borderColor}
                            color={textColor}
                            borderRadius="md"
                            _focus={{ borderColor: '#B38939', boxShadow: '0 0 0 1px #B38939' }}
                            _hover={{ borderColor: '#BB954D' }}
                            transition="all 0.3s"
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel color={textColor} fontWeight="medium">Profile Picture</FormLabel>
                          <Box position="relative" bg={inputFieldBg} borderRadius="md" border="1px" borderColor={borderColor} p={3} _hover={{ borderColor: '#BB954D', boxShadow: '0 0 0 1px #BB954D' }} transition="all 0.3s">
                            <Input
                              type="file"
                              accept="image/jpeg,image/png"
                              ref={fileInputRef}
                              onChange={handleAvatarChange}
                              display="none"
                            />
                            <Button
                              leftIcon={<FaUpload />}
                              bg="#B38939"
                              _hover={{ bg: "#BB954D" }}
                              color="white"
                              onClick={() => fileInputRef.current.click()}
                              size="md"
                              width="full"
                              borderRadius="md"
                              fontWeight="medium"
                              _focus={{ boxShadow: '0 0 0 3px rgba(179, 137, 57, 0.3)' }}
                              transition="all 0.3s"
                            >
                              Choose Profile Picture
                            </Button>
                            {avatarFile && (
                              <VStack spacing={3} mt={4} align="center">
                                <Avatar
                                  size="lg"
                                  src={avatarPreview}
                                  border="2px"
                                  borderColor="#B38939"
                                  boxShadow="md"
                                />
                                <Text fontSize="sm" color={subtleTextColor} textAlign="center">
                                  Preview: {avatarFile.name}
                                </Text>
                              </VStack>
                            )}
                          </Box>
                        </FormControl>
                        <HStack
                          spacing={{ base: 2, sm: 4 }}
                          justify="center"
                          mt={6}
                          wrap="wrap"
                          gap={{ base: 2, sm: 3 }}
                        >
                          <Button
                            leftIcon={<FaSave />}
                            bg="#B38939"
                            _hover={{ bg: "#BB954D", transform: "scale(1.05)" }}
                            _active={{ transform: "scale(0.95)" }}
                            color="white"
                            onClick={handleUpdateProfile}
                            isLoading={isSubmitting}
                            loadingText="Saving..."
                            size={{ base: "sm", sm: "md" }}
                            borderRadius="md"
                            px={{ base: 4, sm: 6 }}
                            py={{ base: 2, sm: 3 }}
                            fontWeight="semibold"
                            _focus={{ boxShadow: "0 0 0 3px rgba(179, 137, 57, 0.3)" }}
                            transition="all 0.2s ease-in-out"
                            width={{ base: "100%", sm: "auto" }}
                            minW={{ sm: "120px" }}
                          >
                            Save Changes
                          </Button>
                          <Button
                            leftIcon={<FaTimes />}
                            variant="outline"
                            borderColor="#B38939"
                            color="#B38939"
                            _hover={{ bg: "#BB954D", color: "white", transform: "scale(1.05)" }}
                            _active={{ transform: "scale(0.95)" }}
                            onClick={() => {
                              setIsEditing(false);
                              setAvatarFile(null);
                              if (user?.avatarImage) {
                                setAvatarPreview(`${BASE_URL}${user.avatarImage}?t=${Date.now()}`);
                              } else {
                                setAvatarPreview(FALLBACK_AVATAR);
                              }
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            isLoading={isSubmitting}
                            loadingText="Cancelling..."
                            size={{ base: "sm", sm: "md" }}
                            borderRadius="md"
                            px={{ base: 4, sm: 6 }}
                            py={{ base: 2, sm: 3 }}
                            fontWeight="semibold"
                            _focus={{ boxShadow: "0 0 0 3px rgba(179, 137, 57, 0.3)" }}
                            transition="all 0.2s ease-in-out"
                            width={{ base: "100%", sm: "auto" }}
                            minW={{ sm: "120px" }}
                          >
                            Cancel
                          </Button>
                        </HStack>
                      </VStack>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        <Text color={subtleTextColor}>Phone: {user.phoneNumber || 'Not set'}</Text>
                        <Button
                          leftIcon={<FaEdit />}
                          bg="#B38939"
                          _hover={{ bg: "#BB954D" }}
                          color="white"
                          onClick={() => setIsEditing(true)}
                          size="md"
                        >
                          Edit Profile
                        </Button>
                      </VStack>
                    )}
                  </CardBody>
                </Card>
              </VStack>
              <VStack spacing={8} align="stretch" gridColumn={{ lg: 'span 2' }}>
                <Card bg={cardBg} borderRadius="xl" className="Wallet-Overview-card" border="1px" borderColor={borderColor} boxShadow="lg">
                  <CardHeader>
                    <Flex align="center">
                      <Icon as={FaWallet} color="#B38939" boxSize={6} mr={3} />
                      <Heading size="md" color={textColor}>
                        Wallet Overview
                      </Heading>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Text color={textColor} fontSize="3xl" fontWeight="bold" key={`balance-${wallet?.balance}-${Date.now()}`}>
                      ₦{(wallet?.balance || 0).toFixed(2)}
                    </Text>
                    {error && (
                      <Text color="red.500" fontSize="sm" mt={2}>
                        {error} Click "Refresh" to sync.
                      </Text>
                    )}
                    <Text color={subtleTextColor} fontSize="sm" mt={2}>
                      Click "Refresh" to update your balance after funding.
                    </Text>
                    <HStack spacing={4} mt={6} flexWrap="wrap" justify="start">
                      <Button
                        leftIcon={<FaCreditCard />}
                        bg="#B38939"
                        _hover={{ bg: "#BB954D" }}
                        color="white"
                        onClick={handleCheckFundingReadiness}
                        isLoading={isSubmitting || loading}
                        isDisabled={isSubmitting || loading}
                        size="md"
                      >
                        Fund Wallet
                      </Button>
                      <Button
                        leftIcon={<FaMoneyBillWave />}
                        bg="#B38939"
                        _hover={{ bg: "#BB954D" }}
                        color="white"
                        onClick={onWithdrawOpen}
                        isDisabled={(wallet?.balance || 0) <= 0}
                        size="md"
                      >
                        Withdraw
                      </Button>
                      <Button
                        leftIcon={<FaSync />}
                        bg="#B38939"
                        _hover={{ bg: "#BB954D" }}
                        color="white"
                        onClick={handleRefresh}
                        isLoading={loading}
                        size="md"
                      >
                        Refresh
                      </Button>
                    </HStack>
                  </CardBody>
                </Card>
                <Card bg={cardBg} borderRadius="xl" border="1px" borderColor={borderColor} boxShadow="lg" className="transaction-history-card">
                  <CardBody>
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading size="md" color={textColor}>
                        Transaction History
                      </Heading>
                      <Button
                        leftIcon={<FaSync />}
                        bg="#B38939"
                        _hover={{ bg: "#BB954D" }}
                        color="white"
                        onClick={async () => {
                          try {
                            const result = await dispatch(fetchTransactions()).unwrap();
                            toast({
                              title: 'Success',
                              description: 'Wallet data refreshed successfully.',
                              status: 'success',
                              duration: 5000,
                              isClosable: true,
                            });
                          } catch (error) {
                            toast({
                              title: 'Error',
                              description: error.error || 'Failed to refresh wallet data.',
                              status: 'error',
                              duration: 5000,
                              isClosable: true,
                            });
                          }
                        }}
                        isLoading={loading}
                        size="sm"
                      >
                        Refresh Wallet Data
                      </Button>
                    </Flex>
                    <Tabs variant="soft-rounded" colorScheme="yellow" className="transaction-tabs">
                      <TabList mb={4} flexWrap="wrap" justifyContent="start" className="tab-list">
                        <Tab
                          _selected={{ bg: "#B38939", color: "white" }}
                          color={textColor}
                          className="tab"
                          fontSize="sm"
                          px={3}
                          py={1}
                          mr={2}
                        >
                          <Icon as={FaWallet} boxSize={4} mr={2} />
                          All
                        </Tab>
                        <Tab
                          _selected={{ bg: "#B38939", color: "white" }}
                          color={textColor}
                          className="tab"
                          fontSize="sm"
                          px={3}
                          py={1}
                          mr={2}
                        >
                          <Icon as={FaSync} boxSize={4} mr={2} />
                          Pending
                        </Tab>
                        <Tab
                          _selected={{ bg: "#B38939", color: "white" }}
                          color={textColor}
                          className="tab"
                          fontSize="sm"
                          px={3}
                          py={1}
                          mr={2}
                        >
                          <Icon as={FaMoneyBillWave} boxSize={4} mr={2} />
                          Completed
                        </Tab>
                        <Tab
                          _selected={{ bg: "#B38939", color: "white" }}
                          color={textColor}
                          className="tab"
                          fontSize="sm"
                          px={3}
                          py={1}
                          mr={2}
                        >
                          <Icon as={FaTimes} boxSize={4} mr={2} />
                          Failed
                        </Tab>
                      </TabList>
                      <TabPanels>
                        <TabPanel p={0} className="transaction-card-container">
                          {sortedTransactions.length > 0 ? (
                            <>
                              <VStack spacing={3} align="stretch">
                                {sortedTransactions
                                  .slice((allPage - 1) * itemsPerPage, allPage * itemsPerPage)
                                  .map(renderTransaction)}
                              </VStack>
                              {sortedTransactions.length > itemsPerPage && (
                                <PaginationControls
                                  currentPage={allPage}
                                  setCurrentPage={setAllPage}
                                  totalItems={sortedTransactions.length}
                                />
                              )}
                            </>
                          ) : (
                            <Flex justify="center" align="center" minH="200px">
                              <VStack spacing={3}>
                                <Icon as={FaWallet} color={subtleTextColor} boxSize={8} />
                                <Text color={subtleTextColor} textAlign="center" fontSize="md">
                                  No transactions yet
                                </Text>
                                <Text color={subtleTextColor} textAlign="center" fontSize="sm">
                                  Your transaction history will appear here
                                </Text>
                              </VStack>
                            </Flex>
                          )}
                        </TabPanel>
                        <TabPanel p={0} className="transaction-card-container">
                          {(() => {
                            const pendingTx = sortedTransactions.filter(tx => tx.status === 'pending');
                            return pendingTx.length > 0 ? (
                              <>
                                <VStack spacing={3} align="stretch">
                                  {pendingTx
                                    .slice((pendingPage - 1) * itemsPerPage, pendingPage * itemsPerPage)
                                    .map(renderTransaction)}
                                </VStack>
                                {pendingTx.length > itemsPerPage && (
                                  <PaginationControls
                                    currentPage={pendingPage}
                                    setCurrentPage={setPendingPage}
                                    totalItems={pendingTx.length}
                                  />
                                )}
                              </>
                            ) : (
                              <Flex justify="center" align="center" minH="200px">
                                <VStack spacing={3}>
                                  <Icon as={FaSync} color={subtleTextColor} boxSize={8} />
                                  <Text color={subtleTextColor} textAlign="center" fontSize="md">
                                    No pending transactions
                                  </Text>
                                </VStack>
                              </Flex>
                            );
                          })()}
                        </TabPanel>
                        <TabPanel p={0} className="transaction-card-container">
                          {(() => {
                            const completedTx = sortedTransactions.filter(tx => tx.status === 'completed' || tx.status === 'success');
                            return completedTx.length > 0 ? (
                              <>
                                <VStack spacing={3} align="stretch">
                                  {completedTx
                                    .slice((completedPage - 1) * itemsPerPage, completedPage * itemsPerPage)
                                    .map(renderTransaction)}
                                </VStack>
                                {completedTx.length > itemsPerPage && (
                                  <PaginationControls
                                    currentPage={completedPage}
                                    setCurrentPage={setCompletedPage}
                                    totalItems={completedTx.length}
                                  />
                                )}
                              </>
                            ) : (
                              <Flex justify="center" align="center" minH="200px">
                                <VStack spacing={3}>
                                  <Icon as={FaMoneyBillWave} color={subtleTextColor} boxSize={8} />
                                  <Text color={subtleTextColor} textAlign="center" fontSize="md">
                                    No completed transactions
                                  </Text>
                                </VStack>
                              </Flex>
                            );
                          })()}
                        </TabPanel>
                        <TabPanel p={0} className="transaction-card-container">
                          {(() => {
                            const failedTx = sortedTransactions.filter(tx => tx.status === 'failed' || tx.status === 'error');
                            return failedTx.length > 0 ? (
                              <>
                                <VStack spacing={3} align="stretch">
                                  {failedTx
                                    .slice((failedPage - 1) * itemsPerPage, failedPage * itemsPerPage)
                                    .map(renderTransaction)}
                                </VStack>
                                {failedTx.length > itemsPerPage && (
                                  <PaginationControls
                                    currentPage={failedPage}
                                    setCurrentPage={setFailedPage}
                                    totalItems={failedTx.length}
                                  />
                                )}
                              </>
                            ) : (
                              <Flex justify="center" align="center" minH="200px">
                                <VStack spacing={3}>
                                  <Icon as={FaTimes} color={subtleTextColor} boxSize={8} />
                                  <Text color={subtleTextColor} textAlign="center" fontSize="md">
                                    No failed transactions
                                  </Text>
                                </VStack>
                              </Flex>
                            );
                          })()}
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </CardBody>
                </Card>
              </VStack>
            </SimpleGrid>
          </motion.div>
          <FundAmountModal
            isOpen={isAmountOpen}
            onClose={onAmountClose}
            onSubmit={handleFundWallet}
          />
          <PaymentInfoModal
            isOpen={isFundOpen}
            onClose={() => {
              dispatch(clearPaymentDetails());
              setFundingAmount(null);
              onFundClose();
            }}
            paymentDetails={paymentDetails}
            userName={`${user.firstName} ${user.lastName}`}
            amount={fundingAmount}
            pendingTransactions={sortedTransactions.filter(tx => tx.status === 'pending')}
            handleRefresh={handleCheckStatus}
          />
          <WithdrawalModal
            isOpen={isWithdrawOpen}
            onClose={onWithdrawClose}
            walletBalance={wallet?.balance || 0}
          />
        </Container>
      </Box>
    </ErrorBoundary>
  );
};

export default Profile;