// Modified Sidebar.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdLogout, MdDashboard, MdAddCircle, MdPerson, MdSecurity, MdMenu, MdClose } from "react-icons/md";
import { FaHandshake, FaExchangeAlt, FaUserShield } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { BsChevronDown, BsChevronRight } from "react-icons/bs";
import Logo from "../../assets/logo1.png";
import ThemeToggle from "../../ThemeToggle";
import { Box, Text, Flex, ScaleFade, useColorModeValue, Avatar } from "@chakra-ui/react";
import "./Sidebar.css"


const Sidebar = ({ onShowProfile, onShowToggleComponent, onCollapseChange }) => {
  const location = useLocation();
  const [activeLink, setActiveLink] = useState(location.pathname);
  const toast = useToast();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [settingLinks, setSettingLinks] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkScreenSize();

    // Auto-collapse on mobile
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }

    // Add event listener for resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    axios
      .get(`${BASE_URL}/api/users/user-details`, {
        headers: {
          "auth-token": token,
        },
      })
      .then((response) => {
        setUserName(response.data.firstName);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          handleLogout();
        } else {
          console.error("Error fetching user details:", error);
        }
      });
  }, []);

  // Add this effect to notify parent component when collapse state changes
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    // If you want immediate notification, you can also call it here
    if (onCollapseChange) {
      onCollapseChange(!isCollapsed);
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
    setSettingLinks(false); // Close the dropdown when a link is clicked

    // Auto-collapse on mobile after link click
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  const handleSettingLinkClick = (to) => {
    setActiveLink(to);
    setSettingLinks(!settingLinks);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
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

  // Tooltip component for collapsed mode
  const Tooltip = ({ children, label }) => (
    <div className="group relative">
      {children}
      <div className={`absolute left-full ml-2 px-2 py-1 bg-gray-800 text-xs rounded-md whitespace-nowrap opacity-0 invisible transition-all duration-300 z-50 ${isCollapsed ? "group-hover:opacity-100 group-hover:visible" : ""}`}>
        <Text>
          {label}
        </Text>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay for mobile when sidebar is expanded */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 dashboard_sidebar bg-black/50 z-30 lg:hidden"
          onClick={toggleCollapse}
        />
      )}

      <Box
        className={`fixed left-0 top-0 h-screen bg-gradient-to-br from-[#] to-[#1E293B] flex flex-col shadow-xl transition-all duration-300 ${isMobile ? 'z-40' : 'z-30'
          } ${isCollapsed ? "w-[80px]" : "w-[280px]"
          }`}
        // Add a solid background color that adapts to theme mode
        bg={useColorModeValue("white", "#0F172A")}
        // Remove the gradient background and replace with solid color
        style={{
          backdropFilter: "none", // Ensure no blur effect
          background: useColorModeValue("white", "#0F172A"), // Solid background based on theme
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Main container with overflow handling */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header section */}
          <div className="flex-shrink-0 border-b border-white/10">
            {/* Logo and toggle button */}
            <div className="flex items-center justify-between p-5">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link to="/dashboard" className="block">
                    <img
                      src={Logo}
                      alt="EscrowPay"
                      className="h-8 w-auto transition-all duration-300 hover:opacity-80"
                    />
                  </Link>
                </motion.div>
              )}

              <button
                onClick={toggleCollapse}
                className={`flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors duration-200 ${isCollapsed ? "mx-auto" : ""
                  }`}
              >
                {isCollapsed ? (
                  <MdMenu className="text-[#9C7933]" />
                ) : (
                  <MdClose className="text-[#9C7933]" />
                )}
              </button>
            </div>

            {/* User Profile Section */}
            <div className={`px-5 font-[Poppins] pb-5 ${isCollapsed ? "flex justify-center" : ""}`}>
              <AnimatePresence>
                {!isCollapsed ? (
                  <motion.div
                    key="expanded-profile"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B38939] to-[#8A6D2F] flex items-center justify-center text-lg font-bold shadow-lg ring-2 ring-[#B38939]/20"
                    >
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
                    transition={{ duration: 0.3 }}
                  >
                    <Tooltip label={userName || "User"}>
                      <div
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B38939] to-[#8A6D2F] flex items-center justify-center text-lg font-bold shadow-lg ring-2 ring-[#B38939]/20"
                      >
                        {getInitials(userName)}
                      </div>
                    </Tooltip>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-grow font-[Poppins] font-[500] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#B38939]/20 scrollbar-track-transparent">
            {/* Navigation Links */}
            <div className={`px-3 py-5 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
              <div className="space-y-1">
                {links.map((link, index) => (
                  <Tooltip key={index} label={isCollapsed ? link.label : ""}>
                    <motion.div
                      whileHover={{ x: isCollapsed ? 0 : 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        to={link.to}
                        onClick={() => handleLinkClick(link.to)}
                        className={`flex items-center gap-3 px-4 side_links py-3 rounded-xl transition-all duration-300 ${isCollapsed ? "justify-center" : ""
                          } ${activeLink === link.to
                            ? "bg-gradient-to-r from-[#B38939] to-[#8A6D2F] font-medium shadow-lg"
                            : "font-[500] hover:bg-white/5"
                          }`}
                      >
                        <span className={activeLink === link.to ? "text-white" : "text-[#B38939]"}>
                          {link.icon}
                        </span>

                        {!isCollapsed && (
                          <Text>
                            <span className="text-sm whitespace-nowrap">{link.label}</span>
                          </Text>
                        )}

                        {!isCollapsed && activeLink === link.to && (
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

              {/* Settings Section */}
              {!isCollapsed && (
                <div className="mt-8 mb-2">
                  <Text className="px-4 text-xs uppercase tracking-wider font-bold mb-3">Settings</Text>
                </div>
              )}

              {isCollapsed && (
                <div className="my-8 w-8 h-px bg-gray-700/30" />
              )}

              {setting_links.map((link, index) => (
                <Tooltip key={index} label={isCollapsed ? link.label : ""}>
                  <div className="relative">
                    <motion.div
                      whileHover={{ x: isCollapsed ? 0 : 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={() => handleSettingLinkClick(link.to)}
                        className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl transition-all duration-300 ${activeLink === link.to
                          ? "bg-gradient-to-r from-[#B38939] to-[#8A6D2F] font-medium shadow-lg"
                          : "hover:bg-white/5"
                          }`}
                      >
                        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
                          <span className={activeLink === link.to ? "text-white" : "text-[#B38939]"}>
                            {link.icon}
                          </span>
                          {!isCollapsed && (
                            <Text className="text-sm whitespace-nowrap">{link.label}</Text>
                          )}
                        </div>

                        {!isCollapsed && (
                          <motion.div
                            animate={{ rotate: settingLinks ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-5 h-5 rounded-full flex items-center justify-center bg-white/10"
                          >
                            <BsChevronDown size={10} className="text-[#A47F35]" />
                          </motion.div>
                        )}
                      </button>
                    </motion.div>

                    {/* Dropdown Content with Animation */}
                    {!isCollapsed && (
                      <motion.div
                        initial={false}
                        animate={{ height: settingLinks ? "auto" : 0, opacity: settingLinks ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-12 pr-4 py-2 space-y-1">
                          {securitySettingLinks.map((settingLink, settingIndex) => (
                            <motion.div
                              key={settingIndex}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Link
                                to={settingLink.to}
                                onClick={() => handleLinkClick(settingLink.to)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 ${activeLink === settingLink.to
                                  ? "bg-[#B38939]/30 font-medium"
                                  : ""
                                  }`}
                              >
                                <span className={activeLink === settingLink.to ? "text-[#B38939]" : "text-[#A88136]"}>
                                  {settingLink.icon}
                                </span>
                                <Text className="text-sm">{settingLink.label}</Text>
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

          {/* Fixed footer section */}
          <div className="flex-shrink-0 font-[Poppins] mt-auto border-t border-white/10">
            {!isCollapsed ? (
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <Text>
                    <p className="text-xs">© 2025 EscrowPay</p>
                  </Text>
                  <ThemeToggle />
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600/10 to-red-700/10 hover:from-red-600/20 hover:to-red-700/20 transition-all duration-300 text-sm font-medium"
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
                    className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all duration-300"
                  >
                    <MdLogout className="text-red-500 text-xl" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </Box>
    </>
  );
};

export default Sidebar;