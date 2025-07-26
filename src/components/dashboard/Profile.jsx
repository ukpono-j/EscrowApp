import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import pino from 'pino';
import { motion } from 'framer-motion';
import {
  Box, Text, Button, Flex, Heading, Input, Grid, FormControl, FormLabel, Icon, Avatar, Spinner,
  Container, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
  ModalCloseButton, useDisclosure, NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper, Divider, IconButton, Select, useColorModeValue,
  Tabs, TabList, Tab, TabPanels, TabPanel, Badge, VStack, Progress,
} from '@chakra-ui/react';
import { FaEdit, FaWallet, FaTimes, FaCreditCard, FaSync, FaMoneyBillWave, FaSave } from 'react-icons/fa';
import { MdContentCopy } from 'react-icons/md';
import io from 'socket.io-client';
import multiavatar from '@multiavatar/multiavatar/esm';
import moment from 'moment-timezone';
import axios from '../../utils/axiosConfig';
import { fetchInitialData, fundWallet, checkFundingStatus, manualReconcileTransaction, fetchPendingWithdrawals } from '../../store/slices/walletThunks';
import { setWallet, setPaymentDetails, clearPaymentDetails } from '../../store/slices/walletSlice';

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
const logger = pino({ level: 'info', browser: { asObject: true } });

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
        <Box p={4} bg="red.100" borderRadius="md">
          <Text color="red.800">Something went wrong: {this.state.error.message}</Text>
          <Button mt={2} onClick={() => window.location.reload()}>
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
  const textColor = useColorModeValue('gray.800', 'white');

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
      <ModalContent>
        <ModalHeader color={textColor}>Enter Funding Amount</ModalHeader>
        <ModalCloseButton />
        <ModalBody px={{ base: 4, sm: 6 }} py={4}>
          <FormControl>
            <FormLabel color={textColor}>Amount (₦)</FormLabel>
            <NumberInput min={100} precision={2} value={amount} onChange={(value) => setAmount(value)}>
              <NumberInputField placeholder="Enter amount (minimum ₦100)" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </ModalBody>
        <ModalFooter flexDir={{ base: 'column', sm: 'row' }} gap={2}>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
            size={{ base: 'sm', sm: 'md' }}
            mr={{ sm: 3 }}
            mb={{ base: 2, sm: 0 }}
          >
            Proceed to Fund
          </Button>
          <Button variant="ghost" onClick={onClose} size={{ base: 'sm', sm: 'md' }}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const PaymentInfoModal = ({ isOpen, onClose, paymentDetails, userName, amount, pendingTransactions, handleRefresh }) => {
  const toast = useToast();
  const textColor = useColorModeValue('gray.800', 'white');
  const subtleTextColor = useColorModeValue('gray.600', 'gray.300');
  const boxBg = useColorModeValue('gray.100', 'gray.700');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Text copied to clipboard.', status: 'success', duration: 3000, isClosable: true });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: 'full', sm: 'md' }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color={textColor}>Fund Wallet</ModalHeader>
        <ModalCloseButton />
        <ModalBody px={{ base: 4, sm: 6 }} py={4}>
          {paymentDetails?.authorization_url ? (
            <>
              <Text color={textColor} mb={4}>
                Click the button below to proceed with payment of ₦{amount ? amount.toFixed(2) : '0.00'}:
              </Text>
              <Button
                as="a"
                href={paymentDetails.authorization_url}
                colorScheme="blue"
                size={{ base: 'sm', sm: 'md' }}
                mb={4}
              >
                Pay Now
              </Button>
              <Text color={subtleTextColor} fontSize="sm">
                You will be redirected to Paystack to complete the payment.
              </Text>
            </>
          ) : paymentDetails?.virtualAccount ? (
            <>
              <Text color={textColor} mb={2}>Transfer ₦{amount ? amount.toFixed(2) : '0.00'} to the account below:</Text>
              <Box p={4} bg={boxBg} borderRadius="md">
                <Flex align="center" justify="space-between" mb={2}>
                  <Text fontWeight="bold" color={textColor}>Account Name: {paymentDetails.virtualAccount.account_name}</Text>
                  <IconButton
                    aria-label="Copy account name"
                    icon={<MdContentCopy />}
                    size="xs"
                    bg="transparent"
                    color={subtleTextColor}
                    onClick={() => copyToClipboard(paymentDetails.virtualAccount.account_name)}
                  />
                </Flex>
                <Text color={subtleTextColor}>Account Number: {paymentDetails.virtualAccount.account_number}</Text>
                <Text color={subtleTextColor}>Bank: {paymentDetails.virtualAccount.bank_name}</Text>
              </Box>
              {pendingTransactions?.length > 0 && (
                <Text color="yellow.500" mt={4} fontSize="sm">
                  Note: You have {pendingTransactions.length} pending transaction(s). Check the Transactions tab for details.
                </Text>
              )}
              <Text color={subtleTextColor} mt={4} fontSize="sm">
                Your payment will be credited within 5 minutes. If delayed, refresh and check for the updated wallet or wait for 10 minutes. If it still doesn't work, contact support.
              </Text>
            </>
          ) : (
            <Box>
              <Text color={textColor} mb={4}>Unable to initiate funding. Try again or contact support.</Text>
              <Button
                colorScheme="blue"
                onClick={() => { dispatch(clearPaymentDetails()); onClose(); }}
                size={{ base: 'sm', sm: 'md' }}
              >
                Retry
              </Button>
            </Box>
          )}
        </ModalBody>
        <ModalFooter flexDir={{ base: 'column', sm: 'row' }} gap={2}>
          {paymentDetails?.reference || paymentDetails?.paystackReference ? (
            <Button
              leftIcon={<FaSync />}
              colorScheme="teal"
              onClick={handleRefresh}
              size="sm"
              mr={{ sm: 3 }}
              mb={{ base: 2, sm: 0 }}
            >
              Refresh
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose} size="sm">Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const WithdrawalModal = ({ isOpen, onClose, walletBalance }) => {
  const [amount, setAmount] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [accountName, setAccountName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = React.useState([]);
  const [amountError, setAmountError] = React.useState('');
  const toast = useToast();
  const dispatch = useDispatch();
  const textColor = useColorModeValue('gray.800', 'white');
  const subtleTextColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch pending withdrawals
  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        const response = await dispatch(fetchPendingWithdrawals()).unwrap();
        // Corrected access to pendingWithdrawals
        setPendingWithdrawals(response.data?.data?.pendingWithdrawals || []);
      } catch (error) {
        setPendingWithdrawals([]); // Handle 404 or errors by showing empty list
        if (error.status !== 404) { // Only show toast for non-404 errors
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

  // Validate amount in real-time
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

  // Countdown timer logic
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
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/wallet/withdraw`,
        { amount: amountNum, accountNumber, accountName },
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
        // Refresh pending withdrawals
        const updatedWithdrawals = await dispatch(fetchPendingWithdrawals()).unwrap();
        setPendingWithdrawals(updatedWithdrawals.data.pendingWithdrawals || []);
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
      <ModalContent>
        <ModalHeader color={textColor}>Withdraw Funds</ModalHeader>
        <ModalCloseButton />
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
              <NumberInputField placeholder={`Enter amount (max ₦${walletBalance.toFixed(2)})`} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
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
              color={textColor}
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel color={textColor}>Account Name</FormLabel>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Enter account name"
              color={textColor}
            />
          </FormControl>
          {pendingWithdrawals.length > 0 && (
            <Box mt={4}>
              <Text fontWeight="bold" color={textColor} mb={2}>Pending Withdrawals</Text>
              {pendingWithdrawals.map((withdrawal) => (
                <Box key={withdrawal.reference} p={3} bg="gray.100" borderRadius="md" mb={2}>
                  <Text color={textColor}>Amount: ₦{withdrawal.amount.toFixed(2)}</Text>
                  <Text color={subtleTextColor}>Account: ****{withdrawal.accountNumber}</Text>
                  <Text color={subtleTextColor}>Name: {withdrawal.accountName}</Text>
                  <Text color={subtleTextColor}>
                    Time Remaining: {formatTimeRemaining(withdrawal.expectedPayoutDate)}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </ModalBody>
        <ModalFooter flexDir={{ base: 'column', sm: 'row' }} gap={2}>
          <Button
            colorScheme="blue"
            onClick={handleWithdraw}
            isLoading={isSubmitting}
            loadingText="Processing..."
            isDisabled={!!amountError || !accountNumber || !/^\d{10}$/.test(accountNumber) || !accountName || isSubmitting}
            size={{ base: 'sm', sm: 'md' }}
            mr={{ sm: 3 }}
            mb={{ base: 2, sm: 0 }}
          >
            Submit Withdrawal
          </Button>
          <Button variant="ghost" onClick={onClose} size={{ base: 'sm', sm: 'md' }}>
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [fundingAmount, setFundingAmount] = useState(null);
  const textColor = useColorModeValue('gray.800', 'white');
  const subtleTextColor = useColorModeValue('gray.600', 'gray.300');
  const boxBg = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const avatarSvg = user?.email ? multiavatar(user.email) : multiavatar('default');

  // Initialize WebSocket
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
      const socketInstance = io(BASE_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        logger.info('WebSocket connected', { socketId: socketInstance.id });
      });

      socketInstance.on('balanceUpdate', (data) => {
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
          dispatch(fetchInitialData());
        } else if (data.withdrawalRequest) {
          toast({
            title: 'Withdrawal Request',
            description: `Withdrawal request of ₦${data.withdrawalRequest.amount.toFixed(2)} submitted.`,
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
          dispatch(fetchPendingWithdrawals());
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

  // Check for pending transactions in localStorage on mount
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
          setAuthError('Your session has expired. Please log in again.');
          localStorage.removeItem('access-token');
          setIsAuthLoading(false);
          navigate('/login');
          return;
        }

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const result = await retryAsync(() => dispatch(fetchInitialData()).unwrap());
        if (!result.success) {
          let errorMessage = result.error || 'Failed to authenticate. Please log in again.';
          if (result.status === 401) {
            errorMessage = 'Session invalid or expired. Please log in again.';
            localStorage.removeItem('access-token');
            navigate('/login');
          } else if (result.status === 404) {
            errorMessage = 'User account not found. Please contact support.';
          } else if (result.status === 503) {
            errorMessage = 'Database unavailable. Please try again later.';
          }
          setAuthError(errorMessage);
          setIsAuthLoading(false);
          return;
        }

        setIsAuthLoading(false);
      } catch (err) {
        logger.error({ message: 'Authentication error', error: err.message, stack: err.stack });
        let errorMessage = 'Authentication failed. Please log in again.';
        if (err.response?.status === 401) {
          localStorage.removeItem('access-token');
          navigate('/login');
        } else if (err.response?.status === 404) {
          errorMessage = 'User account not found. Please contact support.';
        } else if (err.response?.status === 503) {
          errorMessage = 'Database unavailable. Please try again later.';
        }
        setAuthError(errorMessage);
        setIsAuthLoading(false);
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

  const handleUpdateProfile = async () => {
    setIsSubmitting(true);
    try {
      const response = await retryAsync(() => axios.put('/api/users/update', formData));
      if (response.data.success) {
        dispatch(setWallet({ ...user, ...formData }));
        setIsEditing(false);
        toast({
          title: 'Success',
          description: 'Profile updated successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: response.data.error || 'Failed to update profile.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update profile. Please check your network and try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      const result = await retryAsync(() => dispatch(fetchInitialData()).unwrap());
      if (result.success) {
        toast({
          title: 'Success',
          description: `Wallet balance refreshed. New balance: ₦${result.data.wallet.balance.toFixed(2)}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to refresh wallet balance.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to refresh wallet balance. Please check your network and try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        action: error.response?.status === 401 ? {
          label: 'Log In',
          onClick: () => navigate('/login'),
        } : null,
      });
    }
  };

  const handleRetryAuth = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    await handleRefresh();
    setIsAuthLoading(false);
  };

  const renderTransaction = (tx) => (
    <Box
      key={tx.reference || Math.random()}
      p={4}
      bg={cardBg}
      borderRadius="md"
      boxShadow="sm"
      _hover={{ boxShadow: 'md' }}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="center">
        <VStack align="start" spacing={1}>
          <Flex align="center">
            <Text fontWeight="bold" color={textColor}>
              {tx.type ? (tx.type.charAt(0).toUpperCase() + tx.type.slice(1)) : 'Unknown'}: ₦{(tx.amount || 0).toFixed(2)}
            </Text>
            <Badge
              ml={2}
              colorScheme={tx.status === 'completed' ? 'green' : tx.status === 'pending' ? 'yellow' : 'red'}
            >
              {tx.status ? (tx.status.charAt(0).toUpperCase() + tx.status.slice(1)) : 'Unknown'}
            </Badge>
          </Flex>
          <Text fontSize="sm" color={subtleTextColor}>
            Ref: {tx.reference || 'N/A'}
          </Text>
        </VStack>
        <Text fontSize="sm" color={subtleTextColor}>
          {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
        </Text>
      </Flex>
    </Box>
  );

  if (isAuthLoading) {
    return (
      <Flex justify="center" align="center" minH="50vh">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (authError) {
    return (
      <Flex justify="center" align="center" minH="50vh" flexDir="column">
        <Text color={textColor} fontSize="xl" mb={4}>{authError}</Text>
        <Button
          colorScheme="blue"
          onClick={handleRetryAuth}
          isLoading={isAuthLoading}
          mb={2}
        >
          Retry
        </Button>
        <Button
          colorScheme="red"
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
      <Flex justify="center" align="center" minH="50vh" flexDir="column">
        <Text color={textColor} fontSize="xl" mb={4}>Unable to load profile data. Please try again.</Text>
        <Button
          colorScheme="blue"
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
      <Container maxW="container.xl" py={8}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box bg={boxBg} p={6} borderRadius="lg" boxShadow="lg">
            <Flex align="center" mb={6} flexDir={{ base: 'column', md: 'row' }} textAlign={{ base: 'center', md: 'left' }}>
              <Avatar
                size="xl"
                src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`}
                mr={{ md: 4 }}
                mb={{ base: 4, md: 0 }}
              />
              <Box>
                <Heading size="lg" color={textColor}>
                  {user.firstName} {user.lastName}
                </Heading>
                <Text color={subtleTextColor}>{user.email}</Text>
              </Box>
            </Flex>

            {isEditing ? (
              <Box mb={6}>
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} mb={4}>
                  <FormControl>
                    <FormLabel color={textColor}>First Name</FormLabel>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="First Name"
                      color={textColor}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color={textColor}>Last Name</FormLabel>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Last Name"
                      color={textColor}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color={textColor}>Phone Number</FormLabel>
                    <Input
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="Phone Number"
                      type="tel"
                      color={textColor}
                    />
                  </FormControl>
                </Grid>
                <Flex gap={2} justify={{ base: 'center', md: 'flex-start' }}>
                  <Button
                    leftIcon={<FaSave />}
                    colorScheme="blue"
                    onClick={handleUpdateProfile}
                    isLoading={isSubmitting}
                    size={{ base: 'sm', sm: 'md' }}
                  >
                    Save
                  </Button>
                  <Button
                    leftIcon={<FaTimes />}
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    size={{ base: 'sm', sm: 'md' }}
                  >
                    Cancel
                  </Button>
                </Flex>
              </Box>
            ) : (
              <Box mb={6}>
                <Text color={subtleTextColor} mb={2}>Phone: {user.phoneNumber || 'Not set'}</Text>
                <Button
                  leftIcon={<FaEdit />}
                  colorScheme="blue"
                  onClick={() => setIsEditing(true)}
                  size={{ base: 'sm', sm: 'md' }}
                >
                  Edit Profile
                </Button>
              </Box>
            )}

            <Divider my={6} />

            <Box mb={6}>
              <Flex align="center" mb={4}>
                <Icon as={FaWallet} color="blue.500" mr={2} />
                <Heading size="md" color={textColor}>
                  Wallet
                </Heading>
              </Flex>
              <Text color={textColor} fontSize="2xl" fontWeight="bold">
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
              <Flex gap={2} mt={4} flexWrap="wrap" justify={{ base: 'center', md: 'flex-start' }}>
                <Button
                  leftIcon={<FaCreditCard />}
                  colorScheme="blue"
                  onClick={handleCheckFundingReadiness}
                  isLoading={isSubmitting || loading}
                  isDisabled={isSubmitting || loading}
                  size={{ base: 'sm', sm: 'md' }}
                >
                  Fund Wallet
                </Button>
                <Button
                  leftIcon={<FaMoneyBillWave />}
                  colorScheme="green"
                  onClick={onWithdrawOpen}
                  isDisabled={(wallet?.balance || 0) <= 0}
                  size={{ base: 'sm', sm: 'md' }}
                >
                  Withdraw
                </Button>
                <Button
                  leftIcon={<FaSync />}
                  colorScheme="teal"
                  onClick={handleRefresh}
                  isLoading={loading}
                  size={{ base: 'sm', sm: 'md' }}
                >
                  Refresh
                </Button>
              </Flex>
            </Box>

            <Divider my={6} />

            <Box>
              <Heading size="md" color={textColor} mb={4}>
                Transactions
              </Heading>
              <Tabs variant="enclosed" colorScheme="blue">
                <TabList>
                  <Tab>All</Tab>
                  <Tab>Pending</Tab>
                  <Tab>Completed</Tab>
                  <Tab>Failed</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    {Array.isArray(transactions) && transactions.length > 0 ? (
                      <VStack spacing={3}>
                        {transactions.map(renderTransaction)}
                      </VStack>
                    ) : (
                      <Text color={subtleTextColor}>No transactions available.</Text>
                    )}
                  </TabPanel>
                  <TabPanel>
                    {Array.isArray(transactions) && transactions.some(tx => tx.status === 'pending') ? (
                      <VStack spacing={3}>
                        {transactions.filter(tx => tx.status === 'pending').map(renderTransaction)}
                      </VStack>
                    ) : (
                      <Text color={subtleTextColor}>No pending transactions.</Text>
                    )}
                  </TabPanel>
                  <TabPanel>
                    {Array.isArray(transactions) && transactions.some(tx => tx.status === 'completed') ? (
                      <VStack spacing={3}>
                        {transactions.filter(tx => tx.status === 'completed').map(renderTransaction)}
                      </VStack>
                    ) : (
                      <Text color={subtleTextColor}>No completed transactions.</Text>
                    )}
                  </TabPanel>
                  <TabPanel>
                    {Array.isArray(transactions) && transactions.some(tx => tx.status === 'failed') ? (
                      <VStack spacing={3}>
                        {transactions.filter(tx => tx.status === 'failed').map(renderTransaction)}
                      </VStack>
                    ) : (
                      <Text color={subtleTextColor}>No failed transactions.</Text>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          </Box>
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
          pendingTransactions={transactions.filter(tx => tx.status === 'pending')}
          handleRefresh={handleRefresh}
        />
        <WithdrawalModal
          isOpen={isWithdrawOpen}
          onClose={onWithdrawClose}
          walletBalance={wallet?.balance || 0}
        />
      </Container>
    </ErrorBoundary>
  );
};

export default Profile;