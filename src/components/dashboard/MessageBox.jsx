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
import multiavatar from "@multiavatar/multiavatar/esm";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const SOCKET_SERVER_URL = `${BASE_URL}`;

const MessageBox = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [userDetails, setUserDetails] = useState({});
  const [transactionDetails, setTransactionDetails] = useState({});
  const [creatorDetails, setCreatorDetails] = useState({});
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
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
  }, [messages, typingUsers]);

  // Debug messages state
  useEffect(() => {
    console.log("Messages state:", JSON.stringify(messages, null, 2));
  }, [messages]);

  // Fetch user details and transaction data
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access-token");
      if (!token) {
        setError("No access token found. Please log in.");
        navigate("/");
        return;
      }
      axios.defaults.headers.common["access-token"] = token;

      try {
        // Fetch current user details
        const userResponse = await axios.get(`${BASE_URL}/api/users/user-details`);
        console.log("User details response:", userResponse.data);
        setUserDetails(userResponse.data.data.user);

        // Fetch transaction details
        const transactionResponse = await axios.get(`${BASE_URL}/api/transactions/chatroom/${chatroomId}`);
        console.log("Transaction response:", transactionResponse.data);
        const transactionData = transactionResponse.data.data;
        setTransactionDetails(transactionData);

        // Use populated creator details
        if (!transactionData.userId?._id) {
          throw new Error("Creator ID not found in transaction data");
        }
        setCreatorDetails({
          _id: transactionData.userId._id,
          firstName: transactionData.userId.firstName || "User",
          lastName: transactionData.userId.lastName || "",
          email: transactionData.userId.email || "N/A",
          avatarSeed: transactionData.userId.avatarSeed || transactionData.userId._id,
        });

        // Use populated participant details
        const participantDetails = (transactionData.participants || []).map((p) => ({
          userId: p.userId?._id || p.userId,
          role: p.role,
          firstName: p.userId?.firstName || p.firstName || "User",
          lastName: p.userId?.lastName || p.lastName || "",
          email: p.userId?.email || p.email || "N/A",
          avatarSeed: p.userId?.avatarSeed || p.avatarSeed || p.userId?._id || p.userId,
        })).filter(p => p.userId);
        setParticipants(participantDetails);

        // Verify chatroomId
        if (!transactionData.chatroomId || transactionData.chatroomId.toString() !== chatroomId) {
          setError("Invalid chatroom ID for this transaction.");
          toast({
            title: "Error",
            description: "Invalid chatroom ID for this transaction.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          navigate("/transactions/tab");
          return;
        }

        // Fetch messages
        const messagesResponse = await axios.get(`${BASE_URL}/api/messages/${chatroomId}`);
        console.log("Messages response:", JSON.stringify(messagesResponse.data, null, 2));
        let fetchedMessages = [];
        if (Array.isArray(messagesResponse.data)) {
          fetchedMessages = messagesResponse.data;
        } else if (typeof messagesResponse.data === 'object' && messagesResponse.data !== null) {
          fetchedMessages = Object.values(messagesResponse.data).filter(
            (item) => item && typeof item === 'object' && item._id && item.message
          );
        }
        fetchedMessages = fetchedMessages.map((msg) => ({
          ...msg,
          userId: msg.userId?._id || msg.userId, // Normalize userId to string
        })).filter((msg) => msg.message?.trim() && msg.userId)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(fetchedMessages);
      } catch (error) {
        console.error("Fetch data error:", error.response?.data || error.message);
        setError(error.response?.data?.error || "Failed to load transaction or messages.");
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to load transaction or messages.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        navigate("/transactions/tab");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [chatroomId, navigate, toast]);

  // Log header-related data for debugging
  useEffect(() => {
    console.log("Header Debug Info:", {
      participants: participants,
      creatorDetails: creatorDetails,
      userDetails: userDetails,
      transactionDetails: {
        selectedUserType: transactionDetails.selectedUserType,
        _id: transactionDetails._id,
      },
      headerText: `${transactionDetails.selectedUserType
          ? transactionDetails.selectedUserType.charAt(0).toUpperCase() + transactionDetails.selectedUserType.slice(1)
          : "Unknown Role"
        }: ${isCreator ? `${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim() || userDetails?.email || 'You' : `${creatorDetails?.firstName || ''} ${creatorDetails?.lastName || ''}`.trim() || creatorDetails?.email || 'Unknown'}${isCreator ? ' (You)' : ''}  ${transactionDetails.selectedUserType === 'buyer' ? 'Seller' : transactionDetails.selectedUserType === 'seller' ? 'Buyer' : 'Other'
        }: ${participants?.length > 0 ? `${participants[0]?.firstName || ''} ${participants[0]?.lastName || ''}`.trim() || participants[0]?.email || 'Unknown' : 'No participant'}${participants?.length > 0 && participants[0]?.userId === userDetails._id ? ' (You)' : ''}`,
    });
  }, [participants, creatorDetails, userDetails, transactionDetails]);

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
      randomizationFactor: 0.5,
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
      socketRef.current.emit("join-room", `transaction_${chatroomId}`, userDetails._id);
      setSocketConnected(true);

      // Process pending messages
      if (pendingMessages.length > 0) {
        const messagesToSend = [...pendingMessages];
        setPendingMessages([]);
        messagesToSend.forEach((msg) => {
          axios
            .post(`${BASE_URL}/api/messages/send-message`, msg)
            .then((response) => {
              setMessages((prevMessages) => {
                const serverMessage = response.data._doc || response.data.data || response.data;
                if (!serverMessage.message?.trim() || !serverMessage.userId) {
                  return prevMessages;
                }
                const updatedMessages = prevMessages.map((m) =>
                  m.tempId === msg.tempId
                    ? { ...serverMessage, userId: serverMessage.userId?._id || serverMessage.userId, tempId: m.tempId }
                    : m
                );
                return updatedMessages
                  .filter((m) => m.message?.trim() && m.userId)
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              });
            })
            .catch((error) => {
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

      // Refetch messages on connect
      const refetchMessages = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/api/messages/${chatroomId}`);
          console.log("Refetched messages on socket connect:", JSON.stringify(response.data, null, 2));
          let fetchedMessages = [];
          if (Array.isArray(response.data)) {
            fetchedMessages = response.data;
          } else if (typeof response.data === 'object' && response.data !== null) {
            fetchedMessages = Object.values(response.data).filter(
              (item) => item && typeof item === 'object' && item._id && item.message
            );
          }
          fetchedMessages = fetchedMessages.map((msg) => ({
            ...msg,
            userId: msg.userId?._id || msg.userId, // Normalize userId to string
          })).filter((msg) => msg.message?.trim() && msg.userId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          setMessages(fetchedMessages);
        } catch (error) {
          console.error("Error refetching messages on socket connect:", error.response?.data || error.message);
        }
      };
      refetchMessages();

      const heartbeat = setInterval(() => {
        socketRef.current.emit("ping", { userId: userDetails._id });
      }, 30000);

      socketRef.current.on("pong", () => {
        console.log("Received pong from server");
      });

      return () => clearInterval(heartbeat);
    });

    socketRef.current.on("message", (message) => {
      console.log("Received socket message:", JSON.stringify(message, null, 2));
      if (
        !message.message?.trim() ||
        !message.userId ||
        message.chatroomId !== chatroomId
      ) {
        console.log("Ignoring invalid or irrelevant message:", JSON.stringify(message, null, 2));
        return;
      }

      setMessages((prevMessages) => {
        // Check if the message exists by _id or tempId
        const existingMessage = prevMessages.find(
          (msg) => msg._id === message._id || (msg.tempId && msg.tempId === message.tempId)
        );

        if (existingMessage) {
          console.log("Updating existing message:", existingMessage._id || existingMessage.tempId);
          return prevMessages.map((msg) =>
            (msg._id && msg._id === message._id) || (msg.tempId && msg.tempId === message.tempId)
              ? {
                  ...message,
                  userId: message.userId?._id || message.userId,
                  tempId: msg.tempId || message.tempId, // Preserve tempId if it exists
                }
              : msg
          ).filter((m) => m.message?.trim() && m.userId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }

        // Only add if the message is from another user
        if ((message.userId?._id || message.userId) !== userDetails._id) {
          console.log("Adding new message from other user:", message._id || message.tempId);
          const updatedMessage = {
            ...message,
            userId: message.userId?._id || message.userId,
          };
          return [...prevMessages, updatedMessage]
            .filter((m) => m.message?.trim() && m.userId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }

        console.log("Ignoring own message to prevent duplication:", message._id || message.tempId);
        return prevMessages;
      });
    });

    socketRef.current.on("typing", (data) => {
      if ((data.userId?._id || data.userId) !== userDetails._id && data.chatroomId === chatroomId) {
        setTypingUsers((prev) => {
          if (!prev.some((user) => (user.userId?._id || user.userId) === (data.userId?._id || data.userId))) {
            return [...prev, { ...data, userId: data.userId?._id || data.userId }];
          }
          return prev;
        });
      }
    });

    socketRef.current.on("stop-typing", (data) => {
      if (data.chatroomId === chatroomId) {
        setTypingUsers((prev) => prev.filter((user) => (user.userId?._id || user.userId) !== (data.userId?._id || data.userId)));
      }
    });

    socketRef.current.on("connect_error", (err) => {
      setSocketConnected(false);
      toast({
        title: "Connection Error",
        description: "Failed to connect to chat server. Messages will be queued.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    });

    socketRef.current.on("error", (err) => {
      setSocketConnected(false);
      toast({
        title: "Error",
        description: err.message || "An error occurred in the chat.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    });

    socketRef.current.on("reconnect", () => {
      setSocketConnected(true);
      const refetchMessages = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/api/messages/${chatroomId}`);
          console.log("Refetched messages on reconnect:", JSON.stringify(response.data, null, 2));
          let fetchedMessages = [];
          if (Array.isArray(response.data)) {
            fetchedMessages = response.data;
          } else if (typeof response.data === 'object' && response.data !== null) {
            fetchedMessages = Object.values(response.data).filter(
              (item) => item && typeof item === 'object' && item._id && item.message
            );
          }
          fetchedMessages = fetchedMessages.map((msg) => ({
            ...msg,
            userId: msg.userId?._id || msg.userId, // Normalize userId to string
          })).filter((msg) => m.message?.trim() && m.userId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          setMessages(fetchedMessages);
        } catch (error) {
          console.error("Error refetching messages on reconnect:", error.response?.data || error.message);
        }
      };
      refetchMessages();
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
  }, [chatroomId, userDetails._id, toast]); // Removed pendingMessages from dependencies

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
      }, 3000);
    }
  };

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

    if (!transactionDetails._id || !chatroomId) {
      toast({
        title: "Error",
        description: "Transaction or chatroom details not loaded.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const tempId = uuidv4();
    const newMessage = {
      transactionId: transactionDetails._id,
      chatroomId,
      userId: userDetails._id,
      userFirstName: userDetails.firstName || "User",
      userLastName: userDetails.lastName || "",
      message: message.trim(),
      avatarSeed: userDetails.avatarSeed || userDetails._id,
      timestamp: new Date().toISOString(),
      tempId,
    };

    setMessage("");
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }

    // Optimistic update
    setMessages((prevMessages) => {
      // Ensure no duplicate tempId
      if (prevMessages.some((msg) => msg.tempId === tempId)) {
        console.log("Duplicate tempId detected, skipping optimistic update:", tempId);
        return prevMessages;
      }
      return [...prevMessages, newMessage]
        .filter((m) => m.message?.trim() && m.userId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    });

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

    const maxRetries = 3;
    let attempt = 0;
    const sendMessageWithRetry = async () => {
      try {
        const response = await axios.post(`${BASE_URL}/api/messages/send-message`, newMessage);
        console.log("Send message response:", JSON.stringify(response.data, null, 2));
        setMessages((prevMessages) => {
          const serverMessage = response.data._doc || response.data.data || response.data;
          if (!serverMessage.message?.trim() || !serverMessage.userId) {
            return prevMessages;
          }
          const updatedMessages = prevMessages.map((msg) =>
            msg.tempId === newMessage.tempId
              ? { ...serverMessage, userId: serverMessage.userId?._id || serverMessage.userId, tempId: msg.tempId }
              : msg
          );
          return updatedMessages
            .filter((m) => m.message?.trim() && m.userId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
      } catch (error) {
        console.error("Message send attempt failed:", { attempt, error: error.message });
        if (attempt < maxRetries) {
          attempt++;
          setTimeout(sendMessageWithRetry, 2000 * attempt);
        } else {
          setMessages((prevMessages) =>
            prevMessages.filter((msg) => msg.tempId !== newMessage.tempId)
          );
          toast({
            title: "Error",
            description: error.response?.data?.message || error.response?.data?.error || "Failed to send message after retries.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }
    };

    sendMessageWithRetry();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isCreator = creatorDetails._id === userDetails._id;

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

  // Construct header text similar to TransactionCard
  const creatorName = isCreator
    ? `${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim() || userDetails?.email || 'You'
    : `${creatorDetails?.firstName || ''} ${creatorDetails?.lastName || ''}`.trim() || creatorDetails?.email || 'Unknown';
  const participantName = participants?.length > 0
    ? `${participants[0]?.firstName || ''} ${participants[0]?.lastName || ''}`.trim() || participants[0]?.email || 'Unknown'
    : 'No participant';
  const headerText = `${transactionDetails.selectedUserType
      ? transactionDetails.selectedUserType.charAt(0).toUpperCase() + transactionDetails.selectedUserType.slice(1)
      : 'Unknown Role'
    }: ${creatorName}${isCreator ? ' (You)' : ''}  ${transactionDetails.selectedUserType === 'buyer' ? 'Seller' : transactionDetails.selectedUserType === 'seller' ? 'Buyer' : 'Other'
    }: ${participantName}${participants?.length > 0 && participants[0]?.userId === userDetails._id ? ' (You)' : ''}`;

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
              <p className="font-bold text-sm">{headerText}</p>
            </div>
          </div>
        </div>
        <button
          onClick={toggleInfoPanel}
          className={`p-2 rounded-full ${showInfo ? "bg-[#318AE6]" : "hover:bg-[#28313A]"} transition-colors`}
        >
          <FiInfo size={20} />
        </button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 flex flex-col ${showInfo ? "md:mr-80" : ""} transition-all duration-300`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {participants.length === 0 && isCreator && (
              <div className="p-4 bg-yellow-900 text-yellow-300 text-center rounded-lg">
                No participants yet. Messages will be visible once participants are added.
              </div>
            )}
            {!socketConnected && (
              <div className="p-2 text-center text-yellow-300 bg-yellow-900/50 rounded-lg">
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
                const isSentByCurrentUser = (msg.userId?._id || msg.userId) === userDetails._id;
                const showAvatar = index === 0 || (messages[index - 1].userId?._id || messages[index - 1].userId) !== (msg.userId?._id || msg.userId);
                const isLastInGroup = index === messages.length - 1 || (messages[index + 1].userId?._id || messages[index + 1].userId) !== (msg.userId?._id || msg.userId);
                return (
                  <div
                    key={msg._id || msg.tempId}
                    className={`flex ${isSentByCurrentUser ? "justify-end" : "justify-start"} mb-2`}
                  >
                    <div
                      className={`max-w-[75%] flex ${isSentByCurrentUser ? "flex-row-reverse" : "flex-row"} items-end`}
                    >
                      {showAvatar && (
                        <div className={`flex-shrink-0 ${isSentByCurrentUser ? "ml-2" : "mr-2"}`}>
                          <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-[#28313A]">
                            <img
                              src={getAvatarSvg(msg.avatarSeed, msg.userId?._id || msg.userId)}
                              alt={`${msg.userFirstName || "User"}'s avatar`}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getAvatarSvg("default-user", msg.userId?._id || msg.userId);
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
                            {isSentByCurrentUser ? "You" : `${msg.userFirstName || "User"} ${msg.userLastName || ""}`.trim()}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 break-words ${isSentByCurrentUser ? "bg-[#318AE6] text-white" : "bg-[#28313A] text-gray-100"
                            } ${showAvatar && isLastInGroup ? "rounded-b-2xl" : "rounded-2xl"} ${showAvatar ? isSentByCurrentUser ? "rounded-tr-sm" : "rounded-tl-sm" : ""
                            } ${isLastInGroup ? isSentByCurrentUser ? "rounded-br-sm" : "rounded-bl-sm" : ""}`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <span className="text-xs opacity-70 mt-1 inline-block text-right">
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
                className="flex-1 px-4 py-3 bg-transparent outline-none text-white text-sm"
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
                <div className="flex items-center p-2 hover:bg-[#28313A] rounded-lg transition-colors">
                  <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-[#318AE6] mr-3">
                    <img
                      src={getAvatarSvg(creatorDetails.avatarSeed, creatorDetails._id)}
                      alt={`${creatorDetails.firstName || "User"}'s avatar`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getAvatarSvg("default-user", creatorDetails._id);
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-medium">
                      {`${creatorDetails.firstName || "User"} ${creatorDetails.lastName || ""} (Creator)`}
                    </p>
                    <p className="text-xs text-gray-400">{creatorDetails.email || "N/A"}</p>
                  </div>
                </div>
                {participants.length > 0 ? (
                  participants.map((participant, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 hover:bg-[#28313A] rounded-lg transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-[#318AE6] mr-3">
                        <img
                          src={getAvatarSvg(participant.avatarSeed, participant.userId)}
                          alt={`${participant.firstName || "User"}'s avatar`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getAvatarSvg("default-user", participant.userId);
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{`${participant.firstName || "User"} ${participant.lastName || ""} (${participant.role})`}</p>
                        <p className="text-xs text-gray-400">{participant.email || "N/A"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No additional participants</p>
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