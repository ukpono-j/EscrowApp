import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Box, Flex, Text, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Grid, Stack, Input, IconButton, Image, Spinner, useDisclosure
} from '@chakra-ui/react';
import { FiSearch, FiEdit } from 'react-icons/fi';
import { BsChatFill } from 'react-icons/bs';
import { MdClose, MdContentCopy } from 'react-icons/md';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchInitialData, updateTransaction, confirmTransaction, fundTransaction, cancelTransaction
} from '../../store/slices/thunks';
import { useManagedToast } from '../../utils/toastManager';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
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

const TransactionLoader = () => (
  <Flex direction="column" align="center" justify="center" h={{ base: "40vh", md: "60vh" }} py={8}>
    <Spinner color="#318AE6" size="xl" mb={4} />
    <Text color="#E4E4E4" fontSize={{ base: "sm", md: "lg" }} fontWeight="medium" textAlign="center">
      Loading transactions...
    </Text>
  </Flex>
);

const TransactionCard = React.memo(({ transaction, currentUser, isConfirming, handleChat, handleWaybill, handleConfirm, handleFund, handleEditPayment, cancelTransaction, copyToClipboard, toggleDescription, expandedDescriptions }) => {
  const currentUserId = currentUser?._id?.toString() || '';
  const creatorId = transaction?.userId?._id?.toString() || '';
  const isCreator = currentUserId === creatorId;
  const isParticipant = currentUserId && transaction?.participants?.some(p => p?._id?.toString() === currentUserId) || false;
  const userRole = transaction?.userRole || (isCreator ? transaction?.selectedUserType : transaction?.selectedUserType === "buyer" ? "seller" : "buyer");
  const isBuyer = userRole === "buyer";
  const displayName = transaction?.participants?.length > 0 && transaction.participants[0]
    ? (isCreator ? `${transaction.participants[0].firstName || ""} ${transaction.participants[0].lastName || ""}`.trim() || transaction.participants[0].email || "Unknown participant"
      : `${transaction.userId.firstName || ""} ${transaction.userId.lastName || ""}`.trim() || transaction.userId.email || "Unknown creator")
    : "No participant yet";
  const description = transaction?.productDetails?.description || "No description provided";
  const isExpanded = expandedDescriptions[transaction._id];
  const truncatedDescription = description.length > 100 && !isExpanded ? `${description.substring(0, 100)}...` : description;

  return (
    <MotionBox
      bg="#111518"
      rounded="lg"
      border="1px"
      borderColor="rgba(49, 138, 230, 0.3)"
      p={4}
      w="100%"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      _hover={{ borderColor: "#318AE6" }}
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Text fontSize="md" fontWeight="600" color="white">{displayName}</Text>
          <Text fontSize="xs" color="gray.500" fontWeight="500" textTransform="uppercase">{userRole} Transaction</Text>
        </Box>
        <Flex gap={2}>
          <IconButton aria-label="Edit payment" icon={<FiEdit />} size="xs" color="gray.400" _hover={{ color: "#967532" }} onClick={() => handleEditPayment(transaction)} />
          <IconButton aria-label="Open chat" icon={<BsChatFill />} size="xs" color="gray.400" _hover={{ color: "#318AE6" }} onClick={() => handleChat(transaction._id)} />
        </Flex>
      </Flex>

      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Text fontSize="xs" color="gray.500" fontWeight="500" textTransform="uppercase">Amount</Text>
          <Text fontSize="xl" color="#318AE6" fontWeight="700">
            {transaction.paymentAmount ? `₦${parseFloat(transaction.paymentAmount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "N/A"}
          </Text>
        </Box>
        <Stack spacing={2} align="flex-end">
          <Text bg={transaction.status === "completed" ? "rgba(34, 197, 94, 0.15)" : transaction.status === "cancelled" ? "rgba(239, 68, 68, 0.15)" : "rgba(234, 179, 8, 0.15)"}
               color={transaction.status === "completed" ? "#22c55e" : transaction.status === "cancelled" ? "#ef4444" : "#eab308"}
               px={2} py={1} rounded="md" fontSize="xs" fontWeight="600" textTransform="uppercase">
            {transaction.status}
          </Text>
          <Text bg={transaction.proofOfWaybill === "confirmed" ? "rgba(34, 197, 94, 0.15)" : "rgba(234, 179, 8, 0.15)"}
               color={transaction.proofOfWaybill === "confirmed" ? "#22c55e" : "#eab308"}
               px={2} py={1} rounded="md" fontSize="xs" fontWeight="600" textTransform="uppercase">
            {transaction.proofOfWaybill || "Pending"}
          </Text>
        </Stack>
      </Flex>

      <Box bg="rgba(29, 34, 37, 0.5)" rounded="md" p={3} mb={4} border="1px" borderColor="rgba(255, 255, 255, 0.05)">
        <Text fontSize="xs" color="gray.500" fontWeight="500" textTransform="uppercase">Escrow Status</Text>
        <Text fontSize="sm" color={transaction.locked && transaction.status !== "completed" ? "#eab308" : transaction.status === "completed" ? "#22c55e" : "gray.400"} fontWeight="600">
          {transaction.locked && transaction.status !== "completed"
            ? `Locked: ₦${parseFloat(transaction.lockedAmount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
            : transaction.status === "completed"
              ? `Released: ₦${parseFloat(transaction.paymentAmount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
              : "Not Locked"}
        </Text>
      </Box>

      <Grid templateColumns="1fr 1fr" gap={4} mb={4}>
        {[
          { label: "Contact", value: transaction.email || "N/A" },
          { label: "Created", value: transaction.createdAt ? format(new Date(transaction.createdAt), "MMM dd, yyyy") : "N/A" },
          { label: "Bank", value: transaction.paymentBank || "N/A" },
          { label: "Account", value: transaction.paymentAccountNumber || "N/A" }
        ].map(({ label, value }, idx) => (
          <Box key={idx}>
            <Text fontSize="xs" color="gray.500" fontWeight="500">{label}</Text>
            <Text fontSize="sm" color="white" fontWeight="500" fontFamily={label === "Account" ? "mono" : "inherit"}>{value}</Text>
          </Box>
        ))}
      </Grid>

      <Box bg="rgba(29, 34, 37, 0.5)" rounded="md" p={3} mb={4} border="1px" borderColor="rgba(255, 255, 255, 0.05)">
        <Text fontSize="xs" color="gray.500" fontWeight="500">Transaction ID</Text>
        <Flex align="center" gap={2}>
          <Text fontSize="xs" color="gray.300" fontFamily="mono" fontWeight="500" flex="1" wordBreak="break-all">{transaction._id}</Text>
          <IconButton aria-label="Copy ID" icon={<MdContentCopy />} size="xs" color="gray.500" _hover={{ color: "#318AE6" }} onClick={() => copyToClipboard(transaction._id)} />
        </Flex>
      </Box>

      <Box mb={4}>
        <Text fontSize="xs" color="gray.500" fontWeight="500">Description</Text>
        <Box bg="rgba(29, 34, 37, 0.5)" rounded="md" p={3} border="1px" borderColor="rgba(255, 255, 255, 0.05)">
          <Text fontSize="sm" color="white" whiteSpace="pre-wrap" cursor={description.length > 100 ? "pointer" : "default"} onClick={() => description.length > 100 && toggleDescription(transaction._id)} lineHeight="1.5" wordBreak="break-word">
            {truncatedDescription}
          </Text>
          {description.length > 100 && (
            <Text fontSize="xs" color="#318AE6" mt={2} cursor="pointer" onClick={() => toggleDescription(transaction._id)} _hover={{ textDecoration: "underline" }} fontWeight="500">
              {isExpanded ? "Show less" : "Read more"}
            </Text>
          )}
        </Box>
      </Box>

      <Stack spacing={2}>
        <Button onClick={() => handleWaybill(transaction._id, isBuyer)} bg="#318AE6" color="white" _hover={{ bg: "#2279d8" }} size="sm" fontSize="sm" fontWeight="600" rounded="md" leftIcon={<BsChatFill size="14" />}>
          {isBuyer ? "View Waybill" : "Submit Waybill"}
        </Button>
        {transaction.status === "pending" && (
          <Button onClick={() => handleConfirm(transaction._id)} bg="rgba(34, 197, 94, 0.9)" color="white" _hover={{ bg: "#22c55e" }} size="sm" fontSize="sm" fontWeight="600" rounded="md" isLoading={isConfirming[transaction._id]} loadingText="Completing...">
            Complete Transaction
          </Button>
        )}
        {isBuyer && !transaction.locked && transaction.status === "pending" && (
          <Button onClick={() => handleFund(transaction)} bg="#967532" color="white" _hover={{ bg: "#7a5c28" }} size="sm" fontSize="sm" fontWeight="600" rounded="md" isLoading={isConfirming[transaction._id]} loadingText="Processing...">
            Fund Transaction
          </Button>
        )}
        <Button onClick={() => cancelTransaction(transaction._id)} variant="outline" borderColor="rgba(239, 68, 68, 0.3)" color="#ef4444" _hover={{ bg: "rgba(239, 68, 68, 0.1)", borderColor: "#ef4444" }} size="sm" fontSize="sm" fontWeight="600" rounded="md" isLoading={isConfirming[transaction._id]} loadingText="Cancelling...">
          Cancel Transaction
        </Button>
      </Stack>
    </MotionBox>
  );
});

const WaybillModal = React.memo(({ isOpen, onClose, transactionId, isBuyer, details, setDetails, errors, handleSubmit, downloadImage }) => (
  <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "lg" }} scrollBehavior="inside">
    <ModalOverlay />
    <ModalContent bg="#1A1E21" color="white" p={{ base: 4, sm: 6 }} rounded="xl" maxH="90vh">
      <ModalHeader p={0} mb={4}>
        <Text fontSize={{ base: "lg", sm: "xl" }} fontWeight="bold" textAlign="center">{isBuyer ? "Waybill Details" : "Seller Waybill Proof"}</Text>
        {!isBuyer && <Text fontSize={{ base: "sm", sm: "md" }} textAlign="center" color="gray.300" mt={2}>I, the seller, confirm that I have shipped the goods.</Text>}
      </ModalHeader>
      <ModalBody p={0}>
        {isBuyer ? (
          <Stack spacing={4} color="gray.300">
            {[
              { label: "Item", value: details.item || "N/A" },
              { label: "Price", value: details.price ? `₦${parseFloat(details.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "N/A" },
              { label: "Shipping Address", value: details.shippingAddress || "N/A" },
              { label: "Tracking Number", value: details.trackingNumber || "N/A" },
              { label: "Delivery Date", value: details.deliveryDate ? format(new Date(details.deliveryDate), "MMM dd, yyyy") : "N/A" },
            ].map(({ label, value }, idx) => (
              <Box key={idx} bg="#111518" p={4} rounded="md">
                <Text fontSize={{ base: "xs", sm: "sm" }} mb={2} color="gray.400" fontWeight="medium">{label}:</Text>
                <Text fontSize={{ base: "sm", sm: "md" }} color="white">{value}</Text>
              </Box>
            ))}
            <Box bg="#111518" p={4} rounded="md">
              <Text fontSize={{ base: "xs", sm: "sm" }} mb={2} color="gray.400" fontWeight="medium">Image:</Text>
              {details.image ? (
                <Flex direction="column" align="center" gap={3}>
                  <Image src={details.image} alt="Waybill Proof" maxW="100%" maxH="300px" rounded="lg" objectFit="contain" />
                  <Button bg="#318AE6" color="white" _hover={{ bg: "#2279d8" }} size={{ base: "sm", sm: "md" }} onClick={() => downloadImage(details.image)}>Download Image</Button>
                </Flex>
              ) : (
                <Text fontSize={{ base: "sm", sm: "md" }} color="gray.400">No image provided</Text>
              )}
            </Box>
          </Stack>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(transactionId); }}>
            <Stack spacing={4}>
              {[
                { label: "Item", key: "item", type: "text" },
                { label: "Price", key: "price", type: "number" },
                { label: "Shipping Address", key: "shippingAddress", type: "text" },
                { label: "Tracking Number", key: "trackingNumber", type: "text" },
                { label: "Delivery Date", key: "deliveryDate", type: "date" },
              ].map(({ label, key, type }) => (
                <Box key={key} w="full">
                  <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300" mb={2} fontWeight="medium">{label}:</Text>
                  <Input type={type} value={details[key] || ""} onChange={(e) => setDetails({ ...details, [key]: e.target.value })} bg="#111518" borderColor="#318AE6" color="white" fontSize={{ base: "sm", sm: "md" }} _focus={{ borderColor: "#318AE6", boxShadow: "0 0 0 1px #318AE6" }} />
                  {errors[key] && <Text color="red.500" fontSize={{ base: "xs", sm: "sm" }} mt={1}>{errors[key]}</Text>}
                </Box>
              ))}
              <Box w="full">
                <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300" mb={2} fontWeight="medium">Image:</Text>
                <Box border="2px dashed" borderColor="#318AE6" rounded="lg" p={6} textAlign="center" bg="#111518" _hover={{ bg: "#1a1f23" }}>
                  <Input type="file" id={`waybill-image-${transactionId}`} accept="image/*" onChange={(e) => setDetails({ ...details, image: e.target.files[0] })} display="none" />
                  <label htmlFor={`waybill-image-${transactionId}`} style={{ cursor: 'pointer' }}>
                    <Stack spacing={3}>
                      <Text fontSize="3xl" color="#318AE6">📷</Text>
                      <Text fontSize={{ base: "sm", sm: "md" }} color="gray.300">Click to upload proof of shipment</Text>
                    </Stack>
                  </label>
                  {details.image && <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300" mt={2}>Selected: {details.image.name}</Text>}
                </Box>
                {errors.image && <Text color="red.500" fontSize={{ base: "xs", sm: "sm" }} mt={1}>{errors.image}</Text>}
              </Box>
            </Stack>
          </form>
        )}
      </ModalBody>
      <ModalFooter p={0} pt={6}>
        <Stack direction={{ base: "column", sm: "row" }} spacing={3} w="full" justify="flex-end">
          <Button bg="gray.600" color="white" _hover={{ bg: "gray.700" }} size={{ base: "sm", sm: "md" }} onClick={onClose}>Close</Button>
          {!isBuyer && <Button type="submit" bg="#318AE6" color="white" _hover={{ bg: "#2279d8" }} size={{ base: "sm", sm: "md" }} onClick={() => handleSubmit(transactionId)}>Submit</Button>}
        </Stack>
      </ModalFooter>
    </ModalContent>
  </Modal>
));

