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
  BsCloudDownload,
  BsEmojiSmile,
  BsSend,
} from "react-icons/bs";
import { MdAttachFile } from "react-icons/md";

const socket = io(BASE_URL); // Connect to the server

const DisplayMessage = ({ currentChat, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(null);
  const [newMessageMedia, setNewMessageMedia] = useState(null);
  const [emoji, setEmoji] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const scrollRef = useRef();
  const [mediaPreview, setMediaPreview] = useState(null);
  // const [mediaData, setMediaData] = useState([]);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [attach, setAttach] = useState(false);
  const [data, setData] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  useEffect(() => {
    const socket = io(BASE_URL);
    console.log("Connected to the server");

    socket.on("msg-receive", (message) => {
      // setNewMessage(message);

      setMessages((prevMessages) => {
        // Find the index of the last message in the messages array
        const lastMessageIndex = prevMessages.findIndex(
          (msg) => msg.message.createdAt === prevMessages[prevMessages.length - 1]?.message.createdAt
        );
  
        // Create a new array with the new text message added under the last message
        const newMessages = [
          ...messages.slice(0, lastMessageIndex + 1),
          { fromUserId: true, message },
          ...messages.slice(lastMessageIndex + 1),
        ];

        setMessages(newMessages);
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });

        return null; // Set newMessage to null to prevent unnecessary re-render
      });

      console.log("Received message:", message);
    });

    return () => {
      socket.off("msg-receive");
      socket.disconnect(); // Disconnect the socket here
    };

    socket.on("media-receive", (media) => {
      setNewMessageMedia({ fromUserId: true, message: { media } });
      console.log("Received media:", media);
    });

    return () => {
      // Existing code...
      socket.off("media-receive");
    };
  }, []);

  useEffect(() => {
    if (newMessage) {
      // setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessages((prevMessages) => [newMessage, ...prevMessages]);
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      setNewMessage(null);
    }
  }, [newMessage, messages]);

  // ====================== Useffect for get text messages

  // Existing code ...

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
  }, [currentUser, currentChat]);

  useEffect(() => {
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
            const mediaMessages = response.data.filter(
              (message) => message.message.media
            );

            // Update the uploadedMedia state with media messages
            setUploadedMedia(mediaMessages);
            setMediaPreview(null);
            setSelectedFile(null);
            console.log("Uploaded Media:", response.data); // Log the response.data directly
          });
      }
    } catch (error) {
      console.error("Error fetching uploads:", error);
      setMediaLoading(false);
      setAttach(false);
    }
  }, [currentUser, currentChat]);

  // Create a separate function to fetch chat-message-uploads
  const fetchChatMessageUploads = () => {
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
            const mediaMessages = response.data.filter(
              (message) => message.message.media
            );

            // Update the uploadedMedia state with media messages
            setUploadedMedia(mediaMessages);
            setMediaPreview(null);
            setSelectedFile(null);
            console.log("Uploaded Media:", response.data); // Log the response.data directly
          });
      }
    } catch (error) {
      console.error("Error fetching uploads:", error);
    }
  };

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
    console.log("dfd");
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
      setLoadingMessages(true);
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

      // Fetch chat-message-uploads immediately after the media upload is complete
      fetchChatMessageUploads();

      // Clear the file input field after uploading the file
      setMediaPreview(null);
      setSelectedFile(null);
      setAttach(!attach);
      setTimeout(() => {
        setLoadingMessages(false);
      }, 1000);
      // Clear the input field after uploading the file
      // setMsg("");
    } catch (error) {
      console.error("Error uploading media:", error);
    }
  };

  const allMessages = [...messages, ...uploadedMedia];

  // Sort the combined array based on createdAt timestamps
  allMessages.sort(
    (a, b) => new Date(a.message.createdAt) - new Date(b.message.createdAt)
  );

  const handleAttachToggle = () => {
    setAttach(!attach);
  };

  if (!uploadedMedia) {
    return <p>Loading...</p>;
  }

  const handleDownloadMedia = (filename) => {
    const mediaUrl = `${BASE_URL}/images/${filename}`;

    // Create a link element
    const downloadLink = document.createElement("a");
    downloadLink.href = mediaUrl;
    downloadLink.download = filename;

    // Append the link to the body
    document.body.appendChild(downloadLink);

    // Trigger a click to start the download
    downloadLink.click();

    // Remove the link from the body
    document.body.removeChild(downloadLink);
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
                {allMessages
                  .filter(
                    (data) =>
                      (data.message?.text ||
                        (data.message?.media && data.message.media.filename)) &&
                      (!data.message?.media || // Additional condition to filter out media messages not belonging to the current chat
                        (data.message.users.length === 2 &&
                          data.message.users.includes(currentUser._id) &&
                          data.message.users.includes(currentChat._id)))
                  ) // Filter out messages with no text or empty media
                  .map((data, index) => (
                    <div
                      key={index}
                      ref={index === allMessages.length - 1 ? scrollRef : null}
                      className={
                        data.sender === currentUser._id ? "sent" : "received"
                      }
                    >
                      <div className="content">
                        {data.message?.text && <p>{data.message.text}</p>}
                        {data.message?.media &&
                          data.message.media.filename &&
                          data.message.users.length === 2 &&
                          data.message.users.includes(currentUser._id) &&
                          data.message.users.includes(currentChat._id) && (
                            <div>
                              <img
                                src={`${BASE_URL}/images/${data.message.media.filename}`}
                                width="300"
                                alt="Uploaded Media"
                              />
                              <div
                                className="download-icon"
                                onClick={() =>
                                  handleDownloadMedia(
                                    data.message.media.filename
                                  )
                                }
                              >
                                <BsCloudDownload />
                              </div>
                            </div>
                          )}
                        {data.message.createdAt && (
                          <div className="message-timestamp">
                            <span className="text-[10px]">
                              <span>
                                {formatTimeDifference(data.message.createdAt)}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div className="chat_input bg-[#0F1A2E] relative  w-[100%]  border p-2 flex items-center">
            {emoji && (
              <div className="absolute left-0  bottom-[50px] ">
                <Picker onEmojiClick={handleEmojiClick} />
              </div>
            )}
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
