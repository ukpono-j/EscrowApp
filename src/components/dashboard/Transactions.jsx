import React, { useState } from "react";
import Sidebar from "./Sidebar";
import MyTransaction from "./MyTransaction";
import Profile from "./Profile";
import BottomNav from "./BottomNav";
import MiniNav from "./MiniNav";

const Transaction = () => {
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
    <div className="flex items-center">
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
      />
      <div
        style={{ overflowY: "scroll" }}
        className="layout  bg-[#F4F5F5] fixed right-0 top-0 w-[100%]  md:w-[83.2%]  h-[100vh]"
      >
        <div
          className={
            showToggleContainer ? "h-[auto] toggleContainer" : "hidden"
          }
        >
          {" "}
          <div>
            <MiniNav />
          </div>
          <MyTransaction />
        </div>
      </div>
      <BottomNav
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
      />
    </div>
  );
};

export default Transaction;
