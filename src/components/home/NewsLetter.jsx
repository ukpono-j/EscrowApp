import React from "react";
import Buyer from "../../assets/seller.png";
import "./NewsLetter.css";


const NewsLetter = () => {
  return (
    <div className="md:pl-20 pl-5  text-[#FEFEFF] pr-5 md:pr-20     pb-14  pt-10  font-[Poppins]">
      <div className=" w-[100%] h-[auto] md:pl-20 pl-5  pr-5 md:pr-20  pt-7 pb-7 flex items-center justify-center  rounded-3xl">
        {/* <div className="newsletter_image sm:flex hidden w-[300px] rounded-2xl  h-[200px] border">
          <img
            src={Buyer}
            className="w-[100%] h-[100%] object-cover rounded-2xl"
            alt=""
          />
        </div> */}
        <div className="newsletter_content sm:ml-4 text-center ">
          <h1 className="md:text-[34px] sm:text-[32px] text-[30px] font-bold">SUBSCRIBE OUR NEWSLETTER</h1>
          <p className="mt-2 text-[16px] font-[200]">Get latest News and Updates</p>
          <div className="flex mt-5   items-center  bg-[#fff] pl-5 pt-1 pb-1 pr-2  rounded-full ">
            <input
              type="email"
              name=""
              id=""
              placeholder="Email Address"
              className="border border-[#FEFEFF] outline-none  text-[13px] bg-[transparent] font-bold  text-[#000] w-[100%]  pl-3  h-[60px]"
            />
            <button className="h-[50px] rounded-full news_button  w-[250px] flex items-center justify-center  bg-[#81712E] text-[#FEFEFF] text-[15px]">
              Subscribe Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsLetter;
