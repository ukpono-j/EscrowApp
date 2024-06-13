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
    image: "",
    price: "",
    shippingAddress: "",
    trackingNumber: "",
    deliveryDate: "",
  });
  const [buyerWaybillDetails, setBuyerWaybillDetails] = useState({});




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
                      <p>Created At{transaction.createdAt}</p>
                      <p>Proof of way bill: {transaction.proofOfWaybill}</p>
                      <p>Selected User Type: {transaction.selectedUserType}</p>
                      <p>Payment Bank: {transaction.paymentBank}</p>
                      <p>Transaction ID: {transaction.transactionId}</p>
                      <p>Participants: {transaction.participants[0]}</p>
                      <div className="flex items-center justify-between">
                        <p>Status: {transaction.status}</p>
                        <div className=" text-[13px]">
                          <button className="px-3 mt-3 py-2 bg-[#318AE6] rounded-xl">Fund Account</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-7">
                        <button className="border px-3 py-3 rounded-xl" onClick={() => handleBuyerWaybillPopup(transaction._id)}>View Waybill Details</button>
                        <button className="border px-3 py-3 rounded-xl" onClick={() => handleWaybillPopup(transaction._id)}>Input Waybill Details</button>
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
                            <form className="h-[auto] mt-10" onSubmit={(e) => { e.preventDefault(); handleWaybillSubmit(transaction._id); }}>
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
                                <div>
                                  <p><strong>Item:</strong> {buyerWaybillDetails[transaction._id].item}</p>
                                  <p><strong>Image:</strong> <img src={buyerWaybillDetails[transaction._id].image} alt="Waybill item" /></p>
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
                    </div>
                  ))
              )}
            </div>
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
