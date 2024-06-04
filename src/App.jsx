// src/App.jsx
import React from 'react';
import { Route, Routes } from 'react-router-dom';
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
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute element={Home} />} />
      <Route path="/login" element={<PublicRoute element={LogIn} />} />
      <Route path="/register" element={<PublicRoute element={Register} />} />
      <Route path="/dashboard" element={<PrivateRoute element={UserDashboard} />} />
      <Route path="/create-transaction" element={<PrivateRoute element={CreateTransaction} />} />
      <Route path="/profile" element={<PrivateRoute element={MainProfile} />} />
      <Route path="/transactions" element={<PrivateRoute element={Transaction} />} />
      <Route path="/transactions/tab" element={<PrivateRoute element={DisplayTransaction} />} />
      <Route path="/join-transaction" element={<PrivateRoute element={JoinTransaction} />} />
      <Route path="/contact" element={<PrivateRoute element={ContactUs} />} />
      <Route path="/notifications" element={<PrivateRoute element={Notification} />} />
      <Route path="/setAvatar" element={<PrivateRoute element={SetAvatar} />} />
      <Route path="/security-settings/kyc" element={<PrivateRoute element={Kyc} />} />
      <Route path="/security-settings" element={<PrivateRoute element={Settings} />} />
      {/* <Route path="/admin" element={<PrivateRoute element={Admin} />} /> */}
      <Route path="/chat/:chatroomId" element={<PrivateRoute element={MessageBox} />} />
    </Routes>
  );
}

export default App;
