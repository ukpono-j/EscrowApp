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

const MotionBox = motion(Box);
const BASE_URL = import.meta.env.VITE_BASE_URL;

const NotificationComponent = () => {
  // All hooks must be called at the top level and in the same order every time
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all", "pending", "accepted", "declined"
  const toast = useToast();

  // Theme colors - Move all useColorModeValue calls here to ensure consistent hook order
  const bgCard = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subText = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const highlightColor = useColorModeValue("yellow.50", "rgba(236, 201, 75, 0.1)");
  const menuBg = useColorModeValue("white", "gray.800");
  const monoBg = useColorModeValue("gray.100", "gray.700");
  const titleColor = "#9F7B34";

  // Badge colors for different statuses
  const badgeColors = {
    pending: "orange",
    accepted: "green",
    declined: "red",
    transaction: "purple"
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/notifications/notifications`);
        setNotifications(res.data);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error fetching notifications",
          description: "Please try again later",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const getFilteredNotifications = () => {
    if (filter === "all") return notifications;
    return notifications.filter(n => n.status === filter);
  };

  const handleRemoveNotification = async (id) => {
    try {
      // Fixed endpoint path
      await axios.delete(`${BASE_URL}/api/notifications/notifications/${id}`);
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

  const handleUpdateStatus = async (id, status) => {
    try {
      // Fixed endpoint path
      await axios.patch(`${BASE_URL}/api/notifications/notifications/${id}`, { status });
      setNotifications((prev) => 
        prev.map((n) => (n._id === id ? { ...n, status } : n))
      );
      toast({
        title: `Status updated to ${status}`,
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

  // Icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "transaction":
        return <MdOutlinePayment size={20} />;
      default:
        return <BsBell size={20} />;
    }
  };

  return (
    <Box mt={10} px={{ base: 4, md: 8 }}>
      <Flex 
        direction={{ base: "column", md: "row" }} 
        justify="space-between" 
        align={{ base: "start", md: "center" }}
        mb={6}
      >
        <Text
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="bold"
          color={titleColor}
          mb={{ base: 4, md: 0 }}
          display="flex"
          alignItems="center"
        >
          <MdNotifications size={28} style={{ marginRight: '12px' }} />
          Notifications
        </Text>

        <HStack spacing={2}>
          <Badge 
            as="button" 
            px={3} py={2} 
            borderRadius="full" 
            colorScheme={filter === "all" ? "blue" : "gray"}
            onClick={() => setFilter("all")}
            cursor="pointer"
          >
            All
          </Badge>
          <Badge 
            as="button" 
            px={3} py={2} 
            borderRadius="full" 
            colorScheme={filter === "pending" ? "orange" : "gray"}
            onClick={() => setFilter("pending")}
            cursor="pointer"
          >
            Pending
          </Badge>
          <Badge 
            as="button" 
            px={3} py={2} 
            borderRadius="full" 
            colorScheme={filter === "accepted" ? "green" : "gray"}
            onClick={() => setFilter("accepted")}
            cursor="pointer"
          >
            Accepted
          </Badge>
          <Badge 
            as="button" 
            px={3} py={2} 
            borderRadius="full" 
            colorScheme={filter === "declined" ? "red" : "gray"}
            onClick={() => setFilter("declined")}
            cursor="pointer"
          >
            Declined
          </Badge>
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
        <VStack spacing={5} align="stretch">
          {getFilteredNotifications().map((notification, index) => (
            <MotionBox
              key={notification._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              bg={notification.status === "pending" ? highlightColor : bgCard}
              borderRadius="xl"
              p={5}
              shadow="md"
              border="1px solid"
              borderColor={borderColor}
              position="relative"
              _hover={{ transform: "translateY(-2px)", shadow: "lg", transition: "all 0.3s" }}
            >
              <Flex direction={{ base: "column", md: "row" }} justify="space-between">
                <HStack spacing={4} mb={{ base: 4, md: 0 }} align="start" flex={1}>
                  <Avatar 
                    bg={badgeColors[notification.type] + ".100"} 
                    color={badgeColors[notification.type] + ".700"}
                    icon={getNotificationIcon(notification.type)}
                    size="md"
                  />
                  
                  <Box flex={1}>
                    <HStack mb={1} justify="space-between">
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        {notification.title}
                      </Text>
                      <Badge colorScheme={badgeColors[notification.status]} borderRadius="full" px={2}>
                        {notification.status}
                      </Badge>
                    </HStack>
                    
                    <Text fontSize="md" mb={2} color={textColor}>
                      {notification.message}
                    </Text>
                    
                    <HStack fontSize="sm" color={subText} spacing={4} mt={2}>
                      <Flex align="center">
                        <BsClock style={{ marginRight: '4px' }} />
                        {formatCreatedAt(notification.timestamp)}
                      </Flex>
                      
                      {notification.transactionId && (
                        <Tooltip label="Transaction ID">
                          <Text 
                            as="span" 
                            fontFamily="mono" 
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

                <HStack spacing={2} alignSelf={{ base: "flex-end", md: "center" }}>
                  {notification.status === "pending" && (
                    <>
                      <Tooltip label="Accept">
                        <IconButton
                          size="sm"
                          colorScheme="green"
                          icon={<MdCheck />}
                          onClick={() => handleUpdateStatus(notification._id, "accepted")}
                          borderRadius="full"
                        />
                      </Tooltip>
                      <Tooltip label="Decline">
                        <IconButton
                          size="sm"
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
                      size="sm"
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
          ))}

          {getFilteredNotifications().length === 0 && !loading && (
            <Box 
              textAlign="center" 
              mt={10} 
              p={10} 
              borderRadius="xl" 
              bg={bgCard} 
              border="1px dashed" 
              borderColor={borderColor}
            >
              <Avatar
                bg="gray.100"
                icon={<BsBell size={30} color="gray" />}
                size="lg"
                mb={4}
              />
              <Text fontSize="lg" fontWeight="medium" color={textColor}>
                No notifications {filter !== "all" ? `with status "${filter}"` : ""} 
              </Text>
              <Text fontSize="md" color={subText} mt={2}>
                You're all caught up ✨
              </Text>
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default NotificationComponent;