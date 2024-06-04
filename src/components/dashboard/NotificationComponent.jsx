import React, { useEffect, useRef, useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import { MdDelete, MdOutlineReportGmailerrorred } from "react-icons/md";
const BASE_URL = import.meta.env.VITE_BASE_URL ;
import axios from "axios";
import {formatCreatedAt } from "../../utility/DateTimeStramp"

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/notifications/notifications`);
        setNotifications(response.data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchData();

  }, []); // Empty dependency array ensures this effect runs once after the initial render

  const handleToggle = () => {
    setOpenNotifications(!openNotifications);
  };
  const handleRemoveNotification = (notificationId) => {
    // Implement your logic to remove the notification with the given ID
    // Send a DELETE request to your server to remove the notification
    console.log("Removing notification with ID:", notificationId);
  };

  const handleReportNotification = (notificationId) => {
    // Implement your logic to report the notification with the given ID
    // Send a POST request to your server to report the notification
    console.log("Reporting notification with ID:", notificationId);
  };

  return (
    <div className="mt-16 ">
      <h1 className="md:text-[24px] text-[20px] font-[600]">Notification</h1>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="mt-2  w-[100%] h-[auto] relative flex justify-between pl-3  pt-2 pb-2 pr-3  rounded-xl bg-[#FFFFFF]"
        >
          <div>
            {/* <h1 className="font-[600] text-[14px]">{notification.title}</h1> */}
            <p className="text-[15px] pt-1">{notification.message}</p>
            <p className="text-[13px] mt-2">
              {formatCreatedAt(notification.timestamp)}
            </p>
          </div>
          <div className="text-[20px] cursor-pointer" onClick={handleToggle}>
            <BsThreeDots />
          </div>
        </div>
      ))}
      {openNotifications && (
        <div className="absolute z-10 bottom-10 left-1/2 transform -translate-x-1/2 bg-[#0F1A2E] text-[#fff] rounded-xl p-2">
          <div className="flex   cursor-pointer  items-center">
            <MdDelete className="text-[20px]" />
            <p className="pl-1 text-[13px]">Remove this notification</p>
          </div>
          <div className="flex cursor-pointer  items-center mt-2 ">
            <MdOutlineReportGmailerrorred className="text-[20px]" />
            <p className="pl-1 text-[13px]">
              Report issues to notification team
            </p>
          </div>
        </div>
      )}
    </div>
  );
};




export default NotificationComponent;
