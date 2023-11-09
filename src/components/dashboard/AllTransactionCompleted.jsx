import React, { useState } from "react";
import { PiCurrencyNgnDuotone } from "react-icons/pi";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { useToast } from "@chakra-ui/react";
import { formatCreatedAt } from "../../utility/DateTimeStramp";
import "./AllTransactionCompleted.css";

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
            <h4 className="flex font-bold  items-center">
              <span className="">
                <PiCurrencyNgnDuotone />
              </span>{" "}
              {transaction.paymentAmount}
            </h4>
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
                  >
                    Done
                  </button>
                </>
              )}

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
