import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { FiSearch } from "react-icons/fi";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { useToast } from "@chakra-ui/react";
import MiniNav from "./MiniNav";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { FaFacebookMessenger } from "react-icons/fa6";

const DisplayTransaction = ({ userResponse }) => {
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState([]);
  const toast = useToast();
  const navigate = useNavigate(); // Initialize useNavigate

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
                          <FaFacebookMessenger />
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
