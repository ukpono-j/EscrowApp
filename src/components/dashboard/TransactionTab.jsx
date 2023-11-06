import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import MyTransaction from "./MyTransaction";
import Profile from "./Profile";
import BottomNav from "./BottomNav";
import MainJoinTransaction from "./MainJoinTransaction";
import { FiSearch } from "react-icons/fi";
import CancelledComponent from "./CancelledComponent";
import AllTransactionCompleted from "./AllTransactionCompleted";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL ;
import { useToast } from "@chakra-ui/react";
import CompletedComponent from "./CompletedComponent";
import MiniNav from "./MiniNav";

const TransactionTab = ({ userResponse }) => {
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [active, setActive] = useState(true);
  const [cancelled, setCancelled] = useState(false);
  const [all, setAll] = useState(true);
  const [inputRequired, setInputRequired] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState([]);
  const [joinedTransactions, setJoinedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelledTransactions, setCancelledTransactions] = useState([]);
  const [completedTransactions, setCompletedTransactions] = useState([]);
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // UseEffect for create transaction
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    // Fetch transaction details from API and update the state
    axios
      .get(`${BASE_URL}/create-transaction`, {
        headers: {
          "auth-token": token,
        },
      })
      .then((response) => {
        setTransactionDetails(response.data);
      });
  }, []);

  // useEffect for cancel transaction
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    // Fetch transaction details from API and update the state
    axios
      .get(`${BASE_URL}/cancel-transactions`, {
        headers: {
          "auth-token": token,
        },
      })
      .then((response) => {
        console.log("Cancelled Transactions Response:", response.data); // Log the response
        setCancelledTransactions(response.data);
        setLoading(false); // Set loading to false after data is fetched
      })
      .catch((error) => {
        console.error("Error fetching cancelled transactions:", error);
        setLoading(false); // Set loading to false after data is fetched
      });
  }, []);

  // useEffect for completed  transaction
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    // Fetch transaction details from API and update the state
    axios
      .get(`${BASE_URL}/complete-transaction`, {
        headers: {
          "auth-token": token,
        },
      })
      .then((response) => {
        console.log("Completed Transactions Response:", response.data); // Log the response
        setCompletedTransactions(response.data);
        setLoading(false); // Set loading to false after data is fetched
      })
      .catch((error) => {
        console.error("Error fetching Completed  transactions:", error);
        setLoading(false); // Set loading to false after data is fetched
      });
  }, []);

  // Fetch data from the API and update state
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/create-transaction`);
        setTransactionDetails(response.data);
        // Fetch completed transactions
        const completedResponse = await axios.get(
          `${BASE_URL}/complete-transaction`
        );
        setCompletedTransactions(completedResponse.data);
        // Fetch cancelled transactions
        const cancelledResponse = await axios.get(
          `${BASE_URL}/cancel-transactions`
        );
        setCancelledTransactions(cancelledResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Filter transactions based on search query
  const filteredTransactionDetails = transactionDetails.filter(
    (transaction) => {
      const searchTerm = searchQuery.toLowerCase();
      return (
        transaction.paymentName.toLowerCase().includes(searchTerm) ||
        transaction.email.toLowerCase().includes(searchTerm)
      );
    }
  );

  // useEffect(
  //   (transactionId) => {
  //     if (userResponse) {
  //       // Call the sendCancellationNotification function when userResponse changes
  //       sendCancellationNotification(transactionId, userResponse);
  //     }
  //   },
  //   [userResponse]
  // );

  // const sendCancellationNotification = (transactionId, transactionDetails) => {
  //   const token = localStorage.getItem("auth-token");
  //   if (token) {
  //     axios.defaults.headers.common["auth-token"] = token;
  //   }

  //   // Fetch transaction details from the server
  //   axios
  //     .get(`${BASE_URL}/create-transaction/`, {
  //       headers: {
  //         "auth-token": token,
  //       },
  //     })
  //     .then((response) => {
  //       // Get transaction details from the response
  //       const fetchedTransactionDetails = response.data;

  //       // Find the transaction details for the specific transactionId
  //       const foundTransaction = fetchedTransactionDetails.find(
  //         (transaction) => transaction.transactionId === transactionId
  //       );

  //       if (foundTransaction) {
  //         const {
  //           paymentAmount,
  //           selectedUserType,
  //           paymentDscription,
  //           paymentName,
  //         } = foundTransaction;

  //         // Create a custom notification message with the specific details
  //         // const notificationMessage = `A ${selectedUserType} made a payment of ${paymentAmount} received for ${paymentDscription}. Reference: ${paymentName}`;
  //         const notificationMessage = `A ${selectedUserType}  ${paymentName} has decide cancel this transaction (${paymentDscription}) with the amount of ${paymentAmount}  `;

  //         // Create a new notification object with dynamic data
  //         const newNotificationVerification = {
  //           title: `Cancellation Notification for Transaction ${transactionId}`,
  //           message: notificationMessage,
  //           transactionId: transactionId,
  //           transactionDetails: foundTransaction, // Include the specific transaction details in the notification
  //         };

  //         // Send the notification to the server
  //         axios
  //           .post(
  //             `${BASE_URL}/verify-notifications`,
  //             newNotificationVerification,
  //             {
  //               headers: {
  //                 "auth-token": token,
  //               },
  //             }
  //           )
  //           .then((notificationResponse) => {
  //             console.log("Notification created:", notificationResponse.data);
  //             // Handle success if needed
  //           })
  //           .catch((notificationError) => {
  //             console.error("Error creating notification:", notificationError);
  //             // Handle error creating notification if needed
  //           });
  //       } else {
  //         console.error(`Transaction with ID ${transactionId} not found.`);
  //         // Handle the case where the transaction with the given ID is not found
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching transaction details:", error);
  //       // Handle error fetching transaction details if needed
  //     });
  // };

  // =========== handle Cancel
  // const handleCancel = (transactionId) => {
  //   const token = localStorage.getItem("auth-token");

  //   axios
  //     .post(
  //       `${BASE_URL}/cancel-transaction`,
  //       { transactionId: transactionId },
  //       {
  //         headers: {
  //           "auth-token": token,
  //         },
  //       }
  //     )
  //     .then((response) => {
  //       // After cancelling, update the server and fetch updated cancelled transactions
  //       axios
  //         .get(`${BASE_URL}/cancel-transactions`, {
  //           headers: {
  //             "auth-token": token,
  //           },
  //         })
  //         .then((cancelledTransactionsData) => {
  //           // Update cancelled transactions state with data from the server
  //           setCancelledTransactions(cancelledTransactionsData);
  //           toast({
  //             title: "Transaction Cancelled",
  //             status: "success",
  //             duration: 3000,
  //             isClosable: true,
  //           });

  //           // ======================= NotificationVerification Call

  //         })
  //         .catch((error) => {
  //           console.error(error);
  //           // Handle error, if any
  //         });
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //       // Handle error, if any
  //     });
  // };

  const handleCancel = (transactionId) => {
    const token = localStorage.getItem("auth-token");

    axios
      .post(
        `${BASE_URL}/cancel-transaction`,
        { transactionId: transactionId },
        {
          headers: {
            "auth-token": token,
          },
        }
      )
      .then((response) => {
        // After cancelling, update the server and fetch updated cancelled transactions
        axios
          .get(`${BASE_URL}/cancel-transactions`, {
            headers: {
              "auth-token": token,
            },
          })
          .then((cancelledTransactionsData) => {
            // Update cancelled transactions state with data from the server
            setCancelledTransactions(cancelledTransactionsData);
            toast({
              title: "Transaction Cancelled",
              status: "success",
              duration: 3000,
              isClosable: true,
            });

            // Get transaction details from the response
            const fetchedTransactionDetails = cancelledTransactionsData.data;

            // Find the transaction details for the specific transactionId
            const foundTransaction = fetchedTransactionDetails.find(
              (transaction) => transaction.transactionId === transactionId
            );

            if (foundTransaction) {
              const {
                paymentAmount,
                selectedUserType,
                paymentDscription,
                paymentName,
              } = foundTransaction;

              // Create a custom notification message with the specific details
              const notificationMessage = `A ${selectedUserType} ${paymentName} has decided to cancel this transaction (${paymentDscription}) with the amount of ${paymentAmount}`;

              // Create a new notification object with dynamic data
              const newNotification = {
                title: `Cancellation Notification for Transaction ${transactionId}`,
                message: notificationMessage,
                transactionId: transactionId,
                transactionDetails: foundTransaction, // Include the specific transaction details in the notification
              };

              // Send the notification to the server
              axios
                .post(`${BASE_URL}/notifications`, newNotification, {
                  headers: {
                    "auth-token": token,
                  },
                })
                .then((notificationResponse) => {
                  console.log(
                    "Notification created:",
                    notificationResponse.data
                  );
                  // Handle success if needed
                })
                .catch((notificationError) => {
                  console.error(
                    "Error creating notification:",
                    notificationError
                  );
                  // Handle error creating notification if needed
                });
            }
          })
          .catch((error) => {
            console.error(error);
            // Handle error, if any
          });
      })
      .catch((error) => {
        console.error(error);
        // Handle error, if any
      });
  };

  // =============== handle Complete
  const handleComplete = (transactionId) => {
    const token = localStorage.getItem("auth-token");
    axios
      .post(
        `${BASE_URL}/complete-transaction`,
        { transactionId: transactionId },
        {
          headers: {
            "auth-token": token,
          },
        }
      )
      .then((response) => {
        // After completing the transaction, update the server and fetch updated completed transactions
        axios
          .get(`${BASE_URL}/complete-transaction`, {
            headers: {
              "auth-token": token,
            },
          })
          .then((completedTransactionsData) => {
            // Update completed transactions state with data from the server
            setCompletedTransactions(completedTransactionsData);

            // Get transaction details from the response
            const fetchedTransactionDetails = completedTransactionsData.data;

            // Find the transaction details for the specific transactionId
            const foundTransaction = fetchedTransactionDetails.find(
              (transaction) => transaction.transactionId === transactionId
            );

            if (foundTransaction) {
              const {
                paymentAmount,
                selectedUserType,
                paymentDscription,
                paymentName,
              } = foundTransaction;

              // Create a custom notification message with the specific details
              const notificationMessage = `A ${selectedUserType} ${paymentName} has completed this transaction (${paymentDscription}) with the amount of ${paymentAmount}`;

              // Create a new notification object with dynamic data
              const newNotificationVerification = {
                title: `Completed Notification for Transaction ${transactionId}`,
                message: notificationMessage,
                transactionId: transactionId,
                transactionDetails: foundTransaction, // Include the specific transaction details in the notification
              };

              // Send the notification to the server
              axios
                .post(
                  `${BASE_URL}/notifications`,
                  newNotificationVerification,
                  {
                    headers: {
                      "auth-token": token,
                    },
                  }
                )
                .then((notificationResponse) => {
                  console.log(
                    "Notification created:",
                    notificationResponse.data
                  );
                  // Handle success if needed
                })
                .catch((notificationError) => {
                  console.error(
                    "Error creating notification:",
                    notificationError
                  );
                  // Handle error creating notification if needed
                });
            }

            toast({
              title: "Transaction Completed",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          })
          .catch((error) => {
            console.error(error);
            // Handle error, if any, while fetching completed transactions
          });
      })
      .catch((error) => {
        console.error(error);
        // Handle error, if any, while completing the transaction
      });
  };

  const handleShowProfile = () => {
    setShowToggleContainer(false);
    setShowProfile(true);
  };

  const handleMyTransaction = () => {
    setShowToggleContainer(true);
    setShowProfile(false);
  };

  const handleActiveTab = () => {
    setActive(true);
    setCancelled(false);
    setAll(true);
  };
  const handleCancelledTab = () => {
    setCancelled(true);
    setActive(false);
    setCompleted(false);
  };

  const handleAllToggle = () => {
    setAll(true);
    setInputRequired(false);
    setWaiting(false);
    setCompleted(false);
  };

  const handleCompletedToggle = () => {
    setAll(false);
    setInputRequired(false);
    setWaiting(false);
    setCompleted(true);
  };
  return (
    <div className="border flex items-center border-black">
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
      />
      <div
        style={{ overflowY: "scroll" }}
        className="layout bg-[#F4F5F5] fixed right-0 top-0 w-[100%]  md:w-[83.2%] h-[100vh]"
      >
        <div
          className={
            showToggleContainer ? "h-[auto] toggleContainer" : "hidden"
          }
        >
          <div>
            <MiniNav />
          </div>
          {/* <MainJoinTransaction/> */}
          <div className="font-[Poppins] pt-14 pr-14 mt-10  pl-14 pb-10">
            <h1 className="text-[30px]">My Transactions</h1>
            <div className="flex mt-4 mb-4  text-[14px]  items-center justify-between ">
              <div className=" max-w-[280px] border-b border-[grey]   h-[auto]">
                <button
                  // className=" w-[120px]  pb-1 pl-4 pr-4"
                  className={`cursor-pointer w-[120px]  pb-1 pl-4 pr-4  ${
                    active
                      ? "text-[#000] border-b-[3px]  h-[32px]  border-blue-500"
                      : ""
                  }`}
                  onClick={handleActiveTab}
                >
                  Active
                </button>
                <button
                  // className=" w-[120px] pb-1 pl-4 "
                  className={`cursor-pointer w-[120px] pb-1 pl-4 pr-4  ${
                    cancelled
                      ? "text-[#000] border-b-[3px]  h-[32px]  border-blue-500"
                      : ""
                  }`}
                  onClick={handleCancelledTab}
                >
                  Cancelled
                </button>
              </div>

              {/* ================= Search Feature ======= */}
              <div className="w-[300px] h-[auto] flex items-center ">
                <input
                  type="text"
                  placeholder="Search"
                  name=""
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-[20px]  w-[100%] bg-[transparent] border-black  border-b text-[13px] pb-2  outline-none"
                />
                <FiSearch className="text-[23px] ml-[-3px]" />
              </div>
            </div>
            {/* ========== Main Active Container ============= */}
            {active && (
              <div className="w-[100%] h-[auto]">
                {/* ============ ACTIVE TAB ============= */}
                <div className="">
                  <button
                    // className="pl-10 pr-10 text-[13px]"
                    className={`cursor-pointer pl-5  pr-5  text-[13px]${
                      all
                        ? "text-[#000] border-b-[2px]  h-[32px] text-[14px]  border-blue-500"
                        : ""
                    }`}
                    onClick={handleAllToggle}
                  >
                    All
                  </button>
                  <button
                    className={`cursor-pointer pl-5  pr-5  text-[13px]${
                      completed
                        ? "text-[#000] border-b-[2px] text-[14px]  h-[32px]  border-blue-500"
                        : ""
                    }`}
                    onClick={handleCompletedToggle}
                  >
                    Completed
                  </button>
                </div>
                {/* =========== POP MODEL FOR ACTIVE SUB CATEGORY======= */}

                <div className="w-[100%] h-[auto]">
                  {/* {transactionDetails.length === 0 ? (
                    <div className="text-center mt-5">No transactions yet.</div>
                  ) : all ? (
                    <div className="mt-5 h-[auto]">
                      <AllTransactionCompleted
                        transactionDetails={transactionDetails}
                        onCancel={handleCancel}
                        onComplete={handleComplete}
                      />
                    </div>
                  ) : null} */}

                  {all && (
                    <div className="w-[100%] mt-5  h-[auto]">
                      {loading ? (
                        <p>Loading...</p> // Show a loading indicator while data is being fetched
                      ) : transactionDetails.length === 0 ? (
                        <p>No transactions yet.</p>
                      ) : (
                        <div className="mt-5 h-[auto]">
                          <AllTransactionCompleted
                            transactionDetails={transactionDetails.filter(
                              (transaction) => {
                                const searchTerm = searchQuery.toLowerCase();
                                return (
                                  transaction.paymentName
                                    .toLowerCase()
                                    .includes(searchTerm) ||
                                  transaction.email
                                    .toLowerCase()
                                    .includes(searchTerm) ||
                                  transaction.paymentDscription
                                    .toLowerCase()
                                    .includes(searchTerm)
                                );
                              }
                            )}
                            onCancel={handleCancel}
                            onComplete={handleComplete}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================ Cancelled Tab ============== */}
            {cancelled && (
              <div className="w-[100%] h-[auto]">
                {loading ? (
                  <p>Loading...</p> // Show a loading indicator while data is being fetched
                ) : cancelledTransactions.length === 0 ? (
                  <p>No cancelled transactions found.1</p>
                ) : (
                  <div className="mt-5 h-[auto]">
                    <CancelledComponent
                      // cancelledTransactions={cancelledTransactions}
                      cancelledTransactions={cancelledTransactions.filter(
                        (transaction) => {
                          const searchTerm = searchQuery.toLowerCase();
                          return (
                            transaction.paymentName
                              .toLowerCase()
                              .includes(searchTerm) ||
                            transaction.email
                              .toLowerCase()
                              .includes(searchTerm) ||
                            transaction.paymentDscription
                              .toLowerCase()
                              .includes(searchTerm)
                          );
                        }
                      )}
                    />
                  </div>
                )}
              </div>
            )}
            {completed && (
              <div className="w-[100%] mt-2  h-[auto]">
                {loading ? (
                  <p>Loading...</p> // Show a loading indicator while data is being fetched
                ) : completedTransactions.length === 0 ? (
                  <p className="pt-5">No Completed transactions found yet</p>
                ) : (
                  <div className="mt-5 h-[auto]">
                    <CompletedComponent
                      // completedTransactions={completedTransactions}
                      completedTransactions={completedTransactions.filter(
                        (transaction) => {
                          const searchTerm = searchQuery.toLowerCase();
                          return (
                            transaction.paymentName
                              .toLowerCase()
                              .includes(searchTerm) ||
                            transaction.email
                              .toLowerCase()
                              .includes(searchTerm) ||
                            transaction.paymentDscription
                              .toLowerCase()
                              .includes(searchTerm)
                          );
                        }
                      )}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
      />
    </div>
  );
};

export default TransactionTab;
