import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { FiSearch } from "react-icons/fi";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { useToast } from "@chakra-ui/react";
import { Modal } from "@chakra-ui/react";
import MiniNav from "./MiniNav";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { FaFacebookMessenger } from "react-icons/fa6";
import { BsChatFill } from "react-icons/bs";
import { MdClose } from "react-icons/md";
import ConfirmTransactionModal from './ConfirmTransactionModal';
// import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiLoader } from "react-icons/fi";
import { Box, Text } from "@chakra-ui/react";
import { MdContentCopy } from "react-icons/md";
import { format } from "date-fns";
import { FiFilter } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { Select } from "@chakra-ui/react";
import { nigeriaBanks } from "../../data/banksList";



// Add this Loader component after your existing imports
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

<style jsx>{`
  @media (min-width: 475px) {
    .xs\\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`}</style>


const DisplayTransaction = ({ userResponse }) => {
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState([]);
  const toast = useToast();
  const navigate = useNavigate(); // Initialize useNavigate
  const [showWaybillPopup, setShowWaybillPopup] = useState(false);
  const [buyershowWaybillPopup, setBuyerShowWaybillPopup] = useState(false);
  const [waybillDetails, setWaybillDetails] = useState({
    item: "",
    image: null,
    price: "",
    shippingAddress: "",
    trackingNumber: "",
    deliveryDate: "",
  });
  const [buyerWaybillDetails, setBuyerWaybillDetails] = useState({});
  const [imageUrl, setImageUrl] = useState(""); // Add state for imageUrl
  const [cancelTransactionModel, setCancelTransactionModel] = useState(false)
  const [confirmPayment, setConfirmPayment] = useState(false)
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    paymentBank: '',
    paymentAccountNumber: '',
    selectedBankCode: ''
  });



  useEffect(() => {
    // Fetch current user info first
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/users/user-details`, {
          headers: {
            "auth-token": token,
          },
        });
        setCurrentUser(response.data);
        console.log(response.data)
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
    // Check for pending transactions after payment redirect
    const checkPendingPayment = async () => {
      const pendingTxId = localStorage.getItem("pendingPaymentTxId");
      if (!pendingTxId) return;

      const token = localStorage.getItem("auth-token");
      if (!token) return;

      try {
        // Check if the transaction is funded
        const statusRes = await axios.get(
          `${BASE_URL}/api/transactions/check-funded?transactionId=${pendingTxId}`,
          { headers: { "auth-token": token } }
        );

        if (statusRes.data.funded) {
          // Clear the pending transaction
          localStorage.removeItem("pendingPaymentTxId");

          toast({
            title: "Payment Successful!",
            description: "Your transaction has been funded successfully.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });

          // Refresh transactions list
          fetchTransactionData();
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
          headers: {
            "auth-token": token,
          },
        });
        setTransactions(response.data);
        console.log(response.data)
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
    const interval = setInterval(fetchTransactionData, 10000);
    return () => clearInterval(interval);
  }, []);

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

    // Initial check
    checkScreenSize();

    // Add event listener for resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Function to handle sidebar collapse state changes
  const handleSidebarCollapseChange = (isCollapsed) => {
    setIsSidebarCollapsed(isCollapsed);
  };



  const fetchTransactionData = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const res = await axios.get(`${BASE_URL}/api/transactions/get-transaction`, {
        headers: { "auth-token": token }
      });
      setTransactions(res.data); // Or however you're storing the data
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
        {
          headers: {
            "auth-token": token,
          },
        });
      console.log("Chatroom created with ID:", response.data.chatroomId); // Add logging
      navigate(`/chat/${response.data.chatroomId}`); // Navigate to MessageBox component with chatroomId
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
    setShowWaybillPopup({ [transactionId]: true });
    console.log("waybillDetails")
  };
  const ClosehandleWaybillPopup = (transactionId) => {
    setShowWaybillPopup({ [transactionId]: false });
    console.log("Close waybillDetails")
  };
  const handleBuyerWaybillPopup = async (transactionId) => {
    setBuyerShowWaybillPopup({ [transactionId]: true });
    await fetchBuyerWaybillDetails(transactionId);
    console.log("waybillDetails")
  };
  const ClosehandleBuyerWaybillPopup = (transactionId) => {
    setBuyerShowWaybillPopup({ [transactionId]: false });
    console.log("Close waybillDetails")
  };

  const fetchBuyerWaybillDetails = async (transactionId) => {
    const token = localStorage.getItem("auth-token");
    try {
      const response = await axios.get(`${BASE_URL}/api/transactions/${transactionId}`, {
        headers: {
          "auth-token": token,
        },
      });
      const { image, item, price, shippingAddress, trackingNumber, deliveryDate } = response.data.waybillDetails || {};
      const imagePath = image ? `${BASE_URL}/${image}` : ""; // Ensure imagePath is correctly formed
      setImageUrl(imagePath);
      console.log(imagePath);
      console.log(response.data)
      setBuyerWaybillDetails({
        [transactionId]: {
          item,
          price,
          shippingAddress,
          trackingNumber,
          deliveryDate,
          image: imagePath,
        },
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
    // Validate form fields
    const newErrors = {};
    if (!waybillDetails.item) newErrors.item = "Item name is required";
    if (!waybillDetails.price) newErrors.price = "Price is required";
    if (!waybillDetails.shippingAddress) newErrors.shippingAddress = "Shipping address is required";
    if (!waybillDetails.trackingNumber) newErrors.trackingNumber = "Tracking number is required";
    if (!waybillDetails.deliveryDate) newErrors.deliveryDate = "Delivery date is required";
    if (!waybillDetails.image) newErrors.image = "Image proof is required";

    // If there are errors, set them and stop form submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear any existing errors
    setErrors({});

    const token = localStorage.getItem("auth-token");
    const formData = new FormData();

    formData.append("transactionId", transactionId);
    formData.append("item", waybillDetails.item);
    formData.append("price", waybillDetails.price);
    formData.append("shippingAddress", waybillDetails.shippingAddress);
    formData.append("trackingNumber", waybillDetails.trackingNumber);
    formData.append("deliveryDate", waybillDetails.deliveryDate);

    if (waybillDetails.image) {
      formData.append("image", waybillDetails.image);
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/api/transactions/submit-waybill`,
        formData,
        {
          headers: {
            "auth-token": token,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Waybill details submitted:", response.data);
      toast({
        title: "Waybill details submitted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setShowWaybillPopup(false);
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
    link.download = url.split('/').pop(); // Extract filename from URL
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================
  const cancelTransaction = async (transactionId) => {
    const token = localStorage.getItem("auth-token");
    try {
      const response = await axios.put(`${BASE_URL}/api/transactions/cancel/${transactionId}`, {}, {
        headers: { "auth-token": token },
      });
      toast({
        title: "Transaction cancelled successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh transactions list after cancellation
      setTransactions(transactions.filter(transaction => transaction._id !== transactionId));
    } catch (error) {
      console.error("Error cancelling transaction", error);
      toast({
        title: "Failed to cancel transaction",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDoneClick = (transactionId) => {
    setSelectedTransactionId(transactionId);
    setModalVisible(true);
  };

  const handleConfirm = async (transactionId) => {
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

      // First check if there are participants (if user is creator)
      const transaction = transactions.find(t => t._id === transactionId);

      // If current user is creator and there are no participants yet
      if (
        transaction &&
        currentUser &&
        currentUser._id === (transaction.userId._id ? transaction.userId._id : transaction.userId) &&
        (!transaction.participants || transaction.participants.length === 0)
      ) {
        toast({
          title: "There is no participant in this transaction",
          description: "Please wait for someone to join.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Show the confirmation modal instead of window.confirm
      setSelectedTransactionId(transactionId);
      setModalVisible(true);

      // The actual confirmation logic is now moved to completeTransaction function
      // which will be called from the modal's onConfirm prop
    } catch (error) {
      console.error("Confirmation error:", error);
      console.error("Confirmation error details:", {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : 'No response',
        request: error.request ? 'Request sent but no response received' : 'Request setup failed'
      });

      let errorMessage = "Could not complete transaction. Please try again.";

      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Add this new function to handle the actual confirmation after modal confirmation
  const completeTransaction = async (transactionId) => {
    try {
      const token = localStorage.getItem("auth-token");

      console.log("Confirming transaction:", transactionId);

      const response = await axios.post(
        `${BASE_URL}/api/transactions/confirm`,
        { transactionId },
        { headers: { "auth-token": token } }
      );

      console.log("Confirmation response:", response.data);

      if (response.data.buyerConfirmed && response.data.sellerConfirmed) {
        toast({
          title: "Transaction completed successfully",
          description: "Payout has been initiated to the seller.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Confirmation recorded",
          description: "Waiting for the other party to confirm.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }

      // Refresh transaction data
      fetchTransactionData();
    } catch (error) {
      console.error("Confirmation error:", error);
      let errorMessage = "Could not complete transaction. Please try again.";

      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleFund = async (transaction) => {
    console.log("Initiating payment with transaction:", transaction);

    // Destructure necessary properties from transaction
    const {
      _id,  // This is the MongoDB document ID
      paymentAmount,
      email,
      paymentBank,
      paymentName,
      paymentDescription,
    } = transaction;

    // Prepare request data - using _id as the transactionId
    const requestData = {
      amount: paymentAmount,
      transactionId: _id,  // Use the MongoDB document ID
      email,
      paymentBank,
      paymentName,
      paymentDescription,
    };


    const token = localStorage.getItem("auth-token");

    try {
      console.log("Sending payment request with data:", requestData);

      const response = await axios.post(
        `${BASE_URL}/api/transactions/initiate`,
        requestData,
        {
          headers: {
            "auth-token": token,
          },
        }
      );

      console.log("Payment initiation response:", response.data);

      if (response.data && response.data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = response.data.authorization_url;

        // Set up polling to check payment status
        const interval = setInterval(async () => {
          try {
            const statusRes = await axios.get(
              `${BASE_URL}/api/transactions/check-funded?transactionId=${_id}`,
              { headers: { "auth-token": token } }
            );

            console.log("Payment status check:", statusRes.data);

            if (statusRes.data.funded) {
              clearInterval(interval);
              alert("Payment confirmed!");

              // Update the transactions state
              setTransactions(prev =>
                prev.map(tx =>
                  tx._id === _id ? { ...tx, funded: true } : tx
                )
              );
            }
          } catch (err) {
            console.error("Polling error:", err);
            // Continue polling despite errors
          }
        }, 3000); // Check every 3 seconds
      } else {
        console.error("No authorization URL in response:", response.data);
        alert("Error: Could not find the payment link.");
      }
    } catch (error) {
      console.error("Error initiating payment:", error);

      // Provide a helpful error message
      let errorMessage = "There was an issue processing the payment. Please try again.";

      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      alert(errorMessage);
    }
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


  // Add this function to handle editing payment details
  const handleEditPaymentDetails = (transaction) => {
    setCurrentTransaction(transaction);
    setPaymentDetails({
      paymentBank: transaction.paymentBank || '',
      paymentAccountNumber: transaction.paymentAccountNumber || '',
      selectedBankCode: transaction.selectedBankCode || ''
    });
    setShowPaymentDetailsModal(true);
  };

  // Add a function to close the modal
  const closePaymentDetailsModal = () => {
    setShowPaymentDetailsModal(false);
    setCurrentTransaction(null);
  };

  // Add a function to handle payment details submission
  const submitPaymentDetails = async (e) => {
    e.preventDefault();
    if (!currentTransaction) return;

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
          selectedBankCode: paymentDetails.selectedBankCode
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
      fetchTransactionData(); // Refresh transaction data
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

  // Function to handle bank selection
  const handleBankSelection = (e) => {
    const bankCode = e.target.value;
    const selectedBank = nigeriaBanks.find(bank => bank.code === bankCode);

    setPaymentDetails({
      ...paymentDetails,
      selectedBankCode: bankCode,
      paymentBank: selectedBank ? selectedBank.name : ''
    });
  };


  return (
    <Box className=" flex items-center">
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
        onCollapseChange={handleSidebarCollapseChange}
      />

      <div
        className={`transition-all duration-300 flex-1 h-screen ${!isMobile ? (isSidebarCollapsed ? "ml-[80px]" : "ml-[280px]") : "ml-0"
          }`}
      >
        <div
          className={
            showToggleContainer ? "h-[auto] toggleContainer" : "hidden"
          }
        >
          <div>
            <MiniNav />
          </div>
          <div className="md:px-6 px-3 lg:px-8 pt-24 md:pt-24 md:pb-20 pb-20 w-full max-w-screen-xl mx-auto">
            <h1 className="text-[33px] font-bold">My Transactions</h1>
            {/* Enhanced Search Feature */}
            {/* Transaction Tabs with Search Feature */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Tabs Container */}
                <div className="flex overflow-x-auto bg-[#111518] rounded-xl border border-gray-800 w-full flex-1 max-w-full">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2 rounded-lg flex-1 text-center transition-all ${activeTab === "all"
                      ? "bg-[#967532] text-white font-medium"
                      : "text-gray-400 hover:text-white"
                      }`}
                  >
                    All <span className="ml-1 px-1.5 py-0.5 bg-[#1d2225] rounded-full text-xs">{transactions.length}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("active")}
                    className={`px-4 py-2 rounded-lg flex-1 text-center transition-all ${activeTab === "active"
                      ? "bg-[#967532] text-white font-medium"
                      : "text-gray-400 hover:text-white"
                      }`}
                  >
                    Active <span className="ml-1 px-1.5 py-0.5 bg-[#1d2225] rounded-full text-xs">
                      {transactions.filter(t => t.status === "pending").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("completed")}
                    className={`px-4 py-2 rounded-lg flex-1 text-center transition-all ${activeTab === "completed"
                      ? "bg-[#967532] text-white font-medium"
                      : "text-gray-400 hover:text-white"
                      }`}
                  >
                    Completed <span className="ml-1 px-1.5 py-0.5 bg-[#1d2225] rounded-full text-xs">
                      {transactions.filter(t => t.status === "completed").length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("cancelled")}
                    className={`px-4 py-2 rounded-lg flex-1 text-center transition-all ${activeTab === "cancelled"
                      ? "bg-[#967532] text-white font-medium"
                      : "text-gray-400 hover:text-white"
                      }`}
                  >
                    Cancelled <span className="ml-1 px-1.5 py-0.5 bg-[#1d2225] rounded-full text-xs">
                      {transactions.filter(t => t.status === "cancelled").length}
                    </span>
                  </button>
                </div>

                {/* Search Component */}
                <div className="relative w-full sm:w-[300px] group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#967532] group-focus-within:text-[#318AE6] transition-colors">
                    <FiSearch className="text-lg" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2.5 pl-10 pr-10 bg-[#111518] border border-[#967532] rounded-xl text-white focus:border-[#967532] focus:outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                    >
                      <MdClose />
                    </button>
                  )}
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#318AE6] to-[#5B43D6] scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left"></div>
                </div>
              </div>
            </div>
            {/* ========== Main Active Container ============= */}
            <div className="w-[100%] h-[auto]">
              {isLoading ? (
                <TransactionLoader />
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                  <div className="text-4xl mb-4 text-gray-400">📭</div>
                  <p className="text-[#E4E4E4] text-lg font-medium">No transactions found</p>
                  <p className="text-gray-400 mt-2">Create a new transaction to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {
                    transactions
                      .filter(transaction => {
                        // First filter by tab selection
                        if (activeTab === "active" && transaction.status !== "pending") return false;
                        if (activeTab === "completed" && transaction.status !== "completed") return false;
                        if (activeTab === "cancelled" && transaction.status !== "cancelled") return false;

                        // Then filter by search query
                        return transaction.paymentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          transaction._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          transaction.email.toLowerCase().includes(searchQuery.toLowerCase());
                      })
                      .map((transaction) => (
                        <Box key={transaction._id} className="transaction-card text-[13px] text-gray-400 mt-3 px-6 py-5 bg-[#111518] rounded-2xl border border-gray-800  transition-all  hover:shadow-[#318AE630]">
                          {/* // Modified code for the transaction title section */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex flex-col">
                              {/* <h3 className="font-bold text-lg text-white truncate">{transaction.paymentName}</h3> */}
                              {transaction.participants && transaction.participants.length > 0 ? (
                                <p className="font-bold text-lg text-white truncate">
                                  {typeof transaction.participants[0] === 'object' && transaction.participants[0].firstName
                                    ? `${transaction.participants[0].firstName} ${transaction.participants[0].lastName || ''}`
                                    : "Participant joined"}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-400">No participant yet</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditPaymentDetails(transaction)}
                                className="text-[20px] sm:text-[24px] bg-[#1d2225] p-1.5 sm:p-2 rounded-full hover:bg-[#967532] text-white transition-all"
                                title="Edit Payment Details"
                              >
                                <FiEdit size={18} />
                              </button>
                              <button
                                onClick={() => handleChatButton(transaction._id)}
                                className="text-[20px] sm:text-[24px] bg-[#1d2225] p-1.5 sm:p-2 rounded-full hover:bg-[#318AE6] transition-all"
                              >
                                <BsChatFill />
                              </button>
                            </div>
                          </div>

                          <div className="bg-[#1d2225] rounded-lg p-2 sm:p-3 mb-3 flex items-center justify-between">
                            <div className="max-w-[85%]">
                              <div className="flex items-center">
                                {/* <p className="text-gray-400 text-xs mb-1">Transaction ID</p> */}
                                <p className=" text-xs mb-1">Copy the Transaction ID and send to the other party</p>
                              </div>
                              <p className="font-medium text-sm truncate">{transaction._id}</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(transaction._id)}
                              className="text-gray-400 hover:text-[#318AE6] transition-all"
                            >
                              <MdContentCopy size={18} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mb-4">
                            <div className="bg-[#1d2225] rounded-lg p-2 sm:p-3">
                              <p className="text-gray-400 text-xs mb-1">Email</p>
                              <p className="font-medium text-xs sm:text-sm truncate">{transaction.email}</p>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-2 sm:p-3">
                              <p className="text-gray-400 text-xs mb-1">Amount</p>
                              <p className="font-medium text-xs sm:text-sm text-[#318AE6]">{transaction.paymentAmount}</p>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-2 sm:p-3">
                              <p className="text-gray-400 text-xs mb-1">User Type</p>
                              <p className="font-medium text-xs sm:text-sm capitalize">{transaction.selectedUserType}</p>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-2 sm:p-3">
                              <p className="text-gray-400 text-xs mb-1">Status</p>
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transaction.status === "completed" ? "bg-green-900 text-green-300" :
                                transaction.status === "cancelled" ? "bg-red-900 text-red-300" :
                                  "bg-yellow-900 text-yellow-300"
                                }`}>
                                {transaction.status}
                              </div>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-2 sm:p-3">
                              <p className="text-gray-400 text-xs mb-1">Bank</p>
                              <p className="font-medium truncate">{transaction.paymentBank}</p>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-2 sm:p-3">
                              <p className="text-gray-400 text-xs mb-1">Account Number</p>
                              <p className="font-medium">{transaction.paymentAccountNumber}</p>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-2 sm:p-3">
                              <p className="text-gray-400 text-xs mb-1">Waybill Status</p>
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transaction.proofOfWaybill === "confirmed" ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"
                                }`}>
                                {transaction.proofOfWaybill}
                              </div>
                            </div>
                            <div className="bg-[#1d2225] rounded-lg p-2 sm:p-3">
                              <p className="text-gray-400 text-xs mb-1">Created</p>
                              <p className="font-medium">{transaction.createdAt ? format(new Date(transaction.createdAt), 'MMM dd, yyyy') : 'N/A'}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <details className="bg-[#1d2225] rounded-lg p-2 sm:p-3">
                              <summary className="font-medium cursor-pointer flex items-center justify-between">
                                <span>Description</span>
                                <span className="text-xs text-gray-400">Click to expand</span>
                              </summary>
                              <p className="mt-2 text-gray-300 text-sm whitespace-pre-wrap">{transaction.paymentDescription}</p>
                            </details>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-4">
                            <button
                              className="px-2 sm:px-4 py-2 rounded-xl font-bold transition-all hover:bg-red-600 bg-red-700 text-white flex-1 text-xs sm:text-sm"
                              onClick={() => cancelTransaction(transaction._id)}
                            >
                              Cancel
                            </button>

                            <button
                              className="px-2 sm:px-4 py-2 bg-[#318AE6] hover:bg-[#2279d8] transition-all rounded-xl font-bold text-white flex-1 text-xs sm:text-sm"
                              onClick={() =>
                                transaction.selectedUserType === "seller"
                                  ? handleWaybillPopup(transaction._id)
                                  : handleBuyerWaybillPopup(transaction._id)
                              }
                            >
                              {transaction.selectedUserType === "seller" ? "Input Waybill" : "View Waybill"}
                            </button>

                            {/* ============================ showWaybillPopup =======================  */}
                            {showWaybillPopup[transaction._id] && (
                              <div style={{ overflowY: "auto" }} className="modal-container fixed z-30 inset-0 bg-[#111518] backdrop-filter backdrop-blur-sm bg-opacity-95 px-4 py-6">
                                <div className="max-w-2xl mx-auto bg-[#1A1E21] p-8 rounded-2xl shadow-xl border border-gray-800">
                                  <div className="w-[100%]">
                                    <button
                                      onClick={() => ClosehandleWaybillPopup(transaction._id)}
                                      className="absolute top-2 right-2 sm:top-5 sm:right-5 text-[24px] sm:text-[30px] hover:text-[#318AE6] transition-all"
                                    >
                                      <MdClose />
                                    </button>
                                  </div>
                                  <form className="h-auto mt-4 sm:mt-6" onSubmit={(e) => { e.preventDefault(); handleWaybillSubmit(transaction._id); }} encType="multipart/form-data">
                                    <div className="">
                                      <h1 className="text-xl sm:text-3xl font-bold text-center text-white">Seller Waybill Proof</h1>
                                      <p className="text-base sm:text-lg text-center pt-3 text-gray-300">I, the seller, confirm that I have shipped the goods.</p>

                                      <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-5">
                                        <div>
                                          <h3 className="text-gray-300 text-sm sm:text-base mb-2">Item:</h3>
                                          <input type="text" className="text-white bg-[#111518] border border-[#318AE6] pl-4 outline-none w-full h-12 rounded-xl" value={waybillDetails.item} onChange={(e) => setWaybillDetails({ ...waybillDetails, item: e.target.value })} />
                                        </div>

                                        <div>
                                          <h3 className="text-gray-300 text-sm sm:text-base mb-2">Image:</h3>
                                          <div className="border-2 border-dashed border-[#318AE6] rounded-xl p-6 text-center">
                                            <input
                                              type="file"
                                              className="hidden"
                                              id="waybill-image"
                                              onChange={(e) => setWaybillDetails({ ...waybillDetails, image: e.target.files[0] })}
                                            />
                                            <label htmlFor="waybill-image" className="cursor-pointer flex flex-col items-center">
                                              <span className="text-3xl mb-2 text-[#318AE6]">📷</span>
                                              <span className="text-gray-300">Click to upload proof of shipment</span>
                                            </label>
                                          </div>
                                        </div>

                                        <div>
                                          <h3 className="text-gray-300 text-sm sm:text-base mb-2">Price of waybill:</h3>
                                          <input type="number" className="text-white bg-[#111518] border border-[#318AE6] pl-4 outline-none w-full h-12 rounded-xl" value={waybillDetails.price} onChange={(e) => setWaybillDetails({ ...waybillDetails, price: e.target.value })} />
                                        </div>

                                        <div>
                                          <h3 className="text-gray-300 mb-2">Shipping / Receiver’s Address:</h3>
                                          <input type="text" className="text-white bg-[#111518] border border-[#318AE6] pl-4 outline-none w-full h-12 rounded-xl" value={waybillDetails.shippingAddress} onChange={(e) => setWaybillDetails({ ...waybillDetails, shippingAddress: e.target.value })} />
                                        </div>

                                        <div>
                                          <h3 className="text-gray-300 mb-2">Tracking Number:</h3>
                                          <input type="text" className="text-white bg-[#111518] border border-[#318AE6] pl-4 outline-none w-full h-12 rounded-xl" value={waybillDetails.trackingNumber} onChange={(e) => setWaybillDetails({ ...waybillDetails, trackingNumber: e.target.value })} />
                                        </div>

                                        <div>
                                          <h3 className="text-gray-300 mb-2">Delivery Date:</h3>
                                          <input type="date" className="text-white bg-[#111518] border border-[#318AE6] pl-4 outline-none w-full h-12 rounded-xl" value={waybillDetails.deliveryDate} onChange={(e) => setWaybillDetails({ ...waybillDetails, deliveryDate: e.target.value })} />
                                        </div>

                                        <button type="submit" className="font-bold bg-[#318AE6] hover:bg-[#2279d8] transition-all rounded-xl py-3 w-full mt-7 text-white">Submit Waybill</button>
                                      </div>
                                    </div>
                                  </form>
                                </div>
                              </div>
                            )}

                            {/* ============================ buyershowWaybillPopup =======================  */}

                            {buyershowWaybillPopup[transaction._id] && (
                              <div style={{ overflowY: "auto" }} className="modal-container fixed z-30 inset-0 bg-[#111518] backdrop-filter backdrop-blur-sm bg-opacity-95 px-4 py-6">
                                <div className="max-w-2xl mx-auto bg-[#1A1E21] p-8 rounded-2xl shadow-xl border border-gray-800">
                                  <div className="w-[100%]">
                                    <button
                                      onClick={() => ClosehandleBuyerWaybillPopup(transaction._id)}
                                      className="absolute top-5 right-5 text-[30px] hover:text-[#318AE6] transition-all"
                                    >
                                      <MdClose />
                                    </button>
                                  </div>
                                  <div className="h-[auto] mt-6">
                                    <h1 className="text-3xl font-bold text-center text-white">Waybill Details</h1>
                                    {buyerWaybillDetails[transaction._id] ? (
                                      <div className="mt-6 space-y-5">
                                        <div className="bg-[#111518] p-4 rounded-xl">
                                          <p className="text-gray-400 text-sm mb-1">Item</p>
                                          <p className="text-lg text-white">{buyerWaybillDetails[transaction._id].item}</p>
                                        </div>

                                        <div className="h-[300px] relative flex justify-center items-center w-full bg-cover rounded-xl my-3 bg-[#111518] overflow-hidden">
                                          <img src={imageUrl} alt="Waybill" className="w-full object-contain h-full absolute" />
                                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => downloadImage(imageUrl)}
                                              className="px-4 py-2 bg-[#318AE6] hover:bg-[#2279d8] transition-all text-white rounded-md"
                                            >
                                              Download Image
                                            </button>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="bg-[#111518] p-4 rounded-xl">
                                            <p className="text-gray-400 text-sm mb-1">Price</p>
                                            <p className="text-lg text-[#318AE6]">{buyerWaybillDetails[transaction._id].price}</p>
                                          </div>

                                          <div className="bg-[#111518] p-4 rounded-xl">
                                            <p className="text-gray-400 text-sm mb-1">Delivery Date</p>
                                            <p className="text-lg text-white">{buyerWaybillDetails[transaction._id].deliveryDate}</p>
                                          </div>
                                        </div>

                                        <div className="bg-[#111518] p-4 rounded-xl">
                                          <p className="text-gray-400 text-sm mb-1">Shipping Address</p>
                                          <p className="text-lg text-white">{buyerWaybillDetails[transaction._id].shippingAddress}</p>
                                        </div>

                                        <div className="bg-[#111518] p-4 rounded-xl">
                                          <p className="text-gray-400 text-sm mb-1">Tracking Number</p>
                                          <p className="text-lg text-white">{buyerWaybillDetails[transaction._id].trackingNumber}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center h-[40vh]">
                                        <div className="text-4xl mb-4 text-gray-400">📦</div>
                                        <p className="text-[#E4E4E4] text-lg font-medium">No waybill details available</p>
                                        <p className="text-gray-400 mt-2">The seller hasn't submitted waybill information yet</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                          {/* ======================== */}
                          {/* <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                            <button
                              className={`px-4 py-2 rounded-xl font-bold text-white flex-1 transition-all ${transaction.buyerConfirmed && transaction.sellerConfirmed
                                ? "bg-green-600 cursor-not-allowed"
                                : (transaction.buyerConfirmed || transaction.sellerConfirmed) &&
                                  ((currentUser && transaction.userId && currentUser._id === transaction.userId._id &&
                                    ((transaction.selectedUserType === "buyer" && transaction.buyerConfirmed) ||
                                      (transaction.selectedUserType === "seller" && transaction.sellerConfirmed))) ||
                                    (currentUser && transaction.userId && currentUser._id !== transaction.userId._id &&
                                      ((transaction.selectedUserType === "buyer" && transaction.sellerConfirmed) ||
                                        (transaction.selectedUserType === "seller" && transaction.buyerConfirmed))))
                                  ? "bg-yellow-600"
                                  : "bg-[#318AE6] hover:bg-[#2279d8]"
                                }`}
                              disabled={
                                (transaction.buyerConfirmed && transaction.sellerConfirmed) ||
                                (currentUser && transaction.userId &&
                                  currentUser._id === transaction.userId._id &&
                                  transaction.selectedUserType === "buyer" &&
                                  transaction.buyerConfirmed) ||
                                (currentUser && transaction.userId &&
                                  currentUser._id === transaction.userId._id &&
                                  transaction.selectedUserType === "seller" &&
                                  transaction.sellerConfirmed) ||
                                (currentUser && transaction.userId &&
                                  currentUser._id !== transaction.userId._id &&
                                  transaction.selectedUserType === "seller" &&
                                  transaction.buyerConfirmed) ||
                                (currentUser && transaction.userId &&
                                  currentUser._id !== transaction.userId._id &&
                                  transaction.selectedUserType === "buyer" &&
                                  transaction.sellerConfirmed)
                              }
                              onClick={() => handleConfirm(transaction._id)}
                            >
                              {transaction.buyerConfirmed && transaction.sellerConfirmed
                                ? "Completed"
                                : ((currentUser && transaction.userId &&
                                  (transaction.userId._id ? currentUser._id === transaction.userId._id : currentUser._id === transaction.userId) &&
                                  ((transaction.selectedUserType === "buyer" && transaction.buyerConfirmed) ||
                                    (transaction.selectedUserType === "seller" && transaction.sellerConfirmed))) ||
                                  (currentUser && transaction.userId &&
                                    (transaction.userId._id ? currentUser._id !== transaction.userId._id : currentUser._id !== transaction.userId) &&
                                    ((transaction.selectedUserType === "buyer" && transaction.sellerConfirmed) ||
                                      (transaction.selectedUserType === "seller" && transaction.buyerConfirmed))))
                                  ? "Pending"
                                  : "Complete"
                              }
                            </button>

                            <button
                              className={`px-4 py-2 rounded-xl font-bold text-white flex-1 transition-all ${transaction.funded
                                ? "bg-green-600 cursor-not-allowed"
                                : "bg-[#318AE6] hover:bg-[#2279d8]"
                                }`}
                              onClick={() => handleFund(transaction)}
                              disabled={transaction.funded}
                            >
                              {transaction.funded ? "Funded" : "Fund Account"}
                            </button>
                          </div> */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                            <button
                              className={`px-4 py-2 rounded-xl font-bold text-white flex-1 transition-all ${transaction.buyerConfirmed && transaction.sellerConfirmed
                                  ? "bg-green-600 cursor-not-allowed"
                                  : (transaction.buyerConfirmed || transaction.sellerConfirmed) &&
                                    ((currentUser && transaction.userId && currentUser._id === transaction.userId._id &&
                                      ((transaction.selectedUserType === "buyer" && transaction.buyerConfirmed) ||
                                        (transaction.selectedUserType === "seller" && transaction.sellerConfirmed))) ||
                                      (currentUser && transaction.userId && currentUser._id !== transaction.userId._id &&
                                        ((transaction.selectedUserType === "buyer" && transaction.sellerConfirmed) ||
                                          (transaction.selectedUserType === "seller" && transaction.buyerConfirmed))))
                                    ? "bg-yellow-600"
                                    : "bg-[#318AE6] hover:bg-[#2279d8]"
                                }`}
                              disabled={
                                (transaction.buyerConfirmed && transaction.sellerConfirmed) ||
                                (currentUser && transaction.userId &&
                                  currentUser._id === transaction.userId._id &&
                                  transaction.selectedUserType === "buyer" &&
                                  transaction.buyerConfirmed) ||
                                (currentUser && transaction.userId &&
                                  currentUser._id === transaction.userId._id &&
                                  transaction.selectedUserType === "seller" &&
                                  transaction.sellerConfirmed) ||
                                (currentUser && transaction.userId &&
                                  currentUser._id !== transaction.userId._id &&
                                  transaction.selectedUserType === "seller" &&
                                  transaction.buyerConfirmed) ||
                                (currentUser && transaction.userId &&
                                  currentUser._id !== transaction.userId._id &&
                                  transaction.selectedUserType === "buyer" &&
                                  transaction.sellerConfirmed)
                              }
                              onClick={() => handleConfirm(transaction._id)}
                            >
                              {transaction.buyerConfirmed && transaction.sellerConfirmed
                                ? "Completed"
                                : ((currentUser && transaction.userId &&
                                  (transaction.userId._id ? currentUser._id === transaction.userId._id : currentUser._id === transaction.userId) &&
                                  ((transaction.selectedUserType === "buyer" && transaction.buyerConfirmed) ||
                                    (transaction.selectedUserType === "seller" && transaction.sellerConfirmed))) ||
                                  (currentUser && transaction.userId &&
                                    (transaction.userId._id ? currentUser._id !== transaction.userId._id : currentUser._id !== transaction.userId) &&
                                    ((transaction.selectedUserType === "buyer" && transaction.sellerConfirmed) ||
                                      (transaction.selectedUserType === "seller" && transaction.buyerConfirmed))))
                                  ? "Pending"
                                  : "Complete"
                              }
                            </button>

                            {/* Only show Fund Account button if the user type is buyer */}
                            {transaction.selectedUserType === "buyer" && (
                              <button
                                className={`px-4 py-2 rounded-xl font-bold text-white flex-1 transition-all ${transaction.funded
                                    ? "bg-green-600 cursor-not-allowed"
                                    : "bg-[#318AE6] hover:bg-[#2279d8]"
                                  }`}
                                onClick={() => handleFund(transaction)}
                                disabled={transaction.funded}
                              >
                                {transaction.funded ? "Funded" : "Fund Account"}
                              </button>
                            )}
                          </div>
                        </Box>
                      ))
                  }
                </div>
              )}
            </div>
            <ConfirmTransactionModal
              show={modalVisible}
              onClose={() => setModalVisible(false)}
              onConfirm={completeTransaction}
              transactionId={selectedTransactionId}
            />
          </div>
        </div>
      </div>
      <BottomNav
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
      />

      {showPaymentDetailsModal && currentTransaction && (
        <div className="modal-container fixed z-30 inset-0 overflow-y-auto bg-black bg-opacity-75 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-[#1A1E21] w-full max-w-md p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-white">Update Payment Details</h2>
                <button onClick={closePaymentDetailsModal} className="text-gray-400 hover:text-white">
                  <MdClose size={24} />
                </button>
              </div>

              <form onSubmit={submitPaymentDetails}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Bank Name</label>
                    <Select
                      placeholder="Select Bank"
                      value={paymentDetails.selectedBankCode}
                      onChange={handleBankSelection}
                      className="w-full bg-[#111518] border border-gray-700 rounded-xl text-white py-2 px-3 text-sm"
                      required
                    >
                      {nigeriaBanks.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={paymentDetails.paymentAccountNumber}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentAccountNumber: e.target.value })}
                      className="w-full bg-[#111518] border border-gray-700 rounded-xl text-white py-2 px-3 text-sm"
                      placeholder="Enter account number"
                      required
                      pattern="[0-9]+"
                      title="Please enter a valid account number (numbers only)"
                      minLength={10}
                      maxLength={10}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#967532] hover:bg-[#86692d] text-white font-bold py-2 rounded-xl transition-all mt-4 text-sm sm:text-base"
                  >
                    Save Payment Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};
export default DisplayTransaction;