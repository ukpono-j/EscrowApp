import React, { useState, useEffect } from "react";
import { Box, useBreakpointValue } from "@chakra-ui/react";
import Sidebar from "../components/dashboard/Sidebar";
import MyTransaction from "../components/dashboard/MyTransaction";
import Profile from "../components/dashboard/Profile";
import BottomNav from "../components/dashboard/BottomNav";
import MiniNav from "../components/dashboard/MiniNav";

const UserDashboard = () => {
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleShowProfile = () => {
    setShowToggleContainer(false);
    setShowProfile(true);
  };

  const handleMyTransaction = () => {
    setShowToggleContainer(true);
    setShowProfile(false);
  };

  // Function to handle sidebar collapse state changes
  const handleSidebarCollapseChange = (isCollapsed) => {
    setIsSidebarCollapsed(isCollapsed);
  };

  // Use Chakra UI's breakpoint utility to determine mobile vs desktop
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Calculate main content width based on sidebar collapse state
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
      {/* Desktop view */}
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
            <MiniNav />
            <Box p={5}>
              <MyTransaction />
            </Box>
          </Box>
          <Box display={showProfile ? "block" : "none"} p={5}>
            <Profile />
          </Box>
        </Box>
      </Box>
      {/* Mobile view */}
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