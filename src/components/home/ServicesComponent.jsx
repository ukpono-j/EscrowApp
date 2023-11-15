import React from "react";
import { Link } from "react-router-dom";
import Vesa from "../../assets/vesa.png";
import Card from "../../assets/card.png";
import Girl from "../../assets/about.png";
import "./ServicesComponent.css";


const ServicesComponent = () => {
  return (
    <div className="h-[auto]  services   md:pl-20 pl-5  pr-5  md:pr-20 md:pt-20 pt-8 pb-8   md:pb-20 text-[#FEFEFF] font-[Poppins] w-[100%]">
      <div className="h-[auto]">
        <div className="service_title m-auto  md:w-[560px] text-center font-[900] md:text-left   md:text-[50px] leading-[44px] md:leading-[60px]  text-[40px]">
          What you order has to be what you get!
        </div>
        {/* === buyer */}
        <div className="md:w-[80%]   h-[auto] sm:mt-16 mt-14  md:flex items-center justify-between  mb-6 ml-auto mr-auto">
          <div className=" md:w-[380px] h-[auto] flex flex-col md:items-start items-center md:text-start text-center">
            <h1 className="font-bold text-[34px]">Buyer protection</h1>
            <p className="text-[15px] mt-2 ">
              The buyer’s funds are held in Bondly’s custody & won’t be released
              to the seller until buyer have received the goods and are happy
              with the transaction.
            </p>
            <Link
              to="/register"
              className="mt-5  flex items-center nav-btn  justify-center px-7 py-3  rounded-full text-[#fff] text-[14px] bg-[#81712E] border-2  border-[#81712E] login_btn  hover:border-2  hover:border-[#81712E]  hover:bg-[transparent]"
            >
              Get Started now
            </Link>
          </div>
          <div className="rounded-3xl flex  justify-center   moving   md:mt-0 mt-14  md:w-[470px] h-[auto] ">
            <img
              src={Card}
              alt=""
              className="sm:w-[100%] w-[80%]"
            />
          </div>
        </div>
        {/* ========== Seller */}
        <div className="md:w-[80%]  h-[auto] mt-16    flex md:flex-row  flex-col-reverse items-center justify-between  mb-6 ml-auto mr-auto">
          <div className="rounded-3xl flex  justify-center   md:mt-0 mt-14   moving  md:w-[540px] h-[auto] ">
            <img
              src={Girl}
              alt=""
              className="w-[90%]"
            />
          </div>
          <div className=" md:w-[380px] h-[auto] flex flex-col md:items-start items-center md:text-start text-center">
            <h1 className="font-bold text-[34px]">Seller protection</h1>
            <p className="text-[15px] mt-2 ">
              We ensure the funds have been secured, notify you so you can ship
              the item to the buyer & distribute the cash to you after the buyer
              receives and accepts the goods.
            </p>
            <Link
              to="/register"
              className="mt-5  flex items-center nav-btn  justify-center px-7 py-3  rounded-full text-[#fff] text-[14px] bg-[#81712E] border-2  border-[#81712E] login_btn  hover:border-2  hover:border-[#81712E]  hover:bg-[transparent]"
            >
              Get Started now
            </Link>
          </div>
        </div>
        {/* ======== Fraud Protection */}
        <div className="md:w-[80%]  h-[auto] mt-20   md:flex items-center justify-between  mb-6 ml-auto mr-auto">
        <div className=" md:w-[300px] h-[auto] flex flex-col md:items-start items-center md:text-start text-center">
            <h1 className="font-bold text-[34px]">Fraud protection</h1>
            <p className="text-[15px] mt-2 ">
              Transactions are domiciled on Bondly’s wallets and payment portal
              to ensure that all transaction are verified as we work closely
              with authorities to further protect you.
            </p>
            <Link
              to="/register"
              className="mt-5  flex items-center nav-btn  justify-center px-7 py-3  rounded-full text-[#fff] text-[14px] bg-[#81712E] border-2  border-[#81712E] login_btn  hover:border-2  hover:border-[#81712E]  hover:bg-[transparent]"
            >
              Get Started now
            </Link>
          </div>
          <div className="rounded-3xl flex  justify-center   md:mt-0 mt-14  moving   md:w-[470px] h-[400px] ">
            <img
              src={Vesa}
              alt=""
              className=" h-[100%]  w-[100%] object-cover object-center bottom relative  rounded-3xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesComponent;
