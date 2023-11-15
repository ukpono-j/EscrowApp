import React, { useEffect, useState } from "react";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;



const Messages = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/get-messages`);
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
        // Handle the error accordingly
      }
    };

    fetchMessages();
  }, []); // Empty dependency array ensures that the effect runs only once on mount

  return (
    <div className="border border-black w-[70%] h-[100%] p-2 bg-[#0F1A2E] text-[#fff] rounded-xl mt-3 text-[13px]">
      {messages.map((message) => (
        <div key={message._id}>
          {/* Customize how you want to display each message */}
          <p>{message.message.text}</p>
        </div>
      ))}
    </div>
  );
};

export default Messages;
