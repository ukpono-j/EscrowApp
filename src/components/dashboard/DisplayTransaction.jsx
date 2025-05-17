import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Box, Flex, Text, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useToast, VStack, Input, Select, IconButton, Image, Spinner
} from "@chakra-ui/react";
import { FiSearch, FiEdit } from "react-icons/fi";
import { BsChatFill } from "react-icons/bs";
import { MdClose, MdContentCopy } from "react-icons/md";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import MiniNav from "./MiniNav";
import { nigeriaBanks } from "../../data/banksList";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const MotionBox = motion(Box);

// Custom debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const TransactionLoader = () => (
  <Flex flexDir="column" align="center" justify="center" h={{ base: "50vh", md: "60vh" }}>
    <Spinner color="#318AE6" size="xl" mb={4} />
    <Text color="#E4E4E4" fontSize={{ base: "md", md: "lg" }} fontWeight="medium">
      Loading transactions...
    </Text>
  </Flex>
);

const TransactionCard = ({
  transaction, currentUser, isConfirming, handleChat, handleWaybill, handleConfirm,
  handleFund, handleEditPayment, cancelTransaction, copyToClipboard, toggleDescription, expandedDescriptions
}) => {
  const isCreator = currentUser?._id && transaction?.userId?._id === currentUser._id;
  const isParticipant = transaction?.participants?.some(p => p._id === currentUser?._id || p === currentUser?._id) || false;
  const isBuyer = (isCreator && transaction?.selectedUserType === "buyer") || (isParticipant && transaction?.selectedUserType !== "buyer");
  const description = transaction?.productDetails?.description || "No description provided";
  const isExpanded = expandedDescriptions[transaction._id];
  const maxLength = 100;
  const truncatedDescription = description.length > maxLength && !isExpanded
    ? `${description.substring(0, maxLength)}...`
    : description;

  return (
    <MotionBox
      bg="#111518"
      rounded="lg"
      border="1px"
      borderColor="gray.800"
      p={{ base: 3, sm: 4 }}
      maxW="100%"
      overflow="hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, borderColor: "#318AE6" }}
    >
      <Flex justify="space-between" align="center" mb={{ base: 2, sm: 3 }}>
        <Box>
          {transaction?.participants?.length > 0 ? (
            <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="bold" color="white" isTruncated maxW="200px">
              {transaction.participants[0].firstName ? `${transaction.participants[0].firstName} ${transaction.participants[0].lastName || ""}` : "Participant joined"}
            </Text>
          ) : (
            <Text fontSize={{ base: "sm", sm: "md" }} color="gray.400">No participant yet</Text>
          )}
        </Box>
        <Flex gap={2}>
          <IconButton aria-label="Edit payment details" icon={<FiEdit />} size="sm" bg="#1d2225" color="white" _hover={{ bg: "#967532" }} onClick={() => handleEditPayment(transaction)} />
          <IconButton aria-label="Open chat" icon={<BsChatFill />} size="sm" bg="#1d2225" color="white" _hover={{ bg: "#318AE6" }} onClick={() => handleChat(transaction._id)} />
        </Flex>
      </Flex>
      <Box bg="#1d2225" rounded="md" p={{ base: 2, sm: 3 }} mb={2}>
        <Text fontSize="xs" color="gray.400" mb={1}>Description</Text>
        <VStack align="start" spacing={1}>
          <Text fontSize="sm" color="gray.200">{truncatedDescription}</Text>
          {description.length > maxLength && (
            <Button variant="link" size="xs" color="#318AE6" onClick={() => toggleDescription(transaction._id)}>
              {isExpanded ? "Show less" : "Read more"}
            </Button>
          )}
        </VStack>
      </Box>
      <Flex bg="#1d2225" rounded="md" p={{ base: 2, sm: 3 }} mb={2} justify="space-between" align="center">
        <Box maxW="70%">
          <Text fontSize="xs" color="gray.400" mb={1}>Transaction ID</Text>
          <Text fontSize="sm" color="white" isTruncated>{transaction._id}</Text>
        </Box>
        <IconButton aria-label="Copy transaction ID" icon={<MdContentCopy />} size="sm" color="gray.400" _hover={{ color: "#318AE6" }} onClick={() => copyToClipboard(transaction._id)} />
      </Flex>
      <Box
        display="grid"
        gridTemplateColumns={{ base: "1fr", sm: "1fr 1fr" }}
        gap={2}
        mb={3}
        overflow="hidden"
      >
        {[
          { label: "Email", value: transaction.email || "N/A" },
          { label: "Amount", value: transaction.paymentAmount ? `₦${parseFloat(transaction.paymentAmount).toFixed(2)}` : "N/A", color: "#318AE6" },
          { label: "User Type", value: isBuyer ? "Buyer" : "Seller" },
          {
            label: "Status",
            value: (
              <Text
                fontSize="xs"
                bg={transaction.status === "completed" ? "green.900" : transaction.status === "cancelled" ? "red.900" : "yellow.900"}
                color={transaction.status === "completed" ? "green.300" : transaction.status === "cancelled" ? "red.300" : "yellow.300"}
                px={2} py={1} rounded="full" textAlign="center"
              >
                {transaction.status || "Unknown"}
              </Text>
            )
          },
          { label: "Bank", value: transaction.paymentBank || "N/A" },
          { label: "Account Number", value: transaction.paymentAccountNumber || "N/A" },
          {
            label: "Waybill Status",
            value: (
              <Text
                fontSize="xs"
                bg={transaction.proofOfWaybill === "confirmed" ? "green.900" : "yellow.900"}
                color={transaction.proofOfWaybill === "confirmed" ? "green.300" : "yellow.300"}
                px={2} py={1} rounded="full" textAlign="center"
              >
                {transaction.proofOfWaybill || "Not submitted"}
              </Text>
            )
          },
          { label: "Created", value: transaction.createdAt ? format(new Date(transaction.createdAt), "MMM dd, yyyy") : "N/A" },
          {
            label: "Escrow Status",
            value: (
              <Text
                fontSize="xs"
                bg={transaction.locked ? "yellow.900" : transaction.status === "completed" ? "green.900" : "gray.900"}
                color={transaction.locked ? "yellow.300" : transaction.status === "completed" ? "green.300" : "gray.300"}
                px={2} py={1} rounded="full" textAlign="center"
              >
                {transaction.locked ? `Locked: ₦${parseFloat(transaction.lockedAmount || 0).toFixed(2)}` : transaction.status === "completed" ? "Released" : "Not Locked"}
              </Text>
            )
          }
        ].map(({ label, value, color }, idx) => (
          <Box
            key={idx}
            bg="#1d2225"
            rounded="md"
            p={2}
            overflow="hidden"
          >
            <Text fontSize="xs" color="gray.400" mb={1}>{label}</Text>
            {typeof value === "string" ? (
              <Text
                fontSize="sm"
                color={color || "white"}
                isTruncated
                whiteSpace="normal"
                overflowWrap="break-word"
              >
                {value}
              </Text>
            ) : (
              value
            )}
          </Box>
        ))}
      </Box>
      <Flex flexWrap="wrap" gap={2} justify="space-between">
        <Button onClick={() => cancelTransaction(transaction._id)} bg="red.700" color="white" _hover={{ bg: "red.600" }} size="sm" flex={1} minW="90px" isLoading={isConfirming[transaction._id]} aria-label="Cancel transaction">Cancel</Button>
        <Button onClick={() => handleWaybill(transaction._id, isBuyer)} bg="#318AE6" color="white" _hover={{ bg: "#2279d8" }} size="sm" flex={1} minW="90px" aria-label={isBuyer ? "View waybill" : "Input waybill"}>{isBuyer ? "View Waybill" : "Input Waybill"}</Button>
        {transaction.status === "pending" && (
          <Button onClick={() => handleConfirm(transaction._id)} bg="green.700" color="white" _hover={{ bg: "green.600" }} size="sm" flex={1} minW="90px" isLoading={isConfirming[transaction._id]} aria-label="Complete transaction">Complete</Button>
        )}
        {isBuyer && !transaction.locked && transaction.status === "pending" && (
          <Button
            onClick={() => handleFund(transaction)}
            bg="#967532"
            color="white"
            _hover={{ bg: "#7a5c28" }}
            size="sm"
            flexGrow={1}
            flexBasis="calc(50% - 4px)"
            minWidth="80px"
            isLoading={isConfirming[transaction._id]}
            aria-label="Fund transaction"
          >
            Fund Transaction
          </Button>
        )}
      </Flex>
    </MotionBox>
  );
};

