import React from "react";
import { Box, Flex, Text, Button } from "@chakra-ui/react";
import { MdClose, MdCheck, MdWarning } from "react-icons/md";

const ConfirmTransactionModal = ({ show, onClose, onConfirm, transactionId, transactionDetails }) => {
  if (!show) return null;

  const handleConfirm = () => {
    onConfirm(transactionId);
    onClose();
  };

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0, 0, 0, 0.7)"
      zIndex="999"
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <Box 
        bg="#1A1E21" 
        borderRadius="xl" 
        boxShadow="xl" 
        maxW="500px" 
        w="90%" 
        p={6} 
        position="relative"
        border="1px"
        borderColor="gray.700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <Button 
          position="absolute" 
          top={3} 
          right={3} 
          size="sm" 
          borderRadius="full"
          variant="ghost"
          color="gray.400"
          _hover={{ bg: "whiteAlpha.100", color: "white" }}
          onClick={onClose}
        >
          <MdClose size={20} />
        </Button>
        
        {/* Success icon */}
        <Flex justifyContent="center" mb={4}>
          <Box 
            bg="#111518" 
            borderRadius="full" 
            p={4} 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
          >
            <MdCheck size={30} color="#318AE6" />
          </Box>
        </Flex>
        
        {/* Title */}
        <Text 
          fontSize="xl" 
          fontWeight="bold" 
          textAlign="center" 
          mb={3}
          color="white"
        >
          Complete Transaction
        </Text>
        
        {/* Description */}
        <Text 
          fontSize="md" 
          textAlign="center" 
          mb={5}
          color="gray.300"
        >
          Are you sure you want to mark this transaction as complete? This action cannot be undone.
        </Text>
        
        {/* Warning */}
        <Flex 
          bg="#111518" 
          borderRadius="lg" 
          p={4} 
          mb={5} 
          alignItems="flex-start"
          gap={3}
        >
          <Box color="yellow.500" mt={1}>
            <MdWarning size={20} />
          </Box>
          <Text color="gray.300" fontSize="sm">
            By confirming, you indicate that you've received the item or service as described and are satisfied with the transaction.
          </Text>
        </Flex>
        
        {/* Action buttons */}
        <Flex gap={3}>
          <Button 
            flex={1} 
            variant="outline" 
            borderColor="gray.600" 
            color="gray.300"
            _hover={{ bg: "whiteAlpha.100" }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            flex={1} 
            bg="#318AE6" 
            _hover={{ bg: "#2279d8" }}
            color="white"
            onClick={handleConfirm}
          >
            Confirm Complete
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default ConfirmTransactionModal;