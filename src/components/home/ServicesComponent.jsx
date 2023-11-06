import React from "react";
import { Link } from "react-router-dom";
import Buyer from "../../assets/seller.png";

const ServicesComponent = () => {
  return (
    <div className="h-[auto]  bg-[#0f1a2e] md:pl-20 pl-5  pr-5  md:pr-20 pt-20 pb-20 text-[#FEFEFF] font-[Poppins] w-[100%]">
      <div className="h-[auto]">
        <div className="service_title m-auto sm:text-[40px] text-[35px] md:w-[480px] text-center font-[900] sm:leading-[57px] leading-[45px]">
          What you order has to be what you get!
        </div>
        {/* === buyer */}
        <div className="md:w-[80%]  h-[auto] sm:mt-16 mt-14  md:flex items-center justify-between  mb-6 ml-auto mr-auto">
          <div className=" md:w-[380px] h-[auto] flex flex-col md:items-start items-center md:text-start text-center">
            <h1 className="font-bold text-[34px]">Buyer protection</h1>
            <p className="text-[15px] mt-2 ">
              The buyer’s funds are held in Bondly’s custody & won’t be released
              to the seller until buyer have received the goods and are happy
              with the transaction.
            </p>
            <Link
              to="/register"
              className="w-[200px] pt-2  items-center justify-center  pb-2 mt-[17px] rounded-full text-[15px] bg-[#6149FA] flex text-[#FEFEFF]"
            >
              Get Started now
            </Link>
          </div>
          <div className="rounded-3xl  md:mt-0 mt-9  md:w-[470px] h-[400px] ">
            <img
              src={Buyer}
              alt=""
              className="w-[100%] h-[100%] rounded-3xl  object-cover"
            />
          </div>
        </div>
        {/* ========== Seller */}
        <div className="md:w-[80%]  h-[auto] mt-16    flex md:flex-row  flex-col-reverse items-center justify-between  mb-6 ml-auto mr-auto">
          <div className="rounded-3xl md:mt-0 mt-9   md:w-[470px] h-[400px] ">
            <img
              src={Buyer}
              alt=""
              className="w-[100%] h-[100%] rounded-3xl  object-cover"
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
              className="w-[200px] pt-2  items-center justify-center  pb-2 mt-[17px] rounded-full text-[15px] bg-[#6149FA] flex text-[#FEFEFF]"
            >
              Get Started now
            </Link>
          </div>
        </div>
        {/* ======== Fraud Protection */}
        <div className="md:w-[80%]  h-[auto] mt-16   md:flex items-center justify-between  mb-6 ml-auto mr-auto">
        <div className=" md:w-[380px] h-[auto] flex flex-col md:items-start items-center md:text-start text-center">
            <h1 className="font-bold text-[34px]">Fraud protection</h1>
            <p className="text-[15px] mt-2 ">
              Transactions are domiciled on Bondly’s wallets and payment portal
              to ensure that all transaction are verified as we work closely
              with authorities to further protect you.
            </p>
            <Link
              to="/register"
              className="w-[200px] pt-2  items-center justify-center  pb-2 mt-[17px] rounded-full text-[15px] bg-[#6149FA] flex text-[#FEFEFF]"
            >
              Get Started now
            </Link>
          </div>
          <div className="rounded-3xl md:mt-0 mt-9   md:w-[470px] h-[400px] ">
            <img
              src={Buyer}
              alt=""
              className="w-[100%] h-[100%] rounded-3xl  object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesComponent;
