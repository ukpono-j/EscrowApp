import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import "./MainJoinTransaction.css";
import { Box, Text, VStack } from "@chakra-ui/react";

const MainJoinTransaction = () => {
  const [transactionId, setTransactionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const navigate = useNavigate();

  useEffect(() => {
    if (responseMessage) {
      const timeoutId = setTimeout(() => {
        setResponseMessage("");
        setMessageType("");
      }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [responseMessage]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth-token");

      if (!token) {
        setResponseMessage("You must be logged in to join a transaction");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/api/transactions/join-transaction`,
        { transactionId },
        {
          headers: {
            "auth-token": token,
          },
        }
      );

      // Handle successful response
      setResponseMessage(`Successfully joined as ${response.data.role}. Redirecting...`);
      setMessageType("success");

      // Redirect after a short delay to show the success message
      setTimeout(() => {
        navigate("/transactions/tab");
      }, 2000);

    } catch (error) {
      console.error("Error joining transaction:", error);
      if (error.response) {
        setResponseMessage(error.response.data.error || "Error joining transaction");
      } else {
        setResponseMessage("Network error. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" className="font-[Poppins] pr-[28px] join_Component pl-[100px] pt-10 md:pl-[10px]" w="full" >
      <VStack spacing={8} maxW="900px" mx="auto">
        <Text className="font-bold text-[35px]">Join Transaction</Text>
        <p className="pb-8 text-[17px]">
          Please enter the Transaction ID you received from the person you are transacting with.
        </p>
        <form onSubmit={handleConfirm} className="w-[98%]">
          <input
            type="text"
            required
            placeholder="Transaction ID"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="border-b-2 border-[#A78136] text-[13px] outline-none bg-[transparent] w-[100%]"
          />
          <div className="mt-14 md:w-[100%]">
            <button
              type="submit"
              disabled={isLoading || !transactionId}
              className={`w-[100%] h-[35px] m-auto rounded-3xl cursor-pointer text-[#fff] text-[12px] join_btn font-bold uppercase bg-[#A78136] ${isLoading || !transactionId ? "cursor-not-allowed opacity-50" : ""
                }`}
            >
              {isLoading ? "Processing..." : "Join Transaction"}
            </button>
            {responseMessage && (
              <p
                className={`text-center text-[13px] pt-3 ${messageType === "error" ? "text-red-500" : "text-green-500"
                  }`}
              >
                {responseMessage}
              </p>
            )}
          </div>
        </form>

      </VStack>

    </Box>
  );
};

export default MainJoinTransaction;