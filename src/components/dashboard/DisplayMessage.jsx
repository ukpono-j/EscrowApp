// DisplayMessage.jsx
import React, { useEffect, useState } from "react";
import Roboto from "../../assets/robot.gif";
import Profile from "../../assets/profile_icon.png";
import ChatInput from "./ChatInput";
import Messages from "./Messages";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import axios from "axios";

const DisplayMessage = ({ currentChat, currentUser }) => {
  const [messages, setMessages] = useState([]);

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
    try {
      const token = localStorage.getItem("auth-token");
      if (token) {
        axios.defaults.headers.common["auth-token"] = token;
      }

      await axios
        .post(`${BASE_URL}/send-message`, {
          from: currentUser._id,
          to: currentChat._id,
          message: msg,
        })
        .then((response) => {
          console.log("Message sent successfully:", response.data.message);
        })
        .catch((error) => {
          console.error("Error sending message:", error);
        });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="message-container relative border h-[97vh]">
      {currentChat ? (
        <div>
          <div className="userDetails flex items-center ">
            <div className="h-[40px] w-[40px] rounded-full border">
              <img
                src={currentChat.avatarImage || Profile}
                alt="userImg"
                className="w-[100%] h-[100%] rounded-full  "
              />
            </div>
            <h2 className="ml-1">{currentChat.firstName}</h2>
          </div>
          <div className="chat_messages">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`message ${
                  message.sender === currentUser._id ? "sended" : "received"
                }`}
              >
                <div className="content">
                  <p>{message.message.text}</p>
                </div>
              </div>
            ))}

            {/* <Messages /> */}
          </div>
          <ChatInput handleSendMessage={handleSendMessage} />
        </div>
      ) : (
        <div className="flex flex-col  items-center justify-center  min-h-[100vh]">
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
