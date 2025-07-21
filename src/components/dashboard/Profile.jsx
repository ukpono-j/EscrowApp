import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import jwtDecode from 'jwt-decode';
import pino from 'pino';
import { motion } from 'framer-motion';
import {
  Box, Text, Button, Flex, Heading, Input, Grid, FormControl, FormLabel, Icon, Avatar, Spinner,
  Container, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
  ModalCloseButton, useDisclosure, NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper, Divider, IconButton, Select, useColorModeValue,
} from '@chakra-ui/react';
import { FaEdit, FaWallet, FaTimes, FaCreditCard, FaSync, FaMoneyBillWave, FaSave } from 'react-icons/fa';
import { MdContentCopy } from 'react-icons/md';
import multiavatar from '@multiavatar/multiavatar/esm';
import axios from '../../utils/axiosConfig';
import { fetchInitialData, fundWallet, checkFundingStatus, manualReconcileTransaction, withdrawFunds } from '../../store/slices/walletThunks';
import { setWallet, setPaymentDetails, clearPaymentDetails } from '../../store/slices/walletSlice';

const PAYSTACK_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Opay', code: '999992' },
  { name: 'Kuda Bank', code: '090267' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Moniepoint Microfinance Bank', code: '50515' },
  { name: 'Palmpay', code: '999991' },
  { name: 'First Bank', code: '011' },
  { name: 'GTBank', code: '058' },
  { name: 'UBA', code: '033' },
  { name: 'Fidelity Bank', code: '070' },
];

