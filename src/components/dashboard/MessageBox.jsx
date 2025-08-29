
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
        const userResponse = await axios.get(`${BASE_URL}/api/users/user-details`);
        setUserDetails(userResponse.data.data.user);

        const transactionResponse = await axios.get(`${BASE_URL}/api/transactions/chatroom/${chatroomId}`);
        const transactionData = transactionResponse.data.data;
        setTransactionDetails(transactionData);

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

        const participantDetails = (transactionData.participants || []).map((p) => ({
          userId: p.userId?._id || p.userId,
          role: p.role,
          firstName: p.userId?.firstName || p.firstName || "User",
          lastName: p.userId?.lastName || p.lastName || "",
          email: p.userId?.email || p.email || "N/A",
          avatarSeed: p.userId?.avatarSeed || p.avatarSeed || p.userId?._id || p.userId,
        })).filter(p => p.userId);
        setParticipants(participantDetails);

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

        const messagesResponse = await axios.get(`${BASE_URL}/api/messages/${chatroomId}`);
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
          userId: msg.userId?._id || msg.userId,
        })).filter((msg) => msg.message?.trim() && msg.userId)
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(fetchedMessages);

        // Mark all message notifications for this chatroom as read
        await markNotificationsAsRead();
      } catch (error) {
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

  // Function to mark notifications as read for the current chatroom
  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("access-token");
      const response = await axios.get(`${BASE_URL}/api/notifications/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const notifications = response.data.data || [];
      const messageNotifications = notifications.filter(
        (n) => n.type === "message" && n.chatroomId === chatroomId && !n.isRead
      );

      for (const notification of messageNotifications) {
        try {
          await axios.patch(
            `${BASE_URL}/api/notifications/notifications/${notification._id}`,
            { isRead: true },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log(`Marked notification as read: ${notification._id}`);
        } catch (error) {
          console.error(`Error marking notification ${notification._id} as read:`, error.response?.data || error.message);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications to mark as read:", error.response?.data || error.message);
    }
  };

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
      socketRef.current.emit("join-room", `transaction_${chatroomId}`, userDetails._id);
      socketRef.current.emit("join-room", `user_${userDetails._id}`);
      setSocketConnected(true);
      console.log('Socket connected:', socketRef.current.id);

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

      const refetchMessages = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/api/messages/${chatroomId}`);
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
            userId: msg.userId?._id || msg.userId,
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
      if (
        !message.message?.trim() ||
        !message.userId ||
        message.chatroomId !== chatroomId
      ) {
        return;
      }

      setMessages((prevMessages) => {
        const existingMessage = prevMessages.find(
          (msg) => msg._id === message._id || (msg.tempId && msg.tempId === message.tempId)
        );

        if (existingMessage) {
          return prevMessages.map((msg) =>
            (msg._id && msg._id === message._id) || (msg.tempId && msg.tempId === message.tempId)
              ? {
                ...message,
                userId: message.userId?._id || message.userId,
                tempId: msg.tempId || message.tempId,
              }
              : msg
          ).filter((m) => m.message?.trim() && m.userId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }

        if ((message.userId?._id || message.userId) !== userDetails._id) {
          const updatedMessage = {
            ...message,
            userId: message.userId?._id || message.userId,
          };
          return [...prevMessages, updatedMessage]
            .filter((m) => m.message?.trim() && m.userId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }

        return prevMessages;
      });

      // Mark notification as read when message is received in the active chatroom
      if ((message.userId?._id || message.userId) !== userDetails._id) {
        markNotificationsAsRead();
      }
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
            userId: msg.userId?._id || msg.userId,
          })).filter((msg) => msg.message?.trim() && msg.userId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          setMessages(fetchedMessages);
        } catch (error) {
          console.error("Error refetching messages on reconnect:", error.response?.data || error.message);
        }
      };
      refetchMessages();
      markNotificationsAsRead();
    });

    socketRef.current.on("newNotification", (notification) => {
      console.log("MessageBox received newNotification:", JSON.stringify(notification, null, 2));
      // Only mark notifications as read if they are for the current chatroom
      if (notification.type === "message" && notification.chatroomId === chatroomId) {
        markNotificationsAsRead();
      }
    });

    return () => {
      socketRef.current.off("message");
      socketRef.current.off("typing");
      socketRef.current.off("stop-typing");
      socketRef.current.off("connect_error");
      socketRef.current.off("error");
      socketRef.current.off("pong");
      socketRef.current.off("reconnect");
      socketRef.current.off("newNotification");
      socketRef.current.disconnect();
      setSocketConnected(false);
    };
  }, [chatroomId, userDetails._id, toast]);

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

    setMessages((prevMessages) => {
      if (prevMessages.some((msg) => msg.tempId === tempId)) {
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

  const creatorName = isCreator
    ? `${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim() || userDetails?.email || 'You'
    : `${creatorDetails?.firstName || ''} ${creatorDetails?.lastName || ''}`.trim() || creatorDetails?.email || 'Unknown';
  const participantName = participants?.length > 0
    ? `${participants[0]?.firstName || ''} ${participants[0]?.lastName || ''}`.trim() || participants[0]?.email || 'Unknown'
    : 'No participant';
  const buyerLabel = transactionDetails.selectedUserType === 'buyer' ? 'Buyer' : 'Seller';
  const sellerLabel = transactionDetails.selectedUserType === 'buyer' ? 'Seller' : 'Buyer';

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
              <p className="text-sm font-medium">
                {buyerLabel}: {transactionDetails.selectedUserType === 'buyer' ? creatorName : participantName}
                {transactionDetails.selectedUserType === 'buyer' && isCreator ? ' (You)' : transactionDetails.selectedUserType !== 'buyer' && participants[0]?.userId === userDetails._id ? ' (You)' : ''}
              </p>
              <p className="text-sm font-medium">
                {sellerLabel}: {transactionDetails.selectedUserType === 'buyer' ? participantName : creatorName}
                {transactionDetails.selectedUserType === 'buyer' && participants[0]?.userId === userDetails._id ? ' (You)' : transactionDetails.selectedUserType !== 'buyer' && isCreator ? ' (You)' : ''}
              </p>
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
                data-quillbot-ignore="true" // Prevent Quillbot interference
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
                      : transactionDetails.status === "canceled"
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