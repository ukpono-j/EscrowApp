import React, { useEffect, useState } from "react";
import { MdLogout } from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { BsChevronDown } from "react-icons/bs";
import Logo from "../../assets/logo3.png"


const Sidebar = () => {
  const location = useLocation();
  const [activeLink, setActiveLink] = useState(location.pathname);
  const toast = useToast();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [settingLinks, setSettingLinks] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    axios
      .get(`${BASE_URL}/api/users/user-details`, {
        headers: {
          "auth-token": token,
        },
      })
      .then((response) => {
        setUserName(response.data.firstName);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          handleLogout();
        } else {
          console.error("Error fetching user details:", error);
        }
      });
  }, []);

  const links = [
    { to: "/dashboard", label: "Home" },
    { to: "/create-transaction", label: "Create Transaction" },
    { to: "/join-transaction", label: "Join Transaction" },
    { to: "/transactions/tab", label: "My Transaction" },
    { to: "/profile", label: "My Profile" },
  ];

  const setting_links = [
    { to: "#", label: "Security Settings" },
    // Add more top-level setting links as needed
  ];

  const securitySettingLinks = [
    // { to: "#", label: "Security" },
    { to: "/security-settings/kyc", label: "KYC" },
    // Add more security setting links as needed
  ];

  const handleLinkClick = (to) => {
    setActiveLink(to);
    setSettingLinks(false); // Close the dropdown when a link is clicked
  };

  const handleSettingLinkClick = (to) => {
    setActiveLink(to);
    setSettingLinks(!settingLinks);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    toast({
      title: "Logout Successful!",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
    navigate("/");
  };

  return (
    <div className="border text-[13px] fixed md:flex hidden md:flex-col left-0 top-0 pl-3  pr-4 pt-3 pb-10 border-black w-[100%] font-[Poppins] text-[#fff] bg-[#111518] min-h-[100vh]">
      <h1 className="md:text-[23px] text-[20px] font-bold">
        <Link to="/dashboard">
        <img src={Logo} alt="Logo Detail"  className="w-[170px]"/>
        </Link>
      </h1>
      <h3 className="mt-10">
        Welcome <span>{userName}</span>
      </h3>
      <div className="flex pt-6 pb-6 items-center">
        <MdLogout className="text-[12px]" />
        <button className="ml-1" onClick={handleLogout}>
          Log Out
        </button>
      </div>
      <div className="mt-14">
        {links.map((link, index) => (
          <Link
            key={index}
            to={link.to}
            onClick={() => handleLinkClick(link.to)}
            className={`dash_links flex mt-2 mb-2  pr-3 text-[12px] pb-3 pt-3 cursor-pointer ${
              activeLink === link.to
                ? "text-[#fff] rounded-3xl bg-[#318AE6] mb-3 text-[#000] pl-3"
                : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
        <div className="setting_dropdown">
          {setting_links.map((link, index) => (
            <div key={index}>
                <Link
                  to={link.to}
                  onClick={() => handleSettingLinkClick(link.to)}
                  className={`dash_links flex   pr-2  text-[12px] pb-3 pr-3  pt-3  cursor-pointer ${
                    activeLink === link.to
                      ? "text-[#fff] rounded-3xl bg-[#318AE6] mb-3 text-[#000] pl-4"
                      : ""
                  }`}
                >
                  {link.label}
                  {link.to === "#" && (
                  <div className="border ml-2  p-1 rounded-full">
                    <BsChevronDown size={10} />
                  </div>
                )}
                </Link>

              {settingLinks && (
                <div className="pl-8">
                  {securitySettingLinks.map((settingLink, settingIndex) => (
                    <Link
                      key={settingIndex}
                      to={settingLink.to}
                      onClick={() => handleLinkClick(settingLink.to)}
                      className={`dash_links flex mt-2 mb-2  pr-3 text-[12px] pb-3 pt-3 cursor-pointer ${
                        activeLink === settingLink.to
                      }`}
                    >
                      {settingLink.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
