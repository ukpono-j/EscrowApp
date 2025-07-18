import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Box, Flex, Text, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Grid, Stack, HStack, // Add this import
  GridItem, // Add this if you're using GridItem
  VStack, Input, Select, IconButton, Image, Spinner, useDisclosure
} from '@chakra-ui/react';
import { FiSearch, FiEdit } from 'react-icons/fi';
import { BsChatFill } from 'react-icons/bs';
import { MdClose, MdContentCopy } from 'react-icons/md';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchInitialData, updateTransaction, confirmTransaction, fundTransaction,
  cancelTransaction, submitWaybill
} from '../../store/slices/thunks';
import { useManagedToast } from '../../utils/toastManager';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MiniNav from './MiniNav';
import { nigeriaBanks } from '../../data/banksList';
import axios from '../../utils/axiosConfig';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const MotionBox = motion(Box);

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const TransactionLoader = () => (
  <Flex
    flexDir="column"
    align="center"
    justify="center"
    h={{ base: "40vh", sm: "50vh", md: "60vh" }}
    py={8}
  >
    <Spinner color="#318AE6" size="xl" mb={4} />
    <Text
      color="#E4E4E4"
      fontSize={{ base: "sm", sm: "md", md: "lg" }}
      fontWeight="medium"
      textAlign="center"
      px={4}
    >
      Loading transactions...
    </Text>
  </Flex>
);

