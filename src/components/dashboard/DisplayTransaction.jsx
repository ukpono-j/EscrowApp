import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Box, Flex, Text, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Grid, Stack, Input, IconButton, Image, Spinner, useDisclosure, useColorModeValue
} from '@chakra-ui/react';
import { FiSearch, FiEdit } from 'react-icons/fi';
import { BsChatFill } from 'react-icons/bs';
import { MdClose, MdContentCopy } from 'react-icons/md';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchInitialData, updateTransaction, confirmTransaction, fundTransaction, cancelTransaction
} from '../../store/slices/thunks';
import { setWallet } from '../../store/slices/walletSlice';
import { useManagedToast } from '../../utils/toastManager';
import Sidebar from './Sidebar';
import MiniNav from './MiniNav';
import axios from '../../utils/axiosConfig';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const MotionBox = motion(Box);

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const TransactionLoader = () => {
  const textColor = useColorModeValue('#051E2F', 'white');
  return (
    <Flex align="center" justify="center" h="50vh" direction="column" gap={4}>
      <Spinner color="#BB954D" size="lg" />
      <Text color={textColor} fontSize="md">Loading transactions...</Text>
    </Flex>
  );
};

const TransactionCard = React.memo(({ transaction, currentUser, isConfirming, handleChat, handleWaybill, handleConfirm, handleFund, handleEditPayment, cancelTransaction, copyToClipboard, toggleDescription, expandedDescriptions }) => {
  const currentUserId = currentUser?._id?.toString() || '';
  const creatorId = transaction?.userId?._id?.toString() || '';
  const isCreator = currentUserId === creatorId;
  const isParticipant = currentUserId && transaction?.participants?.some(p => p?._id?.toString() === currentUserId) || false;
  const userRole = transaction?.userRole || (isCreator ? transaction?.selectedUserType : transaction?.selectedUserType === "buyer" ? "seller" : "buyer");
  const isBuyer = userRole === "buyer";
  const displayName = transaction?.participants?.length > 0 && transaction.participants[0]
    ? (isCreator ? `${transaction.participants[0].firstName || ""} ${transaction.participants[0].lastName || ""}`.trim() || transaction.participants[0].email || "Unknown"
      : `${transaction.userId.firstName || ""} ${transaction.userId.lastName || ""}`.trim() || transaction.userId.email || "Unknown")
    : "No participant";
  const description = transaction?.productDetails?.description || "No description";
  const isExpanded = expandedDescriptions[transaction._id];
  const truncatedDescription = description.length > 80 && !isExpanded ? `${description.substring(0, 80)}...` : description;
  const cardBg = useColorModeValue('white', '#1A202C');
  const textColor = useColorModeValue('#051E2F', 'white');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <MotionBox
      bg={cardBg}
      p={4}
      rounded="lg"
      border="1px"
      borderColor={borderColor}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Flex justify="space-between" align="center" mb={3}>
        <Box>
          <Text fontSize="md" fontWeight="600" color={textColor}>{displayName}</Text>
          <Text fontSize="xs" color={subtleTextColor}>{userRole === "buyer" ? "Buying" : "Selling"}</Text>
        </Box>
        <Flex gap={2}>
          <IconButton aria-label="Edit payment" icon={<FiEdit />} size="sm" color={subtleTextColor} bg="transparent" _hover={{ color: "#BB954D" }} onClick={() => handleEditPayment(transaction)} />
          <IconButton aria-label="Open chat" icon={<BsChatFill />} size="sm" color={subtleTextColor} bg="transparent" _hover={{ color: "#BB954D" }} onClick={() => handleChat(transaction._id)} />
        </Flex>
      </Flex>

      <Flex justify="space-between" align="center" mb={3}>
        <Box>
          <Text fontSize="xs" color={subtleTextColor}>Amount</Text>
          <Text fontSize="lg" color="#BB954D" fontWeight="600">
            {transaction.paymentAmount ? `₦${parseFloat(transaction.paymentAmount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "N/A"}
          </Text>
        </Box>
        <Box textAlign="right">
          <Text
            bg={transaction.status === "completed" ? "#22c55e" : transaction.status === "cancelled" ? "#ef4444" : "#BB954D"}
            color="white"
            px={2}
            py={1}
            rounded="sm"
            fontSize="xs"
            fontWeight="500"
          >
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </Text>
        </Box>
      </Flex>

      <Box mb={3}>
        <Text fontSize="xs" color={subtleTextColor}>Escrow</Text>
        <Text fontSize="sm" color={transaction.locked && transaction.status !== "completed" ? "#BB954D" : transaction.status === "completed" ? "#22c55e" : subtleTextColor} fontWeight="500">
          {transaction.locked && transaction.status !== "completed"
            ? `Locked: ₦${parseFloat(transaction.lockedAmount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
            : transaction.status === "completed"
              ? `Released: ₦${parseFloat(transaction.paymentAmount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
              : "Not Locked"}
        </Text>
      </Box>

      <Grid templateColumns="1fr 1fr" gap={3} mb={3}>
        <Box>
          <Text fontSize="xs" color={subtleTextColor}>Contact</Text>
          <Text fontSize="sm" color={textColor}>{transaction.email || "N/A"}</Text>
        </Box>
        <Box>
          <Text fontSize="xs" color={subtleTextColor}>Created</Text>
          <Text fontSize="sm" color={textColor}>{transaction.createdAt ? format(new Date(transaction.createdAt), "MMM dd, yyyy") : "N/A"}</Text>
        </Box>
      </Grid>

      <Box mb={3}>
        <Text fontSize="xs" color={subtleTextColor}>Transaction ID</Text>
        <Flex align="center" gap={2}>
          <Text fontSize="xs" color={subtleTextColor} isTruncated>{transaction._id}</Text>
          <IconButton aria-label="Copy ID" icon={<MdContentCopy />} size="xs" color={subtleTextColor} bg="transparent" _hover={{ color: "#8a6d27" }} onClick={() => copyToClipboard(transaction._id)} />
        </Flex>
      </Box>

      <Box mb={3}>
        <Text fontSize="xs" color={subtleTextColor}>Description</Text>
        <Text fontSize="sm" color={textColor} onClick={() => description.length > 80 && toggleDescription(transaction._id)} cursor={description.length > 80 ? "pointer" : "default"}>
          {truncatedDescription}
        </Text>
        {description.length > 80 && (
          <Text fontSize="xs" color="#8a6d27" mt={1} cursor="pointer" onClick={() => toggleDescription(transaction._id)}>
            {isExpanded ? "Show less" : "Read more"}
          </Text>
        )}
      </Box>

      <Stack spacing={2}>
        <Button onClick={() => handleWaybill(transaction._id, isBuyer)} bg="#8a6d27" color="white" _hover={{ bg: "#8a6d27" }} size="sm" fontWeight="500">
          {isBuyer ? "View Waybill" : "Submit Waybill"}
        </Button>
        {transaction.status === "pending" && (
          <Button onClick={() => handleConfirm(transaction._id)} bg="#22c55e" color="white" _hover={{ bg: "#16a34a" }} size="sm" fontWeight="500" isLoading={isConfirming[transaction._id]}>
            Complete Transaction
          </Button>
        )}
        {isBuyer && !transaction.locked && transaction.status === "pending" && (
          <Button onClick={() => handleFund(transaction)} bg="#8a6d27" color="white" _hover={{ bg: "#8a6d27" }} size="sm" fontWeight="500" isLoading={isConfirming[transaction._id]}>
            Fund Transaction
          </Button>
        )}
        <Button onClick={() => cancelTransaction(transaction._id)} bg="transparent" border="1px" borderColor="#ef4444" color="#ef4444" _hover={{ bg: "#ef4444", color: "white" }} size="sm" fontWeight="500" isLoading={isConfirming[transaction._id]}>
          Cancel
        </Button>
      </Stack>
    </MotionBox>
  );
});

const WaybillModal = React.memo(({ isOpen, onClose, transactionId, isBuyer, details, setDetails, errors, handleSubmit, downloadImage, isFunded }) => {
  const bgColor = useColorModeValue('white', '#1A202C');
  const textColor = useColorModeValue('#051E2F', 'white');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = useColorModeValue('gray.50', '#051E2F');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "md" }}>
      <ModalOverlay />
      <ModalContent bg={bgColor} color={textColor} p={4} rounded="lg" border="1px" borderColor={borderColor}>
        <ModalHeader fontSize="lg" fontWeight="600">{isBuyer ? "Waybill Details" : "Submit Waybill"}</ModalHeader>
        <ModalBody>
          {isBuyer ? (
            <Stack spacing={3}>
              {[
                { label: "Item", value: details.item || "N/A" },
                { label: "Shipping/Arrival Address", value: details.shippingAddress || "N/A" },
                { label: "Tracking Number", value: details.trackingNumber || "N/A" },
                { label: "Delivery/Arrival Date", value: details.deliveryDate ? format(new Date(details.deliveryDate), "MMM dd, yyyy") : "N/A" },
              ].map(({ label, value }, idx) => (
                <Box key={idx}>
                  <Text fontSize="xs" color={subtleTextColor}>{label}</Text>
                  <Text fontSize="sm" color={textColor}>{value}</Text>
                </Box>
              ))}
              <Box>
                <Text fontSize="xs" color={subtleTextColor}>Image</Text>
                {details.image ? (
                  <Flex direction="column" gap={2}>
                    <Image src={details.image} alt="Waybill" maxW="100%" rounded="md" />
                    <Button size="sm" bg="#8a6d27" color="white" _hover={{ bg: "#b38939" }} onClick={() => downloadImage(details.image)}>Download Image</Button>
                  </Flex>
                ) : (
                  <Text fontSize="sm" color={subtleTextColor}>No image</Text>
                )}
              </Box>
            </Stack>
          ) : !isFunded ? (
            <Text fontSize="sm" color="red.400" textAlign="center">
              Seller cannot fill or carry out waybill until buyer has funded the transaction.
            </Text>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(transactionId); }}>
              <Stack spacing={3}>
                {[
                  { label: "Item", key: "item", type: "text", isReadOnly: true },
                  { label: "Shipping/Arrival Address", key: "shippingAddress", type: "text" },
                  { label: "Tracking Number", key: "trackingNumber", type: "text" },
                  { label: "Delivery/Arrival Date", key: "deliveryDate", type: "date" },
                ].map(({ label, key, type, isReadOnly }) => (
                  <Box key={key}>
                    <Text fontSize="xs" color={subtleTextColor}>{label}</Text>
                    <Input
                      type={type}
                      value={details[key] || ""}
                      onChange={(e) => setDetails({ ...details, [key]: e.target.value })}
                      bg={inputBg}
                      borderColor={borderColor}
                      color={textColor}
                      size="sm"
                      _focus={{ borderColor: "#BB954D" }}
                      isReadOnly={isReadOnly}
                    />
                    {errors[key] && <Text color="red.400" fontSize="xs">{errors[key]}</Text>}
                  </Box>
                ))}
                <Box>
                  <Text fontSize="xs" color={subtleTextColor}>Image</Text>
                  <Box border="1px dashed" borderColor={borderColor} p={4} textAlign="center" rounded="md">
                    <Input
                      type="file"
                      id={`waybill-image-${transactionId}`}
                      accept="image/*"
                      onChange={(e) => setDetails({ ...details, image: e.target.files[0] })}
                      display="none"
                    />
                    <label htmlFor={`waybill-image-${transactionId}`} style={{ cursor: 'pointer' }}>
                      <Text fontSize="sm" color={subtleTextColor}>Upload image</Text>
                    </label>
                    {details.image && <Text fontSize="xs" color={subtleTextColor} mt={1}>{details.image.name}</Text>}
                  </Box>
                  {errors.image && <Text color="red.400" fontSize="xs">{errors.image}</Text>}
                </Box>
              </Stack>
            </form>
          )}
        </ModalBody>
        <ModalFooter>
          <Flex gap={3} w="full">
            <Button size="sm" bg={useColorModeValue('gray.200', 'gray.600')} color={textColor} _hover={{ bg: useColorModeValue('gray.300', 'gray.700') }} onClick={onClose}>Close</Button>
            {!isBuyer && isFunded && (
              <Button size="sm" bg="#BB954D" color="white" _hover={{ bg: "#8a6d2f" }} onClick={() => handleSubmit(transactionId)}>Submit</Button>
            )}
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

const PaymentDetailsModal = ({ isOpen, onClose, transaction, paymentDetails, setPaymentDetails, paymentErrors, handleSubmit }) => {
  const bgColor = useColorModeValue('white', '#1A202C');
  const textColor = useColorModeValue('#051E2F', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = useColorModeValue('gray.50', '#051E2F');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "sm" }}>
      <ModalOverlay />
      <ModalContent bg={bgColor} color={textColor} p={4} rounded="lg" border="1px" borderColor={borderColor}>
        <ModalHeader fontSize="lg" fontWeight="600">Edit Payment</ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Box>
              <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>Amount</Text>
              <Input
                type="number"
                value={paymentDetails.paymentAmount || ""}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentAmount: e.target.value })}
                bg={inputBg}
                borderColor={borderColor}
                color={textColor}
                size="sm"
                _focus={{ borderColor: "#BB954D" }}
                isDisabled={transaction?.locked}
              />
              {paymentErrors.paymentAmount && <Text color="red.400" fontSize="xs" mt={1}>{paymentErrors.paymentAmount}</Text>}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Flex gap={3} w="full">
              <Button size="sm" bg={useColorModeValue('gray.200', 'gray.600')} color={textColor} _hover={{ bg: useColorModeValue('gray.300', 'gray.700') }} onClick={onClose}>Cancel</Button>
              <Button type="submit" size="sm" bg="#BB954D" color="white" _hover={{ bg: "#967532" }}>Save</Button>
            </Flex>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

const FundingModal = ({ isOpen, onClose, transaction, walletBalance, confirmFunding }) => {
  const bgColor = useColorModeValue('white', '#1A202C');
  const textColor = useColorModeValue('#051E2F', 'white');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "sm" }}>
      <ModalOverlay />
      <ModalContent bg={bgColor} color={textColor} p={4} rounded="lg" border="1px" borderColor={borderColor}>
        <ModalHeader fontSize="lg" fontWeight="600">Fund Transaction</ModalHeader>
        <ModalBody>
          <Text fontSize="sm" color={subtleTextColor}>
            Wallet balance: ₦{(walletBalance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}.
            Need additional ₦{transaction ? (parseFloat(transaction.paymentAmount || 0) - (walletBalance ?? 0)).toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}.
            Proceed with Paystack?
          </Text>
        </ModalBody>
        <ModalFooter>
          <Flex gap={3} w="full">
            <Button size="sm" bg={useColorModeValue('gray.200', 'gray.600')} color={textColor} _hover={{ bg: useColorModeValue('gray.300', 'gray.700') }} onClick={onClose}>Cancel</Button>
            <Button size="sm" bg="#BB954D" color="white" _hover={{ bg: "#967532" }} onClick={() => confirmFunding(transaction)}>Proceed</Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const DisplayTransaction = () => {
  const dispatch = useDispatch();
  const { userDetails, loading: userLoading, error: userError } = useSelector(state => state.user);
  const { transactions, loading: transactionsLoading, error: transactionsError } = useSelector(state => state.transactions);
  const { wallet, transactions: walletTransactions, loading: walletLoading } = useSelector(state => state.wallet);
  const walletBalance = wallet?.balance ?? 0;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasFetchedInitially, setHasFetchedInitially] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [waybillDetails, setWaybillDetails] = useState({ item: '', image: null, shippingAddress: '', trackingNumber: '', deliveryDate: '' });
  const [buyerWaybillDetails, setBuyerWaybillDetails] = useState({});
  const [errors, setErrors] = useState({});
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({ paymentAmount: '' });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [isConfirming, setIsConfirming] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const managedToast = useManagedToast();
  const navigate = useNavigate();
  const { isOpen: isFundingModalOpen, onOpen: openFundingModal, onClose: closeFundingModal } = useDisclosure();
  const [showWaybillPopup, setShowWaybillPopup] = useState({});
  const [buyerShowWaybillPopup, setBuyerShowWaybillPopup] = useState({});
  const bgColor = useColorModeValue('gray.100', '#051E2F');
  const cardBg = useColorModeValue('white', '#1A202C');
  const textColor = useColorModeValue('#051E2F', 'white');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = useColorModeValue('gray.50', '#051E2F');

  const debouncedFetchInitialData = useCallback(debounce(() => {
    dispatch(fetchInitialData()).unwrap().then((payload) => {
      dispatch(setWallet({
        user: payload.userDetails,
        balance: payload.wallet?.balance ?? 0,
        totalDeposits: payload.wallet?.totalDeposits ?? 0,
        transactions: Array.isArray(payload.wallet?.transactions) ? payload.wallet.transactions : [],
      }));
      setHasFetchedInitially(true);
      setRetryCount(0);
    }).catch(err => {
      console.error('Fetch initial data error:', err);
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => debouncedFetchInitialData(), 2000 * (retryCount + 1));
      } else {
        managedToast({ id: 'fetch-error', title: 'Error', description: err.message || 'Unable to fetch data.', status: 'error', duration: 5000, isClosable: true });
      }
    });
  }, 1000), [dispatch, managedToast, retryCount]);

  useEffect(() => {
    const token = localStorage.getItem('access-token');
    if (!token) {
      managedToast({ id: 'auth-error', title: 'Authentication Required', description: 'Please log in.', status: 'error', duration: 3000, isClosable: true });
      navigate('/');
      return;
    }
    if (!hasFetchedInitially) {
      debouncedFetchInitialData();
    }
  }, [dispatch, managedToast, navigate, hasFetchedInitially, debouncedFetchInitialData]);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarCollapsed(true);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access-token');
    if (!token) return;
    const socket = io(BASE_URL, { auth: { token }, reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 1000 });
    const joinedRooms = new Set();

    socket.on('connect', () => {
      if (userDetails?._id && !joinedRooms.has(userDetails._id)) {
        socket.emit('join-room', userDetails._id);
        joinedRooms.add(userDetails._id);
      }
      if (Array.isArray(transactions)) {
        transactions.forEach(t => {
          const room = `transaction_${t._id}`;
          if (!joinedRooms.has(room)) {
            socket.emit('join-room', room);
            joinedRooms.add(room);
          }
        });
      }
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket error:', err);
      managedToast({ id: 'socket-error', title: 'Connection Error', description: 'Failed to connect. Retrying...', status: 'warning', duration: 5000, isClosable: true });
    });

    socket.on('transactionCreated', (data) => {
      if (data?.userId === userDetails?._id || data?.participants?.includes(userDetails?._id)) {
        managedToast({ id: `transaction-created-${Date.now()}`, title: 'New Transaction', description: 'A new transaction was created.', status: 'success', duration: 5000, isClosable: true });
        debouncedFetchInitialData();
      }
    });

    socket.on('transactionCompleted', (data) => {
      if (Array.isArray(transactions) && transactions.some(t => t._id === data?.transactionId)) {
        managedToast({ id: `transaction-completed-${data.transactionId || Date.now()}`, title: 'Transaction Completed', description: 'A transaction was completed.', status: 'success', duration: 5000, isClosable: true });
        debouncedFetchInitialData();
      }
    });

    socket.on('balanceUpdate', (data) => {
      if (data?.userId === userDetails?._id) {
        managedToast({ id: `balance-update-${Date.now()}`, title: 'Balance Updated', description: 'Your wallet balance updated.', status: 'info', duration: 5000, isClosable: true });
        debouncedFetchInitialData();
      }
    });

    socket.on('transactionUpdated', (data) => {
      if (Array.isArray(transactions) && transactions.some(t => t._id === data?.transactionId)) {
        managedToast({ id: `transaction-updated-${data.transactionId || Date.now()}`, title: 'Transaction Updated', description: data.message || 'Transaction details updated.', status: 'info', duration: 5000, isClosable: true });
        debouncedFetchInitialData();
      }
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('transactionCreated');
      socket.off('transactionCompleted');
      socket.off('balanceUpdate');
      socket.off('transactionUpdated');
      socket.disconnect();
    };
  }, [userDetails?._id, transactions, debouncedFetchInitialData, managedToast]);

  const debouncedSearch = useCallback(debounce((value) => setSearchQuery(value), 300), []);

  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    const query = searchQuery.toLowerCase().trim();
    return transactions.filter(t => {
      if (activeTab === 'active' && t.status !== 'pending') return false;
      if (activeTab === 'completed' && t.status !== 'completed') return false;
      if (activeTab === 'cancelled' && t.status !== 'cancelled') return false;
      const participantName = t.participants?.length > 0
        ? `${t.participants[0]?.firstName || ''} ${t.participants[0]?.lastName || ''}`.trim().toLowerCase() || t.participants[0]?.email?.toLowerCase() || ''
        : t.userId?.email?.toLowerCase() || '';
      return (
        participantName.includes(query) ||
        (t.productDetails?.description?.toLowerCase() || '').includes(query) ||
        (t.paymentName?.toLowerCase() || '').includes(query) ||
        t._id.toLowerCase().includes(query) ||
        (t.email?.toLowerCase() || '').includes(query)
      );
    });
  }, [transactions, activeTab, searchQuery]);

  const handleChat = async (transactionId) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/transactions/create-chatroom`, { transactionId }, { headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` } });
      if (res.data?.success && res.data.chatroomId) {
        navigate(`/chat/${res.data.chatroomId}`);
      } else {
        throw new Error('Failed to create chatroom');
      }
    } catch (error) {
      managedToast({ id: `chat-error-${transactionId}`, title: 'Error', description: error.response?.data?.error || error.message, status: 'error', duration: 5000, isClosable: true });
    }
  };

  const handleWaybill = (transactionId, isBuyer) => {
    const transaction = transactions.find(t => t._id === transactionId);
    if (!isBuyer && !transaction?.locked) {
      managedToast({
        id: `waybill-error-${transactionId}`,
        title: 'Action Restricted',
        description: 'Seller cannot fill or carry out waybill until buyer has funded the transaction.',
        status: 'warning',
        duration: 5000,
        isClosable: true
      });
      return;
    }
    if (isBuyer) {
      setBuyerShowWaybillPopup(prev => ({ ...prev, [transactionId]: true }));
      fetchBuyerWaybillDetails(transactionId);
    } else {
      setShowWaybillPopup(prev => ({ ...prev, [transactionId]: true }));
      setWaybillDetails(prev => ({
        ...prev,
        item: transaction?.productDetails?.description || ''
      }));
    }
  };

  const fetchBuyerWaybillDetails = async (transactionId) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/transactions/waybill-details/${transactionId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("access-token")}` } });
      if (res.data?.success && res.data.data) {
        setBuyerWaybillDetails(prev => ({ ...prev, [transactionId]: res.data.data }));
      } else {
        throw new Error(res.data.error || "No waybill details found");
      }
    } catch (error) {
      managedToast({ id: `waybill-fetch-error-${transactionId}`, title: "Error", description: error.response?.data?.error || error.message, status: "error", duration: 5000, isClosable: true });
    }
  };

  const handleWaybillSubmit = async (transactionId) => {
    const newErrors = {};
    ["item", "shippingAddress", "trackingNumber", "deliveryDate", "image"].forEach(key => {
      if (!waybillDetails[key]) newErrors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    const formData = new FormData();
    formData.append("transactionId", transactionId);
    Object.entries(waybillDetails).forEach(([key, value]) => value && formData.append(key, value));
    try {
      const response = await axios.post(`${BASE_URL}/api/transactions/submit-waybill`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("access-token")}` },
      });
      if (response.data.success) {
        managedToast({ id: `waybill-success-${transactionId}`, title: "Waybill Submitted", status: "success", duration: 3000, isClosable: true });
        setShowWaybillPopup(prev => ({ ...prev, [transactionId]: false }));
        setWaybillDetails({ item: "", image: null, shippingAddress: "", trackingNumber: "", deliveryDate: "" });
        dispatch(fetchInitialData());
      } else {
        throw new Error(response.data.error || "Failed to submit waybill");
      }
    } catch (error) {
      managedToast({ id: `waybill-error-${transactionId}`, title: "Error", description: error.response?.data?.error || error.message, status: "error", duration: 5000, isClosable: true });
    }
  };

  const downloadImage = (url) => {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = url.split("/").pop() || "waybill-image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cancelTransactionAction = async (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
    try {
      const response = await dispatch(cancelTransaction(transactionId)).unwrap();
      managedToast({ id: `cancel-success-${transactionId}`, title: 'Cancelled', description: response.refunded > 0 ? `Refunded ₦${response.refunded.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : 'No funds refunded.', status: 'success', duration: 5000, isClosable: true });
    } catch (error) {
      managedToast({ id: `cancel-error-${transactionId}`, title: 'Error', description: error.message || 'Failed to cancel', status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  const handleConfirm = async (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
    const transaction = transactions.find(t => t._id === transactionId);
    if (!transaction || !transaction.participants?.length || transaction.status !== 'pending') {
      managedToast({ id: `confirm-error-${transactionId}`, title: 'Error', description: !transaction ? 'Transaction not found' : !transaction.participants?.length ? 'No participant' : 'Only pending transactions can be confirmed', status: 'error', duration: 5000, isClosable: true });
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
      return;
    }

    const isCreator = userDetails?._id === transaction.userId._id.toString();
    const isBuyer = (isCreator && transaction.selectedUserType === 'buyer') ||
      (!isCreator && transaction.selectedUserType === 'seller');

    if (isBuyer && !transaction.locked) {
      try {
        const amount = parseFloat(transaction.paymentAmount);
        if (isNaN(amount)) throw new Error('Invalid payment amount');
        if (walletBalance >= amount) {
          await dispatch(fundTransaction({ transactionId: transaction._id, amount })).unwrap();
          managedToast({ id: `fund-success-${transaction._id}`, title: 'Funded', description: 'Funded from wallet.', status: 'success', duration: 5000, isClosable: true });
        } else {
          setCurrentTransaction(transaction);
          openFundingModal();
          setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
          return;
        }
      } catch (error) {
        managedToast({ id: `fund-error-${transaction._id}`, title: 'Error', description: error.message || 'Failed to fund', status: 'error', duration: 5000, isClosable: true });
        setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
        return;
      }
    }

    setSelectedTransactionId(transactionId);
    setModalVisible(true);
    setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
  };

  const completeTransaction = async (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
    try {
      const transaction = await dispatch(confirmTransaction(transactionId)).unwrap();
      managedToast({
        id: `confirm-success-${transactionId}`,
        title: transaction.status === 'completed' ? 'Completed' : 'Confirmation Recorded',
        description: transaction.status === 'completed' ? 'Funds released.' : 'Waiting for other party.',
        status: transaction.status === 'completed' ? 'success' : 'info',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      if (error.message.includes('Insufficient funds')) {
        const transaction = transactions.find(t => t._id === transactionId);
        setCurrentTransaction(transaction);
        openFundingModal();
      } else {
        managedToast({
          id: `confirm-error-${transactionId}`,
          title: 'Error',
          description: error.message || 'Failed to confirm',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    } finally {
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
      setModalVisible(false);
      setSelectedTransactionId(null);
    }
  };

  const handleFund = async (transaction) => {
    if (!transaction || !transaction._id || transaction.locked || !transaction.paymentAmount || parseFloat(transaction.paymentAmount) <= 0) {
      managedToast({ id: `fund-error-${transaction?._id || 'unknown'}`, title: 'Error', description: 'Invalid transaction.', status: 'error', duration: 5000, isClosable: true });
      return;
    }
    try {
      setIsConfirming(prev => ({ ...prev, [transaction._id]: true }));
      const amount = parseFloat(transaction.paymentAmount);
      if (isNaN(amount)) throw new Error('Invalid payment amount');
      if ((walletBalance ?? 0) >= amount) {
        await dispatch(fundTransaction({ transactionId: transaction._id, amount })).unwrap();
        managedToast({ id: `fund-success-${transaction._id}`, title: 'Funded', description: 'Funded from wallet.', status: 'success', duration: 5000, isClosable: true });
      } else {
        setCurrentTransaction(transaction);
        openFundingModal();
      }
    } catch (error) {
      managedToast({ id: `fund-error-${transaction._id}`, title: 'Error', description: error.message || 'Failed to fund', status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsConfirming(prev => ({ ...prev, [transaction._id]: false }));
    }
  };

  const confirmFunding = async (transaction) => {
    if (!transaction || !transaction.paymentAmount) {
      managedToast({ id: `fund-error-${transaction?._id || 'unknown'}`, title: 'Error', description: 'Invalid transaction.', status: 'error', duration: 5000, isClosable: true });
      closeFundingModal();
      return;
    }
    try {
      const amount = parseFloat(transaction.paymentAmount);
      const shortfall = Math.max(amount - (walletBalance ?? 0), 0);
      const fundingAmount = Math.ceil(shortfall * 100) / 100;
      const response = await axios.post(`${BASE_URL}/api/wallet/fund`, { amount: fundingAmount, email: userDetails?.email || '', phoneNumber: userDetails?.phoneNumber || '', transactionId: transaction._id }, { headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` } });
      if (response.data?.success && response.data.data?.authorization_url) {
        window.location.href = response.data.data.authorization_url;
      } else {
        throw new Error('Failed to initiate funding');
      }
    } catch (error) {
      managedToast({ id: `fund-error-${transaction._id}`, title: 'Error', description: error.response?.data?.error || error.message, status: 'error', duration: 5000, isClosable: true });
    } finally {
      closeFundingModal();
    }
  };

  const handleEditPayment = (transaction) => {
    if (!transaction) return;
    setCurrentTransaction(transaction);
    setPaymentDetails({ paymentAmount: transaction.paymentAmount || "" });
    setShowPaymentDetailsModal(true);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentDetails.paymentAmount || parseFloat(paymentDetails.paymentAmount) <= 0) {
      setPaymentErrors({ paymentAmount: "Amount must be greater than zero" });
      return;
    }
    dispatch(updateTransaction({ transactionId: currentTransaction._id, data: { paymentAmount: parseFloat(paymentDetails.paymentAmount) } })).unwrap()
      .then(() => {
        managedToast({ id: `payment-success-${currentTransaction._id}`, title: 'Updated', description: `Amount set to ₦${parseFloat(paymentDetails.paymentAmount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, status: 'success', duration: 3000, isClosable: true });
        setShowPaymentDetailsModal(false);
        setCurrentTransaction(null);
        setPaymentDetails({ paymentAmount: "" });
        setPaymentErrors({});
      })
      .catch(error => {
        managedToast({ id: `payment-error-${currentTransaction._id}`, title: 'Error', description: error.message || 'Failed to update', status: 'error', duration: 5000, isClosable: true });
      });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() =>
      managedToast({ id: `copy-${text}`, title: 'Copied', status: 'success', duration: 2000, isClosable: true })
    );
  };

  const toggleDescription = (transactionId) => {
    setExpandedDescriptions(prev => ({ ...prev, [transactionId]: !prev[transactionId] }));
  };

  return (
    <Flex minH="100vh" bg={bgColor} direction={{ base: "column", md: "row" }}>
      <Sidebar onShowProfile={() => setShowProfile(true)} onShowToggleComponent={() => setShowProfile(false)} onCollapseChange={setIsSidebarCollapsed} />
      <Box flex={1} p={{ base: 4, md: 6 }} mt={{ base: "80px", md: 0 }} ml={{ base: 0, md: isSidebarCollapsed ? "80px" : "280px" }} overflowY="auto">
        {!showProfile ? (
          <Box maxW="1400px" mx="auto">
            <MiniNav />
            <Flex
              justify="space-between"
              align="start"
              mb={6}
              mt={{ base: 10, md: 20 }}
              flexDir={{ base: "row", md: "row" }}
              gap={4}
            >
              <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="600" color={textColor}>Transactions</Text>
              <Button
                size="md"
                bg="#B38939"
                color="white"
                _hover={{ bg: "#967532" }}
                isLoading={transactionsLoading || walletLoading || userLoading}
                onClick={() => dispatch(fetchInitialData())}
              >
                Refresh
              </Button>
            </Flex>

            <Flex flexDir={{ base: "column", md: "row" }} gap={4} mb={6} mt={6}>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                {["all", "active", "completed", "cancelled", "wallet"].map(tab => (
                  <Button
                    key={tab}
                    size="md"
                    bg={activeTab === tab ? "#8a6d27" : useColorModeValue('gray.200', 'gray.700')}
                    color={activeTab === tab ? "white" : textColor}
                    _hover={{ bg: activeTab === tab ? "#8a6d27" : useColorModeValue('gray.300', 'gray.600') }}
                    onClick={() => setActiveTab(tab)}
                    fontWeight="500"
                    rounded="lg"
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === "wallet" ? (Array.isArray(walletTransactions) ? walletTransactions.length : 0) : tab === "all" ? (Array.isArray(transactions) ? transactions.length : 0) : (Array.isArray(transactions) ? transactions.filter(t => tab === "active" ? t.status === "pending" : t.status === tab).length : 0)})
                  </Button>
                ))}
              </Stack>
              <Box pos="relative" w={{ base: "100%", md: "300px", lg: "360px" }} maxW="100%">
                <Flex align="center" bg={cardBg} border="1px" borderColor={borderColor} rounded="lg" px={3} py={2} _focusWithin={{ borderColor: "#BB954D", boxShadow: "0 0 0 1px #BB954D" }}>
                  <FiSearch color={subtleTextColor} size={16} />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => debouncedSearch(e.target.value)}
                    bg="transparent"
                    border="none"
                    color={textColor}
                    fontSize="sm"
                    pl={2}
                    _focus={{ outline: "none" }}
                    _placeholder={{ color: subtleTextColor }}
                  />
                  {searchQuery && (
                    <IconButton
                      aria-label="Clear search"
                      icon={<MdClose />}
                      size="xs"
                      bg="transparent"
                      color={subtleTextColor}
                      _hover={{ color: textColor }}
                      onClick={() => setSearchQuery("")}
                    />
                  )}
                </Flex>
              </Box>
            </Flex>

            {(transactionsLoading || walletLoading || userLoading) ? (
              <TransactionLoader />
            ) : transactionsError ? (
              <Flex direction="column" align="center" justify="center" py={8}>
                <Text fontSize="2xl" color={subtleTextColor}>⚠️</Text>
                <Text color={subtleTextColor} fontSize="md" textAlign="center">Failed to load: {transactionsError}</Text>
                <Button mt={4} size="md" bg="#BB954D" color="white" _hover={{ bg: "#967532" }} onClick={() => dispatch(fetchInitialData())}>Retry</Button>
              </Flex>
            ) : activeTab === "wallet" ? (
              <Box bg={cardBg} p={4} rounded="lg" border="1px" borderColor={borderColor}>
                <Text fontSize="lg" fontWeight="600" color={textColor} mb={3}>Wallet History</Text>
                {!Array.isArray(walletTransactions) || walletTransactions.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" py={8}>
                    <Text fontSize="2xl" color={subtleTextColor}>💳</Text>
                    <Text color={subtleTextColor} fontSize="sm">No wallet transactions.</Text>
                  </Flex>
                ) : (
                  <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
                    {walletTransactions.map((tx, idx) => (
                      <Box key={`${tx.reference}-${tx.createdAt}-${idx}`} p={3} bg={inputBg} rounded="lg" border="1px" borderColor={borderColor}>
                        <Text color={textColor} fontSize="sm" isTruncated>{tx.reference || "N/A"}</Text>
                        <Text color={tx.type === "deposit" ? "#22c55e" : "#ef4444"} fontSize="sm" fontWeight="600">{tx.type === "deposit" ? "+" : "-"} ₦{(tx.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
                        <Text color={subtleTextColor} fontSize="xs">Purpose: {tx.metadata?.purpose || "N/A"}</Text>
                        <Text color={subtleTextColor} fontSize="xs">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "N/A"}</Text>
                      </Box>
                    ))}
                  </Grid>
                )}
              </Box>
            ) : filteredTransactions.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py={8}>
                <Text fontSize="2xl" color={subtleTextColor}>📭</Text>
                <Text color={subtleTextColor} fontSize="md" textAlign="center">{searchQuery ? "No matches found." : `No ${activeTab} transactions.`}</Text>
                <Button mt={4} size="md" bg="#BB954D" color="white" _hover={{ bg: "#967532" }} onClick={() => dispatch(fetchInitialData())}>Retry</Button>
              </Flex>
            ) : (
              <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
                {filteredTransactions.map(transaction => (
                  <TransactionCard
                    key={transaction._id}
                    transaction={transaction}
                    currentUser={userDetails}
                    isConfirming={isConfirming}
                    handleChat={handleChat}
                    handleWaybill={handleWaybill}
                    handleConfirm={handleConfirm}
                    handleFund={handleFund}
                    handleEditPayment={handleEditPayment}
                    cancelTransaction={cancelTransactionAction}
                    copyToClipboard={copyToClipboard}
                    toggleDescription={toggleDescription}
                    expandedDescriptions={expandedDescriptions}
                  />
                ))}
              </Grid>
            )}
          </Box>
        ) : (
          <Box maxW="1400px" mx="auto">
            <Text fontSize="2xl" fontWeight="600" color={textColor} mb={4}>Profile</Text>
          </Box>
        )}

        {Object.entries(showWaybillPopup).map(([transactionId, isOpen]) => isOpen && (
          <WaybillModal
            key={`seller-${transactionId}`}
            isOpen={isOpen}
            onClose={() => setShowWaybillPopup(prev => ({ ...prev, [transactionId]: false }))}
            transactionId={transactionId}
            isBuyer={false}
            details={waybillDetails}
            setDetails={setWaybillDetails}
            errors={errors}
            handleSubmit={handleWaybillSubmit}
            downloadImage={downloadImage}
            isFunded={transactions.find(t => t._id === transactionId)?.locked}
          />
        ))}

        {Object.entries(buyerShowWaybillPopup).map(([transactionId, isOpen]) => isOpen && (
          <WaybillModal
            key={`buyer-${transactionId}`}
            isOpen={isOpen}
            onClose={() => setBuyerShowWaybillPopup(prev => ({ ...prev, [transactionId]: false }))}
            transactionId={transactionId}
            isBuyer={true}
            details={buyerWaybillDetails[transactionId] || {}}
            setDetails={setBuyerWaybillDetails}
            errors={errors}
            handleSubmit={() => { }}
            downloadImage={downloadImage}
            isFunded={true}
          />
        ))}

        {showPaymentDetailsModal && currentTransaction && (
          <PaymentDetailsModal
            isOpen={showPaymentDetailsModal}
            onClose={() => { setShowPaymentDetailsModal(false); setCurrentTransaction(null); setPaymentDetails({ paymentAmount: "" }); setPaymentErrors({}); }}
            transaction={currentTransaction}
            paymentDetails={paymentDetails}
            setPaymentDetails={setPaymentDetails}
            paymentErrors={paymentErrors}
            handleSubmit={handlePaymentSubmit}
          />
        )}

        {isFundingModalOpen && currentTransaction && (
          <FundingModal
            isOpen={isFundingModalOpen}
            onClose={() => { closeFundingModal(); setCurrentTransaction(null); }}
            transaction={currentTransaction}
            walletBalance={walletBalance}
            confirmFunding={confirmFunding}
          />
        )}

        <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)} isCentered size="sm">
          <ModalOverlay />
          <ModalContent bg={cardBg} color={textColor} p={4} rounded="lg" border="1px" borderColor={borderColor}>
            <ModalHeader fontSize="lg" fontWeight="600">Confirm Transaction</ModalHeader>
            <ModalBody>
              <Text fontSize="sm" color={subtleTextColor}>Are you sure? This cannot be undone.</Text>
            </ModalBody>
            <ModalFooter>
              <Flex gap={3} w="full">
                <Button size="sm" bg={useColorModeValue('gray.200', 'gray.600')} color={textColor} _hover={{ bg: useColorModeValue('gray.300', 'gray.700') }} onClick={() => setModalVisible(false)}>Cancel</Button>
                <Button size="sm" bg="#BB954D" color="white" _hover={{ bg: "#967532" }} onClick={() => completeTransaction(selectedTransactionId)} isLoading={isConfirming[selectedTransactionId]}>Confirm</Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};

export default DisplayTransaction;