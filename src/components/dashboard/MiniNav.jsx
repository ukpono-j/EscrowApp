import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MdNotifications, MdNotificationsActive } from "react-icons/md";
import { Link } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Text,
  Flex,
  useColorModeValue,
  Avatar,
  SkeletonCircle,
  useToast,
  Tooltip,
  Badge,
  HStack,
} from "@chakra-ui/react";
import { debounce } from "lodash";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3001";

const MiniNav = () => {
  // All useState hooks first - always called in same order
  const [notificationCount, setNotificationCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [userData, setUserData] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);

  // All useColorModeValue hooks - always called in same order
  const bgColor = useColorModeValue("white", "#051E2F");
  const textColor = useColorModeValue("#1A202C", "white");
  const shadowColor = useColorModeValue("rgba(26, 32, 44, 0.08)", "rgba(0, 0, 0, 0.25)");
  const borderColor = useColorModeValue("rgba(26, 32, 44, 0.08)", "rgba(179, 137, 57, 0.1)");
  const hoverBg = useColorModeValue("rgba(179, 137, 57, 0.08)", "rgba(179, 137, 57, 0.15)");
  const notificationIconColor = useColorModeValue("#1A202C", "#B38939");
  const dividerColor = useColorModeValue("rgba(26, 32, 44, 0.15)", "rgba(179, 137, 57, 0.3)");
  const subTextColor = useColorModeValue("#718096", "#A0AEC0");
  const avatarBorderColor = useColorModeValue("#B38939", "#BB954D");
  const hoverBorderColor = useColorModeValue("rgba(179, 137, 57, 0.2)", "rgba(179, 137, 57, 0.4)");
  const enhancedHoverBg = useColorModeValue("rgba(179, 137, 57, 0.12)", "rgba(179, 137, 57, 0.2)");

  // useToast hook
  const toast = useToast();

  // useCallback hook
  const handleScroll = useCallback(
    debounce(() => {
      setScrolled(window.scrollY > 10);
    }, 100),
    []
  );

  // All useEffect hooks
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      handleScroll.cancel(); // Cleanup debounce
    };
  }, [handleScroll]);

  // Fetch user data and notifications
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("access-token");
        if (!token) {
          console.warn("No access token found for user data fetch");
          setUserData({});
          return;
        }
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Check localStorage cache
        const cachedUser = localStorage.getItem("userData");
        const cacheTimestamp = localStorage.getItem("userDataTimestamp");
        const cacheTTL = 5 * 60 * 1000; // 5 minutes
        if (cachedUser && cacheTimestamp && Date.now() - parseInt(cacheTimestamp) < cacheTTL) {
          setUserData(JSON.parse(cachedUser));
          return;
        }

        const response = await axios.get(`${BASE_URL}/api/users/user-details`);
        const user = response.data.data?.user || {};
        setUserData(user);
        // Cache user data
        localStorage.setItem("userData", JSON.stringify(user));
        localStorage.setItem("userDataTimestamp", Date.now().toString());
      } catch (error) {
        console.error("Error fetching user data:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        setUserData({});
        toast({
          title: "Error",
          description: "Failed to load user profile. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    const fetchNotificationCount = async (retries = 3, delay = 1000) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const token = localStorage.getItem("access-token");
          if (!token) {
            console.warn("No access token for notifications fetch");
            setNotificationCount(0);
            return;
          }
          const response = await axios.get(`${BASE_URL}/api/notifications/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000,
          });
          if (response.data.success) {
            const unreadNotifications = Array.isArray(response.data.data)
              ? response.data.data.filter((n) => !n.isRead)
              : [];
            setNotificationCount(unreadNotifications.length);
          } else {
            console.error("Failed to fetch notifications:", response.data.error);
            setNotificationCount(0);
          }
          return;
        } catch (error) {
          console.error(`Attempt ${attempt} failed to fetch notifications:`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });
          if (attempt === retries) {
            setNotificationCount(0);
            toast({
              title: "Error",
              description: "Unable to fetch notifications. Please check your connection.",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    };

    fetchUserData();
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 60000);
    return () => clearInterval(interval);
  }, [toast]);

  // Memoized avatar URL to prevent unnecessary re-computation
  const avatarUrl = useMemo(() => {
    if (!userData?.avatarImage) {
      return null;
    }
    const baseUrl = userData.avatarImage.startsWith("https://")
      ? userData.avatarImage
      : `${BASE_URL}${userData.avatarImage}`;
    return `${baseUrl}?t=${Date.now()}&size=small`; // Request smaller image if supported
  }, [userData?.avatarImage, userData?._id]);

  // Avatar handling with retry logic
  useEffect(() => {
    setIsAvatarLoading(true);
    setAvatarError(false);

    if (avatarUrl) {
      setAvatarPreview(avatarUrl);
    } else {
      setAvatarPreview(null);
    }
    setIsAvatarLoading(false);
  }, [avatarUrl]);

  // Memoized computed values
  const userName = useMemo(() => {
    return userData
      ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
      : "User";
  }, [userData]);

  const initials = useMemo(() => {
    return userName.split(" ").map((n) => n[0]).join("").toUpperCase() || "U";
  }, [userName]);

  const handleAvatarLoad = useCallback(() => {
    console.log("MiniNav avatar loaded successfully");
    setAvatarError(false);
    setIsAvatarLoading(false);
  }, []);

  const handleAvatarError = useCallback(() => {
    console.error("MiniNav avatar load error");
    setAvatarPreview(null);
    setAvatarError(true);
    setIsAvatarLoading(false);
  }, []);

  return (
    <>
      <Box
        as={motion.div}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed right-0 z-30 top-0 h-[80px] w-full"
        style={{
          backgroundColor: bgColor,
          boxShadow: scrolled 
            ? `0 8px 32px ${shadowColor}, 0 2px 8px ${shadowColor}` 
            : `0 1px 3px ${borderColor}`,
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${borderColor}`,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Flex
          align="center"
          justify="flex-end"
          h="full"
          maxW="100%"
          px={{ base: 4, md: 8, lg: 12 }}
        >
          {/* Right Side Actions */}
          <Flex align="center" gap={6}>
            {/* Notifications */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link to="/notifications" className="relative group">
                <Tooltip
                  label="View Notifications"
                  fontSize="sm"
                  bg="#1A202C"
                  color="white"
                  borderRadius="lg"
                  placement="bottom"
                  hasArrow
                  px={3}
                  py={2}
                >
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg={hoverBg}
                    border="1px solid"
                    borderColor="transparent"
                    _hover={{
                      borderColor: "#B38939",
                      bg: enhancedHoverBg,
                      transform: "translateY(-1px)",
                      shadow: `0 8px 25px rgba(179, 137, 57, 0.15)`,
                    }}
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    position="relative"
                    cursor="pointer"
                  >
                    {notificationCount > 0 ? (
                      <MdNotificationsActive 
                        className="text-2xl" 
                        style={{ color: "#B38939" }} 
                      />
                    ) : (
                      <MdNotifications 
                        className="text-2xl"
                        style={{ color: notificationIconColor }}
                      />
                    )}
                    
                    <AnimatePresence>
                      {notificationCount > 0 && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 500, 
                            damping: 20,
                            duration: 0.3 
                          }}
                          className="absolute -top-2 -right-2"
                        >
                          <Badge
                            bg="linear-gradient(135deg, #B38939, #BB954D)"
                            color="white"
                            fontSize="xs"
                            fontWeight="bold"
                            borderRadius="full"
                            minW="22px"
                            h="22px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            border="2px solid"
                            borderColor={bgColor}
                            className="pulse-notification"
                            boxShadow="0 2px 8px rgba(179, 137, 57, 0.4)"
                          >
                            {notificationCount > 99 ? "99+" : notificationCount}
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Box>
                </Tooltip>
              </Link>
            </motion.div>

            {/* Elegant Divider */}
            <Box
              w="1px"
              h="35px"
              bg={dividerColor}
              as={motion.div}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 35, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            />

            {/* User Profile Section */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link to="/profile" className="group">
                <Tooltip
                  label={`${userName} - View Profile`}
                  fontSize="sm"
                  bg="#1A202C"
                  color="white"
                  borderRadius="lg"
                  placement="bottom"
                  hasArrow
                  px={3}
                  py={2}
                >
                  <HStack
                    spacing={3}
                    p={2}
                    borderRadius="xl"
                    bg="transparent"
                    _hover={{
                      bg: hoverBg,
                      transform: "translateY(-1px)",
                      shadow: `0 8px 25px rgba(179, 137, 57, 0.12)`,
                    }}
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    cursor="pointer"
                    border="1px solid transparent"
                    _groupHover={{
                      borderColor: hoverBorderColor,
                    }}
                  >
                    {/* User Info - Only show on larger screens */}
                    <Box
                      display={{ base: "none", lg: "block" }}
                      textAlign="right"
                      lineHeight="1.2"
                    >
                      <Text
                        fontSize="sm"
                        fontWeight="600"
                        color={textColor}
                        mb={0}
                        letterSpacing="0.025em"
                      >
                        {userName}
                      </Text>
                      <Text
                        fontSize="xs"
                        color={subTextColor}
                        fontWeight="500"
                      >
                        Portfolio Manager
                      </Text>
                    </Box>

                    {/* Avatar */}
                    <Box position="relative">
                      {isAvatarLoading ? (
                        <SkeletonCircle size="44px" />
                      ) : (
                        <Avatar
                          size="md"
                          src={avatarPreview}
                          onLoad={handleAvatarLoad}
                          onError={handleAvatarError}
                          name={userName}
                          bg="linear-gradient(135deg, #B38939, #BB954D)"
                          color="white"
                          key={avatarPreview}
                          borderRadius="full"
                          border="3px solid"
                          borderColor={avatarBorderColor}
                          className="cursor-pointer"
                          _groupHover={{
                            borderColor: "#BB954D",
                            shadow: "0 4px 16px rgba(179, 137, 57, 0.3)",
                          }}
                          transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                        />
                      )}
                      
                      {/* Online Status Indicator */}
                      <Box
                        position="absolute"
                        bottom="2px"
                        right="2px"
                        w="12px"
                        h="12px"
                        bg="#10B981"
                        borderRadius="full"
                        border="2px solid"
                        borderColor={bgColor}
                        as={motion.div}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 400 }}
                      />
                    </Box>
                  </HStack>
                </Tooltip>
              </Link>
            </motion.div>
          </Flex>
        </Flex>
      </Box>

      {/* Enhanced Animations and Styles */}
      
    </>
  );
};

export default MiniNav;