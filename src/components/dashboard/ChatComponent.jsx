// ChatComponent.jsx
import React, { useState } from 'react';
import Profile from "../../assets/profile_icon.png";
const BASE_URL = import.meta.env.VITE_BASE_URL;



const ChatComponent = ({ contacts, currentUser,  changeChat }) => {
  const [selectedUser, setSelectedUser] = useState(undefined);

  const changeCurrentChat = (index, user) => {
    setSelectedUser(index);
    changeChat(user);
  }

  return (
    <div className='mt-3'>
      {contacts.map((user, index) => (
        <div
          className={`contact  flex items-center mt-4  ${index === selectedUser ? "selected" : " "}`}
          key={index}
          onClick={() => changeCurrentChat(index, user)}
        >
          <div className='h-[37px]  bg-[#fff] border border-[#0F1A2E]  flex items-center justify-center  w-[37px] rounded-full'>
            <img 
            // src={user.avatarImage || Profile} 
            src={user.avatarImage ? `${BASE_URL}/images/${user.avatarImage}` : Profile}
            alt="img" className='object-cover w-[100%] h-[100%] rounded-full'/>
          </div>
          <span className='ml-2 cursor-pointer'>{user.firstName}</span>
        </div>
      ))}
    </div>
  );
}

export default ChatComponent;