const BASE_URL = (import.meta.env.VITE_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const logger = pino({ level: 'info', browser: { asObject: true } });

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
    if (isSubmitting) return; // Prevent multiple submissions
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
      await onSubmit(amountNum);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate funding.',
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

const PaymentInfoModal = ({ isOpen, onClose, paymentDetails, onStatusCheck, userName, amount }) => {
  const toast = useToast();
  const dispatch = useDispatch();
  const textColor = useColorModeValue('gray.800', 'white');
  const subtleTextColor = useColorModeValue('gray.600', 'gray.300');
  const boxBg = useColorModeValue('gray.100', 'gray.700');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Text copied to clipboard.', status: 'success', duration: 3000, isClosable: true });
  };

  const handleManualReconcile = async () => {
    const ref = paymentDetails?.reference || paymentDetails?.paystackReference;
    if (!ref) {
      return toast({ title: 'Error', description: 'No reference available.', status: 'error', duration: 5000, isClosable: true });
    }
    try {
      const { success, data } = await dispatch(manualReconcileTransaction(ref)).unwrap();
      if (success) {
        toast({
          title: 'Success',
          description: `Successfully funded ₦${data.transaction.amount.toFixed(2)}. Your wallet has been updated.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        dispatch(clearPaymentDetails());
        onClose();
      } else {
        toast({
          title: 'Reconciliation Failed',
          description: data.message || 'Try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Reconciliation failed.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
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
                Click the button below to proceed with payment of ₦{amount?.toFixed(2)}:
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
              <Text color={textColor} mb={2}>Transfer ₦{amount?.toFixed(2)} to the account below:</Text>
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
              <Text color={subtleTextColor} mt={4} fontSize="sm">
                Your payment will be credited within 5 minutes. If delayed, it may be processing and will be updated soon.
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
            <>
              <Button colorScheme="blue" onClick={onStatusCheck} size="sm" mr={{ sm: 3 }} mb={{ base: 2, sm: 0 }}>
                Check Status
              </Button>
              <Button colorScheme="purple" onClick={handleManualReconcile} size="sm" mr={{ sm: 3 }} mb={{ base: 2, sm: 0 }}>
                Reconcile
              </Button>
            </>
          ) : null}
          <Button variant="ghost" onClick={onClose} size="sm">Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const WithdrawalModal = ({ isOpen, onClose, walletBalance }) => {
  const [amount, setAmount] = React.useState(0);
  const [bankCode, setBankCode] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [accountName, setAccountName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [verifiedAccountName, setVerifiedAccountName] = React.useState('');
  const [banks, setBanks] = React.useState(PAYSTACK_BANKS);
  const toast = useToast();
  const dispatch = useDispatch();
  const textColor = useColorModeValue('gray.800', 'white');
  const subtleTextColor = useColorModeValue('gray.600', 'gray.300');

  const fetchBanks = async () => {
    try {
      const response = await axios.get('/api/wallet/paystack/banks');
      if (response.data.success && response.data.data.length > 0) {
        setBanks(response.data.data);
      } else {
        setBanks(PAYSTACK_BANKS);
        toast({
          title: 'Warning',
          description: 'Using fallback bank list.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      setBanks(PAYSTACK_BANKS);
      toast({
        title: 'Error',
        description: 'Failed to fetch bank list. Using default banks.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const verifyAccount = async () => {
    if (!accountNumber || !bankCode) {
      toast({ title: 'Error', description: 'Please provide bank code and account number.', status: 'error', duration: 5000, isClosable: true });
      return;
    }
    setIsVerifying(true);
    try {
      const response = await axios.post('/api/wallet/verify-account', { bankCode, accountNumber });
      if (response.data.success) {
        setVerifiedAccountName(response.data.accountName);
        setAccountName(response.data.accountName);
      } else {
        toast({ title: 'Error', description: response.data.error || 'Failed to verify account.', status: 'error', duration: 5000, isClosable: true });
      }
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.error || 'Account verification failed.', status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || amount <= 0 || amount > walletBalance) {
      toast({ title: 'Error', description: 'Invalid amount.', status: 'error', duration: 5000, isClosable: true });
      return;
    }
    if (!bankCode || !accountNumber || !accountName) {
      toast({ title: 'Error', description: 'Please complete all fields.', status: 'error', duration: 5000, isClosable: true });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await dispatch(withdrawFunds({ amount, bankCode, accountNumber, accountName })).unwrap();
      if (response.success) {
        toast({ title: 'Success', description: `Withdrawal of ₦${amount.toFixed(2)} initiated.`, status: 'success', duration: 5000, isClosable: true });
        onClose();
      } else {
        toast({ title: 'Error', description: response.error || 'Withdrawal failed.', status: 'error', duration: 5000, isClosable: true });
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Withdrawal failed.', status: 'error', duration: 5000, isClosable: true });
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
          <FormControl mb={4}>
            <FormLabel color={textColor}>Amount (₦)</FormLabel>
            <NumberInput min={100} max={walletBalance} onChange={(value) => setAmount(Number(value))}>
              <NumberInputField />
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
              color={textColor}
            >
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>{bank.name}</option>
              ))}
            </Select>
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
              isDisabled={!!verifiedAccountName}
              color={textColor}
            />
          </FormControl>
          <Button
            colorScheme="blue"
            onClick={verifyAccount}
            isLoading={isVerifying}
            loadingText="Verifying..."
            size={{ base: 'sm', sm: 'md' }}
            mb={4}
          >
            Verify Account
          </Button>
          {verifiedAccountName && (
            <Text color={subtleTextColor}>Verified Account Name: {verifiedAccountName}</Text>
          )}
        </ModalBody>
        <ModalFooter flexDir={{ base: 'column', sm: 'row' }} gap={2}>
          <Button
            colorScheme="blue"
            onClick={handleWithdraw}
            isLoading={isSubmitting}
            loadingText="Processing..."
            size={{ base: 'sm', sm: 'md' }}
            mr={{ sm: 3 }}
            mb={{ base: 2, sm: 0 }}
          >
            Withdraw
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
  const { user, wallet, transactions, paymentDetails, loading, error } = useSelector((state) => state.wallet);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [fundingAmount, setFundingAmount] = useState(null);
  const socketRef = useRef(null);
  const textColor = useColorModeValue('gray.800', 'white');
  const subtleTextColor = useColorModeValue('gray.600', 'gray.300');
  const boxBg = useColorModeValue('gray.50', 'gray.700');
  const avatarSvg = user?.email ? multiavatar(user.email) : multiavatar('default');

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

      const response = await axios.post(
        `${BASE_URL}/api/wallet/check-funding-readiness`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
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
      let errorMessage = 'Failed to check funding readiness. Please try again later.';
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

  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem('access-token');
      if (!token) {
        setAuthError('No authentication token found. Please log in.');
        setIsAuthLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();
        if (isExpired) {
          setAuthError('Your session has expired. Please log in again.');
          localStorage.removeItem('access-token');
          setIsAuthLoading(false);
          return;
        }

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const result = await dispatch(fetchInitialData()).unwrap();
        if (!result.success) {
          setAuthError('Failed to authenticate. Please log in again.');
          setIsAuthLoading(false);
          return;
        }

        socketRef.current = io(BASE_URL, {
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
        });

        socketRef.current.on('connect', () => {
          logger.info('Socket connected');
          socketRef.current.emit('join', decoded.id);
        });

        socketRef.current.on('balanceUpdate', (data) => {
          dispatch(setWallet(data));
          toast({
            title: 'Balance Updated',
            description: `New balance: ₦${data.balance.toFixed(2)}`,
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        });

        socketRef.current.on('fundingInitiated', (data) => {
          dispatch(setPaymentDetails(data));
          setFundingAmount(data.amount);
          onFundOpen();
        });

        socketRef.current.on('connect_error', (err) => {
          logger.error({ message: 'Socket connection error', error: err.message });
          toast({
            title: 'Connection Error',
            description: 'Failed to connect to real-time updates.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        });

        setIsAuthLoading(false);
      } catch (err) {
        logger.error({ message: 'Authentication error', error: err.message });
        setAuthError('Authentication failed. Please log in again.');
        setIsAuthLoading(false);
      }
    };

    initialize();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        logger.info('Socket disconnected');
      }
    };
  }, [dispatch, toast]);

  useEffect(() => {
    if (user && !formData.firstName) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

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
      const response = await dispatch(fundWallet({
        amount,
        email: user.email,
        phoneNumber: user.phoneNumber,
        userId: user._id,
      })).unwrap();
      if (response.success) {
        setFundingAmount(amount);
        dispatch(setPaymentDetails(response.data));
        if (response.data.authorization_url) {
          window.location.href = response.data.authorization_url; // Redirect to Paystack payment page
        } else {
          onFundOpen(); // Open modal for virtual account details
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
      let errorMessage = error.message || 'Failed to initiate funding.';
      if (error.status === 502 && error.message.includes('Payment provider authentication failed')) {
        errorMessage = 'Payment provider configuration issue. Please contact support.';
      } else if (error.status === 400 && error.message.includes('Duplicate transaction detected')) {
        errorMessage = 'A transaction is already in progress. Please wait a moment and try again.';
      } else if (error.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.status === 401) {
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
      const response = await dispatch(checkFundingStatus(ref)).unwrap();
      if (response.success && response.data.transaction?.status === 'completed') {
        toast({
          title: 'Success',
          description: `Successfully funded ₦${response.data.transaction.amount.toFixed(2)}. Your wallet has been updated.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        dispatch(clearPaymentDetails());
        setFundingAmount(null);
        onFundClose();
      } else {
        toast({
          title: response.data.transaction?.status === 'failed' ? 'Failed' : 'Pending',
          description: response.message,
          status: response.data.transaction?.status === 'failed' ? 'error' : 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check funding status.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateProfile = async () => {
    setIsSubmitting(true);
    try {
      const response = await axios.put('/api/users/update', formData);
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
        description: error.response?.data?.error || 'Failed to update profile.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          onClick={() => navigate('/login')}
        >
          Log In
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
          onClick={() => dispatch(fetchInitialData())}
          isLoading={loading}
        >
          Retry
        </Button>
      </Flex>
    );
  }

  return (
    <ErrorBoundary>
      <Container maxW="container.lg" py={8}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box bg={boxBg} p={6} borderRadius="lg" boxShadow="md">
            <Flex align="center" mb={6}>
              <Avatar
                size="xl"
                src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`}
                mr={4}
              />
              <Box>
                <Heading size="lg" color={textColor}>
                  <span>{user.firstName} {user.lastName}</span>
                </Heading>
                <Text color={subtleTextColor}>{user.email}</Text>
              </Box>
            </Flex>

            {isEditing ? (
              <Box>
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
                <Flex gap={2}>
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
              <Box>
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

            <Box>
              <Flex align="center" mb={4}>
                <Icon as={FaWallet} color="blue.500" mr={2} />
                <Heading size="md" color={textColor}>
                  <span>Wallet</span>
                </Heading>
              </Flex>
              <Text color={textColor} fontSize="2xl" fontWeight="bold">
                ₦{wallet ? wallet.toFixed(2) : '0.00'}
              </Text>
              <Flex gap={2} mt={4}>
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
                  isDisabled={wallet <= 0}
                  size={{ base: 'sm', sm: 'md' }}
                >
                  Withdraw
                </Button>
                <Button
                  leftIcon={<FaSync />}
                  variant="outline"
                  onClick={() => dispatch(fetchInitialData())}
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
                <span>Recent Transactions</span>
              </Heading>
              {transactions.length > 0 ? (
                <Box>
                  {transactions.slice(0, 5).map((tx) => (
                    <Flex key={tx.reference} justify="space-between" p={2} borderBottom="1px" borderColor={subtleTextColor}>
                      <Text color={textColor}>
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}: ₦{tx.amount.toFixed(2)}
                      </Text>
                      <Text color={subtleTextColor}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
                    </Flex>
                  ))}
                </Box>
              ) : (
                <Text color={subtleTextColor}>No transactions yet.</Text>
              )}
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
          onStatusCheck={handleCheckStatus}
          userName={`${user.firstName} ${user.lastName}`}
          amount={fundingAmount}
        />
        <WithdrawalModal
          isOpen={isWithdrawOpen}
          onClose={onWithdrawClose}
          walletBalance={wallet || 0}
        />
      </Container>
    </ErrorBoundary>
  );
};

export default Profile;