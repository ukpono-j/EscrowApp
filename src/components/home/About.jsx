import React, { useState, useEffect } from "react";
import "./About.css";
import Test from "../../assets/money3.png";
import AboutImage from "../../assets/about.png";
import { Link } from "react-router-dom";
import { Box, Text } from "@chakra-ui/react";



const About = () => {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const aboutSection = document.getElementById("about");
      if (aboutSection) {
        const rect = aboutSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setIsScrolling(true);
        } else {
          setIsScrolling(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      id="about"
      className={`w-[100%] pt-14 md:pl-20 pl-5 md:pb-14  pr-5  md:pr-20 justify-between h-[auto] flex md:flex-row  flex-col-reverse  items-center ${isScrolling ? "fade-in" : "fade-out"
        }`}
    >
      <div
        className={`sm:w-[600px] max-w-[800px] flex items-center justify-between fade_left  h-[auto] ${isScrolling ? "slide-in-left" : "slide-out-left"
          }`}
      >
        <div className=" md:w-[100%] md:h-[500px] w-[100%] sm:w-[100%]  relative z-10  md:mr-[-100px] mr-[-120px] mb-[70px] mt-[30px] about_img ">
          <img
            src={AboutImage}
            alt=""
            className="w-[100%] h-[100%] object-contain"
          />
        </div>
        {/* <div className=" sm:w-[480px] w-[100%] sm:h-[500px]  h-[400px] mr-[0] about_img_one ">
          <img src={Test} alt="" className="w-[100%] h-[100%] object-cover" />
        </div> */}
      </div>
      <div
        className={`md:w-[46%]  m-4 w-[100%]  fade_right  h-[auto] ${isScrolling ? "slide-in-right" : "slide-out-right"
          }`}
      >
        {/* <h3 className="text-[16px]">Who We Are</h3> */}
        <h1 className="text-center md:text-left md:text-[54px] font-bold leading-[44px] md:leading-[60px]  text-[40px]  pt-1">
          Trustworthy Escrow Services
        </h1>
        <p className="text-[17px] text-center mt-2 md:text-left">
          At Sylo, we believe that trust is the currency of every successful transaction. Whether you're dealing with digital goods, services, or high-stake purchases, uncertainty shouldn't be part of the deal. That’s where we come in.
        </p>
        <p className=" text-[17px] text-center mt-4 md:text-left">
          We’re a modern, tech-forward escrow platform built to protect both buyers and sellers, no matter the industry. From freelancers and online sellers to real estate investors and everyday users, Sylo acts as your secure middle ground, holding funds safely until both sides are satisfied.
        </p>

        <p className=" text-[17px] text-center md:text-left  mt-7">
          With Sylo, no one gets paid until the job is done right.
        </p>
        <div className="flex justify-center md:justify-start">
          <Link
            to="/login"
            className="outine-none bg-[#B38939] rounded-full max-w-[220px] mt-6 start_btn  pl-7 pr-7  text-[17px] h-[auto] pt-3 pb-3 text-[#fff] flex items-center justify-center border-2 border-[#B38939]"
          >
            Start Transactions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
