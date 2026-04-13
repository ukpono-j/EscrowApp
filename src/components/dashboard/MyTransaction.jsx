import  { useState, useEffect } from "react";
import BuyerHome from "../BuyerHome";
import SellerHome from "../SellerHome";

// eslint-disable-next-line react/prop-types
const MyTransaction = ({ sidebarCollapsed = true }) => {
  // const [activeTab, setActiveTab] = useState("create");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  // const navigate = useNavigate(); // Add this hook

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

    const role =  sessionStorage.getItem("user_role");


  return (
    <div className={`min-h-screen pt-28 transition-all duration-300 ${getMarginClass()}`}>
      <div className="relative z-10 w-full max-w-6xl mx-auto ">
        {/* Header Section */}
       {role === "buyer" && <BuyerHome />}
       {role === "seller" && <SellerHome />}
  
      </div>
    </div>
  );
};

export default MyTransaction;