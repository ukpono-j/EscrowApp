import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaShieldAlt, FaHandshake, FaLock, FaUserCheck } from "react-icons/fa";
import { MdAddCircle, MdSecurity } from "react-icons/md";
import { Box, Text, Flex, Avatar } from "@chakra-ui/react";
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

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const imageURL = {
    create: CreateImg,
    join: JoinImg,
  };

  const features = [
    {
      icon: <FaShieldAlt />,
      title: "100% Secure",
      description: "Bank-level encryption protects your funds and data.",
    },
    {
      icon: <FaHandshake />,
      title: "Insurance - Money back guarantee",
      description: "Sylo insures against fraud or disputes, ensuring peace of mind.",
    },
    {
      icon: <FaLock />,
      title: "Absolute Fairplay",
      description: "Funds stay locked until all terms are met, protecting both parties.",
    },
  ];

  // Calculate dynamic margin based on sidebar state
  const getMarginClass = () => {
    if (windowWidth < 768) {
      // On mobile, use minimal margin when sidebar is collapsed
      return sidebarCollapsed ? "ml-[0px]" : "ml-0";
    } else {
      // On desktop, adjust margin based on sidebar state
      return sidebarCollapsed ? "ml-[10px]" : "ml-[280px]";
    }
  };

  // Animation variants for the header section
  const headerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        ease: "easeOut" 
      }
    },
  };

  return (
    <div
      className={`min-h-screen pt-28 general_Structure relative overflow-hidden transition-all duration-300 ${getMarginClass()}`}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-gradient-to-br from-yellow-400/10 to-yellow-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-gradient-to-bl from-yellow-500/10 to-amber-700/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full">
        {/* Header with Background and Animation */}
        <motion.div
          className="relative py-8 px-6 rounded-2xl mb-8 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(183, 137, 57, 0.1) 0%, rgba(138, 109, 47, 0.1) 100%)",
            border: "1px solid rgba(183, 137, 57, 0.2)",
            backdropFilter: "blur(8px)",
          }}
          initial="hidden"
          animate="visible"
          variants={headerVariants}
        >
          {/* Subtle decorative element */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-amber-600/10 rounded-br-full opacity-50" />
          
          <div className="relative z-10">
            <Text className="text-5xl sm:text-3xl font-bold leading-tight sm:text-left mb-3">
              Secure Escrow Against Scams
            </Text>
            <Text className="text-left mb-12 md:text-lg">
              Make risk-free, scam-free transactions with Sylo. The Only middleman you need.
            </Text>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-[#1A202C] mb-8">
          {["create", "join"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="group relative outline-none text-sm sm:text-base font-medium pb-3 px-2 transition-all"
            >
              <Text
                className={`relative font-bold z-10 ${activeTab === tab ? "" : ""}`}
              >
                {tab === "create" ? "Create Transaction" : "Join Transaction"}
              </Text>

              {/* Simple underline for active tab */}
              <div
                className={`absolute bottom-0 left-0 h-1 bg-[#987733] rounded-t-md transition-all duration-300 ${
                  activeTab === tab ? "w-full" : "w-0"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-8 flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-16">
          {/* Left Content */}
          <div className="w-full lg:w-1/2">
            {activeTab === "create" ? (
              <>
                <Text className="text-xl sm:text-xl font-bold mb-4">
                  Pay and receive money with confidence.
                </Text>
                <Text className="mb-3 font-bold leading-relaxed">
                  How Does Sylo Secure Your Deals?
                </Text>
                <Text className="mb-8 text-sm leading-relaxed">
                  Sylo locks funds until both parties meet agreed terms, ensuring scam-free transactions.
                  You get EXACTLY what you agreed for.
                </Text>
                <div>
                  <div className="mb-5">
                    <h3 className="font-bold mb-1">Funds Stay Safe Until Terms Are Met</h3>
                    <p className="text-sm"> Funds are locked with Sylo until both buyer and seller fulfill their agreed terms, guaranteeing ABSOLUTE FAIRPLAY</p>
                  </div>
                  <div className="mb-5">
                    <h3 className="font-bold mb-1">Transactions Backed by Insurance</h3>
                    <p className="text-sm">Every deal is protected with insurance, covering losses from fraud or disputes, so you can transact with confidence.</p>
                  </div>
                </div>

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
                        <Text className="text-sm">Start a deal as a buyer or seller. Define terms, invite the other party, while Sylo secures it.</Text>
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
                        <Text className="text-sm">Got an invite code? Paste it to join the deal.
                          Review terms, agree, and proceed with our coverage.
                        </Text>
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
        <div className="mt-24">
          <h3 className="text-3xl font-[900] mb-12 text-[#9B7933]">
            Why Choose Sylo
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