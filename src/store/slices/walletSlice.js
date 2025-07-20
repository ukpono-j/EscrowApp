import { createSlice } from '@reduxjs/toolkit';
import { fetchInitialData, fundWallet, checkFundingStatus, manualReconcileTransaction, withdrawFunds } from './walletThunks';

const initialState = {
  user: null,
  wallet: null,
  totalDeposits: 0,
  transactions: [],
  paymentDetails: null,
  loading: false,
  fundingLoading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWallet(state, action) {
      state.user = action.payload.user || state.user;
      state.wallet = action.payload.balance ?? state.wallet;
      state.totalDeposits = action.payload.totalDeposits ?? state.totalDeposits;
      if (action.payload.transaction) {
        state.transactions = [
          action.payload.transaction,
          ...state.transactions.filter(t => t.reference !== action.payload.transaction.reference),
        ];
      } else if (action.payload.transactions) {
        state.transactions = action.payload.transactions || state.transactions;
      }
      // Recalculate balance from completed deposits to ensure accuracy
      const calculatedBalance = state.transactions
        .filter(t => t.status === 'completed' && t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
      if (state.wallet !== calculatedBalance) {
        console.warn('Balance mismatch detected, correcting:', {
          serverBalance: state.wallet,
          calculatedBalance,
        });
        state.wallet = calculatedBalance;
      }
    },
    setPaymentDetails(state, action) {
      state.paymentDetails = action.payload;
    },
    clearPaymentDetails(state) {
      state.paymentDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data.user || null;
        state.wallet = action.payload.data.wallet?.balance || 0;
        state.totalDeposits = action.payload.data.wallet?.totalDeposits || 0;
        state.transactions = action.payload.data.wallet?.transactions || [];
        state.paymentDetails = action.payload.data.wallet?.paymentDetails || null;
        if (action.payload.warning) {
          state.error = action.payload.warning;
        }
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch wallet data';
      })
      .addCase(fundWallet.pending, (state) => {
        state.fundingLoading = true;
        state.error = null;
      })
      .addCase(fundWallet.fulfilled, (state, action) => {
        state.fundingLoading = false;
        state.paymentDetails = action.payload.data;
      })
      .addCase(fundWallet.rejected, (state, action) => {
        state.fundingLoading = false;
        state.error = action.error.message || 'Failed to initiate funding';
      })
      .addCase(checkFundingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkFundingStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data.transaction) {
          const transaction = action.payload.data.transaction;
          state.transactions = [
            transaction,
            ...state.transactions.filter(t => t.reference !== transaction.reference),
          ];
          if (transaction.status === 'completed') {
            state.wallet = (state.wallet || 0) + transaction.amount;
            state.totalDeposits = (state.totalDeposits || 0) + transaction.amount;
            state.paymentDetails = null;
          }
        }
      })
      .addCase(checkFundingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to check funding status';
      })
      .addCase(manualReconcileTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(manualReconcileTransaction.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data.transaction) {
          const transaction = action.payload.data.transaction;
          state.transactions = [
            transaction,
            ...state.transactions.filter(t => t.reference !== transaction.reference),
          ];
          if (transaction.status === 'completed') {
            state.wallet = (state.wallet || 0) + transaction.amount;
            state.totalDeposits = (state.totalDeposits || 0) + transaction.amount;
            state.paymentDetails = null;
          }
        }
      })
      .addCase(manualReconcileTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to reconcile transaction';
      })
      .addCase(withdrawFunds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(withdrawFunds.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data.transaction) {
          const transaction = action.payload.data.transaction;
          state.transactions = [
            transaction,
            ...state.transactions.filter(t => t.reference !== transaction.reference),
          ];
          if (transaction.status === 'completed') {
            state.wallet = (state.wallet || 0) - transaction.amount;
          }
        }
      })
      .addCase(withdrawFunds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to withdraw funds';
      });
  },
});

export const { setWallet, setPaymentDetails, clearPaymentDetails } = walletSlice.actions;
export default walletSlice.reducer;