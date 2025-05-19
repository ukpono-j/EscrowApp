import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  IconButton,
  VStack,
  HStack,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  useToast,
  Badge,
  Avatar,
  Flex,
  Tooltip,
} from "@chakra-ui/react";
import { BsThreeDots, BsClock, BsBell } from "react-icons/bs";
import { 
  MdDelete, 
  MdOutlineReportGmailerrorred,
  MdCheck,
  MdClose,
  MdOutlinePayment,
  MdNotifications
} from "react-icons/md";
import { motion } from "framer-motion";
import axios from "axios";
import { formatCreatedAt } from "../../utility/DateTimeStramp";

// Use MotionBox with framer-motion
const MotionBox = motion(Box);

const BASE_URL = import.meta.env.VITE_BASE_URL;

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const toast = useToast();

  const bgCard = useColorModeValue("white", "gray.600");
  const borderColor = useColorModeValue("gray.200", "gray.500");
  const textColor = useColorModeValue("gray.800", "white");
  const subText = useColorModeValue("gray.600", "gray.300");
  const hoverBg = useColorModeValue("gray.50", "gray.500");
  const highlightColor = useColorModeValue("yellow.100", "yellow.600");
  const menuBg = useColorModeValue("white", "gray.700");
  const monoBg = useColorModeValue("gray.100", "gray.600");
  const titleColor = "#9F7B34";

  const badgeColors = {
    pending: "orange",
    accepted: "green",
    declined: "red",
    completed: "blue",
    cancelled: "gray",
    failed: "red", // Added for failed status
    transaction: "purple",
    funding: "teal",
    confirmation: "cyan",
    payment: "pink",
    waybill: "yellow",
    registration: "blue", // Added for registration type
  };

  const filterOptions = ["all", "pending", "accepted", "declined", "completed", "cancelled", "failed"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/notifications/notifications`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        console.log('Notifications response:', res.data);
        const notificationsArray = res.data.data || [];
        if (!Array.isArray(notificationsArray)) {
          console.warn('Notifications data is not an array:', notificationsArray);
          setNotifications([]);
          return;
        }
        const sortedNotifications = notificationsArray.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        setNotifications(sortedNotifications);
        console.log('Notification statuses:', sortedNotifications.map(n => n.status));
      } catch (err) {
        console.error('Fetch error:', err.response || err);
        const status = err.response?.status;
        let description = "Please try again later";
        if (status === 401) {
          description = "Please log in to view notifications";
        } else if (status === 403) {
          description = "You are not authorized to view notifications";
        }
        toast({
          title: "Error fetching notifications",
          description,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [toast]);

  const getFilteredNotifications = () => {
    if (!Array.isArray(notifications)) {
      console.warn('Notifications is not an array:', notifications);
      return [];
    }
    const filtered = filter === "all" 
      ? notifications 
      : notifications.filter(n => 
          n.status && n.status.toLowerCase() === filter.toLowerCase()
        );
    console.log('Filtered notifications:', filtered);
    return filtered;
  };

  const handleRemoveNotification = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/api/notifications/notifications/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
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

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.patch(
        `${BASE_URL}/api/notifications/notifications/${id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setNotifications((prev) => {
        const updated = prev.map((n) => (n._id === id ? { ...n, status: newStatus } : n));
        return updated.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });
      toast({
        title: `Status updated to ${newStatus}`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error updating status",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleReportNotification = (id) => {
    toast({
      title: "Reported to support",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.patch(
        `${BASE_URL}/api/notifications/notifications/${id}`,
        { isRead: true },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setNotifications((prev) => {
        const updated = prev.map((n) => (n._id === id ? { ...n, isRead: true } : n));
        return updated.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });
      toast({
        title: "Notification marked as read",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error marking notification as read",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "transaction":
        return <MdOutlinePayment size={20} />;
      case "funding":
        return <MdOutlinePayment size={20} />;
      case "confirmation":
        return <MdCheck size={20} />;
      case "payment":
        return <MdOutlinePayment size={20} />;
      case "waybill":
        return <BsBell size={20} />;
      case "registration":
        return <MdNotifications size={20} />;
      default:
        return <BsBell size={20} />;
    }
  };

  return (
    <Box 
      mt={24} 
      mb={20} 
      px={{ base: 2, md: 8 }} 
      minH="100vh" 
      bg="gray.900" 
      color="white"
      overflow="auto"
    >
      <Flex 
        direction={{ base: "column", sm: "row" }} 
        justify="space-between" 
        align={{ base: "start", sm: "center" }}
        mb={6}
        flexWrap="wrap"
      >
        <Text
          fontSize={{ base: "xl", md: "3xl" }}
          fontWeight="bold"
          color={titleColor}
          mb={{ base: 4, sm: 0 }}
          display="flex"
          alignItems="center"
        >
          <MdNotifications size={24} style={{ marginRight: '8px' }} />
          Notifications
        </Text>

        <HStack spacing={2} flexWrap="wrap">
          {filterOptions.map((status) => (
            <Badge 
              key={status}
              as="button" 
              px={2} 
              py={1}
              borderRadius="full" 
              colorScheme={filter === status ? badgeColors[status] || "blue" : "gray"}
              onClick={() => setFilter(status)}
              cursor="pointer"
              textTransform="capitalize"
              fontSize={{ base: "xs", md: "sm" }}
            >
              {status}
            </Badge>
          ))}
        </HStack>
      </Flex>

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="300px"
          width="100%"
        >
          <VStack spacing={4}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color={titleColor}
              size="xl"
            />
            <Text color={subText} fontWeight="medium">
              Loading notifications...
            </Text>
          </VStack>
        </Box>
      ) : (
        <VStack spacing={5} align="stretch" w="100%" maxW="100%">
          {notifications.length === 0 ? (
            <Box 
              textAlign="center" 
              mt={10} 
              p={5} 
              borderRadius="xl" 
              bg={bgCard} 
              border="1px dashed" 
              borderColor={borderColor}
              w="100%"
            >
              <Avatar
                bg="gray.100"
                icon={<BsBell size={20} color="gray" />}
                size="md"
                mb={3}
              />
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="medium" color={textColor}>
                No notifications available
              </Text>
              <Text fontSize={{ base: "sm", md: "md" }} color={subText} mt={2}>
                You're all caught up ✨
              </Text>
            </Box>
          ) : getFilteredNotifications().length > 0 ? (
            getFilteredNotifications().map((notification, index) => {
              console.log(`Rendering notification ${index}:`, notification);
              return (
                <MotionBox
                  key={notification._id}
                  bg={notification.isRead ? bgCard : highlightColor}
                  borderRadius="xl"
                  p={{ base: 3, md: 5 }}
                  shadow="md"
                  border="1px solid"
                  borderColor={borderColor}
                  position="relative"
                  w="100%"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Flex direction={{ base: "column", sm: "row" }} justify="space-between">
                    <HStack spacing={3} mb={{ base: 3, sm: 0 }} align="start" flex={1}>
                      <Avatar 
                        bg={`${badgeColors[notification.type]}.100`} 
                        color={`${badgeColors[notification.type]}.700`}
                        icon={getNotificationIcon(notification.type)}
                        size="sm"
                      />
                      
                      <Box flex={1}>
                        <HStack mb={1} justify="space-between">
                          <Text fontSize={{ base: "sm", md: "lg" }} fontWeight="bold" color={textColor}>
                            {notification.title}
                          </Text>
                          <Badge colorScheme={badgeColors[notification.status] || "gray"} borderRadius="full" px={1}>
                            {notification.status}
                          </Badge>
                        </HStack>
                        
                        <Text fontSize={{ base: "xs", md: "md" }} mb={2} color={textColor}>
                          {notification.message}
                        </Text>
                        
                        <HStack fontSize={{ base: "xs", md: "sm" }} color={subText} spacing={2} mt={1}>
                          <Flex align="center">
                            <BsClock style={{ marginRight: '2px' }} />
                            {formatCreatedAt(notification.timestamp)}
                          </Flex>
                          
                          {notification.transactionId && (
                            <Tooltip label="Transaction ID">
                              <Text 
                                as="span" 
                                fontSize="xs" 
                                bg={monoBg} 
                                p={1} 
                                borderRadius="md"
                              >
                                {notification.transactionId.substring(0, 8)}...
                              </Text>
                            </Tooltip>
                          )}
                        </HStack>
                      </Box>
                    </HStack>

                    <HStack spacing={1} alignSelf={{ base: "flex-end", sm: "center" }}>
                      {!notification.isRead && (
                        <Tooltip label="Mark as Read">
                          <IconButton
                            size="xs"
                            colorScheme="blue"
                            icon={<MdCheck />}
                            onClick={() => handleMarkAsRead(notification._id)}
                            borderRadius="full"
                          />
                        </Tooltip>
                      )}
                      {notification.status === "pending" && (
                        <>
                          <Tooltip label="Accept">
                            <IconButton
                              size="xs"
                              colorScheme="green"
                              icon={<MdCheck />}
                              onClick={() => handleUpdateStatus(notification._id, "accepted")}
                              borderRadius="full"
                            />
                          </Tooltip>
                          <Tooltip label="Decline">
                            <IconButton
                              size="xs"
                              colorScheme="red"
                              icon={<MdClose />}
                              onClick={() => handleUpdateStatus(notification._id, "declined")}
                              borderRadius="full"
                            />
                          </Tooltip>
                        </>
                      )}
                      
                      <Menu placement="left-start">
                        <MenuButton
                          as={IconButton}
                          icon={<BsThreeDots />}
                          variant="ghost"
                          size="xs"
                          colorScheme="gray"
                          _hover={{ bg: hoverBg }}
                          borderRadius="full"
                        />
                        <MenuList
                          bg={menuBg}
                          borderRadius="xl"
                          shadow="xl"
                        >
                          <MenuItem
                            icon={<MdDelete />}
                            onClick={() => handleRemoveNotification(notification._id)}
                          >
                            Remove
                          </MenuItem>
                          <MenuItem
                            icon={<MdOutlineReportGmailerrorred />}
                            onClick={() => handleReportNotification(notification._id)}
                          >
                            Report issue
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </HStack>
                  </Flex>
                </MotionBox>
              );
            })
          ) : (
            <>
              <Box 
                textAlign="center" 
                mt={10} 
                p={5} 
                borderRadius="xl" 
                bg={bgCard} 
                border="1px dashed" 
                borderColor={borderColor}
                w="100%"
              >
                <Avatar
                  bg="gray.100"
                  icon={<BsBell size={20} color="gray" />}
                  size="md"
                  mb={3}
                />
                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="medium" color={textColor}>
                  No notifications with status "{filter}"
                </Text>
                <Text fontSize={{ base: "sm", md: "md" }} color={subText} mt={2}>
                  Try a different filter or check back later ✨
                </Text>
              </Box>
              <Box mt={5} p={5} bg="red.500" color="white" borderRadius="md">
                <Text fontSize="lg" fontWeight="bold">Debug: Raw Notifications</Text>
                {notifications.map((notification) => (
                  <Box key={notification._id} mt={2}>
                    <Text>Title: {notification.title}</Text>
                    <Text>Message: {notification.message}</Text>
                    <Text>Status: {notification.status || 'undefined'}</Text>
                    <Text>Type: {notification.type || 'undefined'}</Text>
                    <Text>Timestamp: {notification.timestamp}</Text>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default NotificationComponent;