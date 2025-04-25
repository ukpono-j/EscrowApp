import React, { useState, useEffect } from "react";
import { AiFillMessage } from "react-icons/ai";
import { MdClose, MdMenu, MdNotifications } from "react-icons/md";
import { Link } from "react-router-dom";
import axios from "axios";
import Logo from "../../assets/logo3.png";
import Logo2 from "../../assets/logo-m.png";
import Menu from "./Menu";
import { motion, AnimatePresence } from "framer-motion";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { Box, Text, Flex, ScaleFade, useColorModeValue, Avatar, SkeletonCircle } from "@chakra-ui/react";

const MiniNav = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userData, setUserData] = useState(null);

  // Function to handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Fetch user details
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        if (token) {
          axios.defaults.headers.common["auth-token"] = token;
        }

        const response = await axios.get(`${BASE_URL}/api/users/user-details`, {
          headers: {
            "auth-token": token,
          },
        });
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();


    // Fetch notifications count from the server when the component mounts
    const fetchNotificationCount = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/notifications/notifications`);
        // Calculate the count of unread notifications
        const unreadNotifications = response.data.filter(
          (notification) => !notification.read
        );
        setNotificationCount(unreadNotifications.length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotificationCount();
  }, []); // Empty dependency array ensures the effect runs once after the initial render

  const handleMenuToggle = () => {
    setMenu(!menu);
  };

  // Get colors based on theme
  const bgColor = useColorModeValue("white", "#0F172A");
  const textColor = useColorModeValue("#1E293B", "white");
  const shadowColor = useColorModeValue("rgba(0,0,0,0.05)", "rgba(0,0,0,0.2)");


  // Get user's name for avatar fallback
  const userName = userData ? `${userData.firstName} ${userData.lastName}` : "";

  return (
    <Box
      as={motion.div}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center justify-between md:pl-[60px] md:pr-[60px] px-5 fixed right-0 z-30 top-0 h-[70px] w-full ${scrolled ? "shadow-md" : ""
        }`}
      style={{
        backgroundColor: bgColor,
        boxShadow: scrolled ? `0 4px 20px ${shadowColor}` : "none",
        transition: "all 0.3s ease",
      }}
    >
      <div className="font-bold flex md:hidden cursor-pointer md:text-3xl text-2xl uppercase">
        <Link to="/dashboard" className="outline-none flex items-center">
          {/* <motion.img
            src={Logo2}
            alt="Logo"
            className="h-10 w-auto"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          /> */}
        </Link>
      </div>

      <div className="flex items-center justify-end w-full gap-1">
        <Link to="/notifications" className="relative">
          <motion.div
            className="relative p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Text color={textColor}>
              <MdNotifications className="text-2xl text-[#B38939]" />
            </Text>

            <AnimatePresence>
              {notificationCount > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>

        <motion.div
          className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"
          initial={{ height: 0 }}
          animate={{ height: 32 }}
          transition={{ delay: 0.2 }}
        />

        <motion.div
          className="relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* <Avatar
            size="sm"
            name={userName}
            src={avatarUrl}
            bg={!avatarUrl ? "linear-gradient(to bottom right, #B38939, #8A6D2F)" : undefined}
            className="cursor-pointer border-2 border-white dark:border-gray-800"
          /> */}
          {userData ? (
            userData.avatarImage ? (
              <Box
                as="div"
                width="32px"
                height="32px"
                borderRadius="full"
                overflow="hidden"
                className="cursor-pointer border-2 border-white dark:border-gray-800"
              >
                <img
                  src={`${BASE_URL}/${userData.avatarImage}`}
                  alt={`${userData.firstName}'s avatar`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    // console.log("Image failed to load");
                    e.target.onerror = null;
                    e.target.src = UserProfile; // Make sure to import this default image
                  }}
                />
              </Box>
            ) : (
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <SkeletonCircle
                  size="8"
                  startColor="gray.200"
                  endColor="gray.300"
                  speed={1}
                  className="border-2 border-white dark:border-gray-800"
                />
              </motion.div>
            )
          ) : (
            <Avatar
              size="sm"
              bg="linear-gradient(to bottom right, #B38939, #8A6D2F)"
              className="cursor-pointer border-2 border-white dark:border-gray-800"
            />
          )}

        </motion.div>
      </div>
    </Box>
  );
};

export default MiniNav;