import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import { FaHandshake, FaArrowRight, FaUsers, FaShieldAlt, FaClock, FaChartLine } from "react-icons/fa";
import { MdAddCircle, MdSecurity, MdSpeed } from "react-icons/md";

const MyTransaction = ({ sidebarCollapsed = true }) => {
  const [activeTab, setActiveTab] = useState("create");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate(); // Add this hook

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getMarginClass = () => {
    if (windowWidth < 768) {
      return sidebarCollapsed ? "ml-[0px]" : "ml-0";
    } else {
      return sidebarCollapsed ? "ml-[10px]" : "ml-[280px]";
    }
  };

  const handleNavigation = () => {
    if (activeTab === "create") {
      navigate("/create-transaction");
    } else {
      navigate("/join-transaction");
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const ctaVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.2 } }
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.4 } }
  };

  const statsVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut", delay: 0.6 } }
  };

  const tabContent = {
    create: {
      title: "Create a Transaction",
      buttonText: "Create Now",
      icon: <MdAddCircle className="text-xl" />,
      features: [
        { icon: <FaShieldAlt />, title: "Secure" },
        { icon: <FaUsers />, title: "Multi-party" },
        { icon: <MdSpeed />, title: "Fast Setup" }
      ]
    },
    join: {
      title: "Join a Transaction", 
      buttonText: "Join Now",
      icon: <FaHandshake className="text-xl" />,
      features: [
        { icon: <FaClock />, title: "Real-time" },
        { icon: <MdSecurity />, title: "Verified" },
        { icon: <FaChartLine />, title: "Tracked" }
      ]
    }
  };

  const currentTab = tabContent[activeTab];

  return (
    <div className={`min-h-screen pt-28 transition-all duration-300 ${getMarginClass()}`}>
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <div
          className="py-8 px-6 rounded-2xl mb-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(183, 137, 57, 0.1) 0%, rgba(138, 109, 47, 0.1) 100%)",
            border: "1px solid rgba(183, 137, 57, 0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold">
            {currentTab.title}
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-[#1A202C] mb-8 justify-center">
          {["create", "join"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative outline-none text-sm sm:text-base font-medium pb-3 px-4 transition-all hover:text-[#9B7933]"
            >
              <span className={`font-bold capitalize ${activeTab === tab ? "text-[#9B7933]" : "text-gray-600"}`}>
                {tab}
              </span>
              <div
                className={`absolute bottom-0 left-0 h-1 bg-[#987733] rounded-t-md transition-all duration-300 ${activeTab === tab ? "w-full" : "w-0"}`}
              />
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          {/* Main CTA Section */}
          <div
            className="p-8 rounded-xl max-w-md w-full"
            style={{
              background: "linear-gradient(135deg, rgba(183, 137, 57, 0.1) 0%, rgba(138, 109, 47, 0.1) 100%)",
              border: "1px solid rgba(183, 137, 57, 0.2)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-[#B38939] to-[#8A6D2F] rounded-full flex items-center justify-center text-white text-2xl">
                {currentTab.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to get started?</h3>
              <p className="text-gray-600 text-sm">
                {activeTab === "create" 
                  ? "Set up your transaction in just a few clicks"
                  : "Enter your transaction code and join instantly"
                }
              </p>
            </div>

            <button
              onClick={handleNavigation}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#B38939] to-[#8A6D2F] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(183,138,51,0.5)] transition-all duration-300 w-full justify-center group"
            >
              {currentTab.icon}
              <span>{currentTab.buttonText}</span>
              <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTransaction;