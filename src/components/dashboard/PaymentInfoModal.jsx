import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Box, Text, Button, Card, Flex, IconButton, useToast, useColorModeValue } from '@chakra-ui/react';
import { FaSync } from 'react-icons/fa';
import { MdContentCopy } from 'react-icons/md';
import { useDispatch } from 'react-redux';
import { clearPaymentDetails } from '../../store/slices/walletSlice';

const PaymentInfoModal = ({ isOpen, onClose, paymentDetails, userName, amount, pendingTransactions, handleRefresh }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const bgColor = useColorModeValue('white', '#1A202C');
  const textColor = useColorModeValue('#051E2F', 'white');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400');
  const cardBg = useColorModeValue('gray.50', '#051E2F');
  const borderColor = useColorModeValue('gray.200', '#051E2F');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Text copied to clipboard.', status: 'success', duration: 3000, isClosable: true });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: 'full', sm: 'md' }}>
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius="xl" border="1px" borderColor={borderColor}>
        <ModalHeader color={textColor} fontWeight="bold">Fund Wallet</ModalHeader>
        <ModalCloseButton color={textColor} />
        <ModalBody px={{ base: 4, sm: 6 }} py={4}>
          {paymentDetails?.authorization_url ? (
            <>
              <Text color={textColor} mb={4}>
                Click the button below to proceed with payment of ₦{amount ? amount.toFixed(2) : '0.00'}:
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
                {paymentDetails?.reference && !paymentDetails?.paystackReference
                  ? `Your payment of ₦${amount ? amount.toFixed(2) : '0.00'} is still pending. Please complete the transfer to the virtual account:`
                  : `Transfer ₦${amount ? amount.toFixed(2) : '0.00'} to the account below:`}
              </Text>
              <Card bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
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
              <Text color={subtleTextColor} mt={4} fontSize="sm">
                Your payment will be credited within 5 minutes after transfer. If delayed, click Refresh or contact support.
              </Text>
            </>
          ) : (
            <Box>
              <Text color={textColor} mb={4}>Unable to initiate funding. Try again or contact support.</Text>
              <Button
                bg="#B38939"
                _hover={{ bg: "#BB954D" }}
                color="white"
                onClick={() => {
                  dispatch(clearPaymentDetails());
                  onClose();
                }}
                size={{ base: 'sm', sm: 'md' }}
              >
                Retry
              </Button>
            </Box>
          )}
        </ModalBody>
        <ModalFooter flexDir={{ base: 'column', sm: 'row' }} gap={2}>
          {paymentDetails?.reference || paymentDetails?.paystackReference ? (
            <Button
              leftIcon={<FaSync />}
              bg="#B38939"
              _hover={{ bg: "#BB954D" }}
              color="white"
              onClick={handleRefresh}
              size="sm"
              mr={{ sm: 3 }}
              mb={{ base: 2, sm: 0 }}
            >
              Refresh
            </Button>
          ) : null}
          <Button variant="ghost" color={textColor} _hover={{ bg: useColorModeValue('gray.100', '#051E2F') }} onClick={onClose} size="sm">Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentInfoModal;