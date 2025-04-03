import React from "react";
import { Link } from "react-router-dom";
import { Link as ScrollLink, scroller } from "react-scroll";
import "./Footer.css";
import NewsLetter from "./home/NewsLetter";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";
import Logo from "../assets/logo3.png"

const Footer = () => {
  const scrollTo = (element) => {
    scroller.scrollTo(element, {
      duration: 800,
      delay: 0,
      smooth: "easeInOutQuart",
    });
  };
  return (
    <div className="footer">
      <NewsLetter />
      <div className="font-[Inter] text-[#fff] list-none mb-[-30px] pt-20 pb-4    md:pl-20  md:pr-20 pl-5 pr-5  h-[auto] flex flex-col  items-center justify-center  w-[100%]">
        <div className=" sm:flex sm:flex-col h-[auto] sm:justify-center sm:items-center    w-[100%] ">
          <div className=" sm:w-[400px] text-center  sm:pl-0  sm:pr-0  pl-6  pr-6  h-[auto]">
            <Link
              TO="/"
              className="sm:text-[34px] flex items-center justify-center mb-4 text-[28px] font-bold footer_title  tracking-wider"
              onClick={() => scrollTo("home")}
            >
              {/* MiddleMan */}
              <h1 className="footer_logo">Safesylo</h1>
              {/* <img src={Logo} alt="Logo Detail"  className="w-[200px]"/> */}
            </Link>
            <div className=" text-[15px] mt-6  space-x-6 flex items-center justify-between">
              <ScrollLink
                className="cursor-pointer"
                to="about"
                smooth={true}
                duration={800}
              >
                About Us
              </ScrollLink>
              <ScrollLink
                className="cursor-pointer"
                to="services"
                smooth={true}
                duration={800}
              >
                Services
              </ScrollLink>
              <ScrollLink
                className="cursor-pointer"
                to="faq"
                smooth={true}
                duration={800}
              >
                FAQ
              </ScrollLink>
            </div>
            {/* <div className="text-[12px] leading-[23px] pt-4 font-[200]">
              At MiddleMan, we're dedicated to providing a seamless and secure
              experience for all your transactions. Your trust and satisfaction
              are our top priorities. If you have any questions, concerns, or
              need assistance, our support team is here to help. Stay connected
              with us on social media for the latest updates, and thank you for
              choosing MiddleMan for your escrow needs.
            </div> */}
          </div>

          <div className="w-[100%] mt-5  border-b flex items-center  justify-between  border-t mt-3 ">
             <div className="social_icon_container flex items-center ">
               <div className="border sm:h-[39px] h-[32px] w-[32px] sm:w-[39px] sm:m-3 m-2 flex items-center justify-center  rounded-full bg-[#fff]">
                <FaFacebookF className="text-[#000]  sm:text-[23px] text-[19px]" />
               </div>
               <div className="border sm:h-[39px] h-[32px] w-[32px] sm:w-[39px] sm:m-3 m-2 flex items-center justify-center  rounded-full bg-[#fff]">
                <FaTwitter  className="text-[#000]  sm:text-[23px] text-[19px]" />
               </div>
               <div className="border sm:h-[39px] h-[32px] w-[32px] sm:w-[39px] sm:m-3 m-2 flex items-center justify-center  rounded-full bg-[#fff]">
                <FaInstagram  className="text-[#000]  sm:text-[23px] text-[19px]" />
               </div>
             </div>
             <div className="flex sm:text-left text-center  items-center text-[14px] ">
                <p className="sm:ml-4  ml-1 mr-1  sm:mr-3 ">Terms & Condition</p>
                <p className="sm:ml-4  ml-1 mr-1  sm:mr-3 ">Privacy Policy</p>
             </div>
          </div>
          <div className="w-[100%] sm:flex text-center sm:text-left  items-center  text-[14px] justify-between mt-7 ">
            <p>© 2023 MiddleMan App. All rights reserved.</p>
            <p>Powered by Zeek</p>
          </div>
        </div>
        {/* <div className="pt-20">copyright</div> */}
      </div>
    </div>
  );
};

export default Footer;
