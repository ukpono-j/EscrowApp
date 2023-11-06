import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AiOutlineMenu } from "react-icons/ai";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="pl-5 font-[Poppins] pr-5  md:pl-[60px] md:pr-[60px] left-0  fixed z-30 top-0 pt-5 pb-5 w-full bg-[#0F1A2E] text-white flex justify-between items-center">
      <div className="font-bold cursor-pointer  text-2xl uppercase">
        <Link to="/" className="outline-none">TrustLink</Link>
        {/* 5B51FE */}
      </div>
      <div className="hidden text-[13px] md:flex space-x-6 items-center">
        <Link to="">Business</Link>
        <Link to="">About Us</Link>
        <Link to="">Services</Link>
        <Link to="/contact">Contact Us</Link>
        {/* <Link to="/login" className="nav-btn">
          Log In
        </Link>
        <Link to="/register" className="nav-btn">
          Register Now
        </Link> */}
        <Link
          to="/login"
          className="ml-3 flex items-center nav-btn  justify-center px-4 py-2 rounded-full text-[#fff] text-[13px] bg-[#6149FA] hover:bg-[#6149FA] bg-[#6149FA]"
        >
          Log In
        </Link>
        <Link
          to="/register"
          className="ml-3 flex items-center nav-btn  justify-center px-4 py-2 rounded-full text-[#fff] text-[13px] bg-[#6149FA] hover:bg-[#6149FA] bg-[#6149FA]"
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
        <div className="md:hidden text-[13px]   fixed top-[72px] left-0 w-full h-full bg-[#0F1A2E] flex flex-col pl-5  pr-5  sm:pl-[60px] sm:pr-[60px] md:pl-[70px] md:pr-[70px]">
          <Link to="" className="mt-4 mb-4">
            Business
          </Link>
          <Link to="" className="mt-4 mb-4">
            About Us
          </Link>
          <Link to="" className="mt-4 mb-4">
            Services
          </Link>
          <Link to="/contact" className="mt-4 mb-4">
            Contact Us
          </Link>
          <Link
            to="/login"
            className="flex items-center nav-btn  justify-center px-4 py-2 rounded-full text-[#fff] text-[13px] bg-[#6149FA] hover:bg-[#6149FA] bg-[#6149FA]"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className=" flex mt-3  items-center nav-btn  justify-center px-4 py-2 rounded-full text-[#fff] text-[13px] bg-[#6149FA] hover:bg-[#6149FA] bg-[#6149FA]"
          >
            Register
          </Link>
        </div>
      )}
    </div>
  );
};

export default Navbar;
