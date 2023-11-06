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

  const handleShowProfile = () => {
    setShowToggleContainer(false);
    setShowProfile(true);
  };

  const handleMyTransaction = () => {
    setShowToggleContainer(true);
    setShowProfile(false);
  };

  return (
    <div>
      <div className="border flex items-center border-black">
        <Sidebar
          onShowProfile={handleShowProfile}
          onShowToggleComponent={handleMyTransaction}
        />
        <div
          style={{ overflowY: "scroll" }}
          className=" layout  bg-[#F4F5F5] fixed right-0 top-0 w-[100%]  md:w-[83.2%] h-[100vh]"
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
