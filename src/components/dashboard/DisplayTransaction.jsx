import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { FiSearch } from "react-icons/fi";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { io } from 'socket.io-client';
import { Flex, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Text } from "@chakra-ui/react";
import MiniNav from "./MiniNav";
import { useNavigate } from "react-router-dom";
import { BsChatFill } from "react-icons/bs";
import { MdClose } from "react-icons/md";
import { FiLoader } from "react-icons/fi";
import { Box } from "@chakra-ui/react";
import { MdContentCopy } from "react-icons/md";
import { format } from "date-fns";
import { FiEdit } from "react-icons/fi";
import { Select } from "@chakra-ui/react";
import { nigeriaBanks } from "../../data/banksList";

const TransactionLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="animate-spin text-[#318AE6] text-4xl mb-4">
        <FiLoader />
      </div>
      <p className="text-[#E4E4E4] text-lg font-medium">Loading your transactions...</p>
    </div>
  );
}

const DisplayTransaction = ({ userResponse }) => {
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState([]);
  const toast = useToast();
  const navigate = useNavigate();
  const [showWaybillPopup, setShowWaybillPopup] = useState({});
  const [buyershowWaybillPopup, setBuyerShowWaybillPopup] = useState({});
  const [waybillDetails, setWaybillDetails] = useState({
    item: "",
    image: null,
    price: "",
    shippingAddress: "",
    trackingNumber: "",
    deliveryDate: "",
  });
  const [buyerWaybillDetails, setBuyerWaybillDetails] = useState({});
  const [imageUrl, setImageUrl] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [errors, setErrors] = useState({});
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    paymentBank: '',
    paymentAccountNumber: '',
    selectedBankCode: '',
    paymentAmount: ''
  });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [isConfirming, setIsConfirming] = useState({});

  useEffect(() => {
    const socket = io(BASE_URL, {
      auth: {
        token: localStorage.getItem('auth-token'),
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      if (currentUser?._id) {
        socket.emit('join-room', currentUser._id);
      }
    });

    socket.on('transactionCompleted', (data) => {
      console.log('Transaction completed:', data);
      toast({
        title: 'Transaction Completed',
        description: `Transaction ${data.transactionId} has been completed. Funds have been released.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchTransactionData();
      fetchWalletBalance();
    });

    socket.on('balanceUpdate', (data) => {
      console.log('Balance update:', data);
      setWalletBalance(data.balance);
      toast({
        title: 'Wallet Updated',
        description: `Your wallet has been credited with ₦${data.transaction.amount.toFixed(2)}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    });

    socket.on('transactionUpdated', (data) => {
      console.log('Transaction updated:', data);
      toast({
        title: 'Transaction Update',
        description: data.message,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      fetchTransactionData();
    });

    socket.on('reconnect', () => {
      console.log('Socket.IO reconnected');
      if (currentUser?._id) {
        socket.emit('join-room', currentUser._id);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser?._id]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${BASE_URL}/api/users/user-details`, {
          headers: { "auth-token": token },
        });
        setCurrentUser(response.data);
      } catch (error) {
        console.error("Error fetching current user:", error);
        toast({
          title: "Error fetching user information",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurrentUser();
  }, [toast]);

  useEffect(() => {
    const checkPendingPayment = async () => {
      const pendingTxId = localStorage.getItem("pendingPaymentTxId");
      if (!pendingTxId) return;

      const token = localStorage.getItem("auth-token");
      if (!token) return;

      try {
        const statusRes = await axios.get(
          `${BASE_URL}/api/transactions/check-funded?transactionId=${pendingTxId}`,
          { headers: { "auth-token": token } }
        );

        if (statusRes.data.funded) {
          localStorage.removeItem("pendingPaymentTxId");
          toast({
            title: "Payment Successful!",
            description: "Your transaction has been funded successfully.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          fetchTransactionData();
          fetchWalletBalance();
        }
      } catch (err) {
        console.error("Error checking pending payment:", err);
      }
    };
    checkPendingPayment();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const fetchTransactions = async () => {
      const token = localStorage.getItem("auth-token");
      try {
        const response = await axios.get(`${BASE_URL}/api/transactions/get-transaction`, {
          headers: { "auth-token": token },
        });
        setTransactions(response.data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast({
          title: "Error fetching transactions",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchTransactionData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (isMobileView) setIsSidebarCollapsed(true);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const fetchWalletTransactions = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await axios.get(`${BASE_URL}/api/wallet/transactions`, {
        headers: { 'auth-token': token },
      });
      setWalletTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchWalletTransactions();
    }
  }, [currentUser]);

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await axios.get(`${BASE_URL}/api/wallet/balance`, {
        headers: { 'auth-token': token },
      });
      setWalletBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleSidebarCollapseChange = (isCollapsed) => {
    setIsSidebarCollapsed(isCollapsed);
  };

  const fetchTransactionData = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const res = await axios.get(`${BASE_URL}/api/transactions/get-transaction`, {
        headers: { "auth-token": token }
      });
      setTransactions(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleShowProfile = () => {
    setShowToggleContainer(false);
    setShowProfile(true);
  };

  const handleMyTransaction = () => {
    setShowToggleContainer(true);
    setShowProfile(false);
  };

  const handleChatButton = async (transactionId) => {
    const token = localStorage.getItem("auth-token");
    try {
      const response = await axios.post(`${BASE_URL}/api/transactions/create-chatroom`,
        { transactionId },
        { headers: { "auth-token": token } });
      navigate(`/chat/${response.data.chatroomId}`);
    } catch (error) {
      console.error("Error creating chatroom:", error);
      toast({
        title: "Error creating chatroom",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleWaybillPopup = (transactionId) => {
    setShowWaybillPopup({ ...showWaybillPopup, [transactionId]: true });
  };

  const ClosehandleWaybillPopup = (transactionId) => {
    setShowWaybillPopup({ ...showWaybillPopup, [transactionId]: false });
    setErrors({});
    setWaybillDetails({
      item: "",
      image: null,
      price: "",
      shippingAddress: "",
      trackingNumber: "",
      deliveryDate: "",
    });
  };

  const handleBuyerWaybillPopup = async (transactionId) => {
    setBuyerShowWaybillPopup({ ...buyershowWaybillPopup, [transactionId]: true });
    await fetchBuyerWaybillDetails(transactionId);
  };

  const ClosehandleBuyerWaybillPopup = (transactionId) => {
    setBuyerShowWaybillPopup({ ...buyershowWaybillPopup, [transactionId]: false });
  };

  const fetchBuyerWaybillDetails = async (transactionId) => {
    const token = localStorage.getItem("auth-token");
    try {
      const response = await axios.get(`${BASE_URL}/api/transactions/${transactionId}`, {
        headers: { "auth-token": token },
      });
      const { image, item, price, shippingAddress, trackingNumber, deliveryDate } = response.data.waybillDetails || {};
      const imagePath = image ? `${BASE_URL}/${image}` : "";
      setImageUrl(imagePath);
      setBuyerWaybillDetails({
        ...buyerWaybillDetails,
        [transactionId]: { item, price, shippingAddress, trackingNumber, deliveryDate, image: imagePath },
      });
    } catch (error) {
      console.error("Error fetching waybill details:", error);
      toast({
        title: "Error fetching waybill details",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleWaybillSubmit = async (transactionId) => {
    const newErrors = {};
    if (!waybillDetails.item) newErrors.item = "Item name is required";
    if (!waybillDetails.price) newErrors.price = "Price is required";
    if (!waybillDetails.shippingAddress) newErrors.shippingAddress = "Shipping address is required";
    if (!waybillDetails.trackingNumber) newErrors.trackingNumber = "Tracking number is required";
    if (!waybillDetails.deliveryDate) newErrors.deliveryDate = "Delivery date is required";
    if (!waybillDetails.image) newErrors.image = "Image proof is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const token = localStorage.getItem("auth-token");
    const formData = new FormData();
    formData.append("transactionId", transactionId);
    formData.append("item", waybillDetails.item);
    formData.append("price", waybillDetails.price);
    formData.append("shippingAddress", waybillDetails.shippingAddress);
    formData.append("trackingNumber", waybillDetails.trackingNumber);
    formData.append("deliveryDate", waybillDetails.deliveryDate);
    if (waybillDetails.image) formData.append("image", waybillDetails.image);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/transactions/submit-waybill`,
        formData,
        { headers: { "auth-token": token, "Content-Type": "multipart/form-data" } }
      );
      toast({
        title: "Waybill details submitted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setShowWaybillPopup({ ...showWaybillPopup, [transactionId]: false });
      setWaybillDetails({
        item: "",
        image: null,
        price: "",
        shippingAddress: "",
        trackingNumber: "",
        deliveryDate: "",
      });
      fetchTransactionData();
    } catch (error) {
      console.error("Error submitting waybill details:", error);
      toast({
        title: "Error submitting waybill details",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const downloadImage = (url) => {
    if (!url) {
      console.error("No image URL provided");
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cancelTransaction = async (transactionId) => {
    const token = localStorage.getItem('auth-token');
    try {
      const response = await axios.put(
        `${BASE_URL}/api/transactions/cancel/${transactionId}`,
        {},
        {
          headers: { 'auth-token': token },
        }
      );
      toast({
        title: 'Transaction Cancelled',
        description: 'Transaction has been cancelled. Any locked funds have been refunded.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setTransactions(transactions.filter((t) => t._id !== transactionId));
      await fetchWalletBalance();
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel transaction.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleConfirm = async (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming({ ...isConfirming, [transactionId]: true });
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        toast({
          title: 'User not authenticated',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      const transaction = transactions.find((t) => t._id === transactionId);
      if (!transaction) {
        toast({
          title: 'Transaction not found',
          description: 'The selected transaction could not be found.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      if (!transaction.participants || transaction.participants.length === 0) {
        toast({
          title: 'No participant',
          description: 'Please wait for someone to join.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      if (transaction.status !== 'pending') {
        toast({
          title: 'Invalid transaction status',
          description: 'Only pending transactions can be confirmed.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      setSelectedTransactionId(transactionId);
      setModalVisible(true);
    } catch (error) {
      console.error('Error in handleConfirm:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Could not process confirmation. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsConfirming({ ...isConfirming, [transactionId]: false });
    }
  };

  const completeTransaction = async (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming({ ...isConfirming, [transactionId]: true });
    try {
      const token = localStorage.getItem('auth-token');
      const response = await axios.post(
        `${BASE_URL}/api/transactions/confirm`,
        { transactionId },
        { headers: { 'auth-token': token } }
      );
      const { buyerConfirmed, sellerConfirmed, status } = response.data.transaction;
      if (status === 'completed') {
        toast({
          title: 'Transaction Completed',
          description: 'Both parties have confirmed. Funds have been released to the seller.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else if (buyerConfirmed || sellerConfirmed) {
        toast({
          title: 'Confirmation Recorded',
          description: 'Waiting for the other party to confirm.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
      await fetchTransactionData();
      await fetchWalletBalance();
    } catch (error) {
      console.error('Error in completeTransaction:', error);
      const errorMessage = error.response?.data?.message || 'Could not complete transaction. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsConfirming({ ...isConfirming, [transactionId]: false });
      setModalVisible(false);
      setSelectedTransactionId(null);
    }
  };

  const handleFundWithWallet = async (transaction) => {
    const token = localStorage.getItem("auth-token");
    try {
      if (transaction.locked) {
        toast({
          title: "Error",
          description: "Funds are already locked for this transaction.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      if (!transaction._id || !transaction.paymentAmount) {
        toast({
          title: "Error",
          description: "Transaction data is incomplete. Please refresh and try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      if (transaction.paymentAmount <= 0) {
        toast({
          title: "Error",
          description: "Payment amount must be greater than zero.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      const response = await axios.post(
        `${BASE_URL}/api/transactions/fund-transaction`,
        {
          transactionId: transaction._id,
          amount: transaction.paymentAmount,
        },
        {
          headers: {
            "auth-token": token,
          },
        }
      );
      toast({
        title: "Transaction funded successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchTransactionData();
      await fetchWalletBalance();
    } catch (error) {
      console.error("Error funding transaction with wallet:", error);
      let errorMessage = error.response?.data?.message || "Could not fund the transaction. Please try again.";
      if (error.response?.status === 400 && errorMessage.includes("Insufficient")) {
        errorMessage = "Insufficient funds in your wallet. Please top up and try again.";
      }
      toast({
        title: "Error funding transaction",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditPaymentDetails = (transaction) => {
    setCurrentTransaction(transaction);
    setPaymentDetails({
      paymentBank: transaction.paymentBank || '',
      paymentAccountNumber: transaction.paymentAccountNumber || '',
      selectedBankCode: transaction.paymentBankCode || '',
      paymentAmount: transaction.paymentAmount || ''
    });
    setShowPaymentDetailsModal(true);
  };

  const closePaymentDetailsModal = () => {
    setShowPaymentDetailsModal(false);
    setCurrentTransaction(null);
    setPaymentDetails({
      paymentBank: '',
      paymentAccountNumber: '',
      selectedBankCode: '',
      paymentAmount: ''
    });
    setPaymentErrors({});
  };

  const validatePaymentDetails = () => {
    const newErrors = {};
    if (!paymentDetails.selectedBankCode) {
      newErrors.selectedBankCode = "Please select a bank";
    }
    if (!paymentDetails.paymentAccountNumber || !/^\d{10}$/.test(paymentDetails.paymentAccountNumber)) {
      newErrors.paymentAccountNumber = "Please enter a valid 10-digit account number";
    }
    if (!paymentDetails.paymentAmount || paymentDetails.paymentAmount <= 0) {
      newErrors.paymentAmount = "Please enter a valid amount greater than 0";
    }
    return newErrors;
  };

  const submitPaymentDetails = async (e) => {
    e.preventDefault();
    if (!currentTransaction) return;

    const newErrors = validatePaymentDetails();
    if (Object.keys(newErrors).length > 0) {
      setPaymentErrors(newErrors);
      return;
    }

    setPaymentErrors({});

    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        toast({
          title: "User not authenticated",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      const response = await axios.put(
        `${BASE_URL}/api/transactions/update-payment-details/${currentTransaction._id}`,
        {
          paymentBank: paymentDetails.paymentBank,
          paymentAccountNumber: paymentDetails.paymentAccountNumber,
          selectedBankCode: paymentDetails.selectedBankCode,
          paymentAmount: parseFloat(paymentDetails.paymentAmount)
        },
        { headers: { "auth-token": token } }
      );
      toast({
        title: "Payment details updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      closePaymentDetailsModal();
      await fetchTransactionData();
    } catch (error) {
      console.error("Error updating payment details:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Could not update payment details",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleBankSelection = (e) => {
    const bankCode = e.target.value;
    const selectedBank = nigeriaBanks.find(bank => bank.code === bankCode);
    setPaymentDetails({
      ...paymentDetails,
      selectedBankCode: bankCode,
      paymentBank: selectedBank ? selectedBank.name : ''
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    });
  };

  return (
    <Box className="flex min-h-screen">
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
        onCollapseChange={handleSidebarCollapseChange}
      />
      <div
        className={`transition-all duration-300 flex-1 ${!isMobile ? (isSidebarCollapsed ? "ml-[80px]" : "ml-[280px]") : "ml-0"}`}
      >
        <div className={showToggleContainer ? "toggleContainer" : "hidden"}>
          <div><MiniNav /></div>
          <div className="px-2 sm:px-4 md:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-24 pb-10 sm:pb-14 md:pb-20 w-full max-w-[1440px] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">My Transactions</h1>
              {walletBalance !== null && (
                <Text
                  fontSize={{ base: "sm", sm: "md", md: "lg" }}
                  fontWeight="medium"
                  color="white"
                  className="mt-2 sm:mt-0"
                >
                  Wallet Balance: ₦{walletBalance.toFixed(2)}
                </Text>
              )}
            </div>
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex overflow-x-auto bg-[#111518] rounded-lg border border-gray-800">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`flex-1 min-w-[80px] sm:min-w-[100px] px-2 sm:px-3 py-1 sm:py-2 rounded-md text-center transition-all text-xs sm:text-sm md:text-base ${
                      activeTab === "all"
                        ? "bg-[#967532] text-white font-medium"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    All{" "}
                    <span className="ml-1 px-1 py-0.5 bg-[#1d2225] rounded-full text-[10px] sm:text-xs">
                      {transactions.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("active")}
                    className={`flex-1 min-w-[80px] sm:min-w-[100px] px-2 sm:px-3 py-1 sm:py-2 rounded-md text-center transition-all text-xs sm:text-sm md:text-base ${
                      activeTab === "active"
                        ? "bg-[#967532] text-white font-medium"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Active{" "}
                    <span className="ml-1 px-1 py-0.5 bg-[#1d2225] rounded-full text-[10px] sm:text-xs">
                      {transactions.filter((t) => t.status === "pending").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("completed")}
                    className={`flex-1 min-w-[80px] sm:min-w-[100px] px-2 sm:px-3 py-1 sm:py-2 rounded-md text-center transition-all text-xs sm:text-sm md:text-base ${
                      activeTab === "completed"
                        ? "bg-[#967532] text-white font-medium"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Completed{" "}
                    <span className="ml-1 px-1 py-0.5 bg-[#1d2225] rounded-full text-[10px] sm:text-xs">
                      {transactions.filter((t) => t.status === "completed").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("cancelled")}
                    className={`flex-1 min-w-[80px] sm:min-w-[100px] px-2 sm:px-3 py-1 sm:py-2 rounded-md text-center transition-all text-xs sm:text-sm md:text-base ${
                      activeTab === "cancelled"
                        ? "bg-[#967532] text-white font-medium"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Cancelled{" "}
                    <span className="ml-1 px-1 py-0.5 bg-[#1d2225] rounded-full text-[10px] sm:text-xs">
                      {transactions.filter((t) => t.status === "cancelled").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("wallet")}
                    className={`flex-1 min-w-[80px] sm:min-w-[100px] px-2 sm:px-3 py-1 sm:py-2 rounded-md text-center transition-all text-xs sm:text-sm md:text-base ${
                      activeTab === "wallet"
                        ? "bg-[#967532] text-white font-medium"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Wallet History{" "}
                    <span className="ml-1 px-1 py-0.5 bg-[#1d2225] rounded-full text-[10px] sm:text-xs">
                      {walletTransactions.length}
                    </span>
                  </button>
                </div>
                <div className="relative w-full max-w-[200px] sm:max-w-[300px] md:max-w-md group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-3 pointer-events-none text-[#967532] group-focus-within:text-[#318AE6] transition-colors">
                    <FiSearch className="text-base sm:text-lg" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-1.5 sm:py-2.5 pl-8 sm:pl-10 pr-8 sm:pr-10 bg-[#111518] border border-[#967532] rounded-lg text-white focus:border-[#967532] focus:outline-none transition-all text-xs sm:text-sm md:text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 text-gray-400 hover:text-white transition-colors"
                    >
                      <MdClose className="text-base sm:text-lg" />
                    </button>
                  )}
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#318AE6] to-[#5B43D6] scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left"></div>
                </div>
              </div>
            </div>
            <div className="w-full">
              {isLoading ? (
                <TransactionLoader />
              ) : activeTab === "wallet" ? (
                <Box
                  mt={{ base: 4, sm: 6 }}
                  p={{ base: 2, sm: 4 }}
                  bg="#111518"
                  borderRadius={{ base: "md", sm: "lg" }}
                  borderWidth="1px"
                  borderColor="gray.800"
                  // maxH={{ base: "300px", sm: "400px" }}
                  overflowY="auto"
                  className="w-full"
                >
                  <Text
                    fontSize={{ base: "md", sm: "lg", md: "xl" }}
                    fontWeight="bold"
                    color="white"
                    mb={{ base: 2, sm: 4 }}
                  >
                    Wallet Transaction History
                  </Text>
                  {walletTransactions.length === 0 ? (
                    <Text color="gray.400" fontSize={{ base: "sm", sm: "md" }}>
                      No wallet transactions found.
                    </Text>
                  ) : (
                    walletTransactions.map((tx, index) => (
                      <Box
                        key={`${tx.reference}-${tx.createdAt}-${index}`}
                        mb={{ base: 2, sm: 4 }}
                        p={{ base: 2, sm: 3 }}
                        bg="#1d2225"
                        borderRadius="md"
                        className="w-full"
                      >
                        <Flex
                          justify="space-between"
                          flexWrap="wrap"
                          gap={{ base: 1, sm: 2 }}
                        >
                          <Text
                            color="white"
                            fontSize={{ base: "xs", sm: "sm", md: "md" }}
                          >
                            Reference: {tx.reference}
                          </Text>
                          <Text
                            color={tx.type === "deposit" ? "green.300" : "red.300"}
                            fontSize={{ base: "xs", sm: "sm", md: "md" }}
                          >
                            {tx.type === "deposit" ? "+" : "-"} ₦{tx.amount.toFixed(2)}
                          </Text>
                        </Flex>
                        <Text color="gray.400" fontSize={{ base: "xs", sm: "sm" }}>
                          Purpose: {tx.metadata.purpose}
                        </Text>
                        <Text color="gray.400" fontSize={{ base: "xs", sm: "sm" }}>
                          Date: {new Date(tx.createdAt).toLocaleString()}
                        </Text>
                      </Box>
                    ))
                  )}
                </Box>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] sm:h-[60vh]">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-4 text-gray-400">📭</div>
                  <p className="text-[#E4E4E4] text-base sm:text-lg font-medium">
                    No transactions created
                  </p>
                  <p className="text-gray-400 text-sm sm:text-base mt-1 sm:mt-2">
                    Create a new transaction to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                  {transactions
                    .filter((transaction) => {
                      if (activeTab === "active" && transaction.status !== "pending")
                        return false;
                      if (activeTab === "completed" && transaction.status !== "completed")
                        return false;
                      if (activeTab === "cancelled" && transaction.status !== "cancelled")
                        return false;
                      return (
                        transaction.paymentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        transaction._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        transaction.email.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                    })
                    .map((transaction) => {
                      const isCreator =
                        currentUser?._id ===
                        (transaction.userId._id?.toString() || transaction.userId?.toString());
                      const isParticipant = transaction.participants?.some(
                        (p) =>
                          p._id?.toString() === currentUser?._id ||
                          p.toString() === currentUser?._id
                      );
                      const isBuyer =
                        (isCreator && transaction.selectedUserType === "buyer") ||
                        (isParticipant && transaction.selectedUserType !== "buyer");
                      return (
                        <Box
                          key={transaction._id}
                          className="transaction-card text-[11px] sm:text-[13px] text-gray-400 px-2 sm:px-4 py-3 sm:py-5 bg-[#111518] rounded-lg sm:rounded-2xl border border-gray-800 transition-all hover:shadow-[#318AE630]"
                        >
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <div className="flex flex-col">
                              {transaction.participants && transaction.participants.length > 0 ? (
                                <p className="font-bold text-sm sm:text-base md:text-lg text-white truncate">
                                  {typeof transaction.participants[0] === "object" &&
                                  transaction.participants[0].firstName
                                    ? `${transaction.participants[0].firstName} ${
                                        transaction.participants[0].lastName || ""
                                      }`
                                    : "Participant joined"}
                                </p>
                              ) : (
                                <p className="text-xs sm:text-sm text-gray-400">
                                  No participant yet
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <button
                                onClick={() => handleEditPaymentDetails(transaction)}
                                className="text-base sm:text-lg md:text-xl bg-[#1d2225] p-1 sm:p-1.5 rounded-full hover:bg-[#967532] text-white transition-all"
                                title="Edit Payment Details"
                              >
                                <FiEdit size={12} />
                              </button>
                              <button
                                onClick={() => handleChatButton(transaction._id)}
                                className="text-base sm:text-lg md:text-xl bg-[#1d2225] p-1 sm:p-1.5 rounded-full hover:bg-[#318AE6] transition-all"
                              >
                                <BsChatFill size={12} />
                              </button>
                            </div>
                          </div>
                          <div className="bg-[#1d2225] rounded-lg p-1 sm:p-2 mb-2 sm:mb-3 flex items-center justify-between">
                            <div className="max-w-[70%] sm:max-w-[80%]">
                              <div className="flex items-center">
                                <p className="text-xs mb-1">
                                  Copy the Transaction ID and send to the other party
                                </p>
                              </div>
                              <p className="font-medium text-xs sm:text-sm truncate">
                                {transaction._id}
                              </p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(transaction._id)}
                              className="text-gray-400 hover:text-[#318AE6] transition-all"
                            >
                              <MdContentCopy size={12} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 mb-2 sm:mb-4">
                            <div className="bg-[#1d2225] rounded-lg p-1 sm:p-2">
                              <p className="text-gray-400 text-xs mb-1">Email</p>
                              <p className="font-medium text-xs sm:text-sm truncate">
                                {transaction.email}
                              </p>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-1 sm:p-2">
                              <p className="text-gray-400 text-xs mb-1">Amount</p>
                              <p className="font-medium text-xs sm:text-sm text-[#318AE6]">
                                {transaction.paymentAmount}
                              </p>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-1 sm:p-2">
                              <p className="text-gray-400 text-xs mb-1">User Type</p>
                              <p className="font-medium text-xs sm:text-sm capitalize">
                                {isBuyer ? "buyer" : "seller"}
                              </p>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-1 sm:p-2">
                              <p className="text-gray-400 text-xs mb-1">Status</p>
                              <div
                                className={`inline-flex items-center px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                                  transaction.status === "completed"
                                    ? "bg-green-900 text-green-300"
                                    : transaction.status === "cancelled"
                                    ? "bg-red-900 text-red-300"
                                    : "bg-yellow-900 text-yellow-300"
                                }`}
                              >
                                {transaction.status}
                              </div>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-1 sm:p-2">
                              <p className="text-gray-400 text-xs mb-1">Bank</p>
                              <p className="font-medium text-xs sm:text-sm truncate">
                                {transaction.paymentBank}
                              </p>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-1 sm:p-2">
                              <p className="text-gray-400 text-xs mb-1">Account Number</p>
                              <p className="font-medium text-xs sm:text-sm">
                                {transaction.paymentAccountNumber}
                              </p>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-1 sm:p-2">
                              <p className="text-gray-400 text-xs mb-1">Waybill Status</p>
                              <div
                                className={`inline-flex items-center px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                                  transaction.proofOfWaybill === "confirmed"
                                    ? "bg-green-900 text-green-300"
                                    : "bg-yellow-900 text-yellow-300"
                                }`}
                              >
                                {transaction.proofOfWaybill}
                              </div>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-1 sm:p-2">
                              <p className="text-gray-400 text-xs mb-1">Created</p>
                              <p className="font-medium text-xs sm:text-sm">
                                {transaction.createdAt
                                  ? format(new Date(transaction.createdAt), "MMM dd, yyyy")
                                  : "N/A"}
                              </p>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-1 sm:p-2">
                              <p className="text-gray-400 text-xs mb-1">Escrow Status</p>
                              <div
                                className={`inline-flex items-center px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                                  transaction.locked
                                    ? "bg-yellow-900 text-yellow-300"
                                    : transaction.status === "completed"
                                    ? "bg-green-900 text-green-300"
                                    : "bg-gray-900 text-gray-300"
                                }`}
                              >
                                {transaction.locked
                                  ? `Locked: ${transaction.lockedAmount}`
                                  : transaction.status === "completed"
                                  ? "Released"
                                  : "Not Locked"}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 sm:mt-3">
                            <details className="bg-[#1d2225] rounded-lg p-1 sm:p-2">
                              <summary className="font-medium cursor-pointer flex items-center justify-between text-xs sm:text-sm">
                                <span>Description</span>
                                <span className="text-xs text-gray-400">Click to expand</span>
                              </summary>
                              <p className="mt-1 sm:mt-2 text-gray-300 text-xs sm:text-sm whitespace-pre-wrap">
                                {transaction.paymentDescription}
                              </p>
                            </details>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2 mt-2 sm:mt-4">
                            <button
                              className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg font-bold transition-all hover:bg-red-600 bg-red-700 text-white flex-1 text-xs sm:text-sm"
                              onClick={() => cancelTransaction(transaction._id)}
                            >
                              Cancel
                            </button>
                            <button
                              className="px-2 sm:px-3 py-1 sm:py-2 bg-[#318AE6] hover:bg-[#2279d8] transition-all rounded-lg font-bold text-white flex-1 text-xs sm:text-sm"
                              onClick={() =>
                                isBuyer
                                  ? handleBuyerWaybillPopup(transaction._id)
                                  : handleWaybillPopup(transaction._id)
                              }
                            >
                              {isBuyer ? "View Waybill" : "Input Waybill"}
                            </button>
                            {transaction.status === "pending" && (
                              <button
                                className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg font-bold transition-all text-white flex-1 text-xs sm:text-sm ${
                                  isConfirming[transaction._id]
                                    ? "bg-gray-600 cursor-not-allowed flex items-center justify-center"
                                    : "bg-green-700 hover:bg-green-600"
                                }`}
                                onClick={() => handleConfirm(transaction._id)}
                                disabled={isConfirming[transaction._id]}
                              >
                                {isConfirming[transaction._id] ? (
                                  <FiLoader className="animate-spin mr-1 sm:mr-2" />
                                ) : null}
                                Complete
                              </button>
                            )}
                            {isBuyer && !transaction.locked && transaction.status === "pending" && (
                              <button
                                className="px-2 sm:px-3 py-1 sm:py-2 bg-[#967532] hover:bg-[#7a5c28] transition-all rounded-lg font-bold text-white flex-1 text-xs sm:text-sm"
                                onClick={() => handleFundWithWallet(transaction)}
                              >
                                Fund with Wallet
                              </button>
                            )}
                          </div>
                          {showWaybillPopup[transaction._id] && (
                            <div className="fixed z-50 inset-0 bg-[#111518] bg-opacity-95 px-2 sm:px-4 py-4 sm:py-6 overflow-y-auto">
                              <div className="max-w-[90%] sm:max-w-lg mx-auto bg-[#1A1E21] p-4 sm:p-6 rounded-xl shadow-xl border border-gray-800">
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => ClosehandleWaybillPopup(transaction._id)}
                                    className="text-xl sm:text-2xl hover:text-[#318AE6] transition-all"
                                  >
                                    <MdClose />
                                  </button>
                                </div>
                                <form
                                  className="mt-3 sm:mt-4"
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleWaybillSubmit(transaction._id);
                                  }}
                                  encType="multipart/form-data"
                                >
                                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-center text-white">
                                    Seller Waybill Proof
                                  </h1>
                                  <p className="text-sm sm:text-base text-center pt-2 sm:pt-3 text-gray-300">
                                    I, the seller, confirm that I have shipped the goods.
                                  </p>
                                  <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                                    <div>
                                      <h3 className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                                        Item:
                                      </h3>
                                      <input
                                        type="text"
                                        className="text-white bg-[#111518] border border-[#318AE6] pl-3 sm:pl-4 outline-none w-full h-8 sm:h-10 rounded-lg text-xs sm:text-sm"
                                        value={waybillDetails.item}
                                        onChange={(e) =>
                                          setWaybillDetails({
                                            ...waybillDetails,
                                            item: e.target.value,
                                          })
                                        }
                                      />
                                      {errors.item && (
                                        <p className="text-red-500 text-xs mt-1">{errors.item}</p>
                                      )}
                                    </div>
                                    <div>
                                      <h3 className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                                        Image:
                                      </h3>
                                      <div className="border-2 border-dashed border-[#318AE6] rounded-lg p-2 sm:p-4 text-center">
                                        <input
                                          type="file"
                                          className="hidden"
                                          id={`waybill-image-${transaction._id}`}
                                          accept="image/*"
                                          onChange={(e) =>
                                            setWaybillDetails({
                                              ...waybillDetails,
                                              image: e.target.files[0],
                                            })
                                          }
                                        />
                                        <label
                                          htmlFor={`waybill-image-${transaction._id}`}
                                          className="cursor-pointer flex flex-col items-center"
                                        >
                                          <span className="text-xl sm:text-2xl mb-1 sm:mb-2 text-[#318AE6]">
                                            📷
                                          </span>
                                          <span className="text-gray-300 text-xs sm:text-sm">
                                            Click to upload proof of shipment
                                          </span>
                                        </label>
                                        {waybillDetails.image && (
                                          <p className="text-gray-300 text-xs mt-1 sm:mt-2">
                                            Selected: {waybillDetails.image.name}
                                          </p>
                                        )}
                                      </div>
                                      {errors.image && (
                                        <p className="text-red-500 text-xs mt-1">{errors.image}</p>
                                      )}
                                    </div>
                                    <div>
                                      <h3 className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                                        Price of waybill:
                                      </h3>
                                      <input
                                        type="number"
                                        className="text-white bg-[#111518] border border-[#318AE6] pl-3 sm:pl-4 outline-none w-full h-8 sm:h-10 rounded-lg text-xs sm:text-sm"
                                        value={waybillDetails.price}
                                        onChange={(e) =>
                                          setWaybillDetails({
                                            ...waybillDetails,
                                            price: e.target.value,
                                          })
                                        }
                                      />
                                      {errors.price && (
                                        <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                                      )}
                                    </div>
                                    <div>
                                      <h3 className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                                        Shipping / Receiver’s Address:
                                      </h3>
                                      <input
                                        type="text"
                                        className="text-white bg-[#111518] border border-[#318AE6] pl-3 sm:pl-4 outline-none w-full h-8 sm:h-10 rounded-lg text-xs sm:text-sm"
                                        value={waybillDetails.shippingAddress}
                                        onChange={(e) =>
                                          setWaybillDetails({
                                            ...waybillDetails,
                                            shippingAddress: e.target.value,
                                          })
                                        }
                                      />
                                      {errors.shippingAddress && (
                                        <p className="text-red-500 text-xs mt-1">
                                          {errors.shippingAddress}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <h3 className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                                        Tracking Number:
                                      </h3>
                                      <input
                                        type="text"
                                        className="text-white bg-[#111518] border border-[#318AE6] pl-3 sm:pl-4 outline-none w-full h-8 sm:h-10 rounded-lg text-xs sm:text-sm"
                                        value={waybillDetails.trackingNumber}
                                        onChange={(e) =>
                                          setWaybillDetails({
                                            ...waybillDetails,
                                            trackingNumber: e.target.value,
                                          })
                                        }
                                      />
                                      {errors.trackingNumber && (
                                        <p className="text-red-500 text-xs mt-1">
                                          {errors.trackingNumber}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <h3 className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                                        Delivery Date:
                                      </h3>
                                      <input
                                        type="date"
                                        className="text-white bg-[#111518] border border-[#318AE6] pl-3 sm:pl-4 outline-none w-full h-8 sm:h-10 rounded-lg text-xs sm:text-sm"
                                        value={waybillDetails.deliveryDate}
                                        onChange={(e) =>
                                          setWaybillDetails({
                                            ...waybillDetails,
                                            deliveryDate: e.target.value,
                                          })
                                        }
                                      />
                                      {errors.deliveryDate && (
                                        <p className="text-red-500 text-xs mt-1">
                                          {errors.deliveryDate}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2 mt-4 sm:mt-6">
                                    <button
                                      type="button"
                                      onClick={() => ClosehandleWaybillPopup(transaction._id)}
                                      className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-xs sm:text-sm transition-all"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      className="px-3 sm:px-4 py-1 sm:py-2 bg-[#318AE6] hover:bg-[#2279d8] rounded-lg text-white text-xs sm:text-sm transition-all"
                                    >
                                      Submit
                                    </button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          )}
                          {buyershowWaybillPopup[transaction._id] && (
                            <div className="fixed z-50 inset-0 bg-[#111518] bg-opacity-95 px-2 sm:px-4 py-4 sm:py-6 overflow-y-auto">
                              <div className="max-w-[90%] sm:max-w-lg mx-auto bg-[#1A1E21] p-4 sm:p-6 rounded-xl shadow-xl border border-gray-800">
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => ClosehandleBuyerWaybillPopup(transaction._id)}
                                    className="text-xl sm:text-2xl hover:text-[#318AE6] transition-all"
                                  >
                                    <MdClose />
                                  </button>
                                </div>
                                <div className="mt-3 sm:mt-4">
                                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-center text-white">
                                    Waybill Details
                                  </h1>
                                  <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 text-gray-300">
                                    <div>
                                      <h3 className="text-xs sm:text-sm mb-1 sm:mb-2">Item:</h3>
                                      <p className="text-xs sm:text-sm">
                                        {buyerWaybillDetails[transaction._id]?.item || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <h3 className="text-xs sm:text-sm mb-1 sm:mb-2">Image:</h3>
                                      {buyerWaybillDetails[transaction._id]?.image ? (
                                        <div className="flex flex-col items-center">
                                          <img
                                            src={buyerWaybillDetails[transaction._id].image}
                                            alt="Waybill Proof"
                                            className="max-w-full h-auto rounded-lg"
                                          />
                                          <button
                                            onClick={() =>
                                              downloadImage(buyerWaybillDetails[transaction._id].image)
                                            }
                                            className="mt-2 px-3 sm:px-4 py-1 sm:py-2 bg-[#318AE6] hover:bg-[#2279d8] rounded-lg text-white text-xs sm:text-sm"
                                          >
                                            Download Image
                                          </button>
                                        </div>
                                      ) : (
                                        <p className="text-xs sm:text-sm">No image provided</p>
                                      )}
                                    </div>
                                    <div>
                                      <h3 className="text-xs sm:text-sm mb-1 sm:mb-2">Price:</h3>
                                      <p className="text-xs sm:text-sm">
                                        {buyerWaybillDetails[transaction._id]?.price || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <h3 className="text-xs sm:text-sm mb-1 sm:mb-2">
                                        Shipping Address:
                                      </h3>
                                      <p className="text-xs sm:text-sm">
                                        {buyerWaybillDetails[transaction._id]?.shippingAddress ||
                                          "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <h3 className="text-xs sm:text-sm mb-1 sm:mb-2">
                                        Tracking Number:
                                      </h3>
                                      <p className="text-xs sm:text-sm">
                                        {buyerWaybillDetails[transaction._id]?.trackingNumber ||
                                          "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <h3 className="text-xs sm:text-sm mb-1 sm:mb-2">
                                        Delivery Date:
                                      </h3>
                                      <p className="text-xs sm:text-sm">
                                        {buyerWaybillDetails[transaction._id]?.deliveryDate
                                          ? format(
                                              new Date(
                                                buyerWaybillDetails[transaction._id].deliveryDate
                                              ),
                                              "MMM dd, yyyy"
                                            )
                                          : "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex justify-end mt-4 sm:mt-6">
                                    <button
                                      onClick={() => ClosehandleBuyerWaybillPopup(transaction._id)}
                                      className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-xs sm:text-sm transition-all"
                                    >
                                      Close
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Box>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={showProfile ? "profileContainer" : "hidden"}>
          {/* Profile content would go here */}
        </div>
        <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)}>
          <ModalOverlay />
          <ModalContent bg="#1A1E21" color="white">
            <ModalHeader>Confirm Transaction</ModalHeader>
            <ModalBody>
              <Text>
                Are you sure you want to confirm transaction {selectedTransactionId}? This
                action cannot be undone.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="gray" mr={3} onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => completeTransaction(selectedTransactionId)}
                isLoading={isConfirming[selectedTransactionId]}
              >
                Confirm
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {showPaymentDetailsModal && (
          <Modal isOpen={showPaymentDetailsModal} onClose={closePaymentDetailsModal}>
            <div className="fixed inset-0 bg-[#111518] bg-opacity-95 flex items-center justify-center px-2 sm:px-4">
              <div className="bg-[#1A1E21] p-4 sm:p-6 rounded-xl max-w-[90%] sm:max-w-lg w-full border border-gray-800">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Edit Payment Details
                  </h2>
                  <button
                    onClick={closePaymentDetailsModal}
                    className="text-xl sm:text-2xl hover:text-[#318AE6] transition-all"
                  >
                    <MdClose />
                  </button>
                </div>
                <form onSubmit={submitPaymentDetails}>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2 block">
                        Bank
                      </label>
                      <Select
                        value={paymentDetails.selectedBankCode}
                        onChange={handleBankSelection}
                        placeholder="Select a bank"
                        bg="#111518"
                        borderColor="#318AE6"
                        color="white"
                        className="text-xs sm:text-sm"
                      >
                        {nigeriaBanks.map((bank) => (
                          <option key={bank.code} value={bank.code} className="text-black">
                            {bank.name}
                          </option>
                        ))}
                      </Select>
                      {paymentErrors.selectedBankCode && (
                        <p className="text-red-500 text-xs mt-1">
                          {paymentErrors.selectedBankCode}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2 block">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.paymentAccountNumber}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            paymentAccountNumber: e.target.value,
                          })
                        }
                        className="w-full bg-[#111518] border border-[#318AE6] rounded-lg p-1.5 sm:p-2 text-white text-xs sm:text-sm"
                      />
                      {paymentErrors.paymentAccountNumber && (
                        <p className="text-red-500 text-xs mt-1">
                          {paymentErrors.paymentAccountNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2 block">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={paymentDetails.paymentAmount}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            paymentAmount: e.target.value,
                          })
                        }
                        className="w-full bg-[#111518] border border-[#318AE6] rounded-lg p-1.5 sm:p-2 text-white text-xs sm:text-sm"
                        disabled={currentTransaction?.locked}
                      />
                      {paymentErrors.paymentAmount && (
                        <p className="text-red-500 text-xs mt-1">
                          {paymentErrors.paymentAmount}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4 sm:mt-6">
                    <button
                      type="button"
                      onClick={closePaymentDetailsModal}
                      className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-xs sm:text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 sm:px-4 py-1 sm:py-2 bg-[#318AE6] hover:bg-[#2279d8] rounded-lg text-white text-xs sm:text-sm transition-all"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </Modal>
        )}
        {isMobile && <BottomNav />}
      </div>
    </Box>
  );
};

export default DisplayTransaction;