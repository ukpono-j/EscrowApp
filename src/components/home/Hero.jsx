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
     hero   md:flex items-center justify-between  md:pl-14  pl-5  pr-5  md:pr-14  md:pt-[140px] pt-[150px] md:pb-[50px]   h-[auto] text-[#FFF] w-[100%]"
    >
      <div className="md:w-[50%]  w-[100%] text-center md:text-left   h-[auto] md:pr-10 ">
        <h1 className="md:text-[60px] leading-[40px] md:leading-[64px]  text-[46px] ">
          {" "}
          {/* A New Era of Trust and Transparency */}
          Where Trust Meets Transparency
        </h1>
        {/* <h3 className="text-[20px] font-bold mt-4">Welcome to TrustLink</h3> */}
        <p className="ss text-[15px]">
        Your ultimate solution for secure and transparent business transactions. TrustLink is redefining the way commerce is conducted by providing a seamless, secure, and reliable escrow service. Whether you're buying or selling, our platform guarantees peace of mind, ensuring that transactions are executed with integrity and confidence.
        </p>
        <div className="flex items-center justify-center  md:justify-start  mt-10 ">
          <Link
            to="/login"
            className="outine-none font-[Poppins]   w-[auto] start_btn  pl-7 pr-7  text-[14px] h-[auto] pt-3 pb-3  text-[#fff]  flex items-center justify-center   rounded-[50px] bg-[#FF5000]  border-2 border-[#FF5000]"
          >
            Start Transactions
          </Link>
        </div>
      </div>
      <div className="md:w-[50%] w-[100%]  mt-7  md:mt-0 relative  flex  h-[auto]">
        <div className="bounce rounded-xl p-2 absolute max-w-[200px] h-[auto] flex items-center justify-center  bg-[#01003A] m-auto z-10 top-[50%] left-[34%]">
          {/* <div className="">
            <MdGroups2 className="text-[60px] text-[#010066]" />
          </div> */}
          <div className="ml-3 w-full text-[14px] text-[#fff] font-[Inter]">
            <h4>20M+ Active Users</h4>
            {/* <p>Join a thriving community of individuals and businesses who trust TrustLink to protect their transactions.</p> */}
          </div>
        </div>
        <div className="w-[100%] m-4  max-h-[auto]   h-[100%] hero_img_one">
          <img
            src={HeroImage}
            alt=""
            className="md:w-[100%] w-[100%]  moving"
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
