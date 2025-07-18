import React, { useState, useEffect } from "react";
import { AiFillMessage } from "react-icons/ai";
import { MdClose, MdMenu, MdNotifications } from "react-icons/md";
import { Link } from "react-router-dom";
import axios from "../../utils/axiosConfig";
import Logo from "../../assets/logo3.png";
import Logo2 from "../../assets/logo-m.png";
import Menu from "./Menu";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Text, Flex, ScaleFade, useColorModeValue, Avatar, SkeletonCircle } from "@chakra-ui/react";
import multiavatar from "@multiavatar/multiavatar/esm"; // Use ESM import

const BASE_URL = import.meta.env.VITE_BASE_URL;

const MiniNav = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) setScrolled(true);
      else setScrolled(false);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("access-token");
        if (token) axios.defaults.headers.common["access-token"] = token;

        const response = await axios.get(`${BASE_URL}/api/users/user-details`, {
          headers: { "access-token": token },
        });
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();

    const fetchNotificationCount = async (retries = 3, delay = 1000) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const token = localStorage.getItem("access-token");
          const response = await axios.get(`${BASE_URL}/api/notifications/notifications`, {
            headers: { "access-token": token },
            timeout: 30000,
          });
          if (response.data.success) {
            const unreadNotifications = response.data.data.filter((n) => !n.isRead);
            setNotificationCount(unreadNotifications.length);
          } else {
            console.error("Failed to fetch notifications:", response.data.error);
            setNotificationCount(0);
          }
          return; // Success, exit the loop
        } catch (error) {
          console.error(`Attempt ${attempt} failed:`, error);
          if (attempt === retries) {
            setNotificationCount(0);
            toast({
              title: "Error",
              description: "Failed to fetch notifications after multiple attempts.",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, delay * attempt)); // Exponential backoff
        }
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 60000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleMenuToggle = () => setMenu(!menu);

  const bgColor = useColorModeValue("white", "#0F172A");
  const textColor = useColorModeValue("#1E293B", "white");
  const shadowColor = useColorModeValue("rgba(0,0,0,0.05)", "rgba(0,0,0,0.2)");

  const userName = userData ? `${userData.firstName} ${userData.lastName}` : "";
  const avatarSeed = userData?.avatarSeed || userData?._id || "default-user";

  const getAvatarSvg = () => {
    try {
      const svg = multiavatar(avatarSeed);
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    } catch (error) {
      console.error("Error generating Multiavatar:", error);
      return `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="15" fill="#B38939" />
          <text x="50%" y="50%" font-size="12" fill="white" text-anchor="middle" dominant-baseline="middle">${avatarSeed.slice(0, 2)}</text>
        </svg>`
      )}`;
    }
  };

  return (
    <Box
      as={motion.div}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center justify-between md:pl-[60px] md:pr-[60px] px-5 fixed right-0 z-30 top-0 h-[70px] w-full ${scrolled ? "shadow-md" : ""}`}
      style={{
        backgroundColor: bgColor,
        boxShadow: scrolled ? `0 4px 20px ${shadowColor}` : "none",
        transition: "all 0.3s ease",
      }}
    >
      <div className="font-bold flex md:hidden cursor-pointer md:text-3xl text-2xl uppercase">
        <Link to="/dashboard" className="outline-none flex items-center">
          {/* <motion.img src={Logo2} alt="Logo" className="h-10 w-auto" whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} /> */}
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
                  {notificationCount > 9 ? "9+" : notificationCount}
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
          {userData ? (
            <Box
              as="div"
              width="32px"
              height="32px"
              borderRadius="full"
              overflow="hidden"
              className="cursor-pointer border-2 border-white dark:border-gray-800"
            >
              <img
                src={getAvatarSvg()}
                alt={`${userData.firstName}'s avatar`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getAvatarSvg();
                }}
              />
            </Box>
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