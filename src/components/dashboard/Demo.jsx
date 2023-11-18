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

      // Endpoint for uploading media for chat/messages
app.post("/chat-uploads", authenticateUser, upload.single("media"), async (req, res) => {
  try {
    const userId = req.user.id;
    const mediaData = req.file.path;

    const newMessage = new MessageModel({
      message: {
        media: mediaData,
        users: [userId],
        sender: userId,
      },
    });

    await newMessage.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error uploading media:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});


// Endpoint for uploading media for chat/messages
app.post("/chat-uploads", authenticateUser, upload.single("media"), async (req, res) => {
  try {
    const userId = req.user.id;
    const mediaData = req.file.path;

    const newMessage = new MessageModel({
      message: {
        media: mediaData,
        users: [userId],
        sender: userId,
      },
    });

    await newMessage.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error uploading media:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});


// Endpoint for fetching media uploads
app.get("/chat-uploads", authenticateUser, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const fromUserId = req.query.from;
    const toUserId = req.query.to;

    const mediaMessages = await MessageModel.find({
      $or: [
        { "message.users": { $all: [userId, fromUserId, toUserId] } },
        { "message.users": { $all: [userId, toUserId, fromUserId] } },
        {   "message.media": { $exists: true, $ne: null }},
      ],
    }).sort({ "message.createdAt": -1 });
    
    console.log("Media Messages:", mediaMessages);

    const mediaArray = mediaMessages.map((message) => ({
      _id: message._id,
      sender: message.message.sender,
      senderName: message.message.senderName || "Unknown Sender",
      media: message.message.media,
      createdAt: message.createdAt,
    }));


    res.status(200).json(mediaArray);
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




  return (
    <div>Demo</div>
  )
}

export default Demo


// DisplayMessage.jsx
import React, { useEffect, useState, useRef } from "react";
import Roboto from "../../assets/robot.gif";
import Profile from "../../assets/profile_icon.png";
import ChatInput from "./ChatInput";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import axios from "axios";
import "./DisplayMessage.css";
import { io } from "socket.io-client"; // Import socket.io-client
import Picker from "emoji-picker-react";
import { IoMdSend } from "react-icons/io";
import {
  BsClipboard,
  BsClipboard2Plus,
  BsEmojiSmile,
  BsSend,
} from "react-icons/bs";
import { MdAttachFile } from "react-icons/md";

const socket = io(BASE_URL); // Connect to the server

const DisplayMessage = ({ currentChat, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(null);
  const [emoji, setEmoji] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const scrollRef = useRef();
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaData, setMediaData] = useState([]);

  useEffect(() => {
    const socket = io(BASE_URL);
    console.log("Connected to the server");

    socket.on("msg-receive", (message) => {
      setNewMessage(message);
      console.log("Received message:", message);
    });

    return () => {
      socket.off("msg-receive");
      socket.disconnect(); // Disconnect the socket here
    };
  }, []);

  useEffect(() => {
    if (newMessage) {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      setNewMessage(null);
    }
  }, [newMessage, messages]);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    if (currentUser && currentChat) {
      axios
        .get(`${BASE_URL}/get-messages`, {
          params: {
            from: currentUser._id,
            to: currentChat._id,
          },
        })
        .then((response) => {
          // Reverse the order to show newer messages below
          const sortedMessages = response.data.sort((a, b) => {
            return new Date(a.createdAt) - new Date(b.createdAt);
          });

          setMessages(sortedMessages);
        })
        .catch((error) => {
          console.error("Error fetching messages:", error);
        });
    }
  }, [currentUser, currentChat]);

  // Function to format the time difference
  const formatTimeDifference = (timestamp) => {
    const now = new Date();
    const createdAt = new Date(timestamp);

    const timeDifferenceInSeconds = Math.floor((now - createdAt) / 1000);

    if (timeDifferenceInSeconds < 60) {
      return `${timeDifferenceInSeconds} seconds ago`;
    } else if (timeDifferenceInSeconds < 3600) {
      const minutes = Math.floor(timeDifferenceInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (timeDifferenceInSeconds < 86400) {
      const hours = Math.floor(timeDifferenceInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else if (timeDifferenceInSeconds < 604800) {
      const days = Math.floor(timeDifferenceInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    } else if (timeDifferenceInSeconds < 2419200) {
      const weeks = Math.floor(timeDifferenceInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else if (timeDifferenceInSeconds < 29030400) {
      const months = Math.floor(timeDifferenceInSeconds / 2419200);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    } else {
      const years = Math.floor(timeDifferenceInSeconds / 29030400);
      return `${years} ${years === 1 ? "year" : "years"} ago`;
    }
  };

  const handleSendMessage = async ({ text }) => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    try {
      // Send the message with text and media information
      await axios.post(`${BASE_URL}/send-message`, {
        from: currentUser._id,
        to: currentChat._id,
        message: { text },
      });

      socket.emit("send-msg", {
        to: currentChat._id,
        from: currentUser._id,
        message: { text },
      });

      // Instead of using setNewMessage, directly update the messages state
      setMessages((prevMessages) => [
        ...prevMessages,
        { fromUserId: true, message: { text } },
      ]);

      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const uploadMedia = async () => {
    try {
      const formData = new FormData();
      formData.append("media", selectedFile);

      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/chat-uploads`,
        formData
      );

      // Update media preview if needed
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result);

      if (selectedFile) {
        reader.readAsDataURL(selectedFile);
        console.log(selectedFile);
      } else {
        setMediaPreview(null);
      }
    } catch (error) {
      console.error("Error uploading media:", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      socket.emit("add-user", currentUser._id);
    }

    return () => {
      socket.disconnect(); // Disconnect the socket when the component unmounts
    };
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentChat) {
      axios
        .get(`${import.meta.env.VITE_BASE_URL}/chat-uploads`, {
          params: {
            from: currentUser._id,
            to: currentChat._id,
          },
        })
        .then((response) => setMediaData(response.data))
        .catch((error) => console.error("Error fetching media:", error));
    }
  }, [currentUser, currentChat]);

  const handleEmojiPicker = () => {
    setEmoji(!emoji);
  };

  const handleEmojiClick = (chosenEmoji) => {
    let message = msg + chosenEmoji.emoji;
    setMsg(message);
  };

  const sendChat = (event) => {
    event.preventDefault();

    if (msg.length > 0 || selectedFile) {
      handleSendMessage({ text: msg });
      setMsg("");
      setEmoji(false);
    }
  };

  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedAvatars(file);

    // Read and display the image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    if (file) {
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };


  return (
    <div className="message-container relative  h-[80vh] ">
      {currentChat ? (
        <div className="relative">
          <div className="userDetails pt-2 pr-4 pl-4 pb-2 bg-[#0F1A2E]   w-[100%]  text-[#fff] flex items-center ">
            <div className="h-[40px] bg-[#fff] w-[40px] rounded-full border border-[grey]">
              <img
                src={currentChat.avatarImage || Profile}
                alt="userImg"
                className="w-[100%] h-[100%] rounded-full  "
              />
            </div>
            <div className="ml-1">
              <h2 className=" text-[14px]">{currentChat.firstName}</h2>
            </div>
          </div>

          <div
            style={{
              overflowY: "scroll",
            }}
            className="chat_messages h-[63vh] pt-2 pr-2  pl-2 pb-2  w-[100%] pt-5  pb-7"
          >
            <div className=" min-h-[auto]">
              {messages.map((message, index) => (
                <div
                  key={index}
                  ref={index === messages.length - 1 ? scrollRef : null}
                  className={
                    message.sender === currentUser._id ? "sent" : "received"
                  }
                >
                  <div className="content">
                    <div className="uploaded_file">
                      <img src="" alt="" />
                    </div>
                    <p>{message.message?.text}</p>
                    <div className="message-timestamp">
                      {message.createdAt && (
                        <span className="text-[10px]">
                          <span>{formatTimeDifference(message.createdAt)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="chat_input bg-[#0F1A2E] relative  w-[100%]  border p-2 flex items-center">
            <div className="text-[23px] text-[#ffff00c8] cursor-pointer">
              <BsEmojiSmile onClick={handleEmojiPicker} />
            </div>
            <div className="text-[#fff] text-[22px]">
              <MdAttachFile />
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-[20px] h-[20px]"
            />
            <form
              onSubmit={(e) => sendChat(e)}
              action=""
              className="flex items-center w-[100%] ml-3"
            >
              <input
                type="text"
                placeholder="Type Message"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                className="p-2 h-[33px] border border-[#0F1A2E] rounded-3xl text-[13px] font-[Poppins] w-[100%]"
              />
              <button className="submit ml-2 rounded-xl pl-3 h-[33px] border w-[80px] flex items-center justify-center pr-3 pt-2 pb-2 bg-[#152D5D] text-[#fff]">
                <BsSend />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-col  items-center justify-center  min-h-[70vh]">
          <img src={Roboto} alt="" />
          <h2>Welcome to the Chat App, {currentUser?.firstName || "User"}!</h2>
          <p>Select a user to start chatting!</p>
        </div>
      )}
    </div>
  );
};

export default DisplayMessage;
