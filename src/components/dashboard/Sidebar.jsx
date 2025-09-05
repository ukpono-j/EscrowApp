import React, { useEffect, useState, useCallback, memo } from "react";
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
import {
  useToast,
  Box,
  Text,
  Flex,
  useColorModeValue,
  Image,
  Spinner,
} from "@chakra-ui/react";
import { BsChevronDown } from "react-icons/bs";
import axios from "../../utils/axiosConfig";
import Logo from "../../assets/logo1.png";
import ThemeToggle from "../../ThemeToggle";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Error Boundary
class SidebarErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Sidebar error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <Box p={4} color="red.500">Something went wrong in Sidebar.</Box>;
    }
    return this.props.children;
  }
}

const validateUserResponse = (responseData) => {
  if (
    responseData.success &&
    responseData.data?.user &&
    Object.keys(responseData.data.user).length > 0 &&
    responseData.data.user.firstName
  ) {
    return responseData.data.user;
  }
  console.error("Invalid user data structure:", responseData);
  throw new Error(responseData.error || "Invalid user data received");
};

// Optimized Sidebar Component
const Sidebar = memo(({ onShowProfile, onShowToggleComponent, onCollapseChange }) => {
  const location = useLocation();
  const [activeLink, setActiveLink] = useState(location.pathname === "/" ? "/dashboard" : location.pathname);
  const toast = useToast();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [settingLinks, setSettingLinks] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved !== null ? JSON.parse(saved) : window.innerWidth < 1024;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // Color mode values
  const bgColor = useColorModeValue("#FFFFFF", "#051E2F");
  const borderColor = useColorModeValue("#E2E8F0", "rgba(179, 137, 57, 0.1)");

  const checkScreenSize = useCallback(() => {
    const mobileView = window.innerWidth < 768;
    setIsMobile(mobileView);
    if (mobileView) {
      setIsSidebarVisible(false);
      setIsCollapsed(false);
    } else {
      setIsSidebarVisible(true);
      // Use saved collapsed state from localStorage or default to collapsed for < 1024px
      const savedCollapsed = JSON.parse(localStorage.getItem('sidebarCollapsed'));
      setIsCollapsed(savedCollapsed !== null ? savedCollapsed : window.innerWidth < 1024);
    }
  }, []);

  useEffect(() => {
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [checkScreenSize]);

  useEffect(() => {
    const currentPath = location.pathname === "/" ? "/dashboard" : location.pathname;
    setActiveLink((prev) => {
      if (prev !== currentPath) {
        return currentPath;
      }
      return prev;
    });
  }, [location.pathname]);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("access-token");
      if (!token) {
        console.warn("No access token found, redirecting to login");
        toast({
          title: "Session expired",
          description: "Please log in again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        handleLogout();
        return;
      }

      setIsUserLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/users/user-details`);
        console.log("User details response:", response.data);
        const user = validateUserResponse(response.data);
        setUserName(user.firstName || "User");
      } catch (error) {
        console.error("Error fetching user details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        toast({
          title: "Error fetching user details",
          description: error.message || "An error occurred while fetching user details.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        if (error.response?.status === 401 || error.response?.status === 404) {
          handleLogout();
        }
        setUserName("User");
      } finally {
        setIsUserLoading(false);
      }
    };
    verifyToken();
  }, [toast, navigate]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
    onCollapseChange?.(isMobile ? isSidebarVisible : isCollapsed);
  }, [isCollapsed, isSidebarVisible, isMobile, onCollapseChange]);


  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsSidebarVisible((prev) => !prev);
    } else {
      setIsCollapsed((prev) => {
        const newState = !prev;
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
        return newState;
      });
    }
  }, [isMobile]);

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: <MdDashboard className="text-xl" /> },
    { to: "/create-transaction", label: "Create Transaction", icon: <MdAddCircle className="text-xl" /> },
    { to: "/join-transaction", label: "Join Transaction", icon: <FaHandshake className="text-xl" /> },
    { to: "/transactions/tab", label: "My Transactions", icon: <FaExchangeAlt className="text-xl" /> },
    { to: "/profile", label: "My Profile", icon: <MdPerson className="text-xl" /> },
    { to: "/security-settings/kyc", label: "BVN Verification", icon: <FaUserShield className="text-lg" /> },
  ];
  const handleLinkClick = useCallback((to) => {
    setActiveLink(to);
    setSettingLinks(false);
    if (isMobile) {
      setIsSidebarVisible(false);
    }
    // Ensure sidebar remains collapsed if it was collapsed
    const savedCollapsed = JSON.parse(localStorage.getItem('sidebarCollapsed'));
    if (!isMobile && savedCollapsed) {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  const handleSettingLinkClick = useCallback((to) => {
    setActiveLink(to);
    setSettingLinks((prev) => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("access-token");
    localStorage.removeItem("refresh-token");
    toast({
      title: "Logout Successful!",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
    navigate("/login");
  }, [navigate, toast]);

  // Simple tooltip without animations
  const Tooltip = ({ children, label }) => (
    <div className="group relative">
      {children}
      {isCollapsed && !isMobile && (
        <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 z-50 shadow-lg">
          {label}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  );

  // Mobile toggle button
  const MobileToggle = () => {
    if (!isMobile || isSidebarVisible) return null;
    return (
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#B38939] to-[#BB954D] shadow-lg hover:shadow-xl transition-shadow duration-200"
        style={{ willChange: 'auto' }}
        aria-label="Toggle Sidebar"
      >
        <MdMenu className="text-white text-xl" />
      </button>
    );
  };

  // Calculate sidebar width without animations
  const sidebarWidth = isMobile ? (isSidebarVisible ? "260px" : "0px") : (isCollapsed ? "80px" : "260px");
  const sidebarOpacity = isMobile ? (isSidebarVisible ? 1 : 0) : 1;

  return (
    <SidebarErrorBoundary>
      <>
        <MobileToggle />
        <div
          className="fixed top-0 left-0 h-full z-40 transition-all duration-150 ease-out"
          style={{
            width: sidebarWidth,
            opacity: sidebarOpacity,
            minWidth: isMobile ? "0px" : "80px",
            transform: 'translate3d(0, 0, 0)',
            willChange: 'width, opacity',
            overflowX: 'hidden', // Enforce no horizontal scrolling
          }}
        >
          <Box
            className="h-full flex flex-col shadow-2xl"
            bg={bgColor}
            borderRight="1px"
            borderColor={borderColor}
            position="relative"
            style={{
              background: useColorModeValue(
                "linear-gradient(180deg, #FFFFFF 0%, #fff 100%)",
                "linear-gradient(180deg, #051E2F 0%, #041924 100%)"
              ),
              boxShadow: useColorModeValue(
                "0 8px 32px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(179, 137, 57, 0.08)",
                "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(179, 137, 57, 0.15)"
              ),
              overflowX: 'hidden', // Enforce no horizontal scrolling on Box
            }}
          >
            {/* Header Section */}
            <div className="flex-shrink-0 border-b border-opacity-20" style={{ height: "100px", borderColor, overflowX: 'hidden' }}>
              <div className="flex items-center justify-between p-4 h-full">
                {/* Logo */}
                <div
                  className="flex items-center justify-center overflow-hidden transition-opacity duration-150"
                  style={{
                    width: (!isCollapsed || isMobile) ? "180px" : "0px",
                    opacity: (!isCollapsed || isMobile) ? 1 : 0,
                    height: "48px",
                    overflowX: 'hidden',
                  }}
                >
                  <Link to="/dashboard" className="block">
                    <Image
                      src={Logo}
                      alt="Sylo"
                      style={{
                        maxHeight: "40px",
                        maxWidth: "160px",
                        width: "auto",
                        height: "auto",
                        objectFit: "contain",
                      }}
                      filter="drop-shadow(0 2px 4px rgba(179, 137, 57, 0.1))"
                    />
                  </Link>
                </div>

                {/* Toggle Button - Always visible */}
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center rounded-xl bg-gradient-to-br from-[#B38939]/10 to-[#BB954D]/10 hover:from-[#B38939]/20 hover:to-[#BB954D]/20 transition-colors duration-200 border border-[#B38939]/20"
                  style={{
                    width: "40px",
                    height: "40px",
                    minWidth: "40px",
                    flexShrink: 0
                  }}
                >
                  {isMobile ? (
                    <MdClose className="text-[#B38939] text-xl" />
                  ) : (
                    isCollapsed ? (
                      <MdMenu className="text-[#B38939] text-xl" />
                    ) : (
                      <MdClose className="text-[#B38939] text-xl" />
                    )
                  )}
                </button>
              </div>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 overflow-y-auto" style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(179, 137, 57, 0.3) transparent",
              overflowX: 'hidden', // Enforce no horizontal scrolling
            }}>
              <div className="p-4 space-y-2" style={{ overflowX: 'hidden' }}>
                {links.map((link, index) => (
                  <Tooltip key={link.to} label={isCollapsed && !isMobile ? link.label : ""}>
                    <Link
                      to={link.to}
                      onClick={() => handleLinkClick(link.to)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 relative ${isCollapsed && !isMobile ? "justify-center" : ""
                        } ${activeLink === link.to
                          ? "bg-gradient-to-r from-[#B38939] to-[#BB954D] text-white shadow-lg"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800/50"
                        }`}
                      style={{
                        width: isCollapsed && !isMobile ? "43px" : "100%",
                        maxWidth: isCollapsed && !isMobile ? "43px" : "100%", // Prevent overflow
                        height: "44px",
                        minWidth: isCollapsed && !isMobile ? "43px" : "auto",
                        overflowX: 'hidden',
                      }}
                    >
                      <span className={`${activeLink === link.to ? "text-white" : "text-[#B38939]"}`}>
                        {link.icon}
                      </span>

                      {(!isCollapsed || isMobile) && (
                        <span className="text-sm font-medium whitespace-nowrap">
                          {link.label}
                        </span>
                      )}
                    </Link>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Footer Section - Always visible and properly sized */}
            <div className="flex-shrink-0 border-t border-opacity-20 p-4" style={{ borderColor, minHeight: "80px", overflowX: 'hidden' }}>
              {isCollapsed && !isMobile ? (
                // Collapsed footer with centered logout
                <div className="flex items-center justify-center">
                  <Tooltip label="Logout">
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors duration-200 border border-red-500/20"
                      style={{
                        width: "43px",
                        height: "43px",
                        minWidth: "43px",
                        overflowX: 'hidden',
                      }}
                    >
                      <MdLogout className="text-red-500 text-xl" />
                    </button>
                  </Tooltip>
                </div>
              ) : (
                // Expanded footer
                <div className="flex flex-col gap-3">
                  <Flex align="center" justify="space-between">
                    <Text fontSize="xs" color="gray.500" fontWeight="medium">
                      © 2025 Sylo
                    </Text>
                    <ThemeToggle />
                  </Flex>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/15 transition-colors duration-200 font-medium border border-red-500/20 text-red-500"
                    style={{ overflowX: 'hidden' }}
                  >
                    <MdLogout className="text-xl" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </Box>
        </div>
      </>
    </SidebarErrorBoundary>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;