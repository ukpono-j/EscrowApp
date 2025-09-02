import {
  Box, Button, Container, FormControl, FormLabel, Input, Heading, Text, VStack, useColorMode,
  Stack, Alert, AlertIcon, AlertTitle, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, Badge, HStack, Icon, InputGroup, InputLeftElement, Spinner, SimpleGrid, Skeleton
} from "@chakra-ui/react";
import { FaHandshake, FaEye, FaEdit, FaTimes, FaCheck, FaIdCard, FaMoneyBillWave, FaFileAlt, FaShieldAlt } from "react-icons/fa";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "../../utils/axiosConfig";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./MainJoinTransaction.css";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Simplified animation variants
const variants = {
  container: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  },
  modal: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  },
  card: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  },
};

const MainJoinTransaction = () => {
  const [transactionId, setTransactionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({ description: "", price: "" });
  const [editErrors, setEditErrors] = useState({});
  const [isInitialMount, setIsInitialMount] = useState(true);


  const navigate = useNavigate();
  const { colorMode } = useColorMode();

  // Memoized theme colors
  const theme = useMemo(
    () => ({
      bg: colorMode === "light" ? "white" : "gray.800",
      text: colorMode === "light" ? "gray.600" : "gray.200",
      textMuted: colorMode === "light" ? "gray.400" : "gray.500",
      accent: "#B8974A",
      accentHover: "#C4A360",
      cardBg: colorMode === "light" ? "gray.50" : "gray.700",
      border: colorMode === "light" ? "#373B32" : "#373B32",
      pageBg: colorMode === "light" ? "#152830" : "#152830",
      shadow: colorMode === "light" ? "0 8px 24px rgba(0,0,0,0.05)" : "0 8px 24px rgba(0,0,0,0.3)",
    }),
    [colorMode]
  );

  useEffect(() => {
    if (!alert.message) return;
    const timer = setTimeout(() => setAlert({ message: "", type: "" }), 3000);
    return () => clearTimeout(timer);
  }, [alert.message]);

  useEffect(() => {
    // Prevent initial layout shifts
    const timer = setTimeout(() => setIsInitialMount(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleError = useCallback((error) => {
    const errorMsg = error.response?.data?.error;
    const errorMap = {
      "Transaction not found": "Transaction ID not found. Please verify and try again.",
      "Unauthorized to view this transaction": "Access denied. Transaction may be closed or restricted.",
      "You cannot join your own transaction": "Cannot join your own transaction.",
      "You are already a participant": "Already participating in this transaction.",
      "Only pending transactions can be joined": "Transaction no longer available.",
      "You cannot reject your own transaction": "Cannot reject your own transaction.",
    };
    return errorMap[errorMsg] || errorMsg || "Connection error. Please try again.";
  }, []);

  const apiCall = useCallback(async (endpoint, data = null) => {
    const token = localStorage.getItem("access-token");
    if (!token) throw new Error("Authentication required");
    const config = { headers: { "access-token": token } };
    return data ? axios.post(endpoint, data, config) : axios.get(endpoint, config);
  }, []);

  const fetchDetails = useCallback(
    async (e) => {
      e.preventDefault();
      if (!transactionId.trim()) return;
      try {
        setIsLoading(true);
        const response = await apiCall(`${BASE_URL}/api/transactions/${transactionId}`);
        if (response.data.success) {
          setTransactionDetails(response.data.data);
          setShowPreview(true);
        } else {
          setAlert({ message: response.data.error, type: "error" });
        }
      } catch (error) {
        setAlert({ message: handleError(error), type: "error" });
      } finally {
        setIsLoading(false);
      }
    },
    [transactionId, apiCall, handleError]
  );

  const handleAction = useCallback(
    async (action, payload = {}) => {
      try {
        setIsLoading(true);
        const endpoint = `${BASE_URL}/api/transactions/${action}`;
        const response = await apiCall(endpoint, { id: transactionId, ...payload });
        if (response.data.success) {
          const messages = {
            "join-transaction": `Joined as ${response.data.data.role}! Redirecting...`,
            "accept-and-update": `Joined as ${response.data.role}! Redirecting...`,
            "reject-transaction": "Transaction rejected successfully.",
          };
          setAlert({ message: messages[action], type: action === "reject-transaction" ? "info" : "success" });
          setShowPreview(false);
          setShowEdit(false);
          if (action !== "reject-transaction") {
            setTimeout(() => navigate("/transactions/tab"), 1500);
          }
        } else {
          setAlert({ message: response.data.error, type: "error" });
        }
      } catch (error) {
        setAlert({ message: handleError(error), type: "error" });
      } finally {
        setIsLoading(false);
      }
    },
    [transactionId, apiCall, handleError, navigate]
  );

  const openEdit = useCallback(() => {
    setEditData({
      description: transactionDetails?.productDetails.description || "",
      price: transactionDetails?.paymentAmount || "",
    });
    setShowEdit(true);
  }, [transactionDetails]);

  const handleEdit = useCallback(async () => {
    const errors = {};
    if (!editData.description) errors.description = "Description required";
    if (!editData.price || editData.price <= 0) errors.price = "Valid price required";
    if (Object.keys(errors).length) {
      setEditErrors(errors);
      return;
    }
    await handleAction("accept-and-update", editData);
  }, [editData, handleAction]);

  const formattedAmount = useMemo(() => {
    return transactionDetails?.paymentAmount
      ? `₦${parseFloat(transactionDetails.paymentAmount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
      })}`
      : "N/A";
  }, [transactionDetails?.paymentAmount]);

  const creatorName = useMemo(() => {
    const user = transactionDetails?.userId;
    return user ? `${user.firstName} ${user.lastName || ""}`.trim() : "N/A";
  }, [transactionDetails?.userId]);

  return (
    <Box
      minH="calc(100vh - 100px)"
      fontSize={{ base: "clamp(12px, 3vw, 14px)", md: "16px" }}
      position="relative"
      className="main-join-transaction stable-skeleton"
      width="100%"
      isolation="isolate"
    >
      <style>
        {`
    @media (max-width: 360px) {
      .responsive-container { padding: 3vw; min-height: calc(100vh - 100px); }
      .responsive-button { font-size: clamp(11px, 3vw, 13px); height: clamp(36px, 9vw, 44px); }
      .responsive-input { font-size: clamp(11px, 3vw, 13px); height: clamp(36px, 9vw, 44px); }
      .responsive-heading { font-size: clamp(18px, 4.5vw, 22px); }
      .responsive-text { fontSize: clamp(11px, 2.8vw, 13px); }
      .responsive-modal { margin: 1vw; max-width: 95vw; min-height: 300px; }
      .responsive-icon { width: clamp(14px, 3.5vw, 18px); height: clamp(14px, 3.5vw, 18px); }
    }
    @media (min-width: 361px) and (max-width: 480px) {
      .responsive-container { padding: 4vw; min-height: calc(100vh - 100px); }
      .responsive-button { font-size: clamp(12px, 3.5vw, 14px); height: clamp(40px, 10vw, 48px); }
      .responsive-input { font-size: clamp(12px, 3.5vw, 14px); height: clamp(40px, 10vw, 48px); }
      .responsive-heading { font-size: clamp(20px, 5vw, 24px); }
      .responsive-text { font-size: clamp(12px, 3vw, 14px); }
      .responsive-modal { margin: 2vw; max-width: 90vw; min-height: 320px; }
      .responsive-icon { width: clamp(16px, 4vw, 20px); height: clamp(16px, 4vw, 20px); }
    }
    @media (min-width: 1200px) {
      .responsive-container { max-width: 480px; min-height: calc(100vh - 100px); }
    }
    /* Prevent layout shift */
    .responsive-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }
    .responsive-modal {
      position: relative;
      overflow: hidden;
    }
    .chakra-modal__content {
      min-height: 300px; /* Fixed height to prevent modal height changes */
      display: flex;
      flex-direction: column;
    }
    .chakra-modal__body {
      flex: 1; /* Ensure body takes available space */
      overflow-y: auto;
    }
  `}
      </style>

      <Container
        maxW={{ base: "95%", sm: "90%", md: "480px" }}
        centerContent
        pt={{ base: "110px", sm: "120px", md: "130px" }}
        pb={{ base: 4, md: 6 }}
        px={{ base: 3, sm: 4, md: 5 }}
        className="responsive-container"
      >
        <motion.div variants={variants.container} initial="hidden" animate="visible" style={{ width: "100%" }}>
          {/* Header Section */}
          <Box textAlign="center" mb={{ base: 3, md: 5 }}>
            <Skeleton isLoaded={!isInitialMount} borderRadius="md" minH={{ base: "60px", md: "80px" }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Heading
                  fontSize={{ base: "clamp(18px, 4.5vw, 22px)", sm: "clamp(20px, 5vw, 24px)", md: "26px" }}
                  fontWeight="700"
                  color={theme.text}
                  mb={{ base: 2, md: 3 }}
                  className="responsive-heading md:mt-0 mt-32"
                >
                  <span>Join a Transaction</span>
                </Heading>
                <Text
                  fontSize={{ base: "clamp(11px, 2.8vw, 13px)", md: "14px" }}
                  color={theme.textMuted}
                  maxW={{ base: "95%", sm: "80%", md: "400px" }}
                  mx="auto"
                  className="responsive-text"
                >
                  Enter a transaction ID to preview and join securely
                </Text>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <HStack justify="center" mt={{ base: 3, md: 4 }}>
                  <HStack spacing={1} color={theme.textMuted}>
                    <Icon as={FaShieldAlt} color={theme.accent} w={{ base: 3, md: 4 }} h={{ base: 3, md: 4 }} className="responsive-icon" />
                    <Text fontSize={{ base: "xs", md: "sm" }}>Secure Transactions</Text>
                  </HStack>
                </HStack>
              </motion.div>
            </Skeleton>
          </Box>

          {/* Main Card with Skeleton */}
          <motion.div variants={variants.card} initial="hidden" animate="visible">
            <Skeleton isLoaded={!isLoading} borderRadius="md" minH={{ base: "200px", md: "240px" }}>
              <Box
                borderRadius="md"
                p={{ base: 3, md: 5 }}
                boxShadow={theme.shadow}
                border="1px solid"
                borderColor={theme.border}
              >
                <Box h="2px" bg={theme.accent} />
                <Box mt={3}>
                  <form onSubmit={fetchDetails}>
                    <VStack spacing={{ base: 3, md: 5 }}>
                      <FormControl isRequired>
                        <FormLabel fontSize={{ base: "xs", md: "sm" }} fontWeight="600" color={theme.text}>
                          Transaction ID
                        </FormLabel>
                        <InputGroup size={{ base: "sm", md: "md" }}>
                          <InputLeftElement h="full">
                            <Icon as={FaIdCard} color={theme.accent} w={{ base: 3, md: 4 }} h={{ base: 3, md: 4 }} className="responsive-icon" />
                          </InputLeftElement>
                          <Input
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter transaction ID"
                            bg={theme.cardBg}
                            border="1px solid"
                            borderColor={theme.border}
                            _hover={{ borderColor: theme.accent }}
                            _focus={{ borderColor: theme.accent, boxShadow: `0 0 0 2px ${theme.accent}33` }}
                            borderRadius="md"
                            fontSize={{ base: "xs", md: "sm" }}
                            h={{ base: "36px", md: "44px" }}
                            pl={{ base: 8, md: 10 }}
                            className="responsive-input"
                          />
                        </InputGroup>
                      </FormControl>
                      <AnimatePresence>
                        {alert.message && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{ width: "100%" }}
                          >
                            <Alert
                              status={alert.type}
                              borderRadius="md"
                              fontSize={{ base: "xs", md: "sm" }}
                              p={{ base: 2, md: 3 }}
                            >
                              <AlertIcon />
                              <AlertTitle>{alert.message}</AlertTitle>
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} style={{ width: "100%" }}>
                        <Button
                          type="submit"
                          isLoading={isLoading}
                          loadingText="Verifying..."
                          w="full"
                          h={{ base: "36px", md: "44px" }}
                          borderRadius="md"
                          fontWeight="600"
                          fontSize={{ base: "xs", md: "sm" }}
                          bg={theme.accent}
                          color="white"
                          _hover={{ bg: theme.accentHover }}
                          _active={{ transform: "scale(0.98)" }}
                          leftIcon={<Icon as={FaHandshake} w={{ base: 3, md: 4 }} h={{ base: 3, md: 4 }} className="responsive-icon" />}
                          disabled={!transactionId.trim() || isLoading}
                          className="responsive-button"
                        >
                          {isLoading ? <Spinner size={{ base: "xs", md: "sm" }} /> : "Preview"}
                        </Button>
                      </motion.div>
                    </VStack>
                  </form>
                </Box>
              </Box>
            </Skeleton>
          </motion.div>
        </motion.div>
      </Container>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <Modal
            isOpen
            onClose={() => setShowPreview(false)}
            isCentered
            size={{ base: "xs", sm: "sm", md: "md" }}
            className="responsive-modal stable-modal"
            scrollBehavior="inside"
          >

            <ModalOverlay bg="blackAlpha.600" />
            <motion.div variants={variants.modal} initial="hidden" animate="visible" exit="exit">
              <ModalContent bg={theme.bg} borderRadius="md" boxShadow={theme.shadow} mt={{ base: "110px", sm: "120px" }}>
                <ModalHeader p={{ base: 2, md: 3 }}>
                  <HStack spacing={2}>
                    <Icon as={FaEye} color={theme.accent} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} className="responsive-icon" />
                    <Box>
                      <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color={theme.text}>
                        Transaction Details
                      </Text>
                      <Text fontSize={{ base: "xs", md: "xs" }} color={theme.textMuted} className="responsive-text">
                        Review before proceeding
                      </Text>
                    </Box>
                  </HStack>
                </ModalHeader>

                <ModalBody p={{ base: 2, md: 3 }}>
                  <Skeleton isLoaded={!!transactionDetails && !isLoading} borderRadius="md" minH={{ base: "120px", md: "150px" }}>
                    {transactionDetails ? (
                      <Box bg={theme.cardBg} borderRadius="md" p={{ base: 2, md: 3 }} border="1px solid" borderColor={theme.border}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 2, md: 3 }}>
                          <VStack align="start" spacing={2}>
                            <HStack spacing={2}>
                              <Icon as={FaFileAlt} color={theme.accent} w={{ base: 3, md: 4 }} h={{ base: 3, md: 4 }} className="responsive-icon" />
                              <Box>
                                <Text fontSize="xs" fontWeight="bold" color={theme.textMuted}>
                                  Description
                                </Text>
                                <Text fontSize={{ base: "xs", md: "sm" }} color={theme.text}>
                                  {transactionDetails.productDetails.description || "No description"}
                                </Text>
                              </Box>
                            </HStack>
                          </VStack>
                          <VStack align="start" spacing={2}>
                            <HStack spacing={2}>
                              <Icon as={FaMoneyBillWave} color={theme.accent} w={{ base: 3, md: 4 }} h={{ base: 3, md: 4 }} className="responsive-icon" />
                              <Box>
                                <Text fontSize="xs" fontWeight="bold" color={theme.textMuted}>
                                  Amount
                                </Text>
                                <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color={theme.text}>
                                  {formattedAmount}
                                </Text>
                              </Box>
                            </HStack>
                            <Badge colorScheme="green" fontSize="xs" px={2} borderRadius="full">
                              Pending
                            </Badge>
                          </VStack>
                        </SimpleGrid>
                      </Box>
                    ) : (
                      <Box minH={{ base: "120px", md: "150px" }} />
                    )}
                  </Skeleton>
                </ModalBody>

                <ModalFooter p={{ base: 2, md: 3 }}>
                  <Stack direction={{ base: "column", sm: "row" }} spacing={{ base: 2, md: 3 }} w="full" justify="flex-end">
                    <Button
                      onClick={() => handleAction("reject-transaction")}
                      colorScheme="red"
                      size={{ base: "sm", md: "md" }}
                      borderRadius="md"
                      w={{ base: "full", sm: "auto" }}
                      className="responsive-button"
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={openEdit}
                      colorScheme="blue"
                      size={{ base: "sm", md: "md" }}
                      borderRadius="md"
                      w={{ base: "full", sm: "auto" }}
                      className="responsive-button"
                    >
                      Edit & Join
                    </Button>
                    <Button
                      onClick={() => handleAction("join-transaction")}
                      colorScheme="green"
                      size={{ base: "sm", md: "md" }}
                      borderRadius="md"
                      w={{ base: "full", sm: "auto" }}
                      className="responsive-button"
                    >
                      Accept
                    </Button>
                  </Stack>
                </ModalFooter>
              </ModalContent>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <Modal
            isOpen
            onClose={() => {
              setShowEdit(false);
              setEditErrors({});
            }}
            isCentered
            size={{ base: "xs", sm: "sm", md: "md" }}
            className="responsive-modal stable-modal"
            scrollBehavior="inside"
          >
            <ModalOverlay bg="blackAlpha.600" />
            <motion.div variants={variants.modal} initial="hidden" animate="visible" exit="exit">
              <ModalContent bg={theme.bg} borderRadius="md" boxShadow={theme.shadow} mt={{ base: "110px", sm: "120px" }}>
                <ModalHeader p={{ base: 2, md: 3 }}>
                  <HStack spacing={2}>
                    <Icon as={FaEdit} color={theme.accent} w={{ base: 4, md: 5 }} h={{ base: 4, md: 5 }} className="responsive-icon" />
                    <Box>
                      <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color={theme.text}>
                        Edit Transaction
                      </Text>
                      <Text fontSize={{ base: "xs", md: "xs" }} color={theme.textMuted} className="responsive-text">
                        Modify details
                      </Text>
                    </Box>
                  </HStack>
                </ModalHeader>

                <ModalBody p={{ base: 2, md: 3 }}>
                  <Skeleton isLoaded={!isLoading} borderRadius="md" minH={{ base: "150px", md: "180px" }}>
                    <VStack spacing={{ base: 3, md: 4 }}>
                      <FormControl isRequired isInvalid={editErrors.description}>
                        <FormLabel fontWeight="600" fontSize={{ base: "xs", md: "sm" }} color={theme.text}>
                          Description
                        </FormLabel>
                        <Input
                          value={editData.description}
                          onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter description"
                          bg={theme.cardBg}
                          borderColor={theme.border}
                          _hover={{ borderColor: theme.accent }}
                          _focus={{ borderColor: theme.accent, boxShadow: `0 0 0 2px ${theme.accent}33` }}
                          borderRadius="md"
                          size={{ base: "sm", md: "md" }}
                          fontSize={{ base: "xs", md: "sm" }}
                          className="responsive-input"
                        />
                        {editErrors.description && (
                          <Text color="red.500" fontSize={{ base: "xs", md: "xs" }} mt={1}>
                            {editErrors.description}
                          </Text>
                        )}
                      </FormControl>

                      <FormControl isRequired isInvalid={editErrors.price}>
                        <FormLabel fontWeight="600" fontSize={{ base: "xs", md: "sm" }} color={theme.text}>
                          Amount (₦)
                        </FormLabel>
                        <InputGroup size={{ base: "sm", md: "md" }}>
                          <InputLeftElement h="full">
                            <Icon as={FaMoneyBillWave} color={theme.accent} w={{ base: 3, md: 4 }} h={{ base: 3, md: 4 }} className="responsive-icon" />
                          </InputLeftElement>
                          <Input
                            type="number"
                            value={editData.price}
                            onChange={(e) => setEditData((prev) => ({ ...prev, price: e.target.value }))}
                            placeholder="Enter amount"
                            bg={theme.cardBg}
                            borderColor={theme.border}
                            _hover={{ borderColor: theme.accent }}
                            _focus={{ borderColor: theme.accent, boxShadow: `0 0 0 2px ${theme.accent}33` }}
                            borderRadius="md"
                            size={{ base: "sm", md: "md" }}
                            fontSize={{ base: "xs", md: "sm" }}
                            pl={{ base: 8, md: 10 }}
                            className="responsive-input"
                          />
                        </InputGroup>
                        {editErrors.price && (
                          <Text color="red.500" fontSize={{ base: "xs", md: "xs" }} mt={1}>
                            {editErrors.price}
                          </Text>
                        )}
                      </FormControl>
                    </VStack>
                  </Skeleton>
                </ModalBody>

                <ModalFooter p={{ base: 2, md: 3 }}>
                  <Stack direction={{ base: "column", sm: "row" }} spacing={{ base: 2, md: 3 }} w="full" justify="flex-end">
                    <Button
                      onClick={() => {
                        setShowEdit(false);
                        setEditErrors({});
                      }}
                      colorScheme="gray"
                      size={{ base: "sm", md: "md" }}
                      borderRadius="md"
                      w={{ base: "full", sm: "auto" }}
                      className="responsive-button"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEdit}
                      isLoading={isLoading}
                      colorScheme="blue"
                      size={{ base: "sm", md: "md" }}
                      borderRadius="md"
                      w={{ base: "full", sm: "auto" }}
                      className="responsive-button"
                    >
                      Save & Join
                    </Button>
                  </Stack>
                </ModalFooter>
              </ModalContent>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default MainJoinTransaction;