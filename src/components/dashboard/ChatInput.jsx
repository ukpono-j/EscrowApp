import React, { useState } from "react";
import Picker from "emoji-picker-react";
import { IoMdSend } from "react-icons/io";
import { BsEmojiSmile, BsSend } from "react-icons/bs";
import "./ChatInput.css";


const ChatInput = ({ handleSendMessage }) => {
  const [emoji, setEmoji] = useState(false);
  const [msg, setMsg] = useState("");

  const handleEmojiPicker = () => {
    setEmoji(!emoji);
  };

  const handleEmojiClick = (chosenEmoji) => {
    let message = msg + chosenEmoji.emoji;
    setMsg(message);
  };

  const sendChat =(event) => {
     event.preventDefault();

     if (msg.length> 0) {
        handleSendMessage(msg);
        setMsg("")
     }
  }

  return (
    <div>
      {emoji && <Picker onEmojiClick={handleEmojiClick} />}
      <div className="chat_input bg-[#0F1A2E] rounded-3xl  w-[100%] bottom-0  border  flex items-center   absolute ">
        <div className="text-[27px] text-[#ffff00c8] cursor-pointer">
          <BsEmojiSmile onClick={handleEmojiPicker} />
        </div>
        <form onSubmit={(e) =>  sendChat(e)} action="" className="flex items-center w-[100%] ml-3">
          <input
            type="text"
            placeholder="Type Message"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="p-2 h-[37px]  border border-black text-[14px] w-[100%]"
          />
          <button className="submit ml-2 border border-black rounded-3xl pl-3 h-[37px] w-[100px] flex items-center justify-center   pr-3   pt-2 pb-2   border border-black  bg-[#000] text-[#fff]">
            <BsSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
