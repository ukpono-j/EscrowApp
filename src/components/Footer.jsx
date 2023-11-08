import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import NewsLetter from "./home/NewsLetter";

const Footer = () => {
  return (
    <div className="footer">
      <NewsLetter/>
      <div className="font-[Poppins]   text-[#fff] list-none mb-[-30px] pt-20 pb-20   sm:pl-20 sm:pr-20 pl-5 pr-5  h-[auto] flex flex-col  items-center justify-center  w-[100%]">
        <div className=" sm:flex h-[auto]   justify-between w-[100%] ">
          <div className=" sm:w-[400px] w-[100%] h-[auto]">
            <Link TO="/" className="text-[30px] font-bold">ESCROW</Link>
            <div className="text-[12px] leading-[23px] pt-4 font-[200]">
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Velit,
              optio. Voluptate sunt alias numquam quos ratione harum libero,
              nisi ipsam eligendi repudiandae nesciunt distinctio cumque,
              commodi, atque id inventore eum.
            </div>
          </div>
          <div className=" w-[auto] sm:mt-0 mt-8  h-[auto]">
            <h1 className="text-[30xp]">Business</h1>
            <li className="text-[14px] pt-3">About</li>
            <li className="text-[12px] pt-3">Blog</li>
            <li className="text-[12px] pt-3">Partners</li>
          </div>
          <div className=" w-[auto] sm:mt-0 mt-8 h-[auto]">
            <h1 className="text-[30xp]">Legal</h1>
            <li className="text-[14px] pt-3">Cookies</li>
            <li className="text-[12px] pt-3">Privacy</li>
            <li className="text-[14px] pt-3">FAQ</li>

          </div>
          <div className=" w-[auto] sm:mt-0 mt-8  h-[auto]">
            <h1 className="text-[30xp]">Services</h1>
            <li className="text-[14px] pt-3">Banking and Payments</li>
          </div>
       
        </div>
        {/* <div className="pt-20">copyright</div> */}
      </div>
    </div>
  );
};

export default Footer;
