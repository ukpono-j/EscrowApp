import React, { useState } from "react";
import Sidebar from "./Sidebar";
import MyTransaction from "./MyTransaction";
import Profile from "./Profile";
import BottomNav from "./BottomNav";


const MainProfile = () => {
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);



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
      <div
        className={`fixed top-0 right-0 overflow-y-auto h-screen transition-all duration-300 ${isSidebarCollapsed
            ? "w-[calc(100%-80px)]"
            : "w-[calc(100%-280px)]"
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
      <BottomNav
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
      />
    </div>
  );
};

export default MainProfile;
