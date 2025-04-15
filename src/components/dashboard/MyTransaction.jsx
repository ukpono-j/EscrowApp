import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaShieldAlt, FaHandshake, FaLock, FaUserCheck } from "react-icons/fa";
import { MdAddCircle, MdSecurity } from "react-icons/md";
import { Box, Text, Flex, Avatar } from "@chakra-ui/react";
// import CreateImg from "../../assets/secure_transaction2.jpg";
import CreateImg from "../../assets/create_transaction2.jpg";
import JoinImg from "../../assets/create_transaction1.jpg";

const MyTransaction = ({ sidebarCollapsed = true }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

   // Track window resizing
   useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  


  const imageURL = {
    create: CreateImg,
    join: JoinImg,
  };

  const features = [
    {
      icon: <FaShieldAlt />,
      title: "100% Secure",
      description: "Bank-level encryption protects every transaction"
    },
    {
      icon: <FaHandshake />,
      title: "No Middlemen",
      description: "Direct peer-to-peer transactions without intermediaries"
    },
    {
      icon: <FaLock />,
      title: "Escrow Protection",
      description: "Funds released only when conditions are met"
    }
  ];

    // Calculate dynamic margin based on sidebar state
    const getMarginClass = () => {
      if (windowWidth < 768) {
        // On mobile, use minimal margin when sidebar is collapsed
        return sidebarCollapsed ? "ml-[80px]" : "ml-0";
      } else {
        // On desktop, adjust margin based on sidebar state
        return sidebarCollapsed ? "ml-[10px]" : "ml-[280px]";
      }
    };

  return (
    <div className={`min-h-screen general_Structure relative overflow-hidden font-[Poppins] transition-all duration-300 ${getMarginClass()}`}>
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-gradient-to-br from-yellow-400/10 to-yellow-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-gradient-to-bl from-yellow-500/10 to-amber-700/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <Text className="text-4xl sm:text-4xl font-bold leading-tight text-center sm:text-left mb-3">
          Confident Transactions
        </Text>

        <Text className="max-w-xl text-center sm:text-left mb-12 text-lg">
          Secure, transparent, and effortless—experience the future of digital transactions
        </Text>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-[#1A202C] mb-8">
          {["create", "join"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="group relative outline-none text-sm sm:text-base font-medium pb-3 px-2 transition-all"
            >
              <Text className={`relative font-bold z-10 ${activeTab === tab ? "" : ""}`}>
                {tab === "create" ? "Create Transaction" : "Join Transaction"}
              </Text>
              
              {/* Simple underline for active tab */}
              <div 
                className={`absolute bottom-0 left-0 h-1 bg-[#987733] rounded-t-md transition-all duration-300 ${activeTab === tab ? 'w-full' : 'w-0'}`}
              />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-8 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Left Content */}
          <div className="w-full lg:w-1/2">
            {activeTab === "create" ? (
              <>
                <Text className="text-3xl sm:text-4xl font-bold mb-4">
                  Start a Transaction with Confidence
                </Text>
                <Text className="mb-8 leading-relaxed">
                  Whether you're buying or selling, EscrowPay ensures every deal is safe, streamlined, and stress-free. No risks, no surprises — just guaranteed peace of mind.
                </Text>

                <div className="space-y-6 mb-8">
                  <h4 className="font-bold text-xl text-[#9B7933]">
                    Your Options
                  </h4>

                  <div className="bg-white/5 backdrop-blur-sm p-5 rounded-xl border border-yellow-500/30 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-lg">
                        <MdAddCircle className="text-xl text-white" />
                      </div>
                      <div>
                        <Text className="font-bold mb-1">Create a New Transaction</Text>
                        <Text className="text-sm">Launch a secure deal as a buyer or seller. Set the terms, invite the other party, and let us handle the rest.</Text>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm p-5 rounded-xl border border-yellow-500/30 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-lg">
                        <FaUserCheck className="text-xl text-white" />
                      </div>
                      <div>
                        <Text className="font-bold mb-1">Join a Transaction</Text>
                        <Text className="text-sm">Got an invite? Join the deal, review the terms, and move forward with trust.</Text>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  to="/create-transaction"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#B38939] to-[#8A6D2F] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(183,138,51,0.5)] transition-all duration-300"
                >
                  <MdAddCircle className="text-xl" />
                  <span>Create Transaction</span>
                </Link>
              </>
            ) : (
              <>
                <Text className="text-3xl sm:text-4xl font-bold mb-4">
                  Join a trusted deal
                </Text>
                <Text className="leading-relaxed mb-8">
                  Have a transaction code? Enter the secure environment of an active deal with full clarity and zero stress. Review terms, communicate clearly, and complete transactions with confidence.
                </Text>

                <div className="bg-white/5 backdrop-blur-sm p-5 rounded-xl border border-yellow-500/30 transition-all duration-300 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-lg">
                      <MdSecurity className="text-xl text-white" />
                    </div>
                    <div>
                      <Text className="font-bold mb-1">Safe and Secure</Text>
                      <Text className="text-sm">Every transaction is protected with bank-level security and encryption, giving you complete peace of mind.</Text>
                    </div>
                  </div>
                </div>

                <Link
                  to="/join-transaction"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#B38939] to-[#8A6D2F] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(183,138,51,0.5)] transition-all duration-300"
                >
                  <FaHandshake className="text-xl" />
                  <span>Join Transaction</span>
                </Link>
              </>
            )}
          </div>

          {/* Right Content */}
          <div className="w-full lg:w-1/2">
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -top-6 -left-6 w-24 h-24 border-2 border-yellow-500/20 rounded-lg" />
              <div className="absolute -bottom-6 -right-6 w-24 h-24 border-2 border-yellow-500/20 rounded-lg" />

              <div className="rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.3)] relative z-10 hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-amber-700/20 mix-blend-overlay z-10" />
                <img
                  src={activeTab === "create" ? imageURL.create : imageURL.join}
                  alt="Transaction Visual"
                  className="w-full h-[400px] object-cover"
                />

                {/* Overlay text */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 z-20">
                  <div className="text-white text-lg font-bold mb-1">
                    {activeTab === "create" ? "Secure Your Transaction" : "Join With Confidence"}
                  </div>
                  <div className="text-yellow-300 text-sm">
                    {activeTab === "create" ? "Escrow protection for all parties" : "Simple, secure, and transparent"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 mb-12">
          <h3 className="text-3xl font-[900] mb-12 text-[#9B7933]">
            Why Choose EscrowPay
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-6 border-yellow-500/30 transition-all duration-300 hover:-translate-y-2"
              >
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-600/20 text-yellow-400 text-xl">
                  {feature.icon}
                </div>
                <Text className="text-lg font-bold mb-2">{feature.title}</Text>
                <Text className="text-[17px]">{feature.description}</Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTransaction;