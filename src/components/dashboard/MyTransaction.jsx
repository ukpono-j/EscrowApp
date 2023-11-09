import React, { useState } from "react";
import { Link } from "react-router-dom";
import Money from "../../assets/money.jpg";
import AboutImg from "../../assets/about.png";
import Lady from "../../assets/lady.png";
import Money_Two from "../../assets/money2.jpg";
import "./myTransaction.css";

const MyTransaction = () => {
  const [create, setCreate] = useState(true);
  const [join, setJoin] = useState(false);

  const handleCreate = () => {
    setCreate(true);
    setJoin(false);
  };

  const handleJoin = () => {
    setJoin(true);
    setCreate(false);
  };

  return (
    <div className="font-[Poppins] text-[#E4E4E4] md:pl-20 pl-4 mt-10 bg-[#072534]  min-h-[100vh]  pr-4  md:pr-20 pt-14  pb-10">
      <h1 className="font-bold text-[35px] join text-center md:text-start">
        TrustLink: Confident Transactions
      </h1>

      <div className="gif border-b-[1px] border-[#D8D3EB]   flex mt-8">
        <h3
          onClick={handleCreate}
          className={`cursor-pointer text-[13px] ${
            create
              ? "text-[#E4E4E4] border-b-[4px]  h-[32px]  border-[#DA9A21]"
              : ""
          }`}
        >
          Create Transaction
        </h3>
        <h3
          onClick={handleJoin}
          className={`ml-6 text-[13px]  cursor-pointer ${
            join
              ? "text-[#E4E4E4] border-b-[4px]  h-[32px]  border-[#DA9A21]"
              : ""
          }`}
        >
          Join Transaction
        </h3>
      </div>
      {create && (
        <div className="flex items-center justify-center   flex-col min-h-[100vh] w-[100%] mt-14 ">
          <div className="sm:w-[500px] w-[100%] h-[500px] myTransaction   flex items-center justify-center">
            <img
              src={AboutImg}
              alt=""
              className="sm:w-[100%] h-[100%] object-contain  w-[80%]  moving"
            />
          </div>
          <div className="text-center mt-4">
            <h4>Create your first transaction</h4>
            <p className="pt-3 text-[13px]">
              Click below to create a new transaction as either a Buyer or a
              Seller.
            </p>
            <div className="flex items-center justify-center ">
              <Link
                to="/create-transaction"
                className="mt-9 sm:w-[400px] w-[100%]  flex items-center justify-center createTransaction_Btn  h-[50px] rounded-2xl   text-[#fff]"
              >
                Create
              </Link>
            </div>
          </div>
        </div>
      )}
      {join && (
        <div className="flex items-center justify-center   flex-col min-h-[100vh] w-[100%] mt-14 ">
          <div className="sm:w-[500px] w-[100%] h-[500px] myTransaction   flex items-center justify-center">
            <img
              src={Lady}
              alt=""
              className="sm:w-[100%] h-[100%] object-contain  w-[80%]  moving"
            />
          </div>
          <div className="text-center mt-4 sm:w-[600px] w-[100%]  ">
            <h4>Join your first transaction</h4>
            <p className="pt-3 text-[13px]">
              Click below to join a transaction as either a Buyer or a Seller.
              You can join one that’s already been created with the unique code
              you were given.
            </p>
            <div className="w-full  flex items-center justify-center ">
              <Link
                to="/join-transaction"
                className="mt-9 sm:w-[400px] w-[100%]  flex items-center justify-center createTransaction_Btn  h-[50px] rounded-2xl   text-[#fff]"
              >
                Join
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTransaction;
