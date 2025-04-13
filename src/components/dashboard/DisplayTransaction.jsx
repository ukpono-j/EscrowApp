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
      }
    };
    fetchTransactions();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchTransactionData, 10000);
    return () => clearInterval(interval);
  }, []);

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
        formData, // Pass the FormData directly
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

  const completeTransaction = async (transactionId) => {
    const token = localStorage.getItem("auth-token");
    try {
      const response = await axios.put(`${BASE_URL}/api/transactions/complete-transaction/${transactionId}`, {
        headers: { "auth-token": token },
      });

      // Handle the response
      console.log('Transaction completed:', response.data);
      toast({
        title: "Transaction completed successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh transactions list after cancellation
      setTransactions(transactions.filter(transaction => transaction._id !== transactionId));
    } catch (error) {
      console.error('Error completing transaction:', error);
      toast({
        title: "Failed to complete transaction",
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

  

  // Updated handleConfirm function
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
        // currentUser._id === transaction.userId._id &&
        // (!transaction.participants || transaction.participants.length === 0)
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

      if (!window.confirm("Are you sure you want to complete this transaction? This action cannot be undone.")) {
        return;
      }

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




  return (
    <div className="border flex items-center border-black">
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
      />

      <div
        style={{ overflowY: "scroll" }}
        className="layout bg-[#1A1E21] text-[#E4E4E4]  fixed right-0 top-0 w-[100%]  md:w-[83.2%] h-[100vh]"
      >
        <div
          className={
            showToggleContainer ? "h-[auto] toggleContainer" : "hidden"
          }
        >
          <div>
            <MiniNav />
          </div>
          <div className="font-[Poppins] pt-14 md:pr-14 pr-7 pl-7  mt-10  md:pl-14 pb-20">
            <h1 className="text-[33px] font-bold">My Transactions</h1>
            <div className="sm:flex sm:flex-row  flex flex-col-reverse  mt-4 mb-4  text-[14px]  items-center justify-between ">
              <div className=" sm:max-w-[280px] w-[100%] border-b border-[#318AE6] rounded   h-[auto]">
              </div>
              {/* ================= Search Feature ======= */}
              <div className="sm:w-[200px] w-[100%] sm:mb-0 mb-6  h-[auto] flex items-center ">
                <input
                  type="text"
                  placeholder="Search"
                  name=""
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} // Add onChange handler
                  className="pr-[20px] text-[#fff]  w-[100%] bg-[transparent] border-[#fff]  border-b text-[13px] pb-2  outline-none"
                />
                <FiSearch className="text-[23px] ml-[-3px]" />
              </div>
            </div>
            {/* ========== Main Active Container ============= */}
            <div className="w-[100%] h-[auto]">
              {transactions.length === 0 ? (
                <p>No transactions found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {
                    transactions
                      .filter(transaction =>
                        transaction.paymentName.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((transaction) => (
                        <div key={transaction._id} className="transaction-card text-[13px] mt-3 px-5 py-4 bg-[#111518] rounded-2xl">
                          <div className="flex items-center justify-between">
                            <h3>Name: {transaction.paymentName}</h3>
                            <button onClick={() => handleChatButton(transaction._id)} className="text-[24px]">
                              {/* <FaFacebookMessenger /> */}
                              <BsChatFill />
                            </button>
                          </div>
                          <h3>Email: {transaction.email}</h3>
                          <p>Payment Amount: {transaction.paymentAmount}</p>
                          <p>Description: {transaction.paymentDescription}</p>
                          <p>Created At: {transaction.createdAt}</p>
                          <p>Proof of way bill: {transaction.proofOfWaybill}</p>
                          <p>Selected User Type: {transaction.selectedUserType}</p>
                          <p>Payment Bank: {transaction.paymentBank}</p>
                          <p>Transaction ID: {transaction.transactionId}</p>
                          {/* <p>Participants: {transaction.participants[0]}</p> */}
                          <p>
                            Participants: {transaction.participants && transaction.participants.length > 0 ?
                              transaction.participants.map((participant, index) => {
                                // Check if participant is a populated object with properties
                                if (participant && typeof participant === 'object') {
                                  return (
                                    <span key={index}>
                                      {participant.firstName || 'user'} ({participant.email || 'No email'})
                                      {index < transaction.participants.length - 1 ? ', ' : ''}
                                    </span>
                                  );
                                }
                                // If it's just an ID (not populated)
                                else {
                                  return (
                                    <span key={index}>
                                      {participant || 'Unknown participant'}
                                      {index < transaction.participants.length - 1 ? ', ' : ''}
                                    </span>
                                  );
                                }
                              })
                              : 'No participants yet'
                            }
                          </p>
                          <div className="">
                            <p>Status: {transaction.status}</p>
                            {/* cancel transaction button */}

                          </div>
                          <div className="">
                            <p>paymentStatus: {transaction.paymentStatus}</p>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            {/* <button className="px-4 py-2 rounded-xl m-3 font-bold bg-[#318AE6]" onClick={() => handleBuyerWaybillPopup(transaction._id)}>View Waybill</button>
                            <button className="px-4 py-2 rounded-xl m-3 font-bold bg-[#318AE6]" onClick={() => handleWaybillPopup(transaction._id)}>Input Waybill</button> */}
                            <div>
                              <button className="px-3 py-2 rounded-xl font-bold bg-[#318AE6]" onClick={() => cancelTransaction(transaction._id)}>
                                Cancel Transaction
                              </button>
                            </div>

                            <button
                              className="px-3 py-2 bg-[#318AE6] rounded-lg font-bold"
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
                              // <Modal>
                              <div style={{ overflowY: "scroll" }} className="modal-container pr-5 pt-5 pb-10 pl-5 fixed z-30 bg-[#111518] left-0 top-0 w-[100%] h-[100vh]">
                                <div>
                                  <div className="w-[100%] ">
                                    <button
                                      onClick={() => ClosehandleWaybillPopup(transaction._id)} className="absolute top-3 text-[30px]">
                                      <MdClose />
                                    </button>
                                    {/* <h2 className="text-center text-[30px] font-bold">Transaction Details</h2> */}
                                  </div>
                                </div>
                                <form className="h-[auto] mt-10" onSubmit={(e) => { e.preventDefault(); handleWaybillSubmit(transaction._id); }} encType="multipart/form-data">
                                  <div className="">
                                    <h1 className="text-[30px] font-bold text-center">Seller Waybill Proof</h1>
                                    <p className="text-[17px] text-center pt-3">  I' the seller, confirm that I have shipped the goods.</p>
                                    <div className="mt-3">
                                      <h3>Item:</h3>
                                      <div>
                                        <input type="text" className="text-[white] bg-[transparent] border border-[#318AE6] pl-3 outline-none w-[100%] h-[40px] rounded-xl mt-2" value={waybillDetails.item} onChange={(e) => setWaybillDetails({ ...waybillDetails, item: e.target.value })} />
                                      </div>
                                    </div>
                                    <div className="mt-3">
                                      <h3>Image:</h3>
                                      <input
                                        type="file"
                                        onChange={(e) => setWaybillDetails({ ...waybillDetails, image: e.target.files[0] })}
                                      />
                                      <div>
                                        {/* Preview Image */}
                                      </div>
                                    </div>
                                    <div className="mt-3">
                                      <h3>Price:</h3>
                                      <input type="number" className="text-[white] bg-[transparent] border border-[#318AE6] pl-3 outline-none w-[100%] h-[40px] rounded-xl mt-2" value={waybillDetails.price} onChange={(e) => setWaybillDetails({ ...waybillDetails, price: e.target.value })} />
                                    </div>
                                    <div className="mt-3">
                                      <h3>Shipping Address:</h3>
                                      <input type="text" className="text-[white] bg-[transparent] border border-[#318AE6] pl-3 outline-none w-[100%] h-[40px] rounded-xl mt-2" value={waybillDetails.shippingAddress} onChange={(e) => setWaybillDetails({ ...waybillDetails, shippingAddress: e.target.value })} />
                                    </div>
                                    <div className="mt-3">
                                      <h3>Tracking Number:</h3>
                                      <input type="text" className="text-[white] bg-[transparent] border border-[#318AE6] pl-3 outline-none w-[100%] h-[40px] rounded-xl mt-2" value={waybillDetails.trackingNumber} onChange={(e) => setWaybillDetails({ ...waybillDetails, trackingNumber: e.target.value })} />
                                    </div>
                                    <div className="mt-3">
                                      <h3>Delivery Date:</h3>
                                      <input type="date" className="text-[white] bg-[transparent] border border-[#318AE6] pl-3 outline-none w-[100%] h-[40px] rounded-xl mt-2" value={waybillDetails.deliveryDate} onChange={(e) => setWaybillDetails({ ...waybillDetails, deliveryDate: e.target.value })} />
                                    </div>
                                    <button type="submit" className="font-bold bg-[#318AE6] rounded-2xl py-3 w-[30%] mt-7">Submit</button>
                                  </div>
                                </form>
                              </div>
                              // </Modal>
                            )}

                            {/* ============================ buyershowWaybillPopup =======================  */}

                            {buyershowWaybillPopup[transaction._id] && (
                              <div style={{ overflowY: "scroll" }} className="modal-container pr-5 pt-5 pb-10 pl-5 fixed z-30 bg-[#111518] left-0 top-0 w-[100%] h-[100vh]">
                                <div>
                                  <div className="w-[100%] ">
                                    <button
                                      onClick={() => ClosehandleBuyerWaybillPopup(transaction._id)} className="absolute top-3 text-[30px]">
                                      <MdClose />
                                    </button>
                                  </div>
                                </div>
                                <div className="h-[auto] mt-10">
                                  <h1 className="text-[30px] font-bold text-center">Buyer Waybill Proof</h1>
                                  {buyerWaybillDetails[transaction._id] ? (
                                    <div className="mt-4">
                                      <p><strong>Item:</strong> {buyerWaybillDetails[transaction._id].item}</p>
                                      {/* <p><strong>Image:</strong> <img src={buyerWaybillDetails[transaction._id].image} alt="Waybill item" /></p> */}
                                      <div className="h-[270px] relative flex justify-center items-center w-[100%] bg-cover rounded-3xl my-3 bg-[#1A1E21]">
                                        <img src={imageUrl} alt="Waybill" className="w-[100%] object-cover h-[100%] rounded-3xl absolute" />
                                        <button
                                          onClick={() => downloadImage(imageUrl)}
                                          className="px-4 py-2 bg-[#1A1E21] text-white absolute rounded-md"
                                        >
                                          Download Image
                                        </button>
                                      </div>
                                      <p><strong>Price:</strong> {buyerWaybillDetails[transaction._id].price}</p>
                                      <p><strong>Shipping Address:</strong> {buyerWaybillDetails[transaction._id].shippingAddress}</p>
                                      <p><strong>Tracking Number:</strong> {buyerWaybillDetails[transaction._id].trackingNumber}</p>
                                      <p><strong>Delivery Date:</strong> {buyerWaybillDetails[transaction._id].deliveryDate}</p>
                                    </div>
                                  ) : (
                                    <p>No waybill details available for this transaction.</p>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>
                          {/* ======================== */}
                          <div className="flex items-center justify-between">
                            {/* <button className="px-3 mt-3 py-2 bg-[#318AE6] rounded-xl font-bold" onClick={() => handleDoneClick(transaction._id)}>Complete Transaction</button> */}
                            {/* <button
                              className="px-3 mt-3 py-2 bg-[#318AE6] rounded-xl font-bold"
                              disabled={transaction.buyerConfirmed || transaction.sellerConfirmed}
                              onClick={() => handleConfirm(transaction._id)}
                            >
                              {
                                transaction.buyerConfirmed && transaction.sellerConfirmed
                                  ? "Completed"
                                  : transaction.userId === transaction.userId && (transaction.buyerConfirmed || transaction.sellerConfirmed)
                                    ? "Pending"
                                    : "Complete Transaction"
                              }
                            </button> */}
                            {/* <button
                              className={`px-3 mt-3 py-2 rounded-xl font-bold ${
                                transaction.buyerConfirmed && transaction.sellerConfirmed
                                  ? "bg-green-500"
                                  : transaction.buyerConfirmed || transaction.sellerConfirmed
                                    ? "bg-yellow-500"
                                    : "bg-[#318AE6]"
                                }`}
                              disabled={
                                // Check if currentUser exists before accessing its _id
                                (currentUser && currentUser._id === transaction.userId && transaction.buyerConfirmed) ||
                                (currentUser && currentUser._id !== transaction.userId && transaction.sellerConfirmed) ||
                                (transaction.buyerConfirmed && transaction.sellerConfirmed)
                              }
                              onClick={() => handleConfirm(transaction._id)}
                            >
                              {transaction.buyerConfirmed && transaction.sellerConfirmed
                                ? "Transaction Completed"
                                : currentUser && currentUser._id === transaction.userId && transaction.buyerConfirmed
                                  ? "Pending Completion"
                                  : currentUser && currentUser._id !== transaction.userId && transaction.sellerConfirmed
                                    ? "Pending Completion"
                                    : "Complete Transaction"}
                            </button> */}

                            {/* Complete Transaction Button with improved logic */}
                            <button
                              className={`px-3 mt-3 py-2 rounded-xl font-bold ${transaction.buyerConfirmed && transaction.sellerConfirmed
                                ? "bg-green-500"
                                : (transaction.buyerConfirmed || transaction.sellerConfirmed) &&
                                  ((currentUser && transaction.userId && currentUser._id === transaction.userId._id &&
                                    ((transaction.selectedUserType === "buyer" && transaction.buyerConfirmed) ||
                                      (transaction.selectedUserType === "seller" && transaction.sellerConfirmed))) ||
                                    (currentUser && transaction.userId && currentUser._id !== transaction.userId._id &&
                                      ((transaction.selectedUserType === "buyer" && transaction.sellerConfirmed) ||
                                        (transaction.selectedUserType === "seller" && transaction.buyerConfirmed))))
                                  ? "bg-yellow-500"
                                  : "bg-[#318AE6]"
                                }`}
                              disabled={
                                // Transaction fully completed
                                (transaction.buyerConfirmed && transaction.sellerConfirmed) ||

                                // Current user is creator (buyer) and already confirmed
                                (currentUser && transaction.userId &&
                                  currentUser._id === transaction.userId._id &&
                                  transaction.selectedUserType === "buyer" &&
                                  transaction.buyerConfirmed) ||

                                // Current user is creator (seller) and already confirmed
                                (currentUser && transaction.userId &&
                                  currentUser._id === transaction.userId._id &&
                                  transaction.selectedUserType === "seller" &&
                                  transaction.sellerConfirmed) ||

                                // Current user is participant (buyer) and already confirmed
                                (currentUser && transaction.userId &&
                                  currentUser._id !== transaction.userId._id &&
                                  transaction.selectedUserType === "seller" &&
                                  transaction.buyerConfirmed) ||

                                // Current user is participant (seller) and already confirmed
                                (currentUser && transaction.userId &&
                                  currentUser._id !== transaction.userId._id &&
                                  transaction.selectedUserType === "buyer" &&
                                  transaction.sellerConfirmed)
                              }
                              onClick={() => handleConfirm(transaction._id)}
                            >
                              {/* Button text logic */}
                              {transaction.buyerConfirmed && transaction.sellerConfirmed
                                ? "Transaction Completed"
                                : (
                                  // Check if the current user has confirmed (either as creator or participant)
                                  (currentUser && transaction.userId &&
                                    (transaction.userId._id ? currentUser._id === transaction.userId._id : currentUser._id === transaction.userId) &&
                                    ((transaction.selectedUserType === "buyer" && transaction.buyerConfirmed) ||
                                      (transaction.selectedUserType === "seller" && transaction.sellerConfirmed))) ||
                                  (currentUser && transaction.userId &&
                                    (transaction.userId._id ? currentUser._id !== transaction.userId._id : currentUser._id !== transaction.userId) &&
                                    ((transaction.selectedUserType === "buyer" && transaction.sellerConfirmed) ||
                                      (transaction.selectedUserType === "seller" && transaction.buyerConfirmed)))
                                )
                                  ? "Pending Completion"
                                  : "Complete Transaction"
                              }
                            </button>

                            <div className=" text-[13px]">
                              <button
                                className="px-3 mt-3 py-2 bg-[#318AE6] rounded-xl font-bold"
                                onClick={() => handleFund(transaction)}
                                disabled={transaction.funded}
                              >
                                {transaction.funded ? "Funded" : "Fund Account"}
                              </button>
                            </div>
                          </div>

                          {/* {
                            doneModel && (
                              <>
                              <h1>are you sure you want to complete this transaction</h1>
                              <button>No</button>
                                <button
                                  onClick={() => completeTransaction(transaction._id)} // Call the completeTransaction function
                                  className="mt-3 p-2 bg-[#318AE6] rounded-lg font-bold"
                                >
                                  Yes
                                </button>

                              </>
                            )
                          } */}
                        </div>
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
    </div>
  );
};
export default DisplayTransaction;