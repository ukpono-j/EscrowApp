// src/utils/toastManager.js
import { useToast } from '@chakra-ui/react';

const toastHistory = new Map();
const TOAST_COOLDOWN = 10000; // 10 seconds

export const useManagedToast = () => {
  const toast = useToast();

  return ({ id, title, description, status, duration = 5000, isClosable = true }) => {
    const key = `${id || title}-${description}`;
    const now = Date.now();
    const lastShown = toastHistory.get(key);

    if (!lastShown || now - lastShown >= TOAST_COOLDOWN) {
      toast({
        title,
        description,
        status,
        duration,
        isClosable,
        position: 'top-right',
      });
      toastHistory.set(key, now);
    }
  };
};