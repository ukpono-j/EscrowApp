import React from "react";
import ChatComponent from "./ChatComponent";
import { BsThreeDotsVertical } from "react-icons/bs";
import DisplayMessage from "./DisplayMessage";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Profile from "../../assets/profile_icon.png";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const MessageComponent = () => {
  const socket = useRef();
  // const [messagerDetails, setMessagerDetails] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(undefined);
  const [contacts, setContacts] = useState([]);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [currentChat, setCurrentChat] = useState(undefined);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState([]);

  // Initialize socket outside the component
  useEffect(() => {
    socket.current = io(BASE_URL);

    // Clean up socket connection when the component unmounts
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      socket.current.emit("add-user", currentUser._id);
    }
  }, [currentUser]);

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
        setAvatarUrl(`${BASE_URL}/images/${response.data.avatarImage}`);
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
        setFilteredContacts(response.data);
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

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Filter contacts based on the search query
    const filtered = contacts.filter(
      (contact) =>
        contact.firstName.toLowerCase().includes(query.toLowerCase()) ||
        contact.email.toLowerCase().includes(query.toLowerCase()) ||
        contact._id.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredContacts(filtered);
  };
  return (
    <div
      className="relative rounded-3xl"
      style={{
        boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.5)", // Adjust the shadow as needed
      }}
    >
      <div className="mt-16  relative w-[100%]  flex items-center">
        <div className="rounded-l-xl  text-[13px]  flex  md:flex-col left-0 top-0 w-[100%] font-[Poppins] text-[#fff] bg-[#0f1a2e] w-[280px] h-[80vh] ">
          <div
            style={{ overflowY: "scroll" }}
            className=" pt-4 pb-4 pl-3 pr-3 h-[80vh]"
          >
            <div className="flex justify-between text-[17px]">
              <h2 className="text-[14px] font-[600] uppercase">{}Chat</h2>
              <BsThreeDotsVertical />
            </div>
            <div className="flex mt-3   items-center justify-between">
              <input
                type="text"
                name=""
                id=""
                className="border outline-none  bg-[transparent] text-[10px] h-[28px] pl-2 rounded-2xl text-[#fff] w-[70%]"
                placeholder="Search "
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {currentUser  && (
                <div className="w-[38px] h-[38px]  bg-[#fff] rounded-full  border border-[#0F1A2E]">
                  <img
                    // src={BASE_URL + messagerDetails.avatarImage} // Assuming avatarImage is a URL
                    // src={avatarUrl || Profile}
                    // src={currentUser.avatarImage || Profile}
                    // src={`${BASE_URL}/images/${currentUser.avatarImage}` || Profile}
                    src={currentUser.avatarImage ? `${BASE_URL}/images/${currentUser.avatarImage}` : Profile}
                    alt="user image"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              )}
            </div>
            <div className="mt-3">
              <ChatComponent
                contacts={filteredContacts}
                currentUser={currentUser}
                changeChat={handleChatChange}
              />
            </div>
          </div>
        </div>
        <div
          style={{
            // overflowY: "scroll",
            boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.5)", // Adjust the shadow as needed
          }}
          className=" bg-[#F4F5F5] relative  right-0 rounded-r-xl top-0 w-[100%]  md:w-[100%%] h-[80vh]"
        >
          <div className="h-[auto] ">
            <DisplayMessage
              currentChat={currentChat}
              // socket={socket}
              currentUser={currentUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageComponent;
