import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdLogout,
  MdDashboard,
  MdAddCircle,
  MdPerson,
  MdSecurity,
  MdMenu,
  MdClose,
} from "react-icons/md";
import { FaHandshake, FaExchangeAlt, FaUserShield } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { BsChevronDown, BsChevronRight } from "react-icons/bs";
import Logo from "../../assets/logo1.png";
import ThemeToggle from "../../ThemeToggle";
import {
  Box,
  Text,
  Flex,
  ScaleFade,
  useColorModeValue,
  Avatar,
  Image,
} from "@chakra-ui/react";
import "./Sidebar.css";

// Utility function to validate user response (inline for simplicity)
const validateUserResponse = (responseData) => {
  if (responseData.success && responseData.data?.user) {
    return responseData.data.user;
  }
  console.error("Invalid user data structure:", responseData);
  throw new Error(responseData.error || "Invalid user data received");
};

const Sidebar = ({ onShowProfile, onShowToggleComponent, onCollapseChange }) => {
  const location = useLocation();
  const [activeLink, setActiveLink] = useState(location.pathname);
  const toast = useToast();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [settingLinks, setSettingLinks] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobileView = window.innerWidth < 768;
      setIsMobile(mobileView);

      if (mobileView) {
        setIsSidebarVisible(false);
        setIsCollapsed(false);
      } else {
        setIsSidebarVisible(true);
        setIsCollapsed(window.innerWidth < 1024);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (!token) {
      console.warn("No auth token found, skipping user details fetch");
      handleLogout();
      return;
    }
    axios.defaults.headers.common["auth-token"] = token;

    axios
      .get(`${BASE_URL}/api/users/user-details`)
      .then((response) => {
        console.log("User details response:", response.data);
        try {
          const user = validateUserResponse(response.data);
          if (!user.firstName) {
            console.warn("No firstName in user details:", user);
            setUserName("User");
          } else {
            setUserName(user.firstName);
          }
        } catch (error) {
          console.error("Error validating user details:", {
            message: error.message,
            response: response.data,
          });
          toast({
            title: "Error fetching user details",
            description: error.message || "Invalid user data received",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          setUserName("User");
        }
      })
      .catch((error) => {
        console.error("Error fetching user details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        toast({
          title: "Error fetching user details",
          description: error.response?.data?.error || "An error occurred",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        if (error.response?.status === 401 || error.response?.status === 404) {
          handleLogout();
        }
        setUserName("User");
      });
  }, [toast]);

  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isMobile ? isSidebarVisible : isCollapsed);
    }
  }, [isCollapsed, isSidebarVisible, isMobile, onCollapseChange]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarVisible(!isSidebarVisible);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: <MdDashboard className="text-xl" /> },
    { to: "/create-transaction", label: "Create Transaction", icon: <MdAddCircle className="text-xl" /> },
    { to: "/join-transaction", label: "Join Transaction", icon: <FaHandshake className="text-xl" /> },
    { to: "/transactions/tab", label: "My Transactions", icon: <FaExchangeAlt className="text-xl" /> },
    { to: "/profile", label: "My Profile", icon: <MdPerson className="text-xl" /> },
  ];

  const setting_links = [
    { to: "#", label: "Security Settings", icon: <MdSecurity className="text-xl" /> },
  ];

  const securitySettingLinks = [
    { to: "/security-settings/kyc", label: "KYC", icon: <FaUserShield className="text-lg" /> },
  ];

  const handleLinkClick = (to) => {
    setActiveLink(to);
    setSettingLinks(false);
    if (isMobile) {
      setIsSidebarVisible(false);
    }
  };

  const handleSettingLinkClick = (to) => {
    setActiveLink(to);
    setSettingLinks(!settingLinks);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    delete axios.defaults.headers.common["auth-token"];
    toast({
      title: "Logout Successful!",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
    navigate("/");
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const Tooltip = ({ children, label }) => (
    <div className="group relative">
      {children}
      <div
        className={`absolute left-full ml-2 px-2 py-1 bg-gray-800 text-xs rounded-md whitespace-nowrap opacity-0 invisible transition-all duration-200 z-50 ${
          isCollapsed && !isMobile ? "group-hover:opacity-100 group-hover:visible" : ""
        }`}
      >
        {label}
      </div>
    </div>
  );

  const MobileToggle = () => (
    <button
      onClick={toggleSidebar}
      className="fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#B38939] to-[#8A6D2F] shadow-lg"
      aria-label="Toggle Sidebar"
    >
      <MdMenu className="text-white text-xl" />
    </button>
  );

  return (
    <>
      {isMobile && <MobileToggle />}

      <AnimatePresence>
        {(!isMobile || (isMobile && isSidebarVisible)) && (
          <motion.div
            key="sidebar"
            initial={{ x: isMobile ? "-100%" : 0 }}
            animate={{ x: 0 }}
            exit={{ x: isMobile ? "-100%" : 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 40 }}
          >
            <Box
              className="h-full flex flex-col shadow-xl"
              style={{
                background: useColorModeValue("white", "#0F172A"),
                width: isMobile ? "280px" : isCollapsed ? "80px" : "280px",
              }}
            >
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-shrink-0 border-b border-white/10">
                  <div className="flex items-center justify-between p-5">
                    {(!isCollapsed || isMobile) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link to="/dashboard" className="block">
                          <Image
                            src={Logo}
                            alt="Sylo"
                            h={["32px", "40px"]}
                            maxH="40px"
                            maxW="auto"
                            objectFit="contain"
                          />
                        </Link>
                      </motion.div>
                    )}

                    <button
                      onClick={toggleSidebar}
                      className={`flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors duration-200 ${
                        isCollapsed && !isMobile ? "mx-auto" : ""
                      }`}
                    >
                      {isMobile ? (
                        <MdClose className="text-[#9C7933]" />
                      ) : isCollapsed ? (
                        <MdMenu className="text-[#9C7933]" />
                      ) : (
                        <MdClose className="text-[#9C7933]" />
                      )}
                    </button>
                  </div>

                  <div className={`px-5 pb-5 ${isCollapsed && !isMobile ? "flex justify-center" : ""}`}>
                    <AnimatePresence>
                      {(!isCollapsed || isMobile) ? (
                        <motion.div
                          key="expanded-profile"
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B38939] to-[#8A6D2F] flex items-center justify-center text-lg font-bold shadow-lg ring-2 ring-[#B38939]/20">
                            {getInitials(userName)}
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm">Welcome back</p>
                            <h3 className="font-bold">{userName || "User"}</h3>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="collapsed-profile"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Tooltip label={userName || "User"}>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B38939] to-[#8A6D2F] flex items-center justify-center text-lg font-bold shadow-lg ring-2 ring-[#B38939]/20">
                              {getInitials(userName)}
                            </div>
                          </Tooltip>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex-grow font-[500] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#B38939]/20 scrollbar-track-transparent">
                  <div className={`px-3 py-5 ${isCollapsed && !isMobile ? "flex flex-col items-center" : ""}`}>
                    <div className="space-y-1">
                      {links.map((link, index) => (
                        <Tooltip key={index} label={isCollapsed && !isMobile ? link.label : ""}>
                          <motion.div
                            whileHover={{ x: isCollapsed && !isMobile ? 0 : 4 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.1 }}
                          >
                            <Link
                              to={link.to}
                              onClick={() => handleLinkClick(link.to)}
                              className={`flex items-center gap-3 px-4 side_links py-3 rounded-xl transition-all duration-200 ${
                                isCollapsed && !isMobile ? "justify-center" : ""
                              } ${
                                activeLink === link.to
                                  ? "bg-gradient-to-r from-[#B38939] to-[#8A6D2F] font-medium shadow-lg"
                                  : "font-[500] hover:bg-white/5"
                              }`}
                            >
                              <span className={activeLink === link.to ? "text-white" : "text-[#B38939]"}>
                                {link.icon}
                              </span>
                              {(!isCollapsed || isMobile) && (
                                <span className="text-sm whitespace-nowrap">{link.label}</span>
                              )}
                              {(!isCollapsed || isMobile) && activeLink === link.to && (
                                <motion.div
                                  layoutId="active-pill"
                                  className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white"
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                              )}
                            </Link>
                          </motion.div>
                        </Tooltip>
                      ))}
                    </div>

                    {(!isCollapsed || isMobile) && (
                      <div className="mt-8 mb-2">
                        <span className="px-4 text-xs uppercase tracking-wider font-bold mb-3 block">
                          Settings
                        </span>
                      </div>
                    )}

                    {isCollapsed && !isMobile && <div className="my-8 w-8 h-px bg-gray-700/30" />}

                    {setting_links.map((link, index) => (
                      <Tooltip key={index} label={isCollapsed && !isMobile ? link.label : ""}>
                        <div className="relative">
                          <motion.div
                            whileHover={{ x: isCollapsed && !isMobile ? 0 : 4 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.1 }}
                          >
                            <button
                              onClick={() => handleSettingLinkClick(link.to)}
                              className={`w-full flex items-center ${
                                isCollapsed && !isMobile ? "justify-center" : "justify-between"
                              } px-4 py-3 rounded-xl transition-all duration-200 ${
                                activeLink === link.to
                                  ? "bg-gradient-to-r from-[#B38939] to-[#8A6D2F] font-medium shadow-lg"
                                  : "hover:bg-white/5"
                              }`}
                            >
                              <div className={`flex items-center gap-3 ${isCollapsed && !isMobile ? "justify-center" : ""}`}>
                                <span className={activeLink === link.to ? "text-white" : "text-[#B38939]"}>
                                  {link.icon}
                                </span>
                                {(!isCollapsed || isMobile) && (
                                  <span className="text-sm whitespace-nowrap">{link.label}</span>
                                )}
                              </div>

                              {(!isCollapsed || isMobile) && (
                                <motion.div
                                  animate={{ rotate: settingLinks ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="w-5 h-5 rounded-full flex items-center justify-center bg-white/10"
                                >
                                  <BsChevronDown size={10} className="text-[#A47F35]" />
                                </motion.div>
                              )}
                            </button>
                          </motion.div>

                          {(!isCollapsed || isMobile) && (
                            <motion.div
                              initial={false}
                              animate={{ height: settingLinks ? "auto" : 0, opacity: settingLinks ? 1 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-12 pr-4 py-2 space-y-1">
                                {securitySettingLinks.map((settingLink, settingIndex) => (
                                  <motion.div
                                    key={settingIndex}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.1 }}
                                  >
                                    <Link
                                      to={settingLink.to}
                                      onClick={() => handleLinkClick(settingLink.to)}
                                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                        activeLink === settingLink.to ? "bg-[#B38939]/30 font-medium" : ""
                                      }`}
                                    >
                                      <span
                                        className={activeLink === settingLink.to ? "text-[#B38939]" : "text-[#A88136]"}
                                      >
                                        {settingLink.icon}
                                      </span>
                                      <span className="text-sm">{settingLink.label}</span>
                                    </Link>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </div>

                <div className="flex-shrink-0 mt-auto border-t border-white/10">
                  {(!isCollapsed || isMobile) ? (
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs">© 2025 Sylo</span>
                        <ThemeToggle />
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600/10 to-red-700/10 hover:from-red-600/20 hover:to-red-700/20 transition-all duration-200 text-sm font-medium"
                      >
                        <MdLogout className="text-red-500" />
                        <span className="text-red-500">Logout</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 flex justify-center">
                      <Tooltip label="Logout">
                        <button
                          onClick={handleLogout}
                          className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all duration-200"
                        >
                          <MdLogout className="text-red-500 text-xl" />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;