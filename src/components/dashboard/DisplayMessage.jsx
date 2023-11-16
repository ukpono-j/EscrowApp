// DisplayMessage.jsx
import React, { useEffect, useState, useRef } from "react";
import Roboto from "../../assets/robot.gif";
import Profile from "../../assets/profile_icon.png";
import ChatInput from "./ChatInput";
import Messages from "./Messages";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import axios from "axios";
import "./DisplayMessage.css";
import { v4 as uuidv4 } from "uuid";

// Function to format the time difference
// const formatTimeDifference = (timestamp) => {
//   const now = new Date();
//   const createdAt = new Date(timestamp);

//   const timeDifferenceInSeconds = Math.floor((now - createdAt) / 1000);

//   if (timeDifferenceInSeconds < 60) {
//     return `${timeDifferenceInSeconds} seconds ago`;
//   } else if (timeDifferenceInSeconds < 3600) {
//     const minutes = Math.floor(timeDifferenceInSeconds / 60);
//     return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
//   } else if (timeDifferenceInSeconds < 86400) {
//     const hours = Math.floor(timeDifferenceInSeconds / 3600);
//     return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
//   } else if (timeDifferenceInSeconds < 604800) {
//     const days = Math.floor(timeDifferenceInSeconds / 86400);
//     return `${days} ${days === 1 ? "day" : "days"} ago`;
//   } else if (timeDifferenceInSeconds < 2419200) {
//     const weeks = Math.floor(timeDifferenceInSeconds / 604800);
//     return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
//   } else if (timeDifferenceInSeconds < 29030400) {
//     const months = Math.floor(timeDifferenceInSeconds / 2419200);
//     return `${months} ${months === 1 ? "month" : "months"} ago`;
//   } else {
//     const years = Math.floor(timeDifferenceInSeconds / 29030400);
//     return `${years} ${years === 1 ? "year" : "years"} ago`;
//   }
// };

const DisplayMessage = ({ currentChat, socket, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const scrollRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    if (currentUser && currentChat) {
      // Fetch messages details from API and update the state
      axios
        .get(`${BASE_URL}/get-messages`, {
          params: {
            from: currentUser._id,
            to: currentChat._id,
          },
        })
        .then((response) => {
          setMessages(response.data);
        })
        .catch((error) => {
          console.error("Error fetching messages:", error);
          // Handle the error accordingly
        });
    }
  }, [currentUser, currentChat]);

  const handleSendMessage = async (msg) => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    try {
      // Send the message to the server
      await axios.post(`${BASE_URL}/send-message`, {
        from: currentUser._id,
        to: currentChat._id,
        message: msg,
      });

      // Emit the message using socket
      socket.current.emit("send-msg", {
        to: currentChat._id,
        from: currentUser._id,
        message: msg,
      });

      // Update the local state with the new message
      const msgs = [...messages];
      msgs.push({ fromUserId: true, message: msg });
      setMessages(msgs);

      // Log the message immediately after sending
      console.log("Message sent successfully:", msg);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    if (socket.current) {
      // Establish socket connection
      socket.current.on("msg-receive", (msg) => {
        // setMessages((prevMessages) => [
        //   ...prevMessages,
        //   { fromUserId: false, message: msg },
        // ]);
        // Update the state with the received message
        setMessages({ fromUserId: false, message: msg });
      });
    }

    // Clean up socket connection when the component unmounts
    return () => {
      if (socket.current) {
        socket.current.off("msg-receive");
      }
    };
  }, [socket]);

  useEffect(() => {
    if (arrivalMessage) {
      // Update the state with the received message
      setMessages((prevMessages) => [...prevMessages, arrivalMessage]);
    }
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
              {/* <p className="text-[12px]">{currentChat._id}</p> */}
            </div>
          </div>

          <div
            style={{
              overflowY: "scroll",
            }}
            className="chat_messages h-[63vh] pt-2 pr-2  pl-2 pb-2  w-[100%] pt-5  pb-7"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                ref={index === messages.length - 1 ? scrollRef : null}
              >
                {message.sender === currentUser._id ? (
                  <div className="sent">
                    <div className="content">
                      <p>{message.message.text}</p>
                      <div className="message-timestamp">
                        {/* {message.createdAt && (
                          <span>
                            <span>
                              {formatTimeDifference(message.createdAt)}
                            </span>
                          </span>
                        )} */}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="received">
                    <div className="content">
                      <p>{message.message.text}</p>
                      <div className="message-timestamp">
                        {/* time strap */}
                        {/* <span>{formatTimeDifference(message.createdAt)}</span> */}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {/* <Messages /> */}
          </div>
          <ChatInput handleSendMessage={handleSendMessage} />
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

// ChatCom
export default DisplayMessage;