const PaymentDetailsModal = ({ isOpen, onClose, transaction, paymentDetails, setPaymentDetails, paymentErrors, handleSubmit }) => (
  <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "md" }}>
    <ModalOverlay />
    <ModalContent bg="#1A1E21" color="white" p={{ base: 4, sm: 6 }} rounded="xl">
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize={{ base: "lg", sm: "xl" }} fontWeight="bold">Edit Payment Details</Text>
        <IconButton aria-label="Close modal" icon={<MdClose />} color="gray.400" _hover={{ color: "#318AE6" }} onClick={onClose} bg="transparent" />
      </Flex>
      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          <Box>
            <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300" mb={2} fontWeight="medium">Amount</Text>
            <Input type="number" value={paymentDetails.paymentAmount || ""} onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentAmount: e.target.value })} bg="#111518" borderColor="#318AE6" color="white" fontSize={{ base: "sm", sm: "md" }} _focus={{ borderColor: "#318AE6", boxShadow: "0 0 0 1px #318AE6" }} isDisabled={transaction?.locked} />
            {paymentErrors.paymentAmount && <Text color="red.500" fontSize={{ base: "xs", sm: "sm" }} mt={1}>{paymentErrors.paymentAmount}</Text>}
          </Box>
        </Stack>
        <Stack direction={{ base: "column", sm: "row" }} spacing={3} mt={6} justify="flex-end">
          <Button bg="gray.600" color="white" _hover={{ bg: "gray.700" }} size={{ base: "sm", sm: "md" }} onClick={onClose}>Cancel</Button>
          <Button type="submit" bg="#318AE6" color="white" _hover={{ bg: "#2279d8" }} size={{ base: "sm", sm: "md" }}>Save</Button>
        </Stack>
      </form>
    </ModalContent>
  </Modal>
);

