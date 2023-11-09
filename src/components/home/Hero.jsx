import React from "react";
import "./Hero.css";
import { Link } from "react-router-dom";
import HeroImage from "../../assets/hero.png";
import Test2 from "../../assets/money4.jpg";
import Test3 from "../../assets/money2.jpg";
import { BsFillPlayFill } from "react-icons/bs";
import { MdGroups2 } from "react-icons/md";
const Hero = () => {
  return (
    <div
      className="
     hero text-center md:text-start  font-[Poppins] md:flex items-center justify-between  md:pl-14  pl-5  pr-5  md:pr-14  md:pt-[180px] pt-[150px] pb-[70px]   h-[auto] text-[#FFF] w-[100%]"
    >
      <div className="md:w-[50%]  w-[100%]   h-[auto] pr-10 ">
        {/* <h1>Transforming Transactions, Building Trust</h1> */}
        {/* <h3 className="md:text-[16px] text-[14px]">
          Empower Your Transactions
        </h3> */}
        <h1 className="md:text-[79px] leading-[67px] md:leading-[82px]  text-[56px] ">
          {" "}
          {/* A New Era of Trust and Transparency */}
          Where Trust Meets Transparency
        </h1>
        <p className="ss">
          Welcome to TrustLink, the ultimate solution for secure and transparent
          business transactions. Our groundbreaking web application introduces a
          new era of trust in commerce, offering seamless functionality and
          unmatched convenience.
        </p>
        <div className="flex items-center justify-center  md:justify-start  mt-10 ">
          <Link
            to="/login"
            className="outine-none w-[auto] start_btn  pl-7 pr-7  text-[14px] h-[auto] pt-3 pb-3  text-[#fff] font-bold flex items-center justify-center   rounded-[50px]  border-2 border-[#81712E]"
          >
            Start Transactions
          </Link>
          <div className="flex border-2  border-[#81712E] pr-8 learn_btn rounded-full items-center ml-3 ">
            <button className="bg-[#81712E] p-3  rounded-full">
              <BsFillPlayFill className="text-[23px] text-[#fff] font-bold " />
            </button>
            <p className="pl-2 text-[14px] ">Learn More</p>
          </div>
        </div>
      </div>
      <div className="md:w-[50%] w-[100%]  mt-7  md:mt-0 relative  flex  h-[auto]">
        <div className="bounce rounded-xl  absolute w-[200px] h-[70px] flex items-center justify-center  bg-[#fff] m-auto z-10 top-[50%] left-[34%]">
          <div className="">
            <MdGroups2 className="text-[60px] text-[#031420]" />
          </div>
          <div className="ml-3 text-[14px] text-[#0F0821]">
            <h4>20m+</h4>
            <p>Active Users</p>
          </div>
        </div>
        <div className="w-[100%] m-4  h-[400px] hero_img_one">
          <img
            src={HeroImage}
            alt=""
            className="w-[90%] h-[] object-contain moving"
          />
        </div>
        {/* <div className="w-[100%] ml-4  mr-4  mt-[100px] mb-4  h-[400px] hero_img_two">
          <img
            src={Test2}
            alt=""
            className="w-[100%] h-[100%] object-cover object-center"
          />
        </div> */}
      </div>
    </div>
  );
};

export default Hero;
