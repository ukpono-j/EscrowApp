import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast, Box, Text, Avatar, VStack, useBreakpointValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { MdMessage } from 'react-icons/md';
import multiavatar from '@multiavatar/multiavatar/esm';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001';
const MotionBox = motion(Box);

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const position = useBreakpointValue({
    base: 'top', // Top for mobile
    md: 'bottom-right', // Bottom-right for desktop
  });

  const getAvatarSvg = (avatarSeed, userId) => {
    try {
      const seed = avatarSeed || userId || 'default-user';
      const svg = multiavatar(seed);
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    } catch (error) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="15" fill="#B38939" />
          <text x="50%" y="50%" font-size="12" fill="white" text-anchor="middle" dominant-baseline="middle">${(avatarSeed || userId || '??').slice(0, 2)}</text>
        </svg>`
      )}`;
    }
  };

  useEffect(() => {
    console.log('NotificationProvider mounted, BASE_URL:', BASE_URL);
    const socket = io(BASE_URL, {
      auth: { token: localStorage.getItem('access-token') },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected for notifications:', socket.id);
      const userId = localStorage.getItem('userId');
      if (userId) {
        socket.emit('join-room', `user_${userId}`, userId);
        console.log('Joined room:', `user_${userId}`);
      } else {
        console.warn('No userId found in localStorage');
        toast({
          title: 'Authentication Error',
          description: 'No user ID found. Please log in again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/login');
      }
    });

    socket.on('newNotification', (notification) => {
      console.log('Received newNotification:', JSON.stringify(notification, null, 2));
      console.log('Current location.pathname:', location.pathname);
      console.log('Notification chatroomId:', notification.chatroomId);
      if (notification.type === 'message' && notification.chatroomId) {
        // Temporarily bypass location check for debugging
        // if (location.pathname !== `/chat/${notification.chatroomId}`) {
          console.log('Triggering alert for notification:', notification._id);
          alert(`New message received: ${notification.title}\n${notification.message}`);
          setNotifications((prev) => {
            const newNotifications = [
              { ...notification, id: `toast-${notification._id || Date.now()}` },
              ...prev.slice(0, 4),
            ];
            console.log('Updated notifications state:', JSON.stringify(newNotifications, null, 2));
            return newNotifications;
          });
        // } else {
        //   console.log('Notification suppressed: User is in chatroom', notification.chatroomId);
        // }
      } else {
        console.warn('Invalid notification:', notification);
      }
    });

    socket.on('connect_error', async (error) => {
      console.error('WebSocket connection error:', error.message);
      if (error.message.includes('Authentication error')) {
        try {
          const response = await fetch(`${BASE_URL}/api/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: localStorage.getItem('refresh-token') }),
          });
          const data = await response.json();
          if (data.token) {
            localStorage.setItem('access-token', data.token);
            socket.auth.token = data.token;
            socket.disconnect().connect();
            console.log('Reconnected with new token');
          } else {
            toast({
              title: 'Session expired',
              description: 'Please log in again',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            navigate('/login');
          }
        } catch (err) {
          console.error('Token refresh failed:', err);
          navigate('/login');
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn('WebSocket disconnected:', reason);
    });

    return () => {
      socket.off('connect');
      socket.off('newNotification');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [toast, navigate, location.pathname]);

  const showNotification = (notification) => {
    console.log('Attempting to show notification:', notification.id);
    if (toast.isActive(notification.id)) {
      console.log('Toast already active for notification:', notification.id);
      return;
    }

    // Play WhatsApp-like notification sound
    const audio = new Audio('/notification.mp3');
    audio.play().catch((err) => console.warn('Audio playback failed:', err));

    // Vibrate on mobile
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    toast({
      id: notification.id,
      position,
      duration: 5000,
      isClosable: true,
      containerStyle: { zIndex: 9999 },
      render: () => (
        <MotionBox
          initial={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          bg="red" // Bright color for debugging
          color="white"
          p={3}
          borderRadius="md"
          boxShadow="lg"
          maxW={{ base: '90vw', md: '300px' }}
          cursor="pointer"
          zIndex={9999}
          _hover={{ bg: 'darkred' }}
          onClick={() => {
            console.log('Toast clicked, navigating to:', `/chat/${notification.chatroomId}`);
            toast.close(notification.id);
            setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
            navigate(`/chat/${notification.chatroomId}`);
          }}
        >
          <VStack align="start" spacing={2}>
            <Avatar
              size="sm"
              src={getAvatarSvg(notification.avatarSeed, notification.userId)}
            />
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="bold">{notification.title}</Text>
              <Text fontSize="xs" noOfLines={2}>{notification.message}</Text>
            </VStack>
          </VStack>
        </MotionBox>
      ),
    });
    console.log('Displayed toast for notification:', notification.id);
  };

  useEffect(() => {
    console.log('Notifications state changed:', notifications.length);
    if (notifications.length > 0) {
      notifications.forEach((notification) => {
        console.log('Processing notification:', notification.id);
        showNotification(notification);
      });
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);