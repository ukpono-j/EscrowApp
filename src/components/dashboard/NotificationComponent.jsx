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
  Button,
  Avatar,
  Flex,
  Tooltip,
  Grid,
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

  // Professional color palette
  const bgCard = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subText = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const highlightColor = useColorModeValue("blue.50", "blue.900");
  const menuBg = useColorModeValue("white", "gray.800");
  const titleColor = "#9F7B34";

  // Badge colors
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
    return filter === "all" 
      ? notifications 
      : notifications.filter(n => 
          n.status && n.status.toLowerCase() === filter.toLowerCase()
        );
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
        return <MdOutlinePayment size={14} />;
      case "funding":
        return <MdOutlinePayment size={14} />;
      case "confirmation":
        return <MdCheck size={14} />;
      case "payment":
        return <MdOutlinePayment size={14} />;
      case "waybill":
        return <BsBell size={14} />;
      case "registration":
        return <MdNotifications size={14} />;
      default:
        return <BsBell size={14} />;
    }
  };

  return (
    <Box
      mt={6}
      mb={6}
      px={{ base: 2, md: 4 }}
      maxW="100%"
      overflow="hidden"
      minH="100vh"
      // bg="gray.900"
      color="white"
      fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    >
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align="center"
        mb={3}
        bg={bgCard}
        p={2}
        borderRadius="lg"
        shadow="sm"
        maxW="100%"
        overflow="hidden"
      >
        <Text
          fontSize={{ base: "md", md: "lg" }}
          fontWeight="semibold"
          color={titleColor}
          mb={{ base: 2, sm: 0 }}
          display="flex"
          alignItems="center"
        >
          <MdNotifications size={18} style={{ marginRight: '6px' }} />
          Notifications
        </Text>
        <HStack
          spacing={1}
          maxW={{ base: "100%", sm: "70%" }}
          overflowX={{ base: "auto", sm: "visible" }}
          css={{
            '&::-webkit-scrollbar': { display: 'none' },
            '-ms-overflow-style': 'none',
            'scrollbar-width': 'none',
          }}
          flexWrap={{ base: "nowrap", md: "wrap" }}
        >
          {filterOptions.map((status) => (
            <Button
              key={status}
              variant={filter === status ? "solid" : "ghost"}
              colorScheme={filter === status ? badgeColors[status] : "gray"}
              size="sm"
              fontSize={{ base: "xs", md: "sm" }}
              fontWeight="medium"
              textTransform="capitalize"
              borderRadius="md"
              px={2}
              py={1}
              borderBottom={filter === status ? `2px solid ${badgeColors[status]}.500` : "none"}
              _hover={{ bg: hoverBg }}
              onClick={() => setFilter(status)}
              whiteSpace="nowrap"
            >
              {status}
            </Button>
          ))}
        </HStack>
      </Flex>

      {loading ? (
        <Flex
          justify="center"
          align="center"
          minHeight="150px"
          width="100%"
        >
          <VStack spacing={2}>
            <Spinner
              thickness="2px"
              speed="0.65s"
              emptyColor="gray.600"
              color={titleColor}
              size="md"
            />
            <Text color={subText} fontWeight="medium" fontSize="sm">
              Loading notifications...
            </Text>
          </VStack>
        </Flex>
      ) : (
        <VStack spacing={2} align="stretch" w="100%" maxW="100%" overflow="hidden">
          {notifications.length === 0 ? (
            <Box
              textAlign="center"
              mt={4}
              p={2}
              borderRadius="lg"
              bg={bgCard}
              shadow="sm"
              w="100%"
              maxW="100%"
              overflow="hidden"
            >
              <Avatar
                bg={useColorModeValue("gray.100", "gray.600")}
                icon={<BsBell size={14} color={subText} />}
                size="xs"
                mb={1}
              />
              <Text fontSize={{ base: "sm", md: "md" }} fontWeight="medium" color={textColor}>
                No notifications available
              </Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color={subText} mt={1}>
                You're all caught up ✨
              </Text>
            </Box>
          ) : getFilteredNotifications().length > 0 ? (
            getFilteredNotifications().map((notification) => (
              <MotionBox
                key={notification._id}
                bg={notification.isRead ? bgCard : highlightColor}
                borderRadius="lg"
                p={2}
                shadow="sm"
                w="100%"
                maxW="100%"
                overflow="hidden"
                _hover={{ bg: hoverBg, transform: "translateY(-2px)" }}
                transition="all 0.2s"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
              >
                <Grid
                  templateColumns={{ base: "auto 1fr auto", md: "auto 1fr auto" }}
                  alignItems="start"
                  gap={2}
                >
                  <Avatar
                    bg={`${badgeColors[notification.type || 'default']}.100`}
                    color={`${badgeColors[notification.type || 'default']}.600`}
                    icon={getNotificationIcon(notification.type || 'default')}
                    size="xs"
                  />
                  <Box flex={1} minW={0}>
                    <Text
                      fontSize={{ base: "sm", md: "md" }}
                      fontWeight="medium"
                      color={textColor}
                      isTruncated
                      maxW={{ base: "150px", md: "300px" }}
                      wordBreak="break-word"
                    >
                      {notification.title || 'Untitled'}
                    </Text>
                    <Text
                      fontSize={{ base: "xs", md: "sm" }}
                      color={subText}
                      mt={1}
                      isTruncated
                      maxW={{ base: "150px", md: "300px" }}
                      wordBreak="break-word"
                    >
                      {notification.message || 'No message'}
                    </Text>
                    {notification.transactionId && (
                      <Tooltip label="Transaction ID">
                        <Text
                          as="span"
                          fontSize="xs"
                          bg={useColorModeValue("gray.100", "gray.600")}
                          p={0.5}
                          borderRadius="sm"
                          mt={1}
                          display="inline-block"
                          isTruncated
                          maxW={{ base: "100px", md: "200px" }}
                        >
                          {notification.transactionId.substring(0, 8)}...
                        </Text>
                      </Tooltip>
                    )}
                  </Box>
                  <VStack align="flex-end" spacing={1}>
                    <Flex align="center" justify="flex-end">
                      <Text
                        fontSize={{ base: "xs", md: "sm" }}
                        fontWeight="medium"
                        color={`${badgeColors[notification.status?.toLowerCase() || 'default']}.500`}
                        textTransform="capitalize"
                        whiteSpace="nowrap"
                        mr={2}
                      >
                        {notification.status || 'Unknown'}
                      </Text>
                      <HStack spacing={1} display={{ base: "none", md: "flex" }}>
                        {!notification.isRead && (
                          <Tooltip label="Mark as Read">
                            <IconButton
                              size="xs"
                              colorScheme="blue"
                              icon={<MdCheck size={12} />}
                              onClick={() => handleMarkAsRead(notification._id)}
                              borderRadius="full"
                              variant="ghost"
                              _hover={{ transform: "scale(1.1)" }}
                            />
                          </Tooltip>
                        )}
                        {notification.status?.toLowerCase() === "pending" && (
                          <>
                            <Tooltip label="Accept">
                              <IconButton
                                size="xs"
                                colorScheme="green"
                                icon={<MdCheck size={12} />}
                                onClick={() => handleUpdateStatus(notification._id, "accepted")}
                                borderRadius="full"
                                variant="ghost"
                                _hover={{ transform: "scale(1.1)" }}
                              />
                            </Tooltip>
                            <Tooltip label="Decline">
                              <IconButton
                                size="xs"
                                colorScheme="red"
                                icon={<MdClose size={12} />}
                                onClick={() => handleUpdateStatus(notification._id, "declined")}
                                borderRadius="full"
                                variant="ghost"
                                _hover={{ transform: "scale(1.1)" }}
                              />
                            </Tooltip>
                          </>
                        )}
                        <Menu placement="bottom-end">
                          <MenuButton
                            as={IconButton}
                            icon={<BsThreeDots size={12} />}
                            variant="ghost"
                            size="xs"
                            colorScheme="gray"
                            _hover={{ bg: hoverBg, transform: "scale(1.1)" }}
                            borderRadius="full"
                          />
                          <MenuList
                            bg={menuBg}
                            borderRadius="md"
                            shadow="sm"
                            minW="120px"
                          >
                            <MenuItem
                              icon={<MdDelete size={12} />}
                              onClick={() => handleRemoveNotification(notification._id)}
                              fontSize="xs"
                            >
                              Remove
                            </MenuItem>
                            <MenuItem
                              icon={<MdOutlineReportGmailerrorred size={12} />}
                              onClick={() => handleReportNotification(notification._id)}
                              fontSize="xs"
                            >
                              Report issue
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </HStack>
                      <Box display={{ base: "flex", md: "none" }}>
                        <Menu placement="bottom-end">
                          <MenuButton
                            as={IconButton}
                            icon={<BsThreeDots size={12} />}
                            variant="ghost"
                            size="xs"
                            colorScheme="gray"
                            _hover={{ bg: hoverBg, transform: "scale(1.1)" }}
                            borderRadius="full"
                          />
                          <MenuList
                            bg={menuBg}
                            borderRadius="md"
                            shadow="sm"
                            minW="120px"
                          >
                            {!notification.isRead && (
                              <MenuItem
                                icon={<MdCheck size={12} />}
                                onClick={() => handleMarkAsRead(notification._id)}
                                fontSize="xs"
                              >
                                Mark as Read
                              </MenuItem>
                            )}
                            {notification.status?.toLowerCase() === "pending" && (
                              <>
                                <MenuItem
                                  icon={<MdCheck size={12} />}
                                  onClick={() => handleUpdateStatus(notification._id, "accepted")}
                                  fontSize="xs"
                                >
                                  Accept
                                </MenuItem>
                                <MenuItem
                                  icon={<MdClose size={12} />}
                                  onClick={() => handleUpdateStatus(notification._id, "declined")}
                                  fontSize="xs"
                                >
                                  Decline
                                </MenuItem>
                              </>
                            )}
                            <MenuItem
                              icon={<MdDelete size={12} />}
                              onClick={() => handleRemoveNotification(notification._id)}
                              fontSize="xs"
                            >
                              Remove
                            </MenuItem>
                            <MenuItem
                              icon={<MdOutlineReportGmailerrorred size={12} />}
                              onClick={() => handleReportNotification(notification._id)}
                              fontSize="xs"
                            >
                              Report issue
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Box>
                    </Flex>
                    <Text
                      fontSize={{ base: "xs", md: "sm" }}
                      color={subText}
                      display="flex"
                      alignItems="center"
                      whiteSpace="nowrap"
                    >
                      <BsClock size={12} style={{ marginRight: '4px' }} />
                      {formatCreatedAt(notification.timestamp) || 'Unknown'}
                    </Text>
                  </VStack>
                </Grid>
              </MotionBox>
            ))
          ) : (
            <Box
              textAlign="center"
              mt={4}
              p={2}
              borderRadius="lg"
              bg={bgCard}
              shadow="sm"
              w="100%"
              maxW="100%"
              overflow="hidden"
            >
              <Avatar
                bg={useColorModeValue("gray.100", "gray.600")}
                icon={<BsBell size={14} color={subText} />}
                size="xs"
                mb={1}
              />
              <Text fontSize={{ base: "sm", md: "md" }} fontWeight="medium" color={textColor}>
                No notifications with status "{filter}"
              </Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color={subText} mt={1}>
                Try a different filter or check back later ✨
              </Text>
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default NotificationComponent;