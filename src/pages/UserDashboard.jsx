import React, { useState, useEffect } from "react";
import { Box, useBreakpointValue, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import Sidebar from "../components/dashboard/Sidebar";
import MyTransaction from "../components/dashboard/MyTransaction";
import Profile from "../components/dashboard/Profile";
import BottomNav from "../components/dashboard/BottomNav";
import MiniNav from "../components/dashboard/MiniNav";

const UserDashboard = () => {
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleShowProfile = () => {
    setShowToggleContainer(false);
    setShowProfile(true);
  };

  const handleMyTransaction = () => {
    setShowToggleContainer(true);
    setShowProfile(false);
  };

  const handleSidebarCollapseChange = (isCollapsed) => {
    setIsSidebarCollapsed(isCollapsed);
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("access-token");
      if (!token) {
        console.warn("No access token found, redirecting to login");
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/users/user-details`);
        console.log("User details response:", response.data);
      } catch (error) {
        console.error("Token verification failed:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        if (error.response?.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please log in again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          localStorage.removeItem("access-token");
          localStorage.removeItem("refresh-token");
          navigate("/login");
        }
      }
    };
    verifyToken();
  }, [navigate, toast]);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const mainContentWidth = useBreakpointValue({
    base: "100%",
    md: isSidebarCollapsed ? "calc(100% - 80px)" : "calc(100% - 280px)",
  });

  return (
    <Box display="flex" minH="100vh" overflow="hidden">
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
        onCollapseChange={handleSidebarCollapseChange}
      />
      <Box
        display={{ base: "none", md: "block" }}
        position="fixed"
        top={0}
        right={0}
        w={mainContentWidth}
        h="100vh"
        overflowY="auto"
        transition="width 0.3s"
        className="scrollbar-thin scrollbar-thumb-[#B38939]/20 scrollbar-track-transparent"
      >
        <Box h="full">
          <Box display={showToggleContainer ? "block" : "none"}>
            {/* <MiniNav /> */}
            <Box p={5}>
              <MyTransaction />
            </Box>
          </Box>
          <Box display={showProfile ? "block" : "none"} p={5}>
            <Profile />
          </Box>
        </Box>
      </Box>
      <Box
        display={{ base: "block", md: "none" }}
        w="full"
        minH="100vh"
        overflowY="auto"
        pb={24}
      >
        <Box display={showToggleContainer ? "block" : "none"}>
          <MiniNav />
          <Box p={4}>
            <MyTransaction />
          </Box>
        </Box>
        <Box display={showProfile ? "block" : "none"} p={4}>
          <Profile />
        </Box>
        <BottomNav
          onShowProfile={handleShowProfile}
          onShowToggleComponent={handleMyTransaction}
        />
      </Box>
    </Box>
  );
};

export default UserDashboard;