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
} from "@chakra-ui/react";
import { BsThreeDots } from "react-icons/bs";
import { MdDelete, MdOutlineReportGmailerrorred } from "react-icons/md";
import { motion } from "framer-motion";
import axios from "axios";
import { formatCreatedAt } from "../../utility/DateTimeStramp";

const MotionBox = motion(Box);
const BASE_URL = import.meta.env.VITE_BASE_URL;

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const bgCard = useColorModeValue("whiteAlpha.800", "whiteAlpha.100");
  const backdropBlur = "blur(12px)";
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subText = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.100", "whiteAlpha.200");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/notifications/notifications`);
        setNotifications(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRemoveNotification = (id) => {
    toast({
      title: "Notification removed.",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const handleReportNotification = (id) => {
    toast({
      title: "Reported to support.",
      status: "warning",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box mt={10} px={{ base: 4, md: 8 }}>
      <Text
        fontSize={{ base: "2xl", md: "3xl" }}
        fontWeight="bold"
        color="#9F7B34"
        // bgGradient="linear(to-r, teal.400, cyan.500)"
        // bgClip="text"
        mb={6}
      >
        Notifications
      </Text>

      {loading ? (
        <Spinner size="lg" color="cyan.400" />
      ) : (
        <VStack spacing={5} align="stretch">
          {notifications.map((notification, index) => (
            <MotionBox
              key={notification._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              bg={bgCard}
              backdropFilter={backdropBlur}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="2xl"
              p={5}
              shadow="lg"
              position="relative"
              _hover={{ transform: "scale(1.015)", transition: "all 0.3s" }}
            >
              <HStack justify="space-between" align="start">
                <Box>
                  <Text fontSize="md" fontWeight="medium" color={textColor}>
                    {notification.message}
                  </Text>
                  <Text fontSize="sm" mt={2} color={subText}>
                    {formatCreatedAt(notification.timestamp)}
                  </Text>
                </Box>

                <Menu placement="left-start">
                  <MenuButton
                    as={IconButton}
                    icon={<BsThreeDots />}
                    variant="ghost"
                    size="sm"
                    colorScheme="gray"
                    _hover={{ bg: hoverBg }}
                  />
                  <MenuList
                    bg={useColorModeValue("white", "gray.800")}
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
            </MotionBox>
          ))}

          {notifications.length === 0 && !loading && (
            <Box textAlign="center" mt={10}>
              <Text fontSize="md" color={subText}>
                No notifications yet. You're all caught up ✨
              </Text>
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default NotificationComponent;
