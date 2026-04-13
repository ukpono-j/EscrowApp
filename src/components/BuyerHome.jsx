

import {  useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatNaira } from "../utils";
import DisplayActiveTransaction from "./dashboard/DisplayActiveTransaction";
import { useSelector } from "react-redux";


export default function BuyerHome() {
  const navigate = useNavigate();
    const { user, wallet, paymentDetails, loading, error } = useSelector((state) => state.wallet);

  return (
    <div className="w-full">
     

      {/* Content */}
      <div className="space-y-6">
        {/*  Wallet Card */}
       
           <div
            className="p-8 rounded-xl  w-full"
            style={{
              background: "linear-gradient(135deg, rgba(183, 137, 57, 0.1) 0%, rgba(138, 109, 47, 0.1) 100%)",
              border: "1px solid rgba(183, 137, 57, 0.2)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
          <p className="text-sm text-white/80">AVAILABLE TO WITHDRAW</p>

          <h2 className="text-3xl font-bold mt-1">{formatNaira(wallet?.balance || 0)}</h2>
           {/* <p className="text-xs text-gray-400">{formatNaira(0)} locked in escrow</p> */}

          <div>
          <button onClick={() => navigate("/create-transaction")} className="mt-4 bg-[#987733] text-white px-4 py-2 rounded-xl active:scale-[0.98] transition w-full">
           Buy from a seller outside Sylo
          </button>
          
          </div>

        </div>

      
        {/*  Section */}
       <div className="flex justify-between mb-2">
            <h2 className="text-xl text-white font-semibold">
              Active Deals
            </h2>
            <button onClick={() => navigate("/transactions/tab")} className="text-[#987733] text-sm flex gap-1 items-center">
              View all <ArrowRight size={18} />
            </button>
          </div>

        {/*  Actions */}
        <div className="space-y-3">
          <DisplayActiveTransaction />
        </div>
      </div>
    </div>
  );
}
