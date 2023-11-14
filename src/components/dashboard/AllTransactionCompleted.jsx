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

const AllTransactionCompleted = ({
  transactionDetails,
  userId,
  onCancel,
  onComplete,
}) => {
  const [copied, setCopied] = useState(null);
  const toast = useToast(); // Initialize useToast hook
  const [paymentStatus, setPaymentStatus] = useState({});

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

  // Sort transactions by timestamp in descending order (newest first)
  // const sortedTransactions = transactionDetails.sort(
  //   (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  // );

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
      paymentDscription: paymentDetails.paymentDscription,
      email: paymentDetails.email,
      paymentAccountNumber: paymentDetails.paymentAccountNumber,
      paymentBank: paymentDetails.paymentBank,
      onSuccess(transaction) {
        try {
          const token = localStorage.getItem("auth-token");

          const response = axios.post(
            `${BASE_URL}/update-payment-status`,
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
          // Handle error if needed
        }

        // console.log("Proof of payment Status confirmed:", response.data);
        // console.log("Transaction ID:", transactionId);

        // setPaymentStatus((prevPaymentStatus) => ({
        //   ...prevPaymentStatus,
        //   [transactionId]: "paid",
        // }));

        let message = `payment complete! Reference ${transaction.reference}`;
        // navigate("/transactions/tab");

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
      paymentDscription: transaction.paymentDscription,
      email: transaction.email,
      paymentAccountNumber: transaction.paymentAccountNumber,
      paymentBank: transaction.paymentBank,
    };

    initiatePaystackPayment(paymentDetails, transaction.transactionId);
  };

  const handleChat = () => {
    console.log("User Chat Clicked");
  };

  const handleConfirmReceipt = async (transactionId) => {
    const token = localStorage.getItem("auth-token");

    try {
      // Make a POST request to the server to confirm the receipt
      const response = await axios.post(
        `${BASE_URL}/confirm-receipt`,
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
              <div
                className="mr-4 text-[25px] cursor-pointer"
                onClick={handleChat}
              >
                <BsFillChatFill />
              </div>
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
              {transaction.paymentDscription}
            </p>
          </div>
          <div>
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
          <div className="flex items-center  justify-between  ">
            <div className="w-[80%]">
              <h3 className="font-[600] text-[16px] ">
                Proof of waybill:
                <span className="ml-2 font-[100]  text-[14px]">
                  {displayProofOfWaybill(transaction)}
                </span>
              </h3>
              <p className="pt-1 text-[13px]">
                Note : Seller should upload 2 videos and 2 images of the waybill
                proof.
              </p>
            </div>

            {transaction.status === "active" && (
              <>
                <button
                  onClick={() =>
                    handleConfirmReceipt(transaction.transactionId)
                  }
                  className="flex items-center justify-center pl-[27px] pt-[9px] pb-[9px] pr-[27px] rounded-full text-[#fff] text-[13px] bg-[#81712E] border-2 border-[#81712E] hover:border-2 hover:border-[#81712E] hover:bg-[transparent]"
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
          <div className="flex mt-6  items-center justify-between">
            <h5 className="text-[13px]">
              {/* {new Date(transaction.createdAt).toLocaleDateString()} */}
              {formatCreatedAt(transaction.createdAt)}
            </h5>
            <div className="flex items-center ">
              {transaction.status === "active" && (
                <>
                  <button
                    onClick={() => onCancel(transaction.transactionId)}
                    className="ml-3 flex items-center   justify-center  pl-[38px] pt-[9px] pb-[9px] pr-[38px]   rounded-full text-[#fff] text-[13px] bg-[#81712E] border-2  border-[#81712E] all_btn   hover:border-2  hover:border-[#81712E]  hover:bg-[transparent]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onComplete(transaction.transactionId)}
                    className="ml-3 flex items-center   justify-center  pl-[38px] pt-[9px] pb-[9px] pr-[38px]   rounded-full text-[#fff] text-[13px] bg-[#81712E] border-2  border-[#81712E] all_btn   hover:border-2  hover:border-[#81712E]  hover:bg-[transparent]"
                    disabled={transaction.proofOfWaybill !== "confirmed"}
                  >
                    Done
                  </button>
                  <button
                    onClick={() => handleMakePayment(transaction)}
                    className="flex items-center justify-center pl-[27px] ml-3  pt-[9px] pb-[9px] pr-[27px] rounded-full text-[#fff] text-[13px] bg-[#81712E] border-2 border-[#81712E] hover:border-2 hover:border-[#81712E] hover:bg-[transparent]"
                    disabled={transaction.proofOfWaybill !== "confirmed"}
                  >
                    {transaction.paymentStatus === "paid"
                      ? "Paid"
                      : "Make Payment"}
                  </button>
                </>
              )}

              {/* <button
                onClick={() => handleMakePayment(transaction)}
                className={`ml-3 flex items-center justify-center pl-[38px] pt-[9px] pb-[9px] pr-[38px] rounded-full text-[#fff] text-[13px] bg-[#81712E] border-2 border-[#81712E] all_btn hover:border-2 hover:border-[#81712E] hover:bg-[transparent] ${
                  paymentStatus[transaction.transactionId] === "paid"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={transaction.proofOfWaybill !== "confirmed"}
              >
                {paymentStatus[transaction.transactionId] === "paid"
                  ? "Paid"
                  : "Make Payment"}
              </button> */}

              {/* Render Cancel and Done buttons only if the user is a participant and the transaction status is active */}
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
