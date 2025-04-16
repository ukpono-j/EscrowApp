import React, { useState } from "react";
import Sidebar from "../dashboard/Sidebar";
import MyTransaction from "../dashboard/MyTransaction";
import Profile from "../dashboard/Profile";
import BottomNav from "../dashboard/BottomNav";
import MiniNav from "./MiniNav";
import NotificationComponent from "./NotificationComponent";
import NotificationVerification from "./NotificationVerification";

const Notification = () => {
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
    <div>
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
            {/* ======== MINI NAV */}
            <div>
              <MiniNav />
            </div>

            {/* ============= Notification */}
            <div className="pl-4 pr-4  font-[Poppins] ">
              <NotificationComponent />
            </div>
            {/* <div className="pl-4 pr-4  font-[Poppins] ">
              <NotificationVerification />
            </div> */}
          </div>
          <div className={showProfile ? "profile" : "hidden"}>
            {/* =============== Profile Component ============= */}
            <Profile />
            {/* ===============End of Profile Component ============= */}
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

export default Notification;
