import React, { useState, useEffect } from "react";
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

  return (
    <div className="flex h-screen">
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
        onCollapseChange={handleSidebarCollapseChange}
      />
      <div
        className={`fixed top-0 right-0 h-screen transition-all duration-300 ${
          isSidebarCollapsed 
            ? "w-[calc(100%-80px)]" 
            : "w-[calc(100%-280px)]"
        } md:block hidden`}
      >
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#B38939]/20 scrollbar-track-transparent">
          <div
            className={
              showToggleContainer ? "h-auto" : "hidden"
            }
          >
            <MiniNav />
            <div className="p-5">
              <MyTransaction />
            </div>
          </div>
          <div className={showProfile ? "p-5" : "hidden"}>
            {/* =============== Profile Component ============= */}
            <Profile />
            {/* ===============End of Profile Component ============= */}
          </div>
        </div>
      </div>
      
      {/* Mobile view */}
      <div className="md:hidden w-full">
        <div
          className="min-h-screen w-full overflow-y-auto pb-24"
        >
          <div
            className={
              showToggleContainer ? "h-auto" : "hidden"
            }
          >
            <MiniNav />
            <div className="p-4">
              <MyTransaction />
            </div>
          </div>
          <div className={showProfile ? "p-4" : "hidden"}>
            <Profile />
          </div>
        </div>
        <BottomNav
          onShowProfile={handleShowProfile}
          onShowToggleComponent={handleMyTransaction}
        />
      </div>
    </div>
  );
};

export default UserDashboard;