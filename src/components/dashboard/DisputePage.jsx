import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Box, Flex, Text, Select, Input, Button, VStack, HStack, Badge,
  Card, CardBody, CardHeader, Icon, Alert, AlertIcon, AlertTitle,
  AlertDescription, Textarea, useColorModeValue, Container, Heading,
  useToast, SimpleGrid, Spinner, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  useDisclosure, Tabs, TabList, TabPanels, Tab, TabPanel, Avatar, Skeleton
} from "@chakra-ui/react";
import {
  FaExclamationTriangle, FaComments, FaFileUpload, FaPaperPlane,
  FaCheckCircle, FaClock, FaTimesCircle, FaQuestionCircle,
  FaFilePdf, FaTimes, FaPlus, FaHistory, FaArrowLeft, FaBolt,
  FaShieldAlt, FaUsers, FaChartLine
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosConfig"; // Ensure this is your configured axios instance
import io from "socket.io-client";
import { format, isToday, isYesterday } from "date-fns";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Mock data and constants
const STATUS_COLORS = {
  'Open': 'blue', 'Under Review': 'orange', 'Resolved': 'green',
  'Rejected': 'red', 'Cancelled': 'gray'
};

const STATUS_ICONS = {
  'Open': FaExclamationTriangle, 'Under Review': FaClock, 'Resolved': FaCheckCircle,
  'Rejected': FaTimesCircle, 'Cancelled': FaTimes
};

const ROLE_COLORS = {
  'Admin': '#e53e3e', 'Buyer': '#3182ce', 'Seller': '#38a169'
};

const DISPUTE_REASONS = [
  { value: "Non-delivery", label: "Didn't receive my item" },
  { value: "Incomplete service", label: "Service wasn't completed" },
  { value: "Wrong item", label: "Received wrong item" },
  { value: "Damaged item", label: "Item was damaged" },
  { value: "Other", label: "Other issue" }
];

const DisputePage = ({ isAdmin = false }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketInitializingRef = useRef(false);
  const toastShownRef = useRef(false);
  const toastSessionRef = useRef(null);

  // State management
  const [state, setState] = useState({
    disputes: [],
    selectedDispute: null,
    messages: [],
    newMessage: "",
    transactions: [],
    userId: null,
    isLoading: false,
    isLoadingMessages: false,
    isConnected: false,
    isTyping: false,
    typingUsers: [],
    isSessionValid: true,
    error: null
  });

  const [form, setForm] = useState({
    transactionId: "",
    reason: "",
    description: "",
    evidence: []
  });

  // Color scheme (preserved from new code)
  const colors = {
    bg: "#152830",
    cardBg: useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0.05)"),
    textColor: useColorModeValue("gray.700", "gray.100"),
    mutedColor: useColorModeValue("gray.500", "gray.400"),
    chatBg: useColorModeValue("rgba(248, 250, 252, 0.8)", "rgba(26, 32, 44, 0.6)"),
    myMessageBg: "#B8974A",
    otherMessageBg: useColorModeValue("white", "gray.700"),
    adminMessageBg: "#e53e3e",
    buyerMessageBg: "#3182ce",
    sellerMessageBg: "#38a169",
    borderColor: "#373B32",
    hoverBg: "rgba(184, 151, 74, 0.15)",
    brandPrimary: "#B8974A",
    brandSecondary: "#C4A360",
    glassBg: "rgba(255, 255, 255, 0.1)",
    glassHover: "rgba(255, 255, 255, 0.2)"
  };

  // Responsive design system
  const responsive = {
    containerPadding: { base: "4", md: "6", lg: "8", xl: "10" },
    fontSize: {
      xs: { base: "xs", md: "xs", lg: "xs" },
      sm: { base: "sm", md: "sm", lg: "sm" },
      md: { base: "sm", md: "md", lg: "md" },
      lg: { base: "md", md: "lg", lg: "lg" },
      xl: { base: "lg", md: "xl", lg: "xl" },
      "2xl": { base: "xl", md: "2xl", lg: "2xl" }
    },
    spacing: {
      xs: { base: "1", md: "2" },
      sm: { base: "2", md: "3" },
      md: { base: "3", md: "4" },
      lg: { base: "4", md: "6" },
      xl: { base: "6", md: "8" }
    },
    chatWidth: { base: "100%", lg: "400px", xl: "450px" },
    buttonHeight: { base: "10", md: "12" },
    iconSize: { base: "4", md: "5" },
    cardSpacing: { base: "4", md: "6" }
  };

  // Utility functions
  const showToast = useCallback((title, description, status = "info") => {
    const toastKey = `${title}-${description}-${status}`;
    if (toastSessionRef.current === toastKey) return;

    toastSessionRef.current = toastKey;
    toast({
      title, description, status,
      duration: 5000, isClosable: true, position: "top",
      onCloseComplete: () => {
        if (toastSessionRef.current === toastKey) {
          toastSessionRef.current = null;
        }
      }
    });
  }, [toast]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return `Yesterday ${format(date, "HH:mm")}`;
    return format(date, "MMM dd, HH:mm");
  };

  const getStatusColor = (status) => STATUS_COLORS[status] || 'gray';
  const getStatusIcon = (status) => STATUS_ICONS[status] || FaQuestionCircle;

  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const response = await axios({ url: `${BASE_URL}${endpoint}`, ...options });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        setState(prev => ({ ...prev, isSessionValid: false }));
        showToast("Session Expired", "Please log in again.", "warning");
        navigate("/login");
        return null;
      }
      throw error;
    }
  }, [navigate, showToast]);

  // Socket management
  const initializeSocket = useCallback(() => {
    const token = localStorage.getItem("access-token");
    if (!token || !state.userId || socketInitializingRef.current || socketRef.current?.connected) {
      return socketRef.current;
    }

    socketInitializingRef.current = true;
    const socket = io(BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    const socketHandlers = {
      connect: () => {
        socketInitializingRef.current = false;
        setState(prev => ({ ...prev, isConnected: true }));

        if (state.selectedDispute) {
          socket.emit("join-dispute-room", state.selectedDispute._id, state.userId);
        }

        if (!toastShownRef.current) {
          showToast("Connected", "Real-time chat is active", "success");
          toastShownRef.current = true;
        }
      },
      disconnect: (reason) => {
        socketInitializingRef.current = false;
        setState(prev => ({ ...prev, isConnected: false }));

        if (reason !== "io client disconnect" && reason !== "client namespace disconnect") {
          showToast("Disconnected", "Trying to reconnect...", "warning");
        }
      },
      reconnect: () => {
        setState(prev => ({ ...prev, isConnected: true }));
        if (state.selectedDispute) {
          socket.emit("join-dispute-room", state.selectedDispute._id, state.userId);
        }
        if (toastShownRef.current) {
          showToast("Reconnected", "Chat is back online", "success");
        }
      },
      connect_error: (error) => {
        socketInitializingRef.current = false;
        setState(prev => ({ ...prev, isConnected: false }));
      },
      disputeMessage: (message) => {
        if (message.disputeId === state.selectedDispute?._id) {
          setState(prev => {
            const filteredMessages = prev.messages.filter(m =>
              !(m.isOptimistic && m.message === message.message && m.userId._id === state.userId)
            );

            const messageExists = filteredMessages.some(m => m._id === message._id);
            if (messageExists) return prev;

            const newMessage = {
              _id: message._id,
              disputeId: message.disputeId,
              userId: message.userId,
              userRole: message.userRole,
              message: message.message,
              timestamp: message.timestamp,
            };

            return { ...prev, messages: [...filteredMessages, newMessage] };
          });
          setTimeout(scrollToBottom, 100);
        }
      },
      userTyping: ({ userId, disputeId, userName }) => {
        if (disputeId === state.selectedDispute?._id && userId !== state.userId) {
          setState(prev => ({
            ...prev,
            typingUsers: [
              ...prev.typingUsers.filter(u => u.userId !== userId),
              { userId, userName }
            ]
          }));
        }
      },
      userStoppedTyping: ({ userId, disputeId }) => {
        if (disputeId === state.selectedDispute?._id) {
          setState(prev => ({
            ...prev,
            typingUsers: prev.typingUsers.filter(u => u.userId !== userId)
          }));
        }
      }
    };

    Object.entries(socketHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    socketRef.current = socket;
    return socket;
  }, [state.userId, state.selectedDispute, showToast, scrollToBottom]);

  // Data fetching
  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, disputes: [], error: null }));
    try {
      const [userRes, disputesRes, transactionsRes] = await Promise.all([
        apiCall("/api/users/user-details"),
        apiCall(isAdmin ? "/api/disputes/admin/all" : "/api/disputes/my-disputes"),
        apiCall("/api/transactions/get-transaction")
      ]);

      const allDisputes = Array.isArray(disputesRes?.data?.disputes)
        ? disputesRes.data.disputes.filter(d => d && d._id)
        : [];
      const eligibleTransactions = Array.isArray(transactionsRes?.data)
        ? transactionsRes.data.filter(tx => tx && tx._id && tx.status === 'funded')
        : [];

      // Filter disputes to only show those with funded transactions
      const disputes = allDisputes.filter(dispute => {
        const transaction = dispute.transactionId;
        // Check if transaction exists and has funded status
        return transaction && transaction._id && transaction.status === 'funded';
      });

      setState(prev => ({
        ...prev,
        userId: userRes?.data?.user?._id || null,
        disputes,
        transactions: eligibleTransactions,
        isLoading: false,
        error: null
      }));

      if (!disputesRes?.data?.disputes) {
        showToast("Warning", "No disputes found. Please try again.", "warning");
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        disputes: [],
        error: error.message || "Failed to load page data"
      }));
      showToast("Error Loading Data", error.message || "Failed to load page data.", "error");
    }
  }, [apiCall, isAdmin, showToast]);

  const fetchDisputeDetails = useCallback(async (disputeId) => {
    setState(prev => ({ ...prev, isLoadingMessages: true, typingUsers: [], error: null }));
    try {
      const response = await apiCall(`/api/disputes/${disputeId}`);
      if (response?.data) {
        const transaction = response.data.dispute.transactionId;

        const messages = Array.isArray(response.data.messages)
          ? response.data.messages.map(msg => {
            let userRole = "Unknown";

            if (msg.userId?.isAdmin) {
              userRole = "Admin";
            } else if (msg.userRole) {
              userRole = msg.userRole;
            } else {
              const msgUserId = msg.userId?._id || msg.userId;
              const creatorId = transaction.userId?._id || transaction.userId;

              if (msgUserId.toString() === creatorId.toString()) {
                userRole = transaction.selectedUserType === "buyer" ? "Buyer" : "Seller";
              } else {
                const participant = transaction.participants?.find(
                  p => (p.userId?._id || p.userId).toString() === msgUserId.toString()
                );
                if (participant?.role) {
                  userRole = participant.role.charAt(0).toUpperCase() + participant.role.slice(1);
                }
              }
            }

            return {
              ...msg,
              userId: msg.userId || { _id: msg.userId, firstName: "Unknown", lastName: "User" },
              userRole,
            };
          })
          : [];

        setState(prev => ({
          ...prev,
          selectedDispute: response.data.dispute,
          messages,
          isLoadingMessages: false,
          error: null,
        }));

        if (socketRef.current?.connected) {
          socketRef.current.emit("join-dispute-room", disputeId, state.userId);
        }

        setTimeout(scrollToBottom, 100);
      } else {
        throw new Error("Invalid dispute data received");
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingMessages: false,
        selectedDispute: null,
        messages: [],
        error: error.message || "Failed to load dispute details",
      }));
      showToast("Error", "Failed to load dispute details.", "error");
    }
  }, [apiCall, state.userId, scrollToBottom, showToast]);

  const handleSendMessage = async () => {
    if (!state.newMessage.trim() || !state.selectedDispute) return;

    if (!state.isConnected && socketRef.current) {
      socketRef.current.connect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!socketRef.current?.connected) {
        showToast("Error", "Unable to connect to chat server. Please try again.", "error");
        return;
      }
    }

    const messageText = state.newMessage.trim();
    const tempMessageId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempMessageId,
      disputeId: state.selectedDispute._id,
      userId: { _id: state.userId, firstName: "You", lastName: "", isAdmin: false },
      userRole: "You",
      message: messageText,
      timestamp: new Date().toISOString(),
      isOptimistic: true,
      isLoading: false
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, optimisticMessage],
      newMessage: ""
    }));

    setTimeout(scrollToBottom, 100);

    try {
      await apiCall(`/api/disputes/${state.selectedDispute._id}/messages`, {
        method: "POST",
        data: { message: messageText }
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m._id !== tempMessageId),
        newMessage: messageText
      }));
      showToast("Error", "Failed to send message. Please try again.", "error");
    }
  };

  // Components (preserved from new code)
  const StatsCard = ({ icon, title, value, color }) => (
    <Box
      bg={colors.glassBg}
      backdropFilter="blur(20px)"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.2)"
      borderRadius="3xl"
      p={responsive.spacing.lg}
      _hover={{
        bg: colors.glassHover,
        transform: "translateY(-4px)",
        shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
      transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      cursor="pointer"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="-50%"
        right="-50%"
        w="200%"
        h="200%"
        bg={`radial-gradient(circle, ${color}22 0%, transparent 70%)`}
        opacity={0.3}
        pointerEvents="none"
      />
      <HStack spacing={responsive.spacing.md} position="relative" zIndex={1}>
        <Box
          p={responsive.spacing.sm}
          borderRadius="2xl"
          bg={`${color}20`}
          border="1px solid"
          borderColor={`${color}40`}
        >
          <Icon as={icon} boxSize={responsive.iconSize} color={color} />
        </Box>
        <VStack align="start" spacing={0}>
          <Text fontSize={responsive.fontSize.xs} color={colors.mutedColor} fontWeight="500">
            {title}
          </Text>
          <Text fontSize={responsive.fontSize.xl} fontWeight="800" color={colors.textColor}>
            {value}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );

  const QuickActions = () => (
    <VStack spacing={responsive.spacing.lg} align="stretch">
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={responsive.spacing.md}>
        <StatsCard
          icon={FaExclamationTriangle}
          title="Active Disputes"
          value={state.disputes.filter(d => ['Open', 'Under Review'].includes(d.status)).length}
          color={colors.brandPrimary}
        />
        <StatsCard
          icon={FaCheckCircle}
          title="Resolved"
          value={state.disputes.filter(d => d.status === 'Resolved').length}
          color="#38A169"
        />
        <StatsCard
          icon={FaUsers}
          title="Total Cases"
          value={state.disputes.length}
          color="#3182ce"
        />
        <StatsCard
          icon={FaBolt}
          title="Response Time"
          value="2.4h"
          color="#e53e3e"
        />
      </SimpleGrid>

      <Box
        bg={colors.glassBg}
        backdropFilter="blur(30px)"
        borderRadius="3xl"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.2)"
        p={responsive.spacing.lg}
        shadow="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={responsive.spacing.md}>
          <HStack spacing={responsive.spacing.md}>
            <Button
              leftIcon={<FaArrowLeft />}
              variant="ghost"
              color={colors.brandPrimary}
              h={responsive.buttonHeight}
              px={responsive.spacing.lg}
              borderRadius="2xl"
              fontSize={responsive.fontSize.sm}
              bg="rgba(184, 151, 74, 0.1)"
              border="1px solid"
              borderColor="rgba(184, 151, 74, 0.3)"
              _hover={{
                bg: "rgba(184, 151, 74, 0.2)",
                transform: "translateY(-2px)",
                borderColor: colors.brandPrimary
              }}
              transition="all 0.3s ease"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
            <Button
              leftIcon={<FaPlus />}
              bg={`linear-gradient(135deg, ${colors.brandPrimary}, ${colors.brandSecondary})`}
              color="white"
              onClick={onOpen}
              h={responsive.buttonHeight}
              px={responsive.spacing.xl}
              borderRadius="2xl"
              fontSize={responsive.fontSize.sm}
              shadow="0 10px 15px -3px rgba(184, 151, 74, 0.4)"
              _hover={{
                transform: "translateY(-3px)",
                shadow: "0 20px 25px -5px rgba(184, 151, 74, 0.5)"
              }}
              transition="all 0.3s ease"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: "absolute",
                top: 0,
                left: "-100%",
                width: "100%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                transition: "left 0.5s"
              }}
            >
              Create Dispute
            </Button>
          </HStack>

          <HStack spacing={responsive.spacing.md}>
            <Badge
              bg={state.isConnected ? "#38A169" : "#E53E3E"}
              color="white"
              px={responsive.spacing.md}
              py={responsive.spacing.sm}
              borderRadius="full"
              fontSize={responsive.fontSize.xs}
              display="flex"
              alignItems="center"
              gap={1}
              shadow="0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            >
              <Box
                w={2}
                h={2}
                borderRadius="full"
                bg="currentColor"
                animation={state.isConnected ? "pulse 2s infinite" : "none"}
              />
              {state.isConnected ? "Live" : "Offline"}
            </Badge>
          </HStack>
        </Flex>
      </Box>
    </VStack>
  );

  const MessageBubble = ({ message, isOwn }) => {
    const userRole = message.userRole || (message.userId?.isAdmin ? 'Admin' : 'Unknown');
    const messageBgColor = isOwn ? colors.myMessageBg : ROLE_COLORS[userRole] || colors.otherMessageBg;

    return (
      <Flex justify={isOwn ? "flex-end" : "flex-start"} mb={responsive.spacing.md} align="flex-end">
        {!isOwn && (
          <Avatar
            size="sm"
            name={`${message.userId?.firstName || 'U'} ${message.userId?.lastName || 'U'}`}
            mr={responsive.spacing.sm}
            mb={1}
            bg={ROLE_COLORS[userRole] || colors.brandPrimary}
            color="white"
            border="2px solid"
            borderColor="rgba(255, 255, 255, 0.2)"
          />
        )}
        <Box
          maxW="75%"
          bg={messageBgColor}
          color={isOwn || ['Admin', 'Buyer', 'Seller'].includes(userRole) ? "white" : colors.textColor}
          px={responsive.spacing.md}
          py={responsive.spacing.sm}
          borderRadius={isOwn ? "24px 24px 8px 24px" : "24px 24px 24px 8px"}
          shadow="0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
          position="relative"
          opacity={message.isLoading ? 0.7 : 1}
          _before={!isOwn ? {
            content: '""',
            position: "absolute",
            top: "50%",
            left: "-6px",
            transform: "translateY(-50%)",
            width: 0,
            height: 0,
            borderStyle: "solid",
            borderWidth: "6px 6px 6px 0",
            borderColor: `transparent ${messageBgColor} transparent transparent`
          } : {}}
          _after={isOwn ? {
            content: '""',
            position: "absolute",
            top: "50%",
            right: "-6px",
            transform: "translateY(-50%)",
            width: 0,
            height: 0,
            borderStyle: "solid",
            borderWidth: "6px 0 6px 6px",
            borderColor: `transparent transparent transparent ${messageBgColor}`
          } : {}}
        >
          {!isOwn && (
            <HStack mb={responsive.spacing.xs} spacing={responsive.spacing.sm}>
              <Text fontSize={responsive.fontSize.xs} fontWeight="700" opacity={0.9}>
                {message.userId?.firstName || 'Unknown'} {message.userId?.lastName || 'User'}
              </Text>
              <Badge
                size="sm"
                bg="whiteAlpha.300"
                color="white"
                fontSize={responsive.fontSize.xs}
                fontWeight="600"
                borderRadius="full"
              >
                {userRole}
              </Badge>
            </HStack>
          )}

          {message.isLoading ? (
            <HStack spacing={responsive.spacing.sm} align="center">
              <Spinner size="sm" color="white" thickness="2px" />
              <Text fontSize={responsive.fontSize.sm} wordBreak="break-word">
                Sending...
              </Text>
            </HStack>
          ) : (
            <Text fontSize={responsive.fontSize.sm} wordBreak="break-word" lineHeight="1.5">
              {message.message}
            </Text>
          )}

          <Text fontSize={responsive.fontSize.xs} opacity={0.7} mt={responsive.spacing.xs}>
            {message.isLoading ? "Now" : formatMessageTime(message.timestamp)}
          </Text>
        </Box>
      </Flex>
    );
  };

  const DisputeCard = ({ dispute }) => {
    const StatusIcon = getStatusIcon(dispute.status);
    const isSelected = state.selectedDispute?._id === dispute._id;
    const transaction = dispute.transactionId;
    const creator = transaction?.userId;
    const participant = transaction?.participants?.[0]?.userId;

    return (
      <Box
        cursor="pointer"
        onClick={() => fetchDisputeDetails(dispute._id)}
        position="relative"
        _hover={{ transform: "translateY(-8px)" }}
        transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <Box
          bg={colors.glassBg}
          backdropFilter="blur(20px)"
          border="2px solid"
          borderColor={isSelected ? colors.brandPrimary : "rgba(255, 255, 255, 0.2)"}
          borderRadius="3xl"
          p={responsive.spacing.lg}
          shadow={isSelected ?
            `0 25px 50px -12px rgba(184, 151, 74, 0.4)` :
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }
          _hover={{
            borderColor: colors.brandPrimary,
            shadow: "0 25px 50px -12px rgba(184, 151, 74, 0.3), 0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top="-50%"
            right="-50%"
            w="200%"
            h="200%"
            bg={`conic-gradient(from 0deg, ${colors.brandPrimary}10, transparent, ${colors.brandSecondary}10)`}
            opacity={0.3}
            pointerEvents="none"
          />

          <VStack align="stretch" spacing={responsive.spacing.md} position="relative" zIndex={1}>
            <HStack justify="space-between">
              <Badge
                colorScheme={getStatusColor(dispute.status)}
                px={responsive.spacing.md}
                py={responsive.spacing.sm}
                borderRadius="full"
                fontSize={responsive.fontSize.xs}
                display="flex"
                alignItems="center"
                gap={2}
                shadow="0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.2)"
              >
                <Icon as={StatusIcon} boxSize={3} />
                {dispute.status}
              </Badge>
              <Text fontSize={responsive.fontSize.xs} color={colors.mutedColor} fontWeight="500">
                {format(new Date(dispute.updatedAt), "MMM dd")}
              </Text>
            </HStack>

            <Box>
              <Text
                fontWeight="800"
                fontSize={responsive.fontSize.lg}
                mb={responsive.spacing.sm}
                color={colors.textColor}
                bgGradient={`linear(to-r, ${colors.textColor}, ${colors.brandPrimary})`}
                bgClip="text"
              >
                {dispute.reason}
              </Text>

              <VStack align="stretch" spacing={responsive.spacing.sm} mb={responsive.spacing.md}>
                <HStack justify="space-between">
                  <Text fontSize={responsive.fontSize.sm} color={colors.textColor} fontWeight="600">
                    {transaction?.reference || transaction?._id?.slice(-8) || 'Unknown'}
                  </Text>
                  <Text
                    fontSize={responsive.fontSize.md}
                    color={colors.brandPrimary}
                    fontWeight="800"
                    textShadow="0 0 10px rgba(184, 151, 74, 0.3)"
                  >
                    ₦{(transaction?.paymentAmount || 0).toLocaleString('en-NG')}
                  </Text>
                </HStack>

                {transaction?.productDetails?.description && (
                  <Box
                    bg="rgba(255, 255, 255, 0.1)"
                    p={responsive.spacing.sm}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.2)"
                  >
                    <Text fontSize={responsive.fontSize.sm} color={colors.textColor} noOfLines={2}>
                      {transaction.productDetails.description}
                    </Text>
                  </Box>
                )}

                <HStack justify="space-between" fontSize={responsive.fontSize.sm}>
                  <VStack align="start" spacing={1}>
                    <Text color={colors.mutedColor} fontSize={responsive.fontSize.xs}>Seller</Text>
                    <Text color={colors.textColor} fontWeight="600">
                      {creator?.firstName || 'Unknown'} {creator?.lastName || ''}
                    </Text>
                  </VStack>
                  <VStack align="end" spacing={1}>
                    <Text color={colors.mutedColor} fontSize={responsive.fontSize.xs}>Buyer</Text>
                    <Text color={colors.textColor} fontWeight="600">
                      {participant?.firstName || 'Unknown'} {participant?.lastName || ''}
                    </Text>
                  </VStack>
                </HStack>
              </VStack>

              <Text
                fontSize={responsive.fontSize.sm}
                color={colors.mutedColor}
                noOfLines={2}
                mb={responsive.spacing.md}
                lineHeight="1.5"
              >
                {dispute.description}
              </Text>
            </Box>

            <HStack
              fontSize={responsive.fontSize.sm}
              color={colors.brandPrimary}
              fontWeight="700"
              justify="center"
              p={responsive.spacing.sm}
              bg="rgba(184, 151, 74, 0.1)"
              borderRadius="xl"
              border="1px solid"
              borderColor="rgba(184, 151, 74, 0.2)"
              _hover={{ bg: "rgba(184, 151, 74, 0.2)" }}
              transition="all 0.3s ease"
            >
              <Icon as={FaComments} boxSize={responsive.iconSize} />
              <Text>Open Chat</Text>
            </HStack>
          </VStack>
        </Box>
      </Box>
    );
  };

  const EmptyState = ({ title, description, showCreateButton = false }) => (
    <Box
      bg={colors.glassBg}
      backdropFilter="blur(30px)"
      borderRadius="3xl"
      shadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.2)"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        w="400px"
        h="400px"
        bg={`radial-gradient(circle, ${colors.brandPrimary}15 0%, transparent 70%)`}
        pointerEvents="none"
      />

      <VStack textAlign="center" py={responsive.spacing.xl} spacing={responsive.spacing.lg} position="relative" zIndex={1}>
        <Box
          p={responsive.spacing.lg}
          borderRadius="full"
          bg={showCreateButton ? "rgba(184, 151, 74, 0.1)" : "rgba(56, 161, 105, 0.1)"}
          border="2px solid"
          borderColor={showCreateButton ? "rgba(184, 151, 74, 0.3)" : "rgba(56, 161, 105, 0.3)"}
        >
          <Icon
            as={showCreateButton ? FaExclamationTriangle : FaCheckCircle}
            boxSize={responsive.spacing.xl}
            color={showCreateButton ? colors.brandPrimary : "#38A169"}
          />
        </Box>

        <VStack spacing={responsive.spacing.sm}>
          <Text fontSize={responsive.fontSize.xl} fontWeight="800" color={colors.textColor}>
            {title}
          </Text>
          <Text color={colors.mutedColor} fontSize={responsive.fontSize.lg} maxW="md">
            {description}
          </Text>
        </VStack>

        {showCreateButton && (
          <Button
            bg={`linear-gradient(135deg, ${colors.brandPrimary}, ${colors.brandSecondary})`}
            color="white"
            leftIcon={<FaPlus />}
            onClick={onOpen}
            borderRadius="2xl"
            h={responsive.buttonHeight}
            px={responsive.spacing.xl}
            fontSize={responsive.fontSize.md}
            shadow="0 10px 15px -3px rgba(184, 151, 74, 0.4)"
            _hover={{
              transform: "translateY(-2px)",
              shadow: "0 20px 25px -5px rgba(184, 151, 74, 0.5)"
            }}
          >
            Create Your First Dispute
          </Button>
        )}
      </VStack>
    </Box>
  );

  // Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (state.userId) {
      initializeSocket();
    }
    return () => {
      socketRef.current?.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [state.userId, initializeSocket]);

  useEffect(() => {
    if (state.userId && !socketRef.current?.connected) {
      const socket = initializeSocket();
      return () => {
        if (socket) {
          socket.disconnect();
          socketRef.current = null;
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socketInitializingRef.current = false;
        toastShownRef.current = false;
      };
    }
  }, [state.userId, initializeSocket]);

  // Error state
  if (state.error || !Array.isArray(state.disputes)) {
    return (
      <Box bg={colors.bg} minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={responsive.spacing.lg}>
          <Box position="relative">
            <Icon as={FaExclamationTriangle} boxSize={responsive.spacing.xl} color={colors.brandPrimary} />
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w="80px"
              h="80px"
              borderRadius="full"
              bg={`radial-gradient(circle, ${colors.brandPrimary}20 0%, transparent 70%)`}
              animation="pulse 2s infinite"
            />
          </Box>
          <Text fontSize={responsive.fontSize.xl} color={colors.textColor} fontWeight="700">
            Error Loading Disputes
          </Text>
          <Text fontSize={responsive.fontSize.md} color={colors.mutedColor}>
            {state.error || "An unexpected error occurred. Please try again."}
          </Text>
          <Button
            bg={`linear-gradient(135deg, ${colors.brandPrimary}, ${colors.brandSecondary})`}
            color="white"
            onClick={fetchData}
            borderRadius="2xl"
            h={responsive.buttonHeight}
            px={responsive.spacing.lg}
            fontSize={responsive.fontSize.sm}
            shadow="0 10px 15px -3px rgba(184, 151, 74, 0.4)"
            _hover={{
              transform: "translateY(-2px)",
              shadow: "0 20px 25px -5px rgba(184, 151, 74, 0.5)"
            }}
          >
            Retry
          </Button>
        </VStack>
      </Box>
    );
  }

  // Loading state
  if (state.isLoading) {
    return (
      <Box bg={colors.bg} minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={responsive.spacing.lg}>
          <Box position="relative">
            <Spinner size="xl" color={colors.brandPrimary} thickness="4px" />
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w="80px"
              h="80px"
              borderRadius="full"
              bg={`radial-gradient(circle, ${colors.brandPrimary}20 0%, transparent 70%)`}
              animation="pulse 2s infinite"
            />
          </Box>
          <Text fontSize={responsive.fontSize.xl} color={colors.textColor} fontWeight="700">
            Loading your disputes...
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box bg={colors.bg} minH="100vh" position="relative" overflow="hidden">
      <Box
        position="fixed"
        top="-50%"
        left="-50%"
        w="200%"
        h="200%"
        bg={`conic-gradient(from 0deg, ${colors.brandPrimary}05, transparent, ${colors.brandSecondary}05, transparent)`}
        animation="spin 60s linear infinite"
        pointerEvents="none"
        zIndex={0}
      />

      <Flex position="relative" zIndex={1}>
        <Box flex={1} mr={state.selectedDispute ? { base: 0, lg: responsive.chatWidth } : 0} transition="all 0.4s ease">
          <Container maxW="7xl" py={responsive.spacing.xl} px={responsive.containerPadding}>
            <VStack spacing={responsive.spacing.xl} align="stretch">
              <Box textAlign="center" py={responsive.spacing.lg} position="relative">
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w="300px"
                  h="300px"
                  bg={`radial-gradient(circle, ${colors.brandPrimary}10 0%, transparent 70%)`}
                  pointerEvents="none"
                />

                <Heading
                  fontSize={responsive.fontSize["2xl"]}
                  mb={responsive.spacing.md}
                  bgGradient={`linear(45deg, ${colors.brandPrimary}, ${colors.brandSecondary}, ${colors.brandPrimary})`}
                  bgClip="text"
                  fontWeight="900"
                  position="relative"
                  textShadow="0 0 30px rgba(184, 151, 74, 0.3)"
                >
                  {isAdmin ? "Dispute Management Center" : "Dispute Resolution"}
                </Heading>
                <Text
                  color={colors.mutedColor}
                  fontSize={responsive.fontSize.lg}
                  maxW="4xl"
                  mx="auto"
                  lineHeight="1.6"
                  position="relative"
                >
                  {isAdmin
                    ? "Streamline dispute resolution with our intelligent management system. Monitor, communicate, and resolve customer issues efficiently."
                    : "Your trusted partner in transaction security. We ensure every dispute is handled with care, transparency, and speed. Only funded transactions can be disputed."
                  }
                </Text>
              </Box>

              <QuickActions />

              <Box
                bg={colors.glassBg}
                backdropFilter="blur(30px)"
                borderRadius="3xl"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.2)"
                shadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                overflow="hidden"
                position="relative"
              >
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  right="0"
                  h="1px"
                  bg={`linear-gradient(90deg, transparent, ${colors.brandPrimary}60, transparent)`}
                />

                <Tabs variant="unstyled" p={responsive.spacing.lg}>
                  <TabList
                    mb={responsive.spacing.xl}
                    bg="rgba(255, 255, 255, 0.05)"
                    p={responsive.spacing.sm}
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    position="relative"
                    overflow="hidden"
                  >
                    <Box
                      position="absolute"
                      top="0"
                      left="0"
                      right="0"
                      bottom="0"
                      bg={`linear-gradient(135deg, ${colors.brandPrimary}10, ${colors.brandSecondary}10)`}
                      pointerEvents="none"
                    />

                    <Tab
                      borderRadius="xl"
                      fontWeight="800"
                      fontSize={responsive.fontSize.sm}
                      px={responsive.spacing.xl}
                      py={responsive.spacing.md}
                      color={colors.mutedColor}
                      position="relative"
                      _selected={{
                        color: "white",
                        bg: `linear-gradient(135deg, ${colors.brandPrimary}, ${colors.brandSecondary})`,
                        shadow: "0 10px 15px -3px rgba(184, 151, 74, 0.4)",
                        transform: "translateY(-2px)"
                      }}
                      _hover={{
                        color: colors.textColor,
                        bg: "rgba(255, 255, 255, 0.1)"
                      }}
                      transition="all 0.3s ease"
                    >
                      <HStack spacing={2}>
                        <Icon as={FaBolt} />
                        <Text>Active Disputes</Text>
                        <Badge
                          bg={colors.brandPrimary}
                          color="white"
                          borderRadius="full"
                          px={2}
                          fontSize="xs"
                        >
                          {state.disputes.filter(d => ['Open', 'Under Review'].includes(d.status)).length}
                        </Badge>
                      </HStack>
                    </Tab>

                    <Tab
                      borderRadius="xl"
                      fontWeight="800"
                      fontSize={responsive.fontSize.sm}
                      px={responsive.spacing.xl}
                      py={responsive.spacing.md}
                      color={colors.mutedColor}
                      position="relative"
                      _selected={{
                        color: "white",
                        bg: `linear-gradient(135deg, ${colors.brandPrimary}, ${colors.brandSecondary})`,
                        shadow: "0 10px 15px -3px rgba(184, 151, 74, 0.4)",
                        transform: "translateY(-2px)"
                      }}
                      _hover={{
                        color: colors.textColor,
                        bg: "rgba(255, 255, 255, 0.1)"
                      }}
                      transition="all 0.3s ease"
                    >
                      <HStack spacing={2}>
                        <Icon as={FaHistory} />
                        <Text>All Cases</Text>
                        <Badge
                          bg="rgba(255, 255, 255, 0.2)"
                          color="white"
                          borderRadius="full"
                          px={2}
                          fontSize="xs"
                        >
                          {state.disputes.length}
                        </Badge>
                      </HStack>
                    </Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel px={0}>
                      <SimpleGrid
                        columns={{ base: 1, md: 2, xl: state.selectedDispute ? 2 : 3 }}
                        spacing={responsive.spacing.lg}
                      >
                        {state.disputes
                          .filter(d => ['Open', 'Under Review'].includes(d.status))
                          .map(dispute => <DisputeCard key={dispute._id} dispute={dispute} />)
                        }
                      </SimpleGrid>
                      {state.disputes.filter(d => ['Open', 'Under Review'].includes(d.status)).length === 0 && (
                        <EmptyState
                          title="All Clear!"
                          description="No active disputes at the moment. Your transactions are running smoothly!"
                        />
                      )}
                    </TabPanel>

                    <TabPanel px={0}>
                      <SimpleGrid
                        columns={{ base: 1, md: 2, xl: state.selectedDispute ? 2 : 3 }}
                        spacing={responsive.spacing.lg}
                      >
                        {state.disputes.map(dispute => <DisputeCard key={dispute._id} dispute={dispute} />)}
                      </SimpleGrid>
                      {state.disputes.length === 0 && (
                        <EmptyState
                          title="Ready to Help"
                          description="No disputes yet! When you need assistance with a transaction, we'll be here to help resolve any issues quickly and fairly."
                          showCreateButton={true}
                        />
                      )}
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Box>
            </VStack>
          </Container>
        </Box>

        {state.selectedDispute && (
          <Box
            position="fixed"
            right={0}
            top={0}
            w={responsive.chatWidth}
            h="100vh"
            bg={colors.glassBg}
            backdropFilter="blur(40px)"
            shadow="0 25px 50px -12px rgba(0, 0, 0, 0.4)"
            borderLeft="1px solid"
            borderColor="rgba(255, 255, 255, 0.2)"
            zIndex={1000}
            display="flex"
            flexDirection="column"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg={`linear-gradient(180deg, ${colors.brandPrimary}05 0%, transparent 50%, ${colors.brandSecondary}05 100%)`}
              pointerEvents="none"
            />

            <Box
              p={responsive.spacing.lg}
              borderBottom="1px solid"
              borderColor="rgba(255, 255, 255, 0.1)"
              position="relative"
              zIndex={2}
              bg="rgba(255, 255, 255, 0.05)"
              backdropFilter="blur(20px)"
            >
              <HStack justify="space-between" mb={responsive.spacing.md}>
                <Button
                  size="sm"
                  variant="ghost"
                  color={colors.brandPrimary}
                  onClick={() => setState(prev => ({ ...prev, selectedDispute: null, messages: [] }))}
                  borderRadius="xl"
                  leftIcon={<FaArrowLeft />}
                  fontSize={responsive.fontSize.sm}
                  bg="rgba(184, 151, 74, 0.1)"
                  border="1px solid"
                  borderColor="rgba(184, 151, 74, 0.2)"
                  _hover={{
                    bg: "rgba(184, 151, 74, 0.2)",
                    transform: "translateX(-2px)"
                  }}
                  transition="all 0.3s ease"
                >
                  Back
                </Button>

                <HStack spacing={2}>
                  <Badge
                    bg={state.isConnected ? "#38A169" : "#E53E3E"}
                    color="white"
                    px={responsive.spacing.md}
                    py={responsive.spacing.sm}
                    borderRadius="full"
                    fontSize={responsive.fontSize.xs}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    shadow="0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.2)"
                  >
                    <Box
                      w={2}
                      h={2}
                      borderRadius="full"
                      bg="currentColor"
                      animation={state.isConnected ? "pulse 2s infinite" : "none"}
                    />
                    {state.isConnected ? "Live Support" : "Connecting..."}
                  </Badge>
                </HStack>
              </HStack>

              <HStack spacing={responsive.spacing.sm}>
                <Box
                  p={responsive.spacing.sm}
                  borderRadius="xl"
                  bg="rgba(184, 151, 74, 0.2)"
                  border="1px solid"
                  borderColor="rgba(184, 151, 74, 0.3)"
                >
                  <Icon as={FaShieldAlt} color={colors.brandPrimary} boxSize={responsive.iconSize} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize={responsive.fontSize.md} fontWeight="800" color={colors.textColor}>
                    Secure Chat
                  </Text>
                  <Text fontSize={responsive.fontSize.xs} color={colors.mutedColor}>
                    End-to-end encrypted
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box
              flex={1}
              overflowY="auto"
              p={responsive.spacing.lg}
              position="relative"
              zIndex={1}
            >
              {state.isLoadingMessages ? (
                <VStack spacing={responsive.spacing.lg}>
                  {[1, 2, 3].map(i => (
                    <Box key={i} w="full">
                      <HStack spacing={3} justify={i % 2 === 0 ? "flex-start" : "flex-end"}>
                        {i % 2 === 0 && <Skeleton w="40px" h="40px" borderRadius="full" />}
                        <Skeleton
                          h="60px"
                          w="70%"
                          borderRadius="2xl"
                          startColor="rgba(255, 255, 255, 0.1)"
                          endColor="rgba(255, 255, 255, 0.2)"
                        />
                        {i % 2 !== 0 && <Skeleton w="40px" h="40px" borderRadius="full" />}
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              ) : state.messages.length === 0 ? (
                <VStack spacing={responsive.spacing.xl} py={responsive.spacing.xl} textAlign="center">
                  <Box
                    p={responsive.spacing.xl}
                    borderRadius="full"
                    bg="rgba(184, 151, 74, 0.1)"
                    border="2px solid"
                    borderColor="rgba(184, 151, 74, 0.2)"
                  >
                    <Icon as={FaComments} boxSize={responsive.spacing.xl} color={colors.brandPrimary} />
                  </Box>
                  <VStack spacing={responsive.spacing.sm}>
                    <Text fontSize={responsive.fontSize.lg} fontWeight="800" color={colors.textColor}>
                      Start the Conversation
                    </Text>
                    <Text fontSize={responsive.fontSize.sm} color={colors.mutedColor} maxW="sm">
                      Our support team is ready to help resolve your dispute. Share your concerns and we'll work together to find a solution.
                    </Text>
                  </VStack>
                </VStack>
              ) : (
                <VStack spacing={responsive.spacing.md} align="stretch">
                  {state.messages.map((msg, index) => {
                    const messageKey = msg._id && msg._id !== 'undefined' ? msg._id : `msg-${index}-${msg.timestamp}`;
                    return (
                      <MessageBubble
                        key={messageKey}
                        message={msg}
                        isOwn={msg.userId?._id === state.userId}
                      />
                    );
                  })}
                  {state.typingUsers.length > 0 && (
                    <Text fontSize={responsive.fontSize.xs} color={colors.mutedColor} mt={2}>
                      {state.typingUsers.map(u => u.userName).join(", ")} typing...
                    </Text>
                  )}
                  <div ref={messagesEndRef} />
                </VStack>
              )}
            </Box>

            <Box
              p={responsive.spacing.lg}
              borderTop="1px solid"
              borderColor="rgba(255, 255, 255, 0.1)"
              bg="rgba(255, 255, 255, 0.05)"
              backdropFilter="blur(20px)"
              position="relative"
              zIndex={2}
            >
              <VStack spacing={responsive.spacing.sm}>
                <HStack spacing={responsive.spacing.sm} w="full">
                  <Box position="relative" flex={1}>
                    <Input
                      value={state.newMessage}
                      onChange={(e) => {
                        setState(prev => ({ ...prev, newMessage: e.target.value }));

                        if (socketRef.current?.connected && state.selectedDispute) {
                          socketRef.current.emit('userTyping', {
                            disputeId: state.selectedDispute._id,
                            userId: state.userId,
                            userName: "You"
                          });

                          if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                          }

                          typingTimeoutRef.current = setTimeout(() => {
                            if (socketRef.current?.connected) {
                              socketRef.current.emit('userStoppedTyping', {
                                disputeId: state.selectedDispute._id,
                                userId: state.userId
                              });
                            }
                          }, 1000);
                        }
                      }}
                      placeholder={!state.isConnected ? "Connecting..." : "Type your message..."}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={!state.isConnected}
                      h={responsive.buttonHeight}
                      borderRadius="2xl"
                      bg="rgba(255, 255, 255, 0.1)"
                      border="1px solid"
                      borderColor="rgba(255, 255, 255, 0.2)"
                      fontSize={responsive.fontSize.sm}
                      color={colors.textColor}
                      _placeholder={{ color: colors.mutedColor }}
                      _focus={{
                        borderColor: colors.brandPrimary,
                        boxShadow: `0 0 0 1px ${colors.brandPrimary}`,
                        bg: "rgba(255, 255, 255, 0.15)"
                      }}
                    />
                  </Box>

                  <Button
                    onClick={handleSendMessage}
                    bg={`linear-gradient(135deg, ${colors.brandPrimary}, ${colors.brandSecondary})`}
                    color="white"
                    isDisabled={!state.newMessage.trim() || !state.isConnected}
                    h={responsive.buttonHeight}
                    w={responsive.buttonHeight}
                    borderRadius="2xl"
                    shadow="0 10px 15px -3px rgba(184, 151, 74, 0.4)"
                    _hover={{
                      transform: "scale(1.05) translateY(-2px)",
                      shadow: "0 20px 25px -5px rgba(184, 151, 74, 0.5)"
                    }}
                    _disabled={{
                      opacity: 0.5,
                      cursor: "not-allowed",
                      transform: "none",
                      _hover: { transform: "none" }
                    }}
                    transition="all 0.3s ease"
                  >
                    <Icon as={FaPaperPlane} boxSize={responsive.iconSize} />
                  </Button>
                </HStack>

                <Text
                  fontSize={responsive.fontSize.xs}
                  color={colors.mutedColor}
                  textAlign="center"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={2}
                >
                  <Icon as={FaShieldAlt} />
                  {state.isConnected ? "Secure • Press Enter to send" : "Establishing secure connection..."}
                </Text>
              </VStack>
            </Box>
          </Box>
        )}
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
        <ModalOverlay
          backdropFilter="blur(20px)"
          bg="rgba(0, 0, 0, 0.6)"
        />
        <ModalContent
          borderRadius="3xl"
          mx={responsive.containerPadding}
          bg={colors.glassBg}
          backdropFilter="blur(40px)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.2)"
          shadow="0 25px 50px -12px rgba(0, 0, 0, 0.4)"
        // overflow="hidden"
        >
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg={`linear-gradient(135deg, ${colors.brandPrimary}05, transparent, ${colors.brandSecondary}05)`}
            pointerEvents="none"
            zIndex={-1}
          />

          <ModalHeader pb={responsive.spacing.sm} position="relative" zIndex={1}>
            <HStack spacing={responsive.spacing.md}>
              <Box
                p={responsive.spacing.sm}
                borderRadius="xl"
                bg="rgba(184, 151, 74, 0.2)"
                border="1px solid"
                borderColor="rgba(184, 151, 74, 0.3)"
              >
                <Icon as={FaShieldAlt} color={colors.brandPrimary} boxSize={responsive.iconSize} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text color={colors.textColor} fontWeight="800" fontSize={responsive.fontSize.xl}>
                  Create Dispute
                </Text>
                <Text fontSize={responsive.fontSize.sm} color={colors.mutedColor}>
                  Let us help resolve your issue
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>

          <ModalCloseButton
            onClick={onClose}
            color={colors.mutedColor}
            _hover={{ color: colors.textColor }}
            borderRadius="xl"
            className="cursor-pointer"
            zIndex={10}
          />

          <ModalBody pb={responsive.spacing.lg} position="relative" zIndex={1}>
            <VStack spacing={responsive.spacing.lg}>
              <Alert
                status="info"
                borderRadius="2xl"
                variant="subtle"
                bg="rgba(49, 130, 206, 0.1)"
                border="1px solid"
                borderColor="rgba(49, 130, 206, 0.2)"
              >
                <AlertIcon color="#3182ce" />
                <Box>
                  <AlertTitle fontSize={responsive.fontSize.sm} color={colors.textColor}>
                    Quick Resolution
                  </AlertTitle>
                  <AlertDescription fontSize={responsive.fontSize.sm} color={colors.mutedColor}>
                    Our team typically resolves disputes within 24-48 hours. Please provide detailed information for faster resolution.
                  </AlertDescription>
                </Box>
              </Alert>

              <VStack spacing={responsive.spacing.lg} w="100%">
                <Box w="100%">
                  <Text fontSize={responsive.fontSize.sm} mb={responsive.spacing.sm} fontWeight="700" color={colors.textColor}>
                    Select Transaction
                  </Text>
                  <Select
                    name="transactionId"
                    value={form.transactionId}
                    onChange={async (e) => {
                      const { name, value } = e.target;
                      if (name === "transactionId" && value) {
                        try {
                          const response = await apiCall(`/api/disputes/check/${value}`);
                          if (response?.data.hasDispute) {
                            showToast("Dispute Exists", "This transaction already has a dispute. Loading it now.", "warning");
                            fetchDisputeDetails(response.data.disputeId);
                            setForm(prev => ({ ...prev, transactionId: "" }));
                            onClose();
                            return;
                          }
                        } catch (error) {
                          showToast("Error", "Could not verify transaction status.", "error");
                        }
                      }
                      setForm(prev => ({ ...prev, [name]: value }));
                    }}
                    placeholder="Choose the transaction to dispute"
                    h={responsive.buttonHeight}
                    borderRadius="xl"
                    bg="rgba(255, 255, 255, 0.1)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.2)"
                    fontSize={responsive.fontSize.sm}
                    color={colors.textColor}
                    _focus={{
                      borderColor: colors.brandPrimary,
                      boxShadow: `0 0 0 1px ${colors.brandPrimary}`
                    }}
                  >
                    {state.transactions.map((tx) => {
                      // Format the date
                      const txDate = format(new Date(tx.createdAt || tx.updatedAt), "MMM dd, yyyy");

                      // Get product/service description
                      const description = tx.productDetails?.description || tx.serviceDetails?.description || 'No description';
                      const truncatedDescription = description.length > 50
                        ? `${description.substring(0, 50)}...`
                        : description;

                      // Get participant info
                      const participant = tx.participants?.[0]?.userId;
                      const participantName = participant
                        ? `${participant.firstName || ''} ${participant.lastName || ''}`.trim()
                        : 'Unknown User';

                      // Determine user role
                      const userRole = tx.selectedUserType === "buyer" ? "Seller" : "Buyer";

                      return (
                        <option key={tx._id} value={tx._id} style={{ background: colors.bg }}>
                          {`${tx.reference || tx._id.slice(-8)} • ₦${(tx.amount || tx.paymentAmount || 0).toLocaleString('en-NG')} • ${userRole}: ${participantName} • ${truncatedDescription} • ${txDate}`}
                        </option>
                      );
                    })}
                  </Select>
                  {state.transactions.length === 0 && (
                    <Text fontSize={responsive.fontSize.xs} color={colors.mutedColor} mt={2}>
                      No funded transactions available for disputes. Only funded (not completed) transactions can be disputed.
                    </Text>
                  )}
                  {state.transactions.length > 0 && (
                    <Text fontSize={responsive.fontSize.xs} color={colors.mutedColor} mt={2}>
                      Showing {state.transactions.length} funded transaction{state.transactions.length !== 1 ? 's' : ''} available for disputes (completed transactions excluded)
                    </Text>
                  )}
                </Box>

                <Box w="100%">
                  <Text fontSize={responsive.fontSize.sm} mb={responsive.spacing.sm} fontWeight="700" color={colors.textColor}>
                    Issue Category
                  </Text>
                  <Select
                    name="reason"
                    value={form.reason}
                    onChange={(e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                    placeholder="What type of issue are you experiencing?"
                    h={responsive.buttonHeight}
                    borderRadius="xl"
                    bg="rgba(255, 255, 255, 0.1)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.2)"
                    fontSize={responsive.fontSize.sm}
                    color={colors.textColor}
                    _focus={{
                      borderColor: colors.brandPrimary,
                      boxShadow: `0 0 0 1px ${colors.brandPrimary}`
                    }}
                  >
                    {DISPUTE_REASONS.map(option => (
                      <option key={option.value} value={option.value} style={{ background: colors.bg }}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box w="100%">
                  <Text fontSize={responsive.fontSize.sm} mb={responsive.spacing.sm} fontWeight="700" color={colors.textColor}>
                    Detailed Description
                  </Text>
                  <Textarea
                    name="description"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                    placeholder="Please describe what happened in detail. Include dates, communications, and any relevant information..."
                    rows={5}
                    borderRadius="xl"
                    bg="rgba(255, 255, 255, 0.1)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.2)"
                    fontSize={responsive.fontSize.sm}
                    color={colors.textColor}
                    resize="vertical"
                    _focus={{
                      borderColor: colors.brandPrimary,
                      boxShadow: `0 0 0 1px ${colors.brandPrimary}`
                    }}
                    _placeholder={{ color: colors.mutedColor }}
                  />
                </Box>

                <Box w="100%">
                  <Text fontSize={responsive.fontSize.sm} mb={responsive.spacing.sm} fontWeight="700" color={colors.textColor}>
                    Supporting Evidence (Optional)
                  </Text>
                  <Box
                    border="2px dashed"
                    borderColor="rgba(255, 255, 255, 0.3)"
                    borderRadius="2xl"
                    p={responsive.spacing.xl}
                    textAlign="center"
                    position="relative"
                    bg="rgba(255, 255, 255, 0.05)"
                    _hover={{
                      borderColor: colors.brandPrimary,
                      bg: "rgba(184, 151, 74, 0.1)",
                      transform: "scale(1.02)"
                    }}
                    transition="all 0.3s ease"
                    cursor="pointer"
                  >
                    <Icon as={FaFileUpload} boxSize={responsive.spacing.xl} color={colors.brandPrimary} mb={responsive.spacing.md} />
                    <Text fontSize={responsive.fontSize.md} mb={responsive.spacing.sm} fontWeight="700" color={colors.textColor}>
                      Upload Evidence
                    </Text>
                    <Text fontSize={responsive.fontSize.sm} color={colors.mutedColor}>
                      Screenshots, photos, receipts, or documents (Max 10MB each)
                    </Text>
                    <Input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => setForm(prev => ({ ...prev, evidence: Array.from(e.target.files) }))}
                      opacity={0}
                      position="absolute"
                      top={0}
                      left={0}
                      width="100%"
                      height="100%"
                      cursor="pointer"
                    />
                  </Box>
                  {form.evidence.length > 0 && (
                    <Box
                      mt={responsive.spacing.sm}
                      p={responsive.spacing.md}
                      bg="rgba(56, 161, 105, 0.1)"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="rgba(56, 161, 105, 0.2)"
                    >
                      <HStack>
                        <Icon as={FaCheckCircle} color="#38A169" />
                        <Text fontSize={responsive.fontSize.sm} color="#38A169" fontWeight="700">
                          {form.evidence.length} file(s) ready to upload
                        </Text>
                      </HStack>
                    </Box>
                  )}
                </Box>
              </VStack>
            </VStack>
          </ModalBody>

          <ModalFooter pt={responsive.spacing.sm} gap={responsive.spacing.md} position="relative" zIndex={1}>
            <Button
              variant="ghost"
              onClick={onClose}
              borderRadius="xl"
              color={colors.mutedColor}
              h={responsive.buttonHeight}
              px={responsive.spacing.lg}
              fontSize={responsive.fontSize.sm}
              _hover={{
                color: colors.textColor,
                bg: "rgba(255, 255, 255, 0.1)"
              }}
            >
              Cancel
            </Button>
            <Button
              bg={`linear-gradient(135deg, ${colors.brandPrimary}, ${colors.brandSecondary})`}
              color="white"
              onClick={async () => {
                const formData = new FormData();
                Object.entries(form).forEach(([key, value]) => {
                  if (key === 'evidence') {
                    value.forEach(file => formData.append('evidence', file));
                  } else {
                    formData.append(key, value);
                  }
                });

                try {
                  await apiCall("/api/disputes/create", {
                    method: "POST",
                    data: formData,
                    headers: { "Content-Type": "multipart/form-data" }
                  });
                  showToast("Success", "Dispute created successfully!", "success");
                  setForm({ transactionId: "", reason: "", description: "", evidence: [] });
                  onClose();
                  fetchData();
                } catch (error) {
                  const errorMsg = error.response?.data?.error || "Failed to create dispute.";
                  showToast("Error", errorMsg, "error");
                }
              }}
              isDisabled={!form.transactionId || !form.reason || !form.description}
              leftIcon={<FaCheckCircle />}
              borderRadius="xl"
              h={responsive.buttonHeight}
              px={responsive.spacing.xl}
              fontSize={responsive.fontSize.sm}
              shadow="0 10px 15px -3px rgba(184, 151, 74, 0.4)"
              _hover={{
                transform: "translateY(-2px)",
                shadow: "0 20px 25px -5px rgba(184, 151, 74, 0.5)"
              }}
              _disabled={{
                opacity: 0.5,
                cursor: "not-allowed",
                transform: "none"
              }}
              transition="all 0.3s ease"
            >
              Submit Dispute
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Box>
  );
};

export default DisputePage;