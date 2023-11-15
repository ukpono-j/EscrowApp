import React, { useState, useEffect } from "react";
import { AiFillMessage } from "react-icons/ai";
import { MdNotifications } from "react-icons/md";
import { Link } from "react-router-dom";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const MiniNav = () => {
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    // Fetch notifications count from the server when the component mounts
    const fetchNotificationCount = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/notifications`);
        // Calculate the count of unread notifications
        const unreadNotifications = response.data.filter(
          (notification) => !notification.read
        );
        setNotificationCount(unreadNotifications.length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotificationCount();
  }, []); // Empty dependency array ensures the effect runs once after the initial render

  return (
    <div className="flex items-center justify-between pr-5  md:pl-[60px] md:pr-[60px] pl-5   fixed z-30 top-0 pr-7 text-[#fff] text-[24px] h-[auto] w-[100%] md:w-[83.2%] bg-[#031420]">
      <div className="font-bold  flex md:hidden  cursor-pointer  md:text-3xl text-2xl uppercase">
        <Link to="/dashboard" className="outline-none">
        MiddleMan
        </Link>
        {/* 5B51FE */}
      </div>
      <div className="flex items-center justify-end w-[100%] ">
        <Link to="/messages" className="relative">
          <AiFillMessage className="ml-2 mr-2 mt-4 mb-4" />
        </Link>
        <Link to="/notifications" className="relative">
          <MdNotifications className="ml-2 mr-2 mt-4 mb-4" />
          {notificationCount > 0 && (
            <div className="text-[#fff] w-[10px] h-[10px] absolute top-[6px] font-[500] text-[11px] right-0">
              {notificationCount}
            </div>
          )}
        </Link>
      </div>
    </div>
  );
};

export default MiniNav;
