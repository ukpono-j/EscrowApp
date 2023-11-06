import React, { useState } from 'react'
import Sidebar from './Sidebar';
import MyTransaction from './MyTransaction';
import Profile from './Profile';
import BottomNav from './BottomNav';
import NewTransaction from './NewTransaction';
import MiniNav from './MiniNav';
// import Sidebar from "../components/dashboard/Sidebar";
// import MyTransaction from "../components/dashboard/MyTransaction";
// import Profile from "../components/dashboard/Profile";
// import BottomNav from "../components/dashboard/BottomNav";


const CreateTransaction = () => {
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
            className="layout  bg-[#F4F5F5] fixed right-0 top-0 w-[100%]  md:w-[83.2%] h-[100vh]"
          >
            <div
              className={
                showToggleContainer ? "h-[auto] toggleContainer" : "hidden"
              }
            >
                 <div>
              <MiniNav />
            </div>
                <NewTransaction/>
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
      );
}

export default CreateTransaction