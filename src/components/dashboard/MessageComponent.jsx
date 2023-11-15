import React from "react";
import ChatComponent from "./ChatComponent";
import { BsThreeDotsVertical } from "react-icons/bs";
import DisplayMessage from "./DisplayMessage";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { useEffect, useState } from "react";
import axios from "axios";
import Profile from "../../assets/profile_icon.png";
import { useNavigate } from "react-router-dom";

const MessageComponent = () => {
  // const [messagerDetails, setMessagerDetails] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(undefined);
  const [contacts, setContacts] = useState([]);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [currentChat, setCurrentChat] = useState(undefined);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

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
        setCurrentUser(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Handle the error accordingly, e.g., redirect to login page
        throw error;
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        if (token) {
          axios.defaults.headers.common["auth-token"] = token;
        }
        console.log("Token from localStorage:", token);
        const response = await axios.get(`${BASE_URL}/all-user-details`, {
          headers: {
            "auth-token": token,
          },
        });
        console.log(response.data);
        setContacts(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Handle the error accordingly, e.g., redirect to login page
        throw error;
      }
    };
    fetchUserData();
  }, []);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
  };

  return (
    <div className="relative">
      <div className="mt-16    flex items-center">
        <div className="rounded-l-xl relative  text-[13px]  flex  md:flex-col left-0 top-0 w-[100%] font-[Poppins] text-[#fff] bg-[#0f1a2e] w-[280px] min-h-[auto]">
          <div
            // style={{ overflowY: "scroll" }}
            className="w-[100%] h-[100vh] sidebar_fixed pt-4 pb-4 pl-3 pr-3"
          >
            <div className="flex justify-between text-[17px]">
              <h2>{}Chat</h2>
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
              {setCurrentUser && (
                <div className="w-[38px] h-[38px] rounded-full">
                  <img
                    // src={BASE_URL + messagerDetails.avatarImage} // Assuming avatarImage is a URL
                    src={avatarUrl || Profile}
                    alt="user image"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              )}
            </div>
            <div className="mt-3">
              <ChatComponent
                contacts={contacts}
                currentUser={currentUser}
                changeChat={handleChatChange}
              />
            </div>
          </div>
        </div>
        <div
          style={{
            overflowY: "scroll",
            boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.2)", // Adjust the shadow as needed
          }}
          className="layout bg-[#F4F5F5]  right-0 rounded-r-3xl top-0 w-[100%]  md:w-[83.2%] h-[100vh]"
        >
          <div className="w-[100%]   sidebar_fixed  p-2   h-[100vh]">
            <DisplayMessage
              currentChat={currentChat}
              currentUser={currentUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageComponent;
