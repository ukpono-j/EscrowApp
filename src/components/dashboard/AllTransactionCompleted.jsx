import React, { useState } from "react";
import { PiCurrencyNgnDuotone } from "react-icons/pi";
const BASE_URL = import.meta.env.VITE_BASE_URL ;
import { useToast } from "@chakra-ui/react";
import {formatCreatedAt } from "../../utility/DateTimeStramp"

const AllTransactionCompleted = ({
  transactionDetails,
  userId,
  onCancel,
  onComplete,
}) => {
  const [copied, setCopied] = useState(null);
  const toast = useToast(); // Initialize useToast hook

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

  return (
    <div>
      {transactionDetails.map((transaction) => (
        <div
          key={transaction.transactionId}
          className="w-[100%] h-[auto] mt-4 rounded-2xl bg-[#fff]  pl-5  pt-4  pb-4  pr-5"
        >
          <div className="flex  text-[17px] items-center justify-between">
            <h3 className="text-[14px]">
              {" "}
              <span className="font-bold text-[16px]">User Name:</span>{" "}
              {transaction.paymentName}{" "}
            </h3>
            <h4 className="flex font-bold  items-center">
              <span className="">
                <PiCurrencyNgnDuotone />
              </span>{" "}
              {transaction.paymentAmount}
            </h4>
          </div>
          {/* <div>Product Description: {transaction.paymentDscription}</div> */}
          <div>
            <p className="text-[14px] mt-1">
              <span className="font-[600] text-[16px]">
                Product Description{" "}
              </span>{" "}
              {transaction.paymentDscription}
            </p>
          </div>
          <div>
            <p className="text-[14px] mt-1">
              <span className="font-[600] text-[16px]">Email: </span>{" "}
              {transaction.email}
            </p>
            <p className="text-[14px] mt-1">
              <span className="font-[600] text-[16px]">Bank Name: </span>{" "}
              {transaction.paymentBank}
            </p>
            <p className="text-[14px] mt-1">
              <span className="font-[600] text-[16px]">Bank Number: </span>{" "}
              {transaction.paymentAccountNumber}
            </p>
            <p className="text-[14px] mt-1">
              <span className="font-[600] text-[16px]">
                Selected User Type:{" "}
              </span>{" "}
              {transaction.selectedUserType}
            </p>
            <p className="text-[14px] mt-1">
              <span className="font-[600] text-[16px]">
                Selected User Type:{" "}
              </span>{" "}
              {transaction.willUseCourier ? "Yes" : "No"}
            </p>
            <div className="flex items-center ">
              <p className="text-[14px]">
                <span className="font-[600] text-[16px]">Transaction Id: </span>{" "}
                {transaction.transactionId}{" "}
              </p>
              <div className="relative">
                <button
                  className="ml-3 border-2  border-[#0F1A2E] pl-4 pr-4  pt-1 pb-1 rounded-xl text-[12px]"
                  onClick={() => copyToClipboard(transaction.transactionId)}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
          <div className="flex mt-6  items-center justify-between">
            <h5 className="text-[14px]">
              {/* {new Date(transaction.createdAt).toLocaleDateString()} */}
              {formatCreatedAt(transaction.createdAt)}
            </h5>
            <div className="flex items-center ">
              {transaction.status === "active" && (
                <>
                  <button
                    onClick={() => onCancel(transaction.transactionId)}
                    className="pl-5 pr-5 text-[14px] pt-2 pb-2 rounded-xl  bg-[#6149FA] text-[#fff]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onComplete(transaction.transactionId)}
                    className="ml-3 pl-5 pr-5 text-[14px] pt-2 pb-2 rounded-xl  bg-[#6149FA] text-[#fff]"
                  >
                    Done
                  </button>
                </>
              )}

              {/* Render Cancel and Done buttons only if the user is a participant and the transaction status is active */}
            </div>
          </div>
          <div className="text-[14px]">Status: {transaction.status}</div> {/* Add this line */}
        </div>
      ))}
    </div>
  );
};

export default AllTransactionCompleted;