const WaybillModal = ({ isOpen, onClose, transactionId, isBuyer, details, setDetails, errors, handleSubmit, downloadImage }) => (
  <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "lg" }} scrollBehavior="inside">
    <ModalOverlay />
    <ModalContent bg="#1A1E21" color="white" p={{ base: 4, sm: 6 }} rounded="xl">
      <ModalHeader>
        <Text fontSize={{ base: "lg", sm: "xl" }} fontWeight="bold" textAlign="center">{isBuyer ? "Waybill Details" : "Seller Waybill Proof"}</Text>
        {!isBuyer && <Text fontSize="sm" textAlign="center" color="gray.300">I, the seller, confirm that I have shipped the goods.</Text>}
      </ModalHeader>
      <ModalBody>
        {isBuyer ? (
          <VStack spacing={4} align="start" color="gray.300">
            {[
              { label: "Item", value: details.item || "N/A" },
              { label: "Price", value: details.price || "N/A" },
              { label: "Shipping Address", value: details.shippingAddress || "N/A" },
              { label: "Tracking Number", value: details.trackingNumber || "N/A" },
              { label: "Delivery Date", value: details.deliveryDate ? format(new Date(details.deliveryDate), "MMM dd, yyyy") : "N/A" }
            ].map(({ label, value }, idx) => (
              <Box key={idx}>
                <Text fontSize="xs" mb={2}>{label}:</Text>
                <Text fontSize="sm">{value}</Text>
              </Box>
            ))}
            <Box>
              <Text fontSize="xs" mb={2}>Image:</Text>
              {details.image ? (
                <Box display="flex" flexDir="column" alignItems="center">
                  <Image src={details.image} alt="Waybill Proof" maxW="full" h="auto" rounded="lg" />
                  <Button mt={2} bg="#318AE6" color="white" _hover={{ bg: "#2279d8" }} size="sm" onClick={() => downloadImage(details.image)}>Download Image</Button>
                </Box>
              ) : (
                <Text fontSize="sm">No image provided</Text>
              )}
            </Box>
          </VStack>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(transactionId); }}>
            <VStack spacing={4}>
              {[
                { label: "Item", key: "item", type: "text" },
                { label: "Price", key: "price", type: "number" },
                { label: "Shipping Address", key: "shippingAddress", type: "text" },
                { label: "Tracking Number", key: "trackingNumber", type: "text" },
                { label: "Delivery Date", key: "deliveryDate", type: "date" }
              ].map(({ label, key, type }) => (
                <Box key={key} w="full">
                  <Text fontSize="xs" color="gray.300" mb={2}>{label}:</Text>
                  <Input
                    type={type}
                    value={details[key] || ""}
                    onChange={(e) => setDetails({ ...details, [key]: e.target.value })}
                    bg="#111518" borderColor="#318AE6" color="white" fontSize="sm"
                  />
                  {errors[key] && <Text color="red.500" fontSize="xs" mt={1}>{errors[key]}</Text>}
                </Box>
              ))}
              <Box w="full">
                <Text fontSize="xs" color="gray.300" mb={2}>Image:</Text>
                <Box border="2px" borderStyle="dashed" borderColor="#318AE6" rounded="lg" p={4} textAlign="center">
                  <Input
                    type="file"
                    id={`waybill-image-${transactionId}`}
                    accept="image/*"
                    onChange={(e) => setDetails({ ...details, image: e.target.files[0] })}
                    display="none"
                  />
                  <label htmlFor={`waybill-image-${transactionId}`} className="cursor-pointer flex flex-col items-center">
                    <Text fontSize="xl" color="#318AE6" mb={2}>📷</Text>
                    <Text fontSize="xs" color="gray.300">Click to upload proof of shipment</Text>
                  </label>
                  {details.image && <Text fontSize="xs" color="gray.300" mt={2}>Selected: {details.image.name}</Text>}
                </Box>
                {errors.image && <Text color="red.500" fontSize="xs" mt={1}>{errors.image}</Text>}
              </Box>
            </VStack>
          </form>
        )}
      </ModalBody>
      <ModalFooter>
        <Button bg="gray.600" color="white" _hover={{ bg: "gray.700" }} size="sm" onClick={onClose} mr={3}>Close</Button>
        {!isBuyer && <Button type="submit" bg="#318AE6" color="white" _hover={{ bg: "#2279d8" }} size="sm" onClick={() => handleSubmit(transactionId)}>Submit</Button>}
      </ModalFooter>
    </ModalContent>
  </Modal>
);

