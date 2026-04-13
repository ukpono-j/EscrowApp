import  { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Home from './pages/Home';
import LogIn from './pages/LogIn';
import UserDashboard from './pages/UserDashboard';
import Register from './pages/Register';
import CreateTransaction from './components/dashboard/CreateTransaction';
import MainProfile from './components/dashboard/MainProfile';
import Transaction from './components/dashboard/Transactions';
import JoinTransaction from './components/dashboard/JoinTransaction';
import DisplayTransaction from './components/dashboard/DisplayTransaction';
import ContactUs from './pages/ContactUs';
import Notification from './components/dashboard/Notification';
import MessageBox from './components/dashboard/MessageBox';
import SetAvatar from './pages/SetAvatar';
import Kyc from './components/dashboard/Kyc';
import Settings from './components/dashboard/Settings';
import Admin from './components/admin/Admin';
import DisputePage from './components/dashboard/DisputePage'; // Import DisputePage
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import ForgotPassword from './pages/ForgotPassword';
import { Box, Button } from '@chakra-ui/react';
import VerifyEmail from './pages/VerifyEmail';
import DashboardOnboarding from './pages/dashbroardonbroading';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001';

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // PWA Install Prompt
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      console.log('beforeinstallprompt event triggered');
      setDeferredPrompt(event);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle app installed event to hide button
    window.addEventListener('appinstalled', () => {
      console.log('App installed');
      setShowInstallButton(false);
      setDeferredPrompt(null);
    });

    // Push notification subscription for authenticated users
    const subscribeToPush = async (retries = 3, delay = 1000) => {
      const token = localStorage.getItem('access-token');
      if (!token) {
        console.log('No access token found, skipping push subscription');
        return;
      }

      const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      if (!isSecureContext) {
        console.log('Push notifications not supported: Secure context (HTTPS or localhost) required');
        return;
      }

      if (
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window &&
        typeof Notification.requestPermission === 'function' &&
        Notification.permission !== 'denied'
      ) {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              const reg = await navigator.serviceWorker.ready;
              const publicKeyResponse = await axios.get(
                `${BASE_URL}/api/notifications/push/public-key`,
                { headers: { 'access-token': token } }
              );
              const applicationServerKey = urlBase64ToUint8Array(publicKeyResponse.data.publicKey);
              const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
              });

              await axios.post(
                `${BASE_URL}/api/notifications/push/subscribe`,
                { subscription },
                { headers: { 'access-token': token } }
              );
              console.log('Subscribed to push notifications');
              break;
            } else {
              console.log('Notification permission denied or default:', permission);
              break;
            }
          } catch (error) {
            console.error(`Push subscription attempt ${attempt} failed:`, error);
            if (attempt === retries) {
              console.error('Max retries reached for push subscription');
              break;
            }
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
          }
        }
      } else {
        console.log('Push notifications not supported in this browser. Details:', {
          serviceWorkerSupported: 'serviceWorker' in navigator,
          pushManagerSupported: 'PushManager' in window,
          notificationSupported: 'Notification' in window,
          requestPermissionSupported:
            'Notification' in window && typeof Notification.requestPermission === 'function',
          permissionStatus: Notification ? Notification.permission : 'unavailable',
          userAgent: navigator.userAgent,
        });
      }
    };

    // Trigger subscription only if user is authenticated
    subscribeToPush();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', () => { });
    };
  }, []);

  // Helper function for VAPID key conversion
  function urlBase64ToUint8Array(base64String) {
    try {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (error) {
      console.error('Failed to convert VAPID key:', error);
      throw error;
    }
  }

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        setShowInstallButton(false);
      });
    }
  };

 

  return (
    <>
      <Routes>
        <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LogIn /></PublicRoute>} />
        <Route path="/onbroading" element={<PrivateRoute><DashboardOnboarding /></PrivateRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />        
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
        <Route path="/create-transaction" element={<PrivateRoute><CreateTransaction /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><MainProfile /></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute><Transaction /></PrivateRoute>} />
        <Route path="/transactions/tab" element={<PrivateRoute><DisplayTransaction /></PrivateRoute>} />
        <Route path="/join-transaction" element={<PrivateRoute><JoinTransaction /></PrivateRoute>} />
        <Route path="/disputes" element={<PrivateRoute><DisputePage /></PrivateRoute>} /> {/* Add User Dispute Route */}
        <Route path="/admin/disputes" element={<PrivateRoute><DisputePage isAdmin={true} /></PrivateRoute>} /> {/* Add Admin Dispute Route */}
        <Route path="/contact" element={<PrivateRoute><ContactUs /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notification /></PrivateRoute>} />
        <Route path="/setAvatar" element={<PrivateRoute><SetAvatar /></PrivateRoute>} />
        <Route path="/security-settings/kyc" element={<PrivateRoute><Kyc /></PrivateRoute>} />
        <Route path="/security-settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/chat/:chatroomId" element={<PrivateRoute><MessageBox /></PrivateRoute>} />
      </Routes>

      {showInstallButton && (
        <Box position="fixed" bottom="4" right="4" zIndex="banner">
          <Button
            id="install-btn"
            onClick={handleInstallClick}
            colorScheme="none"
            variant="solid"
            size="md"
            bg="#B38939"
            color="white"
            fontWeight="semibold"
            px="6"
            py="3"
            rounded="lg"
            boxShadow="md"
            _hover={{ bg: '#a3782f', boxShadow: 'lg', transform: 'translateY(-2px)' }}
            transition="all 0.3s ease-in-out"
          >
            Install App
          </Button>
        </Box>
      )}
    </>
  );
}

export default App;