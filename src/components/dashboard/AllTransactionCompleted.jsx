import React, { useState } from "react";
import { PiCurrencyNgnDuotone } from "react-icons/pi";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { useToast } from "@chakra-ui/react";
import { formatCreatedAt } from "../../utility/DateTimeStramp";
import "./AllTransactionCompleted.css";
import PaystackPop from "@paystack/inline-js";
import { MdMarkChatUnread } from "react-icons/md";
import { BsFillChatFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import axios from "axios";
import { Tooltip } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom"; // Import useNavigate


const AllTransactionCompleted = ({
  transactionDetails,
  userId,
  onCancel,
  onComplete,
}) => {
  const [copied, setCopied] = useState(null);
  const toast = useToast(); // Initialize useToast hook
  const [paymentStatus, setPaymentStatus] = useState({});
  const navigate = useNavigate();


  const isUserParticipant = (transaction, userId) => {
    // Check if the user's ID is in the list of participants' IDs
    const isParticipant = transaction.participants.some(
      (participant) => participant.userId === userId
    );

    // Check if the user's ID matches the transaction creator's ID
    const isCreator = transaction.userId === userId;

    return isParticipant || isCreator;
  };

  if (!transactionDetails) {
    return <div>Loading...</div>;
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true); // Set copied to true when the button is clicked
    // Show toast notification or any other indication if you prefer
    toast({
      title: "Link Copied!",
      status: "success",
      duration: 2000, // Toast message duration in milliseconds
      isClosable: true,
    });
  };

  const initiatePaystackPayment = (paymentDetails, transactionId) => {
    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: "pk_test_510517e6c4bcd95b12a073078d57b139164845d8",
      amount: paymentDetails.paymentAmount * 100,
      paymentName: paymentDetails.paymentName,
      paymentDescription: paymentDetails.paymentDescription,
      email: paymentDetails.email,
      paymentAccountNumber: paymentDetails.paymentAccountNumber,
      paymentBank: paymentDetails.paymentBank,
      onSuccess(transaction) {
        try {
          const token = localStorage.getItem("auth-token");

          const response = axios.post(
            `${BASE_URL}/api/transactions/update-payment-status`,
            { transactionId: transactionId, paymentStatus: "paid" },
            {
              headers: {
                "auth-token": token,
              },
            }
          );

          // console.log("Proof of payment Status confirmed:", response.data);

          // ... rest of the code
        } catch (error) {
          console.error("Error updating payment status:", error);
        }


        let message = `payment complete! Reference ${transaction.reference}`;
        toast({
          title: "Payment Successful!",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        // Create a new notification object
        const newNotification = {
          title: "New Transaction Created",
          message: `A ${selectedUserType} made a  Payment of ${paymentAmount} received for ${paymentDscription}. Reference: ${paymentName}`,
          transactionId: transactionId,
        };
        // Make an API request to create the notification
        axios
          .post(`${BASE_URL}/notifications`, newNotification, {
            headers: {
              "auth-token": token,
            },
          })
          .then((notificationResponse) => {
            console.log("Notification created:", notificationResponse.data);
          })
          .catch((notificationError) => {
            console.error("Error creating notification:", notificationError);
            // Handle error creating notification if needed
          });
      },
      oncancel() {
        alert("You have canceled the transaction");
      },
      // ref: "unique_transaction_reference",
      callback: function (response) {
        // Handle Paystack response here
        console.log(response);
      },
      onClose: function () {
        // Handle transaction close event
        console.log("Transaction closed.");
      },
    });
    // For demonstration purposes, let's show a dummy success message

    // Additional logic if needed
  };

  const handleMakePayment = (transaction) => {
    if (paymentStatus[transaction.transactionId] === "paid") {
      // Already paid, do nothing
      return;
    }

    const paymentDetails = {
      paymentAmount: transaction.paymentAmount,
      paymentName: transaction.paymentName,
      paymentDescription: transaction.paymentDescription,
      email: transaction.email,
      paymentAccountNumber: transaction.paymentAccountNumber,
      paymentBank: transaction.paymentBank,
    };

    initiatePaystackPayment(paymentDetails, transaction.transactionId);
  };


  const handleConfirmReceipt = async (transactionId) => {
    const token = localStorage.getItem("auth-token");

    try {
      // Make a POST request to the server to confirm the receipt
      const response = await axios.post(
        `${BASE_URL}/api/transactions/confirm-receipt`,
        {},
        {
          headers: {
            "auth-token": token,
          },
        }
      );

      console.log("Proof of waybill confirmed:", response.data);
      toast({
        title: "Proof of waybill confirmed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // You may want to update the local state or trigger a re-fetch
      // to reflect the updated data without refreshing the page.
    } catch (error) {
      console.error("Error confirming receipt:", error);
      // Handle error if needed
    }
  };

  const displayProofOfWaybill = (transaction) => {
    if (transaction.proofOfWaybill === "confirmed") {
      return "Confirmed";
    } else if (transaction.proofOfWaybill === "pending") {
      return "Pending";
    } else {
      // Handle other states if needed
      return "Unknown";
    }
  };

  const displayPaymentStatus = (transaction) => {
    if (transaction.paymentStatus === "paid") {
      return "Confirmed";
    } else if (transaction.paymentStatus === "active") {
      return "active";
    } else {
      // Handle other states if needed
      return "Unknown";
    }
  };

  
  const handleChatClick = async (transactionId) => {
    
    const token = localStorage.getItem("auth-token");
    try {
      // Fetch transaction data from the server
      const transactionResponse = await axios.get(`${BASE_URL}/api/transactions/${transactionId}`, {
        headers: {
          "auth-token": token,
        },
      });
  
      const transactionData = transactionResponse.data;
      console.log("Transaction Data:", transactionData); // Log the transaction data
  
      const userId = transactionData.userId;
  
      if (!userId) {
        console.error("User ID is missing");
        toast({
          title: "Error creating chatroom",
          description: "User ID is missing",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      console.log({ transactionId, userId });
  
      // Proceed with creating the chatroom if necessary
      const response = await axios.post(
        `${BASE_URL}/api/transactions/create-chatroom`,
        { transactionId, userId },
        {
          headers: {
            "auth-token": token,
          },
        }
      );
  
      const chatroomId = response.data.chatroomId;
      navigate(`/chat/${chatroomId}`);
    } catch (error) {
      console.error("Error fetching transaction or creating chatroom:", error);
      toast({
        title: "Error creating chatroom",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  

  return (
    <div>
      {transactionDetails.map((transaction) => (
        <div
          key={transaction.transactionId}
          className="w-[100%] h-[auto] mt-4 rounded-2xl bg-[#031420]  pl-5  pt-4  pb-4  pr-5"
        >
          <div className="flex  text-[17px] items-center justify-between">
            <div className="text-[14px] flex   items-center ">
              <p className="font-[600] text-[15px]">User Name :</p>{" "}
              <span className="pl-2  text-[13px]">
                {" "}
                {transaction.paymentName}{" "}
              </span>
            </div>
            <div className="flex items-center">
            <button onClick={() => handleChatClick(transaction.transactionId)}>Chat</button>
              <h4 className="flex font-bold  items-center">
                <span className="">
                  <PiCurrencyNgnDuotone />
                </span>{" "}
                {transaction.paymentAmount}
              </h4>
            </div>
          </div>
          {/* <div>Product Description: {transaction.paymentDscription}</div> */}
          <div>
            <p className="text-[13px] mt-1">
              <span className="font-[600] text-[15px]">
                Product Description :{" "}
              </span>{" "}
              {transaction.paymentDescription}
            </p>
          </div>
          <div>
            {/* <p className="text-[13px] mt-1">
              <span className="font-[600] text-[15px]">Amount : </span>{" "}
              {transaction.amount}
            </p> */}
            <p className="text-[13px] mt-1">
              <span className="font-[600] text-[15px]">Email : </span>{" "}
              {transaction.email}
            </p>
            <p className="text-[13px] mt-1">
              <span className="font-[600] text-[15px]">Bank Name : </span>{" "}
              {transaction.paymentBank}
            </p>
            <p className="text-[13px] mt-1">
              <span className="font-[600] text-[15px]">Bank Number : </span>{" "}
              {transaction.paymentAccountNumber}
            </p>
            <p className="text-[13px] mt-1">
              <span className="font-[600] text-[15px]">
                Selected User Type :{" "}
              </span>{" "}
              {transaction.selectedUserType}
            </p>
            <p className="text-[13px] mt-1">
              <span className="font-[600] text-[15px]">
                Selected User Type :{" "}
              </span>{" "}
              {transaction.willUseCourier ? "Yes" : "No"}
            </p>
            <div className="flex items-center ">
              <p className="text-[13px]">
                <span className="font-[600] text-[15px]">
                  Transaction Id :{" "}
                </span>{" "}
                {transaction.transactionId}{" "}
              </p>
              <div className="relative">
                <button
                  className="ml-3 border-2  border-[#81712E] pl-4 pr-4  pt-1 pb-1 rounded-xl text-[12px]"
                  onClick={() => copyToClipboard(transaction.transactionId)}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
          {/* ===================== Upload  */}
          <div className="flex items-center   justify-between  ">
            <div className="w-[80%]">
              <h3 className="font-[600] text-[16px] ">
                Proof of waybill:
                <span className="ml-2 font-[200]  text-[14px]">
                  {displayProofOfWaybill(transaction)}
                </span>
              </h3>
              <p className="pt-1 text-[13px]">
                Note : Have you seen proof of waybill in chat?
              </p>
            </div>

            {transaction.status === "active" && (
              <>
                <button
                  onClick={() =>
                    handleConfirmReceipt(transaction.transactionId)
                  }
                  className="flex items-center justify-center md:w-[170px] md:h-[40px] w-[150px] h-[40px]  rounded-full text-[#fff] text-[13px] bg-[#81712E] border-2 border-[#81712E] hover:border-2 hover:border-[#81712E] hover:bg-[transparent]"
                  disabled={transaction.proofOfWaybill === "confirmed"}
                >
                  {transaction.proofOfWaybill === "confirmed"
                    ? "Confirmed"
                    : "Confirm Receipt"}
                </button>
              </>
            )}

            <div></div>
          </div>
          {/* =====================End  of  Upload  */}
          <div className="md:flex md:flex-row flex-col-reverse  flex   md:items-center items-start  justify-between">
            <h5 className="text-[13px] md:mt-0 mt-1">
              {/* {new Date(transaction.createdAt).toLocaleDateString()} */}
              {formatCreatedAt(transaction.createdAt)}
            </h5>
            <div className="flex flex-wrap  items-center md:mt-0 mt-2 md:mb-0 mb-2 ">
              {transaction.status === "active" && (
                <>
                  <button
                    onClick={() => onCancel(transaction.transactionId)}
                    className=" flex items-center   justify-center m-1 md:mt-3  md:w-[130px] w-[120px] mt-2  h-[40px]  md:h-[40px]    rounded-full text-[#fff] text-[13px] bg-[#81712E] border-2  border-[#81712E] all_btn   hover:border-2  hover:border-[#81712E]  hover:bg-[transparent]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onComplete(transaction.transactionId)}
                    className="flex items-center   justify-center m-1 md:mt-3  md:w-[130px] mt-2  w-[120px] h-[40px]  md:h-[40px]   rounded-full text-[#fff] text-[13px] bg-[#81712E] border-2  border-[#81712E] all_btn   hover:border-2  hover:border-[#81712E]  hover:bg-[transparent]"
                    disabled={transaction.proofOfWaybill !== "confirmed"}
                  >
                    Done
                  </button>
                  <button
                    onClick={() => handleMakePayment(transaction)}
                    className="flex items-center justify-center m-1 md:mt-3  md:w-[170px] w-[140px]  mt-2   h-[40px]  md:h-[40px] rounded-full text-[#fff] text-[13px] bg-[#81712E] border-2 border-[#81712E] hover:border-2 hover:border-[#81712E] hover:bg-[transparent]"
                    disabled={transaction.proofOfWaybill !== "confirmed"}
                  >
                    {transaction.paymentStatus === "paid"
                      ? "Paid"
                      : "Make Payment"}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="text-[13px]">Status: {transaction.status}</div>{" "}
          {/* Add this line */}
        </div>
      ))}
    </div>
  );
};

export default AllTransactionCompleted;