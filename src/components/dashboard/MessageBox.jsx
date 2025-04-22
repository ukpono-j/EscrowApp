import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import "./MessageBox.css";
import { MdOutlineLogout, MdSend } from "react-icons/md";
import { FiArrowLeft, FiLoader, FiUser, FiInfo } from "react-icons/fi";
import { BsChatLeftText } from "react-icons/bs";
import DefaultProfile from "../../assets/profile_icon.png";
import { format } from "date-fns";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const SOCKET_SERVER_URL = `${BASE_URL}`;

const MessageBox = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [userDetails, setUserDetails] = useState({});
  const [transactionDetails, setTransactionDetails] = useState({});
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const socketRef = useRef();
  const { chatroomId } = useParams();

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("auth-token");
      if (token) {
        axios.defaults.headers.common["auth-token"] = token;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/transactions/chatroom/${chatroomId}`, {
          headers: {
            "auth-token": token,
          },
        });
        setTransactionDetails(response.data);
        setParticipants(response.data.participants);
      } catch (error) {
        console.error("Error fetching transaction details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [chatroomId]);

  useEffect(() => {
    if (userDetails._id) {
      socketRef.current = io(SOCKET_SERVER_URL);
      socketRef.current.emit("join-room", chatroomId, userDetails._id);

      const handleNewMessage = (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      };

      socketRef.current.on("message", handleNewMessage);

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

  const sendMessage = async () => {
    if (socketRef.current && socketRef.current.connected && message.trim() !== "") {
      const newMessage = {
        chatroomId,
        userId: userDetails._id,
        userFirstName: userDetails.firstName,
        message,
        timestamp: new Date().toISOString(),
        avatarImage: userDetails.avatarImage,
      };
      
      // Clear input right away for better UX
      setMessage("");
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
      
      // Emit the message to other participants
      socketRef.current.emit("message", newMessage);

      try {
        // Save the message to the backend
        await axios.post(`${BASE_URL}/api/messages/send-message`, newMessage);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isCreator = transactionDetails.userId === userDetails._id;

  const handleChatExit = () => {
    navigate("/transactions/tab");
  };
  
  const toggleInfoPanel = () => {
    setShowInfo(!showInfo);
  };
  
  const formatMessageTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch (error) {
      return '';
    }
  };
  
  const getInitials = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="bg-[#111518] h-screen flex items-center justify-center text-white">
        <div className="flex flex-col items-center">
          <FiLoader className="animate-spin text-4xl text-blue-500 mb-3" />
          <p className="text-lg">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111518] h-screen flex flex-col text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1A1E21] border-b border-[#28313A]">
        <div className="flex items-center">
          <button 
            onClick={handleChatExit} 
            className="mr-3 p-2 rounded-full hover:bg-[#28313A] transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          
          <div className="flex items-center">
            <div className="h-10 w-10 bg-[#318AE6] rounded-full flex items-center justify-center text-white font-semibold">
              <BsChatLeftText size={18} />
            </div>
            <div className="ml-3">
              <h1 className="font-bold text-lg">{transactionDetails.paymentName || "Chat Room"}</h1>
              <p className="text-xs text-gray-400">
                {participants && participants.length 
                  ? `${participants.length} participants` 
                  : "Loading participants..."}
              </p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={toggleInfoPanel}
          className={`p-2 rounded-full ${showInfo ? 'bg-[#318AE6]' : 'hover:bg-[#28313A]'} transition-colors`}
        >
          <FiInfo size={20} />
        </button>
      </div>

      {/* Main chat area with optional info panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages area */}
        <div className={`flex-1 flex flex-col ${showInfo ? 'md:mr-80' : ''} transition-all duration-300`}>
          {/* Messages container with scrolling */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <BsChatLeftText size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm mt-2">Be the first to send a message!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isSentByCurrentUser = msg.userId === userDetails._id;
                const showAvatar = index === 0 || messages[index - 1].userId !== msg.userId;
                
                return (
                  <div key={index} className={`flex ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] flex ${isSentByCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar column - only show when user changes */}
                      {showAvatar && (
                        <div className={`flex-shrink-0 ${isSentByCurrentUser ? 'ml-2' : 'mr-2'}`}>
                          <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-[#28313A]">
                            <img
                              src={msg.avatarImage ? `${BASE_URL}/${msg.avatarImage}` : DefaultProfile}
                              alt="Avatar"
                              onError={(e) => { e.target.onerror = null; e.target.src = DefaultProfile; }}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Message content */}
                      <div className={`flex flex-col ${isSentByCurrentUser ? 'items-end' : 'items-start'}`}>
                        {showAvatar && (
                          <span className="text-xs text-gray-400 mb-1 px-1">
                            {isSentByCurrentUser ? 'You' : msg.userFirstName}
                          </span>
                        )}
                        
                        <div className={`rounded-2xl px-4 py-2 break-words ${
                          isSentByCurrentUser 
                            ? 'bg-[#318AE6] text-white' 
                            : 'bg-[#28313A] text-gray-100'
                        }`}>
                          {msg.message}
                          <span className="text-xs opacity-70 ml-2 inline-block">
                            {formatMessageTimestamp(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message input */}
          <div className="p-4 bg-[#1A1E21] border-t border-[#28313A]">
            <div className="flex items-center bg-[#28313A] rounded-full overflow-hidden">
              <input
                ref={messageInputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-transparent outline-none text-white"
              />
              <button 
                onClick={sendMessage}
                disabled={!message.trim()}
                className={`p-3 rounded-full mr-1 ${
                  message.trim() 
                    ? 'bg-[#318AE6] hover:bg-[#2571c5] text-white' 
                    : 'bg-[#1d2329] text-gray-500'
                } transition-colors`}
              >
                <MdSend size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Info panel (transaction details and participants) */}
        {showInfo && (
          <div className="w-80 bg-[#1A1E21] border-l border-[#28313A] hidden md:block overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-bold mb-4">Transaction Details</h2>
              
              <div className="space-y-4">
                <div className="bg-[#28313A] p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">ID</p>
                  <p className="text-sm font-medium truncate">{transactionDetails._id}</p>
                </div>
                
                <div className="bg-[#28313A] p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Amount</p>
                  <p className="text-base font-medium text-[#318AE6]">{transactionDetails.paymentAmount}</p>
                </div>
                
                <div className="bg-[#28313A] p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Description</p>
                  <p className="text-sm">{transactionDetails.paymentDescription || "No description"}</p>
                </div>
                
                <div className="bg-[#28313A] p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    transactionDetails.status === "completed" ? "bg-green-900 text-green-300" :
                    transactionDetails.status === "cancelled" ? "bg-red-900 text-red-300" :
                    "bg-yellow-900 text-yellow-300"
                  }`}>
                    {transactionDetails.status || "pending"}
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-bold mt-6 mb-4">Participants</h3>
              <div className="space-y-2">
                {participants && participants.length > 0 ? (
                  participants.map((participant, index) => (
                    <div key={index} className="flex items-center p-2 hover:bg-[#28313A] rounded-lg transition-colors">
                      <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-[#318AE6] mr-3">
                        {participant.avatarImage ? (
                          <img
                            src={`${BASE_URL}/${participant.avatarImage}`}
                            alt={participant.firstName}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.textContent = getInitials(participant.firstName);
                              e.target.style.display = 'flex';
                              e.target.style.alignItems = 'center';
                              e.target.style.justifyContent = 'center';
                            }}
                          />
                        ) : (
                          <span>{getInitials(participant.firstName)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{`${participant.firstName || ''} ${participant.lastName || ''}`}</p>
                        <p className="text-xs text-gray-400">{participant.email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No participants found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBox;