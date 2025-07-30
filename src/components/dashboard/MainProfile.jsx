import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import MyTransaction from "./MyTransaction";
import Profile from "./Profile";

const MainProfile = () => {
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

  // Function to handle sidebar collapse state changes
  const handleSidebarCollapseChange = (isCollapsed) => {
    setIsSidebarCollapsed(isCollapsed);
  };

  const handleShowProfile = () => {
    setShowToggleContainer(false);
    setShowProfile(true);
  };

  const handleMyTransaction = () => {
    setShowToggleContainer(true);
    setShowProfile(false);
  };

  return (
    <div className="border flex items-center border-black">
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
        onCollapseChange={handleSidebarCollapseChange}
      />

      {/* Desktop view */}
      <div
        className={`transition-all duration-300 flex-1 h-screen overflow-y-auto ${
          !isMobile ? (isSidebarCollapsed ? "ml-[80px]" : "ml-[280px]") : "ml-0"
        } md:block hidden`}
      >
        <div
          className={
            showToggleContainer ? "h-[auto] toggleContainer" : "hidden"
          }
        >
          <Profile />
        </div>
      </div>

      {/* Mobile view */}
      <div
        className={`fixed top-0 left-0 right-0 h-screen overflow-y-auto pt-[60px] pb-[80px] z-10 bg-gray-900 ${
          showToggleContainer ? "block" : "hidden"
        } md:hidden`}
        style={{
          left: isSidebarCollapsed ? "80px" : "0px",
          width: isSidebarCollapsed ? "calc(100% - 80px)" : "100%"
        }}
      >
        <div
          className={
            showToggleContainer ? "h-[auto] toggleContainer" : "hidden"
          }
        >
          <Profile />
        </div>
      </div>
    </div>
  );
};

export default MainProfile;