import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo1.png";
import { Image } from "@chakra-ui/react";
const ROLES = {
  BUYER: "buyer",
  SELLER: "seller",
};

export default function DashboardOnboarding() {
  const navigate = useNavigate();

  

  const handleRedirect = async (role) => {
    if (!role) return;
    sessionStorage.setItem("user_role", role);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F0EF]">
    
      {/* Top */}
      <div className="px-6 pt-16 pb-10 bg-blue-950 text-white">
        <div className=" rounded-full flex items-center justify-center bg-white/10">
          <Image
            src={Logo}
            alt="Sylo"
            style={{
              maxHeight: "40px",
              maxWidth: "160px",
              width: "auto",
              height: "auto",
              objectFit: "contain",
            }}
            filter="drop-shadow(0 2px 4px rgba(179, 137, 57, 0.1))"
          />
        </div>

        <h1 className="text-3xl font-bold mt-6">What are you doing today?</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-6 space-y-4">
        {/* Buyer */}
        <button
          onClick={() => handleRedirect(ROLES.BUYER)}
          className={`w-full transition active:scale-[0.98]`}
        >
          <div className="bg-white rounded-2xl px-5 py-6 border">
            <h2 className="text-lg font-semibold text-left text-black">
              I'm Buying
            </h2>
            <p className="text-gray-500 text-sm mt-1 text-left">
              Secure your payments with escrow protection
            </p>
          </div>
        </button>

        {/* Seller */}
          <button
          onClick={() => handleRedirect(ROLES.SELLER)}
          className={`w-full transition active:scale-[0.98]`}
        >
          <div className="bg-white rounded-2xl px-5 py-6 border">
            <h2 className="text-lg font-semibold text-left text-black">
              I'm Selling
            </h2>
            <p className="text-gray-500 text-sm mt-1 text-left">
              Receive secure payments from buyers
            </p>
          </div>
        </button>

      </div>
    </div>
  );
}
