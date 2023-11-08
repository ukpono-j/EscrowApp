import React from "react";
import ChatComponent from "./ChatComponent";
import { BsThreeDotsVertical } from "react-icons/bs";
import DisplayMessage from "./DisplayMessage";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { useEffect, useState } from "react";
import axios from "axios";

const MessageComponent = () => {
  const [messagerDetails, setMessagerDetails] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        if (token) {
          axios.defaults.headers.common["auth-token"] = token;
        }
        console.log("Token from localStorage:", token);
        const response = await axios.get(`${BASE_URL}/user-details`, {
          headers: {
            "auth-token": token,
          },
        });
        console.log(response.data);
        setMessagerDetails(response.data);

        // Assuming response.data.avatarImage is the base64 string of the image
        if (response.data.avatarImage) {
          setAvatarUrl(`data:image/png;base64,${response.data.avatarImage}`);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Handle the error accordingly, e.g., redirect to login page
        throw error;
      }
    };
    fetchUserData();
  }, []);

  return (
    <div className="relative">
      <div className="border mt-16    flex items-center border-black">
        <div className="border relative  text-[13px]  md:flex hidden md:flex-col left-0 top-0 border-black w-[100%] font-[Poppins] text-[#fff] bg-[#0f1a2e] w-[280px] min-h-[auto]">
          <div
            style={{ overflowY: "scroll" }}
            className="w-[100%] h-[100vh] sidebar_fixed p-2"
          >
            <div className="flex justify-between text-[17px]">
              <h2>Chat</h2>
              <BsThreeDotsVertical />
            </div>
            <div className="flex mt-3   items-center justify-between">
              <input
                type="text"
                name=""
                id=""
                className="border outline-none  bg-[transparent] text-[10px] h-[28px] pl-2 rounded-2xl text-[#fff] w-[70%]"
                placeholder="Search "
              />
              {messagerDetails && (
                <div className="w-[38px] h-[38px] rounded-full border border-[#fff]">
                  <img
                      // src={BASE_URL + messagerDetails.avatarImage} // Assuming avatarImage is a URL
                      src={avatarUrl}
                    alt="user image"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              )}
            </div>
            <div className="mt-3">
              <ChatComponent />
            </div>
          </div>
        </div>
        <div
          style={{ overflowY: "scroll" }}
          className="layout bg-[#F4F5F5]  right-0 top-0 w-[100%]  md:w-[83.2%] h-[100vh]"
        >
          <div className="w-[100%]  sidebar_fixed p-2   h-[100vh]">
            <DisplayMessage />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageComponent;
