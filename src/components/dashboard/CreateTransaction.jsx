import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Profile from './Profile';
import BottomNav from './BottomNav';
import TransactionCreation from './TransactionCreation';
import MiniNav from './MiniNav';
import { Box, Text, Flex, Avatar } from "@chakra-ui/react";


const CreateTransaction = () => {
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
      
      {/* Main content area with conditional margin only on desktop */}
      <div 
        className={`transition-all duration-300 flex-1 h-screen ${
          !isMobile ? (isSidebarCollapsed ? "ml-[80px]" : "ml-[280px]") : "ml-0"
        }`}
      >
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#B38939]/20 scrollbar-track-transparent">
          {showToggleContainer ? (
            <div className=''>
              <MiniNav />
              <div className="">
                <TransactionCreation sidebarCollapsed={isSidebarCollapsed} />
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-6">
              <Profile sidebarCollapsed={isSidebarCollapsed} />
            </div>
          )}
        </div>
      </div>
      
      {/* Show bottom nav only when sidebar is collapsed on mobile */}
      {isMobile && isSidebarCollapsed && (
        <BottomNav
          onShowProfile={handleShowProfile}
          onShowToggleComponent={handleMyTransaction}
          className="fixed bottom-0 left-0 right-0 z-50"
        />
      )}
    </Box>
  );
};

export default CreateTransaction;