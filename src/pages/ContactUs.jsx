import React from "react";
import Navbar from "../components/Navbar";
import Chat from "../../src/assets/chat.png";

const ContactUs = () => {
  return (
    <div className="">
      <Navbar />
      <div className="sm:pt-[100px] pt-[150px] bg-[#101629] sm:pb-[40px] pb-[70px] text-[#fff] font-[Poppins] sm:flex items-center justify-between md:pl-20 pl-5 pr-5  md:pr-28  font-[Poppins] border border-black h-[auto]">
        <div className="sm:w-[50%] w-[100%]">
          <h3 className="text-[17px]  font-bold">Contact</h3>
          <h1 className="text-[42px] text-[#fff] font-bold">Get in touch</h1>
          <p className="text-[15px] pt-1">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto
            commodi amet fugiat tenetur nostrum est quaerat dicta, saepe,
            explicabo veritatis, tempora magni similique eum ut omnis nam cum
            beatae blanditiis.
          </p>
        </div>
        <div className="h-[400px]">
          <img src={Chat} alt="" className="w-full h-full sm:object-cover object-contain" />
        </div>
      </div>
      <div className="h-[auto] sm:flex items-center justify-between  w-[100%] sm:pl-20 pr-5  sm:pr-20 pl-5  pt-10 pb-10 border border-black">
             <div className="w-[100%] h-[80vh] border border-black"></div>
             <div className="w-[100%] h-[80vh] border border-black"></div>
      </div>
    </div>
  );
};

export default ContactUs;
