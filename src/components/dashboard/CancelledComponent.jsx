import React, { useState } from "react";
import { PiCurrencyNgnDuotone } from "react-icons/pi";
import { useToast } from "@chakra-ui/react";
import {formatCreatedAt } from "../../utility/DateTimeStramp"


const CancelledComponent = ({ cancelledTransactions }) => {
  const [copied, setCopied] = useState(false);
  const toast = useToast(); // Initialize useToast hook

  if (
    !Array.isArray(cancelledTransactions) ||
    cancelledTransactions.length === 0
  ) {
    return <p>Loading now.....</p>;
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

  return (
    <div>
      {cancelledTransactions.map((transaction) => (
        <div
        key={transaction.transactionId}
        className="w-[100%] h-[auto] mt-4 rounded-2xl bg-[#031420]  pl-5  pt-4  pb-4  pr-5"
      >
        <div className="flex  text-[17px] items-center justify-between">
          <h3 className="text-[13px]">
            {" "}
            <span className="font-bold text-[15px]">User Name:</span>{" "}
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
          <p className="text-[13px] mt-1">
            <span className="font-[600] text-[15px]">
              Product Description : {" "}
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
              Selected User Type:{" "}
            </span>{" "}
            {transaction.selectedUserType}
          </p>
          <p className="text-[13px] mt-1">
            <span className="font-[600] text-[15px]">
              Selected User Type:{" "}
            </span>{" "}
            {transaction.willUseCourier ? "Yes" : "No"}
          </p>
          <div className="flex items-center ">
            <p className="text-[13px]">
              <span className="font-[600] text-[15px]">Transaction Id: </span>{" "}
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
        <div className="mt-3">
        <h5 className="text-[13px]">
          {/* {new Date(transaction.createdAt).toLocaleDateString()} */}
          {formatCreatedAt(transaction.createdAt)}
        </h5>
        <div className="text-[13px]">Status: {transaction.status}</div>{" "}
        </div>
        {/* Add this line */}
      </div>
      ))}
    </div>
  );
};

export default CancelledComponent;
