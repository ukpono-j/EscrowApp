import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BASE_URL ;

const MainJoinTransaction = () => {
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [transactionId, setTransactionId] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  useEffect(() => {
    let timeoutId;
    if (responseMessage) {
      timeoutId = setTimeout(() => {
        setResponseMessage("");
      }, 5000); // 5000 milliseconds (5 seconds)
    }

    return () => {
      clearTimeout(timeoutId); // Clear the timeout on component unmount or when responseMessage changes
    };
  }, [responseMessage]);


  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth-token");
      if (token) {
        axios.defaults.headers.common["auth-token"] = token;
      }

      const response = await axios.post(
        `${BASE_URL}/join-transaction`,
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
      if (error.response && error.response.status === 400) {
        // Handle 400 error
        setResponseMessage(
          "This Error is because the user is already a participant in this transaction."
        );
      } else {
        // Handle other errors
        setResponseMessage("Error joining transaction. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pl-20 font-[Poppins] mt-10  pr-20  pt-14 pb-14">
      <h1 className="font-bold text-[30px]">Join Transaction</h1>
      <p className="pt-10 pb-8">
        Please paste the link you received from the person you are transacting
        with.
      </p>
      <form action="">
        <input
          type="text"
          required
          placeholder="Transaction ID"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="border-b-2 border-[#F95CA1] text-[13px] outline-none bg-[transparent] w-[100%]"
        />
        <div className="mt-14  w-[70%]">
          <button
            onClick={handleConfirm}
            disabled={isLoading || !transactionId}
            className={`w-[100%] h-[35px] rounded-3xl text-[#fff] text-[12px] font-bold uppercase bg-[#0F0821] ${
              isLoading ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {isLoading ? "Processing..." : "Join Transaction"}
          </button>
          {responseMessage && (
            <p
              className={`text-center text-[13px] pt-3 ${
                responseMessage.includes("Error")
                  ? "text-red-500"
                  : "text-[#0F0821]"
              }`}
            >
              {responseMessage}
            </p>
          )}
          {/* <p className="text-center text-[#0F0821] text-[14px] pt-3">
            Already joined the transaction?{" "}
            <Link to="" className="underline">
              Click here to confirm
            </Link>
          </p> */}
        </div>
      </form>
    </div>
  );
};

export default MainJoinTransaction;
