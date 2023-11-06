import React from "react";

const ChatComponent = () => {
  return (
    <div>
      <div className="flex items-center mt-3  justify-between">
        <div className="w-[38px] h-[38px] rounded-full  border border-[#fff]"></div>
        <div className=" outline-none  bg-[transparent] text-[10px] h-[auo] pl-1 text-[#fff] w-[76%]">
            <h3>Sophia Johnny</h3>
            <p>Hi, testing</p>
            <p>2/3/23</p>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
