import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatNaira } from "../../utils";
import axios from "../../utils/axiosConfig";
import { useSelector } from "react-redux";
import { useToast } from "@chakra-ui/react";
// import { Copy, Send, Share2 } from "lucide-react";


const validateApiResponse = (responseData, endpoint) => {
  if (responseData.success) {
    return responseData.data || {};
  }
  console.error(`Invalid response from ${endpoint}:`, responseData);
  throw new Error(responseData.error || "Invalid response received");
};


export default function CreateDeal() {
  const navigate = useNavigate();
  const { userDetails } = useSelector(state => state.user);
  const { user, wallet, paymentDetails, loading, error } = useSelector((state) => state.wallet);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const [form, setForm] = useState({
    // buyer: "",
    item: "",
    price: "",
  });

  const isValid =
    userDetails.email.trim() &&
    form.item.trim() &&
    Number(form.price) > 0;

  const amount = Number(form.price || 0);
  const fee = Math.ceil(amount * 0.01); // 1%
  const total = amount + fee;

  const handleNext = () => {
    if (!isValid) return;

    // const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // if (!re.test(String(userDetails.email.trim()).toLowerCase())) {

    //   toast({
    //     title: "Error",
    //     description: "Invalid email address",
    //     status: "error",
    //     duration: 3000,

    //   });


    //   return
    // }


    setStep(2);

    setTimeout(() => {
      globalThis.scrollTo({ top: 0, left: 0, behavior: "smooth" });

    }, 1000);

  };


  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };


  const role = sessionStorage.getItem("user_role");




  const handleCreateDeal = () => {



    if (isLoading) {
      toast({
        title: "Transaction in progress",
        description: "Please wait while the transaction is being created.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

 
  // if(role === "buyer" && parseFloat(wallet?.balance) < 1){

  //      toast({
  //       title: "Deposit Required.",
  //       description: "InSufficient balance please fund your account to continue",
  //       status: "warning",
  //       duration: 3000,
  //       isClosable: true,
  //     });

  //     return
  //   }
    
    setIsLoading(true)
    
    const requestData = {
      paymentName: `${userDetails.firstName} ${userDetails.lastName}` || role,
      email: userDetails.email.trim(),
      paymentAmount: parseFloat(total),
      paymentDescription: form.item.trim(),
      selectedUserType: role,
      paymentBank: "Pending",
      paymentBankCode: "000",
      paymentAccountNumber: "0",
    };
    // console.log("Sending create buyer transaction request:", requestData);
    if (!requestData.email || !requestData.paymentAmount || !requestData.paymentDescription) {
      toast({
        title: "Invalid input",
        description: "Please ensure all required fields are filled correctly.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      return;
    }
    
    axios
      .post(`/api/transactions/create-transaction`, requestData)
      .then(async (response) => {
        console.log("Create buyer transaction response:", response.data);
        const responseData = validateApiResponse(response.data, "/api/transactions/create-transaction");
        const transactionId = responseData.transactionId || "Unknown";
    try {



          const verifyResponse = await axios.get(`/api/transactions/${transactionId}`);
          console.log("Transaction verification response:", verifyResponse.data);
          const verifiedData = validateApiResponse(verifyResponse.data, `/api/transactions/${transactionId}`);
          if (!verifiedData._id) {
            throw new Error("Transaction not found after creation");
          }
        } catch (verifyError) {
          console.error("Error verifying transaction:", verifyError);
          toast({
            title: "Transaction created but not found",
            description: "The transaction was created but could not be retrieved. Please check the transaction list manually.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        }

      


        // if (role === "seller") {
        //   toast({
        //     title: "Successfully created a transaction",
        //     description: <Item id={transactionId} />,
        //     status: "success",
        //     duration: 50000,
        //     isClosable: true,

        //   });

        // } else {

          // }
            navigate(`/deal/${transactionId}`, {state: {...requestData}});






      })
      .catch((error) => {
        console.error("Transaction creation error:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          requestData,
        });
        const errorMessage = error.response?.data?.error || "Too much traffic at the moment. Please try again later.";
        toast({
          title: "Error creating transaction",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }).finally(() => {
        setIsLoading(false)
      })
  }

  


  return (

    <div className="flex flex-col w-full px-4">


      <div className=" space-y-4">

        <div className="flex gap-2 items-center">
          <button
            onClick={() => (step === 1 ? navigate(-1) : setStep(1))}
            className="text-lg"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold">
            {" "}
            {step === 1 ? "New Deal" : "Review Deal"}
          </h1>
        </div>

        <div className="flex gap-2 items-center">
          <p className="text-sm text-gray-400">STEP {step} OF 2</p>

          <div className="h-1 bg-gray-200 flex-1">
            <div
              className="h-1 bg-[#d59e2d] transition-all duration-300"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
        </div>
      </div>

      {/* Step Container */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex transition-transform duration-300 "
          style={{
            transform: `translateX(-${(step - 1) * 100}%)`,
          }}
        >
          {/* STEP 1 */}

          <div
            className={`w-full shrink-0  pt-6 transition-opacity duration-300 mb-3 px-1
               ${step === 1 ? "opacity-100" : "opacity-50"
              }
            `}
          >




            {/* Item */}
            <div className="">
              <label className="text-sm font-medium text-gray-400">
                What are you buying?
              </label>
              <input
                type="text"
                placeholder="iPhone 13 Pro"
                value={form.item}
                onChange={(e) => setForm({ ...form, item: e.target.value })}
                className="mt-1 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d59e2d] placeholder:text-xs placeholder:font-extralight"
              />
            </div>


            {/* Price */}
            <div className="">
              <label className="text-sm font-medium text-gray-400">
                Price (₦)
              </label>
              <input
                type="number"
                placeholder="50000"
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
                className="mt-1 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d59e2d] placeholder:text-xs placeholder:font-extralight"
              />
            </div>



            {/* Buyer */}
            {/* <div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Buyer's contact email
                </label>
                <input
                  type="email"
                  // placeholder="david@sylo.com"
                  value={userDetails.email.trim()}
                  onChange={(e) => setForm({ ...form, buyer: e.target.value })}
                  className="mt-1 w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d59e2d] placeholder:text-xs placeholder:font-extralight"
                />
              </div>

            </div> */}
          </div>

          {/* STEP 2 (placeholder) */}

          <div className={`w-full shrink-0 pt-6 space-y-6  ${step !== 2 ? "hidden" : ""}`}>
            {/* Wallet */}
            <div className="bg-[#e8f0fb] rounded-xl p-4 flex justify-between">
              <span className="text-sm text-[#1c3151]">Wallet Balance</span>
              <span className="font-semibold text-[#06427c]">
                {formatNaira(wallet?.balance || 0)}
              </span>
            </div>

            {/* Deal Summary */}

            <div
              className="p-4 rounded-xl w-full bg-[#0e1e38]"
              style={{
                // background: "linear-gradient(135deg, rgba(183, 137, 57, 0.1) 0%, rgba(138, 109, 47, 0.1) 100%)",
                // border: "1px solid rgba(183, 137, 57, 0.2)",
                // backdropFilter: "blur(8px)",
                // boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* <div className="bg-white rounded-2xl p-5 border shadow-sm"> */}
              <h3 className="font-semibold text-lg mb-4">Deal Summary</h3>

              {/* Core Info */}
              <div className="space-y-3 text-sm">
                <Row label={`${role == "seller" ? "Seller" : "Buyer"} contact email`} value={userDetails.email.trim()} />
                <Row label="Item" value={form.item} />
                <Row label="Amount" value={formatNaira(amount)} highlight />
              </div>


              <div className="space-y-2 text-sm">
                <Row label="Sylo Fee (1%)" value={formatNaira(fee)} />
                <Row label="Total Locked" value={formatNaira(total)} bold />
              </div>
            </div>

            {/* Balance after */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Balance after lock</span>
              <span className="font-semibold text-white">
                
                {role === "seller" ? formatNaira(wallet?.balance + total) : formatNaira(wallet?.balance - total)}
              </span>
            </div>

            {/* Escrow Info */}
           {role === "buyer" && <div className="bg-[#e8f0fb] rounded-2xl p-4">
              <h3 className="font-semibold text-[#06427c] mb-2">
                How you are protected. 
              </h3>

              <ul className="text-sm text-[#1c3151] space-y-2">
                <li>Your payment to the seller is locked here until the seller delivers the right item</li>
              </ul>
            </div>}

            {/* Note */}
            <p className="text-xs text-gray-400">
              Once sent, this deal cannot be edited.
            </p>
          </div>


        </div>
      </div>

      {/* Bottom CTA */}

      <div className="py-4 my-5">
        {step === 1 ? (
          <button
            onClick={handleNext}
            disabled={!isValid}
            className={`w-full py-3 border rounded-xl font-semibold transition ${isValid
                ? " text-white active:scale-[0.98]"
                : "bg-gray-600 text-gray-400"
              }`}
          >
            Review Deal →
          </button>
        ) : (
 
  <button
  onClick={handleCreateDeal}
  disabled={isLoading}
  className="w-full py-3 rounded-xl font-semibold border text-white active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
>
  {isLoading ? (
    <>
      <svg
        className="animate-spin h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12" cy="12" r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z"
        />
      </svg>
      {/* Creating... */}
    </>
  ) : (
    role === "buyer" ? "Fund this deal" : "Create deal"
  )}
</button>
        )}

         {role === "buyer" && <p className="text-xs text-gray-400 my-3 text-center">Lock your payment and wait for seller to join</p>}
      </div>
    </div>
  );
}



// eslint-disable-next-line react/prop-types
const Row = ({ label, value, highlight, bold, }) => (
  <div className="flex justify-between">
    <span className="text-gray-400">{label}</span>
    <span
      className={`
        ${highlight ? "text-[#d59e2d] font-semibold" : ""}
        ${bold ? "font-bold " : ""}
      `}
    >
      {value}
    </span>
  </div>
);

// const formatLabel = (key) =>
//   key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());


