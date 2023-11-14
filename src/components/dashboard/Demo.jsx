import React from 'react'

const Demo = () => {

// ===================== Sidebar code 
  // useEffect(() => {
  //   const token = localStorage.getItem("auth-token");
  //   if (token) {
  //     axios.defaults.headers.common["auth-token"] = token;
  //   }

  //   // Fetch transaction details from API and update the state
  //   axios
  //     .get(`${BASE_URL}/user-details`, {
  //       headers: {
  //         "auth-token": token,
  //       },
  //     })
  //     .then((response) => {
  //       setUserName(response.data.firstName);
  //     });
  // }, []);






  
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

  return (
    <div>Demo</div>
  )
}

export default Demo