const FundingModal = ({ isOpen, onClose, transaction, walletBalance, confirmFunding }) => (
  <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "md" }}>
    <ModalOverlay />
    <ModalContent bg="#1A1E21" color="white" p={{ base: 4, sm: 6 }} rounded="xl">
      <ModalHeader p={0} mb={4}>
        <Text fontSize={{ base: "lg", sm: "xl" }} fontWeight="bold">Fund Transaction</Text>
      </ModalHeader>
      <ModalBody p={0}>
        <Text fontSize={{ base: "sm", sm: "md" }} color="gray.300" mb={4}>
          Your wallet balance (₦{(walletBalance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}) is insufficient. You need an additional ₦{transaction ? (parseFloat(transaction.paymentAmount || 0) - (walletBalance ?? 0)).toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}. Proceed to fund via Paystack?
        </Text>
      </ModalBody>
      <ModalFooter p={0} pt={4}>
        <Stack direction={{ base: "column", sm: "row" }} spacing={3} w="full" justify="flex-end">
          <Button bg="gray.600" color="white" _hover={{ bg: "gray.700" }} size={{ base: "sm", sm: "md" }} onClick={onClose}>Cancel</Button>
          <Button bg="#318AE6" color="white" _hover={{ bg: "#2279d8" }} size={{ base: "sm", sm: "md" }} onClick={() => confirmFunding(transaction)}>Proceed to Paystack</Button>
        </Stack>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

const DisplayTransaction = () => {
  const dispatch = useDispatch();
  const { userDetails, loading: userLoading, error: userError } = useSelector(state => state.user);
  const { transactions, loading: transactionsLoading } = useSelector(state => state.transactions);
  const { wallet, transactions: walletTransactions, loading: walletLoading } = useSelector(state => state.wallet);
  const walletBalance = wallet?.balance ?? 0;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasFetchedInitially, setHasFetchedInitially] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [waybillDetails, setWaybillDetails] = useState({ item: '', image: null, price: '', shippingAddress: '', trackingNumber: '', deliveryDate: '' });
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
  const managedToast = useManagedToast();
  const navigate = useNavigate();
  const { isOpen: isFundingModalOpen, onOpen: openFundingModal, onClose: closeFundingModal } = useDisclosure();
  const [showWaybillPopup, setShowWaybillPopup] = useState({});
  const [buyerShowWaybillPopup, setBuyerShowWaybillPopup] = useState({});

  const debouncedFetchInitialData = useCallback(debounce(() => {
    dispatch(fetchInitialData()).unwrap().catch(err => {
      managedToast({ id: 'fetch-error', title: 'Data Fetch Error', description: err.message || 'Unable to fetch transactions or wallet data.', status: 'error', duration: 5000, isClosable: true });
    });
  }, 1000), [dispatch, managedToast]);

  useEffect(() => {
    const token = localStorage.getItem('access-token');
    if (!token) {
      managedToast({ id: 'auth-error', title: 'Authentication Required', description: 'Please log in to view transactions.', status: 'error', duration: 3000, isClosable: true });
      navigate('/');
      return;
    }
    if (!hasFetchedInitially) {
      dispatch(fetchInitialData()).unwrap().then(() => setHasFetchedInitially(true)).catch(err => {
        managedToast({ id: 'fetch-error', title: 'Data Fetch Error', description: err.message || 'Unable to fetch transactions or wallet data.', status: 'error', duration: 5000, isClosable: true });
      });
    }
  }, [dispatch, managedToast, navigate, hasFetchedInitially]);

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
      if (hasFetchedInitially && userDetails?._id && !joinedRooms.has(userDetails._id)) {
        socket.emit('join-room', userDetails._id);
        joinedRooms.add(userDetails._id);
      }
      if (hasFetchedInitially && Array.isArray(transactions)) {
        transactions.forEach(t => {
          const room = `transaction_${t._id}`;
          if (!joinedRooms.has(room)) {
            socket.emit('join-room', room);
            joinedRooms.add(room);
          }
        });
      }
    });

    socket.on('transactionCreated', (data) => {
      if (data?.userId === userDetails?._id || data?.participants?.includes(userDetails?._id)) {
        managedToast({ id: 'transaction-created', title: 'New Transaction', description: 'A new transaction has been created.', status: 'success', duration: 5000, isClosable: true });
        debouncedFetchInitialData();
      }
    });

    socket.on('transactionCompleted', (data) => {
      if (Array.isArray(transactions) && transactions.some(t => t._id === data?.transactionId)) {
        managedToast({ id: `transaction-completed-${data.transactionId}`, title: 'Transaction Completed', description: 'A transaction has been completed.', status: 'success', duration: 5000, isClosable: true });
        debouncedFetchInitialData();
      }
    });

    socket.on('balanceUpdate', (data) => {
      if (data?.userId === userDetails?._id) {
        managedToast({ id: 'balance-update', title: 'Balance Updated', description: 'Your wallet balance has been updated.', status: 'info', duration: 5000, isClosable: true });
        debouncedFetchInitialData();
      }
    });

    socket.on('transactionUpdated', (data) => {
      if (Array.isArray(transactions) && transactions.some(t => t._id === data?.transactionId)) {
        managedToast({ id: `transaction-updated-${data.transactionId}`, title: 'Transaction Updated', description: data.message || 'Transaction details updated.', status: 'info', duration: 5000, isClosable: true });
        debouncedFetchInitialData();
      }
    });

    return () => {
      socket.off('transactionCreated');
      socket.off('transactionCompleted');
      socket.off('balanceUpdate');
      socket.off('transactionUpdated');
      socket.disconnect();
    };
  }, [userDetails?._id, transactions, debouncedFetchInitialData, managedToast, hasFetchedInitially]);

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
    if (isBuyer) {
      setBuyerShowWaybillPopup(prev => ({ ...prev, [transactionId]: true }));
      fetchBuyerWaybillDetails(transactionId);
    } else {
      setShowWaybillPopup(prev => ({ ...prev, [transactionId]: true }));
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
    ["item", "price", "shippingAddress", "trackingNumber", "deliveryDate", "image"].forEach(key => {
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
        setWaybillDetails({ item: "", image: null, price: "", shippingAddress: "", trackingNumber: "", deliveryDate: "" });
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
      managedToast({ id: `cancel-success-${transactionId}`, title: 'Transaction Cancelled', description: response.refunded > 0 ? `Funds of ₦${response.refunded.toLocaleString('en-NG', { minimumFractionDigits: 2 })} refunded to wallet.` : 'No funds were locked for this transaction.', status: 'success', duration: 5000, isClosable: true });
    } catch (error) {
      managedToast({ id: `cancel-error-${transactionId}`, title: 'Error', description: error.message || 'Failed to cancel transaction', status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  const handleConfirm = (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
    const transaction = transactions.find(t => t._id === transactionId);
    if (!transaction || !transaction.participants?.length || transaction.status !== 'pending') {
      managedToast({ id: `confirm-error-${transactionId}`, title: 'Error', description: !transaction ? 'Transaction not found' : !transaction.participants?.length ? 'No participant' : 'Only pending transactions can be confirmed', status: 'error', duration: 5000, isClosable: true });
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
      return;
    }
    setSelectedTransactionId(transactionId);
    setModalVisible(true);
    setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
  };

  const completeTransaction = (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
    dispatch(confirmTransaction(transactionId)).unwrap()
      .then(transaction => {
        managedToast({ id: `confirm-success-${transactionId}`, title: transaction.status === 'completed' ? 'Transaction Completed' : 'Confirmation Recorded', description: transaction.status === 'completed' ? 'Funds released to seller.' : 'Waiting for other party.', status: transaction.status === 'completed' ? 'success' : 'info', duration: 5000, isClosable: true });
      })
      .catch(error => {
        managedToast({ id: `confirm-error-${transactionId}`, title: 'Error', description: error.message || 'Failed to confirm transaction', status: 'error', duration: 5000, isClosable: true });
      })
      .finally(() => {
        setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
        setModalVisible(false);
        setSelectedTransactionId(null);
      });
  };

  const handleFund = async (transaction) => {
    if (!transaction || !transaction._id || transaction.locked || !transaction.paymentAmount || parseFloat(transaction.paymentAmount) <= 0) {
      managedToast({ id: `fund-error-${transaction?._id || 'unknown'}`, title: 'Error', description: 'Invalid transaction data.', status: 'error', duration: 5000, isClosable: true });
      return;
    }
    try {
      setIsConfirming(prev => ({ ...prev, [transaction._id]: true }));
      const amount = parseFloat(transaction.paymentAmount);
      if (isNaN(amount)) throw new Error('Invalid payment amount');
      if ((walletBalance ?? 0) >= amount) {
        await dispatch(fundTransaction({ transactionId: transaction._id, amount })).unwrap();
        managedToast({ id: `fund-success-${transaction._id}`, title: 'Transaction Funded', description: 'Funded from wallet balance.', status: 'success', duration: 5000, isClosable: true });
      } else {
        setCurrentTransaction(transaction);
        openFundingModal();
      }
    } catch (error) {
      managedToast({ id: `fund-error-${transaction._id}`, title: 'Error', description: error.message || 'Failed to fund transaction', status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsConfirming(prev => ({ ...prev, [transaction._id]: false }));
    }
  };

  const confirmFunding = async (transaction) => {
    if (!transaction || !transaction.paymentAmount) {
      managedToast({ id: `fund-error-${transaction?._id || 'unknown'}`, title: 'Error', description: 'Invalid transaction data.', status: 'error', duration: 5000, isClosable: true });
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
        throw new Error('Failed to initiate Paystack funding');
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
        managedToast({ id: `payment-success-${currentTransaction._id}`, title: 'Payment Details Updated', description: `Amount updated to ₦${parseFloat(paymentDetails.paymentAmount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`, status: 'success', duration: 3000, isClosable: true });
        setShowPaymentDetailsModal(false);
        setCurrentTransaction(null);
        setPaymentDetails({ paymentAmount: "" });
        setPaymentErrors({});
      })
      .catch(error => {
        managedToast({ id: `payment-error-${currentTransaction._id}`, title: 'Error', description: error.message || 'Failed to update payment details', status: 'error', duration: 5000, isClosable: true });
      });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() =>
      managedToast({ id: `copy-${text}`, title: 'Copied to Clipboard', status: 'success', duration: 2000, isClosable: true })
    );
  };

  const toggleDescription = (transactionId) => {
    setExpandedDescriptions(prev => ({ ...prev, [transactionId]: !prev[transactionId] }));
  };

  return (
    <Flex minH="100vh" bg="#0A0E10" direction={{ base: "column", md: "row" }}>
      <Sidebar onShowProfile={() => setShowProfile(true)} onShowToggleComponent={() => setShowProfile(false)} onCollapseChange={setIsSidebarCollapsed} />
      <Box flex={1} className={`transition-all duration-300 h-screen overflow-y-auto ${isMobile ? "ml-0" : isSidebarCollapsed ? "ml-[80px]" : "ml-[280px]"}`} maxW="100%" overflowX="hidden">
        {!showProfile ? (
          <Box px={{ base: 4, md: 6, lg: 8 }} pt={{ base: "85px", md: "95px" }} pb={{ base: 4, md: 6 }} maxW="100%" mx="auto" overflowX="hidden">
            <MiniNav />
            <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} mb={{ base: 4, md: 6 }} flexDir={{ base: "column", md: "row" }} gap={{ base: 3, sm: 4 }} w="100%">
              <Text fontSize={{ base: "xl", md: "3xl" }} fontWeight="600" color="white">My Transactions</Text>
              <Flex gap={{ base: 2, sm: 3 }} align={{ base: "stretch", sm: "center" }} flexDir={{ base: "column", sm: "row" }} w={{ base: "100%", sm: "auto" }}>
                <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.200" bg="gray.800" px={{ base: 2.5, sm: 3 }} py={{ base: 1.5, sm: 2 }} rounded="md" w={{ base: "100%", sm: "180px" }} fontWeight="500">
                  Balance: {walletLoading ? 'Loading...' : `₦${(walletBalance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
                </Text>
                <Flex gap={{ base: 2, sm: 3 }} w={{ base: "100%", sm: "auto" }}>
                  <Button onClick={() => dispatch(fetchInitialData())} isLoading={transactionsLoading || walletLoading || userLoading} size="sm" bg="#318AE6" color="white" _hover={{ bg: "#2279d8" }} flex={{ base: 1, sm: "0 0 90px" }} fontSize="sm" h="36px" fontWeight="500" rounded="md">Refresh</Button>
                  <Button onClick={() => console.log("Current transactions:", transactions, "Wallet transactions:", walletTransactions)} size="sm" bg="gray.600" color="white" _hover={{ bg: "gray.700" }} flex={{ base: 1, sm: "0 0 90px" }} fontSize="sm" h="36px" fontWeight="500" rounded="md">Debug</Button>
                </Flex>
              </Flex>
            </Flex>

            <Flex flexDir={{ base: "column", lg: "row" }} gap={{ base: 3, sm: 4 }} mb={{ base: 4, md: 6 }} alignItems={{ base: "stretch", lg: "center" }} w="100%">
              <Box bg="#111518" rounded="lg" border="1px" borderColor="gray.700" p={{ base: 1.5, sm: 2 }} w={{ base: "100%", lg: "auto" }} flexGrow={{ base: 0, lg: 1 }} maxW={{ base: "100%", lg: "70%" }}>
                <Flex gap={1} overflowX="auto" css={{ '&::-webkit-scrollbar': { height: '4px' }, '&::-webkit-scrollbar-track': { background: '#1d2225', borderRadius: '2px' }, '&::-webkit-scrollbar-thumb': { background: '#967532', borderRadius: '2px' } }}>
                  {["all", "active", "completed", "cancelled", "wallet"].map(tab => (
                    <Button key={tab} onClick={() => setActiveTab(tab)} flex="0 0 auto" minW={{ base: "75px", sm: "90px" }} px={{ base: 2, sm: 3 }} py={1.5} fontSize="sm" fontWeight="500" h="32px" bg={activeTab === tab ? "#967532" : "transparent"} color={activeTab === tab ? "white" : "gray.400"} _hover={{ color: "white", bg: activeTab === tab ? "#967532" : "#1d2225" }} rounded="md">
                      <Flex align="center" gap={1.5}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        <Text as="span" px={1.5} bg="#1d2225" rounded="full" fontSize="xs" minW="18px" h="18px" display="flex" alignItems="center" justifyContent="center" fontWeight="500">
                          {tab === "wallet" ? (Array.isArray(walletTransactions) ? walletTransactions.length : 0)
                            : tab === "all" ? (Array.isArray(transactions) ? transactions.length : 0)
                              : (Array.isArray(transactions) ? transactions.filter(t => tab === "active" ? t.status === "pending" : t.status === tab).length : 0)}
                        </Text>
                      </Flex>
                    </Button>
                  ))}
                </Flex>
              </Box>
              <Box pos="relative" w={{ base: "100%", lg: "280px" }} flexShrink={0}>
                <FiSearch style={{ position: "absolute", top: "50%", left: "12px", transform: "translateY(-50%)", color: "#967532", fontSize: "16px" }} />
                <Input placeholder="Search transactions..." value={searchQuery} onChange={(e) => debouncedSearch(e.target.value)} bg="#111518" borderColor="#967532" color="white" pl={10} pr={10} py={2} fontSize="sm" h="36px" rounded="md" _focus={{ borderColor: "#318AE6", boxShadow: "0 0 0 2px rgba(49, 138, 230, 0.3)" }} _hover={{ borderColor: "#318AE6" }} />
                {searchQuery && <IconButton aria-label="Clear search" icon={<MdClose />} pos="absolute" top="50%" right="8px" transform="translateY(-50%)" color="gray.400" _hover={{ color: "white" }} onClick={() => setSearchQuery("")} bg="transparent" size="sm" />}
              </Box>
            </Flex>

            {(transactionsLoading || walletLoading || userLoading) ? (
              <TransactionLoader />
            ) : activeTab === "wallet" ? (
              <Box mt={{ base: 4, md: 6 }} p={{ base: 4, md: 6 }} bg="#111518" rounded="lg" border="1px" borderColor="gray.700">
                <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="600" color="white" mb={{ base: 3, sm: 4 }}>Wallet Transaction History</Text>
                {!Array.isArray(walletTransactions) || walletTransactions.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" py={{ base: 8, md: 16 }}>
                    <Text fontSize={{ base: "3xl", md: "5xl" }} mb={3} color="gray.400">💳</Text>
                    <Text color="gray.400" fontSize={{ base: "md", md: "lg" }} textAlign="center">No wallet transactions found.</Text>
                  </Flex>
                ) : (
                  <Box display="grid" gridTemplateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={{ base: 3, sm: 4 }} css={{ '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { background: '#1d2225', borderRadius: '3px' }, '&::-webkit-scrollbar-thumb': { background: '#967532', borderRadius: '3px' } }}>
                    {walletTransactions.map((tx, idx) => (
                      <Box key={`${tx.reference}-${tx.createdAt}-${idx}`} p={{ base: 3, sm: 4 }} bg="#1d2225" rounded="md" border="1px" borderColor="gray.700" _hover={{ borderColor: "#318AE6", transform: "translateY(-1px)", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)" }} transition="all 0.2s">
                        <Stack spacing={2}>
                          <Text color="white" fontSize={{ base: "sm", sm: "md" }} fontWeight="500" isTruncated>{tx.reference || "N/A"}</Text>
                          <Text color={tx.type === "deposit" ? "green.300" : "red.300"} fontSize={{ base: "sm", sm: "md" }} fontWeight="600" isTruncated>{tx.type === "deposit" ? "+" : "-"} ₦{(tx.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
                          <Text color="gray.400" fontSize="xs" isTruncated>Purpose: {tx.metadata?.purpose || "N/A"}</Text>
                          <Text color="gray.400" fontSize="xs" isTruncated>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "N/A"}</Text>
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ) : filteredTransactions.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py={{ base: 8, md: 16 }} px={{ base: 4, sm: 6 }} w="100%">
                <Text fontSize={{ base: "3xl", md: "5xl" }} mb={3} color="gray.400">📭</Text>
                <Text color="#E4E4E4" fontSize={{ base: "md", md: "xl" }} fontWeight="500" textAlign="center" maxW="400px">
                  {userError ? `Failed to load transactions: ${userError}` : searchQuery ? "No transactions match your search criteria." : activeTab === "all" ? "No transactions found. Create your first transaction to get started." : `No ${activeTab} transactions found.`}
                </Text>
                {(userError || !Array.isArray(transactions)) && (
                  <Button mt={{ base: 4, sm: 6 }} bg="#318AE6" color="white" _hover={{ bg: "#2279d8" }} size="sm" onClick={() => dispatch(fetchInitialData())} px={6} h="36px" fontWeight="500" rounded="md" w={{ base: "100%", sm: "auto" }}>Try Again</Button>
                )}
              </Flex>
            ) : (
              <Box display="grid" gridTemplateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={{ base: 3, md: 5 }} w="100%" alignItems="start">
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
              </Box>
            )}
          </Box>
        ) : (
          <Box px={{ base: 4, md: 6, lg: 8 }} pt={{ base: "85px", md: "95px" }} pb={{ base: 4, md: 6 }} maxW="100%" mx="auto" overflowX="hidden">
            <Text fontSize={{ base: "xl", md: "3xl" }} fontWeight="600" color="white" mb={{ base: 4, sm: 5 }}>Profile</Text>
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
            errors={{}}
            handleSubmit={() => {}}
            downloadImage={downloadImage}
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

        <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)} isCentered size={{ base: "xs", sm: "md" }}>
          <ModalOverlay />
          <ModalContent bg="#1A1E21" color="white" p={{ base: 4, sm: 5 }} rounded="lg">
            <ModalHeader><Text fontSize={{ base: "md", sm: "lg" }} fontWeight="600">Confirm Transaction</Text></ModalHeader>
            <ModalBody><Text fontSize="sm" color="gray.300">Are you sure you want to confirm this transaction? This action cannot be undone.</Text></ModalBody>
            <ModalFooter>
              <Flex gap={3} w="100%" flexDir={{ base: "column", sm: "row" }}>
                <Button bg="gray.600" color="white" _hover={{ bg: "gray.700" }} size="sm" onClick={() => setModalVisible(false)} flex={{ base: 1, sm: "0 0 100px" }} h="36px" fontWeight="500" rounded="md">Cancel</Button>
                <Button bg="#318AE6" color="white" _hover={{ bg: "#2279d8" }} size="sm" onClick={() => completeTransaction(selectedTransactionId)} isLoading={isConfirming[selectedTransactionId]} flex={{ base: 1, sm: "0 0 100px" }} h="36px" fontWeight="500" rounded="md">Confirm</Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
      <BottomNav />
    </Flex>
  );
};

export default DisplayTransaction;