const TransactionCard = React.memo(({
  transaction, currentUser, isConfirming, handleChat, handleWaybill,
  handleConfirm, handleFund, handleEditPayment, cancelTransaction,
  copyToClipboard, toggleDescription, expandedDescriptions
}) => {
  const currentUserId = currentUser?._id?.toString() || '';
  const creatorId = transaction?.userId?._id?.toString() || '';
  const isCreator = currentUserId && creatorId === currentUserId;
  const isParticipant = currentUserId && transaction?.participants?.some(p => p?._id?.toString() === currentUserId) || false;
  const userRole = transaction?.userRole || (
    isCreator
      ? transaction?.selectedUserType
      : transaction?.selectedUserType === "buyer" ? "seller" : "buyer"
  );
  const isBuyer = userRole === "buyer";
  const displayName = transaction?.participants?.length > 0 && transaction.participants[0]
    ? (isCreator
      ? `${transaction.participants[0].firstName || ""} ${transaction.participants[0].lastName || ""}`.trim() || transaction.participants[0].email || "Unknown participant"
      : `${transaction.userId.firstName || ""} ${transaction.userId.lastName || ""}`.trim() || transaction.userId.email || "Unknown creator")
    : "No participant yet";
  const description = transaction?.productDetails?.description || "No description provided";
  const isExpanded = expandedDescriptions[transaction._id];
  const truncatedDescription = description.length > 100 && !isExpanded ? `${description.substring(0, 100)}...` : description;

  return (
    <MotionBox
      bg="#111518"
      rounded="lg"
      border="1px"
      borderColor="rgba(255, 255, 255, 0.08)"
      p={0}
      w="100%"
      maxW="100%"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ borderColor: "rgba(49, 138, 230, 0.3)" }}
      _hover={{ borderColor: "rgba(49, 138, 230, 0.3)", transition: "all 0.2s ease" }}
      overflow="hidden"
      position="relative"
    >
      {/* Compact Header */}
      <Box
        borderBottom="1px"
        borderBottomColor="rgba(255, 255, 255, 0.06)"
        p={4}
      >
        <Flex justify="space-between" align="center">
          <Box flex="1" minW="0">
            <Text
              fontSize="md"
              fontWeight="600"
              color="white"
              lineHeight="1.2"
              wordBreak="break-word"
              mb={1}
            >
              {displayName}
            </Text>
            <Text
              fontSize="xs"
              color="gray.500"
              fontWeight="500"
              textTransform="uppercase"
              letterSpacing="0.5px"
            >
              {userRole} Transaction
            </Text>
          </Box>
          <Flex gap={2} flexShrink={0}>
            <IconButton
              aria-label="Edit payment"
              icon={<FiEdit />}
              size="xs"
              bg="transparent"
              color="gray.400"
              _hover={{ color: "#967532", bg: "rgba(150, 117, 50, 0.1)" }}
              onClick={() => handleEditPayment(transaction)}
            />
            <IconButton
              aria-label="Open chat"
              icon={<BsChatFill />}
              size="xs"
              bg="transparent"
              color="gray.400"
              _hover={{ color: "#318AE6", bg: "rgba(49, 138, 230, 0.1)" }}
              onClick={() => handleChat(transaction._id)}
            />
          </Flex>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box p={4}>
        {/* Amount & Status Row */}
        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Text
              fontSize="xs"
              color="gray.500"
              mb={1}
              fontWeight="500"
              textTransform="uppercase"
              letterSpacing="0.5px"
            >
              Amount
            </Text>
            <Text
              fontSize="xl"
              color="#318AE6"
              fontWeight="700"
              lineHeight="1"
            >
              {transaction.paymentAmount
                ? `₦${parseFloat(transaction.paymentAmount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                : "N/A"}
            </Text>
          </Box>
          <VStack spacing={2} align="flex-end">
            <Box
              bg={transaction.status === "completed" ? "rgba(34, 197, 94, 0.15)" : transaction.status === "cancelled" ? "rgba(239, 68, 68, 0.15)" : "rgba(234, 179, 8, 0.15)"}
              color={transaction.status === "completed" ? "#22c55e" : transaction.status === "cancelled" ? "#ef4444" : "#eab308"}
              px={2}
              py={1}
              rounded="md"
              fontSize="xs"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.5px"
            >
              {transaction.status}
            </Box>
            <Box
              bg={transaction.proofOfWaybill === "confirmed" ? "rgba(34, 197, 94, 0.15)" : "rgba(234, 179, 8, 0.15)"}
              color={transaction.proofOfWaybill === "confirmed" ? "#22c55e" : "#eab308"}
              px={2}
              py={1}
              rounded="md"
              fontSize="xs"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.5px"
            >
              {transaction.proofOfWaybill || "Pending"}
            </Box>
          </VStack>
        </Flex>

        {/* Escrow Status */}
        <Box
          bg="rgba(29, 34, 37, 0.5)"
          rounded="md"
          p={3}
          mb={4}
          border="1px"
          borderColor="rgba(255, 255, 255, 0.05)"
        >
          <Text
            fontSize="xs"
            color="gray.500"
            mb={1}
            fontWeight="500"
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            Escrow Status
          </Text>
          <Text
            fontSize="sm"
            color={
              transaction.locked && transaction.status !== "completed" ? "#eab308"
                : transaction.status === "completed" ? "#22c55e" : "gray.400"
            }
            fontWeight="600"
          >
            {transaction.locked && transaction.status !== "completed"
              ? `Locked: ₦${parseFloat(transaction.lockedAmount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
              : transaction.status === "completed"
                ? `Released: ₦${parseFloat(transaction.paymentAmount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                : "Not Locked"}
          </Text>
        </Box>

        {/* Compact Details Grid */}
        <Grid templateColumns="1fr 1fr" gap={4} mb={4}>
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">Contact</Text>
            <Text fontSize="sm" color="white" fontWeight="500" wordBreak="break-word">
              {transaction.email || "N/A"}
            </Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">Created</Text>
            <Text fontSize="sm" color="white" fontWeight="500">
              {transaction.createdAt ? format(new Date(transaction.createdAt), "MMM dd, yyyy") : "N/A"}
            </Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">Bank</Text>
            <Text fontSize="sm" color="white" fontWeight="500">
              {transaction.paymentBank || "N/A"}
            </Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">Account</Text>
            <Text fontSize="sm" color="white" fontWeight="500" fontFamily="mono">
              {transaction.paymentAccountNumber || "N/A"}
            </Text>
          </Box>
        </Grid>

        {/* Transaction ID */}
        <Box
          bg="rgba(29, 34, 37, 0.5)"
          rounded="md"
          p={3}
          mb={4}
          border="1px"
          borderColor="rgba(255, 255, 255, 0.05)"
        >
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">Transaction ID</Text>
          <Flex align="center" gap={2}>
            <Text
              fontSize="xs"
              color="gray.300"
              fontFamily="mono"
              fontWeight="500"
              flex="1"
              wordBreak="break-all"
            >
              {transaction._id}
            </Text>
            <IconButton
              aria-label="Copy ID"
              icon={<MdContentCopy />}
              size="xs"
              bg="transparent"
              color="gray.500"
              _hover={{ color: "#318AE6" }}
              onClick={() => copyToClipboard(transaction._id)}
            />
          </Flex>
        </Box>

        {/* Description */}
        <Box mb={4}>
          <Text fontSize="xs" color="gray.500" mb={2} fontWeight="500">Description</Text>
          <Box
            bg="rgba(29, 34, 37, 0.5)"
            rounded="md"
            p={3}
            border="1px"
            borderColor="rgba(255, 255, 255, 0.05)"
          >
            <Text
              fontSize="sm"
              color="white"
              whiteSpace="pre-wrap"
              cursor={description.length > 100 ? "pointer" : "default"}
              onClick={() => toggleDescription(transaction._id)}
              lineHeight="1.5"
              wordBreak="break-word"
            >
              {truncatedDescription}
            </Text>
            {description.length > 100 && (
              <Text
                fontSize="xs"
                color="#318AE6"
                mt={2}
                cursor="pointer"
                onClick={() => toggleDescription(transaction._id)}
                _hover={{ textDecoration: "underline" }}
                fontWeight="500"
              >
                {isExpanded ? "Show less" : "Read more"}
              </Text>
            )}
          </Box>
        </Box>

        {/* Refined Action Buttons */}
        <VStack spacing={2} align="stretch">
          <Button
            onClick={() => handleWaybill(transaction._id, isBuyer)}
            bg="#318AE6"
            color="white"
            _hover={{ bg: "#2279d8" }}
            size="sm"
            h="40px"
            fontSize="sm"
            fontWeight="600"
            rounded="md"
            leftIcon={<BsChatFill size="14" />}
          >
            {isBuyer ? "View Waybill" : "Submit Waybill"}
          </Button>

          {transaction.status === "pending" && (
            <Button
              onClick={() => handleConfirm(transaction._id)}
              bg="rgba(34, 197, 94, 0.9)"
              color="white"
              _hover={{ bg: "#22c55e" }}
              size="sm"
              h="40px"
              fontSize="sm"
              fontWeight="600"
              rounded="md"
              isLoading={isConfirming[transaction._id]}
              loadingText="Completing..."
            >
              Complete Transaction
            </Button>
          )}

          {isBuyer && !transaction.locked && transaction.status === "pending" && (
            <Button
              onClick={() => handleFund(transaction)}
              bg="#967532"
              color="white"
              _hover={{ bg: "#7a5c28" }}
              size="sm"
              h="40px"
              fontSize="sm"
              fontWeight="600"
              rounded="md"
              isLoading={isConfirming[transaction._id]}
              loadingText="Processing..."
            >
              Fund Transaction
            </Button>
          )}

          <Button
            onClick={() => cancelTransaction(transaction._id)}
            variant="outline"
            borderColor="rgba(239, 68, 68, 0.3)"
            color="#ef4444"
            _hover={{ bg: "rgba(239, 68, 68, 0.1)", borderColor: "#ef4444" }}
            size="sm"
            h="40px"
            fontSize="sm"
            fontWeight="600"
            rounded="md"
            isLoading={isConfirming[transaction._id]}
            loadingText="Cancelling..."
          >
            Cancel Transaction
          </Button>
        </VStack>
      </Box>
    </MotionBox>
  );
});

const WaybillModal = React.memo(({ isOpen, onClose, transactionId, isBuyer, details, setDetails, errors, handleSubmit, downloadImage }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    isCentered
    size={{ base: "full", sm: "lg", md: "xl" }}
    scrollBehavior="inside"
  >
    <ModalOverlay />
    <ModalContent
      bg="#1A1E21"
      color="white"
      p={{ base: 4, sm: 6, md: 8 }}
      rounded="xl"
      mx={{ base: 4, sm: 6 }}
      maxH="90vh"
    >
      <ModalHeader p={0} mb={4}>
        <Text
          fontSize={{ base: "lg", sm: "xl", md: "2xl" }}
          fontWeight="bold"
          textAlign="center"
        >
          {isBuyer ? "Waybill Details" : "Seller Waybill Proof"}
        </Text>
        {!isBuyer && (
          <Text
            fontSize={{ base: "sm", sm: "md" }}
            textAlign="center"
            color="gray.300"
            mt={2}
          >
            I, the seller, confirm that I have shipped the goods.
          </Text>
        )}
      </ModalHeader>
      <ModalBody p={0}>
        {isBuyer ? (
          <VStack spacing={4} align="stretch" color="gray.300">
            {[
              { label: "Item", value: details.item || "N/A" },
              { label: "Price", value: details.price || "N/A" },
              { label: "Shipping Address", value: details.shippingAddress || "N/A" },
              { label: "Tracking Number", value: details.trackingNumber || "N/A" },
              { label: "Delivery Date", value: details.deliveryDate ? format(new Date(details.deliveryDate), "MMM dd, yyyy") : "N/A" },
            ].map(({ label, value }, idx) => (
              <Box key={idx} bg="#111518" p={4} rounded="md">
                <Text fontSize={{ base: "xs", sm: "sm" }} mb={2} color="gray.400" fontWeight="medium">
                  {label}:
                </Text>
                <Text fontSize={{ base: "sm", sm: "md" }} color="white">
                  {value}
                </Text>
              </Box>
            ))}
            <Box bg="#111518" p={4} rounded="md">
              <Text fontSize={{ base: "xs", sm: "sm" }} mb={2} color="gray.400" fontWeight="medium">
                Image:
              </Text>
              {details.image ? (
                <Flex direction="column" align="center" gap={3}>
                  <Image
                    src={details.image}
                    alt="Waybill Proof"
                    maxW="100%"
                    maxH="300px"
                    h="auto"
                    rounded="lg"
                    objectFit="contain"
                  />
                  <Button
                    bg="#318AE6"
                    color="white"
                    _hover={{ bg: "#2279d8" }}
                    size={{ base: "sm", sm: "md" }}
                    onClick={() => downloadImage(details.image)}
                  >
                    Download Image
                  </Button>
                </Flex>
              ) : (
                <Text fontSize={{ base: "sm", sm: "md" }} color="gray.400">
                  No image provided
                </Text>
              )}
            </Box>
          </VStack>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(transactionId); }}>
            <VStack spacing={4}>
              {[
                { label: "Item", key: "item", type: "text" },
                { label: "Price", key: "price", type: "number" },
                { label: "Shipping Address", key: "shippingAddress", type: "text" },
                { label: "Tracking Number", key: "trackingNumber", type: "text" },
                { label: "Delivery Date", key: "deliveryDate", type: "date" },
              ].map(({ label, key, type }) => (
                <Box key={key} w="full">
                  <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300" mb={2} fontWeight="medium">
                    {label}:
                  </Text>
                  <Input
                    type={type}
                    value={details[key] || ""}
                    onChange={(e) => setDetails({ ...details, [key]: e.target.value })}
                    bg="#111518"
                    borderColor="#318AE6"
                    color="white"
                    fontSize={{ base: "sm", sm: "md" }}
                    p={3}
                    _focus={{ borderColor: "#318AE6", boxShadow: "0 0 0 1px #318AE6" }}
                  />
                  {errors[key] && (
                    <Text color="red.500" fontSize={{ base: "xs", sm: "sm" }} mt={1}>
                      {errors[key]}
                    </Text>
                  )}
                </Box>
              ))}
              <Box w="full">
                <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300" mb={2} fontWeight="medium">
                  Image:
                </Text>
                <Box
                  border="2px"
                  borderStyle="dashed"
                  borderColor="#318AE6"
                  rounded="lg"
                  p={6}
                  textAlign="center"
                  bg="#111518"
                  _hover={{ bg: "#1a1f23" }}
                  transition="all 0.2s"
                >
                  <Input
                    type="file"
                    id={`waybill-image-${transactionId}`}
                    accept="image/*"
                    onChange={(e) => setDetails({ ...details, image: e.target.files[0] })}
                    display="none"
                  />
                  <label htmlFor={`waybill-image-${transactionId}`} style={{ cursor: 'pointer' }}>
                    <VStack spacing={3}>
                      <Text fontSize="3xl" color="#318AE6">📷</Text>
                      <Text fontSize={{ base: "sm", sm: "md" }} color="gray.300">
                        Click to upload proof of shipment
                      </Text>
                    </VStack>
                  </label>
                  {details.image && (
                    <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300" mt={2}>
                      Selected: {details.image.name}
                    </Text>
                  )}
                </Box>
                {errors.image && (
                  <Text color="red.500" fontSize={{ base: "xs", sm: "sm" }} mt={1}>
                    {errors.image}
                  </Text>
                )}
              </Box>
            </VStack>
          </form>
        )}
      </ModalBody>
      <ModalFooter p={0} pt={6}>
        <Stack direction={{ base: "column", sm: "row" }} spacing={3} w="full" justify="flex-end">
          <Button
            bg="gray.600"
            color="white"
            _hover={{ bg: "gray.700" }}
            size={{ base: "sm", sm: "md" }}
            onClick={onClose}
            flex={{ base: 1, sm: "none" }}
          >
            Close
          </Button>
          {!isBuyer && (
            <Button
              type="submit"
              bg="#318AE6"
              color="white"
              _hover={{ bg: "#2279d8" }}
              size={{ base: "sm", sm: "md" }}
              onClick={() => handleSubmit(transactionId)}
              flex={{ base: 1, sm: "none" }}
            >
              Submit
            </Button>
          )}
        </Stack>
      </ModalFooter>
    </ModalContent>
  </Modal>
));

const PaymentDetailsModal = ({ isOpen, onClose, transaction, paymentDetails, setPaymentDetails, paymentErrors, handleSubmit }) => (
  <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "md" }}>
    <ModalOverlay />
    <ModalContent
      bg="#1A1E21"
      color="white"
      p={{ base: 4, sm: 6 }}
      rounded="xl"
      mx={{ base: 4, sm: 6 }}
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize={{ base: "lg", sm: "xl" }} fontWeight="bold">
          Edit Payment Details
        </Text>
        <IconButton
          aria-label="Close modal"
          icon={<MdClose />}
          color="gray.400"
          _hover={{ color: "#318AE6" }}
          onClick={onClose}
          bg="transparent"
        />
      </Flex>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          {/* <Box w="full">
            <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300" mb={2} fontWeight="medium">
              Bank
            </Text>
            <Select
              value={paymentDetails.selectedBankCode || ""}
              onChange={(e) => {
                const bank = nigeriaBanks.find(b => b.code === e.target.value);
                setPaymentDetails({ ...paymentDetails, selectedBankCode: e.target.value, paymentBank: bank?.name || "" });
              }}
              placeholder="Select a bank"
              bg="#111518"
              borderColor="#318AE6"
              color="white"
              fontSize={{ base: "sm", sm: "md" }}
              _focus={{ borderColor: "#318AE6", boxShadow: "0 0 0 1px #318AE6" }}
            >
              {nigeriaBanks.map(bank => (
                <option key={bank.code} value={bank.code} style={{ color: "black" }}>
                  {bank.name}
                </option>
              ))}
            </Select>
            {paymentErrors.selectedBankCode && (
              <Text color="red.500" fontSize={{ base: "xs", sm: "sm" }} mt={1}>
                {paymentErrors.selectedBankCode}
              </Text>
            )}
          </Box>
          <Box w="full">
            <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300" mb={2} fontWeight="medium">
              Account Number
            </Text>
            <Input
              type="text"
              value={paymentDetails.paymentAccountNumber || ""}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentAccountNumber: e.target.value })}
              bg="#111518"
              borderColor="#318AE6"
              color="white"
              fontSize={{ base: "sm", sm: "md" }}
              _focus={{ borderColor: "#318AE6", boxShadow: "0 0 0 1px #318AE6" }}
            />
            {paymentErrors.paymentAccountNumber && (
              <Text color="red.500" fontSize={{ base: "xs", sm: "sm" }} mt={1}>
                {paymentErrors.paymentAccountNumber}
              </Text>
            )}
          </Box> */}
          <Box w="full">
            <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300" mb={2} fontWeight="medium">
              Amount
            </Text>
            <Input
              type="number"
              value={paymentDetails.paymentAmount || ""}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentAmount: e.target.value })}
              bg="#111518"
              borderColor="#318AE6"
              color="white"
              fontSize={{ base: "sm", sm: "md" }}
              isDisabled={transaction?.locked}
              _focus={{ borderColor: "#318AE6", boxShadow: "0 0 0 1px #318AE6" }}
            />
            {paymentErrors.paymentAmount && (
              <Text color="red.500" fontSize={{ base: "xs", sm: "sm" }} mt={1}>
                {paymentErrors.paymentAmount}
              </Text>
            )}
          </Box>
        </VStack>
        <Stack direction={{ base: "column", sm: "row" }} spacing={3} mt={6} justify="flex-end">
          <Button
            bg="gray.600"
            color="white"
            _hover={{ bg: "gray.700" }}
            size={{ base: "sm", sm: "md" }}
            onClick={onClose}
            flex={{ base: 1, sm: "none" }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            bg="#318AE6"
            color="white"
            _hover={{ bg: "#2279d8" }}
            size={{ base: "sm", sm: "md" }}
            flex={{ base: 1, sm: "none" }}
          >
            Save
          </Button>
        </Stack>
      </form>
    </ModalContent>
  </Modal>
);

const FundingModal = ({ isOpen, onClose, transaction, walletBalance, confirmFunding }) => (
  <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "md" }}>
    <ModalOverlay />
    <ModalContent
      bg="#1A1E21"
      color="white"
      p={{ base: 4, sm: 6 }}
      rounded="xl"
      mx={{ base: 4, sm: 6 }}
    >
      <ModalHeader p={0} mb={4}>
        <Text fontSize={{ base: "lg", sm: "xl" }} fontWeight="bold">
          Fund Transaction
        </Text>
      </ModalHeader>
      <ModalBody p={0}>
        <Text fontSize={{ base: "sm", sm: "md" }} color="gray.300" mb={4} lineHeight="1.6">
          Your wallet balance (₦{walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}) is insufficient.
          You need an additional ₦{transaction ? (transaction.paymentAmount - walletBalance).toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}.
          Proceed to fund via Paystack?
        </Text>
      </ModalBody>
      <ModalFooter p={0} pt={4}>
        <Stack direction={{ base: "column", sm: "row" }} spacing={3} w="full" justify="flex-end">
          <Button
            bg="gray.600"
            color="white"
            _hover={{ bg: "gray.700" }}
            size={{ base: "sm", sm: "md" }}
            onClick={onClose}
            flex={{ base: 1, sm: "none" }}
          >
            Cancel
          </Button>
          <Button
            bg="#318AE6"
            color="white"
            _hover={{ bg: "#2279d8" }}
            size={{ base: "sm", sm: "md" }}
            onClick={() => confirmFunding(transaction)}
            flex={{ base: 1, sm: "none" }}
          >
            Proceed to Paystack
          </Button>
        </Stack>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

const DisplayTransaction = () => {
  const dispatch = useDispatch();
  const { userDetails, loading: userLoading, error: userError } = useSelector(state => state.user);
  const { transactions, loading: transactionsLoading } = useSelector(state => state.transactions); // Changed to include transactions.loading
  const { wallet: walletBalance, transactions: walletTransactions, loading: walletLoading } = useSelector(state => state.wallet);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasFetchedInitially, setHasFetchedInitially] = useState(false);
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showWaybillPopup, setShowWaybillPopup] = useState({});
  const [buyerShowWaybillPopup, setBuyerShowWaybillPopup] = useState({});
  const [waybillDetails, setWaybillDetails] = useState({ item: '', image: null, price: '', shippingAddress: '', trackingNumber: '', deliveryDate: '' });
  const [buyerWaybillDetails, setBuyerWaybillDetails] = useState({});
  const [errors, setErrors] = useState({});
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({ paymentBank: '', paymentAccountNumber: '', selectedBankCode: '', paymentAmount: '' });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [isConfirming, setIsConfirming] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const managedToast = useManagedToast(); // Use the hook
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen: isFundingModalOpen, onOpen: openFundingModal, onClose: closeFundingModal } = useDisclosure();


  // Debounced fetch for socket events
  const debouncedFetchInitialData = useCallback(
    debounce(() => {
      console.log('fetchInitialData called by socket at:', new Date().toISOString());
      dispatch(fetchInitialData()).unwrap().catch((err) => {
        console.error('fetchInitialData error:', err);
        managedToast({
          id: 'fetch-error',
          title: 'Data Fetch Error',
          description: err.message || 'Unable to fetch transactions or wallet data. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
    }, 5000),
    [dispatch, managedToast]
  );

  // Authentication useEffect - Fetch only once on mount
  useEffect(() => {
    const token = localStorage.getItem('access-token');
    if (!token) {
      managedToast({
        id: 'auth-error',
        title: 'Authentication Required',
        description: 'Please log in to view transactions.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
      return;
    }

    if (!hasFetchedInitially) {
      console.log('Initial fetchInitialData called at:', new Date().toISOString());
      dispatch(fetchInitialData()).unwrap()
        .then(() => setHasFetchedInitially(true))
        .catch((err) => {
          console.error('Initial fetchInitialData error:', err);
          managedToast({
            id: 'fetch-error',
            title: 'Data Fetch Error',
            description: err.message || 'Unable to fetch transactions or wallet data. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        });
    }
  }, [dispatch, managedToast, navigate, hasFetchedInitially]);


  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarCollapsed(true);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


  // Socket.io useEffect - Fetch only on transactionCreated
  useEffect(() => {
    const socket = io(BASE_URL, {
      auth: { token: localStorage.getItem('access-token') },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      if (userDetails?._id) socket.emit('join-room', userDetails._id);
      transactions.forEach(t => socket.emit('join-room', `transaction_${t._id}`));
      console.log('Socket connected, joined rooms:', userDetails?._id, transactions.map(t => `transaction_${t._id}`));
    });

    socket.on('transactionCreated', (data) => {
      if (data?.userId === userDetails?._id || data?.participants?.includes(userDetails?._id)) {
        managedToast({
          id: 'transaction-created',
          title: 'New Transaction',
          description: 'A new transaction has been created.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        debouncedFetchInitialData();
      }
    });

    // Log other events for debugging but do not fetch
    socket.on('transactionCompleted', (data) => {
      console.log('transactionCompleted received:', data);
      if (transactions.some(t => t._id === data?.transactionId)) {
        managedToast({
          id: `transaction-completed-${data.transactionId}`,
          title: 'Transaction Completed',
          description: 'A transaction has been completed.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    });

    socket.on('balanceUpdate', (data) => {
      console.log('balanceUpdate received:', data);
      if (data?.userId === userDetails?._id) {
        managedToast({
          id: 'balance-update',
          title: 'Balance Updated',
          description: 'Your wallet balance has been updated.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    });

    socket.on('transactionUpdated', (data) => {
      console.log('transactionUpdated received:', data);
      if (transactions.some(t => t._id === data?.transactionId)) {
        managedToast({
          id: `transaction-updated-${data.transactionId}`,
          title: 'Transaction Updated',
          description: data.message,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      socket.off('transactionCreated');
      socket.off('transactionCompleted');
      socket.off('balanceUpdate');
      socket.off('transactionUpdated');
      socket.off('connect_error');
      socket.disconnect();
      console.log('Socket disconnected');
    };
  }, [userDetails?._id, transactions, debouncedFetchInitialData, managedToast]);

  const debouncedSearch = useCallback(debounce((value) => setSearchQuery(value), 300), []);

  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) return [];
    const query = searchQuery.toLowerCase().trim();
    return transactions.filter(t => {
      if (activeTab === 'active' && t.status !== 'pending') return false;
      if (activeTab === 'completed' && t.status !== 'completed') return false;
      if (activeTab === 'cancelled' && t.status !== 'cancelled') return false;
      const participantName = t.participants?.length > 0
        ? `${t.participants[0]?.firstName || ''} ${t.participants[0]?.lastName || ''}`.trim().toLowerCase() || t.participants[0]?.email?.toLowerCase() || ''
        : t.userId?.email?.toLowerCase() || '';
      const description = t.productDetails?.description?.toLowerCase() || '';
      const paymentName = t.paymentName?.toLowerCase() || '';
      return (
        participantName.includes(query) ||
        description.includes(query) ||
        paymentName.includes(query) ||
        t._id.toLowerCase().includes(query) ||
        t.email?.toLowerCase().includes(query)
      );
    });
  }, [transactions, activeTab, searchQuery]);


  const handleChat = async (transactionId) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/transactions/create-chatroom`,
        { transactionId }, // Change from { id: transactionId } to { transactionId }
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` },
        }
      );
      if (res.data?.success && res.data.chatroomId) {
        navigate(`/chat/${res.data.chatroomId}`);
      } else {
        throw new Error('Failed to create chatroom');
      }
    } catch (error) {
      managedToast({
        id: `chat-error-${transactionId}`,
        title: 'Error',
        description: error.response?.data?.error || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleWaybill = (transactionId, isBuyer) => {
    if (isBuyer) {
      setBuyerShowWaybillPopup(prev => ({ ...prev, [transactionId]: true }));
      fetchBuyerWaybillDetails(transactionId);
    } else {
      setShowWaybillPopup(prev => ({ ...prev, [transactionId]: true }));
    }
  };

  const fetchBuyerWaybillDetails = async (transactionId) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/transactions/waybill-details/${transactionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` },
      });
      if (res.data?.success && res.data.data) {
        setBuyerWaybillDetails(prev => ({
          ...prev,
          [transactionId]: {
            item: res.data.data.item || "",
            price: res.data.data.price || "",
            shippingAddress: res.data.data.shippingAddress || "",
            trackingNumber: res.data.data.trackingNumber || "",
            deliveryDate: res.data.data.deliveryDate || "",
            image: res.data.data.image ? `${BASE_URL}/${res.data.data.image}` : "",
          },
        }));
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const handleWaybillSubmit = async (transactionId) => {
    const newErrors = {};
    ["item", "price", "shippingAddress", "trackingNumber", "deliveryDate", "image"].forEach(key => {
      if (!waybillDetails[key]) newErrors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    const formData = new FormData();
    formData.append("transactionId", transactionId);
    Object.entries(waybillDetails).forEach(([key, value]) => value && formData.append(key, value));
    dispatch(submitWaybill({ transactionId, formData }))
      .unwrap()
      .then(() => {
        managedToast({
          id: `waybill-success-${transactionId}`,
          title: 'Waybill Submitted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setShowWaybillPopup(prev => ({ ...prev, [transactionId]: false }));
        setWaybillDetails({ item: "", image: null, price: "", shippingAddress: "", trackingNumber: "", deliveryDate: "" });
      })
      .catch(error => {
        const errorMessage = typeof error === 'string' ? error : error.message || 'Failed to submit waybill';
        managedToast({
          id: `waybill-error-${transactionId}`,
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
  };

  const downloadImage = (url) => {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = url.split("/").pop() || "waybill-image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cancelTransactionAction = async (transactionId) => {
    if (isConfirming[transactionId]) return;
    try {
      setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
      const response = await dispatch(cancelTransaction(transactionId)).unwrap();
      managedToast({
        id: `cancel-success-${transactionId}`,
        title: 'Transaction Cancelled',
        description: response.refunded > 0
          ? `Funds of ₦${response.refunded.toLocaleString('en-NG', { minimumFractionDigits: 2 })} refunded to wallet.`
          : 'No funds were locked for this transaction.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      managedToast({
        id: `cancel-error-${transactionId}`,
        title: 'Error',
        description: error.message || 'Failed to cancel transaction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  const handleConfirm = (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
    const transaction = transactions.find(t => t._id === transactionId);
    if (!transaction) {
      managedToast({
        id: `confirm-error-${transactionId}`,
        title: 'Error',
        description: 'Transaction not found',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
      return;
    }
    if (!transaction.participants?.length) {
      managedToast({
        id: `confirm-error-${transactionId}`,
        title: 'Error',
        description: 'No participant',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
      return;
    }
    if (transaction.status !== 'pending') {
      managedToast({
        id: `confirm-error-${transactionId}`,
        title: 'Error',
        description: 'Only pending transactions can be confirmed',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
      return;
    }
    setSelectedTransactionId(transactionId);
    setModalVisible(true);
    setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
  };

  const completeTransaction = (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
    dispatch(confirmTransaction(transactionId))
      .unwrap()
      .then(transaction => {
        managedToast({
          id: `confirm-success-${transactionId}`,
          title: transaction.status === 'completed' ? 'Transaction Completed' : 'Confirmation Recorded',
          description: transaction.status === 'completed' ? 'Funds released to seller.' : 'Waiting for other party.',
          status: transaction.status === 'completed' ? 'success' : 'info',
          duration: 5000,
          isClosable: true,
        });
      })
      .catch(error => {
        managedToast({
          id: `confirm-error-${transactionId}`,
          title: 'Error',
          description: error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      })
      .finally(() => {
        setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
        setModalVisible(false);
        setSelectedTransactionId(null);
      });
  };

  const handleFund = async (transaction) => {
    if (!transaction || !transaction._id || transaction.locked || !transaction.paymentAmount || parseFloat(transaction.paymentAmount) <= 0) {
      managedToast({
        id: `fund-error-${transaction?._id || 'unknown'}`,
        title: 'Error',
        description: 'Invalid transaction data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    try {
      setIsConfirming(prev => ({ ...prev, [transaction._id]: true }));
      const amount = parseFloat(transaction.paymentAmount);
      if (isNaN(amount)) {
        throw new Error('Invalid payment amount');
      }
      if (walletBalance >= amount) {
        await dispatch(fundTransaction({ transactionId: transaction._id, amount })).unwrap();
        managedToast({
          id: `fund-success-${transaction._id}`,
          title: 'Transaction Funded',
          description: 'Funded from wallet balance.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        openFundingModal();
      }
    } catch (error) {
      managedToast({
        id: `fund-error-${transaction._id}`,
        title: 'Error',
        description: error.message || 'Failed to fund transaction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsConfirming(prev => ({ ...prev, [transaction._id]: false }));
    }
  };

  const confirmFunding = async (transaction) => {
    if (!transaction || !transaction.paymentAmount) {
      managedToast({
        id: `fund-error-${transaction?._id || 'unknown'}`,
        title: 'Error',
        description: 'Invalid transaction data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      closeFundingModal();
      return;
    }
    try {
      const amount = parseFloat(transaction.paymentAmount);
      const shortfall = Math.max(amount - walletBalance, 0);
      const fundingAmount = Math.ceil(shortfall * 100) / 100;
      const response = await axios.post(
        `${BASE_URL}/api/wallet/fund`,
        {
          amount: fundingAmount,
          email: userDetails?.email || '',
          phoneNumber: userDetails?.phoneNumber || '',
          transactionId: transaction._id,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` } }
      );
      if (response.data?.success && response.data.data?.authorization_url) {
        window.location.href = response.data.data.authorization_url;
      } else {
        throw new Error('Failed to initiate Paystack funding');
      }
    } catch (error) {
      managedToast({
        id: `fund-error-${transaction._id}`,
        title: 'Error',
        description: error.response?.data?.error || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      closeFundingModal();
    }
  };

  const handleEditPayment = (transaction) => {
    if (!transaction) return;
    setCurrentTransaction(transaction);
    setPaymentDetails({
      paymentBank: transaction.paymentBank || "",
      paymentAccountNumber: transaction.paymentAccountNumber || "",
      selectedBankCode: transaction.paymentBankCode || "",
      paymentAmount: transaction.paymentAmount || "",
    });
    setShowPaymentDetailsModal(true);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (parseFloat(paymentDetails.paymentAmount) <= 0) newErrors.paymentAmount = "Invalid amount";
    if (Object.keys(newErrors).length) {
      setPaymentErrors(newErrors);
      return;
    }
    dispatch(updateTransaction({ transactionId: currentTransaction._id, data: { paymentAmount: parseFloat(paymentDetails.paymentAmount) } }))
      .unwrap()
      .then((response) => {
        managedToast({
          id: `payment-success-${currentTransaction._id}`,
          title: 'Payment Details Updated',
          description: `Amount updated to ₦${parseFloat(paymentDetails.paymentAmount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setShowPaymentDetailsModal(false);
        setCurrentTransaction(null);
        setPaymentDetails({ paymentBank: "", paymentAccountNumber: "", selectedBankCode: "", paymentAmount: "" });
        setPaymentErrors({});
        dispatch(setTransactions(
          transactions.map(t =>
            t._id === currentTransaction._id ? { ...t, paymentAmount: parseFloat(paymentDetails.paymentAmount) } : t
          )
        ));
      })
      .catch(error => {
        const errorMessage = typeof error === 'string' ? error : error.message || 'Failed to update payment details';
        managedToast({
          id: `payment-error-${currentTransaction._id}`,
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() =>
      managedToast({
        id: `copy-${text}`,
        title: 'Copied to Clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    );
  };

  const toggleDescription = (transactionId) => {
    setExpandedDescriptions(prev => ({ ...prev, [transactionId]: !prev[transactionId] }));
  };

  const handleShowProfile = () => {
    setShowToggleContainer(false);
    setShowProfile(true);
  };

  const handleMyTransaction = () => {
    setShowToggleContainer(true);
    setShowProfile(false);
  };

  return (
    <Flex minH="100vh" bg="#0A0E10" direction={{ base: "column", md: "row" }}>
      <Sidebar onShowProfile={handleShowProfile} onShowToggleComponent={handleMyTransaction} onCollapseChange={setIsSidebarCollapsed} />
      <Box
        flex={1}
        className={`transition-all duration-300 h-screen overflow-y-auto ${isMobile ? "ml-0" : isSidebarCollapsed ? "ml-[80px]" : "ml-[280px]"}`}
        maxW="100%"
        overflowX="hidden"
      >
        {showToggleContainer && (
          <Box
            px={{ base: 4, sm: 5, md: 6, lg: 8 }}
            pt={{ base: "85px", sm: "90px", md: "95px" }}
            pb={{ base: 4, sm: 5, md: 6 }}
            maxW="100%"
            mx="auto"
            overflowX="hidden"
          >
            <MiniNav />

            {/* Header Section - More compact */}
            <Flex
              justify="space-between"
              align={{ base: "flex-start", md: "center" }}
              mb={{ base: 4, sm: 5, md: 6 }}
              flexDir={{ base: "column", md: "row" }}
              gap={{ base: 3, sm: 4 }}
              w="100%"
            >
              <Text
                fontSize={{ base: "xl", sm: "2xl", md: "3xl" }}
                fontWeight="600"
                color="white"
                lineHeight="1.3"
              >
                My Transactions
              </Text>

              <Flex
                gap={{ base: 2, sm: 3 }}
                align={{ base: "stretch", sm: "center" }}
                flexDir={{ base: "column", sm: "row" }}
                flexWrap="wrap"
                w={{ base: "100%", sm: "auto" }}
              >
                <Text
                  fontSize={{ base: "xs", sm: "sm" }}
                  color="gray.200"
                  bg="gray.800"
                  px={{ base: 2.5, sm: 3 }}
                  py={{ base: 1.5, sm: 2 }}
                  rounded="md"
                  textAlign="center"
                  whiteSpace="nowrap"
                  w={{ base: "100%", sm: "180px" }}
                  fontWeight="500"
                >
                  Balance: {walletLoading ? 'Loading...' : `₦${(walletBalance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
                </Text>

                <Flex gap={{ base: 2, sm: 3 }} w={{ base: "100%", sm: "auto" }}>
                  <Button
                    onClick={() => {
                      console.log('Refresh button clicked by user at:', new Date().toISOString());
                      dispatch(fetchInitialData());
                    }}
                    isLoading={transactionsLoading || walletLoading || userLoading} // Changed txLoading to transactionsLoading
                    size="sm"
                    bg="#318AE6"
                    color="white"
                    _hover={{ bg: "#2279d8" }}
                    flex={{ base: 1, sm: "0 0 90px" }}
                    fontSize="sm"
                    py={2}
                    px={4}
                    h="36px"
                    fontWeight="500"
                    rounded="md"
                  >
                    Refresh
                  </Button>

                  <Button
                    onClick={() => console.log("Current transactions:", transactions)}
                    size="sm"
                    bg="gray.600"
                    color="white"
                    _hover={{ bg: "gray.700" }}
                    flex={{ base: 1, sm: "0 0 90px" }}
                    fontSize="sm"
                    py={2}
                    px={4}
                    h="36px"
                    fontWeight="500"
                    rounded="md"
                  >
                    Debug
                  </Button>
                </Flex>
              </Flex>
            </Flex>

            {/* Filter and Search Section - More refined */}
            <Flex
              flexDir={{ base: "column", lg: "row" }}
              gap={{ base: 3, sm: 4 }}
              mb={{ base: 4, sm: 5, md: 6 }}
              alignItems={{ base: "stretch", lg: "center" }}
              w="100%"
            >
              <Box
                bg="#111518"
                rounded="lg"
                border="1px"
                borderColor="gray.700"
                p={{ base: 1.5, sm: 2 }}
                w={{ base: "100%", lg: "auto" }}
                flexGrow={{ base: 0, lg: 1 }}
                maxW={{ base: "100%", lg: "70%" }}
              >
                <Flex
                  gap={1}
                  overflowX="auto"
                  css={{
                    '&::-webkit-scrollbar': {
                      height: '4px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#1d2225',
                      borderRadius: '2px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#967532',
                      borderRadius: '2px',
                    },
                  }}
                >
                  {["all", "active", "completed", "cancelled", "wallet"].map(tab => (
                    <Button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      flex="0 0 auto"
                      minW={{ base: "75px", sm: "90px", md: "100px" }}
                      px={{ base: 2, sm: 3 }}
                      py={1.5}
                      fontSize="sm"
                      fontWeight="500"
                      h="32px"
                      bg={activeTab === tab ? "#967532" : "transparent"}
                      color={activeTab === tab ? "white" : "gray.400"}
                      _hover={{ color: "white", bg: activeTab === tab ? "#967532" : "#1d2225" }}
                      rounded="md"
                      transition="all 0.2s"
                    >
                      <Flex align="center" gap={1.5}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        <Text
                          as="span"
                          px={1.5}
                          bg="#1d2225"
                          rounded="full"
                          fontSize="xs"
                          minW="18px"
                          h="18px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontWeight="500"
                        >
                          {tab === "wallet" ? walletTransactions.length
                            : tab === "all" ? transactions.length
                              : transactions.filter(t => tab === "active" ? t.status === "pending" : t.status === tab).length}
                        </Text>
                      </Flex>
                    </Button>
                  ))}
                </Flex>
              </Box>

              <Box
                pos="relative"
                w={{ base: "100%", lg: "280px" }}
                flexShrink={0}
              >
                <FiSearch
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "12px",
                    transform: "translateY(-50%)",
                    color: "#967532",
                    fontSize: "16px"
                  }}
                />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  bg="#111518"
                  borderColor="#967532"
                  color="white"
                  pl={10}
                  pr={10}
                  py={2}
                  fontSize="sm"
                  h="36px"
                  rounded="md"
                  w="100%"
                  _focus={{ borderColor: "#318AE6", boxShadow: "0 0 0 2px rgba(49, 138, 230, 0.3)" }}
                  _hover={{ borderColor: "#318AE6" }}
                />
                {searchQuery && (
                  <IconButton
                    aria-label="Clear search"
                    icon={<MdClose />}
                    pos="absolute"
                    top="50%"
                    right="8px"
                    transform="translateY(-50%)"
                    color="gray.400"
                    _hover={{ color: "white" }}
                    onClick={() => setSearchQuery("")}
                    bg="transparent"
                    size="sm"
                  />
                )}
              </Box>
            </Flex>

            {/* Content Section - More refined spacing */}
            {(transactionsLoading || walletLoading || userLoading) ? (
              <TransactionLoader />
            ) : activeTab === "wallet" ? (
              <Box
                mt={{ base: 4, sm: 5, md: 6 }}
                p={{ base: 4, sm: 5, md: 6 }}
                bg="#111518"
                rounded="lg"
                border="1px"
                borderColor="gray.700"
                w="100%"
              >
                <Text
                  fontSize={{ base: "lg", sm: "xl", md: "2xl" }}
                  fontWeight="600"
                  color="white"
                  mb={{ base: 3, sm: 4 }}
                >
                  Wallet Transaction History
                </Text>

                {walletTransactions.length === 0 ? (
                  <Flex
                    flexDir="column"
                    align="center"
                    justify="center"
                    py={{ base: 8, sm: 12, md: 16 }}
                  >
                    <Text fontSize={{ base: "3xl", sm: "4xl", md: "5xl" }} mb={3} color="gray.400">💳</Text>
                    <Text color="gray.400" fontSize={{ base: "md", sm: "lg" }} textAlign="center">
                      No wallet transactions found.
                    </Text>
                  </Flex>
                ) : (
                  <Box
                    display="grid"
                    gridTemplateColumns={{
                      base: "1fr",
                      sm: "repeat(2, 1fr)",
                      lg: "repeat(3, 1fr)"
                    }}
                    gap={{ base: 3, sm: 4 }}
                    w="100%"
                    css={{
                      '&::-webkit-scrollbar': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#1d2225',
                        borderRadius: '3px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#967532',
                        borderRadius: '3px',
                      },
                    }}
                  >
                    {walletTransactions.map((tx, idx) => (
                      <Box
                        key={`${tx.reference}-${tx.createdAt}-${idx}`}
                        p={{ base: 3, sm: 4 }}
                        bg="#1d2225"
                        rounded="md"
                        border="1px"
                        borderColor="gray.700"
                        _hover={{ borderColor: "#318AE6", transform: "translateY(-1px)", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)" }}
                        transition="all 0.2s"
                        w="100%"
                        maxW="100%"
                        overflow="hidden"
                      >
                        <Flex direction="column" gap={2} w="100%">
                          <Text
                            color="white"
                            fontSize={{ base: "sm", sm: "md" }}
                            fontWeight="500"
                            isTruncated
                            maxW="100%"
                          >
                            {tx.reference}
                          </Text>
                          <Text
                            color={tx.type === "deposit" ? "green.300" : "red.300"}
                            fontSize={{ base: "sm", sm: "md" }}
                            fontWeight="600"
                            isTruncated
                            maxW="100%"
                          >
                            {tx.type === "deposit" ? "+" : "-"} ₦{(tx.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                          </Text>
                          <Text
                            color="gray.400"
                            fontSize="xs"
                            isTruncated
                            maxW="100%"
                          >
                            Purpose: {tx.metadata?.purpose || "N/A"}
                          </Text>
                          <Text
                            color="gray.400"
                            fontSize="xs"
                            isTruncated
                            maxW="100%"
                          >
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "N/A"}
                          </Text>
                        </Flex>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ) : filteredTransactions.length === 0 ? (
              <Flex
                flexDir="column"
                align="center"
                justify="center"
                py={{ base: 8, sm: 12, md: 16 }}
                px={{ base: 4, sm: 6 }}
                w="100%"
              >
                <Text fontSize={{ base: "3xl", sm: "4xl", md: "5xl" }} mb={3} color="gray.400">
                  📭
                </Text>
                <Text
                  color="#E4E4E4"
                  fontSize={{ base: "md", sm: "lg", md: "xl" }}
                  fontWeight="500"
                  textAlign="center"
                  maxW="400px"
                  lineHeight="1.5"
                >
                  {userError
                    ? `Failed to load transactions: ${userError}`
                    : searchQuery
                      ? "No transactions match your search criteria."
                      : activeTab === "all"
                        ? "No transactions found. Create your first transaction to get started."
                        : `No ${activeTab} transactions found.`}
                </Text>
                {(userError || !Array.isArray(transactions)) && (
                  <Button
                    mt={{ base: 4, sm: 6 }}
                    bg="#318AE6"
                    color="white"
                    _hover={{ bg: "#2279d8" }}
                    size="sm"
                    onClick={() => dispatch(fetchInitialData())}
                    px={6}
                    py={2}
                    h="36px"
                    fontWeight="500"
                    rounded="md"
                    w={{ base: "100%", sm: "auto" }}
                  >
                    Try Again
                  </Button>
                )}
              </Flex>
            ) : (
              <Box
                display="grid"
                gridTemplateColumns={{
                  base: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)"
                }}
                gap={{ base: 3, sm: 4, md: 5 }}
                w="100%"
                alignItems="start"
              >
                {filteredTransactions.map(transaction => (
                  <TransactionCard
                    key={transaction._id}
                    transaction={transaction}
                    currentUser={userDetails}
                    isConfirming={isConfirming}
                    handleChat={handleChat}
                    handleWaybill={handleWaybill}
                    handleConfirm={handleConfirm}
                    handleFund={handleFund}
                    handleEditPayment={handleEditPayment}
                    cancelTransaction={cancelTransactionAction}
                    copyToClipboard={copyToClipboard}
                    toggleDescription={toggleDescription}
                    expandedDescriptions={expandedDescriptions}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        {showProfile && (
          <Box
            px={{ base: 4, sm: 5, md: 6, lg: 8 }}
            pt={{ base: "85px", sm: "90px", md: "95px" }}
            pb={{ base: 4, sm: 5, md: 6 }}
            maxW="100%"
            mx="auto"
            overflowX="hidden"
          >
            <Text
              fontSize={{ base: "xl", sm: "2xl", md: "3xl" }}
              fontWeight="600"
              color="white"
              mb={{ base: 4, sm: 5 }}
            >
              Profile
            </Text>
          </Box>
        )}

        {Object.keys(showWaybillPopup).map(transactionId => (
          showWaybillPopup[transactionId] && (
            <WaybillModal
              key={`seller-${transactionId}`}
              isOpen={showWaybillPopup[transactionId]}
              onClose={() => setShowWaybillPopup(prev => ({ ...prev, [transactionId]: false }))}
              transactionId={transactionId}
              isBuyer={false}
              details={waybillDetails}
              setDetails={setWaybillDetails}
              errors={errors}
              handleSubmit={handleWaybillSubmit}
              downloadImage={downloadImage}
            />
          )
        ))}

        {Object.keys(buyerShowWaybillPopup).map(transactionId => (
          buyerShowWaybillPopup[transactionId] && (
            <WaybillModal
              key={`buyer-${transactionId}`}
              isOpen={buyerShowWaybillPopup[transactionId]}
              onClose={() => setBuyerShowWaybillPopup(prev => ({ ...prev, [transactionId]: false }))}
              transactionId={transactionId}
              isBuyer={true}
              details={buyerWaybillDetails[transactionId] || {}}
              setDetails={setBuyerWaybillDetails}
              errors={{}}
              handleSubmit={() => { }}
              downloadImage={downloadImage}
            />
          )
        ))}

        {showPaymentDetailsModal && currentTransaction && (
          <PaymentDetailsModal
            isOpen={showPaymentDetailsModal}
            onClose={() => {
              setShowPaymentDetailsModal(false);
              setCurrentTransaction(null);
              setPaymentDetails({ paymentBank: "", paymentAccountNumber: "", selectedBankCode: "", paymentAmount: "" });
              setPaymentErrors({});
            }}
            transaction={currentTransaction}
            paymentDetails={paymentDetails}
            setPaymentDetails={setPaymentDetails}
            paymentErrors={paymentErrors}
            handleSubmit={handlePaymentSubmit}
          />
        )}

        {isFundingModalOpen && currentTransaction && (
          <FundingModal
            isOpen={isFundingModalOpen}
            onClose={closeFundingModal}
            transaction={currentTransaction}
            walletBalance={walletBalance}
            confirmFunding={confirmFunding}
          />
        )}

        <Modal
          isOpen={modalVisible}
          onClose={() => setModalVisible(false)}
          isCentered
          size={{ base: "xs", sm: "md" }}
        >
          <ModalOverlay />
          <ModalContent
            bg="#1A1E21"
            color="white"
            p={{ base: 4, sm: 5 }}
            rounded="lg"
            mx={{ base: 4, sm: 0 }}
            w={{ base: "100%", sm: "auto" }}
          >
            <ModalHeader>
              <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="600">
                Confirm Transaction
              </Text>
            </ModalHeader>
            <ModalBody>
              <Text fontSize="sm" color="gray.300" lineHeight="1.5">
                Are you sure you want to confirm this transaction? This action cannot be undone.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Flex gap={3} w="100%" flexDir={{ base: "column", sm: "row" }}>
                <Button
                  bg="gray.600"
                  color="white"
                  _hover={{ bg: "gray.700" }}
                  size="sm"
                  onClick={() => setModalVisible(false)}
                  flex={{ base: 1, sm: "0 0 100px" }}
                  h="36px"
                  fontWeight="500"
                  rounded="md"
                >
                  Cancel
                </Button>
                <Button
                  bg="#318AE6"
                  color="white"
                  _hover={{ bg: "#2279d8" }}
                  size="sm"
                  onClick={() => completeTransaction(selectedTransactionId)}
                  isLoading={isConfirming[selectedTransactionId]}
                  flex={{ base: 1, sm: "0 0 100px" }}
                  h="36px"
                  fontWeight="500"
                  rounded="md"
                >
                  Confirm
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>

      <BottomNav />
    </Flex>
  );
};

export default DisplayTransaction;