import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "../../utils/axiosConfig";
import "./MessageBox.css";
import { MdSend } from "react-icons/md";
import { FiArrowLeft, FiLoader, FiInfo } from "react-icons/fi";
import { BsChatLeftText } from "react-icons/bs";
import { format } from "date-fns";
import { useToast } from "@chakra-ui/react";
import { v4 as uuidv4 } from "uuid";
import multiavatar from "@multiavatar/multiavatar/esm"; // Import Multiavatar

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
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]); // New state for typing users
  const navigate = useNavigate();
  const toast = useToast();
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const socketRef = useRef();
  const { chatroomId } = useParams();
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = localStorage.getItem("access-token");
      if (!token) {
        setError("No access token found. Please log in.");
        navigate("/");
        return;
      }
      axios.defaults.headers.common["access-token"] = token;

      try {
        const response = await axios.get(`${BASE_URL}/api/users/user-details`);
        setUserDetails(response.data.data.user);
      } catch (error) {
        console.error("Error fetching user details:", error);
        setError("Failed to fetch user details. Please log in again.");
        navigate("/");
      }
    };

    fetchUserDetails();
  }, [navigate]);

  // Fetch transaction details
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("access-token");
      if (!token) {
        setError("No access token found. Please log in.");
        navigate("/");
        return;
      }
      axios.defaults.headers.common["access-token"] = token;

      try {
        const response = await axios.get(`${BASE_URL}/api/transactions/chatroom/${chatroomId}`);
        setTransactionDetails(response.data.data);
        setParticipants(Array.isArray(response.data.data.participants) ? response.data.data.participants : []);
      } catch (error) {
        console.error("Error fetching transaction details:", error);
        setError(error.response?.data?.error || "Failed to load transaction details.");
        navigate("/transactions/tab");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [chatroomId, navigate]);

  // Socket setup
  useEffect(() => {
    if (!userDetails._id) return;

    const token = localStorage.getItem("access-token");
    if (!token) {
      setError("No access token found. Please log in.");
      return;
    }

    socketRef.current = io(SOCKET_SERVER_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5, // Add randomization to prevent thundering herd
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected, joining room:", `transaction_${chatroomId}`);
      socketRef.current.emit("join-room", `transaction_${chatroomId}`, userDetails._id);
      setSocketConnected(true);

      // Process pending messages
      if (pendingMessages.length > 0) {
        const messagesToSend = [...pendingMessages]; // Copy to avoid mutation issues
        setPendingMessages([]); // Clear pending messages immediately
        messagesToSend.forEach((msg) => {
          socketRef.current.emit("message", msg);
          axios
            .post(`${BASE_URL}/api/messages/send-message`, msg)
            .then((response) => {
              console.log("Pending message saved to database:", response.data);
              setMessages((prevMessages) =>
                prevMessages.map((m) =>
                  m.tempId === msg.tempId ? { ...response.data, tempId: msg.tempId } : m
                )
              );
            })
            .catch((error) => {
              console.error("Error saving pending message:", error);
              setMessages((prevMessages) => prevMessages.filter((m) => m.tempId !== msg.tempId));
              toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to send queued message.",
                status: "error",
                duration: 5000,
                isClosable: true,
              });
            });
        });
      }

      // Heartbeat to maintain connection
      const heartbeat = setInterval(() => {
        socketRef.current.emit("ping", { userId: userDetails._id });
      }, 30000);

      socketRef.current.on("pong", () => {
        console.log("Received pong from server");
      });

      return () => clearInterval(heartbeat);
    });

    socketRef.current.on("message", (message) => {
      console.log("Received message via Socket.io:", message);
      setMessages((prevMessages) => {
        if (prevMessages.some((msg) => msg._id === message._id)) {
          return prevMessages;
        }
        return [...prevMessages.filter((msg) => msg.tempId !== message.tempId), message];
      });
    });

    socketRef.current.on("typing", (data) => {
      if (data.userId !== userDetails._id) {
        setTypingUsers((prev) => {
          if (!prev.some((user) => user.userId === data.userId)) {
            return [...prev, data];
          }
          return prev;
        });
      }
    });

    socketRef.current.on("stop-typing", (data) => {
      setTypingUsers((prev) => prev.filter((user) => user.userId !== data.userId));
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      setSocketConnected(false);
      if (err.message.includes("Authentication error")) {
        setError("Session expired. Please log in again.");
        navigate("/");
      } else {
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat server. Messages will be queued.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
    });

    socketRef.current.on("error", (err) => {
      console.error("Socket error:", err.message);
      setSocketConnected(false);
      toast({
        title: "Error",
        description: err.message || "An error occurred in the chat.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    });

    socketRef.current.on("reconnect", (attempt) => {
      console.log(`Socket reconnected after ${attempt} attempts`);
      setSocketConnected(true);
    });

    return () => {
      socketRef.current.off("message");
      socketRef.current.off("typing");
      socketRef.current.off("stop-typing");
      socketRef.current.off("connect_error");
      socketRef.current.off("error");
      socketRef.current.off("pong");
      socketRef.current.off("reconnect");
      socketRef.current.disconnect();
      setSocketConnected(false);
    };
  }, [chatroomId, userDetails._id, toast, pendingMessages]);

  // Handle typing events
  const handleTyping = () => {
    if (socketRef.current && socketConnected) {
      socketRef.current.emit("typing", {
        chatroomId,
        userId: userDetails._id,
        userFirstName: userDetails.firstName || "User",
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("stop-typing", {
          chatroomId,
          userId: userDetails._id,
        });
      }, 3000); // Stop typing after 3 seconds of inactivity
    }
  };

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem("access-token");
      if (!token) {
        setError("No access token found. Please log in.");
        navigate("/");
        return;
      }
      axios.defaults.headers.common["access-token"] = token;
      try {
        console.log("Fetching messages for chatroom:", chatroomId);
        const response = await axios.get(`${BASE_URL}/api/messages/${chatroomId}`);
        setMessages(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError(error.response?.data?.error || "Failed to load messages.");
        setMessages([]);
      }
    };

    fetchMessages();
  }, [chatroomId, navigate]);

  const getAvatarSvg = (avatarSeed, userId) => {
    try {
      const seed = avatarSeed || userId || "default-user";
      const svg = multiavatar(seed);
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    } catch (error) {
      console.error("Error generating Multiavatar:", error);
      return `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="15" fill="#B38939" />
          <text x="50%" y="50%" font-size="12" fill="white" text-anchor="middle" dominant-baseline="middle">${(avatarSeed || userId || "??").slice(0, 2)}</text>
        </svg>`
      )}`;
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Message cannot be empty.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const tempId = uuidv4();
    const newMessage = {
      chatroomId,
      userId: userDetails._id,
      userFirstName: userDetails.firstName || "User",
      userLastName: userDetails.lastName || "",
      message,
      avatarSeed: userDetails.avatarSeed || userDetails._id,
      timestamp: new Date().toISOString(),
      tempId,
    };

    setMessage("");
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }

    setMessages((prevMessages) => [...prevMessages, newMessage]);

    if (!socketRef.current || !socketConnected) {
      setPendingMessages((prev) => [...prev, newMessage]);
      toast({
        title: "Connecting",
        description: "Message queued, waiting for chat server connection...",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      socketRef.current.emit("message", newMessage);
      const response = await axios.post(`${BASE_URL}/api/messages/send-message`, newMessage);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.tempId === newMessage.tempId ? { ...response.data, tempId } : msg
        )
      );
    } catch (error) {
      console.error("Error saving message:", error);
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.tempId !== newMessage.tempId)
      );
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send message.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isCreator = transactionDetails.userId?._id === userDetails._id;

  const handleChatExit = () => {
    navigate("/transactions/tab");
  };

  const toggleInfoPanel = () => {
    setShowInfo(!showInfo);
  };

  const formatMessageTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), "h:mm a");
    } catch (error) {
      return "";
    }
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "?";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  if (error) {
    return (
      <div className="bg-[#111518] h-screen flex items-center justify-center text-white">
        <div className="flex flex-col items-center">
          <BsChatLeftText size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">{error}</p>
          <button
            onClick={() => navigate("/transactions/tab")}
            className="mt-4 px-4 py-2 bg-[#318AE6] rounded-md hover:bg-[#2571c5]"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

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

  if (participants.length === 0 && !isCreator) {
    return (
      <div className="bg-[#111518] h-screen flex items-center justify-center text-white">
        <div className="flex flex-col items-center">
          <BsChatLeftText size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">No participants in this transaction</p>
          <p className="text-sm mt-2">You cannot send messages until participants are added.</p>
          <button
            onClick={() => navigate("/transactions/tab")}
            className="mt-4 px-4 py-2 bg-[#318AE6] rounded-md hover:bg-[#2571c5]"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111518] h-screen flex flex-col text-white">
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
              <p className="font-bold text-lg">
                {participants.length > 0
                  ? participants.map((p) => `${p.firstName || "User"} ${p.lastName || ""}`).join(", ")
                  : "No participants"}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={toggleInfoPanel}
          className={`p-2 rounded-full ${showInfo ? "bg-[#318AE6]" : "hover:bg-[#28313A]"} transition10
          transition-colors`}
        >
          <FiInfo size={20} />
        </button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 flex flex-col ${showInfo ? "md:mr-80" : ""} transition-all duration-300`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {participants.length === 0 && isCreator && (
              <div className="p-4 bg-yellow-900 text-yellow-300 text-center">
                No participants yet. Messages will be visible once participants are added.
              </div>
            )}
            {!socketConnected && (
              <div className="p-2 text-center text-yellow-300 bg-yellow-900/50">
                Connecting to chat server...
              </div>
            )}
            {typingUsers.length > 0 && (
              <div className="p-2 text-center text-gray-400 text-sm">
                {typingUsers.map((user) => user.userFirstName).join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...
              </div>
            )}
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
                  <div
                    key={msg._id || msg.tempId || index}
                    className={`flex ${isSentByCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] flex ${isSentByCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {showAvatar && (
                        <div className={`flex-shrink-0 ${isSentByCurrentUser ? "ml-2" : "mr-2"}`}>
                          <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-[#28313A]">
                            <img
                              src={getAvatarSvg(msg.avatarSeed, msg.userId)}
                              alt={`${msg.userFirstName || "User"}'s avatar`}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getAvatarSvg("default-user", msg.userId);
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div
                        className={`flex flex-col ${isSentByCurrentUser ? "items-end" : "items-start"}`}
                      >
                        {showAvatar && (
                          <span className="text-xs text-gray-400 mb-1 px-1">
                            {isSentByCurrentUser ? "You" : `${msg.userFirstName || "User"} ${msg.userLastName || ""}`}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 break-words ${isSentByCurrentUser ? "bg-[#318AE6] text-white" : "bg-[#28313A] text-gray-100"
                            }`}
                        >
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
          <div className="p-4 bg-[#1A1E21] border-t border-[#28313A]">
            <div className="flex items-center bg-[#28313A] rounded-full overflow-hidden">
              <input
                ref={messageInputRef}
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-transparent outline-none text-white"
                disabled={participants.length === 0 && !isCreator}
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim() || (participants.length === 0 && !isCreator)}
                className={`p-3 rounded-full mr-1 ${message.trim() && (participants.length > 0 || isCreator)
                  ? "bg-[#318AE6] hover:bg-[#2571c5] text-white"
                  : "bg-[#1d2329] text-gray-500"
                  } transition-colors`}
              >
                <MdSend size={20} />
              </button>
            </div>
          </div>
        </div>
        {showInfo && (
          <div className="w-80 bg-[#1A1E21] border-l border-[#28313A] hidden md:block overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-bold mb-4">Transaction Details</h2>
              <div className="space-y-4">
                <div className="bg-[#28313A] p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">ID</p>
                  <p className="text-sm font-medium truncate">{transactionDetails._id || "N/A"}</p>
                </div>
                <div className="bg-[#28313A] p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Amount</p>
                  <p className="text-base font-medium text-[#318AE6]">
                    {transactionDetails.paymentAmount || "N/A"}
                  </p>
                </div>
                <div className="bg-[#28313A] p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Description</p>
                  <p className="text-sm">{transactionDetails.productDetails?.description || "No description"}</p>
                </div>
                <div className="bg-[#28313A] p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <div
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transactionDetails.status === "completed"
                      ? "bg-green-900 text-green-300"
                      : transactionDetails.status === "cancelled"
                        ? "bg-red-900 text-red-300"
                        : "bg-yellow-900 text-yellow-300"
                      }`}
                  >
                    {transactionDetails.status || "pending"}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-bold mt-6 mb-4">Participants</h3>
              <div className="space-y-2">
                {participants.length > 0 ? (
                  participants.map((participant, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 hover:bg-[#28313A] rounded-lg transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-[#318AE6] mr-3">
                        <img
                          src={getAvatarSvg(participant.avatarSeed, participant._id)}
                          alt={`${participant.firstName || "User"}'s avatar`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getAvatarSvg("default-user", participant._id);
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{`${participant.firstName || "User"} ${participant.lastName || ""}`}</p>
                        <p className="text-xs text-gray-400">{participant.email || "N/A"}</p>
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