const PaymentDetailsModal = ({ isOpen, onClose, transaction, paymentDetails, setPaymentDetails, paymentErrors, handleSubmit }) => (
  <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "md" }}>
    <ModalOverlay />
    <ModalContent bg="#1A1E21" color="white" p={{ base: 4, sm: 6 }} rounded="xl">
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="lg" fontWeight="bold">Edit Payment Details</Text>
        <IconButton aria-label="Close modal" icon={<MdClose />} color="gray.400" _hover={{ color: "#318AE6" }} onClick={onClose} />
      </Flex>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <Box w="full">
            <Text fontSize="xs" color="gray.300" mb={2}>Bank</Text>
            <Select
              value={paymentDetails.selectedBankCode || ""}
              onChange={(e) => {
                const bank = nigeriaBanks.find(b => b.code === e.target.value);
                setPaymentDetails({ ...paymentDetails, selectedBankCode: e.target.value, paymentBank: bank?.name || "" });
              }}
              placeholder="Select a bank"
              bg="#111518" borderColor="#318AE6" color="white" fontSize="sm"
            >
              {nigeriaBanks.map(bank => (
                <option key={bank.code} value={bank.code} style={{ color: "black" }}>{bank.name}</option>
              ))}
            </Select>
            {paymentErrors.selectedBankCode && <Text color="red.500" fontSize="xs" mt={1}>{paymentErrors.selectedBankCode}</Text>}
          </Box>
          <Box w="full">
            <Text fontSize="xs" color="gray.300" mb={2}>Account Number</Text>
            <Input
              type="text"
              value={paymentDetails.paymentAccountNumber || ""}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentAccountNumber: e.target.value })}
              bg="#111518" borderColor="#318AE6" color="white" fontSize="sm"
            />
            {paymentErrors.paymentAccountNumber && <Text color="red.500" fontSize="xs" mt={1}>{paymentErrors.paymentAccountNumber}</Text>}
          </Box>
          <Box w="full">
            <Text fontSize="xs" color="gray.300" mb={2}>Amount</Text>
            <Input
              type="number"
              value={paymentDetails.paymentAmount || ""}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentAmount: e.target.value })}
              bg="#111518" borderColor="#318AE6" color="white" fontSize="sm"
              isDisabled={transaction?.locked}
            />
            {paymentErrors.paymentAmount && <Text color="red.500" fontSize="xs" mt={1}>{paymentErrors.paymentAmount}</Text>}
          </Box>
        </VStack>
        <Flex justify="end" gap={3} mt={6}>
          <Button bg="gray.600" color="white" _hover={{ bg: "gray.700" }} size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" bg="#318AE6" color="white" _hover={{ bg: "#2279d8" }} size="sm">Save</Button>
        </Flex>
      </form>
    </ModalContent>
  </Modal>
);

const DisplayTransaction = ({ userResponse }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showWaybillPopup, setShowWaybillPopup] = useState({});
  const [buyerShowWaybillPopup, setBuyerShowWaybillPopup] = useState({});
  const [waybillDetails, setWaybillDetails] = useState({ item: "", image: null, price: "", shippingAddress: "", trackingNumber: "", deliveryDate: "" });
  const [buyerWaybillDetails, setBuyerWaybillDetails] = useState({});
  const [errors, setErrors] = useState({});
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({ paymentBank: "", paymentAccountNumber: "", selectedBankCode: "", paymentAmount: "" });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [isConfirming, setIsConfirming] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      // Auto-collapse sidebar on mobile by default
      if (isMobileView) {
        setIsSidebarCollapsed(true);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleSidebarCollapseChange = (isCollapsed) => {
    setIsSidebarCollapsed(isCollapsed);
  };

  const fetchData = useCallback(async (showLoader = false) => {
    const token = localStorage.getItem("auth-token");
    if (!token) {
      setIsInitialLoading(false);
      setIsManualRefreshing(false);
      toast({ title: "Authentication required", status: "error", duration: 3000, isClosable: true });
      return;
    }
    try {
      if (showLoader) {
        setIsInitialLoading(true);
        setIsManualRefreshing(true);
      }
      const [userRes, txRes, walletRes, walletTxRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/users/user-details`, { headers: { "auth-token": token } }),
        axios.get(`${BASE_URL}/api/transactions/get-transaction`, { headers: { "auth-token": token } }),
        axios.get(`${BASE_URL}/api/wallet/balance`, { headers: { "auth-token": token } }),
        axios.get(`${BASE_URL}/api/wallet/transactions`, { headers: { "auth-token": token } })
      ]);
      setCurrentUser(userRes.data);
      setTransactions(txRes.data || []);
      setWalletBalance(walletRes.data?.balance ?? 0);
      setWalletTransactions(walletTxRes.data?.transactions || []);
    } catch (error) {
      toast({ title: "Error fetching data", description: error.message, status: "error", duration: 3000, isClosable: true });
    } finally {
      if (showLoader) {
        setIsInitialLoading(false);
        setIsManualRefreshing(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const socket = io(BASE_URL, { auth: { token: localStorage.getItem("auth-token") }, reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 1000 });
    socket.on("connect", () => {
      if (currentUser?._id) socket.emit("join-room", currentUser._id);
    });
    socket.on("transactionCompleted", (data) => {
      toast({ title: "Transaction Completed", description: `Transaction ${data.transactionId} completed.`, status: "success", duration: 5000, isClosable: true });
      fetchData(false);
    });
    socket.on("balanceUpdate", (data) => {
      setWalletBalance(data.balance ?? 0);
      toast({ title: "Wallet Updated", description: `Credited with ₦${(data.transaction?.amount ?? 0).toFixed(2)}`, status: "success", duration: 5000, isClosable: true });
    });
    socket.on("transactionUpdated", (data) => {
      toast({ title: "Transaction Update", description: data.message, status: "info", duration: 5000, isClosable: true });
      fetchData(false);
    });
    socket.on("reconnect", () => currentUser?._id && socket.emit("join-room", currentUser._id));
    socket.on("connect_error", (error) => {
      toast({ title: "Socket Connection Error", description: error.message, status: "error", duration: 3000, isClosable: true });
    });
    return () => socket.disconnect();
  }, [currentUser?._id, toast, fetchData]);

  const debouncedSearch = useCallback(debounce((value) => setSearchQuery(value), 300), []);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return transactions.filter((t) => {
      if (activeTab === "active" && t.status !== "pending") return false;
      if (activeTab === "completed" && t.status !== "completed") return false;
      if (activeTab === "cancelled" && t.status !== "cancelled") return false;
      const participantName = t.participants?.length > 0
        ? `${t.participants[0].firstName || ""} ${t.participants[0].lastName || ""}`.trim().toLowerCase()
        : "";
      const description = t.productDetails?.description?.toLowerCase() || "";
      return (
        participantName.includes(query) || description.includes(query)
      );
    });
  }, [transactions, activeTab, searchQuery]);

  const handleChat = async (transactionId) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/transactions/create-chatroom`, { transactionId }, { headers: { "auth-token": localStorage.getItem("auth-token") } });
      navigate(`/chat/${res.data.chatroomId}`);
    } catch (error) {
      toast({ title: "Error creating chatroom", description: error.message, status: "error", duration: 3000, isClosable: true });
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
      const res = await axios.get(`${BASE_URL}/api/transactions/${transactionId}`, { headers: { "auth-token": localStorage.getItem("auth-token") } });
      const { image, item, price, shippingAddress, trackingNumber, deliveryDate } = res.data.waybillDetails || {};
      setBuyerWaybillDetails(prev => ({
        ...prev,
        [transactionId]: { item: item || "", price: price || "", shippingAddress: shippingAddress || "", trackingNumber: trackingNumber || "", deliveryDate: deliveryDate || "", image: image ? `${BASE_URL}/${image}` : "" }
      }));
    } catch (error) {
      toast({ title: "Error fetching waybill details", description: error.message, status: "error", duration: 3000, isClosable: true });
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
      await axios.post(`${BASE_URL}/api/transactions/submit-waybill`, formData, {
        headers: { "auth-token": localStorage.getItem("auth-token"), "Content-Type": "multipart/form-data" }
      });
      toast({ title: "Waybill submitted", status: "success", duration: 3000, isClosable: true });
      setShowWaybillPopup(prev => ({ ...prev, [transactionId]: false }));
      setWaybillDetails({ item: "", image: null, price: "", shippingAddress: "", trackingNumber: "", deliveryDate: "" });
      fetchData(false);
    } catch (error) {
      toast({ title: "Error submitting waybill", description: error.message, status: "error", duration: 3000, isClosable: true });
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

  const cancelTransaction = async (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
    try {
      await axios.put(`${BASE_URL}/api/transactions/cancel/${transactionId}`, {}, { headers: { "auth-token": localStorage.getItem("auth-token") } });
      toast({ title: "Transaction Cancelled", description: "Funds refunded.", status: "success", duration: 5000, isClosable: true });
      setTransactions(prev => prev.filter(t => t._id !== transactionId));
      fetchData(false);
    } catch (error) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to cancel.", status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  const handleConfirm = async (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
    try {
      const transaction = transactions.find(t => t._id === transactionId);
      if (!transaction) throw new Error("Transaction not found");
      if (!transaction.participants?.length) throw new Error("No participant");
      if (transaction.status !== "pending") throw new Error("Only pending transactions can be confirmed");
      setSelectedTransactionId(transactionId);
      setModalVisible(true);
    } catch (error) {
      toast({ title: "Error", description: error.message, status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  const completeTransaction = async (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
    try {
      const res = await axios.post(`${BASE_URL}/api/transactions/confirm`, { transactionId }, { headers: { "auth-token": localStorage.getItem("auth-token") } });
      const { status } = res.data.transaction || {};
      toast({
        title: status === "completed" ? "Transaction Completed" : "Confirmation Recorded",
        description: status === "completed" ? "Funds released to seller." : "Waiting for other party.",
        status: status === "completed" ? "success" : "info",
        duration: 5000,
        isClosable: true
      });
      fetchData(false);
    } catch (error) {
      toast({ title: "Error", description: error.response?.data?.message || "Could not complete transaction.", status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
      setModalVisible(false);
      setSelectedTransactionId(null);
    }
  };

  const handleFund = async (transaction) => {
    if (transaction.locked || !transaction._id || transaction.paymentAmount <= 0) {
      toast({ title: "Error", description: "Invalid transaction data.", status: "error", duration: 5000, isClosable: true });
      return;
    }
    setIsConfirming(prev => ({ ...prev, [transaction._id]: true }));
    try {
      const amount = parseFloat(transaction.paymentAmount);
      if (walletBalance >= amount) {
        // Sufficient balance, proceed with funding from wallet
        await axios.post(`${BASE_URL}/api/transactions/fund-transaction`, {
          transactionId: transaction._id,
          amount: amount
        }, {
          headers: { "auth-token": localStorage.getItem("auth-token") }
        });
        toast({ title: "Transaction funded", description: "Funded from wallet balance.", status: "success", duration: 3000, isClosable: true });
        fetchData(false);
      } else {
        // Insufficient balance, initiate Paystack funding
        const shortfall = amount - walletBalance;
        const fundingAmount = Math.ceil(shortfall * 100) / 100; // Round up to 2 decimal places
        const response = await axios.post(`${BASE_URL}/api/wallet/fund`, {
          amount: fundingAmount,
          email: currentUser.email,
          phoneNumber: currentUser.phoneNumber || ""
        }, {
          headers: { "auth-token": localStorage.getItem("auth-token") }
        });
        if (response.data.success && response.data.data.authorization_url) {
          // Redirect to Paystack payment page
          window.location.href = response.data.data.authorization_url;
        } else {
          throw new Error("Failed to initiate Paystack funding.");
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Could not fund transaction.";
      toast({ title: "Error", description: errorMessage, status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsConfirming(prev => ({ ...prev, [transaction._id]: false }));
    }
  };

  const handleEditPayment = (transaction) => {
    if (!transaction) return;
    setCurrentTransaction(transaction);
    setPaymentDetails({
      paymentBank: transaction.paymentBank || "",
      paymentAccountNumber: transaction.paymentAccountNumber || "",
      selectedBankCode: transaction.paymentBankCode || "",
      paymentAmount: transaction.paymentAmount || ""
    });
    setShowPaymentDetailsModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!paymentDetails.selectedBankCode) newErrors.selectedBankCode = "Select a bank";
    if (!/^\d{10}$/.test(paymentDetails.paymentAccountNumber)) newErrors.paymentAccountNumber = "Invalid account number";
    if (paymentDetails.paymentAmount <= 0) newErrors.paymentAmount = "Invalid amount";
    if (Object.keys(newErrors).length) {
      setPaymentErrors(newErrors);
      return;
    }
    try {
      await axios.put(`${BASE_URL}/api/transactions/update-payment-details/${currentTransaction._id}`, paymentDetails, {
        headers: { "auth-token": localStorage.getItem("auth-token") }
      });
      toast({ title: "Payment details updated", status: "success", duration: 3000, isClosable: true });
      setShowPaymentDetailsModal(false);
      setCurrentTransaction(null);
      setPaymentDetails({ paymentBank: "", paymentAccountNumber: "", selectedBankCode: "", paymentAmount: "" });
      fetchData(false);
    } catch (error) {
      toast({ title: "Error", description: error.response?.data?.message || "Could not update payment details.", status: "error", duration: 5000, isClosable: true });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => toast({ title: "Copied to clipboard", status: "success", duration: 2000, isClosable: true }));
  };

  const toggleDescription = (transactionId) => {
    setExpandedDescriptions(prev => ({ ...prev, [transactionId]: !prev[transactionId] }));
  };

  const handleShowProfile = () => {
    setShowToggleContainer(false);
    setShowProfile(true);
  };

  const handleMyTransaction = () => {
    setShowToggleContainer(true);
    setShowProfile(false);
  };

  return (
    <Flex minH="100vh" bg="" direction={{ base: "column", md: "row" }}>
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
        onCollapseChange={handleSidebarCollapseChange}
      />
      <div
        className={`transition-all pt-1 duration-300 flex-1 h-screen overflow-y-auto ${!isMobile ? (isSidebarCollapsed ? "ml-[80px]" : "ml-[280px]") : "ml-0"} md:block block`}
      >
        <Box flex={1} width={{ base: "100%", md: "auto" }}>
          {showToggleContainer && (
            <Box width="100%">
              <MiniNav />
              <Box
                px={{ base: 3, sm: 4, md: 6, lg: 8 }}
                pt={{ base: "100px", sm: "100px", md: "100px", lg: "100px" }}
                pb={{ base: 8, sm: 10, md: 12, lg: 16 }}
                maxW="100%"
                mx="auto"
                overflow="hidden"
              >
                <Flex
                  justify="space-between"
                  align={{ base: "flex-start", sm: "center" }}
                  mb={{ base: 4, sm: 5, md: 6 }}
                  flexDir={{ base: "column", sm: "row" }}
                  gap={{ base: 3, sm: 4 }}
                  width="100%"
                  flexWrap="wrap"
                >
                  <Text fontSize={{ base: "xl", sm: "2xl", md: "3xl" }} fontWeight="bold" color="white">My Transactions</Text>
                  <Flex
                    gap={3}
                    align="center"
                    width={{ base: "100%", sm: "auto" }}
                    flexWrap={{ base: "wrap", sm: "nowrap" }}
                  >
                    {walletBalance !== null && (
                      <Text
                        fontSize={{ base: "sm", md: "md" }}
                        color="white"
                        bg="gray.800"
                        px={3}
                        py={2}
                        rounded="md"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        maxW={{ base: "full", sm: "auto", md: "auto" }}
                      >
                        Wallet Balance: ₦{walletBalance.toFixed(2)}
                      </Text>
                    )}
                    <Button
                      onClick={() => fetchData(true)}
                      isLoading={isManualRefreshing}
                      size={{ base: "xs", sm: "sm" }}
                      bg="#318AE6"
                      color="white"
                      _hover={{ bg: "#2279d8" }}
                      aria-label="Refresh transactions"
                      width={{ base: "100%", sm: "auto" }}
                    >
                      Refresh
                    </Button>
                  </Flex>
                </Flex>
                <Flex
                  flexDir={{ base: "column", md: "row" }}
                  gap={4}
                  mb={6}
                  width="100%"
                  flexWrap="wrap"
                >
                  <Flex
                    overflowX="auto"
                    bg="#111518"
                    rounded="lg"
                    border="1px"
                    borderColor="gray.800"
                    p={1}
                    width={{ base: "100%" }}
                    flexGrow={1}
                    flexShrink={0}
                    minW={{ base: "auto", md: "350px" }}
                    maxW={{ base: "100%", md: "60%" }}
                    css={{
                      '&::-webkit-scrollbar': { height: '6px' },
                      '&::-webkit-scrollbar-thumb': { backgroundColor: '#2D3748', borderRadius: '3px' }
                    }}
                  >
                    {["all", "active", "completed", "cancelled", "wallet"].map(tab => (
                      <Button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        flex={{ base: "0 0 auto", sm: 1 }}
                        minW="80px"
                        px={{ base: 2, md: 3 }}
                        py={2}
                        fontSize={{ base: "xs", sm: "sm" }}
                        bg={activeTab === tab ? "#967532" : "transparent"}
                        color={activeTab === tab ? "white" : "gray.400"}
                        _hover={{ color: "white" }}
                        whiteSpace="nowrap"
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        <Text as="span" ml={1} px={1} bg="#1d2225" rounded="full" fontSize="xs">
                          {tab === "wallet" ? walletTransactions.length : tab === "all" ? transactions.length : transactions.filter(t => tab === "active" ? t.status === "pending" : t.status === tab).length}
                        </Text>
                      </Button>
                    ))}
                  </Flex>
                  <Box pos="relative" w={{ base: "100%", md: "220px", lg: "250px" }} flexShrink={0}>
                    <FiSearch style={{ position: "absolute", top: "50%", left: "12px", transform: "translateY(-50%)", color: "#967532" }} />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => debouncedSearch(e.target.value)}
                      bg="#111518"
                      borderColor="#967532"
                      color="white"
                      pl={10}
                      fontSize={{ base: "xs", sm: "sm" }}
                      aria-label="Search transactions"
                      width="100%"
                    />
                    {searchQuery && (
                      <IconButton
                        aria-label="Clear search"
                        icon={<MdClose />}
                        pos="absolute"
                        top="50%"
                        right="8px"
                        transform="translateY(-50%)"
                        color="gray.400"
                        _hover={{ color: "white" }}
                        onClick={() => setSearchQuery("")}
                        bg="transparent"
                        size="sm"
                      />
                    )}
                  </Box>
                </Flex>
                {(isInitialLoading || isManualRefreshing) ? (
                  <TransactionLoader />
                ) : activeTab === "wallet" ? (
                  <Box
                    mt={6}
                    p={{ base: 3, sm: 4 }}
                    bg="#111518"
                    rounded="lg"
                    border="1px"
                    borderColor="gray.800"
                    width="100%"
                  >
                    <Text fontSize={{ base: "lg", sm: "xl" }} fontWeight="bold" color="white" mb={4}>Wallet Transaction History</Text>
                    {walletTransactions.length === 0 ? (
                      <Text color="gray.400" fontSize="md">No wallet transactions found.</Text>
                    ) : (
                      walletTransactions.map((tx, idx) => (
                        <Box
                          key={`${tx.reference}-${tx.createdAt}-${idx}`}
                          mb={4}
                          p={{ base: 2, sm: 3 }}
                          bg="#1d2225"
                          rounded="md"
                        >
                          <Flex justify="space-between" flexWrap="wrap" gap={2}>
                            <Text
                              color="white"
                              fontSize={{ base: "xs", sm: "sm" }}
                              maxW={{ base: "60%", sm: "70%" }}
                              isTruncated
                            >
                              {tx.reference}
                            </Text>
                            <Text
                              color={tx.type === "deposit" ? "green.300" : "red.300"}
                              fontSize={{ base: "xs", sm: "sm" }}
                              fontWeight="medium"
                            >
                              {tx.type === "deposit" ? "+" : "-"} ₦{(tx.amount || 0).toFixed(2)}
                            </Text>
                          </Flex>
                          <Text color="gray.400" fontSize="xs" mt={1}>Purpose: {tx.metadata?.purpose || "N/A"}</Text>
                          <Text color="gray.400" fontSize="xs" mt={1}>Date: {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "N/A"}</Text>
                        </Box>
                      ))
                    )}
                  </Box>
                ) : transactions.length === 0 ? (
                  <Flex flexDir="column" align="center" justify="center" h={{ base: "30vh", sm: "40vh", md: "50vh" }}>
                    <Text fontSize={{ base: "2xl", sm: "3xl" }} mb={4} color="gray.400">📭</Text>
                    <Text color="#E4E4E4" fontSize={{ base: "md", sm: "lg" }} fontWeight="medium" textAlign="center">No transactions created</Text>
                    <Text color="gray.400" fontSize={{ base: "sm", md: "md" }} mt={2} textAlign="center">Create a new transaction to get started</Text>
                  </Flex>
                ) : (
                  <Box
                    display="grid"
                    gridTemplateColumns={{
                      base: "1fr",
                      sm: "repeat(auto-fill, minmax(220px, 1fr))",
                      md: "repeat(auto-fill, minmax(240px, 1fr))",
                      lg: "repeat(auto-fill, minmax(300px, 1fr))"
                    }}
                    gap={{ base: 4, sm: 5, md: 6 }}
                  >
                    {filteredTransactions.map((transaction, idx) => (
                      <TransactionCard
                        key={transaction._id}
                        transaction={transaction}
                        currentUser={currentUser}
                        isConfirming={isConfirming}
                        handleChat={handleChat}
                        handleWaybill={handleWaybill}
                        handleConfirm={handleConfirm}
                        handleFund={handleFund}
                        handleEditPayment={handleEditPayment}
                        cancelTransaction={cancelTransaction}
                        copyToClipboard={copyToClipboard}
                        toggleDescription={toggleDescription}
                        expandedDescriptions={expandedDescriptions}
                        index={idx}
                        isCompact={isSidebarCollapsed}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          )}
          {showProfile && <Box width="100%">{/* Profile content */}</Box>}
          <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)} isCentered size={{ base: "xs", sm: "sm" }}>
            <ModalOverlay />
            <ModalContent bg="#1A1E21" color="white" mx={{ base: 3, sm: "auto" }}>
              <ModalHeader fontSize={{ base: "md", sm: "lg" }}>Confirm Transaction</ModalHeader>
              <ModalBody>
                <Text fontSize={{ base: "sm", sm: "md" }}>Are you sure you want to confirm transaction {selectedTransactionId}?</Text>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="gray" mr={3} onClick={() => setModalVisible(false)} size={{ base: "xs", sm: "sm" }}>Cancel</Button>
                <Button colorScheme="blue" onClick={() => completeTransaction(selectedTransactionId)} isLoading={isConfirming[selectedTransactionId]} size={{ base: "xs", sm: "sm" }}>Confirm</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          {Object.keys(showWaybillPopup).map(id => showWaybillPopup[id] && (
            <WaybillModal
              key={`seller-${id}`}
              isOpen={showWaybillPopup[id]}
              onClose={() => setShowWaybillPopup(prev => ({ ...prev, [id]: false }))}
              transactionId={id}
              isBuyer={false}
              details={waybillDetails}
              setDetails={setWaybillDetails}
              errors={errors}
              handleSubmit={handleWaybillSubmit}
              downloadImage={downloadImage}
            />
          ))}
          {Object.keys(buyerShowWaybillPopup).map(id => buyerShowWaybillPopup[id] && (
            <WaybillModal
              key={`buyer-${id}`}
              isOpen={buyerShowWaybillPopup[id]}
              onClose={() => setBuyerShowWaybillPopup(prev => ({ ...prev, [id]: false }))}
              transactionId={id}
              isBuyer={true}
              details={buyerWaybillDetails[id] || {}}
              downloadImage={downloadImage}
            />
          ))}
          {showPaymentDetailsModal && (
            <PaymentDetailsModal
              isOpen={showPaymentDetailsModal}
              onClose={() => { setShowPaymentDetailsModal(false); setCurrentTransaction(null); setPaymentDetails({ paymentBank: "", paymentAccountNumber: "", selectedBankCode: "", paymentAmount: "" }); }}
              transaction={currentTransaction}
              paymentDetails={paymentDetails}
              setPaymentDetails={setPaymentDetails}
              paymentErrors={paymentErrors}
              handleSubmit={handlePaymentSubmit}
            />
          )}
          {isMobile && <BottomNav />}
        </Box>
      </div>
    </Flex>
  );
};

export default DisplayTransaction;