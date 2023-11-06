import React from "react";
import { PiWarningCircleBold } from "react-icons/pi";
import { Link, useLocation } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();

  const links = [
    { to: "/create-transaction", label: "Create Transaction" },
    { to: "/join-transaction", label: "Join Transaction" },
    { to: "/transactions/tab", label: "My Transaction" },
    { to: "/profile", label: "My Profile", icon: <PiWarningCircleBold className="text-[20px] text-[red]" /> },
  ];

  return (
    <div className="w-[100%] sm:text-[14px] text-[13px] text-[#fff] font-[Poppins] flex items-center justify-center h-[60px] md:hidden bg-[#0F1A2E] fixed bottom-0">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={`h-[40px] flex items-center ml-2 mr-2 ${location.pathname === link.to ? "text-[red]" : ""}`}
        >
          {link.icon}
          <span className={link.icon ? "pl-1" : ""}>{link.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default BottomNav;
