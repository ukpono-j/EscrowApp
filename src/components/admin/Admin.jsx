import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";

const Admin = () => {
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
        <AdminSidebar
          onShowProfile={handleShowProfile}
          onShowToggleComponent={handleMyTransaction}
        />
        <div
          style={{ overflowY: "scroll" }}
          className=" layout  bg-[#F4F5F5] fixed right-0 top-0 w-[100%]  md:w-[83.2%] min-h-[100vh]"
        >
          <div
            className={
              showToggleContainer ? "h-[auto] toggleContainer" : "hidden"
            }
          >
            {/* ======== MINI NAV */}
            {/* <div>
              <MiniNav />
            </div> */}

            {/* ============= Admin */}
            <div className="p-4 font-[Poppins] relative ">
                   Admin
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
