import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Box, Flex, Text, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Grid, Stack, Input, IconButton, Image, Circle, Spinner, Skeleton, useDisclosure, useColorModeValue
} from '@chakra-ui/react';
import imageCompression from 'browser-image-compression';
import { FiSearch, FiEdit } from 'react-icons/fi';
import { BsChatFill } from 'react-icons/bs';
import { MdClose, MdCheckCircle, MdPendingActions, MdHourglassEmpty, MdContentCopy } from 'react-icons/md';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchInitialData, fetchSingleTransaction, updateTransaction, confirmTransaction, fundTransaction, cancelTransaction
} from '../../store/slices/thunks';
import { setWallet } from '../../store/slices/walletSlice';
import { setUserDetails, setError } from '../../store/slices/userSlice';
import { useManagedToast } from '../../utils/toastManager';
import Sidebar from './Sidebar';
import MiniNav from './MiniNav';
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

const TransactionSkeleton = () => {
  const cardBg = useColorModeValue('white', '#1A202C');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  return (
    <Skeleton
      startColor={useColorModeValue('gray.100', 'gray.700')}
      endColor={useColorModeValue('gray.200', 'gray.600')}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      bg={cardBg}
      p={4}
      h="300px"
    />
  );
};

const TransactionLoader = () => {
  const textColor = useColorModeValue('#051E2F', 'white');
  return (
    <Flex align="center" justify="center" h="50vh" direction="column" gap={4}>
      <Spinner color="#BB954D" size="lg" />
      <Text color={textColor} fontSize="md">Loading transactions...</Text>
    </Flex>
  );
};

