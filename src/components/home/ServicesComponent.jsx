import React from "react";
import { Link } from "react-router-dom";
import Vesa from "../../assets/vesa.png";
import Card from "../../assets/card.png";
import Girl from "../../assets/about.png";
import "./ServicesComponent.css";
import { Box, Text } from "@chakra-ui/react";


const ServicesComponent = () => {
  return (
    <Box className="h-[auto] services md:pl-20 pl-5 pr-5  md:pr-20 md:pt-20 pt-8 pb-8   md:pb-20 w-[100%]">
      <div className="h-[auto]">
        <div className="service_title m-auto md:w-[560px] text-center font-[900] md:text-[50px] leading-[44px] md:leading-[60px]  text-[40px]">
          What You Order Has To Be What You Get!
        </div>
        {/* === buyer */}
        <div className="md:w-[100%] gap-8 h-[auto] sm:mt-16 mt-14  md:flex items-center justify-between  mb-6 ml-auto mr-auto">
          <div className=" md:w-[100%] h-[auto] flex flex-col md:items-start items-center md:text-start text-center">
            <h1 className="font-[900] text-[40px] service_sub_title">Buyer protection</h1>
            <p className="text-[17px] font-bold mt-2 ">
              What you order is what you get — or your money stays safe
            </p>
            <p className="text-[17px] mt-2 ">
              Shopping online or engaging in digital transactions shouldn't come with a risk. At Sylo, we make sure your money is protected until you're 100% satisfied. Whether you're buying a product, hiring a freelancer, or engaging in a peer-to-peer exchange, your funds are held securely in escrow and only released when you confirm the deal meets your expectations.
            </p>
            <p className="text-[17px] mt-2 ">
              Peace of mind in every purchase.
            </p>
            <p className="text-[17px] mt-2 font-bold">
              🔒 Start using Sylo today and experience next-level buyer confidence.
            </p>
            <Link
              to="/register"
              className="mt-5 flex rounded-full items-center nav-btn font-bold justify-center px-8 py-3 text-[#fff] text-[17px] bg-[#B38939] border-2  border-[#B38939] login_btn"
            >
              Get Started now
            </Link>
          </div>
          <div className="rounded-3xl flex justify-center moving  md:mt-0 mt-14  md:w-[100%] h-[auto] ">
            <img
              src={Card}
              alt=""
              className="sm:w-[100%] w-[80%]"
            />
          </div>
        </div>
        {/* ========== Seller */}
        <div className="md:w-[100%] gap-8 h-[auto] mt-16 flex md:flex-row flex-col-reverse items-center justify-between  mb-6 ml-auto mr-auto">
          <div className="flex justify-center md:mt-0 mt-14 moving  md:w-[100%] h-[auto] ">
            <img
              src={Girl}
              alt=""
              className="w-[90%]"
            />
          </div>
          <div className=" md:w-[100%] h-[auto] flex flex-col md:items-start items-center md:text-start text-center">
            <h1 className="font-[900] text-[40px] service_sub_title">Seller protection</h1>

            <h4 className="text-[17px] mt-2 font-bold">Ship with confidence, knowing your payment is locked in.</h4>
            <p className="text-[17px] mt-2">
              As a seller, you deserve the assurance that your time and effort won’t go to waste. With Sylo, funds from the buyer are securely held in escrow before you ship or deliver any service. This means you never have to worry about fake buyers, delayed payments, or chargebacks.
            </p>
            <p className="text-[17px] mt-2">
              Once the buyer confirms receipt or is satisfied with your product or service, we instantly release your payment. We’ve built Sylo with your security in mind — you can focus on delivering quality while we handle the trust.
            </p>
            <p className="text-[17px] mt-2 font-bold">
              📦 Start selling confidently with Sylo today.
            </p>
            <Link
              to="/register"
              className="mt-5 rounded-full flex items-center nav-btn justify-center font-bold px-10 py-3 text-[#fff] text-[17px] bg-[#B38939] border-2  border-[#B38939] login_btn"
            >
              Get Started now
            </Link>
          </div>
        </div>
        {/* ======== Fraud Protection */}
        <div className="md:w-[100%] h-[auto] mt-20 gap-10 md:flex items-center justify-between  mb-6 ml-auto mr-auto">
          <div className=" md:w-[100%] h-[auto] flex flex-col md:items-start items-center md:text-start text-center">
            <h1 className="font-[900] text-[40px] service_sub_title">Fraud protection</h1>
            <h4 className="text-[17px] mt-2 font-bold">We don’t just secure transactions — we help fight fraud.</h4>
            <p className="text-[17px] mt-2">
              At Sylo, your safety goes beyond just holding funds. Every transaction is processed through Bondly’s secure wallets and verification systems, ensuring every user is authenticated and each payment is monitored for legitimacy.
            </p>
            <p className="text-[17px] mt-2">
              We work closely with trusted partners, fraud prevention tools, and even authorities where needed to make sure scammers and bad actors are kept out of our system. Our protocols ensure that you get not only a safe transaction — but a clean environment to do business.
            </p>
            <p className="text-[17px] mt-3 font-bold">
            🛡️ Join Sylo and transact with confidence — every single time.
            </p>
            <Link
              to="/register"
              className="mt-5 flex rounded-full items-center nav-btn justify-center px-8 py-3 font-bold text-[#fff] text-[16px] bg-[#B38939] border-2  border-[#B38939] login_btn"
            >
              Get Started now
            </Link>
          </div>
          <div className="rounded-3xl flex justify-center md:mt-0 mt-14 moving md:w-[100%] h-[500px] ">
            <img
              src={Vesa}
              alt=""
              className=" h-[100%] w-[100%] object-cover object-center bottom relative rounded-3xl"
            />
          </div>
        </div>
      </div>
    </Box>
  );
};

export default ServicesComponent;
