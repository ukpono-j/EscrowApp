// src/index.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../store/slices/userSlice';
import transactionReducer from '../store/slices/transactionsSlice'; // Corrected from transactionsSlice
import walletReducer from '../store/slices/walletSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    transactions: transactionReducer,
    wallet: walletReducer,
  },
});