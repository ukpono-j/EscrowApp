import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import "./MessageBox.css";
import { MdOutlineLogout } from "react-icons/md";
import { Navigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const SOCKET_SERVER_URL = `${BASE_URL}`;

const MessageBox = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [userDetails, setUserDetails] = useState({});
  const [transactionDetails, setTransactionDetails] = useState({});
  const [participants, setParticipants] = useState([]);
const navigate = useNavigate()

  const socketRef = useRef();
  const { chatroomId } = useParams(); // Get the chatroom ID from the URL

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
        console.log("User details fetched:", response.data); // Log the user details
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      const token = localStorage.getItem("auth-token");
      if (token) {
        axios.defaults.headers.common["auth-token"] = token;
      }

      try {
        console.log("Fetching transaction details for chatroom ID:", chatroomId); // Log the chatroom ID
        const response = await axios.get(`${BASE_URL}/api/transactions/chatroom/${chatroomId}`, {
          headers: {
            "auth-token": token,
          },
        });
        setTransactionDetails(response.data);
        setParticipants(response.data.participants);
        console.log("Transaction details fetched:", response.data); // Log the response data
      } catch (error) {
        console.error("Error fetching transaction details:", error);
      }
    };

    fetchTransactionDetails();
  }, [chatroomId]);

  useEffect(() => {
    if (userDetails._id) {
      // Initialize socket connection when the userId is set
      socketRef.current = io(SOCKET_SERVER_URL);

      // Join the chatroom
      socketRef.current.emit("join-room", chatroomId, userDetails._id);

      const handleNewMessage = (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      };

      socketRef.current.on("message", handleNewMessage);

      // Clean up socket connection when the component unmounts
      return () => {
        socketRef.current.off("message", handleNewMessage);
        socketRef.current.disconnect();
      };
    }
  }, [chatroomId, userDetails._id]);

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem("auth-token");
      if (token) {
        axios.defaults.headers.common["auth-token"] = token;
      }
      try {
        const response = await axios.get(`${BASE_URL}/api/messages/${chatroomId}`);
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
  
    fetchMessages();
  }, [chatroomId]);
  

  // const sendMessage = () => {
  //   // Check if socketRef.current is defined and the connection is established
  //   if (socketRef.current && socketRef.current.connected && message.trim() !== "") {
  //     const newMessage = {
  //       userId: userDetails._id, // Include userId in the message object
  //       userFirstName: userDetails.firstName,
  //       message,
  //       timestamp: new Date().toISOString(),
  //     };
  //     console.log("Sending message:", newMessage); // Log the message before emitting
  //     // Emit the message
  //     socketRef.current.emit("message", newMessage);
  //     setMessage("");
  //   }
  // };

  const sendMessage = async () => {
    if (socketRef.current && socketRef.current.connected && message.trim() !== "") {
      const newMessage = {
        chatroomId,
        userId: userDetails._id,
        userFirstName: userDetails.firstName,
        message,
        timestamp: new Date().toISOString(),
      };
         // Emit the message to other participants
         socketRef.current.emit("message", newMessage);
         setMessage("");
  
      try {
        // Save the message to the backend
        const response = await axios.post(`${BASE_URL}/api/messages/send-message`, newMessage);
        console.log("Message saved:", response.data); // Log the saved message
      } catch (error) {
        console.error("Error saving message:", error);
      }
    }
  };
  

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const isCreator = transactionDetails.userId === userDetails._id;

  const handleChatExit = () => {
    navigate("/transactions/tab")
  }
  return (
    <div className="bg-[#031420] py-[90px] text-white font-[Poppins]">
      <div className="flex items-center justify-between pr-5 border md:pl-[30px] md:pr-[30px] pl-5 fixed right-0 z-30 top-0 text-[#fff] h-[10vh] w-[100%] bg-[#1A1E21] border-none">
        <h1 className="text-[20px] font-bold ">Chat Room</h1>
        <h1 className="text-[18px] font-bold flex items-center cursor-pointer" onClick={handleChatExit}><MdOutlineLogout className="mr-1 text-[22px]" /> Exit</h1>
      </div>
      <div className="chat-container p-4">
        {/* <h2>Transaction Details</h2>
        <p>Transaction ID: {transactionDetails?.transactionId}</p>
        <p>Creator Id: {transactionDetails?.userId}</p>
        <p>Participants:</p>
        <ul>
          {transactionDetails.participants && transactionDetails.participants.length > 0 ? (
            transactionDetails.participants.map((participant, index) => (
              <li key={index}>
                User ID: {participant._id}, Email: {participant.email}, First Name: {participant.firstName}, Last Name: {participant.lastName}
              </li>
            ))
          ) : (
            <li>No participants found</li>
          )}
        </ul> */}
        <div className="message-list text-white">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.userId === userDetails._id ? "sent" : "received"}`}>
              <div className={`message-user ${msg.userId === userDetails._id ? "current-user" : ""}`}>
                {/* {msg.userId === transactionDetails.userId ? ` ${msg.userFirstName}` : ` ${msg.userFirstName}`} */}
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pr-5 pt-3 pb-3 border md:pl-[30px] md:pr-[30px] pl-5 fixed right-0 z-30 bottom-0 text-[#fff] h-[auto] w-[100%] bg-[#1A1E21] border-none">
          <div className="message-input flex items-center text-[black] text-[15px] w-[100%]">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="w-[100%] px-3 h-[50px] rounded-xl outline-none text-[white] bg-[#28313A]"
            />
            <button onClick={sendMessage} className="text-white h-[50px] w-[130px] bg-[#007bff] rounded-xl mx-3">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBox;
