import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import "./MainJoinTransaction.css";

const MainJoinTransaction = () => {
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [transactionId, setTransactionId] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  useEffect(() => {
    if (responseMessage) {
      const timeoutId = setTimeout(() => {
        setResponseMessage("");
      }, 5000); // 5000 milliseconds (5 seconds)
      return () => clearTimeout(timeoutId); // Clear the timeout on component unmount or when responseMessage changes
    }
  }, [responseMessage]);

  const handleConfirm = async (e) => {
    e.preventDefault(); // Prevent default form submission
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth-token");
      if (token) {
        axios.defaults.headers.common["auth-token"] = token;
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

      // Handle the response from the server as needed
      setResponseMessage(response.data.message);
      console.log(response.data);
      navigate("/transactions/tab");
    } catch (error) {
      console.error("Error joining transaction:", error);
      if (error.response) {
        // Handle known server errors
        if (error.response.status === 400) {
          setResponseMessage("User is already a participant in this transaction.");
        } else if (error.response.status === 404) {
          setResponseMessage("Transaction not found.");
        } else {
          setResponseMessage("Error joining transaction. Please try again.");
        }
      } else {
        // Handle network or other errors
        setResponseMessage("Network error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-[Poppins] pt-14 md:pr-14 pr-10 pl-10 mt-10 md:pl-14 pb-10">
      <h1 className="font-bold text-[35px] text-center md:text-start">Join Transaction</h1>
      <p className="pt-10 pb-8 text-center md:text-start">
        Please paste the link you received from the person you are transacting with.
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
              isLoading ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {isLoading ? "Processing..." : "Join Transaction"}
          </button>
          {responseMessage && (
            <p
              className={`text-center text-[13px] pt-3 ${
                responseMessage.includes("Error") ? "text-red-500" : "text-[#0F0821]"
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
