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
import axios from "../../utils/axiosConfig";
import { formatCreatedAt } from "../../utils/DateTimeStramp";

// Use MotionBox with framer-motion
const MotionBox = motion(Box);

const BASE_URL = import.meta.env.VITE_BASE_URL;

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const toast = useToast();

  // Softer, professional color palette
  const bgCard = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subText = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.100", "gray.600");
  const highlightColor = useColorModeValue("gray.100", "gray.600");
  const menuBg = useColorModeValue("gray.50", "gray.700");
  const monoBg = useColorModeValue("gray.100", "gray.600");
  const debugBg = useColorModeValue("gray.100", "gray.600");
  const titleColor = "#9F7B34";

  // Badge colors, including "all"
  const badgeColors = {
    all: "blue",
    pending: "orange",
    accepted: "green",
    declined: "red",
    completed: "blue",
    cancelled: "gray",
    failed: "red",
    transaction: "purple",
    funding: "teal",
    confirmation: "cyan",
    payment: "pink",
    waybill: "yellow",
    registration: "blue",
  };

  const filterOptions = ["all", "pending", "accepted", "declined", "completed", "cancelled", "failed"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/notifications/notifications`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access-token')}`,
          },
        });
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
    return filtered;
  };

  const handleRemoveNotification = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/api/notifications/notifications/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access-token')}`,
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
            Authorization: `Bearer ${localStorage.getItem('access-token')}`,
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
            Authorization: `Bearer ${localStorage.getItem('access-token')}`,
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
        return <MdOutlinePayment size={16} />; // Smaller icon
      case "funding":
        return <MdOutlinePayment size={16} />;
      case "confirmation":
        return <MdCheck size={16} />;
      case "payment":
        return <MdOutlinePayment size={16} />;
      case "waybill":
        return <BsBell size={16} />;
      case "registration":
        return <MdNotifications size={16} />;
      default:
        return <BsBell size={16} />;
    }
  };

  return (
    <Box 
      mt={32} // Reduced from 24
      mb={10} // Reduced from 20
      px={{ base: 1, md: 4 }} // Reduced padding
      minH="100vh" 
      // bg="gray.900" 
      color="white"
      overflow="auto"
    >
      <Flex 
        direction={{ base: "column", sm: "row" }} 
        justify="space-between" 
        align={{ base: "start", sm: "center" }}
        mb={4} // Reduced from 6
        flexWrap="wrap"
      >
        <Text
          fontSize={{ base: "lg", md: "2xl" }} // Smaller font sizes
          fontWeight="bold"
          color={titleColor}
          mb={{ base: 2, sm: 0 }} // Reduced margin
          display="flex"
          alignItems="center"
        >
          <MdNotifications size={20} style={{ marginRight: '6px' }} /> {/* Smaller icon */}
          Notifications
        </Text>

        <HStack spacing={1} flexWrap="wrap"> {/* Reduced spacing */}
          {filterOptions.map((status) => (
            <Badge 
              key={status}
              as="button" 
              px={1.5} // Reduced from 2
              py={0.5} // Reduced from 1
              borderRadius="full" 
              colorScheme={filter === status ? badgeColors[status] : "gray"}
              onClick={() => setFilter(status)}
              cursor="pointer"
              textTransform="capitalize"
              fontSize={{ base: "2xs", md: "xs" }} // Smaller font
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
          minHeight="200px" // Reduced from 300px
          width="100%"
        >
          <VStack spacing={2}> {/* Reduced spacing */}
            <Spinner
              thickness="3px" // Thinner spinner
              speed="0.65s"
              emptyColor="gray.600"
              color={titleColor}
              size="lg" // Smaller spinner
            />
            <Text color={subText} fontWeight="medium" fontSize="sm"> {/* Smaller font */}
              Loading notifications...
            </Text>
          </VStack>
        </Box>
      ) : (
        <VStack spacing={3} align="stretch" w="100%" maxW="100%"> {/* Reduced spacing */}
          {notifications.length === 0 ? (
            <Box 
              textAlign="center" 
              mt={6} // Reduced from 10
              p={3} // Reduced from 5
              borderRadius="lg" // Smaller radius
              bg={bgCard} 
              border="1px dashed" 
              borderColor={borderColor}
              w="100%"
            >
              <Avatar
                bg={monoBg}
                icon={<BsBell size={16} color={subText} />} // Smaller icon
                size="sm" // Smaller avatar
                mb={2} // Reduced margin
              />
              <Text fontSize={{ base: "sm", md: "md" }} fontWeight="medium" color={textColor}>
                No notifications available
              </Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color={subText} mt={1}> {/* Smaller font */}
                You're all caught up ✨
              </Text>
            </Box>
          ) : getFilteredNotifications().length > 0 ? (
            getFilteredNotifications().map((notification, index) => (
              <MotionBox
                key={notification._id}
                bg={notification.isRead ? bgCard : highlightColor}
                borderRadius="lg" // Smaller radius
                p={{ base: 2, md: 3 }} // Reduced padding
                shadow="sm" // Lighter shadow
                border="1px solid"
                borderColor={borderColor}
                position="relative"
                w="100%"
                initial={{ opacity: 0, y: 10 }} // Smaller animation
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }} // Faster animation
              >
                <Flex direction={{ base: "column", sm: "row" }} justify="space-between">
                  <HStack spacing={2} mb={{ base: 2, sm: 0 }} align="start" flex={1}> {/* Reduced spacing */}
                    <Avatar 
                      bg={`${badgeColors[notification.type || 'default']}.200`}
                      color={`${badgeColors[notification.type || 'default']}.600`}
                      icon={getNotificationIcon(notification.type || 'default')}
                      size="xs" // Smaller avatar
                    />
                    
                    <Box flex={1}>
                      <HStack mb={0.5} justify="space-between"> {/* Reduced margin */}
                        <Text fontSize={{ base: "xs", md: "md" }} fontWeight="bold" color={textColor}>
                          {notification.title || 'Untitled'}
                        </Text>
                        <Badge 
                          colorScheme={badgeColors[notification.status?.toLowerCase() || 'default'] || "gray"} 
                          borderRadius="full" 
                          px={1.5} // Reduced padding
                          fontSize="xs" // Smaller font
                        >
                          {notification.status || 'Unknown'}
                        </Badge>
                      </HStack>
                      
                      <Text fontSize={{ base: "2xs", md: "xs" }} mb={1} color={textColor}> {/* Smaller font */}
                        {notification.message || 'No message'}
                      </Text>
                      
                      <HStack fontSize={{ base: "2xs", md: "xs" }} color={subText} spacing={1} mt={0.5}> {/* Reduced spacing */}
                        <Flex align="center">
                          <BsClock style={{ marginRight: '2px' }} />
                          {formatCreatedAt(notification.timestamp) || 'Unknown time'}
                        </Flex>
                        
                        {notification.transactionId && (
                          <Tooltip label="Transaction ID">
                            <Text 
                              as="span" 
                              fontSize="2xs" // Smaller font
                              bg={monoBg} 
                              p={0.5} // Reduced padding
                              borderRadius="sm"
                            >
                              {notification.transactionId.substring(0, 8)}...
                            </Text>
                          </Tooltip>
                        )}
                      </HStack>
                    </Box>
                  </HStack>

                  <HStack spacing={0.5} alignSelf={{ base: "flex-end", sm: "center" }}> {/* Reduced spacing */}
                    {!notification.isRead && (
                      <Tooltip label="Mark as Read">
                        <IconButton
                          size="2xs" // Smaller button
                          colorScheme="blue"
                          icon={<MdCheck />}
                          onClick={() => handleMarkAsRead(notification._id)}
                          borderRadius="full"
                        />
                      </Tooltip>
                    )}
                    {notification.status?.toLowerCase() === "pending" && (
                      <>
                        <Tooltip label="Accept">
                          <IconButton
                            size="2xs" // Smaller button
                            colorScheme="green"
                            icon={<MdCheck />}
                            onClick={() => handleUpdateStatus(notification._id, "accepted")}
                            borderRadius="full"
                          />
                        </Tooltip>
                        <Tooltip label="Decline">
                          <IconButton
                            size="2xs" // Smaller button
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
                        size="2xs" // Smaller button
                        colorScheme="gray"
                        _hover={{ bg: hoverBg }}
                        borderRadius="full"
                      />
                      <MenuList
                        bg={menuBg}
                        borderRadius="lg" // Smaller radius
                        shadow="sm" // Lighter shadow
                        minW="120px" // Smaller menu
                      >
                        <MenuItem
                          icon={<MdDelete size={14} />} // Smaller icon
                          onClick={() => handleRemoveNotification(notification._id)}
                          fontSize="xs" // Smaller font
                        >
                          Remove
                        </MenuItem>
                        <MenuItem
                          icon={<MdOutlineReportGmailerrorred size={14} />} // Smaller icon
                          onClick={() => handleReportNotification(notification._id)}
                          fontSize="xs"
                        >
                          Report issue
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                </Flex>
              </MotionBox>
            ))
          ) : (
            <>
              <Box 
                textAlign="center" 
                mt={6} // Reduced from 10
                p={3} // Reduced from 5
                borderRadius="lg" // Smaller radius
                bg={bgCard} 
                border="1px dashed" 
                borderColor={borderColor}
                w="100%"
              >
                <Avatar
                  bg={monoBg}
                  icon={<BsBell size={16} color={subText} />} // Smaller icon
                  size="sm" // Smaller avatar
                  mb={2} // Reduced margin
                />
                <Text fontSize={{ base: "sm", md: "md" }} fontWeight="medium" color={textColor}>
                  No notifications with status "{filter}"
                </Text>
                <Text fontSize={{ base: "xs", md: "sm" }} color={subText} mt={1}> {/* Smaller font */}
                  Try a different filter or check back later ✨
                </Text>
              </Box>
              <Box mt={3} p={3} bg={debugBg} color={textColor} borderRadius="lg"> {/* Reduced padding/margin */}
                <Text fontSize="sm" fontWeight="bold">Debug: Raw Notifications</Text> {/* Smaller font */}
                {notifications.map((notification) => (
                  <Box key={notification._id} mt={1}> {/* Reduced margin */}
                    <Text fontSize="xs">Title: {notification.title || 'Untitled'}</Text> {/* Smaller font */}
                    <Text fontSize="xs">Message: {notification.message || 'No message'}</Text>
                    <Text fontSize="xs">Status: {notification.status || 'undefined'}</Text>
                    <Text fontSize="xs">Type: {notification.type || 'undefined'}</Text>
                    <Text fontSize="xs">Timestamp: {notification.timestamp || 'Unknown'}</Text>
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