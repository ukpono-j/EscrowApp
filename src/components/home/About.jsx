import React, { useState, useEffect } from "react";
import "./About.css";
import Test from "../../assets/money3.png";
import AboutImage from "../../assets/about.png";

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
      className={`w-[100%] pt-14  text-[#fff]  md:pl-20 pl-5 md:pb-14  pr-5  md:pr-20 justify-between h-[auto] flex md:flex-row  flex-col-reverse  items-center ${
        isScrolling ? "fade-in" : "fade-out"
      }`}
    >
      <div
        className={`sm:w-[48%]  flex items-center justify-between    fade_left  h-[auto] ${
          isScrolling ? "slide-in-left" : "slide-out-left"
        }`}
      >
        <div className=" md:w-[100%] md:h-[500px] w-[100%] sm:w-[100%]  relative z-10  md:mr-[-100px] mr-[-120px] mb-[70px] mt-[30px] about_img ">
          <img
            src={AboutImage}
            alt=""
            className="w-[90%] h-[100%] object-contain"
          />
        </div>
        {/* <div className=" sm:w-[480px] w-[100%] sm:h-[500px]  h-[400px] mr-[0] about_img_one ">
          <img src={Test} alt="" className="w-[100%] h-[100%] object-cover" />
        </div> */}
      </div>
      <div
        className={`md:w-[46%]  m-4 w-[100%] font-[Poppins] fade_right  h-[auto] ${
          isScrolling ? "slide-in-right" : "slide-out-right"
        }`}
      >
        {/* <h3 className="text-[16px]">Who We Are</h3> */}
        <h1 className="text-center md:text-left   md:text-[50px] leading-[44px] md:leading-[60px]  text-[40px]  pt-1">
          Trustworthy Escrow Services
        </h1>
        <p className=" text-[13px] text-center md:text-left  mt-7   leading-[22px]">
          At MiddleMan, we believe in fostering secure transactions through
          trust and integrity. Our platform is dedicated to providing a reliable
          escrow service, ensuring that your transactions are carried out with
          confidence. With a commitment to transparency, MiddleMan is here to
          redefine the way you engage in financial exchanges.
        </p>
        <div className="flex mt-6 ">
          <div className="about_circle  rounded-xl  md:w-[60px] w-[70px] h-[60px]"></div>
          <div className="pl-3 pr-3  w-[90%]">
            <h2 className="font-[700] text-[18px]">Aim of the MiddleMan App</h2>
            <p className="text-[13px]">
              MiddleMan was founded with the vision of creating a secure and
              transparent environment for online transactions. In an era where
              trust is paramount, we serve as the bridge that connects buyers
              and sellers, offering a safeguard for funds until both parties
              fulfill their commitments.
            </p>
          </div>
        </div>
        <div className="flex mt-6">
          <div className="about_circle  rounded-xl  md:w-[60px] w-[70px] h-[60px]"></div>
          <div className="pl-3 pr-3 w-[90%]">
            <h2 className="font-[700] text-[18px]">Our Mission</h2>
            <p className="text-[13px]">
              Our mission is to empower individuals and businesses, making
              transactions seamless, trustworthy, and worry-free
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
