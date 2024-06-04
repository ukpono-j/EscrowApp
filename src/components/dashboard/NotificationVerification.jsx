import React, { useEffect, useState } from "react";
const BASE_URL = import.meta.env.VITE_BASE_URL ;
import axios from "axios";
import {formatCreatedAt } from "../../utility/DateTimeStramp"

const NotificationVerification = ({}) => {
  const [notifications, setNotifications] = useState([]);



  useEffect(() => {
    // Fetch notifications count from the server when the component mounts
    const fetchNotificationCount = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/notifications/notifications`);
        setNotifications(response.data)
        console.log(response.data)
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotificationCount();
  }, []); // Empty dependency array ensures the effect runs once after the initial render



  //   add  the handleCancel and handleComplete function to the buttons
  return (
    <div className="">
      {notifications.map((notificationVerification) => (
        <div
          key={notificationVerification.id}
          className="mt-2 w-[100%] h-[auto] relative flex justify-between pl-3 pt-2 pb-2 pr-3 rounded-xl bg-[#FFFFFF]"
        >
          <div>
            <h1 className="font-[600] text-[14px]">{notificationVerification.title}</h1>
            <p className="text-[15px] pt-1">
              {notificationVerification.message}
            </p>
            <p className="text-[13px] mt-2">
              {formatCreatedAt(notificationVerification.timestamp)}
            </p>
            {/* <p className="text-[15px] pt-1">
              {notificationVerification.status}
            </p> */}

            {/* <div className="flex items-center">
              <button
                className="pl-5 pr-5 text-[14px] m-3 pt-2 pb-2 rounded-xl bg-[#6149FA] text-[#fff]"
                onClick={() =>
                  handleResponse(notificationVerification.id, "accept")
                }
              >
                Accept
              </button>
              <button
                className="pl-5 pr-5 text-[14px] m-3 pt-2 pb-2 rounded-xl bg-[#6149FA] text-[#fff]"
                onClick={() =>
                  handleResponse(notificationVerification.id, "decline")
                }
              >
                Decline
              </button>
            </div> */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationVerification;
