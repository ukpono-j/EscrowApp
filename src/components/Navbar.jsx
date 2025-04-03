// Navbar.jsx
import React, { useState } from "react";
import { Link as ScrollLink, scroller } from "react-scroll";
import { AiOutlineMenu } from "react-icons/ai";
import { Link } from "react-router-dom";
// import Logo from "../assets/logo3.png"
import Logo from "../assets/logo_preview.png"
import "./Navbar.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  

  const scrollTo = (element) => {
    scroller.scrollTo(element, {
      duration: 800,
      delay: 0,
      smooth: "easeInOutQuart",
    });
  };

  return (
    <div className="pl-5 pr-5 font-[Inter] md:pl-[60px] md:pr-[60px] left-0  fixed z-30 top-0 pt-5 pb-5 w-full bg-[#ffffff] flex justify-between items-center">
      <div className="font-bold cursor-pointer  md:text-2xl text-2xl">
        <Link to="/" className="outline-none" onClick={() => scrollTo("home")}>
          {/* MiddleMan */}
          <h1 className="text-[30px] text-[#010066] logo_icon font-bold">SafeSylo</h1>
          {/* <img src={Logo} alt="Logo Detail"  className="w-[190px]"/> */}
        </Link>
      </div>
      <div className="hidden text-[#01003A] text-[16px] md:flex space-x-6 items-center">
        <ScrollLink className="cursor-pointer" to="about" smooth={true} duration={800}>
          About Us
        </ScrollLink>
        <ScrollLink className="cursor-pointer" to="services" smooth={true} duration={800}>
          Services
        </ScrollLink>
        <ScrollLink className="cursor-pointer" to="faq" smooth={true} duration={800}>
          FAQ
        </ScrollLink>
        <ScrollLink className="cursor-pointer" to="footer" smooth={true} duration={800}>
          Contact Us
        </ScrollLink>
        <Link
          to="/login"
          className="ml-3 flex items-center  justify-center px-9 py-3  rounded-full text-white  text-[15px] bg-[#FF5000] border-2  border-[#FF5000]"
        >
          Log In
        </Link>
        <Link
          to="/register"
          className="ml-3 flex items-center  justify-center px-9 py-3  rounded-full  text-[15px] bg-[transparent]  border-2  border-[#FF5000]"
        >
          Register
        </Link>
      </div>
      <div className="md:hidden flex items-center">
        <AiOutlineMenu
          className="text-3xl cursor-pointer"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        />
      </div>
      {isMenuOpen && (
        <div className="md:hidden text-[13px] pt-4 mb-5 text-[#fff] text-center fixed top-[72px] left-0 w-full h-full bg-[#0F1A2E] flex flex-col pl-5  pr-5  sm:pl-[60px] sm:pr-[60px] md:pl-[70px] md:pr-[70px]">
          <ScrollLink
            to="about"
            className="mt-4 mb-4"
            smooth={true}
            duration={800}
            onClick={() => setIsMenuOpen(false)}
          >
            About Us
          </ScrollLink>
          <ScrollLink
            to="services"
            className="mt-4 mb-4"
            smooth={true}
            duration={800}
            onClick={() => setIsMenuOpen(false)}
          >
            Services
          </ScrollLink>
          <ScrollLink
            to="faq"
            className="mt-4 mb-4"
            smooth={true}
            duration={800}
            onClick={() => setIsMenuOpen(false)}
          >
            FAQ
          </ScrollLink>
          <Link
            to="/contact"
            className="mt-4 mb-4"
            onClick={() => setIsMenuOpen(false)}
          >
            Contact Us
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center px-7 py-3  rounded-full text-[#fff] text-[13px]  hover:bg-[#6149FA] bg-[#FF5000]"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className=" flex mt-3  items-center justify-center px-7 py-3   rounded-full text-[#fff] text-[13px] bg-[transparent] hover:bg-[#FF5000] border-2  border-[#FF5000]"
          >
            Register
          </Link>
        </div>
      )}
    </div>
  );
};

export default Navbar;
