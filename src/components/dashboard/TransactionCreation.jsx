import React, { useEffect, useState } from "react";
import { FaShoppingCart, FaCheck, FaTimes, FaStore } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PaystackPop from "@paystack/inline-js";
import { useToast } from "@chakra-ui/react";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import "./NewTransaction.css";
import { MdClose } from "react-icons/md";
import defaultProfileImage from '../../assets/profile_icon.png';

const TransactionCreation = () => {
  const [step, setStep] = useState(1); // Track the current step
  const [nextButtonActive, setNextButtonActive] = useState(false); // Track the next button's active state
  const navigate = useNavigate();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentBank, setPaymentBank] = useState("");
  const [paymentAccountNumber, setPaymentAccountNumber] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [email, setEmail] = useState("");
  const [selectedUserType, setSelectedUserType] = useState(""); // Track selected user type
  const [willUseCourier, setWillUseCourier] = useState(false);
  const toast = useToast();
  const [acceptTransactionModel, setAcceptTransactionModel] = useState(false)
  const [profileImage, setProfileImage] = useState(null);
  const [errors, setErrors] = useState([]);
  const [userDetails, setUserDetails] = useState({});



  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = localStorage.getItem("auth-token");
      if (token) {
        axios.defaults.headers.common["auth-token"] = token;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/users/user-details`, {
          headers: {
            "auth-token": token,
          },
        });
        setUserDetails(response.data);
        console.log("User details profile fetched:", response.data); // Log the user details
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, []);

  // // Example function to fetch profile image from database
  // const fetchProfileImage = () => {
  //   // Simulate fetching profile image from database
  //   const fetchedImage = ''; // Replace with actual logic to fetch image URL from database
  //   if (fetchedImage) {
  //     setProfileImage(fetchedImage);
  //   } else {
  //     // Set default profile image if no image fetched
  //     setProfileImage(defaultProfileImage);
  //   }
  // };

  // Call fetchProfileImage when modal opens (acceptTransactionModel is true)
  // useEffect(() => {
  //   if (acceptTransactionModel) {
  //     fetchProfileImage();
  //   }
  // }, [acceptTransactionModel]);



  // Calculate the transaction fee and total amount
  const transactionFee = (paymentAmount * 0.008).toFixed(2);
  const totalAmount = (parseFloat(paymentAmount) + parseFloat(transactionFee)).toFixed(2);




  const acceptTransactionFunction = (e) => {
    e.preventDefault();
    setAcceptTransactionModel(true)
  }

  const createNewTransaction = (e) => {
    e.preventDefault();

    // const paystack = new PaystackPop();
    // paystack.newTransaction({
    //   key: "pk_test_510517e6c4bcd95b12a073078d57b139164845d8",
    //   amount: paymentAmount * 100, // Convert to kobo if dealing with Naira
    //   paymentName: paymentName,
    //   paymentDescription: paymentDescription,
    //   email: email,
    //   paymentAccountNumber: paymentAccountNumber,
    //   paymentBank: paymentBank,
    //   onSuccess(transaction) {
    //     let message = `payment complete! Reference ${transaction.reference}`;
    //     //  alert(message)
    //     setEmail("");
    //     setPaymentDescription("");
    //     setPaymentAmount("");
    //     setPaymentName("");
    //     setPaymentBank("");
    //     setPaymentAccountNumber("");
    //     navigate("/transactions/tab");

    //     // Create a new notification object
    //     const newNotification = {
    //       title: "New Transaction Created",
    //       message: `A ${selectedUserType} made a  Payment of ${paymentAmount} received for ${paymentDscription}. Reference: ${paymentName}`,
    //       transactionId: "just for test"
    //     };
    //     // Make an API request to create the notification
    //     axios
    //       .post(`${BASE_URL}/api/notifications/notifications`, newNotification, {
    //         headers: {
    //           "auth-token": token,
    //         },
    //       })
    //       .then((notificationResponse) => {
    //         console.log("Notification created:", notificationResponse.data);
    //         // Navigate to the transactions page or handle success as needed
    //         navigate("/transactions/tab");
    //       })
    //       .catch((notificationError) => {
    //         console.error("Error creating notification:", notificationError);
    //         // Handle error creating notification if needed
    //       });
    //   },
    //   oncancel() {
    //     alert("You have canceled the transaction");
    //   },
    //   // ref: "unique_transaction_reference",
    //   callback: function (response) {
    //     // Handle Paystack response here
    //     console.log(response);
    //   },
    //   onClose: function () {
    //     // Handle transaction close event
    //     console.log("Transaction closed.");
    //   },
    // });
    // Assuming you're sending paymentName, email, paymentAmount, and paymentDscription from state

    const requestData = {
      paymentName,
      email,
      paymentAmount: totalAmount,
      paymentDescription,
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
      .post(`${BASE_URL}/api/transactions/create-transaction`, requestData, {
        headers: {
          "auth-token": token,
        },
      })
      .then((response) => {
        console.log(response.data);
        // Extract the transactionId from the response
        const transactionId = response.data.transactionId;
        // this is a  token  to show successful  transaction
        toast({
          title: "Successfully created a transaction",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        navigate("/transactions/tab");
      })
      .catch((error) => {
        console.error(error);
        console.log(requestData);
        if (error.response && error.response.data && error.response.data.errors) {
          setErrors(error.response.data.errors);
        } else {
          toast({
            title: "Error occurred during transaction",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
        // Handle error, for example, display an error message to the user
        toast({
          title: "Error occured during transaction",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      });
  };

  // accept 

  const form = new FormData();
  form.append("name", paymentName);
  form.append("amount", paymentAmount);
  form.append("description", paymentDescription);

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
    <div className="font-[Poppins] bg-[#1A1E21] min-h-[100vh] text-[#E4E4E4] relative   pt-14 md:pr-14 pr-10 pl-10  mt-10  md:pl-14 pb-20 ">
      <h1 className="text-[33px] font-bold text-center md:text-start">Create Transaction</h1>
      {acceptTransactionModel && (
        <div className="fixed inset-0 pl-4 pr-4 pt-8 pb-8 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="bg-[#28313A] text-[white] text-[13px] p-6 rounded-lg w-96">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-[18px] font-bold text-center">Accept Escrow Transaction</h2>
                {/* <p className=" text-center text-xl font-bold">Transaction</p> */}
              </div>
              <button
                className="text-[24px] font-bold"
                onClick={() => setAcceptTransactionModel(false)}
              >
                <MdClose />
              </button>
            </div>
            <div className="flex items-center mt-4">
              <div className="h-[40px] w-[40px] flex items-center justify-center rounded-[100%]">
                {/* {profileImage ? (
                  <img src={profileImage} alt="Profile Icon" className="h-[40px] w-[40px] rounded-full" />
                ) : (
                  <img src={defaultProfileImage} alt="Default Profile Icon" className="h-[40px] w-[100%] bg-cover bg-center rounded-full" />
                )} */}
                   <img
                    src={
                      userDetails.userId === userDetails._id
                        ? userDetails.avatarImage
                          ? `${BASE_URL}/${userDetails.avatarImage}`
                          : defaultProfileImage
                        : userDetails.avatarImage
                          ? `${BASE_URL}/${userDetails.avatarImage}`
                          : defaultProfileImage
                    }
                    alt="Avatar"
                    onError={(e) => { e.target.onerror = null; e.target.src = DefaultProfile; }}
                    className="w-full h-full bg-cover rounded-full"
                  />
              </div>
              <div className="p-2">
                <p><strong>Name:</strong> {paymentName}</p>
                <p><strong>Amount:</strong> {paymentAmount}</p>
              </div>
            </div>
            <p className="mt-2">You are about to accept the escrow transaction. Make sure you understand the terms before proceeding.</p>
            <h3 className="mt-4 font-bold text-[14px]">Terms</h3>
            <div className="flex justify-between text-[12px] mt-3 items-center">
              <p className="font-bold">Payment Method</p>
              <p className="text-end">Wire Transfer</p>
            </div>
            <div className="flex justify-between text-[12px] mt-3 items-center">
              <p className="font-bold">Transaction Amount</p>
              <p className="text-end">{paymentAmount}</p>
            </div>
            <div className="flex justify-between text-[12px] mt-3 items-center">
              <p className="font-bold">Transaction Fee</p>
              <p className="text-end">0.8%</p>
            </div>
            <div className="flex justify-between mt-3 items-center">
              <p><strong>Bank:</strong> </p>
              <p>{paymentBank}</p>
            </div>
            <div className="flex justify-between mt-3 items-center">
              <p><strong>Account Number:</strong></p>
              <p> {paymentAccountNumber}</p>
            </div>
            <div className="flex justify-between items-center text-[12px] mt-3">
              <p className="font-bold text-[13px]">Total Amount</p>
              <p className="text-end">{totalAmount} Naira</p>
            </div>
            {/* <p><strong>Email:</strong> {email}</p>
            <p><strong>Description:</strong> {paymentDescription}</p> */}

            <button
              className="mt-4 px-4 py-2 bg-[#318AE6] w-[100%] text-white rounded-2xl"
              onClick={(e) => {
                setAcceptTransactionModel(false);
                createNewTransaction(e);
              }}
            >
              Accept
            </button>

          </div>
        </div>
      )}
      <form className="h-[auto] flex items-center flex-col justify-center mt-20 w-[100%]">
        <div className="h-[35px] flex items-center  justify-between w-[200px] sm:w-[300px]">
          {[1, 2, 3].map((number) => (
            <div
              key={number}
              className={`onActive bg-[#fff] text-[#031420] font-bold w-[33px] h-[33px]  rounded-full flex items-center justify-center text-[13px]`}
              style={{ borderColor: getActiveColor(number) }}
            >
              {number}
            </div>
          ))}
          <div className="h-[2px] w-[300px]  bg-[#CECECE] absolute z-[-1]"></div>
        </div>
        <h3 className="pt-32 text-[30px] text-center font-bold pb-7">
          {stepTitles[step - 1]}
        </h3>
        {[1, 2, 3].map((number) => (
          <div
            key={number}
            className={`flex items-center justify-center ${step === number ? "default" : "hidden"
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
                    <span className="text-[#318AE6] text-[30px]">
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
                    <span className="text-[#318AE6] text-[30px]">
                      <FaTimes />
                    </span>
                    <h5 className="pl-4">No</h5>
                  </div>
                </div>
              </div>
            ) : step === 3 ? ( // Show a form for step 3
              // ====================================
              // ------------------------------ payment component
              <div className="md:w-[550px] w-[100%] m-3  ">
                <div className="w-[100vw] md:w-[100%] pl-6 pr-6 ">
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
                      className="border-2  border-[#318AE6] bg-[#031420] rounded-[30px] text-[12px] pl-4 pr-3 pt-2 pb-2  outline-none  w-full"
                      placeholder="Enter Payment Name"
                      autoComplete="on"
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
                      className="border-2  border-[#318AE6] bg-[#031420] rounded-[30px] text-[12px] pl-4 pr-3 pt-2 pb-2  outline-none mb-2  w-full"
                      placeholder="Enter Email Address"
                      autoComplete="on"
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
                      className="border-2  border-[#318AE6] bg-[#031420] rounded-[30px] text-[12px] pl-4 pr-3 pt-2 pb-2  outline-none mb-2  w-full"
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
                      className="border-2  border-[#318AE6] bg-[#031420] rounded-[30px] text-[12px] pl-4 pr-3 pt-2 pb-2  outline-none mb-2  w-full"
                      placeholder="Enter payment bank"
                      autoComplete="on"
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
                      className="border-2  border-[#318AE6] bg-[#031420] rounded-[30px] text-[12px] pl-4 pr-3 pt-2 pb-2  outline-none mb-2  w-full"
                      placeholder="Enter payment number"
                      autoComplete="on"
                    />
                  </div>
                  <div className="mb-5 mt-5 ">
                    <label
                      htmlFor="paymentDescription"
                      className="block text-[13px] font-bold  text-[#fff] mb-2"
                    >
                      Payment Description
                    </label>
                    <textarea
                      name=""
                      id="paymentDescription"
                      onChange={(e) => setPaymentDescription(e.target.value)}
                      value={paymentDescription}
                      className="border-2  border-[#318AE6] h-[100px] bg-[#031420] rounded-[30px]  text-[12px] pl-4 pr-3 pt-2 pb-2  outline-none mb-2  w-full"
                      placeholder="Payment Description"
                    ></textarea>
                  </div>
                  {/* ============= Modifying the create transaction, by adding a popup =================== */}
                  <div className="text-center">
                    <button
                      type="submit"
                      // onClick={createNewTransaction}
                      onClick={acceptTransactionFunction}
                      className=" rounded-full  text-white text-[13px] font-bold py-2  px-7   bg-[#318AE6] border-2  border-[#318AE6] all_btn   hover:border-2  hover:border-[#318AE6]  hover:bg-[transparent]"
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
                    <span className="text-[#318AE6] text-[30px]">
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
                    <span className="text-[#318AE6] text-[30px]">
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
            className={`flex items-center justify-center ${step === number ? "default" : "hidden"
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
            className={`border-2  border-[#318AE6]   rounded-3xl h-[38px] font-bold w-[130px] ${step === 1 ? "hidden" : ""
              }`}
            onClick={handlePreviousClick}
          >
            Previous
          </button>
          <button
            id="nextButton"
            className={`border-2  border-[#318AE6]  rounded-3xl h-[38px] font-bold w-[130px] ${step === 3 ? "hidden" : ""
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

export default TransactionCreation;