const TransactionCard = React.memo(({ transaction, currentUser, isConfirming, handleChat, handleWaybill, handleConfirm, handleFund, handleEditPayment, openCancelModal, copyToClipboard, toggleDescription, expandedDescriptions }) => {
  const managedToast = useManagedToast();
  const currentUserId = currentUser
    ? currentUser._id || currentUser.id || currentUser.user?.id || ''
    : '';
  const creatorId = transaction?.userId?._id ? String(transaction.userId._id) : '';
  const isCreator = currentUserId && currentUserId === creatorId;
  const participant = transaction?.participants?.find(p => p.userId?._id && String(p.userId._id) === currentUserId);
  const isParticipant = !!participant;
  const isBuyer = isCreator ? transaction.selectedUserType === 'buyer' : participant?.role === 'buyer';
  const hasConfirmed = isBuyer ? transaction.buyerConfirmed : transaction.sellerConfirmed;
  const hasRequestedCancel = isCreator
    ? transaction.cancelConfirmations?.creator
    : transaction.cancelConfirmations?.participant;
  const creatorName = isCreator
    ? `${currentUser?.firstName || currentUser?.user?.firstName || ''} ${currentUser?.lastName || currentUser?.user?.lastName || ''}`.trim() || currentUser?.email || currentUser?.user?.email || 'You'
    : `${transaction?.userId?.firstName || ''} ${transaction?.userId?.lastName || ''}`.trim() || transaction?.userId?.email || 'Unknown';
  const participantName = transaction?.participants?.length > 0 && transaction.participants[0]?.userId
    ? `${transaction.participants[0].userId.firstName || ''} ${transaction.participants[0].userId.lastName || ''}`.trim() || transaction.participants[0].userId.email || 'Unknown'
    : 'No participant';
  const headerText = `${transaction.selectedUserType.charAt(0).toUpperCase() + transaction.selectedUserType.slice(1)}: ${creatorName}${isCreator ? ' (You)' : ''}  ${transaction.selectedUserType === 'buyer' ? 'Seller' : 'Buyer'}: ${participantName}${isParticipant ? ' (You)' : ''}`;
  const description = transaction?.productDetails?.description || 'No description';
  const isExpanded = expandedDescriptions[transaction._id];
  const truncatedDescription = description.length > 80 && !isExpanded ? `${description.substring(0, 80)}...` : description;
  const cardBg = useColorModeValue('white', '#1A202C');
  const textColor = useColorModeValue('#051E2F', 'white');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Step Progress Logic
  const getTransactionSteps = () => {
    const steps = [];

    if (isBuyer) {
      steps.push(
        { id: 1, title: "Fund Transaction", description: "Secure your payment in escrow", completed: transaction.locked, current: !transaction.locked && transaction.status === "pending" },
        { id: 2, title: "Seller Delivers", description: "Wait for seller to ship and provide waybill", completed: transaction.status === "funded" || transaction.status === "completed", current: transaction.locked && transaction.status === "funded" },
        { id: 3, title: "Confirm Receipt", description: "Confirm you received the item", completed: transaction.status === "completed", current: transaction.status === "funded" && !hasConfirmed }
      );
    } else {
      steps.push(
        { id: 1, title: "Wait for Payment", description: "Buyer needs to fund the transaction", completed: transaction.locked, current: !transaction.locked && transaction.status === "pending" },
        { id: 2, title: "Ship & Submit Waybill", description: "Ship item and provide tracking details", completed: transaction.status === "funded" || transaction.status === "completed", current: transaction.locked && transaction.status !== "completed" },
        { id: 3, title: "Transaction Complete", description: "Funds released when buyer confirms", completed: transaction.status === "completed", current: transaction.status === "funded" && !hasConfirmed }
      );
    }

    return steps;
  };

  const steps = getTransactionSteps();
  const currentStep = steps.find(step => step.current)?.id || (transaction.status === "completed" ? steps.length : 1);

  if (!currentUserId) {
    console.warn('TransactionCard: currentUserId is empty, currentUser:', currentUser);
    return (
      <MotionBox
        bg={cardBg}
        p={4}
        rounded="lg"
        border="1px"
        borderColor={borderColor}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Text color="red.400" fontSize="sm">Error: User data not loaded. Please refresh or log in again.</Text>
      </MotionBox>
    );
  }

  const handleEditClick = () => {
    if (!isCreator) {
      managedToast({
        id: `edit-restricted-${transaction._id}`,
        title: 'Restricted',
        description: 'Only the creator can make changes to this transaction.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    handleEditPayment(transaction);
  };

  const isCanceled = transaction.status === 'canceled';

  return (
    <MotionBox
      bg={cardBg}
      p={4}
      rounded="lg"
      border="1px"
      borderColor={borderColor}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Flex justify="space-between" align="center" mb={3}>
        <Box>
          <Text fontSize="sm" fontWeight="600" color={textColor}>
            {transaction.selectedUserType.charAt(0).toUpperCase() + transaction.selectedUserType.slice(1)}: {creatorName}{isCreator ? ' (You)' : ''}
          </Text>
          <Text fontSize="sm" fontWeight="600" color={textColor}>
            {transaction.selectedUserType === 'buyer' ? 'Seller' : 'Buyer'}: {participantName}{isParticipant ? ' (You)' : ''}
          </Text>
        </Box>
        <Flex gap={2}>
          <IconButton
            aria-label="Edit payment"
            icon={<FiEdit />}
            size="sm"
            color={subtleTextColor}
            bg="transparent"
            _hover={{ color: "#BB954D" }}
            onClick={handleEditClick}
            isDisabled={!isCreator || isCanceled}
          />
          <IconButton
            aria-label="Open chat"
            icon={<BsChatFill />}
            size="sm"
            color={subtleTextColor}
            bg="transparent"
            _hover={{ color: "#BB954D" }}
            onClick={() => handleChat(transaction._id)}
            isDisabled={isCanceled}
          />
        </Flex>
      </Flex>

      {/* Compact Step Progress */}
      {!isCanceled && (
        <Flex align="center" justify="space-between" mb={3} p={2} bg={useColorModeValue('#BB954D10', '#BB954D20')} rounded="md">
          <Flex align="center" gap={2}>
            {steps.map((step) => (
              <Circle
                key={step.id}
                size="18px"
                bg={step.completed ? "#22c55e" : step.current ? "#BB954D" : subtleTextColor}
                color="white"
                fontSize="10px"
                fontWeight="600"
              >
                {step.completed ? "✓" : step.id}
              </Circle>
            ))}
          </Flex>
          <Text fontSize="xs" color="#BB954D" fontWeight="500">
            Step {currentStep}/3: {steps.find(step => step.current)?.title || "Complete"}
          </Text>
        </Flex>
      )}

      <Flex justify="space-between" align="center" mb={3}>
        <Box>
          <Text fontSize="xs" color={subtleTextColor}>Amount</Text>
          <Text fontSize="lg" color="#BB954D" fontWeight="600">
            {transaction.paymentAmount ? `₦${parseFloat(transaction.paymentAmount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "N/A"}
          </Text>
        </Box>
        <Box textAlign="right">
          <Text
            bg={transaction.status === "completed" ? "#22c55e" : transaction.status === "canceled" ? "#ef4444" : transaction.status === "funded" ? "#FFA500" : "#BB954D"}
            color="white"
            px={2}
            py={1}
            rounded="sm"
            fontSize="xs"
            fontWeight="500"
          >
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </Text>
        </Box>
      </Flex>

      <Box mb={3}>
        <Text fontSize="xs" color={subtleTextColor}>Escrow</Text>
        <Text fontSize="sm" color={transaction.locked && transaction.status !== "completed" ? "#BB954D" : transaction.status === "completed" ? "#22c55e" : subtleTextColor} fontWeight="500">
          {transaction.locked && transaction.status !== "completed"
            ? `Locked: ₦${parseFloat(transaction.lockedAmount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
            : transaction.status === "completed"
              ? `Released: ₦${parseFloat(transaction.paymentAmount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
              : "Not Locked"}
        </Text>
      </Box>

      <Box mb={3}>
        <Text fontSize="xs" color={subtleTextColor}>Contact</Text>
        <Text fontSize="sm" color={textColor}>{transaction.email || "N/A"}</Text>
      </Box>
      <Box mb={3}>
        <Text fontSize="xs" color={subtleTextColor}>Created</Text>
        <Text fontSize="sm" color={textColor}>{transaction.createdAt ? format(new Date(transaction.createdAt), "MMM dd, yyyy") : "N/A"}</Text>
      </Box>

      <Box mb={3}>
        <Text fontSize="xs" color={subtleTextColor}>Transaction ID</Text>
        <Flex align="center" gap={2}>
          <Text fontSize="xs" color={subtleTextColor} isTruncated>{transaction._id}</Text>
          <IconButton aria-label="Copy ID" icon={<MdContentCopy />} size="xs" color={subtleTextColor} bg="transparent" _hover={{ color: "#8a6d27" }} onClick={() => copyToClipboard(transaction._id)} />
        </Flex>
      </Box>

      <Box mb={3}>
        <Text fontSize="xs" color={subtleTextColor}>Description</Text>
        <Text fontSize="sm" color={textColor} onClick={() => description.length > 80 && toggleDescription(transaction._id)} cursor={description.length > 80 ? "pointer" : "default"}>
          {truncatedDescription}
        </Text>
        {description.length > 80 && (
          <Text fontSize="xs" color="#8a6d27" mt={1} cursor="pointer" onClick={() => toggleDescription(transaction._id)}>
            {isExpanded ? "Show less" : "Read more"}
          </Text>
        )}
      </Box>



      {!isCanceled && (
        <Stack spacing={2}>
          {!((isCreator && transaction.selectedUserType === 'buyer') || (isParticipant && participant?.role === 'buyer')) && (
            <Button
              onClick={() => handleWaybill(transaction._id, false)}
              bg="#8a6d27"
              color="white"
              _hover={{ bg: "#8a6d27" }}
              size="sm"
              fontWeight="500"
            >
              Submit Waybill
            </Button>
          )}

          {!((isCreator && transaction.selectedUserType === 'seller') || (isParticipant && participant?.role === 'seller')) && (
            <Button
              onClick={() => handleWaybill(transaction._id, true)}
              bg="#8a6d27"
              color="white"
              _hover={{ bg: "#8a6d27" }}
              size="sm"
              fontWeight="500"
            >
              View Waybill
            </Button>
          )}

          {(transaction.status === "pending" || transaction.status === "funded") && (
            <Button
              onClick={() => handleConfirm(transaction._id)}
              bg={hasConfirmed ? "#FFA500" : "#22c55e"}
              color="white"
              _hover={{ bg: hasConfirmed ? "#FFA500" : "#16a34a" }}
              size="sm"
              fontWeight="500"
              isLoading={isConfirming[transaction._id]}
              isDisabled={hasConfirmed}
            >
              {hasConfirmed ? "Pending" : "Complete Transaction"}
            </Button>
          )}

          {!((isCreator && transaction.selectedUserType === 'seller') || (isParticipant && participant?.role === 'seller')) && !transaction.locked && transaction.status === "pending" && (
            <Button onClick={() => handleFund(transaction)} bg="#8a6d27" color="white" _hover={{ bg: "#8a6d27" }} size="sm" fontWeight="500">
              Fund Transaction
            </Button>
          )}

          {(transaction.status === "pending" || transaction.status === "funded") && (
            <Button
              onClick={() => openCancelModal(transaction._id)}
              bg={hasRequestedCancel ? "#FFA500" : "transparent"}
              border={hasRequestedCancel ? "none" : "1px"}
              borderColor="#ef4444"
              color={hasRequestedCancel ? "white" : "#ef4444"}
              _hover={{ bg: hasRequestedCancel ? "#FFA500" : "#ef4444", color: "white" }}
              size="sm"
              fontWeight="500"
              isLoading={isConfirming[transaction._id]}
              isDisabled={hasRequestedCancel}
            >
              {hasRequestedCancel ? "Pending" : "Cancel"}
            </Button>
          )}
        </Stack>
      )}
    </MotionBox>
  );
});

const WaybillModal = React.memo(({ isOpen, onClose, transactionId, isBuyer, details, setDetails, errors, setErrors, handleSubmit, downloadImage, isFunded, isSubmitting, setIsSubmitting, isFetching }) => {
  const bgColor = useColorModeValue('white', '#1A202C');
  const textColor = useColorModeValue('#051E2F', 'white');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = useColorModeValue('gray.50', '#051E2F');
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [hasImageError, setHasImageError] = useState(false);
  const [imageRetryCount, setImageRetryCount] = useState(0);
  const maxRetries = 3;
  const retryDelay = 1000;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB before compression' }));
      return;
    }

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

      if (compressedFile.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Compressed image size must be less than 2MB' }));
        return;
      }

      const compressedFileWithName = new File([compressedFile], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });
      const imageUrl = URL.createObjectURL(compressedFileWithName);
      setDetails({ ...details, image: compressedFileWithName, imagePreview: imageUrl });
      setErrors(prev => ({ ...prev, image: undefined }));
    } catch (error) {
      console.error('WaybillModal - Image compression failed:', error);
      setErrors(prev => ({ ...prev, image: 'Failed to compress image. Please try another image.' }));
    }
  };

  const handleImageError = (e) => {
    console.error('WaybillModal - Failed to load image:', details.image, e);
    if (imageRetryCount < maxRetries) {
      console.log(`Retrying image load (${imageRetryCount + 1}/${maxRetries}) for URL:`, details.image);
      setTimeout(() => {
        setImageRetryCount(prev => prev + 1);
        setIsImageLoading(true); // Reset loading state to retry
      }, retryDelay);
    } else {
      setErrors(prev => ({ ...prev, image: 'Failed to load image. It may not exist or is inaccessible.' }));
      setIsImageLoading(false);
      setHasImageError(true);
    }
  };

  const handleImageLoad = () => {
    console.log('WaybillModal - Image loaded successfully:', details.image);
    setIsImageLoading(false);
    setHasImageError(false);
    setImageRetryCount(0); // Reset retry count on success
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: 'full', sm: 'md' }}>
      <ModalOverlay />
      <ModalContent bg={bgColor} color={textColor} p={4} rounded="lg" border="1px" borderColor={borderColor}>
        <ModalHeader fontSize="lg" fontWeight="600">{isBuyer ? 'Waybill Details' : 'Submit Waybill'}</ModalHeader>
        <ModalBody>
          {isBuyer ? (
            isFetching ? (
              <Flex align="center" justify="center" direction="column" gap={4} py={8}>
                <Spinner color="#BB954D" size="lg" />
                <Text color={textColor} fontSize="md">Loading waybill details...</Text>
              </Flex>
            ) : !details || Object.keys(details).length === 0 ? (
              <Text fontSize="sm" color={textColor} textAlign="center">
                No waybill details uploaded yet
              </Text>
            ) : (
              <Stack spacing={3}>
                {[
                  { label: 'Item', value: details.item || 'N/A' },
                  { label: 'Shipping/Arrival Address', value: details.shippingAddress || 'N/A' },
                  { label: 'Tracking Number', value: details.trackingNumber || 'N/A' },
                  { label: 'Delivery/Arrival Date', value: details.deliveryDate ? format(new Date(details.deliveryDate), 'MMM dd, yyyy') : 'N/A' },
                ].map(({ label, value }, idx) => (
                  <Box key={idx}>
                    <Text fontSize="xs" color={subtleTextColor}>{label}</Text>
                    <Text fontSize="sm" color={textColor}>{value}</Text>
                  </Box>
                ))}
                <Box>
                  <Text fontSize="xs" color={subtleTextColor}>Image</Text>

                  {details.image && !hasImageError ? (
                    <Flex direction="column" mt={4} gap={2}>
                      {(isFetching || isImageLoading) && (
                        <Flex align="center" justify="center" h="200px" bg={inputBg} rounded="md">
                          <Spinner color="#BB954D" size="md" />
                        </Flex>
                      )}
                      <Image
                        src={`${details.image}?cache=${Date.now()}`} // Add cache-busting query
                        alt="Waybill"
                        maxW="100%"
                        maxH="300px"
                        rounded="md"
                        objectFit="contain"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        display={(isFetching || isImageLoading) ? 'none' : 'block'}
                        fallbackSrc="/fallback-image.png" // Add a fallback image
                      />
                      <Button
                        size="sm"
                        bg="#8a6d27"
                        color="white"
                        _hover={{ bg: '#b38939' }}
                        onClick={() => downloadImage(details.image)}
                        isDisabled={!details.image || hasImageError}
                      >
                        Download Image
                      </Button>
                    </Flex>
                  ) : (
                    <Text fontSize="sm" color={subtleTextColor}>No image available</Text>
                  )}
                  {errors.image && hasImageError && <Text fontSize="xs" color="red.400">{errors.image}</Text>}
                </Box>
              </Stack>
            )
          ) : !isFunded ? (
            <Text fontSize="sm" color="red.400" textAlign="center">
              Seller cannot fill or carry out waybill until buyer has funded the transaction.
            </Text>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(transactionId); }}>
              <Stack spacing={3}>
                {[
                  { label: 'Item', key: 'item', type: 'text', isReadOnly: true },
                  { label: 'Shipping/Arrival Address', key: 'shippingAddress', type: 'text' },
                  { label: 'Tracking Number', key: 'trackingNumber', type: 'text' },
                  { label: 'Delivery/Arrival Date', key: 'deliveryDate', type: 'date' },
                ].map(({ label, key, type, isReadOnly }) => (
                  <Box key={key}>
                    <Text fontSize="xs" color={subtleTextColor}>{label}</Text>
                    <Input
                      type={type}
                      value={details[key] || ''}
                      onChange={(e) => setDetails({ ...details, [key]: e.target.value })}
                      bg={inputBg}
                      borderColor={borderColor}
                      color={textColor}
                      size="sm"
                      _focus={{ borderColor: '#BB954D' }}
                      isReadOnly={isReadOnly}
                    />
                    {errors[key] && <Text color="red.400" fontSize="xs">{errors[key]}</Text>}
                  </Box>
                ))}
                <Box>
                  <Text fontSize="xs" color={subtleTextColor}>Image</Text>
                  <Box border="1px dashed" borderColor={borderColor} p={4} textAlign="center" rounded="md">
                    <Input
                      type="file"
                      id={`waybill-image-${transactionId}`}
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                      display="none"
                    />
                    <label htmlFor={`waybill-image-${transactionId}`} style={{ cursor: 'pointer' }}>
                      <Text fontSize="sm" color={subtleTextColor}>
                        {details.image ? 'Change Image' : 'Upload Image'}
                      </Text>
                    </label>
                    {details.imagePreview && (
                      <Box mt={2}>
                        <Image src={details.imagePreview} alt="Waybill preview" maxW="100%" maxH="200px" rounded="md" objectFit="contain" />
                        <Text fontSize="xs" color={subtleTextColor} mt={1}>{details.image.name}</Text>
                      </Box>
                    )}
                    {errors.image && <Text color="red.400" fontSize="xs">{errors.image}</Text>}
                  </Box>
                </Box>
              </Stack>
            </form>
          )}
        </ModalBody>
        <ModalFooter>
          <Flex gap={3} w="full">
            <Button size="sm" bg={useColorModeValue('gray.200', 'gray.600')} color={textColor} _hover={{ bg: useColorModeValue('gray.300', 'gray.700') }} onClick={onClose}>
              Close
            </Button>
            {!isBuyer && isFunded && (
              <Button
                size="sm"
                bg="#BB954D"
                color="white"
                _hover={{ bg: '#8a6d2f' }}
                onClick={() => handleSubmit(transactionId)}
                isLoading={isSubmitting}
                isDisabled={isSubmitting}
              >
                Submit
              </Button>
            )}
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

const PaymentDetailsModal = ({ isOpen, onClose, transaction, paymentDetails, setPaymentDetails, paymentErrors, handleSubmit }) => {
  const bgColor = useColorModeValue('white', '#1A202C');
  const textColor = useColorModeValue('#051E2F', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = useColorModeValue('gray.50', '#051E2F');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", sm: "sm" }}>
      <ModalOverlay />
      <ModalContent bg={bgColor} color={textColor} p={4} rounded="lg" border="1px" borderColor={borderColor}>
        <ModalHeader fontSize="lg" fontWeight="600">Edit Payment</ModalHeader>
        <ModalBody>
          <Box>
            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>Amount</Text>
            <Input
              type="number"
              value={paymentDetails.paymentAmount || ""}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentAmount: e.target.value })}
              bg={inputBg}
              borderColor={borderColor}
              color={textColor}
              size="sm"
              _focus={{ borderColor: "#BB954D" }}
              isDisabled={transaction?.locked}
            />
            {paymentErrors.paymentAmount && <Text color="red.400" fontSize="xs" mt={1}>{paymentErrors.paymentAmount}</Text>}
          </Box>
        </ModalBody>
        <ModalFooter>
          <Flex gap={3} w="full">
            <Button size="sm" bg={useColorModeValue('gray.200', 'gray.600')} color={textColor} _hover={{ bg: useColorModeValue('gray.300', 'gray.700') }} onClick={onClose}>Cancel</Button>
            <Button size="sm" bg="#BB954D" color="white" _hover={{ bg: "#967532" }} onClick={handleSubmit}>Save</Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const FundingModal = ({ isOpen, onClose, transaction, walletBalance, confirmFunding, isLoading, fetchWalletBalance }) => {
  const bgColor = useColorModeValue('white', '#1A202C');
  const textColor = useColorModeValue('#051E2F', 'white');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

const DisplayTransaction = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userDetails, loading: userLoading, error: userError } = useSelector(state => state.user);
  const { transactions, loading: transactionsLoading, error: transactionsError } = useSelector(state => state.transactions);
  const { wallet, transactions: walletTransactions, loading: walletLoading } = useSelector(state => state.wallet);
  const [walletBalance, setWalletBalance] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasFetchedInitially, setHasFetchedInitially] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [waybillDetails, setWaybillDetails] = useState({ item: '', image: null, imagePreview: null, shippingAddress: '', trackingNumber: '', deliveryDate: '' });
  const [buyerWaybillDetails, setBuyerWaybillDetails] = useState({});
  const [errors, setErrors] = useState({});
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({ paymentAmount: '' });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [isConfirming, setIsConfirming] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelTransactionId, setCancelTransactionId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSocketFetch, setLastSocketFetch] = useState(0);
  const maxRetries = 3;
  const socketFetchCooldown = 5000;
  const managedToast = useManagedToast();
  const { isOpen: isFundingModalOpen, onOpen: openFundingModal, onClose: closeFundingModal } = useDisclosure();
  const [showWaybillPopup, setShowWaybillPopup] = useState({});
  const [buyerShowWaybillPopup, setBuyerShowWaybillPopup] = useState({});
  const bgColor = useColorModeValue('gray.100', '#051E2F');
  const cardBg = useColorModeValue('white', '#1A202C');
  const textColor = useColorModeValue('#051E2F', 'white');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = useColorModeValue('gray.50', '#051E2F');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingWaybill, setIsFetchingWaybill] = useState({});
  const [socketErrorShown, setSocketErrorShown] = useState(false);

   useEffect(() => {
    // Trigger fetchInitialData on component mount to ensure latest transactions are loaded
    debouncedFetchInitialData();
  }, []); // Empty dependency array ensures this runs only on mount

  useEffect(() => {
    const token = localStorage.getItem('access-token');
    if (!token) {
      managedToast({ id: 'auth-error', title: 'Authentication Required', description: 'Please log in.', status: 'error', duration: 3000, isClosable: true });
      navigate('/');
      return;
    }

    if (!hasFetchedInitially) {
      console.log('Fetching initial data');
      dispatch(fetchInitialData()).unwrap().then((payload) => {
        console.log('Initial data fetched:', payload);
        const normalizedUserDetails = payload.userDetails
          ? {
            id: payload.userDetails.id || payload.userDetails._id || null,
            firstName: payload.userDetails.firstName || '',
            lastName: payload.userDetails.lastName || '',
            email: payload.userDetails.email || '',
          }
          : { id: null, firstName: '', lastName: '', email: '' };
        dispatch(setUserDetails(normalizedUserDetails));
        setWalletBalance(payload.wallet?.balance ?? 0);
        setHasFetchedInitially(true);
        setRetryCount(0);
      }).catch(err => {
        console.error('Initial data fetch error:', err);
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => dispatch(fetchInitialData()), 1000 * (retryCount + 1));
        } else {
          dispatch(setError(err.message || 'Unable to fetch user data'));
          managedToast({ id: 'fetch-error', title: 'Error', description: err.message || 'Unable to fetch data.', status: 'error', duration: 5000, isClosable: true });
          dispatch(setUserDetails({ id: null, firstName: '', lastName: '', email: '' }));
        }
      });
    }
  }, [dispatch, navigate, hasFetchedInitially, retryCount, managedToast]);

  const fetchWalletBalance = useCallback(async () => {
    const maxAttempts = 5;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const token = localStorage.getItem('access-token');
        if (!token) {
          throw new Error('Authentication token missing');
        }
        const response = await axios.get(`${BASE_URL}/api/wallet/balance`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
        });
        if (response.data.success) {
          const balance = response.data.data.wallet.balance || 0;
          setWalletBalance(balance);
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
          setWalletBalance(wallet?.balance || 0);
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
        }
      }
    }
  }, [dispatch, managedToast, wallet]);

  const debouncedFetchInitialData = useCallback(debounce(() => {
    const now = Date.now();
    if (now - lastSocketFetch < socketFetchCooldown) {
      console.log('Skipping fetchInitialData due to cooldown');
      return;
    }
    setLastSocketFetch(now);
    dispatch(fetchInitialData()).unwrap().then((payload) => {
      console.log('Refreshed data:', payload);
      const normalizedUserDetails = payload.userDetails || { id: null, firstName: '', lastName: '', email: '' };
      dispatch(setUserDetails(normalizedUserDetails));
      dispatch(setWallet({
        user: normalizedUserDetails,
        balance: payload.wallet?.balance ?? 0,
        totalDeposits: payload.wallet?.totalDeposits ?? 0,
        transactions: Array.isArray(payload.wallet?.transactions) ? payload.wallet.transactions : [],
      }));
      setWalletBalance(payload.wallet?.balance ?? 0);
      setHasFetchedInitially(true);
      setRetryCount(0);
    }).catch(err => {
      console.error('Fetch initial data error:', err);
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => debouncedFetchInitialData(), 1000 * (retryCount + 1));
      } else {
        dispatch(setError(err.message || 'Unable to fetch data'));
        managedToast({ id: 'fetch-error', title: 'Error', description: err.message || 'Unable to fetch data.', status: 'error', duration: 5000, isClosable: true });
        dispatch(setUserDetails({ id: null, firstName: '', lastName: '', email: '' }));
      }
    });
  }, 500), [dispatch, retryCount, managedToast, lastSocketFetch]);

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

  useEffect(() => {
    const token = localStorage.getItem('access-token');
    if (!token) return;

    // const socket = io(BASE_URL, {
    //   auth: { token },
    //   reconnection: true,
    //   reconnectionAttempts: 5,
    //   reconnectionDelay: 1000,
    // });

    const refreshAccessToken = async () => {
      try {
        const refreshToken = localStorage.getItem('refresh-token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        const response = await axios.post(`${BASE_URL}/api/auth/refreshToken`, { refreshToken });
        const newAccessToken = response.data.accessToken;
        if (!newAccessToken) {
          throw new Error('No access token returned from refresh');
        }
        localStorage.setItem('access-token', newAccessToken);
        return newAccessToken;
      } catch (error) {
        console.error('Token refresh failed:', error);
        managedToast({
          id: 'session-expired',
          title: 'Session Expired',
          description: 'Please log in again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/login');
        return null;
      }
    };

    const socket = io(BASE_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,  // Increased reconnection attempts
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,  // Added connection timeout
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,  // Increased ping timeout
      pingInterval: 25000,
    });
    const joinedRooms = new Set();

    socket.on('connect', () => {
      console.log('WebSocket connected');
      const userId = userDetails?.id || userDetails?.user?.id || 'unknown';
      if (userId && !joinedRooms.has(userId)) {
        socket.emit('join-room', userId);
        joinedRooms.add(userId);
      }
      if (Array.isArray(transactions)) {
        transactions.forEach((t) => {
          if (t?._id && !joinedRooms.has(`transaction_${t._id}`)) {
            socket.emit('join-room', `transaction_${t._id}`);
            joinedRooms.add(`transaction_${t._id}`);
          }
        });
      }
      setSocketErrorShown(false);
    });

    socket.on('connect_error', async (err) => {
      console.error('WebSocket connection error:', err);
      if (err.message.includes('jwt expired')) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          socket.auth.token = newToken;
          socket.connect();
        }
      } else {
        if (!socketErrorShown) {
          managedToast({
            id: 'socket-error',
            title: 'Connection Error',
            description: 'Failed to connect to real-time updates. Please check your network or try again later.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          setSocketErrorShown(true);
        }
      }
    });

    socket.on('transactionCreated', (data) => {
      managedToast({
        id: `transaction-created-${Date.now()}`,
        title: 'New Transaction',
        description: 'A new transaction was created.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      if (data?.transactionId) {
        let attempts = 0;
        const maxAttempts = 5;
        const baseDelay = 2000;

        const fetchWithRetry = async () => {
          while (attempts < maxAttempts) {
            try {
              await dispatch(fetchSingleTransaction(data.transactionId)).unwrap();
              return;
            } catch (err) {
              attempts++;
              if (err === 'Transaction not found' && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempts)));
                continue;
              }
              console.error('Failed to fetch new transaction:', err);
              break;
            }
          }
        };

        fetchWithRetry();
      }
    });

    socket.on('transactionCompleted', (data) => {
      if (data?.transactionId && Array.isArray(transactions) && transactions.some((t) => t._id === data.transactionId)) {
        managedToast({
          id: `transaction-completed-${data.transactionId || Date.now()}`,
          title: 'Transaction Completed',
          description: 'A transaction was completed.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        let attempts = 0;
        const maxAttempts = 5;
        const baseDelay = 2000;

        const fetchWithRetry = async () => {
          while (attempts < maxAttempts) {
            try {
              await dispatch(fetchSingleTransaction(data.transactionId)).unwrap();
              return;
            } catch (err) {
              attempts++;
              if (err === 'Transaction not found' && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempts)));
                continue;
              }
              console.warn('Failed to fetch updated transaction:', err);
              managedToast({
                id: `fetch-transaction-error-${data.transactionId}`,
                title: 'Error',
                description: typeof err === 'string' ? err : err?.error || 'Failed to refresh transaction data.',
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
              break;
            }
          }
        };

        fetchWithRetry();
      }
    });

    socket.on('balanceUpdate', (data) => {
      const userId = userDetails?.id || userDetails?.user?.id || 'unknown';
      if (data?.userId === userId) {
        managedToast({
          id: `balance-update-${Date.now()}`,
          title: 'Balance Updated',
          description: 'Your wallet balance updated.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        fetchWalletBalance();
      }
    });

    socket.on('transactionUpdated', async (data) => {
      if (data?.transactionId && Array.isArray(transactions) && transactions.some((t) => t?._id === data.transactionId)) {
        managedToast({
          id: `transaction-updated-${data.transactionId || Date.now()}`,
          title: 'Transaction Updated',
          description: data.message || 'Transaction details updated.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        let attempts = 0;
        const maxAttempts = 5;
        const baseDelay = 2000;

        const fetchWithRetry = async () => {
          while (attempts < maxAttempts) {
            try {
              await dispatch(fetchSingleTransaction(data.transactionId)).unwrap();
              return;
            } catch (err) {
              attempts++;
              if (err === 'Transaction not found' && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempts)));
                continue;
              }
              console.warn('Failed to fetch updated transaction:', err);
              managedToast({
                id: `fetch-transaction-error-${data.transactionId}`,
                title: 'Error',
                description: typeof err === 'string' ? err : err?.error || 'Failed to refresh transaction data.',
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
              break;
            }
          }
        };

        fetchWithRetry();
      } else {
        console.warn('Transaction not found or invalid:', data.transactionId);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('transactionCreated');
      socket.off('transactionCompleted');
      socket.off('balanceUpdate');
      socket.off('transactionUpdated');
      socket.disconnect();
    };
  }, [userDetails, transactions, dispatch, fetchWalletBalance, managedToast]);

  useEffect(() => {
    if (isFundingModalOpen && walletBalance === null) {
      fetchWalletBalance();
    }
  }, [isFundingModalOpen, fetchWalletBalance]);

  const debouncedSearch = useCallback(debounce((value) => setSearchQuery(value), 300), []);

  const filteredTransactions = useMemo(() => {
    console.log('Filtering transactions:', transactions);
    if (!Array.isArray(transactions) || transactions.length === 0) {
      console.log('No transactions or invalid transactions array');
      return [];
    }
    const query = searchQuery.toLowerCase().trim();
    const filtered = transactions.filter(t => {
      if (!t || !t._id) return false;
      if (activeTab === 'active' && t.status !== 'pending' && t.status !== 'funded') return false;
      if (activeTab === 'completed' && t.status !== 'completed') return false;
      if (activeTab === 'canceled' && t.status !== 'canceled') return false;
      const participantName = t.participants?.length > 0 && t.participants[0]?.userId
        ? `${t.participants[0].userId.firstName || ''} ${t.participants[0].userId.lastName || ''}`.trim().toLowerCase() || t.participants[0]?.userId?.email?.toLowerCase() || ''
        : t.userId?.email?.toLowerCase() || '';
      const matches = (
        participantName.includes(query) ||
        (t.productDetails?.description?.toLowerCase() || '').includes(query) ||
        (t.paymentName?.toLowerCase() || '').includes(query) ||
        t._id.toLowerCase().includes(query) ||
        (t.email?.toLowerCase() || '').includes(query)
      );
      console.log(`Transaction ${t._id} matches filter:`, matches);
      return matches;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log('Filtered and sorted transactions:', filtered);
    return filtered;
  }, [transactions, activeTab, searchQuery]);

  const handleChat = async (transactionId) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/transactions/create-chatroom`, { transactionId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access-token')}` },
      });
      if (res.data?.success && res.data.chatroomId) {
        navigate(`/chat/${res.data.chatroomId}`);
      } else {
        throw new Error('Failed to create chatroom');
      }
    } catch (error) {
      managedToast({ id: `chat-error-${transactionId}`, title: 'Error', description: error.response?.data?.error || error.message, status: 'error', duration: 5000, isClosable: true });
    }
  };

  const handleWaybill = (transactionId, isBuyer) => {
    const transaction = transactions.find(t => t._id === transactionId);
    if (!transaction) {
      managedToast({
        id: `waybill-error-${transactionId}`,
        title: 'Error',
        description: 'Transaction not found.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!isBuyer && !transaction?.locked) {
      managedToast({
        id: `waybill-error-${transactionId}`,
        title: 'Action Restricted',
        description: 'Seller cannot fill or carry out waybill until buyer has funded the transaction.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (isBuyer) {
      setBuyerShowWaybillPopup(prev => ({ ...prev, [transactionId]: true }));
      setIsFetchingWaybill(prev => ({ ...prev, [transactionId]: true })); // Initialize loading state
      fetchBuyerWaybillDetails(transactionId);
    } else {
      setShowWaybillPopup(prev => ({ ...prev, [transactionId]: true }));
      setWaybillDetails(prev => ({
        ...prev,
        item: transaction?.productDetails?.description || '',
      }));
    }
  };

  const fetchBuyerWaybillDetails = async (transactionId) => {
    setIsFetchingWaybill(prev => ({ ...prev, [transactionId]: true }));
    try {
      const res = await axios.get(`${BASE_URL}/api/transactions/waybill-details/${transactionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access-token")}` },
      });
      if (res.data?.success && res.data.data) {
        setBuyerWaybillDetails(prev => ({ ...prev, [transactionId]: res.data.data }));
      } else {
        setBuyerWaybillDetails(prev => ({ ...prev, [transactionId]: {} }));
      }
    } catch (error) {
      managedToast({
        id: `waybill-fetch-error-${transactionId}`,
        title: "Error",
        description: "Failed to retrieve waybill details",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setBuyerWaybillDetails(prev => ({ ...prev, [transactionId]: {} }));
    } finally {
      setIsFetchingWaybill(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  const handleWaybillSubmit = async (transactionId) => {
    const newErrors = {};
    ["shippingAddress", "trackingNumber", "deliveryDate"].forEach(key => {
      if (!waybillDetails[key]) newErrors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
    });
    if (!waybillDetails.image) newErrors.image = "Image is required";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const formData = new FormData();
    formData.append("transactionId", transactionId);
    formData.append("item", waybillDetails.item);
    formData.append("shippingAddress", waybillDetails.shippingAddress);
    formData.append("trackingNumber", waybillDetails.trackingNumber);
    formData.append("deliveryDate", waybillDetails.deliveryDate);
    if (waybillDetails.image) formData.append("image", waybillDetails.image);

    console.log('Submitting FormData for waybill:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${typeof value === 'object' ? value.name || 'File object' : value}`);
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(`${BASE_URL}/api/transactions/submit-waybill`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("access-token")}` },
      });
      if (response.data.success) {
        managedToast({ id: `waybill-success-${transactionId}`, title: "Waybill Submitted", description: "Waybill details submitted successfully.", status: "success", duration: 3000, isClosable: true });
        setShowWaybillPopup(prev => ({ ...prev, [transactionId]: false }));
        setWaybillDetails({ item: "", image: null, imagePreview: null, shippingAddress: "", trackingNumber: "", deliveryDate: "" });
        dispatch(fetchSingleTransaction(transactionId)).unwrap().catch(err => {
          console.error('Refresh after waybill submit failed:', err);
        });
      } else {
        throw new Error(response.data.error || "Failed to submit waybill");
      }
    } catch (error) {
      console.error('Waybill submit error:', error);
      const errorMessage = error.response?.data?.error || error.message;
      let displayMessage = errorMessage;
      if (error.response?.status === 400) {
        if (errorMessage.includes("Invalid transaction ID")) {
          displayMessage = "Invalid transaction ID. Please try again.";
        } else if (errorMessage.includes("All fields are required")) {
          displayMessage = "Please fill in all required fields.";
        } else if (errorMessage.includes("Image is required")) {
          displayMessage = "An image is required for the waybill.";
        } else if (errorMessage.includes("Unauthorized")) {
          displayMessage = "You are not authorized to submit waybill details.";
        } else if (errorMessage.includes("Transaction must be funded")) {
          displayMessage = "The transaction must be funded before submitting waybill details.";
        }
      } else if (error.response?.status === 500) {
        displayMessage = errorMessage.includes("upload directory")
          ? "Server error: Unable to save waybill image. Please try again."
          : "Service temporarily unavailable. Please try again later.";
      }
      managedToast({
        id: `waybill-error-${transactionId}`,
        title: "Error",
        description: displayMessage,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadImage = async (url) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Failed to fetch image for download:', response.statusText);
        return;
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = url.split("/").pop() || "waybill-image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl); // Clean up
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const openCancelModal = (transactionId) => {
    setCancelTransactionId(transactionId);
    setCancelModalVisible(true);
  };

  const cancelTransactionAction = async (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
    try {
      const response = await dispatch(cancelTransaction(transactionId)).unwrap();
      managedToast({
        id: `cancel-success-${transactionId}`,
        title: 'Cancellation Requested',
        description: response.message.includes('Waiting')
          ? response.message
          : response.refunded > 0
            ? `Transaction cancelled. Refunded ₦${response.refunded.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
            : 'Transaction cancelled successfully.',
        status: response.message.includes('Waiting') ? 'info' : 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage = error.error || 'Failed to cancel transaction';
      if (errorMessage === 'Unauthorized to cancel this transaction') {
        managedToast({
          id: `cancel-unauthorized-${transactionId}`,
          title: 'Unauthorized',
          description: 'You are not authorized to cancel this transaction.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (errorMessage === 'Only pending or funded transactions can be cancelled') {
        managedToast({
          id: `cancel-status-error-${transactionId}`,
          title: 'Invalid Status',
          description: 'Only pending or funded transactions can be cancelled.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        managedToast({
          id: `cancel-error-${transactionId}`,
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
      setCancelModalVisible(false);
      setCancelTransactionId(null);
    }
  };

  const handleConfirm = async (transactionId) => {
    const userId = userDetails?.id || userDetails?.user?.id || 'unknown';
    if (isConfirming[transactionId] || !userId) return;
    setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
    const transaction = transactions.find(t => t._id === transactionId);
    if (!transaction || !transaction.userId?._id || !transaction.participants?.length || (transaction.status !== 'pending' && transaction.status !== 'funded')) {
      managedToast({
        id: `confirm-error-${transactionId}`,
        title: 'Error',
        description: !transaction ? 'Transaction not found' : !transaction.userId?._id ? 'Transaction owner not found' : !transaction.participants?.length ? 'No participant' : 'Only pending or funded transactions can be confirmed',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
      return;
    }

    const isCreator = userId === transaction.userId._id.toString();
    const participant = transaction.participants.find(p => p.userId.toString() === userId);
    const isBuyer = isCreator ? transaction.selectedUserType === 'buyer' : participant?.role === 'buyer';

    if (isBuyer && !transaction.locked) {
      try {
        const amount = parseFloat(transaction.paymentAmount);
        if (isNaN(amount)) throw new Error('Invalid payment amount');
        await fetchWalletBalance();
        if (walletBalance >= amount) {
          await dispatch(fundTransaction({ transactionId: transaction._id, amount })).unwrap();
          managedToast({ id: `fund-success-${transaction._id}`, title: 'Funded', description: 'Funded from wallet.', status: 'success', duration: 5000, isClosable: true });
        } else {
          setCurrentTransaction(transaction);
          openFundingModal();
          setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
          return;
        }
      } catch (error) {
        managedToast({ id: `fund-error-${transaction._id}`, title: 'Error', description: error.message || 'Failed to fund', status: 'error', duration: 5000, isClosable: true });
        setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
        return;
      }
    }

    setSelectedTransactionId(transactionId);
    setModalVisible(true);
    setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
  };

  const completeTransaction = async (transactionId) => {
    if (isConfirming[transactionId]) return;
    setIsConfirming(prev => ({ ...prev, [transactionId]: true }));
    try {
      const response = await dispatch(confirmTransaction(transactionId)).unwrap();
      const transaction = response.transaction; // Extract transaction from response
      managedToast({
        id: `confirm-success-${transactionId}`,
        title: transaction.status === 'completed' ? 'Completed' : 'Confirmation Recorded',
        description: transaction.status === 'completed' ? 'Funds released.' : 'Waiting for other party.',
        status: transaction.status === 'completed' ? 'success' : 'info',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage = error.error || error.message || 'Failed to confirm';
      if (errorMessage === 'Buyer has already confirmed this transaction' || errorMessage === 'Seller has already confirmed this transaction') {
        managedToast({
          id: `confirm-already-${transactionId}`,
          title: 'Already Confirmed',
          description: 'You have already confirmed this transaction. Waiting for the other party.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      } else if (errorMessage.includes && errorMessage.includes('Insufficient funds')) {
        const transaction = transactions.find(t => t._id === transactionId);
        setCurrentTransaction(transaction);
        openFundingModal();
      } else {
        managedToast({
          id: `confirm-error-${transactionId}`,
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsConfirming(prev => ({ ...prev, [transactionId]: false }));
      setModalVisible(false);
      setSelectedTransactionId(null);
    }
  };

  const handleFund = async (transaction) => {
    if (!transaction || !transaction._id || transaction.locked || !transaction.paymentAmount || parseFloat(transaction.paymentAmount) <= 0) {
      managedToast({
        id: `fund-error-${transaction?._id || 'unknown'}`,
        title: 'Error',
        description: 'Invalid transaction.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setCurrentTransaction(transaction);
    await fetchWalletBalance();
    openFundingModal();
  };

  const confirmFunding = async (transaction, setError) => {
    if (!transaction || !transaction.paymentAmount) {
      managedToast({
        id: `fund-error-${transaction?._id || 'unknown'}`,
        title: 'Error',
        description: 'Invalid transaction.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      closeFundingModal();
      return;
    }
    setIsConfirming(prev => ({ ...prev, [transaction._id]: true }));
    try {
      const amount = parseFloat(transaction.paymentAmount);
      if (isNaN(amount)) throw new Error('Invalid payment amount');
      await dispatch(fundTransaction({ transactionId: transaction._id, amount })).unwrap();
      managedToast({
        id: `fund-success-${transaction._id}`,
        title: 'Funded',
        description: 'Funded from wallet.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      closeFundingModal();
      await fetchWalletBalance();
      dispatch(fetchSingleTransaction(transaction._id)).unwrap().catch(err => {
        console.error('Refresh after funding failed:', err);
      });
    } catch (error) {
      if (error.message?.includes('Insufficient')) {
        setError('Insufficient wallet balance. Please top up your wallet in your Profile to fund this transaction.');
      } else {
        managedToast({
          id: `fund-error-${transaction._id}`,
          title: 'Error',
          description: error.message || 'Failed to fund',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsConfirming(prev => ({ ...prev, [transaction._id]: false }));
    }
  };

  const handleEditPayment = (transaction) => {
    if (!transaction || !transaction._id) {
      managedToast({
        id: `edit-error-${transaction?._id || 'unknown'}`,
        title: 'Error',
        description: 'Invalid transaction. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setCurrentTransaction(transaction);
    setPaymentDetails({ paymentAmount: transaction.paymentAmount || "" });
    setShowPaymentDetailsModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!currentTransaction || !currentTransaction._id) {
      managedToast({
        id: `payment-error-no-transaction`,
        title: 'Error',
        description: 'No transaction selected. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setShowPaymentDetailsModal(false);
      setPaymentDetails({ paymentAmount: '' });
      setPaymentErrors({});
      return;
    }

    if (!paymentDetails.paymentAmount || parseFloat(paymentDetails.paymentAmount) <= 0) {
      setPaymentErrors({ paymentAmount: 'Amount must be greater than zero' });
      return;
    }

    setPaymentErrors({});
    try {
      const updatedTransaction = await dispatch(updateTransaction({
        transactionId: currentTransaction._id,
        data: { paymentAmount: parseFloat(paymentDetails.paymentAmount) }
      })).unwrap();
      managedToast({
        id: `payment-success-${currentTransaction._id}`,
        title: 'Updated',
        description: `Payment amount updated to ₦${parseFloat(paymentDetails.paymentAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setShowPaymentDetailsModal(false);
      setCurrentTransaction(null);
      setPaymentDetails({ paymentAmount: '' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        await dispatch(fetchSingleTransaction(currentTransaction._id)).unwrap();
      } catch (err) {
        console.error('Refresh after payment update failed:', err);
        if (err !== 'Resource not found. Retrying may resolve this.') {
          managedToast({
            id: `refresh-error-${currentTransaction._id}`,
            title: 'Error',
            description: typeof err === 'string' ? err : err?.error || 'Failed to refresh transaction data.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('Payment update error:', error);
      const errorMessage = typeof error === 'string'
        ? error
        : error?.message || error?.error || 'Failed to update payment details. Please try again.';
      managedToast({
        id: `payment-error-${currentTransaction._id || 'unknown'}`,
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() =>
      managedToast({ id: `copy-${text}`, title: 'Copied', status: 'success', duration: 2000, isClosable: true })
    );
  };

  const toggleDescription = (transactionId) => {
    setExpandedDescriptions(prev => ({ ...prev, [transactionId]: !prev[transactionId] }));
  };

  const isUserDataLoaded = userDetails && (userDetails.id || userDetails.user?.id || userDetails.email);

  return (
    <Flex minH="100vh" bg={bgColor} direction={{ base: "column", md: "row" }}>
      <Sidebar onShowProfile={() => setShowProfile(true)} onShowToggleComponent={() => setShowProfile(false)} onCollapseChange={setIsSidebarCollapsed} />
      <Box flex={1} p={{ base: 4, md: 6 }} mt={{ base: "80px", md: 0 }} ml={{ base: 0, md: isSidebarCollapsed ? "80px" : "280px" }} overflowY="auto">
        {!showProfile ? (
          <Box maxW="1400px" mx="auto">
            <MiniNav />
            <Flex
              justify="space-between"
              align="start"
              mb={6}
              mt={{ base: 10, md: 20 }}
              flexDir={{ base: "row", md: "row" }}
              gap={4}
            >
              <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="600" color={textColor}>Transactions</Text>
              <Button
                size="md"
                bg="#B38939"
                color="white"
                _hover={{ bg: "#967532" }}
                isLoading={transactionsLoading || walletLoading || userLoading}
                onClick={() => dispatch(fetchInitialData())}
              >
                Refresh
              </Button>
            </Flex>

            <Flex flexDir={{ base: "column", md: "row" }} gap={4} mb={6} mt={6}>
              <Stack direction="row" spacing={3} flexWrap="wrap">
                {["active", "completed", "canceled", "all"].map(tab => (
                  <Button
                    key={tab}
                    size="md"
                    bg={activeTab === tab ? "#8a6d27" : useColorModeValue('gray.200', 'gray.700')}
                    color={activeTab === tab ? "white" : textColor}
                    _hover={{ bg: activeTab === tab ? "#8a6d27" : useColorModeValue('gray.300', 'gray.600') }}
                    onClick={() => setActiveTab(tab)}
                    fontWeight="500"
                    rounded="lg"
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === "all" ? (Array.isArray(transactions) ? transactions.length : 0) : (Array.isArray(transactions) ? transactions.filter(t => tab === "active" ? t.status === "pending" || t.status === "funded" : t.status === tab).length : 0)})
                  </Button>
                ))}
              </Stack>
              <Box pos="relative" w={{ base: "100%", md: "300px", lg: "360px" }} maxW="100%">
                <Flex align="center" bg={cardBg} border="1px" borderColor={borderColor} rounded="lg" px={3} py={2} _focusWithin={{ borderColor: "#BB954D", boxShadow: "0 0 0 1px #BB954D" }}>
                  <FiSearch color={subtleTextColor} size={16} />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => debouncedSearch(e.target.value)}
                    bg="transparent"
                    border="none"
                    color={textColor}
                    fontSize="sm"
                    pl={2}
                    _focus={{ outline: "none" }}
                    _placeholder={{ color: subtleTextColor }}
                  />
                  {searchQuery && (
                    <IconButton
                      aria-label="Clear search"
                      icon={<MdClose />}
                      size="xs"
                      bg="transparent"
                      color={subtleTextColor}
                      _hover={{ color: textColor }}
                      onClick={() => setSearchQuery("")}
                    />
                  )}
                </Flex>
              </Box>
            </Flex>

            {transactionsLoading || walletLoading || userLoading ? (
              <TransactionLoader />
            ) : transactionsError ? (
              <Flex direction="column" align="center" justify="center" py={8}>
                <Text fontSize="2xl" color={subtleTextColor}>⚠️</Text>
                <Text color={subtleTextColor} fontSize="md" textAlign="center">Failed to load: {transactionsError}</Text>
                <Button mt={4} size="md" bg="#BB954D" color="white" _hover={{ bg: "#967532" }} onClick={() => dispatch(fetchInitialData())}>Retry</Button>
              </Flex>
            ) : !Array.isArray(transactions) || transactions.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py={8}>
                <Text fontSize="2xl" color={subtleTextColor}>📭</Text>
                <Text color={subtleTextColor} fontSize="md" textAlign="center">
                  No transactions available.
                </Text>
                <Button mt={4} size="md" bg="#BB954D" color="white" _hover={{ bg: "#967532" }} onClick={() => dispatch(fetchInitialData())}>Retry</Button>
              </Flex>
            ) : filteredTransactions.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py={8}>
                <Text fontSize="2xl" color={subtleTextColor}>📭</Text>
                <Text color={subtleTextColor} fontSize="md" textAlign="center">
                  {searchQuery
                    ? "No matches found."
                    : activeTab === "active"
                      ? "No active transactions at the moment."
                      : activeTab === "completed"
                        ? "No completed transactions at the moment."
                        : activeTab === "canceled"
                          ? "No canceled transactions at the moment."
                          : "No transactions available at the moment."}
                </Text>
                <Button mt={4} size="md" bg="#BB954D" color="white" _hover={{ bg: "#967532" }} onClick={() => dispatch(fetchInitialData())}>Retry</Button>
              </Flex>
            ) : (
              <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
                {filteredTransactions.map((transaction, index) => (
                  <TransactionCard
                    key={`${transaction._id}-${index}`}
                    transaction={transaction}
                    currentUser={userDetails || {}}
                    isConfirming={isConfirming}
                    handleChat={handleChat}
                    handleWaybill={handleWaybill}
                    handleConfirm={handleConfirm}
                    handleFund={handleFund}
                    handleEditPayment={handleEditPayment}
                    openCancelModal={openCancelModal}
                    copyToClipboard={copyToClipboard}
                    toggleDescription={toggleDescription}
                    expandedDescriptions={expandedDescriptions}
                  />
                ))}
              </Grid>
            )}
          </Box>
        ) : (
          <Box maxW="1400px" mx="auto">
            <Text fontSize="2xl" fontWeight="600" color={textColor} mb={4}>Profile</Text>
          </Box>
        )}

        {Object.entries(showWaybillPopup).map(([transactionId, isOpen]) => isOpen && (
          <WaybillModal
            key={`seller-${transactionId}`}
            isOpen={isOpen}
            onClose={() => {
              setShowWaybillPopup(prev => ({ ...prev, [transactionId]: false }));
              setWaybillDetails({ item: "", image: null, imagePreview: null, shippingAddress: "", trackingNumber: "", deliveryDate: "" });
              setErrors({});
            }}
            transactionId={transactionId}
            isBuyer={false}
            details={waybillDetails}
            setDetails={setWaybillDetails}
            errors={errors}
            setErrors={setErrors}
            handleSubmit={handleWaybillSubmit}
            downloadImage={downloadImage}
            isFunded={transactions.find(t => t._id === transactionId)?.locked}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            isFetching={isFetchingWaybill[transactionId] || false}
          />
        ))}

        {Object.entries(buyerShowWaybillPopup).map(([transactionId, isOpen]) => isOpen && (
          <WaybillModal
            key={`buyer-${transactionId}`}
            isOpen={isOpen}
            onClose={() => setBuyerShowWaybillPopup(prev => ({ ...prev, [transactionId]: false }))}
            transactionId={transactionId}
            isBuyer={true}
            details={buyerWaybillDetails[transactionId] || {}}
            setDetails={setBuyerWaybillDetails}
            errors={errors}
            handleSubmit={() => { }}
            downloadImage={downloadImage}
            isFunded={true}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            isFetching={isFetchingWaybill[transactionId] || false}
          />
        ))}

        {showPaymentDetailsModal && currentTransaction && (
          <PaymentDetailsModal
            isOpen={showPaymentDetailsModal}
            onClose={() => {
              setShowPaymentDetailsModal(false);
              setCurrentTransaction(null);
              setPaymentDetails({ paymentAmount: "" });
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
            onClose={() => {
              closeFundingModal();
              setCurrentTransaction(null);
              setWalletBalance(null);
            }}
            transaction={currentTransaction}
            walletBalance={walletBalance}
            confirmFunding={confirmFunding}
            isLoading={isConfirming[currentTransaction?._id]}
            fetchWalletBalance={fetchWalletBalance}
          />
        )}

        <Modal isOpen={modalVisible} onClose={() => setModalVisible(false)} isCentered size="sm">
          <ModalOverlay />
          <ModalContent bg={cardBg} color={textColor} p={4} rounded="lg" border="1px" borderColor={borderColor}>
            <ModalHeader fontSize="lg" fontWeight="600">Confirm Transaction</ModalHeader>
            <ModalBody>
              <Text fontSize="sm" color={subtleTextColor}>Are you sure? This cannot be undone.</Text>
            </ModalBody>
            <ModalFooter>
              <Flex gap={3} w="full">
                <Button size="sm" bg={useColorModeValue('gray.200', 'gray.600')} color={textColor} _hover={{ bg: useColorModeValue('gray.300', 'gray.700') }} onClick={() => setModalVisible(false)}>Cancel</Button>
                <Button size="sm" bg="#BB954D" color="white" _hover={{ bg: "#967532" }} onClick={() => completeTransaction(selectedTransactionId)} isLoading={isConfirming[selectedTransactionId]}>Confirm</Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={cancelModalVisible} onClose={() => setCancelModalVisible(false)} isCentered size="sm">
          <ModalOverlay />
          <ModalContent bg={cardBg} color={textColor} p={4} rounded="lg" border="1px" borderColor={borderColor}>
            <ModalHeader fontSize="lg" fontWeight="600">Cancel Transaction</ModalHeader>
            <ModalBody>
              <Text fontSize="sm" color={subtleTextColor}>
                Are you sure you want to cancel this transaction?{' '}
                {transactions.find(t => t._id === cancelTransactionId)?.locked
                  ? 'The other party must also confirm cancellation.'
                  : 'This cannot be undone.'}
              </Text>
            </ModalBody>
            <ModalFooter>
              <Flex gap={3} w="full">
                <Button size="sm" bg={useColorModeValue('gray.200', 'gray.600')} color={textColor} _hover={{ bg: useColorModeValue('gray.300', 'gray.700') }} onClick={() => setCancelModalVisible(false)}>No</Button>
                <Button size="sm" bg="#ef4444" color="white" _hover={{ bg: "#dc2626" }} onClick={() => cancelTransactionAction(cancelTransactionId)} isLoading={isConfirming[cancelTransactionId]}>Yes</Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};

export default DisplayTransaction;