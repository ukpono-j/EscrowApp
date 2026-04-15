// src/index.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import transactionReducer from './slices/transactionsSlice'; // Corrected from transactionsSlice
import walletReducer from './slices/walletSlice';
import sidebarReducer from "./slices/sidebarSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    transactions: transactionReducer,
    wallet: walletReducer,
    sidebar: sidebarReducer,
  },
});