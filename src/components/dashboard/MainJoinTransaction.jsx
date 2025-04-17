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
} from "@chakra-ui/react";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const MainJoinTransaction = () => {
  const [transactionId, setTransactionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [messageType, setMessageType] = useState("");
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

  const handleConfirm = async (e) => {
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

      const response = await axios.post(
        `${BASE_URL}/api/transactions/join-transaction`,
        { transactionId },
        {
          headers: {
            "auth-token": token,
          },
        }
      );

      // Handle successful response
      setResponseMessage(`Successfully joined as ${response.data.role}. Redirecting...`);
      setMessageType("success");

      // Redirect after a short delay to show the success message
      setTimeout(() => {
        navigate("/transactions/tab");
      }, 2000);
    } catch (error) {
      console.error("Error joining transaction:", error);
      if (error.response) {
        setResponseMessage(error.response.data.error || "Error joining transaction");
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
      fontFamily="Poppins"
      // bg={useColorModeValue("gray.50", "gray.900")}
      p={4}
    >
      <Box
        w="100%"
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
            
            <form onSubmit={handleConfirm}>
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
    </Flex>
  );
};

export default MainJoinTransaction;