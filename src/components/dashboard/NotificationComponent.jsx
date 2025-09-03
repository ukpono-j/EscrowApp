import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  IconButton,
  VStack,
  HStack,
  useColorModeValue,
  Spinner,
  useToast,
  Button,
  Avatar,
  Flex,
  Badge,
} from "@chakra-ui/react";
import { BsBell, BsClock } from "react-icons/bs";
import { MdDelete, MdCheck, MdOutlinePayment, MdMessage } from "react-icons/md";
import { motion } from "framer-motion";
import axios from "../../utils/axiosConfig";
import { formatCreatedAt } from "../../utils/DateTimeStramp";
import { io } from 'socket.io-client';
import { useLocation } from "react-router-dom";

const MotionBox = motion(Box);

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Sylo Brand Colors
const SYLO_COLORS = {
  dark: "#1A202C",
  navy: "#051E2F", 
  gold: "#B38939",
  lightGold: "#BB954D"
};

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const toast = useToast();
  const location = useLocation();

  // Initialize socket
  const socket = io(BASE_URL, {
    auth: { token: localStorage.getItem('access-token') },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  const bgColor = useColorModeValue("white", SYLO_COLORS.dark);
  const cardBg = useColorModeValue("gray.50", SYLO_COLORS.navy);
  const textColor = useColorModeValue("gray.800", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const filterOptions = [
    { value: "all", label: "All", color: SYLO_COLORS.gold },
    { value: "pending", label: "Pending", color: "orange.500" },
    { value: "completed", label: "Completed", color: "green.500" }
  ];

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh-token');
      if (!refreshToken) throw new Error('No refresh token available');
      
      const res = await axios.post(`${BASE_URL}/api/auth/refresh-token`, { refreshToken });
      const newToken = res.data.token;
      localStorage.setItem('access-token', newToken);
      socket.auth.token = newToken;
      socket.disconnect().connect();
      return newToken;
    } catch (err) {
      localStorage.removeItem('access-token');
      localStorage.removeItem('refresh-token');
      toast({
        title: "Session expired",
        description: "Please log in again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      window.location.href = '/login';
      throw err;
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let token = localStorage.getItem('access-token');
      if (!token) token = await refreshToken();

      const res = await axios.get(`${BASE_URL}/api/notifications/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });

      if (res.data.success) {
        const notificationsArray = Array.isArray(res.data.data) ? res.data.data : [];
        const sortedNotifications = notificationsArray
          .filter(n => n._id && n.message && n.userId)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotifications(sortedNotifications);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
      toast({
        title: "Error loading notifications",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    socket.on('connect', () => {
      socket.emit('join-room', `user_${localStorage.getItem('userId')}`);
    });

    socket.on('newNotification', (notification) => {
      setNotifications(prev => {
        const updated = [notification, ...prev.filter(n => n._id !== notification._id)];
        return updated.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });

      const isInChatroom = notification.type === 'message' && location.pathname === `/chat/${notification.chatroomId}`;
      if (!isInChatroom) {
        toast({
          title: notification.title,
          description: notification.message,
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [location.pathname]);

  const getFilteredNotifications = () => {
    if (filter === "all") return notifications;
    return notifications.filter(n => n.status?.toLowerCase() === filter.toLowerCase() || n.type?.toLowerCase() === filter.toLowerCase());
  };

  const handleRemoveNotification = async (id) => {
    try {
      const token = localStorage.getItem('access-token');
      await axios.delete(`${BASE_URL}/api/notifications/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast({
        title: "Notification removed",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error removing notification",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('access-token');
      await axios.patch(
        `${BASE_URL}/api/notifications/notifications/${id}`,
        { isRead: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => 
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "transaction":
      case "payment":
      case "funding":
        return <MdOutlinePayment size={16} />;
      case "message":
        return <MdMessage size={16} />;
      default:
        return <BsBell size={16} />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    
    if (notification.type === 'message' && notification.chatroomId) {
      window.location.href = `/chat/${notification.chatroomId}`;
    } else if (notification.transactionId?._id) {
      window.location.href = `/transactions/tab?transactionId=${notification.transactionId._id}`;
    }
  };

  return (
    <Box
      minH="100vh"
      bg={bgColor}
      p={{ base: 4, md: 6 }}
      fontFamily="'Inter', sans-serif"
    >
      {/* Header */}
      <Box mb={8} mt={20}>
        <Text 
          fontSize="2xl" 
          fontWeight="bold" 
          color={SYLO_COLORS.gold}
          mb={2}
        >
          Notifications
        </Text>
        <Text color={subTextColor} fontSize="sm">
          Stay updated with your latest activities
        </Text>
      </Box>

      {/* Filter Tabs */}
      <HStack 
        spacing={2} 
        mb={6} 
        overflowX="auto"
        css={{
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? "solid" : "ghost"}
            size="sm"
            color={filter === option.value ? "white" : textColor}
            bg={filter === option.value ? option.color : "transparent"}
            borderRadius="full"
            px={4}
            py={2}
            minW="fit-content"
            _hover={{
              bg: filter === option.value ? option.color : cardBg,
              transform: "translateY(-1px)"
            }}
            transition="all 0.2s"
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </HStack>

      {/* Content */}
      {loading ? (
        <Flex justify="center" align="center" minH="200px">
          <VStack spacing={3}>
            <Spinner 
              size="lg" 
              color={SYLO_COLORS.gold}
              thickness="3px"
            />
            <Text color={subTextColor}>Loading notifications...</Text>
          </VStack>
        </Flex>
      ) : (
        <VStack spacing={3} align="stretch">
          {getFilteredNotifications().length === 0 ? (
            <Box 
              textAlign="center" 
              py={12}
              bg={cardBg}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
            >
              <Avatar
                bg={SYLO_COLORS.gold}
                color="white"
                icon={<BsBell size={20} />}
                size="lg"
                mb={4}
              />
              <Text fontSize="lg" fontWeight="medium" color={textColor} mb={2}>
                {filter === "all" ? "No notifications yet" : `No ${filter} notifications`}
              </Text>
              <Text color={subTextColor} fontSize="sm">
                You're all caught up! ✨
              </Text>
            </Box>
          ) : (
            getFilteredNotifications().map((notification, index) => (
              <MotionBox
                key={notification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <Box
                  bg={cardBg}
                  borderRadius="xl"
                  p={4}
                  border="1px solid"
                  borderColor={notification.isRead ? borderColor : SYLO_COLORS.lightGold}
                  borderLeftWidth={notification.isRead ? "1px" : "4px"}
                  borderLeftColor={notification.isRead ? borderColor : SYLO_COLORS.gold}
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{
                    bg: useColorModeValue("gray.100", "gray.700"),
                    borderColor: SYLO_COLORS.gold,
                    shadow: "md"
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <Flex gap={4} align="start">
                    {/* Icon */}
                    <Avatar
                      bg={SYLO_COLORS.gold + "20"}
                      color={SYLO_COLORS.gold}
                      icon={getNotificationIcon(notification.type)}
                      size="sm"
                    />

                    {/* Content */}
                    <Box flex="1" minW="0">
                      <HStack justify="space-between" align="start" mb={1}>
                        <Text
                          fontWeight="semibold"
                          color={textColor}
                          fontSize="sm"
                          noOfLines={1}
                        >
                          {notification.title || 'Notification'}
                        </Text>
                        {!notification.isRead && (
                          <Badge
                            bg={SYLO_COLORS.gold}
                            color="white"
                            fontSize="xs"
                            px={2}
                            borderRadius="full"
                          >
                            New
                          </Badge>
                        )}
                      </HStack>

                      <Text
                        color={subTextColor}
                        fontSize="sm"
                        noOfLines={2}
                        mb={2}
                      >
                        {notification.message}
                      </Text>

                      <HStack justify="space-between" align="center">
                        <HStack spacing={2}>
                          <BsClock size={12} color={subTextColor} />
                          <Text fontSize="xs" color={subTextColor}>
                            {formatCreatedAt(notification.timestamp)}
                          </Text>
                          {notification.status && (
                            <Badge
                              colorScheme={
                                notification.status === 'completed' ? 'green' :
                                notification.status === 'pending' ? 'yellow' :
                                'gray'
                              }
                              size="sm"
                              textTransform="capitalize"
                            >
                              {notification.status}
                            </Badge>
                          )}
                        </HStack>

                        <HStack spacing={1}>
                          {!notification.isRead && (
                            <IconButton
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              icon={<MdCheck size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                              borderRadius="full"
                              _hover={{ bg: "blue.100" }}
                            />
                          )}
                          <IconButton
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            icon={<MdDelete size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveNotification(notification._id);
                            }}
                            borderRadius="full"
                            _hover={{ bg: "red.100" }}
                          />
                        </HStack>
                      </HStack>
                    </Box>
                  </Flex>
                </Box>
              </MotionBox>
            ))
          )}
        </VStack>
      )}
    </Box>
  );
};

export default NotificationComponent;