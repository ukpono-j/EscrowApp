// import React, { useEffect, useRef, useState, useCallback } from "react";
// import { FaShoppingCart, FaStore } from "react-icons/fa";
// import { MdClose } from "react-icons/md";
// import { useNavigate } from "react-router-dom";
// import axios from "../../utils/axiosConfig";
import {
  // useToast,
  // Text,
  // Flex,
  // Avatar,
  // Progress,
  // Button,
  // FormControl,
  // FormLabel,
  // Input,
  // Textarea,
  // Stack,
  // Heading,
  // HStack,
  // Divider,
  // useColorMode,
  // Spinner,
  // Center,
  Box,
  VStack,
  useColorModeValue,
  Fade,
} from "@chakra-ui/react";
import CreateDeal from "../deals/CreateDeal";
// import defaultProfileImage from "../../assets/profile_icon.png";
// import CreateDeal from "../deals_component/CreateDeal";

// const BASE_URL = import.meta.env.VITE_BASE_URL;

// const validateUserResponse = (responseData) => {
//   if (responseData.success && responseData.data?.user) {
//     return responseData.data.user;
//   }
//   console.error("Invalid user data structure:", responseData);
//   throw new Error(responseData.error || "Invalid user data received");
// };

// const validateApiResponse = (responseData, endpoint) => {
//   if (responseData.success) {
//     return responseData.data || {};
//   }
//   console.error(`Invalid response from ${endpoint}:`, responseData);
//   throw new Error(responseData.error || "Invalid response received");
// };

// const AcceptTransactionModal = ({
//   isOpen,
//   onClose,
//   userDetails,
//   paymentAmount,
//   selectedUserType,
//   textColor,
//   accentColor,
//   accentHoverColor,
//   bgSecondary,
//   cardBorder,
//   shadowColor,
//   modalHeaderBg,
//   modalHeaderBorder,
//   modalButtonHoverBg,
//   createNewTransaction,
//   createNewTransactionForBuyer,
//   isCreating, // New prop for loading state
// }) => {
//   const formatCurrency = (amount) =>
//     parseFloat(amount || 0).toLocaleString("en-NG", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });

//   return (
//     <Box
//       position="fixed"
//       top={0}
//       left={0}
//       right={0}
//       bottom={0}
//       bg="rgba(0, 0, 0, 0.7)"
//       zIndex={999}
//       display={isOpen ? "flex" : "none"}
//       alignItems="center"
//       justifyContent="center"
//       p={4}
//     >
//       <Box
//         bg={bgSecondary}
//         borderRadius="xl"
//         maxW="400px"
//         w="full"
//         overflow="hidden"
//         boxShadow="0px 10px 30px rgba(0, 0, 0, 0.3)"
//         border={cardBorder}
//       >
//         <Box
//           p={4}
//           bg={modalHeaderBg}
//           borderBottomWidth="1px"
//           borderColor={modalHeaderBorder}
//         >
//           <Flex justify="space-between" align="center">
//             <Heading size="md" color={textColor}>
//               Create Escrow Transaction
//             </Heading>
//             <Button
//               variant="ghost"
//               p={1}
//               onClick={onClose}
//               color={textColor}
//               _hover={{ bg: modalButtonHoverBg }}
//             >
//               <MdClose size={24} />
//             </Button>
//           </Flex>
//         </Box>
//         <Box p={5}>
//           <Flex align="center" mb={4}>
//             <Avatar
//               src={
//                 userDetails.avatarImage
//                   ? `${BASE_URL}/api/avatar/${userDetails.avatarImage}`
//                   : defaultProfileImage
//               }
//               size="md"
//               bg={accentColor}
//               boxShadow={`0px 2px 8px ${shadowColor}`}
//             />
//             <Box ml={3}>
//               <Text fontWeight="bold" color={textColor}>
//                 {userDetails.fullName || "Transaction"}
//               </Text>
//               <Text fontSize="sm" color={accentColor}>
//                 {formatCurrency(paymentAmount)} NGN
//               </Text>
//             </Box>
//           </Flex>
//           <VStack spacing={4}>
//             <Text color={textColor}>
//               You are about to create a transaction as a {selectedUserType}.
//             </Text>
//             <Button
//               onClick={
//                 selectedUserType === "buyer"
//                   ? createNewTransactionForBuyer
//                   : createNewTransaction
//               }
//               bg={accentColor}
//               color="white"
//               _hover={{ bg: isCreating ? accentColor : accentHoverColor }}
//               borderRadius="full"
//               size="lg"
//               w="full"
//               isLoading={isCreating} // Add loading state
//               isDisabled={isCreating} // Disable button during loading
//             >
//               Confirm Transaction
//             </Button>
//             <Button
//               onClick={onClose}
//               variant="outline"
//               borderColor={accentColor}
//               color={textColor}
//               borderRadius="full"
//               size="lg"
//               w="full"
//               isDisabled={isCreating} // Disable Cancel button during loading
//             >
//               Cancel
//             </Button>
//           </VStack>
//         </Box>
//       </Box>
//     </Box>
//   );
// };

