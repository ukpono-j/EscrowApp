import React, { useEffect, useState } from "react";
import { FaShoppingCart, FaCheck, FaTimes, FaStore } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PaystackPop from "@paystack/inline-js";
import { useToast } from "@chakra-ui/react";
const BASE_URL = import.meta.env.VITE_BASE_URL ;
import "./NewTransaction.css";


const NewTransaction = () => {
  const [step, setStep] = useState(1); // Track the current step
  const [nextButtonActive, setNextButtonActive] = useState(false); // Track the next button's active state
  const navigate = useNavigate();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentBank, setPaymentBank] = useState("");
  const [paymentAccountNumber, setPaymentAccountNumber] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [paymentDscription, setPaymentDscription] = useState("");
  const [email, setEmail] = useState("");
  const [selectedUserType, setSelectedUserType] = useState(""); // Track selected user type
  const [willUseCourier, setWillUseCourier] = useState(false);
  const toast = useToast();

  const paywithpaystack = (e) => {
    e.preventDefault();

    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: "pk_test_510517e6c4bcd95b12a073078d57b139164845d8",
      amount: paymentAmount * 100, // Convert to kobo if dealing with Naira
      paymentName: paymentName,
      paymentDscription: paymentDscription,
      email: email,
      paymentAccountNumber: paymentAccountNumber,
      paymentBank: paymentBank,
      onSuccess(transaction) {
        let message = `payment complete! Reference ${transaction.reference}`;
        //  alert(message)
        setEmail("");
        setPaymentDscription("");
        setPaymentAmount("");
        setPaymentName("");
        setPaymentBank("");
        setPaymentAccountNumber("");
        navigate("/transactions/tab");

        // Create a new notification object
        const newNotification = {
          title: "New Transaction Created",
          message: `A ${selectedUserType} made a  Payment of ${paymentAmount} received for ${paymentDscription}. Reference: ${paymentName}`,
          transactionId: "just for test"
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
            // Navigate to the transactions page or handle success as needed
            navigate("/transactions/tab");
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
    // Assuming you're sending paymentName, email, paymentAmount, and paymentDscription from state
    const requestData = {
      paymentName,
      email,
      paymentAmount,
      paymentDscription,
      selectedUserType,
      willUseCourier,
      paymentBank,
      paymentAccountNumber,
    };

    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    // Make an API request to initiate the transaction
    axios
      .post(`${BASE_URL}/create-transaction`, requestData, {
        headers: {
          "auth-token": token,
        },
      })
      .then((response) => {
        console.log(response.data);
        // this is a  token  to show successful  transaction
        toast({
          title: "Successfully created a transaction",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      })
      .catch((error) => {
        console.error(error);
        console.log(requestData);
        // Handle error, for example, display an error message to the user
        toast({
          title: "Error occured during transaction",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      });
  };

  const form = new FormData();
  form.append("name", paymentName);
  form.append("amount", paymentAmount);
  form.append("description", paymentDscription);

  // Function to handle radio button click
  const handleRadioClick = (userType) => {
    console.log("Selected User Type:", userType);
    setSelectedUserType(userType);
    setNextButtonActive(true); // Activate the next button
  };

  // Function to handle radio button click for courier service (yes/no)
  const handleCourierOptionClick = (option) => {
    setWillUseCourier(option === "yes"); // Set willUseCourier state based on the selected option
    console.log("Selected Courier:", option);
    setNextButtonActive(true);
  };

  // Function to handle "Next" button click
  const handleNextClick = () => {
    if (selectedUserType && step < 3) {
      setStep(step + 1); // Increment the step
      // setSelectedUserType(""); // Reset selectedUserType
      setNextButtonActive(false); // Deactivate the next button
    }
  };

  // Function to handle "Previous" button click
  const handlePreviousClick = () => {
    if (step > 1) {
      setStep(step - 1); // Decrement the step
      setSelectedUserType(""); // Reset selectedUserType
    }
  };

  // Function to determine the active color
  const getActiveColor = (number) => {
    return step >= number ? "#0F0821" : "#CECECE";
  };

  // Array of titles for each step
  const stepTitles = [
    "I'm a",
    "Will you be using post/courier for this transaction?",
    "Payment Details",
  ];

  return (
    <div className="font-[Poppins] bg-[#072534] min-h-[100vh] text-[#E4E4E4]   pt-14 md:pr-14 pr-10 pl-10  mt-10  md:pl-14 pb-20 ">
      <h1 className="text-[33px] font-bold join text-center md:text-start">Create Transaction</h1>
      <form className="h-[auto] flex items-center flex-col justify-center mt-20 w-[100%]">
        <div className="h-[35px] flex items-center justify-between w-[300px]">
          {[1, 2, 3].map((number) => (
            <div
              key={number}
              className={`border onActive bg-[#fff] text-[#031420] font-bold  border-2  border-[#81712E] w-[33px] h-[33px]  rounded-full flex items-center justify-center text-[13px]`}
              style={{ borderColor: getActiveColor(number) }}
            >
              {number}
            </div>
          ))}
          <div className="h-[2px] w-[300px]  bg-[#CECECE] absolute z-[-1]"></div>
        </div>
        <h3 className="pt-32 text-[30px] text-center   font-bold pb-7 title">
          {stepTitles[step - 1]}
        </h3>
        {[1, 2, 3].map((number) => (
          <div
            key={number}
            className={`flex items-center justify-center ${
              step === number ? "default" : "hidden"
            }`}
          >
            {number === 2 ? (
              <div className="sm:flex items-center p-3 ">
                <div
        className={`pl-10 shadow-xl hover:border-[#0F0821] bg-[#031420]  hover.borderWidth-2 max-w-[250px] pr-14  m-3 h-[100px] flex items-center rounded-2xl`}
                  style={{ borderColor: getActiveColor(number) }}
                >
                  <input
                    type="radio"
                    className="h-[20px] w-[20px]"
                    name={`userType${number}`}
                    id={`yes${number}`}
                    onClick={() => {
                      handleCourierOptionClick("yes");
                      document
                        .getElementById(`nextButton`)
                        .classList.add("enabled");
                    }}
                  />
                  <div className="flex items-center pl-6">
                    <span className="text-[#81712E] text-[30px]">
                      <FaCheck />
                    </span>
                    <h5 className="pl-4">Yes</h5>
                  </div>
                </div>
                <div
               className={`pl-10 shadow-xl hover:border-[#0F0821] bg-[#031420]  hover.borderWidth-2 max-w-[250px] pr-14  m-3 h-[100px] flex items-center rounded-2xl`}
                  style={{ borderColor: getActiveColor(number) }}
                >
                  <input
                    type="radio"
                    className="h-[20px] w-[20px]"
                    name={`userType${number}`}
                    id={`no${number}`}
                    onClick={() => {
                      handleCourierOptionClick("no");
                      document
                        .getElementById(`nextButton`)
                        .classList.add("enabled");
                    }}
                  />
                  <div className="flex items-center pl-6">
                    <span className="text-[#81712E] text-[30px]">
                      <FaTimes />
                    </span>
                    <h5 className="pl-4">No</h5>
                  </div>
                </div>
              </div>
            ) : step === 3 ? ( // Show a form for step 3
              // ====================================
              // ------------------------------ payment component
              <div className="w-[550px] m-3  ">
                <div>
                  <div className="mb-4">
                    <label
                      htmlFor="paymentName"
                      className="block text-[13px] font-bold  text-[#fff] mb-2"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="paymentName"
                      name="paymentName"
                      onChange={(e) => setPaymentName(e.target.value)}
                      value={paymentName}
                      className="border-2  border-[#81712E] bg-[#031420] rounded-[30px] text-[12px] pl-4 pr-3 pt-2 pb-2  outline-none  w-full"
                      placeholder="Enter Payment Name"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="email"
                      className="block text-[13px] font-bold  text-[#fff] mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      type="text"
                      id="email"
                      name="email"
                      onChange={(e) => setEmail(e.target.value)}
                      value={email}
                      className="border-2  border-[#81712E] bg-[#031420] rounded-[30px] text-[12px] pl-4 pr-3 pt-2 pb-2  outline-none mb-2  w-full"
                      placeholder="Enter Email Address"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="paymentAmount"
                      className="block text-[13px] font-bold  text-[#fff] mb-2"
                    >
                      Payment Amount
                    </label>
                    <input
                      type="number"
                      id="paymentAmount"
                      name="paymentAmount"
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      value={paymentAmount}
                      className="border-2  border-[#81712E] bg-[#031420] rounded-[30px] text-[12px] pl-4 pr-3 pt-2 pb-2  outline-none mb-2  w-full"
                      placeholder="Enter payment amount"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="paymentAmount"
                      className="block text-[13px] font-bold  text-[#fff] mb-2"
                    >
                      Bank Name
                    </label>
                    <input
                      type="text"
                      id="paymentBank"
                      name="paymentBank"
                      onChange={(e) => setPaymentBank(e.target.value)}
                      value={paymentBank}
                      className="border-2  border-[#81712E] bg-[#031420] rounded-[30px] text-[12px] pl-4 pr-3 pt-2 pb-2  outline-none mb-2  w-full"
                      placeholder="Enter payment bank"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="paymentAmount"
                      className="block text-[13px] font-bold  text-[#fff] mb-2"
                    >
                      Bank Number
                    </label>
                    <input
                      type="number"
                      id="paymentAccountNumber"
                      name="paymentAccountNumber"
                      onChange={(e) => setPaymentAccountNumber(e.target.value)}
                      value={paymentAccountNumber}
                      className="border-2  border-[#81712E] bg-[#031420] rounded-[30px] text-[12px] pl-4 pr-3 pt-2 pb-2  outline-none mb-2  w-full"
                      placeholder="Enter payment number"
                    />
                  </div>
                  <div className="mb-5 mt-5 ">
                    <label
                      htmlFor="paymentDscription"
                      className="block text-[13px] font-bold  text-[#fff] mb-2"
                    >
                      Payment Description
                    </label>
                    <textarea
                      name=""
                      id="paymentDscription"
                      onChange={(e) => setPaymentDscription(e.target.value)}
                      value={paymentDscription}
                      className="border-2  border-[#81712E] h-[100px] bg-[#031420] rounded-[30px]  text-[12px] pl-4 pr-3 pt-2 pb-2  outline-none mb-2  w-full"
                      placeholder="Payment Description"
                    ></textarea>
                  </div>
                  <div className="text-center">
                    <button
                      type="submit"
                      onClick={paywithpaystack}
                      className=" rounded-full  text-white text-[13px] font-bold py-2  px-7   bg-[#81712E] border-2  border-[#81712E] all_btn   hover:border-2  hover:border-[#81712E]  hover:bg-[transparent]"
                    >
                      Start Transaction
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sm:flex items-center">
                <div
                  className={`pl-10 shadow-xl hover:border-[#0F0821] bg-[#031420]  hover.borderWidth-2 max-w-[250px] pr-14  m-3 h-[100px] flex items-center rounded-2xl`}
                  style={{ borderColor: getActiveColor(number) }}
                >
                  <input
                    type="radio"
                    className="h-[20px] w-[20px]"
                    // name={`userType${number}`}
                    name="userType"
                    id="buyer"
                    // id={`buyer${number}`}
                    onClick={() => {
                      // handleRadioClick(`buyer${number}`);
                      handleRadioClick(`buyer`);
                      document
                        .getElementById(`nextButton`)
                        .classList.add("enabled");
                    }}
                  />
                  <div className="flex items-center pl-3">
                    <span className="text-[#81712E] text-[30px]">
                      <FaShoppingCart />
                    </span>
                    <h5 className="pl-4">Buyer</h5>
                  </div>
                </div>
                <div
                  className={`pl-10 shadow-xl hover:border-[#0F0821] bg-[#031420]   hover.borderWidth-2 max-w-[250px] pr-14  m-3 h-[100px] flex items-center rounded-2xl`}
                  style={{ borderColor: getActiveColor(number) }}
                >
                  <input
                    type="radio"
                    className="h-[20px] w-[20px]"
                    // name={`userType${number}`}
                    // id={`seller${number}`}
                    name="userType"
                    id="seller"
                    onClick={() => {
                      handleRadioClick(`seller`);
                      document
                        .getElementById(`nextButton`)
                        .classList.add("enabled");
                    }}
                  />
                  <div className="flex items-center pl-3">
                    <span className="text-[#81712E] text-[30px]">
                      <FaStore />
                    </span>
                    <h5 className="pl-4">Seller</h5>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {[1, 2, 3].map((number) => (
          <div
            key={number}
            className={`flex items-center justify-center ${
              step === number ? "default" : "hidden"
            }`}
          >
            {/* Content for steps 1, 2, and 3 */}
            {/* <p>
              Step {number}: Content for step {number} goes here.
            </p> */}
          </div>
        ))}
        <div className="flex mt-24 space-x-4">
          <button
            className={`border-2  border-[#81712E]   rounded-3xl h-[38px] font-bold w-[130px] ${
              step === 1 ? "hidden" : ""
            }`}
            onClick={handlePreviousClick}
          >
            Previous
          </button>
          <button
            id="nextButton"
            className={`border-2  border-[#81712E]  rounded-3xl h-[38px] font-bold w-[130px] ${
              step === 3 ? "hidden" : ""
            } ${nextButtonActive ? "text-[#fff] border-black" : ""}`}
            onClick={handleNextClick}
            disabled={!nextButtonActive}
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTransaction;
