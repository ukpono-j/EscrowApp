import React, { useEffect, useState } from "react";
import Sidebar from "../dashboard/Sidebar";
import MyTransaction from "../dashboard/MyTransaction";
import Profile from "../dashboard/Profile";
import BottomNav from "../dashboard/BottomNav";
import MiniNav from "./MiniNav";
import NotificationComponent from "./NotificationComponent";

const Notification = () => {
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkScreenSize = () => {
        const isMobileView = window.innerWidth < 768;
        setIsMobile(isMobileView);
        if (isMobileView) setIsSidebarCollapsed(true);
      };
      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
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
         className={`transition-all duration-300 flex-1 ${!isMobile ? (isSidebarCollapsed ? "ml-[80px]" : "ml-[280px]") : "ml-0"}`}
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
            <div className="pl-4 pr-4">
              <NotificationComponent />
            </div>
            {/* <div className="pl-4 pr-4">
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