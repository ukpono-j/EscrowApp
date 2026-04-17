

import { 
    // useEffect, useCallback, useMemo,
     useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { Dot, MessageCircleMore } from "lucide-react";
// import { useToast } from "@chakra-ui/react";


import { Box, Flex, Text, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Stack, useDisclosure, useColorModeValue, Card, Divider, IconButton, useToast } from '@chakra-ui/react';
import { useSelector } from "react-redux";
import { MdContentCopy } from "react-icons/md";




const FundingModal = ({ isOpen, onClose, transaction, walletBalance, confirmFunding, isLoading, fetchWalletBalance }) => {
    const bgColor = useColorModeValue('white', '#0d273d');
    const textColor = useColorModeValue('#051E2F', 'white');
    const subtleTextColor = useColorModeValue('gray.500', '#b3b6a7');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const [error, setError] = useState('');
     const toast = useToast();
     const { user, wallet, paymentDetails, loading, error: txnerror } = useSelector((state) => state.wallet);
    //   const navigate = useNavigate();



  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Text copied to clipboard.', status: 'success', duration: 3000, isClosable: true });
  };


  console.log({account: paymentDetails?.virtualAccount})

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "sm" }}>
            {/* <ModalOverlay /> */}
            <ModalContent bg={bgColor} color={textColor} p={4} rounded="lg" border="1px" borderColor={borderColor}>
                <ModalHeader fontSize="lg" fontWeight="600" color={"#ccc9a7"}>Fund Transaction</ModalHeader>
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
                            <div className="rounded-md border p-2">
                            <Text fontSize="sm" color="white">
                               Your wallet is insufficient. Fund and pay via virtual account.
                            </Text>
                            <Divider />
                             {/* <Text fontSize="sm" color="white">{paymentDetails?.bank}</Text> */}

                             <div>
                                 <ModalBody px={{ base: 4, sm: 6 }} py={4}>
                                          {paymentDetails?.authorization_url ? (
                                            <>
                                              <Text color={textColor} mb={4}>
                                                Click the button below to proceed with payment of ₦{walletBalance ? walletBalance?.toFixed(2) : '0.00'}:
                                              </Text>
                                              <Button
                                                as="a"
                                                href={paymentDetails.authorization_url}
                                                bg="#B38939"
                                                _hover={{ bg: "#BB954D" }}
                                                color="white"
                                                size={{ base: 'sm', sm: 'md' }}
                                                mb={4}
                                              >
                                                Pay Now
                                              </Button>
                                              <Text color={subtleTextColor} fontSize="sm">
                                                You will be redirected to Paystack to complete the payment.
                                              </Text>
                                            </>
                                          ) : paymentDetails?.virtualAccount ? (
                                            <>
                                              <Text color={textColor} mb={2}>
                                                {/* {paymentDetails?.reference && !paymentDetails?.paystackReference
                                                  ? `Your payment of ₦${amount ? amount.toFixed(2) : '0.00'} is still pending. Please complete the transfer to the virtual account:`
                                                  : `Transfer ₦${amount ? amount.toFixed(2) : '0.00'} to the account below:`} */}
                                              </Text>
                                              <Card  p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
                                                <Flex align="center" justify="space-between" mb={2}>
                                                  <Text fontWeight="bold" color={textColor}>Account Name: {paymentDetails.virtualAccount.account_name}</Text>
                                                  <IconButton
                                                    aria-label="Copy account name"
                                                    icon={<MdContentCopy />}
                                                    size="xs"
                                                    bg="transparent"
                                                    color={subtleTextColor}
                                                    onClick={() => copyToClipboard(paymentDetails.virtualAccount.account_name)}
                                                  />
                                                </Flex>
                                                <Flex align="center" justify="space-between" mb={2}>
                                                  <Text color={subtleTextColor}>Account Number: {paymentDetails.virtualAccount.account_number}</Text>
                                                  <IconButton
                                                    aria-label="Copy account number"
                                                    icon={<MdContentCopy />}
                                                    size="xs"
                                                    bg="transparent"
                                                    color={subtleTextColor}
                                                    onClick={() => copyToClipboard(paymentDetails.virtualAccount.account_number)}
                                                  />
                                                </Flex>
                                                <Flex align="center" justify="space-between">
                                                  <Text color={subtleTextColor}>Bank: {paymentDetails.virtualAccount.bank_name}</Text>
                                                  <IconButton
                                                    aria-label="Copy bank name"
                                                    icon={<MdContentCopy />}
                                                    size="xs"
                                                    bg="transparent"
                                                    color={subtleTextColor}
                                                    onClick={() => copyToClipboard(paymentDetails.virtualAccount.bank_name)}
                                                  />
                                                </Flex>
                                              </Card>
                                              {/* <Text color={subtleTextColor} mt={4} fontSize="sm">
                                                Your payment will be credited within 5 minutes after transfer. If delayed, click Refresh or contact support.
                                              </Text> */}
                                            </>
                                          ) : (
                                            <Box>
                                              <Text color={textColor} mb={4}>Unable to initiate funding. Try again or contact support.</Text>
                                              <Button
                                                bg="#B38939"
                                                _hover={{ bg: "#BB954D" }}
                                                color="white"
                                                onClick={() => {
                                                //   dispatch(clearPaymentDetails());
                                                  onClose();
                                                }}
                                                size={{ base: 'sm', sm: 'md' }}
                                              >
                                                Retry
                                              </Button>
                                            </Box>
                                          )}
                                        </ModalBody>
                             </div>

                            </div>
                        )}
                        {error && <Text fontSize="sm" color="red.400">{error}</Text>}
                        {txnerror && <Text fontSize="sm" color="red.400">{txnerror}</Text>}
                    </Stack>
                </ModalBody>
                <ModalFooter>
                    <Flex direction={"column"} gap={3} w="full">


                    <button
                     onClick={() => confirmFunding(transaction, setError)}
                            disabled={isLoading || walletBalance === null || walletBalance < transaction?.paymentAmount}
                     
                        className={`flex justify-center gap-1 border flex-1 p-2 rounded-xl w-full font-bold bg-[#d8b465] text-black ${isLoading || walletBalance === null || walletBalance < transaction?.paymentAmount ? "bg-opacity-50" : "" }`}
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
   "Fund Wallet & Pay"
  )}
                        
                    </button>

                    <button
                         disabled={isLoading}
                        onClick={onClose}
                        className="flex justify-center gap-1  flex-1 p-2 rounded-xl w-full text-[#d0cec0]"
                    >
                        Cancel
                    </button>


                        {/* <Button
                            // size="sm"
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
                        </Button> */}
                    </Flex>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};


export default FundingModal;