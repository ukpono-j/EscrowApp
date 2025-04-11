import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import "./MainJoinTransaction.css";

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
    <div className="font-[Poppins] pt-14 md:pr-14 pr-10 pl-10 mt-10 md:pl-14 pb-10">
      <h1 className="font-bold text-[35px] text-center md:text-start">Join Transaction</h1>
      <p className="pt-10 pb-8 text-center md:text-start">
        Please enter the Transaction ID you received from the person you are transacting with.
      </p>
      <form onSubmit={handleConfirm}>
        <input
          type="text"
          required
          placeholder="Transaction ID"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="border-b-2 border-[#318AE6] text-[13px] outline-none bg-[transparent] w-[100%]"
        />
        <div className="mt-14 md:w-[70%]">
          <button
            type="submit"
            disabled={isLoading || !transactionId}
            className={`w-[100%] h-[35px] rounded-3xl cursor-pointer text-[#fff] text-[12px] join_btn font-bold uppercase bg-[#318AE6] ${
              isLoading || !transactionId ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {isLoading ? "Processing..." : "Join Transaction"}
          </button>
          {responseMessage && (
            <p
              className={`text-center text-[13px] pt-3 ${
                messageType === "error" ? "text-red-500" : "text-green-500"
              }`}
            >
              {responseMessage}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default MainJoinTransaction;