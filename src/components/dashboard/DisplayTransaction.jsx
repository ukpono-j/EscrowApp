import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { FiSearch } from "react-icons/fi";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { Modal, useToast } from "@chakra-ui/react";
import MiniNav from "./MiniNav";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { FaFacebookMessenger } from "react-icons/fa6";
import { BsChatFill } from "react-icons/bs";
import { MdClose } from "react-icons/md";
import PaystackPop from "@paystack/inline-js";


const DisplayTransaction = ({ userResponse }) => {
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showWaybillPopup, setShowWaybillPopup] = useState({});
  const [showBuyerWaybillPopup, setShowBuyerWaybillPopup] = useState({});
  const [transactions, setTransactions] = useState([]);
  const toast = useToast();
  const navigate = useNavigate(); // Initialize useNavigate
  // const [showWaybillPopup, setShowWaybillPopup] = useState(false);
  const [buyershowWaybillPopup, setBuyerShowWaybillPopup] = useState(false);
  const [waybillDetails, setWaybillDetails] = useState({
    item: "",
    image: "",
    price: "",
    shippingAddress: "",
    trackingNumber: "",
    deliveryDate: "",
  });
  const [buyerWaybillDetails, setBuyerWaybillDetails] = useState({});
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentBank, setPaymentBank] = useState("");
  const [paymentAccountNumber, setPaymentAccountNumber] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [email, setEmail] = useState("");


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
      setBuyerWaybillDetails({ [transactionId]: response.data.waybillDetails || null });
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
    try {
      const response = await axios.post(
        `${BASE_URL}/api/transactions/submit-waybill`,
        { transactionId, waybillDetails },
        {
          headers: { "auth-token": token },
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

  const handleFundsPayment = () => {
    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: "pk_test_510517e6c4bcd95b12a073078d57b139164845d8",
      amount: paymentAmount * 100, // Convert to kobo if dealing with Naira
      paymentName: paymentName,
      paymentDescription: paymentDescription,
      // email: email,
      paymentAccountNumber: paymentAccountNumber,
      paymentBank: paymentBank,
      onSuccess(transaction) {
        let message = `payment complete! Reference ${transaction.reference}`;
        alert(message)
        // setEmail("");
        setPaymentDescription("");
        setPaymentAmount("");
        setPaymentName("");
        setPaymentBank("");
        setPaymentAccountNumber("");
        // navigate("/transactions/tab");

      },
      oncancel() {
        alert("You have canceled the transaction");
      },
    });
    // Assuming you're sending paymentName, email, paymentAmount, and paymentDscription from state

  }

  return (
    <div className="border flex items-center border-black">
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
      />
      <div
        style={{ overflowY: "scroll" }}
        className="layout bg-[#1A1E21] text-[#E4E4E4] fixed right-0 top-0 w-[100%] md:w-[83.2%] h-[100vh]"
      >
        <div
          className={showToggleContainer ? "h-[auto] toggleContainer" : "hidden"}
        >
          <div>
            <MiniNav />
          </div>
          <div className="font-[Poppins] pt-14 md:pr-14 pr-7 pl-7 mt-10 md:pl-14 pb-20">
            <h1 className="text-[33px] font-bold">My Transactions</h1>
            <div className="sm:flex sm:flex-row flex flex-col-reverse mt-4 mb-4 text-[14px] items-center justify-between ">
              <div className="sm:max-w-[280px] w-[100%] border-b border-[#318AE6] rounded h-[auto]">
              </div>
  
              {/* ================= Search Feature ======= */}
              <div className="sm:w-[200px] w-[100%] sm:mb-0 mb-6 h-[auto] flex items-center">
                <input
                  type="text"
                  placeholder="Search"
                  name=""
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} // Add onChange handler
                  className="pr-[20px] text-[#fff] w-[100%] bg-[transparent] border-[#fff] border-b text-[13px] pb-2 outline-none"
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
                  {transactions
                    .filter(transaction =>
                      transaction.paymentName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((transaction) => (
                      <div key={transaction._id} className="transaction-card text-[13px] mt-3 px-5 py-4 bg-[#111518] rounded-2xl">
                        <div className="mt-2 flex items-center justify-between">
                          <h3 className="text-[#F6F6F6]  text-[13px]">Name:</h3>
                          <p className="sm:pl-2 font-bold text-[14px]"> {transaction.paymentName}</p>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <h3 className="text-[#F6F6F6]  text-[13px]">Email:</h3>
                          <p className="sm:pl-2 font-bold text-[14px]"> {transaction.email}</p>
                        </div>
                        <div className="flex mt-3 items-center justify-between">
                          <p className="text-[#F6F6F6]  text-[143x]">Payment Amount:</p>
                          <p className="sm:pl-2 font-bold text-[14px]"> {transaction.paymentAmount}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <h3 className="text-[#F6F6F6]  text-[13px]">Description: </h3>
                          <p className="sm:pl-2 font-bold text-[14px]">{transaction.paymentDescription}</p>
                        </div>
                        <div className="flex mt-3 items-center justify-between">
                          <h3 className="text-[#F6F6F6]  text-[13px]">Created At</h3>
                          <p className="sm:pl-2 font-bold text-[14px]">{transaction.createdAt}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <h3 className="text-[#F6F6F6]  text-[13px]">Proof of way bill: </h3>
                          <p className="sm:pl-2 font-bold text-[14px] tracking-wide">{transaction.proofOfWaybill}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <h3 className="text-[#F6F6F6]  text-[13px]">Selected User Type: </h3>
                          <p className="sm:pl-2 font-bold text-[14px] tracking-wide">{transaction.selectedUserType}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <h3 className="text-[#F6F6F6]  text-[13px]">Payment Bank: </h3>
                          <p className="sm:pl-2 font-bold text-[14px] tracking-wide">{transaction.paymentBank}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <h3 className="text-[#F6F6F6]  text-[13px]">Transaction ID: </h3>
                          <p className="sm:pl-2 font-bold text-[14px] tracking-wide">{transaction.transactionId}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <h3 className="text-[#F6F6F6]  text-[13px]">Status: </h3>
                          <p className="sm:pl-2 font-bold text-[14px] tracking-wide">{transaction.status}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="text-[12px]">
                            <button className="px-3 py-2 bg-[#318AE6] rounded-xl" onClick={handleFundsPayment}>Fund Account</button>
                          </div>
                          <div className="flex items-center justify-between">
                            {transaction.selectedUserType === "buyer" && (
                              <button className="px-3 py-2 text-[12px] rounded-xl bg-[#318ae6]" onClick={() => handleBuyerWaybillPopup(transaction._id)}>View Waybill Details</button>
                            )}
                            {transaction.selectedUserType === "seller" && (
                              <button className="px-3 py-2 text-[12px] rounded-xl bg-[#318ae6]" onClick={() => handleWaybillPopup(transaction._id)}>Input Waybill Details</button>
                            )}
                            {showWaybillPopup[transaction._id] && (
                              <div style={{ overflowY: "scroll" }} className="modal-container pr-5 pt-5 pb-10 pl-5 fixed z-30 bg-[#111518] left-0 top-0 w-[100%] h-[100vh]">
                                <div>
                                  <div className="w-[100%]">
                                    <button
                                      onClick={() => ClosehandleWaybillPopup(transaction._id)} className="absolute top-3 text-[30px]">
                                      <MdClose />
                                    </button>
                                  </div>
                                </div>
                                <form className="h-[auto] mt-10" onSubmit={(e) => { e.preventDefault(); handleWaybillSubmit(transaction._id); }}>
                                  <div className="">
                                    <h1 className="text-[30px] font-bold text-center">Seller Waybill Proof</h1>
                                    <p className="text-[17px] text-center pt-3">I'm the seller, confirm that I have shipped the goods.</p>
                                    <div className="mt-3">
                                      <h3>Item:</h3>
                                      <div>
                                        <input type="text" className="text-[white] bg-[transparent] border border-[#318AE6] pl-3 outline-none w-[100%] h-[40px] rounded-xl mt-2" value={waybillDetails.item} onChange={(e) => setWaybillDetails({ ...waybillDetails, item: e.target.value })} />
                                      </div>
                                    </div>
                                    <div className="mt-3">
                                      <h3>Image:</h3>
                                      <input type="file" value={waybillDetails.image} onChange={(e) => setWaybillDetails({ ...waybillDetails, image: e.target.value })} />
                                      <div>
                                        {/* Preview Image */}
                                      </div>
                                    </div>
                                    <div className="mt-3">
                                      <h3>Price:</h3>
                                      <input type="number" className="text-[white] bg-[transparent] border border-[#318AE6] pl-3 outline-none w-[100%] h-[40px] rounded-xl mt-2" value={waybillDetails.price} onChange={(e) => setWaybillDetails({ ...waybillDetails, price: e.target.value })} />
                                    </div>
                                    <div className="mt-3">
                                      <h3>Quantity:</h3>
                                      <input type="number" className="text-[white] bg-[transparent] border border-[#318AE6] pl-3 outline-none w-[100%] h-[40px] rounded-xl mt-2" value={waybillDetails.quantity} onChange={(e) => setWaybillDetails({ ...waybillDetails, quantity: e.target.value })} />
                                    </div>
                                    <div className="mt-3">
                                      <h3>Message:</h3>
                                      <textarea className="text-[white] bg-[transparent] border border-[#318AE6] pl-3 outline-none w-[100%] h-[80px] rounded-xl mt-2" value={waybillDetails.message} onChange={(e) => setWaybillDetails({ ...waybillDetails, message: e.target.value })} />
                                    </div>
                                    <div className="flex justify-center mt-10">
                                      <button className="px-3 py-2 rounded-xl bg-[#318ae6]" type="submit">Submit</button>
                                    </div>
                                  </div>
                                </form>
                              </div>
                            )}
                            {showBuyerWaybillPopup[transaction._id] && (
                              <div style={{ overflowY: "scroll" }} className="modal-container pr-5 pt-5 pb-10 pl-5 fixed z-30 bg-[#111518] left-0 top-0 w-[100%] h-[100vh]">
                                <div>
                                  <div className="w-[100%]">
                                    <button onClick={() => ClosehandleBuyerWaybillPopup(transaction._id)} className="absolute top-3 text-[30px]"><MdClose /></button>
                                  </div>
                                </div>
                                <div className="mt-10">
                                  <div className="flex justify-center">
                                    <div className="border border-[#318ae6] rounded-[10px] h-[50vh] mt-5 overflow-y-auto pl-3">
                                      <h3 className="pt-3">Item</h3>
                                      <p>{transaction.waybillDetails?.item}</p>
                                      <h3 className="pt-3">Image</h3>
                                      <div>
                                        {transaction.waybillDetails?.image && <img src={transaction.waybillDetails.image} alt="Waybill" className="w-[100%] h-[auto]" />}
                                      </div>
                                      <h3 className="pt-3">Price</h3>
                                      <p>{transaction.waybillDetails?.price}</p>
                                      <h3 className="pt-3">Quantity</h3>
                                      <p>{transaction.waybillDetails?.quantity}</p>
                                      <h3 className="pt-3">Message</h3>
                                      <p>{transaction.waybillDetails?.message}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default DisplayTransaction;
