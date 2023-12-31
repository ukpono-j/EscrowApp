// DisplayMessage.jsx
import React, { useEffect, useState, useRef } from "react";
import Roboto from "../../assets/robot.gif";
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

const Testing = ({ currentChat, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(null);
  const [emoji, setEmoji] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const scrollRef = useRef();
  const [mediaPreview, setMediaPreview] = useState(null);
  // const [mediaData, setMediaData] = useState([]);
  const [uploadedMedia, setUploadedMedia] = useState([]);

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

  // UseEffect for create transaction

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

  // const uploadMedia = async () => {
  //   try {
  //     const formData = new FormData();
  //     formData.append("media", selectedFile);

  //     // Use the new endpoint for file uploads
  //     await axios.post(`${BASE_URL}/chat-message-uploads`, formData);

  //     // Update media preview if needed
  //     const reader = new FileReader();
  //     reader.onloadend = () => setMediaPreview(reader.result);

  //     if (selectedFile) {
  //       reader.readAsDataURL(selectedFile);
  //     } else {
  //       setMediaPreview(null);
  //     }
  //   } catch (error) {
  //     console.error("Error uploading media:", error);
  //   }
  // };

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

      // Update media preview if needed
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result);

      if (selectedFile) {
        reader.readAsDataURL(selectedFile);
      } else {
        setMediaPreview(null);
      }

      // Clear the file input field after uploading the file
      setSelectedFile(null);
      // Clear the input field after uploading the file
      setMsg("");
    } catch (error) {
      console.error("Error uploading media:", error);
    }
  };

  // const combinedData = [...messages, ...uploadedMedia];

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
            className="chat_messages h-[63vh] pt-2 pr-2  pl-2 pb-2  w-[100%] pt-5  pb-7"
          >
            <div className=" min-h-[auto]">
              {messages.map((message, index) => (
                <div
                  key={index}
                  ref={index === messages.length - 1 ? scrollRef : null}
                  className={
                    message.sender === currentUser._id ? "sent" : "received"
                  }
                >
                  <div className="content">
                    <p>{message.message?.text}</p>
                    <div className="message-timestamp">
                      {message.createdAt && (
                        <span className="text-[10px]">
                          <span>{formatTimeDifference(message.createdAt)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="chat_input bg-[#0F1A2E] relative  w-[100%]  border p-2 flex items-center">
            <div className="text-[23px] text-[#ffff00c8] cursor-pointer">
              <BsEmojiSmile onClick={handleEmojiPicker} />
            </div>
            <div className="text-[#fff] text-[22px]">
              <MdAttachFile />
            </div>

            <input
              type="file"
              accept="image/*, video/*" // Allow both image and video files
              onChange={handleFileChange}
              className="w-[70px] h-[20px]"
            />
            {/* ... Existing code ... */}
            <button
              onClick={uploadMedia}
              className="submit ml-2 rounded-xl pl-3 h-[33px] border w-[80px] flex items-center justify-center pr-3 pt-2 pb-2 bg-[#152D5D] text-[#fff]"
            >
              Upload
            </button>
            <form
              onSubmit={(e) => sendChat(e)}
              action=""
              className="flex items-center w-[100%] ml-3"
            >
              <input
                type="text"
                placeholder="Type Message"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                className="p-2 h-[33px] border border-[#0F1A2E] rounded-3xl text-[13px] font-[Poppins] w-[100%]"
              />
              <button className="submit ml-2 rounded-xl pl-3 h-[33px] border w-[80px] flex items-center justify-center pr-3 pt-2 pb-2 bg-[#152D5D] text-[#fff]">
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

export default Testing;

<div className="min-h-[auto]">
  {[...messages, ...uploadedMedia]
    .sort(
      (a, b) => new Date(a.message.createdAt) - new Date(b.message.createdAt)
    )
    .map((item, index) => (
      <div
        key={index}
        ref={
          index === messages.length + uploadedMedia.length - 1
            ? scrollRef
            : null
        }
        className={item.sender === currentUser._id ? "sent" : "received"}
      >
        <div className="content">
          {item.message?.text && <p>{item.message.text}</p>}
          <div className="message-timestamp">
            {item.message.createdAt && (
              <span className="text-[10px]">
                <span>{formatTimeDifference(item.message.createdAt)}</span>
              </span>
            )}
          </div>
        </div>
        {item.message?.media && (
          <div className="max-w-[300px] max-h-[300px] border border-black">
            {item.message.media ? (
              <img
                src={`data:${item.message.media.mimetype};base64,${item.message.media}`}
                className="w-[200px] h-[100%] object-cover"
                alt="Uploaded Media"
                onLoad={() => console.log("Image loaded successfully")}
                onError={(e) => console.error("Error loading image:", e)}
              />
            ) : (
              <p>No media available</p>
            )}
          </div>
        )}
      </div>
    ))}


</div>;
  <div className=" min-h-[auto]">
  {messages.map((message, index) => (
    <div
      key={index}
      ref={index === messages.length - 1 ? scrollRef : null}
      className={message.sender === currentUser._id ? "sent" : "received"}
    >
      <div className="content">
        {message.message?.text && <p>{message.message.text}</p>}
        <div className="message-timestamp">
          {message.message.createdAt && (
            <span className="text-[10px]">
              <span>{formatTimeDifference(message.message.createdAt)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  ))}
  {/* ================ uploaded media */}
  {uploadedMedia.map(
    (upload, index) =>
      // Check if currentUser and currentChat match the users in the message
      upload.message.users.length === 2 &&
      upload.message.users[0] === currentUser._id &&
      upload.message.users[1] === currentChat._id && (
        <div
          key={index}
          className={upload.sender === currentUser._id ? "sent" : "received"}
        >
          <div className="max-w-[300px] max-h-[300px] border border-black">
            {/* <p>Sender: {upload.message.sender}</p>
                      <p>Name: {currentUser.firstName} </p> */}
            {upload.message.media ? (
              <img
                src={`data:${upload.message.media.mimetype};base64,${upload.message.media}`}
                className="w-[200px] h-[100%] object-cover"
                alt="Uploaded Media"
                onLoad={() => console.log("Image loaded successfully")}
                onError={(e) => console.error("Error loading image:", e)}
              />
            ) : (
              <p>No media available</p>
            )}
          </div>
        </div>
      )
  )}
</div>


                {/* {uploadedMedia && uploadedMedia.map((singleData) => {
                  const base64String = btoa(
                    String.fromCharCode(
                      ...new Uint8Array((singleData.message.media?.data?.data) ?? [])
                    )
                  );
                  return (
                    <img
                      src={`data:image/png;base64, ${base64String}`}
                      alt=""
                    />
                  );
                })} */}

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

                {/* {uploadedMedia && uploadedMedia.map((singleData) => {
                  const base64String = btoa(
                    String.fromCharCode(
                      ...new Uint8Array((singleData.message.media?.data?.data) ?? [])
                    )
                  );
                  return (
                    <img
                      src={`data:image/png;base64, ${base64String}`}
                      alt=""
                    />
                  );
                })} */}
              </div>


             {/* {uploadedMedia &&
                  uploadedMedia.map((singleData) => {
                    return (
                      <div key={singleData._id}>
                        <img
                          src={`${BASE_URL}/images/${singleData.message.media.filename}`}
                          width="300"
                          alt="Uploaded Media"
                        />
                        <div>
                          {singleData.message.createdAt && (
                            <span className="text-[10px] font-bold">
                              <span>
                                {formatTimeDifference(
                                  singleData.message.createdAt
                                )}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })} */}

                    // useEffect(() => {
  //   const token = localStorage.getItem("auth-token");
  //   if (token) {
  //     axios.defaults.headers.common["auth-token"] = token;
  //   }

  //   try {
  //     setLoadingMessages(true);
  //     setAttach(false);
  //     if (currentUser && currentChat) {
  //       axios
  //         .get(`${BASE_URL}/get-messages`, {
  //           params: {
  //             from: currentUser._id,
  //             to: currentChat._id,
  //           },
  //         })
  //         .then((response) => {
  //           // Separate media messages and text messages
  //           const textMessages = response.data.filter(
  //             (message) => message.message.text
  //           );
  //           // Reverse the order to show newer messages below
  //           const sortedMessages = textMessages.sort((a, b) => {
  //             return new Date(a.createdAt) - new Date(b.createdAt);
  //           });

  //           setMessages(sortedMessages);
  //           setTimeout(() => {
  //             setLoadingMessages(false);
  //           }, 1000);
  //         })
  //         .catch((error) => {
  //           console.error("Error fetching messages:", error);
  //         });
  //     }
  //   } catch (error) {
  //     console.error("Error fetching uploads:", error);
  //   }

  //   try {
  //     if (currentUser && currentChat) {
  //       // Fetch transaction details from API and update the state
  //       axios
  //         .get(`${BASE_URL}/chat-message-uploads`, {
  //           params: {
  //             from: currentUser._id,
  //             to: currentChat._id,
  //           },
  //         })
  //         .then((response) => {
  //           // Filter media based on the sender and receiver
  //           // Separate media messages and text messages
  //           const mediaMessages = response.data.filter(
  //             (message) => message.message.media
  //           );

  //           const filteredMedia = mediaMessages.filter((media) => {
  //             console.log("Main Media", media);
  //             const isCurrentUser = media.message.users[0] === currentUser._id;
  //             const isCurrentChat = media.message.users[1] === currentChat._id;
  //             console.log("Media Data:", media.message.media);
  //             return isCurrentUser && isCurrentChat;
  //           });
  //           setUploadedMedia(filteredMedia);
  //           // setMessages(response.data);
  //           console.log("filtered Media All", filteredMedia);
  //           console.log("Response Data:", response.data);
  //           console.log("Filtered Media:", filteredMedia);
  //           console.log("Uploaded Media:", uploadedMedia);
  //         });
  //     }
  //   } catch (error) {
  //     console.error("Error fetching uploads:", error);
  //   }
  // }, [currentUser, currentChat]);



    // Remaining code ...

  // ================= UseEffect for getting uploads
  // useEffect(() => {
  //   const token = localStorage.getItem("auth-token");
  //   if (token) {
  //     axios.defaults.headers.common["auth-token"] = token;
  //   }

  // }, [currentUser, currentChat]);

  // ====================== UseEffect for get text messages and uploads
