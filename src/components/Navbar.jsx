// Navbar.jsx
import React, { useState } from "react";
import { Link as ScrollLink, scroller } from "react-scroll";
import { AiOutlineMenu } from "react-icons/ai";
import { Link } from "react-router-dom";
// import Logo from "../assets/logo3.png"
import Logo from "../assets/logo1.png"
import "./Navbar.css";
import ThemeToggle from "../ThemeToggle";
import { Box, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@chakra-ui/react";


const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileMenuBg = useColorModeValue("#FAFAFA", "#1A202C");


  const scrollTo = (element) => {
    scroller.scrollTo(element, {
      duration: 800,
      delay: 0,
      smooth: "easeInOutQuart",
    });
  };

  return (
    <Box className="pl-5 pr-5 font-[Inter] md:pl-[60px] md:pr-[60px] left-0 justify-between fixed z-50 top-0 pt-5 pb-5 w-[100%] flex items-center"
      bg={mobileMenuBg}
    >
      <div className="font-bold cursor-pointer  md:text-2xl text-2xl">
        <Link to="/" className="outline-none" onClick={() => scrollTo("home")}>
          {/* MiddleMan */}
          {/* <h1 className="text-[30px] text-[#112A40] logo_icon font-bold">SafeSylo</h1> */}
          <img src={Logo} alt="Logo Detail" className="w-[130px]" />
        </Link>
      </div>
      <div className="flex w-full justify-end">
        <Text className="hidden text-[16px] md:flex  space-x-6 items-center">
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
            className="ml-3 flex items-center  justify-center px-9 py-3  rounded-full text-white  text-[15px] bg-[#B38939] border-2  border-[#B38939]"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="ml-3 flex items-center  justify-center px-9 py-3  rounded-full  text-[15px] bg-[transparent]  border-2  border-[#B38939]"
          >
            Register
          </Link>

        </Text>
        <div className="ml-4">
          <ThemeToggle />
        </div>
      </div>
      <div className="flex items-center">

        <Text className="md:hidden flex items-center">
          <AiOutlineMenu
            className="text-3xl cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          />
        </Text>
      </div>
      {isMenuOpen && (
        <Box
          className="md:hidden border text-[13px] z-30 pt-4 mb-5 text-center fixed top-[90px] left-0 w-full h-full flex flex-col pl-5 pr-5 sm:pl-[60px] sm:pr-[60px] md:pl-[70px] md:pr-[70px]"
          bg={mobileMenuBg}
        >
          <Text>
            <ScrollLink
              to="about"
              className="mt-4 mb-4"
              smooth={true}
              duration={800}
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </ScrollLink>
          </Text>
          <Text>
            <ScrollLink
              to="services"
              className="mt-4 mb-4"
              smooth={true}
              duration={800}
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </ScrollLink>
          </Text>
          <Text>
            <ScrollLink
              to="faq"
              className="mt-4 mb-4"
              smooth={true}
              duration={800}
              onClick={() => setIsMenuOpen(false)}
            >
              FAQ
            </ScrollLink>
          </Text>
          <Text>
            <Link
              to="/contact"
              className="mt-4 mb-4"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact Us
            </Link>
          </Text>
          <Text>
            <Link
              to="/login"
              className="flex items-center justify-center px-7 py-3  rounded-full text-[#fff] text-[13px]  hover:bg-[#B38939] bg-[#B38939]"
            >
              Log In
            </Link>
          </Text>
          <Text>
            <Link
              to="/register"
              className=" flex mt-3  items-center justify-center px-7 py-3   rounded-full text-[13px] bg-[transparent] hover:bg-[#B38939] border-2  border-[#B38939]"
            >
              Register
            </Link>
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default Navbar;
