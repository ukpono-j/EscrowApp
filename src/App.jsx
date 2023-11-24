import { useState } from "react";
import { Route, Router, Routes } from "react-router-dom";
import Home from "./pages/Home";
import LogIn from "./pages/LogIn";
import UserDashboard from "./pages/UserDashboard";
import Register from "./pages/Register";
import CreateTransaction from "./components/dashboard/CreateTransaction";
import MainProfile from "./components/dashboard/MainProfile";
import Transaction from "./components/dashboard/Transactions";
import MainJoinTransaction from "./components/dashboard/MainJoinTransaction";
import JoinTransaction from "./components/dashboard/JoinTransaction";
import TransactionTab from "./components/dashboard/TransactionTab";
import ContactUs from "./pages/ContactUs";
import Notification from "./components/dashboard/Notification";
import MessageBox from "./components/dashboard/MessageBox";
import SetAvatar from "./pages/SetAvatar";
import Kyc from "./components/dashboard/Kyc";
import Settings from "./components/dashboard/Settings";

function App() {

  return <>
      {/* <Router> */}
         <Routes>
          <Route path="/"  element={<Home/>} />
          <Route path="/login"  element={<LogIn/>} />
          <Route path="/register"  element={<Register/>} />
          <Route path="/dashboard"  element={<UserDashboard/>} />
          <Route path="/create-transaction"  element={<CreateTransaction/>} />
          <Route path="/profile"  element={<MainProfile/>} />
          <Route path="/transactions"  element={<Transaction/>} />
          <Route path="/transactions/tab"  element={<TransactionTab/>} />
          <Route path="/join-transaction"  element={<JoinTransaction/>} />
          <Route path="/contact"  element={<ContactUs/>} />
          <Route path="/notifications"  element={<Notification/>} />
          <Route path="/setAvatar"  element={<SetAvatar/>} />

          
          <Route path="/messages"  element={<MessageBox/>} />
          <Route path="/security-settings/kyc"  element={<Kyc/>} />
          <Route path="/security-settings"  element={<Settings/>} />
         </Routes>
      {/* </Router> */}
  </>;
}

export default App;
