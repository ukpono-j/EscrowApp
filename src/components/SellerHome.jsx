import { Link, useNavigate } from "react-router-dom";
import { Send,  Bell, ShieldCheck } from "lucide-react";


import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Text, Button, Input, FormControl, FormLabel, useToast, useDisclosure, NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,Select, useColorModeValue,
  Card,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
} from '@chakra-ui/react';
// import { FaEdit, FaWallet, FaTimes, FaCreditCard, FaSync, FaMoneyBillWave, FaSave, FaUpload } from 'react-icons/fa';
// import io from 'socket.io-client';
import moment from 'moment-timezone';
import axios from '../utils/axiosConfig';

// import { fetchInitialData, fundWallet, checkFundingStatus, fetchPendingWithdrawals, fetchTransactions } from '../../store/slices/walletThunks';
// import { setWallet, setPaymentDetails, clearPaymentDetails } from '../../store/slices/walletSlice';
// import PaymentInfoModal from './PaymentInfoModal';
// import './Profile.css';

import { fetchPendingWithdrawals } from "../store/slices/walletThunks";
import { formatNaira } from "../utils";

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


const WithdrawalModal = ({ isOpen, onClose, walletBalance, availableBalance }) => {
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

  // Updated validation to use availableBalance instead of walletBalance
  useEffect(() => {
    const amountNum = parseFloat(amount);
    if (amount && (isNaN(amountNum) || amountNum < 100)) {
      setAmountError('Minimum withdrawal is ₦100.');
    } else if (amountNum > availableBalance) {
      setAmountError(`Insufficient available balance. Available: ₦${availableBalance.toFixed(2)}`);
    } else {
      setAmountError('');
    }
  }, [amount, availableBalance]);

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
        `/api/wallet/withdraw`,
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
          {/* Balance Info Section - NEW */}
          <Box mb={4} p={3} bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor}>
            <Text fontSize="sm" color={subtleTextColor} mb={1}>Total Balance</Text>
            <Text fontSize="lg" fontWeight="bold" color={textColor} mb={2}>
              ₦{walletBalance.toFixed(2)}
            </Text>
            <Text fontSize="sm" color={subtleTextColor} mb={1}>Available Balance</Text>
            <Text fontSize="lg" fontWeight="bold" color="green.500">
              ₦{availableBalance.toFixed(2)}
            </Text>
            {walletBalance !== availableBalance && (
              <Text fontSize="xs" color="orange.500" mt={2}>
                ⓘ Some funds are reserved for pending withdrawals
              </Text>
            )}
          </Box>

          <FormControl mb={4} isInvalid={!!amountError}>
            <FormLabel color={textColor}>Amount (₦)</FormLabel>
            <NumberInput
              min={100}
              max={availableBalance}
              precision={2}
              value={amount}
              onChange={(value) => setAmount(value)}
            >
              <NumberInputField
                placeholder={`Enter amount (max ₦${availableBalance.toFixed(2)})`}
                bg={cardBg}
                borderColor={borderColor}
                color={textColor}
              />
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
                <Card
                  key={withdrawal.reference}
                  bg={cardBg}
                  p={3}
                  borderRadius="lg"
                  mb={2}
                  border="1px"
                  borderColor={borderColor}
                >
                  <Text color={textColor} fontWeight="semibold">
                    Amount: ₦{withdrawal.amount.toFixed(2)}
                  </Text>
                  <Text color={subtleTextColor} fontSize="sm">
                    Account: ****{withdrawal.accountNumber.slice(-4)}
                  </Text>
                  <Text color={subtleTextColor} fontSize="sm">
                    Name: {withdrawal.accountName}
                  </Text>
                  <Text color={subtleTextColor} fontSize="sm">
                    Bank: {withdrawal.bankName || 'N/A'}
                  </Text>
                  <Text color="orange.500" fontSize="sm" fontWeight="medium">
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
            isDisabled={
              !!amountError ||
              !accountNumber ||
              !/^\d{10}$/.test(accountNumber) ||
              !accountName ||
              !bankCode ||
              isSubmitting
            }
            size={{ base: 'sm', sm: 'md' }}
            width={{ base: 'full', sm: 'auto' }}
            mr={{ sm: 3 }}
            mb={{ base: 2, sm: 0 }}
          >
            Submit Withdrawal
          </Button>
          <Button
            variant="ghost"
            color={textColor}
            _hover={{ bg: useColorModeValue('gray.100', '#051E2F') }}
            onClick={onClose}
            size={{ base: 'sm', sm: 'md' }}
            width={{ base: 'full', sm: 'auto' }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default function SellerHome() {
  const navigate = useNavigate();


  //  const dispatch = useDispatch();
    
    // const toast = useToast();
    // const { isOpen: isFundOpen, onOpen: onFundOpen, onClose: onFundClose } = useDisclosure();
    const { isOpen: isWithdrawOpen, onOpen: onWithdrawOpen, onClose: onWithdrawClose } = useDisclosure();
    // const { isOpen: isAmountOpen, onOpen: onAmountOpen, onClose: onAmountClose } = useDisclosure();
    const { user, wallet, paymentDetails, loading, error } = useSelector((state) => state.wallet);
    // const transactions = wallet?.transactions || [];
    // const [isEditing, setIsEditing] = useState(false);
    // const [formData, setFormData] = useState({ firstName: '', lastName: '', phoneNumber: '' });
    // const [avatarFile, setAvatarFile] = useState(null);
    // const [isSubmitting, setIsSubmitting] = useState(false);
    // const [isAuthLoading, setIsAuthLoading] = useState(true);
    // const [authError, setAuthError] = useState(null);
    // const [fundingAmount, setFundingAmount] = useState(null);
    // const [avatarError, setAvatarError] = useState(false);
    // const [avatarPreview, setAvatarPreview] = useState(null);
    // const [avatarRetryCount, setAvatarRetryCount] = useState(0);
    // const [isAvatarLoading, setIsAvatarLoading] = useState(false);
    // const fileInputRef = useRef(null);
    // const bgColor = useColorModeValue('gray.100', '#1A202C');
    // const cardBg = useColorModeValue('white', '#051E2F');
    // const textColor = useColorModeValue('#051E2F', 'white');
    // const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
    // const borderColor = useColorModeValue('gray.200', '#051E2F');
    // const [isAvatarUploading, setIsAvatarUploading] = useState(false);
    // const [allPage, setAllPage] = useState(1);
    // const [pendingPage, setPendingPage] = useState(1);
    // const [completedPage, setCompletedPage] = useState(1);
    // const [failedPage, setFailedPage] = useState(1);
    // const itemsPerPage = 5;
    // const hasShownAvatarToast = useRef(false);
    // const editPanelBg = useColorModeValue('gray.50', '#2D3748');
    // const inputFieldBg = useColorModeValue('white', '#2D3748');

  return (
    <div className="">
      {/*  Header */}
      <div className=" flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white ">Seller Hub</h1>

          <div className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-white/80" />
            <p className="text-sm text-white/80">seller</p>
          </div>
        </div>

        {/* <Link to={"/notifications"}>
          <button className="w-10 h-10 rounded-full  bg-white flex items-center justify-center ">
            <Bell size={22} className="text-black " />
          </button>
        </Link> */}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/*  Wallet Card */}
        {/* <div className="bg-green-500 text-white rounded-2xl p-5 shadow-sm"> */}
         <div
            className="p-8 rounded-xl  w-full"
            style={{
              background: "linear-gradient(135deg, rgba(183, 137, 57, 0.1) 0%, rgba(138, 109, 47, 0.1) 100%)",
              border: "1px solid rgba(183, 137, 57, 0.2)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
          <p className="text-sm text-white">AVAILABLE TO WITHDRAW</p>
          <h2 className="text-3xl font-bold mt-1">{formatNaira(wallet?.balance || 0)}</h2>

          <button 
           onClick={onWithdrawOpen}
           disabled={(wallet?.balance || 0) <= 0}
          className={`mt-2  text-white px-4 py-2 rounded-xl  ${(wallet?.balance || 0) <= 0 ? "bg-gray-400" : "bg-black active:scale-[0.98] transition"}`}>
            Withdraw to Bank
          </button>
        </div>

        {/*  New Deal */}

        
        {/* <button
          onClick={() => navigate("/deal/action/123")}
          className="w-full active:scale-[0.98] transition"
        >
       
             <div
            className="rounded-2xl p-4 shadow-sm border flex items-center justify-between text-start"
            style={{
              background: "linear-gradient(135deg, rgba(183, 137, 57, 0.1) 0%, rgba(138, 109, 47, 0.1) 100%)",
              border: "1px solid rgba(183, 137, 57, 0.2)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-2xl text-2xl">
                &#128176;
              </div>

              <div>
                <h3 className="font-semibold">New Deal Offer</h3>
                <p className="text-gray-500 text-sm">@david_o locked ₦1,000</p>
              </div>
            </div>

            <span className="text-green-500 text-xl">→</span>
          </div>
        </button> */}

        {/*  Section */}
        <h2 className="text-lg font-semibold text-white">Start Selling</h2>

        {/*  Actions */}
        <div className="">
          {/* Start Deal */}
          <button
           onClick={() => navigate("/create-transaction")}
            className="w-full active:scale-[0.98] transition"
          >
         
               <div
            className="rounded-2xl p-4  flex items-center justify-between text-start"
            style={{
              background: "linear-gradient(135deg, rgba(183, 137, 57, 0.1) 0%, rgba(138, 109, 47, 0.1) 100%)",
              border: "1px solid rgba(183, 137, 57, 0.2)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-3 rounded-2xl">
                  <Send size={22} className="text-green-600" />
                </div>

                <div>
                  <h3 className="font-semibold">Start a deal with a buyer</h3>
                  <p className="text-gray-500 text-sm">
                    Enter their username to create a deal
                  </p>
                </div>
              </div>

              <span className="text-gray-400">→</span>
            </div>
          </button>

        
        </div>
      </div>

       {isWithdrawOpen && <WithdrawalModal
            isOpen={isWithdrawOpen}
            onClose={onWithdrawClose}
            walletBalance={wallet?.balance || 0}
            // ✅ FIX: Ensure availableBalance defaults to balance if undefined
            availableBalance={wallet?.availableBalance ?? wallet?.balance ?? 0}
          />}
    </div>
  );
}
