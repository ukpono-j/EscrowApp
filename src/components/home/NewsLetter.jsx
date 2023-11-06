import React from "react";
import Buyer from "../../assets/seller.png";

const NewsLetter = () => {
  return (
    <div className="md:pl-20 pl-5  text-[#FEFEFF] pr-5 md:pr-20   bg-[#0f1a2e]  pb-14  pt-10  font-[Poppins]">
      <div className=" border border-[#5C63FF] w-[100%] h-[auto] md:pl-20 pl-5  pr-5 md:pr-20  pt-7 pb-7 flex items-center justify-between rounded-3xl">
        <div className="newsletter_image sm:flex hidden w-[300px] rounded-2xl  h-[200px] border">
          <img
            src={Buyer}
            className="w-[100%] h-[100%] object-cover rounded-2xl"
            alt=""
          />
        </div>
        <div className="newsletter_content sm:ml-4">
          <h1 className="md:text-[40px] sm:text-[32px] text-[30px] font-bold">Welcome to our newsletter</h1>
          <p>Be the first to know when we make new updates or information</p>
          <div className="flex mt-3  items-center  ">
            <input
              type="email"
              name=""
              id=""
              placeholder="Email Address"
              className="border border-[#FEFEFF] text-[12px] text-[#fff] w-[100%] bg-[#0f0920] pl-3  h-[37px]"
            />
            <button className="h-[38px] w-[120px] flex items-center justify-center bg-[#6149FA] text-[#FEFEFF] text-[12px]">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsLetter;
