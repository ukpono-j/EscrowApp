import React, { useState, useEffect } from "react";
import "./About.css";
import Test from "../../assets/money3.png";
import AboutImage from "../../assets/about.png";
import { Link } from "react-router-dom";


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
      className={`w-[100%] pt-14 font-[Inter] text-[#01003A] bg-[#f7f7f7] md:pl-20 pl-5 md:pb-14  pr-5  md:pr-20 justify-between h-[auto] flex md:flex-row  flex-col-reverse  items-center ${isScrolling ? "fade-in" : "fade-out"
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
        <p className=" text-[13px] text-center md:text-left  mt-7   leading-[22px]">
          At SafeSylo, we prioritize security, transparency, and fairness. Acting as a neutral third party, we ensure that funds are securely held until both parties fulfill their obligations. Our platform removes risk and fraud from transactions, so you can trade with confidence every time.
        </p>
        <p className=" text-[13px] text-center md:text-left  mt-7   leading-[22px]">
          Our escrow process protects buyers from losing money to scammers and ensures that sellers are paid promptly after fulfilling their part of the agreement. This two-way security system eliminates risk and promotes fair business dealings.
        </p>
       <div className="flex justify-center md:justify-start">
       <Link
          to="/login"
          className="outine-none bg-[#FF5000] max-w-[220px] mt-6 start_btn  pl-7 pr-7  text-[14px] h-[auto] pt-3 pb-3  text-[#fff]  flex items-center justify-center   rounded-[50px]  border-2 border-[#FF5000]"
        >
          Start Transactions
        </Link>
       </div>
      </div>
    </div>
  );
};

export default About;
