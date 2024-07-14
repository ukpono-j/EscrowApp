import React, { useState } from "react";
import Sidebar from "./Sidebar";
import MyTransaction from "./MyTransaction";
import Profile from "./Profile";
import BottomNav from "./BottomNav";


const MainProfile = () => {
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
    <div className="border flex items-center border-black">
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
      />
      <div
        style={{ overflowY: "scroll" }}
        className="layout  bg-[#1A1E21] text-[#E4E4E4]   fixed right-0 top-0 w-[100%]  md:w-[83.2%] h-[100vh]"
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
