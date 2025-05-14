import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Text,
  VStack,
  useToast,
  useColorMode,
  useColorModeValue,
  Flex,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const MainJoinTransaction = () => {
  const [transactionId, setTransactionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDetails, setEditDetails] = useState({ description: "", price: "" });
  const [editErrors, setEditErrors] = useState({});
  const navigate = useNavigate();
  const toast = useToast();
  const { colorMode } = useColorMode();

  // Dynamic colors based on color mode
  const boxBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.800", "white");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("#A27D35", "#A27D35");
  const buttonBg = useColorModeValue("#AD8537", "#A27D35");
  const buttonHoverBg = useColorModeValue("#AD8537", "#AD8537");
  const inputBg = useColorModeValue("white", "gray.700");
  const shadowColor = useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0.3)");

  useEffect(() => {
    if (responseMessage) {
      const timeoutId = setTimeout(() => {
        setResponseMessage("");
        setMessageType("");
      }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [responseMessage]);

  useEffect(() => {
    const checkWallet = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        const response = await axios.get(`${BASE_URL}/api/users/user-details`, {
          headers: { "auth-token": token },
        });
        if (!response.data.walletId) {
          toast({
            title: "Wallet not found",
            description: "Please contact support to set up your wallet.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error("Error checking wallet:", error);
      }
    };
    checkWallet();
  }, [toast]);

  const fetchTransactionDetails = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth-token");

      if (!token) {
        setResponseMessage("You must be logged in to join a transaction");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/transactions/${transactionId}`, {
        headers: { "auth-token": token },
      });

      setTransactionDetails(response.data);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      if (error.response) {
        setResponseMessage(error.response.data.message || "Error fetching transaction details");
      } else {
        setResponseMessage("Network error. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth-token");
      const response = await axios.post(
        `${BASE_URL}/api/transactions/join-transaction`,
        { transactionId },
        { headers: { "auth-token": token } }
      );

      setResponseMessage(`Successfully joined as ${response.data.role}. Redirecting...`);
      setMessageType("success");
      setShowPreviewModal(false);

      setTimeout(() => {
        navigate("/transactions/tab");
      }, 2000);
    } catch (error) {
      console.error("Error joining transaction:", error);
      if (error.response) {
        setResponseMessage(error.response.data.message || "Error joining transaction");
      } else {
        setResponseMessage("Network error. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAndChange = async () => {
    const newErrors = {};
    if (!editDetails.description) newErrors.description = "Description is required";
    if (!editDetails.price || editDetails.price <= 0) newErrors.price = "Price must be a positive number";
    if (Object.keys(newErrors).length) {
      setEditErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth-token");
      const response = await axios.post(
        `${BASE_URL}/api/transactions/accept-and-update`,
        {
          transactionId,
          description: editDetails.description,
          price: editDetails.price,
        },
        { headers: { "auth-token": token } }
      );

      setResponseMessage(`Successfully joined as ${response.data.role}. Redirecting...`);
      setMessageType("success");
      setShowPreviewModal(false);
      setShowEditModal(false);

      setTimeout(() => {
        navigate("/transactions/tab");
      }, 2000);
    } catch (error) {
      console.error("Error accepting and updating transaction:", error);
      if (error.response) {
        setResponseMessage(error.response.data.message || "Error updating transaction");
      } else {
        setResponseMessage("Network error. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth-token");
      await axios.post(
        `${BASE_URL}/api/transactions/reject-transaction`,
        { transactionId },
        { headers: { "auth-token": token } }
      );

      setResponseMessage("Transaction rejected.");
      setMessageType("info");
      setShowPreviewModal(false);
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      if (error.response) {
        setResponseMessage(error.response.data.message || "Error rejecting transaction");
      } else {
        setResponseMessage("Network error. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex 
      minHeight="100vh" 
      width="100%" 
      align="center" 
      justify="center"
      p={4}
    >
      <Box
        w="100%"
        mt={20}
        maxW="450px"
        bg={boxBg}
        boxShadow={`0 4px 20px ${shadowColor}`}
        borderRadius="lg"
        overflow="hidden"
        borderTop="4px solid"
        borderColor={borderColor}
      >
        <Box p={8}>
          <Stack spacing={6}>
            <Heading 
              as="h1"
              fontSize="2xl"
              textAlign="center"
              color={headingColor}
              fontWeight="bold"
            >
              Join Transaction
            </Heading>
            
            <Text textAlign="center" color={textColor}>
              Please enter the Transaction ID you received from the person you are transacting with.
            </Text>
            
            <form onSubmit={fetchTransactionDetails}>
              <Stack spacing={6}>
                <FormControl isRequired>
                  <FormLabel htmlFor="transactionId" fontSize="sm" color={textColor}>
                    Transaction ID
                  </FormLabel>
                  <Input
                    id="transactionId"
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID"
                    size="lg"
                    bg={inputBg}
                    borderColor={useColorModeValue("gray.300", "gray.600")}
                    _hover={{ borderColor: borderColor }}
                    _focus={{ 
                      borderColor: borderColor, 
                      boxShadow: `0 0 0 1px ${borderColor}` 
                    }}
                  />
                </FormControl>

                {responseMessage && (
                  <Alert 
                    status={messageType} 
                    variant="subtle"
                    borderRadius="md"
                  >
                    <AlertIcon />
                    <AlertTitle fontSize="sm">{responseMessage}</AlertTitle>
                  </Alert>
                )}

                <Button
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Processing..."
                  bg={buttonBg}
                  color="white"
                  _hover={{ bg: buttonHoverBg }}
                  width="full"
                  size="lg"
                  borderRadius="md"
                  fontWeight="medium"
                  mt={2}
                >
                  Join Transaction
                </Button>
              </Stack>
            </form>
          </Stack>
        </Box>
      </Box>

      {/* Preview Modal */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} isCentered size="md">
        <ModalOverlay />
        <ModalContent bg={boxBg} color={textColor}>
          <ModalHeader>
            <Text fontSize="lg" fontWeight="bold" color={headingColor}>Transaction Preview</Text>
          </ModalHeader>
          <ModalBody>
            {transactionDetails && (
              <VStack spacing={4} align="start">
                <Box>
                  <Text fontSize="sm" fontWeight="bold">Creator:</Text>
                  <Text>{`${transactionDetails.userId.firstName} ${transactionDetails.userId.lastName || ""}`}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="bold">Description:</Text>
                  <Text>{transactionDetails.productDetails.description || "N/A"}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="bold">Price:</Text>
                  <Text>₦{parseFloat(transactionDetails.paymentAmount).toFixed(2)}</Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={handleAccept}
              isLoading={isLoading}
              bg="green.500"
              color="white"
              _hover={{ bg: "green.600" }}
              mr={3}
            >
              Accept
            </Button>
            <Button
              onClick={() => {
                setEditDetails({
                  description: transactionDetails?.productDetails.description || "",
                  price: transactionDetails?.paymentAmount || "",
                });
                setShowEditModal(true);
              }}
              isLoading={isLoading}
              bg="blue.500"
              color="white"
              _hover={{ bg: "blue.600" }}
              mr={3}
            >
              Accept and Change Details
            </Button>
            <Button
              onClick={handleReject}
              isLoading={isLoading}
              bg="red.500"
              color="white"
              _hover={{ bg: "red.600" }}
            >
              Reject
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Details Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} isCentered size="md">
        <ModalOverlay />
        <ModalContent bg={boxBg} color={textColor}>
          <ModalHeader>
            <Text fontSize="lg" fontWeight="bold" color={headingColor}>Edit Transaction Details</Text>
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={editErrors.description}>
                <FormLabel fontSize="sm">Description</FormLabel>
                <Input
                  value={editDetails.description}
                  onChange={(e) => setEditDetails({ ...editDetails, description: e.target.value })}
                  placeholder="Enter new description"
                  bg={inputBg}
                  borderColor={useColorModeValue("gray.300", "gray.600")}
                  _hover={{ borderColor: borderColor }}
                  _focus={{ borderColor: borderColor, boxShadow: `0 0 0 1px ${borderColor}` }}
                />
                {editErrors.description && <Text color="red.500" fontSize="xs">{editErrors.description}</Text>}
              </FormControl>
              <FormControl isRequired isInvalid={editErrors.price}>
                <FormLabel fontSize="sm">Price</FormLabel>
                <Input
                  type="number"
                  value={editDetails.price}
                  onChange={(e) => setEditDetails({ ...editDetails, price: e.target.value })}
                  placeholder="Enter new price"
                  bg={inputBg}
                  borderColor={useColorModeValue("gray.300", "gray.600")}
                  _hover={{ borderColor: borderColor }}
                  _focus={{ borderColor: borderColor, boxShadow: `0 0 0 1px ${borderColor}` }}
                />
                {editErrors.price && <Text color="red.500" fontSize="xs">{editErrors.price}</Text>}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={() => setShowEditModal(false)}
              bg="gray.500"
              color="white"
              _hover={{ bg: "gray.600" }}
              mr={3}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptAndChange}
              isLoading={isLoading}
              bg="blue.500"
              color="white"
              _hover={{ bg: "blue.600" }}
            >
              Save and Join
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default MainJoinTransaction;