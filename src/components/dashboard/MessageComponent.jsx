import React from "react";
import ChatComponent from "./ChatComponent";
import { BsThreeDotsVertical } from "react-icons/bs";
import DisplayMessage from "./DisplayMessage";

const MessageComponent = () => {
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
              <BsThreeDotsVertical/>
              </div>
            <div className="flex mt-3   items-center justify-between">
              <input
                type="text"
                name=""
                id=""
                className="border outline-none  bg-[transparent] text-[10px] h-[28px] pl-2 rounded-2xl text-[#fff] w-[70%]"
                placeholder="Search "
              />
              <div className="w-[38px] h-[38px] rounded-full  border border-[#fff]"></div>
            </div>
            <div className="mt-3">
              <ChatComponent/>
              <ChatComponent/>
              <ChatComponent/>
              <ChatComponent/>
              <ChatComponent/>
              <ChatComponent/>
              <ChatComponent/>
              <ChatComponent/>
              <ChatComponent/>
              <ChatComponent/>
              <ChatComponent/>
            </div>
          </div>
        </div>
        <div
          style={{ overflowY: "scroll" }}
          className="layout bg-[#F4F5F5]  right-0 top-0 w-[100%]  md:w-[83.2%] h-[100vh]"
        >
          <div className="w-[100%]  sidebar_fixed p-2   h-[100vh]">
            <DisplayMessage/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageComponent;
