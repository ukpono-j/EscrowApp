import React, { useEffect, useState } from "react";
import { MdLogout } from "react-icons/md";
import { Link, useLocation,  useNavigate  } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL ;


const Sidebar = () => {
  const location = useLocation();
  const [activeLink, setActiveLink] = useState(location.pathname);
  const toast = useToast(); // Initialize useToast hook
  const navigate = useNavigate()
  const [userName, setUserName] = useState("");


    // UseEffect for create transaction
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

  const links = [
    { to: "/create-transaction", label: "Create Transaction" },
    { to: "/join-transaction", label: "Join Transaction" },
    { to: "/transactions/tab", label: "My Transaction" },
    { to: "/profile", label: "My Profile" },
  ];

  const handleLinkClick = (to) => {
    setActiveLink(to);
  };
  const handleLogout = () => {
    // Clear the authentication token from local storage
    localStorage.removeItem("auth-token");
    toast({
      title: "Logout Successful!",
      status: "success",
      duration: 2000, // Toast message duration in milliseconds
      isClosable: true,
    });
    // Redirect the user to the homepage or login page
    navigate("/");
  };

  return (
    <div className="border text-[13px] fixed md:flex hidden md:flex-col left-0 top-0 pl-4 pr-4 pt-3 pb-10 border-black w-[100%] font-[Poppins] text-[#fff] bg-[#031420] min-h-[100vh]">
      <h1 className="text-[26px] font-bold">
        <Link to="/dashboard">MiddleMan</Link>
      </h1>
      <h3 className="mt-10">Welcome <span>{userName}</span></h3>
      <div className="flex pt-6 pb-6 items-center">
        <MdLogout className="text-[18px]" />
        <button className="ml-1" onClick={handleLogout}>
          Log Out
        </button>
      </div>
      <div className="mt-14">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => handleLinkClick(link.to)}
            className={`dash_links flex mt-2 mb-2 pl-4 pr-3 pb-3 pt-3 cursor-pointer ${
              activeLink === link.to ? "text-[#fff] rounded-3xl bg-[#81712E] mb-3 text-[#000]" : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
