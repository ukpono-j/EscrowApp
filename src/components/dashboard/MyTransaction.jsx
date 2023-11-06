import React, { useState } from "react";
import { Link } from "react-router-dom";
import Money from "../../assets/money.jpg";
import Money_Two from "../../assets/money2.jpg";



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
    <div className="font-[Poppins] md:pl-20 pl-4 mt-10   pr-4  md:pr-20 pt-14  pb-10">
      <h1 className="md:text-[30px] text-[20px] font-bold">TrustLink: Confident Transactions</h1>

      <div className="gif border-b-[1px] border-[#D8D3EB]   flex mt-8">
        <h3
          onClick={handleCreate}
          className={`cursor-pointer text-[13px] ${
            create
              ? "text-[#000] border-b-[4px]  h-[32px]  border-blue-500"
              : ""
          }`}
        >
          Create Transaction
        </h3>
        <h3
          onClick={handleJoin}
          className={`ml-6 text-[13px]  cursor-pointer ${
            join ? "text-[#000] border-b-[4px]  h-[32px]  border-blue-500" : ""
          }`}
        >
          Join Transaction
        </h3>
      </div>
      {create && (
        <div className="flex items-center justify-center  flex-col h-[100vh] w-[100%] mt-4 ">
          <div className="w-[400px] h-[400px]  rounded-full">
            <img src={Money} alt="" className="w-[100%] h-[100%] object-cover rounded-full"  />
          </div>
          <div className="text-center mt-4">
            <h4>Create your first transaction</h4>
            <p className="pt-3 text-[13px]">
              Click below to create a new transaction as either a Buyer or a
              Seller.
            </p>
            <Link to="/create-transaction"
              className="mt-9 w-[400px] flex items-center justify-center  h-[50px] rounded-2xl bg-[#0F1A2E] text-[#fff]"
              
            >
              Create
            </Link>
          </div>
        </div>
      )}
      {join && (
        <div className="flex items-center justify-center  flex-col h-[100vh] w-[100%] mt-4 ">
          <div className="w-[400px] h-[400px] rounded-full">
          <img src={Money_Two} alt="" className="w-[100%] h-[100%] object-cover rounded-full"  />
          </div>
          <div className="text-center mt-4">
            <h4>Join your first transaction</h4>
            <p className="pt-3 text-[13px]">
              Click below to join a transaction as either a Buyer or a Seller.
              You can join one that’s already been created with the unique code
              you were given.
            </p>
             <div className="w-full  flex items-center justify-center ">
             <Link to="/join-transaction"
              className="mt-9 flex items-center justify-center  w-[400px] h-[50px] rounded-2xl bg-[#0F1A2E] text-[#fff]"
              
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
