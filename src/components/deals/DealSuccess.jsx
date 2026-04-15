
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { formatNaira } from "../../utils";
import { Dot, MessageCircleMore } from "lucide-react";
import { useToast } from "@chakra-ui/react";
import { useManagedToast } from "../../utils/toastManager";
import axios from "../../utils/axiosConfig";
import { useCallback } from "react";



export default function DealSuccess() {

  const managedToast = useManagedToast();
     const { id } = useParams();

   const navigation = useLocation();
   const navigate = useNavigate();

     const toast = useToast();


  const role = sessionStorage.getItem("user_role");


    const handleChat = useCallback(async () => {
      try {
        const res = await axios.post(`/api/transactions/create-chatroom`, { transactionId: id }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` },
        });
        if (res.data?.success && res.data.chatroomId) {
          navigate(`/chat/${res.data.chatroomId}`);
        } else {
          throw new Error('Failed to create chatroom');
        }
      } catch (error) {
        managedToast({ id: `chat-error-${id}`, title: 'Error', description: error.response?.data?.error || error.message, status: 'error', duration: 5000, isClosable: true });
      }
    }, [id, navigate, managedToast]);



  const {
    //   paymentName: `${userDetails.firstName} ${userDetails.lastName}` || role,
      email,
      paymentAmount,
      paymentDescription,
    //   selectedUserType,
    } = navigation.state;

    const copyContent = async () => {
      try {
        await navigator.clipboard.writeText(id);
        toast({ title: "Link copied!", status: "success", duration: 3000 });
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }


    return (
      <div className="text-center text-white/80  ">

        <div className="flex justify-between py-6 border-b px-4 bg-[#0f1e39]">
            <div className="border px-3 py-2 rounded-2xl text-[#B38939] bg-[#B38939] bg-opacity-20 " > <p className="text-base text-start ">{role === "buyer" ? "YOU'RE BUYING" : "YOU'RE SELLING"}</p></div>
      
       <button
         onClick={handleChat}
       className="bg-blue-400 flex self-start rounded p-2" > <MessageCircleMore className="text-blue-400 fill-white " /></button>
        </div>

        <div className="p-4 ">

        <p className="text-base text-start ">{paymentDescription}</p>
        <h2 className="font-semibold text-2xl text-white text-start ">{formatNaira(paymentAmount)}</h2>

         <div className="border px-3 py-2 my-3 rounded-2xl text-green-600 bg-[#0b272b] flex items-center" ><Dot size={36} /><p className="text-base ">
            Deal funded . waiting for seller 
            </p></div>


        <h2 className="font-semibold text-xl text-white">Send this ID to a {role === "buyer" ? "seller" : "buyer"}</h2>
        <p className="text-base text-center my-2">After you fund, share thus ID so the seller can join the deal</p>

        <div className=" flex flex-wrap items-center justify-between p-2 rounded-xl w-full bg-gray-500 bg-opacity-20">
          <div className="flex-1" >  <h4 className="truncate text-white/70 text-start">{id}</h4></div>
          <button onClick={copyContent} className=" p-2 rounded-xl active:scale-[0.98] transition text-white border">Copy</button>
        </div>
        {/* Note */}
            <p className="text-base my-2">Send via WhatApp, SMS, or any messaging app </p>

             <h2 className="font-semibold text-lg text-white/80 mt-12">{role === "buyer" ? "Buyer's email" : "Seller's email"}: {email}</h2>

             <div className="space-y-3 my-4">

        <button
          
            className="flex justify-center gap-1 border flex-1 p-2 rounded-xl w-full text-white"
          >
            Fund this deal
          </button>

        <button
          
            className="flex justify-center gap-1 border flex-1 p-2 rounded-xl w-full text-red-400"
          >
            Cancel
          </button>
             </div>
        </div>


      </div>
    )

  }



  