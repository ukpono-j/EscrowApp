import React, { useState } from "react";
import Picker from "emoji-picker-react";
import { IoMdSend } from "react-icons/io";
import { BsClipboard, BsClipboard2Plus, BsEmojiSmile, BsSend } from "react-icons/bs";
import "./ChatInput.css";
import { MdAttachFile } from "react-icons/md";


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
        setEmoji(false);
     }
  }

  return (
    <div>
      {emoji && <Picker onEmojiClick={handleEmojiClick} />}
      <div className="chat_input bg-[#0F1A2E]  w-[100%] rounded-r-xl  border p-2  flex items-center  ">
        <div className="text-[23px] text-[#ffff00c8] cursor-pointer">
          <BsEmojiSmile onClick={handleEmojiPicker} />
        </div>
        <div className="text-[#fff] text-[22px]">
           <MdAttachFile/>
        </div>
        <form onSubmit={(e) =>  sendChat(e)} action="" className="flex items-center w-[100%] ml-3">
          <input
            type="text"
            placeholder="Type Message"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="p-2 h-[33px]  border border-[#0F1A2E] rounded-3xl text-[13px] font-[Poppins] w-[100%]"
          />
          <button className="submit ml-2 rounded-xl pl-3 h-[33px] border  w-[80px] flex items-center justify-center   pr-3   pt-2 pb-2     bg-[#152D5D] text-[#fff]">
            <BsSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
