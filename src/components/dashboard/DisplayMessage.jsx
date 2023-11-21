// DisplayMessage.jsx
import React, { useEffect, useState, useRef } from "react";
import Roboto from "../../assets/robot.gif";
import Loading from "../../assets/loadings.gif";
import Profile from "../../assets/profile_icon.png";
import ChatInput from "./ChatInput";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import axios from "axios";
import "./DisplayMessage.css";
import { io } from "socket.io-client"; // Import socket.io-client
import Picker from "emoji-picker-react";
import { IoMdSend } from "react-icons/io";
import {
  BsClipboard,
  BsClipboard2Plus,
  BsEmojiSmile,
  BsSend,
} from "react-icons/bs";
import { MdAttachFile } from "react-icons/md";

const socket = io(BASE_URL); // Connect to the server

const DisplayMessage = ({ currentChat, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(null);
  const [emoji, setEmoji] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const scrollRef = useRef();
  const [mediaPreview, setMediaPreview] = useState(null);
  // const [mediaData, setMediaData] = useState([]);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [attach, setAttach] = useState(false);

  useEffect(() => {
    const socket = io(BASE_URL);
    console.log("Connected to the server");

    socket.on("msg-receive", (message) => {
      setNewMessage(message);
      console.log("Received message:", message);
    });

    return () => {
      socket.off("msg-receive");
      socket.disconnect(); // Disconnect the socket here
    };
  }, []);

  useEffect(() => {
    if (newMessage) {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      setNewMessage(null);
    }
  }, [newMessage, messages]);

  // ====================== Useffect for get text messages
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    try {
      setLoadingMessages(true);
      setAttach(false);
      if (currentUser && currentChat) {
        axios
          .get(`${BASE_URL}/get-messages`, {
            params: {
              from: currentUser._id,
              to: currentChat._id,
            },
          })
          .then((response) => {
            // Separate media messages and text messages
            const textMessages = response.data.filter(
              (message) => message.message.text
            );
            // Reverse the order to show newer messages below
            const sortedMessages = textMessages.sort((a, b) => {
              return new Date(a.createdAt) - new Date(b.createdAt);
            });

            setMessages(sortedMessages);
            setTimeout(() => {
              setLoadingMessages(false);
            }, 1000);
          })
          .catch((error) => {
            console.error("Error fetching messages:", error);
          });
      }
    } catch (error) {
      console.error("Error fetching uploads:", error);
    }

    try {
      if (currentUser && currentChat) {
        // Fetch transaction details from API and update the state
        axios
          .get(`${BASE_URL}/chat-message-uploads`, {
            params: {
              from: currentUser._id,
              to: currentChat._id,
            },
          })
          .then((response) => {
            // Filter media based on the sender and receiver
            // Separate media messages and text messages
            const mediaMessages = response.data.filter(
              (message) => message.message.media
            );

            const filteredMedia = mediaMessages.filter((media) => {
              console.log("Main Media", media);
              const isCurrentUser = media.message.users[0] === currentUser._id;
              const isCurrentChat = media.message.users[1] === currentChat._id;
              console.log("Media Data:", media.message.media);
              return isCurrentUser && isCurrentChat;
            });
            setUploadedMedia(filteredMedia);
            // setMessages(response.data);
            console.log("filtered Media All", filteredMedia);
            console.log("Response Data:", response.data);
            console.log("Filtered Media:", filteredMedia);
            console.log("Uploaded Media:", uploadedMedia);
          });
      }
    } catch (error) {
      console.error("Error fetching uploads:", error);
    }
  }, [currentUser, currentChat]);

  // ================= UseEffect for getting uploads
  // useEffect(() => {
  //   const token = localStorage.getItem("auth-token");
  //   if (token) {
  //     axios.defaults.headers.common["auth-token"] = token;
  //   }

  // }, [currentUser, currentChat]);

  // ====================== UseEffect for get text messages and uploads

  // Function to format the time difference
  const formatTimeDifference = (timestamp) => {
    const now = new Date();
    const createdAt = new Date(timestamp);

    const timeDifferenceInSeconds = Math.floor((now - createdAt) / 1000);

    if (timeDifferenceInSeconds < 60) {
      return `${timeDifferenceInSeconds} seconds ago`;
    } else if (timeDifferenceInSeconds < 3600) {
      const minutes = Math.floor(timeDifferenceInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (timeDifferenceInSeconds < 86400) {
      const hours = Math.floor(timeDifferenceInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else if (timeDifferenceInSeconds < 604800) {
      const days = Math.floor(timeDifferenceInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    } else if (timeDifferenceInSeconds < 2419200) {
      const weeks = Math.floor(timeDifferenceInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else if (timeDifferenceInSeconds < 29030400) {
      const months = Math.floor(timeDifferenceInSeconds / 2419200);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    } else {
      const years = Math.floor(timeDifferenceInSeconds / 29030400);
      return `${years} ${years === 1 ? "year" : "years"} ago`;
    }
  };

  const handleSendMessage = async ({ text }) => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }
    try {
      // Send the message with text and media information
      await axios.post(`${BASE_URL}/send-message`, {
        from: currentUser._id,
        to: currentChat._id,
        message: { text },
      });

      socket.emit("send-msg", {
        to: currentChat._id,
        from: currentUser._id,
        message: { text },
      });

      // Instead of using setNewMessage, directly update the messages state
      setMessages((prevMessages) => [
        ...prevMessages,
        { fromUserId: true, message: { text } },
      ]);
      console.log({ fromUserId: true, message: { text } });
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      socket.emit("add-user", currentUser._id);
    }

    return () => {
      socket.disconnect(); // Disconnect the socket when the component unmounts
    };
  }, [currentUser]);

  const handleEmojiPicker = () => {
    setEmoji(!emoji);
  };

  const handleEmojiClick = (chosenEmoji) => {
    let message = msg + chosenEmoji.emoji;
    setMsg(message);
  };

  const sendChat = (event) => {
    event.preventDefault();

    if (msg.length > 0 || selectedFile) {
      handleSendMessage({ text: msg });
      setMsg("");
      setEmoji(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);

    // Read and display the image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    if (file) {
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(null);
    }
  };

  const uploadMedia = async (fromUserId, toUserId) => {
    try {
      const formData = new FormData();
      formData.append("media", selectedFile);

      // Include "to" user ID in the request body

      formData.append("from", currentUser._id);
      formData.append("to", currentChat._id);

      // Use the new endpoint for file uploads
      await axios.post(`${BASE_URL}/chat-message-uploads`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

        // Update uploadedMedia state immediately
    // setUploadedMedia((prevUploadedMedia) => [...prevUploadedMedia, response.data]);

      // Clear the file input field after uploading the file
      setSelectedFile(null); 
      setAttach(!attach);
      // Clear the input field after uploading the file
      setMsg("");
    } catch (error) {
      console.error("Error uploading media:", error);
    }
  };

  // const combinedData = [...messages, ...uploadedMedia];

  const handleAttachToggle = () => {
    setAttach(!attach);
  };
  return (
    <div className="message-container relative  h-[80vh] ">
      {currentChat ? (
        <div className="relative">
          <div className="userDetails pt-2 pr-4 pl-4 pb-2 bg-[#0F1A2E]   w-[100%]  text-[#fff] flex items-center ">
            <div className="h-[40px] bg-[#fff] w-[40px] rounded-full border border-[grey]">
              <img
                src={currentChat.avatarImage || Profile}
                alt="userImg"
                className="w-[100%] h-[100%] rounded-full  "
              />
            </div>
            <div className="ml-1">
              <h2 className=" text-[14px]">{currentChat.firstName}</h2>
            </div>
          </div>

          <div
            style={{
              overflowY: "scroll",
            }}
            className="chat_messages h-[63vh]   w-[100%] "
          >
            {/* Display loading spinner while fetching messages */}
            {loadingMessages ? (
              <div className="bg-[#101010] h-[63vh]   flex flex-col  items-center justify-center ">
                <img
                  src={Loading}
                  alt=""
                  className="max-w-[300px] max-h-[400px]"
                />
                {/* <p className="font-[600] text-[17px] text-[#fff]">Loading messages...</p> */}
              </div>
            ) : (
              <div className="min-h-[auto] pt-2 pr-2  pl-2 pb-2 pt-5  pb-7">
                {[...messages, ...uploadedMedia]
                  .sort(
                    (a, b) =>
                      new Date(a.message.createdAt) -
                      new Date(b.message.createdAt)
                  )
                  .map((item, index) => {
                    const isMediaVisible =
                      item.message?.media &&
                      item.message.users.length === 2 &&
                      item.message.users[0] === currentUser._id &&
                      item.message.users[1] === currentChat._id;

                    return (
                      <div
                        key={index}
                        ref={
                          index === messages.length + uploadedMedia.length - 1
                            ? scrollRef
                            : null
                        }
                        className={
                          item.sender === currentUser._id ? "sent" : "received"
                        }
                      >
                        <div className="content">
                          {item.message?.text && <p>{item.message.text}</p>}
                          {isMediaVisible && (
                            <div className="max-w-[300px] max-h-[300px] border border-black">
                              {item.message.media ? (
                                <img
                                  src={`data:${item.message.media.mimetype};base64,${item.message.media}`}
                                  className="w-[200px] h-[100%] object-cover"
                                  alt="Uploaded Media"
                                  onLoad={() =>
                                    console.log("Image loaded successfully")
                                  }
                                  onError={(e) =>
                                    console.error("Error loading image:", e)
                                  }
                                />
                              ) : (
                                <p>No media available</p>
                              )}
                            </div>
                          )}
                          <div className="message-timestamp">
                            {item.message.createdAt && (
                              <span className="text-[10px]">
                                <span>
                                  {formatTimeDifference(item.message.createdAt)}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          <div className="chat_input bg-[#0F1A2E] relative  w-[100%]  border p-2 flex items-center">
            <div className="text-[23px] text-[#ffff00c8] cursor-pointer">
              <BsEmojiSmile onClick={handleEmojiPicker} />
            </div>
            <div>
              {attach && (
                <div className="rounded-2xl absolute left-0 bottom-[50px] flex  justify-center flex-col text-center  w-[auto] pl-2  pr-2   pt-2  pb-4    text-[#fff] bg-[#0F1A2E]">
                  {mediaPreview && (
                    <div className="max-h-[200px] w-[auto]  bg-[#0F1A2E] font-[600] flex items-center justify-center  rounded-2xl  border border-[#fff]">
                      <img
                        src={mediaPreview}
                        alt="Preview Image"
                        className="h-[100%] w-[100%] object-contain rounded-2xl"
                      />
                    </div>
                  )}
                  <div className="text-[12px] flex justify-center mt-3 w-[180px]">
                    <input
                      type="file"
                      accept="image/*, video/*" // Allow both image and video files
                      onChange={handleFileChange}
                      className="ml-1"
                    />
                  </div>
                  <button
                    onClick={uploadMedia}
                    className="submit mt-3 uppercase  text-[11px] font-[500]  rounded-xl pl-3 h-[33px]  w-[auto] flex items-center justify-center pr-3 pt-2 pb-2 bg-[#152D5D] text-[#fff]"
                  >
                    Send Upload
                  </button>
                </div>
              )}
              <div
                onClick={handleAttachToggle}
                className="text-[#fff] text-[21px] cursor-pointer"
              >
                <MdAttachFile />
              </div>
            </div>

            {/* ... Existing code ... */}

            <form
              onSubmit={(e) => sendChat(e)}
              action=""
              className="flex items-center w-[100%]"
            >
              <input
                type="text"
                placeholder="Type Message"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                className="p-2 h-[33px]  rounded-3xl text-[12px] ml-1  font-[Poppins] w-[100%]"
              />
              <button className="submit ml-2 rounded-xl pl-3 h-[33px]  w-[60px] flex items-center justify-center pr-3 pt-2 pb-2 bg-[#152D5D] text-[#fff]">
                <BsSend />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-col  items-center justify-center  min-h-[70vh]">
          <img src={Roboto} alt="" />
          <h2>Welcome to the Chat App, {currentUser?.firstName || "User"}!</h2>
          <p>Select a user to start chatting!</p>
        </div>
      )}
    </div>
  );
};

export default DisplayMessage;
