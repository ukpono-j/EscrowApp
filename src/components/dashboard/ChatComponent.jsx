// ChatComponent.jsx
import React, { useState } from 'react';
import Profile from "../../assets/profile_icon.png";



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
          <div className='h-[36px] border border-[grey] bg-[#fff]  flex items-center justify-center  w-[36px] rounded-full'>
            <img src={user.avatarImage || Profile} alt="img" className='object-contain rounded-full'/>
          </div>
          <span className='ml-2 cursor-pointer'>{user.firstName}</span>
        </div>
      ))}
    </div>
  );
}

export default ChatComponent;
