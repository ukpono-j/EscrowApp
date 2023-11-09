import React, { useEffect, useState } from "react";
import { PiWarningCircleBold } from "react-icons/pi";
import { Link, useLocation, useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BASE_URL ;
import axios from "axios";
import { useToast } from "@chakra-ui/react";
import { MdLogout } from "react-icons/md";



const BottomNav = () => {
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const toast = useToast(); // Initialize useToast hook
  const navigate = useNavigate()


  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    // Fetch transaction details from API and update the state
    axios
      .get(`${BASE_URL}/user-details`, {
        headers: {
          "auth-token": token,
        },
      })
      .then((response) => {
        setUserName(response.data.firstName);
      });
  }, []);

  const handleLogout = () => {
    // Clear the authentication token from local storage
    localStorage.removeItem("auth-token");
    toast({
      title: "Logout Successful!",
      status: "success",
      duration: 2000, 
      isClosable: true,
    });
    // Redirect the user to the homepage or login page
    navigate("/");
  };
  
  const links = [
    { to: "/create-transaction", label: "Create Transaction" },
    { to: "/join-transaction", label: "Join Transaction" },
    { to: "/transactions/tab", label: "My Transaction" },
    { to: "/profile", label: "My Profile", icon: <PiWarningCircleBold className="text-[20px] text-[red]" /> },
    // { to: "#", label: "LogOut", onClick: handleLogout },
  ];

  return (
    <div className="w-[100%] sm:text-[14px] text-[12px] text-[#fff] font-[Poppins] flex items-center justify-center h-[60px] md:hidden bg-[#031420] fixed bottom-0">
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
      <span onClick={handleLogout} className="flex items-center pl-2"><MdLogout className="pr-1  text-[18px]" /> Log Out</span>
    </div>
  );
};

export default BottomNav;