const TransactionCreation = () => {
  // console.log("TransactionCreation: Component rendering");

  // const [paymentAmount, setPaymentAmount] = useState("");
  // const [displayAmount, setDisplayAmount] = useState("");
  // console.log("State: paymentAmount =", paymentAmount, "displayAmount =", displayAmount);

  // const { colorMode } = useColorMode();
  // const bgMain = useColorModeValue("white", "#0F1624");
  // const bgSecondary = useColorModeValue("#F7FAFC", "#1E293B");
  // const bgTertiary = useColorModeValue("#EDF2F7", "#2D3748");
  const textColor = useColorModeValue("gray.800", "white");
  // const borderColor = useColorModeValue("#957432", "#957432");
  // const accentColor = "#957432";
  // const accentHoverColor = "#A88D50";
  // const shadowColor = useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0.3)");
  // const inputBg = useColorModeValue("white", "#0F1624");
  // const cardBorder = useColorModeValue("1px solid #E2E8F0", "none");
  // const modalHeaderBg = useColorModeValue("gray.50", "#0F1624");
  // const modalHeaderBorder = useColorModeValue("gray.200", "gray.700");
  // const modalButtonHoverBg = useColorModeValue("gray.100", "gray.700");
  // const disabledButtonHoverBg = useColorModeValue("gray.300", "#2D3748");
  // const nextButtonHoverBg = useColorModeValue("gray.100", "rgba(149, 116, 50, 0.2)");
  // console.log("Theme: colorMode =", colorMode);

  // const toast = useToast();
  // const navigate = useNavigate();

  // const [step, setStep] = useState(1);
  // const [nextButtonActive, setNextButtonActive] = useState(false);
  // const [paymentDescription, setPaymentDescription] = useState("");
  // const [email, setEmail] = useState("");
  // const [selectedUserType, setSelectedUserType] = useState("");
  // const [acceptTransactionModel, setAcceptTransactionModel] = useState(false);
  // const [userDetails, setUserDetails] = useState({});
  // const [formValid, setFormValid] = useState(false);
  // const [isLoading, setIsLoading] = useState(true);
  // const [errorMessage, setErrorMessage] = useState("");
  // const [isCreating, setIsCreating] = useState(false); // New state for transaction creation

  // console.log("State: isLoading =", isLoading, "userDetails =", userDetails);

  // const userDetailsFetched = useRef(false);

  // const formatCurrency = (amount) => {
  //   return parseFloat(amount || 0).toLocaleString("en-NG", {
  //     minimumFractionDigits: 2,
  //     maximumFractionDigits: 2,
  //   });
  // };

  // const handleAmountChange = useCallback((e) => {
  //   const input = e.target.value.replace(/,/g, "");
  //   if (input === "" || /^\d*\.?\d{0,2}$/.test(input)) {
  //     setPaymentAmount(input);
  //     setDisplayAmount(
  //       input
  //         ? parseFloat(input).toLocaleString("en-NG", {
  //           minimumFractionDigits: 0,
  //           maximumFractionDigits: 2,
  //         })
  //         : ""
  //     );
  //   }
  // }, [setPaymentAmount, setDisplayAmount]);

  // const acceptTransactionFunction = useCallback(
  //   (e) => {
  //     e.preventDefault();
  //     if (!formValid) {
  //       toast({
  //         title: "Please fill all required fields",
  //         status: "error",
  //         duration: 3000,
  //         isClosable: true,
  //       });
  //       return;
  //     }
  //     setAcceptTransactionModel(true);
  //   },
  //   [formValid, toast, setAcceptTransactionModel]
  // );

  // const createNewTransaction = useCallback(
  //   (e) => {
  //     e.preventDefault();
  //     if (!formValid || isCreating) {
  //       toast({
  //         title: "Please fill all required fields",
  //         status: "error",
  //         duration: 3000,
  //         isClosable: true,
  //       });
  //       return;
  //     }
  //     setIsCreating(true);
  //     const requestData = {
  //       paymentName: userDetails.fullName || "User",
  //       email: email || userDetails.email || "",
  //       paymentAmount: parseFloat(paymentAmount),
  //       paymentDescription,
  //       selectedUserType,
  //       paymentBank: "Pending",
  //       paymentBankCode: "000",
  //       paymentAccountNumber: "0",
  //     };
  //     // console.log("Sending create transaction request:", requestData);
  //     if (!requestData.email || !requestData.paymentAmount || !requestData.paymentDescription || !requestData.selectedUserType) {
  //       toast({
  //         title: "Invalid input",
  //         description: "Please ensure all required fields are filled correctly.",
  //         status: "error",
  //         duration: 5000,
  //         isClosable: true,
  //       });
  //       setIsCreating(false);
  //       return;
  //     }
  //     axios
  //       .post(`${BASE_URL}/api/transactions/create-transaction`, requestData)
  //       .then(async (response) => {
  //         console.log("Create transaction response:", response.data);
  //         const responseData = validateApiResponse(response.data, "/api/transactions/create-transaction");
  //         const transactionId = responseData.transactionId || "Unknown";

  //         try {
  //           const verifyResponse = await axios.get(`${BASE_URL}/api/transactions/${transactionId}`);
  //           console.log("Transaction verification response:", verifyResponse.data);
  //           const verifiedData = validateApiResponse(verifyResponse.data, `/api/transactions/${transactionId}`);
  //           if (!verifiedData._id) {
  //             throw new Error("Transaction not found after creation");
  //           }
  //         } catch (verifyError) {
  //           console.error("Error verifying transaction:", verifyError);
  //           toast({
  //             title: "Transaction created but not found",
  //             description: "The transaction was created but could not be retrieved. Please check the transaction list manually.",
  //             status: "warning",
  //             duration: 5000,
  //             isClosable: true,
  //           });
  //         }

  //         toast({
  //           title: "Successfully created a transaction",
  //           description: `Transaction ID: ${transactionId}`,
  //           status: "success",
  //           duration: 3000,
  //           isClosable: true,
  //         });
  //         navigate("/transactions/tab");
  //       })
  //       .catch((error) => {
  //         console.error("Transaction creation error:", {
  //           message: error.message,
  //           response: error.response?.data,
  //           status: error.response?.status,
  //           requestData,
  //         });
  //         const errorMessage = error.response?.data?.error || "Too much traffic at the moment. Please try again later.";
  //         toast({
  //           title: "Error creating transaction",
  //           description: errorMessage,
  //           status: "error",
  //           duration: 5000,
  //           isClosable: true,
  //         });
  //       })
  //       .finally(() => {
  //         setIsCreating(false);
  //         setAcceptTransactionModel(false);
  //       });
  //   },
  //   [
  //     formValid,
  //     isCreating,
  //     userDetails.fullName,
  //     userDetails.email,
  //     email,
  //     paymentAmount,
  //     paymentDescription,
  //     selectedUserType,
  //     navigate,
  //     toast,
  //     setIsCreating,
  //     setAcceptTransactionModel,
  //     validateApiResponse,
  //   ]
  // );

  // const createNewTransactionForBuyer = useCallback(
  //   (e) => {
  //     if (e) e.preventDefault();
  //     if (isCreating) {
  //       toast({
  //         title: "Transaction in progress",
  //         description: "Please wait while the transaction is being created.",
  //         status: "warning",
  //         duration: 3000,
  //         isClosable: true,
  //       });
  //       return;
  //     }
  //     setIsCreating(true);
  //     const requestData = {
  //       paymentName: userDetails.fullName || "Buyer",
  //       email: userDetails.email || email || "",
  //       paymentAmount: parseFloat(paymentAmount),
  //       paymentDescription,
  //       selectedUserType: "buyer",
  //       paymentBank: "Pending",
  //       paymentBankCode: "000",
  //       paymentAccountNumber: "0",
  //     };
  //     console.log("Sending create buyer transaction request:", requestData);
  //     if (!requestData.email || !requestData.paymentAmount || !requestData.paymentDescription) {
  //       toast({
  //         title: "Invalid input",
  //         description: "Please ensure all required fields are filled correctly.",
  //         status: "error",
  //         duration: 5000,
  //         isClosable: true,
  //       });
  //       setIsCreating(false);
  //       return;
  //     }
  //     axios
  //       .post(`${BASE_URL}/api/transactions/create-transaction`, requestData)
  //       .then(async (response) => {
  //         console.log("Create buyer transaction response:", response.data);
  //         const responseData = validateApiResponse(response.data, "/api/transactions/create-transaction");
  //         const transactionId = responseData.transactionId || "Unknown";

  //         try {
  //           const verifyResponse = await axios.get(`${BASE_URL}/api/transactions/${transactionId}`);
  //           console.log("Transaction verification response:", verifyResponse.data);
  //           const verifiedData = validateApiResponse(verifyResponse.data, `/api/transactions/${transactionId}`);
  //           if (!verifiedData._id) {
  //             throw new Error("Transaction not found after creation");
  //           }
  //         } catch (verifyError) {
  //           console.error("Error verifying transaction:", verifyError);
  //           toast({
  //             title: "Transaction created but not found",
  //             description: "The transaction was created but could not be retrieved. Please check the transaction list manually.",
  //             status: "warning",
  //             duration: 5000,
  //             isClosable: true,
  //           });
  //         }

  //         toast({
  //           title: "Successfully created a transaction",
  //           description: `Your transaction ID: ${transactionId}. Share this with the seller.`,
  //           status: "success",
  //           duration: 5000,
  //           isClosable: true,
  //         });
  //         navigate("/transactions/tab");
  //       })
  //       .catch((error) => {
  //         console.error("Transaction creation error:", {
  //           message: error.message,
  //           response: error.response?.data,
  //           status: error.response?.status,
  //           requestData,
  //         });
  //         const errorMessage = error.response?.data?.error || "Too much traffic at the moment. Please try again later.";
  //         toast({
  //           title: "Error creating transaction",
  //           description: errorMessage,
  //           status: "error",
  //           duration: 5000,
  //           isClosable: true,
  //         });
  //       })
  //       .finally(() => {
  //         setIsCreating(false);
  //         setAcceptTransactionModel(false);
  //       });
  //   },
  //   [
  //     isCreating,
  //     userDetails.fullName,
  //     userDetails.email,
  //     email,
  //     paymentAmount,
  //     paymentDescription,
  //     navigate,
  //     toast,
  //     setIsCreating,
  //     setAcceptTransactionModel,
  //     validateApiResponse,
  //   ]
  // );

  // const handleRadioClick = useCallback((userType) => {
  //   setSelectedUserType(userType);
  //   setNextButtonActive(true);
  // }, []);

  // const handleNextClick = useCallback(() => {
  //   if (step === 1 && selectedUserType) {
  //     setStep(2);
  //     setNextButtonActive(false);
  //   }
  // }, [step, selectedUserType]);

  // const handlePreviousClick = useCallback(() => {
  //   if (step > 1) {
  //     setStep(step - 1);
  //     setNextButtonActive(false);
  //   }
  // }, [step]);

  // useEffect(() => {
  //   console.log("useEffect: Fetching user details");
  //   if (userDetailsFetched.current) {
  //     console.log("User details already fetched, skipping");
  //     return;
  //   }
  //   const fetchUserDetails = async () => {
  //     setIsLoading(true);
  //     console.log("Fetching user details, isLoading set to true");
  //     const timeout = setTimeout(() => {
  //       toast({
  //         title: "Taking too long?",
  //         description: "Please check your network connection.",
  //         status: "warning",
  //         duration: 5000,
  //         isClosable: true,
  //       });
  //     }, 10000);
  //     const token = localStorage.getItem("access-token");
  //     if (!token) {
  //       console.warn("No auth token found, redirecting to login");
  //       toast({
  //         title: "Authentication Error",
  //         description: "Please log in to continue",
  //         status: "error",
  //         duration: 3000,
  //         isClosable: true,
  //       });
  //       navigate("/");
  //       setIsLoading(false);
  //       clearTimeout(timeout);
  //       return;
  //     }
  //     try {
  //       console.log("Making request to /api/users/user-details");
  //       const response = await axios.get(`${BASE_URL}/api/users/user-details`, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       console.log("User details response:", response.data);
  //       const user = validateUserResponse(response.data);
  //       if (!user.email) {
  //         console.warn("No email in user details:", user);
  //       }
  //       setUserDetails(user);
  //       setEmail(user.email || "");
  //       userDetailsFetched.current = true;
  //     } catch (error) {
  //       console.error("Error fetching user details:", {
  //         message: error.message,
  //         response: error.response?.data,
  //         status: error.response?.status,
  //       });
  //       setErrorMessage(
  //         error.response?.data?.error || error.message || "Unable to fetch user details"
  //       );
  //       // toast({
  //       //   title: "Error fetching user details",
  //       //   description:
  //       //     error.response?.data?.error || error.message || "Unable to fetch user details",
  //       //   status: "error",
  //       //   duration: 3000,
  //       //   isClosable: true,
  //       // });
  //       if (error.response?.status === 401 || error.response?.status === 404) {
  //         console.log("Unauthorized or not found, redirecting to login");
  //         localStorage.removeItem("access-token");
  //         navigate("/");
  //       }
  //     } finally {
  //       console.log("Finished fetching user details, setting isLoading to false");
  //       setIsLoading(false);
  //       clearTimeout(timeout);
  //     }
  //   };
  //   fetchUserDetails();
  // }, [toast, navigate]);

  // useEffect(() => {
  //   console.log("Validating form");
  //   setFormValid(
  //     email.trim() !== "" &&
  //     paymentAmount.trim() !== "" &&
  //     paymentDescription.trim() !== ""
  //   );
  // }, [email, paymentAmount, paymentDescription]);

  // console.log("Rendering component, isLoading =", isLoading, "errorMessage =", errorMessage);
  return (
    <Box
      minH="100vh"
      className="px-1 pt-32 pb-20"
      w="full"
      color={textColor}
      transition="background 0.3s ease, color 0.3s ease"
    >
     
        <Fade in={true}>
          {/* <VStack spacing={8} maxW="900px" mx="auto"> */}
            <VStack spacing={8} maxW="900px" mx="auto" w="full" alignItems="stretch">

            <CreateDeal />
           
          </VStack>
        </Fade>
  
    </Box>
  );
};

export default TransactionCreation;