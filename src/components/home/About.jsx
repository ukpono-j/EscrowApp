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
      className={`w-[100%] pt-14  text-[#fff]  md:pl-20 pl-5 pb-14  pr-5  md:pr-20 justify-between h-[auto] flex md:flex-row  flex-col-reverse  items-center ${
        isScrolling ? "fade-in" : "fade-out"
      }`}
    >
      <div
        className={`sm:w-[48%]  flex items-center justify-between    fade_left  h-[auto] ${
          isScrolling ? "slide-in-left" : "slide-out-left"
        }`}
      >
        <div className=" md:w-[100%] md:h-[500px] w-[300px] sm:w-[100%] sm:h-[300px] relative z-10  md:mr-[-100px] mr-[-120px] mb-[70px] mt-[30px] about_img ">
          <img
            src={AboutImage}
            alt=""
            className="w-[90%] h-[100%] object-contain absolute"
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
        <h1 className="font-bold  text-[27px] pt-1">
          Transfer & Exchange Your Money Anytime In this World.
        </h1>
        <p className=" text-[13px] mt-7  leading-[22px]">
          At TrustLink, we understand the importance of trust and security when
          it comes to online transactions. Whether you're buying or selling
          goods, services, or even digital assets, our platform is designed to
          provide a safe and reliable environment for all parties involved.
          TrustLink is your trusted partner in secure online transactions. Join
          us today and experience the ease and peace of mind that comes with
          using our reliable escrow services. TrustLink - Where Trust Meets
          Security.
        </p>
        <div className="flex mt-4   items-center ">
          <div className="about_circle  rounded-xl  w-[100px] h-[60px]"></div>
          <div className="pl-3 pr-3 mt-4 mb-3">
            <h2 className="font-[700] text-[18px]">
              Powerful Mobile & Online App
            </h2>
            <p className="text-[13px] pt-1">
              Vestibulum ac diam sit amet quam vehicula elemen tum sed sit amet
              dui praesent sapien pellen tesque .
            </p>
          </div>
        </div>
        <div className="flex items-center ">
          <div className="about_circle  rounded-xl  w-[100px] h-[60px]"></div>
          <div className="pl-3 pr-3 mt-4 mb-3">
            <h2 className="font-[700] text-[18px]">
              Powerful Mobile & Online App
            </h2>
            <p className="text-[13px] pt-1">
              Vestibulum ac diam sit amet quam vehicula elemen tum sed sit amet
              dui praesent sapien pellen tesque .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
