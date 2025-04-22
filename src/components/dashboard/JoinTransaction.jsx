import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import MyTransaction from "./MyTransaction";
import Profile from "./Profile";
import BottomNav from "./BottomNav";
import MainJoinTransaction from "./MainJoinTransaction";
import MiniNav from "./MiniNav";
import { Box } from "@chakra-ui/react";

const JoinTransaction = () => {
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);



  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);

      // Auto-collapse sidebar on mobile by default
      if (isMobileView) {
        setIsSidebarCollapsed(true);
      }
    };

    // Initial check
    checkScreenSize();

    // Add event listener for resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);



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


  return (
    <Box className="flex h-screen overflow-hidden">
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
        onCollapseChange={handleSidebarCollapseChange}
      />
     <div 
        className={`transition-all duration-300 flex-1 h-screen ${
          !isMobile ? (isSidebarCollapsed ? "ml-[80px]" : "ml-[280px]") : "ml-0"
        }`}
      >
        <div className="h-full w-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#B38939]/20 scrollbar-track-transparent">
          {showToggleContainer ? (
            <div className=''>
              <MiniNav />
              <div  className="pr-[28px] pl-[100px] pt-10 md:pl-[30px]">
                <MainJoinTransaction sidebarCollapsed={isSidebarCollapsed} />
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-6">
              <Profile sidebarCollapsed={isSidebarCollapsed} />
            </div>
          )}
        </div>
      </div>
      <BottomNav
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
      />
    </Box>
  );
};

export default JoinTransaction;
