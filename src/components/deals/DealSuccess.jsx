/* eslint-disable react/prop-types */

import { useEffect, useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Dot, MessageCircleMore } from "lucide-react";
import { useToast } from "@chakra-ui/react";

import axios from "../../utils/axiosConfig";
import { formatNaira } from "../../utils";
import { useManagedToast } from "../../utils/toastManager";


import {
    fetchSingleTransaction,
    fundTransaction,
    cancelTransaction,
    confirmTransaction,
} from "../../store/slices/thunks";
import { setWallet } from '../../store/slices/walletSlice';

import { Box, Flex, Text, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Stack, useDisclosure, useColorModeValue } from '@chakra-ui/react';




const FundingModal = ({ isOpen, onClose, transaction, walletBalance, confirmFunding, isLoading, fetchWalletBalance }) => {
    const bgColor = useColorModeValue('white', '#0a1528');
    const textColor = useColorModeValue('#051E2F', 'white');
    const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const [error, setError] = useState('');
    //   const navigate = useNavigate();

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "sm" }}>
            <ModalOverlay />
            <ModalContent bg={bgColor} color={textColor} p={4} rounded="lg" border="1px" borderColor={borderColor}>
                <ModalHeader fontSize="lg" fontWeight="600">Fund Transaction</ModalHeader>
                <ModalBody>
                    <Stack spacing={3}>
                        <Box>
                            <Text fontSize="xs" color={subtleTextColor}>Transaction ID</Text>
                            <Text fontSize="sm" color={textColor}>{transaction?._id || 'N/A'}</Text>
                        </Box>
                        <Box>
                            <Text fontSize="xs" color={subtleTextColor}>Description</Text>
                            <Text fontSize="sm" color={textColor}>{transaction?.productDetails?.description || 'N/A'}</Text>
                        </Box>
                        <Box>
                            <Text fontSize="xs" color={subtleTextColor}>Amount Required</Text>
                            <Text fontSize="sm" color={textColor}>
                                ₦{(transaction?.paymentAmount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </Text>
                        </Box>
                        <Box>
                            <Text fontSize="xs" color={subtleTextColor}>Wallet Balance</Text>
                            <Text fontSize="sm" color={textColor}>
                                {walletBalance !== null
                                    ? `₦${(walletBalance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
                                    : 'Unable to fetch balance. Please try again.'}
                            </Text>
                            {walletBalance === null && (
                                <Button
                                    size="sm"
                                    bg="#BB954D"
                                    color="white"
                                    _hover={{ bg: "#967532" }}
                                    onClick={fetchWalletBalance}
                                    mt={2}
                                >
                                    Retry Fetching Balance
                                </Button>
                            )}
                        </Box>
                        {walletBalance !== null && walletBalance < transaction?.paymentAmount && (
                            <Text fontSize="sm" color="red.400">
                                Your wallet balance is insufficient to fund this transaction. Please top up your wallet in the Profile section.
                            </Text>
                        )}
                        {error && <Text fontSize="sm" color="red.400">{error}</Text>}
                    </Stack>
                </ModalBody>
                <ModalFooter>
                    <Flex gap={3} w="full">
                        <Button
                            size="sm"
                            bg={useColorModeValue('gray.200', 'gray.600')}
                            color={textColor}
                            _hover={{ bg: useColorModeValue('gray.300', 'gray.700') }}
                            onClick={onClose}
                            isDisabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            bg="#BB954D"
                            color="white"
                            _hover={{ bg: "#967532" }}
                            onClick={() => confirmFunding(transaction, setError)}
                            isLoading={isLoading}
                            isDisabled={isLoading || walletBalance === null || walletBalance < transaction?.paymentAmount}
                        >
                            Fund Transaction
                        </Button>
                    </Flex>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};


export default function DealSuccess() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const toast = useToast();
    const managedToast = useManagedToast();

    const [isLoading, setIsLoading] = useState(false);

    const { transactions } = useSelector((state) => state.transactions);
    const { wallet } = useSelector((state) => state.wallet);
    //   const { userDetails } = useSelector((state) => state.user);


    const {
        isOpen: isFundingModalOpen,
        onOpen: openFundingModal,
        onClose: closeFundingModal,
    } = useDisclosure();

    const [currentTransaction, setCurrentTransaction] = useState(null);

    const role = sessionStorage.getItem("user_role");

    // Get transaction safely from Redux
    const transaction = useMemo(() => {
        return transactions?.find((t) => t._id === id);
    }, [transactions, id]);

    // Fetch if not 
    useEffect(() => {
        if (!transaction && id) {
            dispatch(fetchSingleTransaction(id));
        }
    }, [dispatch, id, transaction]);

    // Chat handler
    const handleChat = useCallback(async () => {
        try {
            const res = await axios.post(
                `/api/transactions/create-chatroom`,
                { transactionId: id },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("access-token")}`,
                    },
                }
            );

            if (res.data?.success && res.data.chatroomId) {
                navigate(`/chat/${res.data.chatroomId}`);
            } else {
                throw new Error("Failed to create chatroom");
            }
        } catch (error) {
            managedToast({
                id: `chat-error-${id}`,
                title: "Error",
                description: error.response?.data?.error || error.message,
                status: "error",
            });
        }
    }, [id, navigate, managedToast]);

    // Copy ID
    const copyContent = async () => {
        try {
            await navigator.clipboard.writeText(id);
            toast({ title: "Copied!", status: "success", duration: 2000 });
        } catch (err) {
            console.error(err);
        }
    };




    const fetchWalletBalance = useCallback(async () => {
        const maxAttempts = 5;
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {

                const response = await axios.get(`/api/wallet/balance`);
                if (response.data.success) {
                    const balance = response.data.data.wallet.balance || 0;
                    // setWalletBalance(balance);
                    dispatch(setWallet({
                        ...wallet,
                        balance,
                        totalDeposits: response.data.data.wallet.totalDeposits || 0,
                        transactions: response.data.data.wallet.transactions || [],
                    }));
                    return;
                } else {
                    throw new Error(response.data.error || 'Failed to fetch wallet balance');
                }
            } catch (err) {
                attempts++;
                console.error(`Wallet balance fetch attempt ${attempts} failed:`, err);
                if (attempts >= maxAttempts) {
                    managedToast({
                        id: `wallet-fetch-error`,
                        title: 'Error',
                        description: 'Unable to fetch wallet balance. Please check your connection or try again later.',
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                    });
                    // setWalletBalance(wallet?.balance || 0);
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
                }
            }
        }
    }, [dispatch, managedToast, wallet]);



    const handleFund = useCallback(async () => {
        if (!transaction) return;
        await fetchWalletBalance();
        setCurrentTransaction(transaction);
        openFundingModal();
    }, [transaction, fetchWalletBalance, openFundingModal]);

    const confirmFunding = useCallback(
        async (transaction, setError) => {
            if (!transaction || !transaction.paymentAmount) {
                managedToast({
                    title: "Invalid transaction",
                    status: "error",
                });
                closeFundingModal();
                return;
            }

            setIsLoading(true);

            try {
                const amount = parseFloat(transaction.paymentAmount);
                if (isNaN(amount)) throw new Error("Invalid amount");

                await dispatch(
                    fundTransaction({ transactionId: transaction._id, amount })
                ).unwrap();

                managedToast({
                    title: "Funded successfully",
                    status: "success",
                });

                closeFundingModal();

                // refresh transaction
                dispatch(fetchSingleTransaction(transaction._id));
            } catch (error) {
                if (error.message?.includes("Insufficient")) {
                    setError("Insufficient wallet balance.");
                } else {
                    managedToast({
                        title: "Funding failed",
                        description: error.message,
                        status: "error",
                    });
                }
            } finally {
                setIsLoading(false);
            }
        },
        [dispatch, managedToast, closeFundingModal]
    );


    // CONFIRM TRANSACTION
    const handleConfirm = useCallback(async () => {
        try {
            setIsLoading(true);

            const res = await dispatch(confirmTransaction(id)).unwrap();

            managedToast({
                title:
                    res.transaction.status === "completed"
                        ? "Transaction Completed"
                        : "Confirmation sent",
                status: "success",
            });

            dispatch(fetchSingleTransaction(id));
        } catch (err) {
            managedToast({
                title: "Error",
                description: err.message || "Failed",
                status: "error",
            });
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, id, managedToast]);

    // CANCEL TRANSACTION
    const handleCancel = useCallback(async () => {
        try {
            setIsLoading(true);

            const res = await dispatch(cancelTransaction(id)).unwrap();

            managedToast({
                title: "Cancelled",
                description: res.message,
                status: "success",
            });

            navigate("/transactions");
        } catch (err) {
            managedToast({
                title: "Cancel failed",
                description: err.message,
                status: "error",
            });
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, id, managedToast, navigate]);

    if (!transaction) {
        return <p className="text-white p-4">Loading transaction...</p>;
    }

    const { email, paymentAmount, productDetails, locked, status } = transaction;


    return (
        <div className="text-center text-white/80  ">

            <div className="flex justify-between py-6 border-b px-4 bg-[#0f1e39]">
                <div className="border px-3 py-2 rounded-2xl text-[#B38939] bg-[#B38939] bg-opacity-20 " > <p className="text-base text-start ">{role === "buyer" ? "YOU'RE BUYING" : "YOU'RE SELLING"}</p></div>

                <button
                    onClick={handleChat}
                    className="bg-[#1f3054] flex self-start rounded p-2" > <MessageCircleMore className="text-[#1f3054] fill-white " /></button>
            </div>

            <div className="p-4 ">

                <p className="text-base text-start ">{productDetails?.description}</p>
                <h2 className="font-semibold text-2xl text-white text-start ">{formatNaira(paymentAmount)}</h2>




                {/* STATUS */}
                {locked ? (
                    <div className="border px-3 py-2 my-3 rounded-2xl text-green-600 bg-[#0b272b] flex items-center" ><Dot size={36} /><p className="text-base ">
                        Deal funded . waiting for seller
                    </p></div>
                ) : (
                    <div className="border px-3 py-2 my-3 rounded-2xl text-[#B38939] bg-[#B38939] bg-opacity-20 flex items-center" ><Dot size={36} /><p className="text-base ">
                        Fund deal to invite seller
                    </p></div>

                )}




                <h2 className="font-semibold text-xl text-white">Send this ID to a {role === "buyer" ? "seller" : "buyer"}</h2>
                <p className="text-base text-center my-2">After you fund, share this ID so the seller can join the deal</p>

                <div className=" flex flex-wrap items-center justify-between p-2 rounded-xl w-full bg-gray-500 bg-opacity-20">
                    <div className="flex-1" >  <h4 className="truncate text-white/70 text-start">{id}</h4></div>
                    <button onClick={copyContent} className=" p-2 rounded-xl active:scale-[0.98] transition text-white border">Copy</button>
                </div>
                {/* Note */}
                <p className="text-base my-2">Send via WhatApp, SMS, or any messaging app </p>

                <h2 className="font-semibold text-lg text-white/80 mt-12">{role === "buyer" ? "Buyer's email" : "Seller's email"}: {email}</h2>

                <div className="space-y-3 my-4">



                    {role === "buyer" && !locked && (
                        <button
                            onClick={handleFund}
                            disabled={isLoading}
                            className="flex justify-center gap-1 border flex-1 p-2 rounded-xl w-full text-white"
                        >
                            Fund this deal
                        </button>
                    )}



                    {locked && status !== "completed" && (
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className="flex justify-center gap-1 border flex-1 p-2 rounded-xl w-full text-white"
                        >
                            Approve payment
                        </button>
                    )}


                    <button
                        onClick={() => navigate("/transactions/tab")}
                        disabled={isLoading}

                        className="flex justify-center gap-1 border flex-1 p-2 rounded-xl w-full text-white"
                    >
                        View your item
                    </button>

                    <button
                        onClick={handleCancel}
                        disabled={isLoading}

                        className="flex justify-center gap-1 border flex-1 p-2 rounded-xl w-full text-red-400"
                    >
                        Cancel
                    </button>


                </div>
            </div>


            {isFundingModalOpen && currentTransaction && (
                <FundingModal
                    isOpen={isFundingModalOpen}
                    onClose={() => {
                        closeFundingModal();
                        setCurrentTransaction(null);
                    }}
                    transaction={currentTransaction}
                    walletBalance={wallet?.balance || 0}
                    confirmFunding={confirmFunding}
                    isLoading={isLoading}
                    fetchWalletBalance={fetchWalletBalance}
                />
            )}



        </div>
    )


}

