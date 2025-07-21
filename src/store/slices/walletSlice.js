import { createSlice } from '@reduxjs/toolkit';
import { fetchInitialData, fundWallet, checkFundingStatus, manualReconcileTransaction, withdrawFunds } from './walletThunks';

const initialState = {
  user: null,
  wallet: { balance: 0, totalDeposits: 0, transactions: [] },
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
      state.wallet.balance = action.payload.balance ?? state.wallet.balance;
      state.wallet.totalDeposits = action.payload.totalDeposits ?? state.wallet.totalDeposits;
      if (action.payload.transaction) {
        state.wallet.transactions = [
          { ...action.payload.transaction, amount: action.payload.transaction.amount },
          ...state.wallet.transactions.filter(t => t.reference !== action.payload.transaction.reference),
        ];
      } else if (action.payload.transactions) {
        state.wallet.transactions = action.payload.transactions || state.wallet.transactions;
      }
    },
    setPaymentDetails(state, action) {
      state.paymentDetails = { ...action.payload, amount: action.payload.amount };
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
        state.wallet.balance = action.payload.data.wallet?.balance || 0;
        state.wallet.totalDeposits = action.payload.data.wallet?.totalDeposits || 0;
        state.wallet.transactions = action.payload.data.wallet?.transactions || [];
        state.paymentDetails = action.payload.data.wallet?.paymentDetails
          ? { ...action.payload.data.wallet.paymentDetails, amount: action.payload.data.wallet.paymentDetails.amount }
          : null;
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch wallet data. Please check your network and try again.';
      })
      .addCase(fundWallet.pending, (state) => {
        state.fundingLoading = true;
        state.error = null;
      })
      .addCase(fundWallet.fulfilled, (state, action) => {
        state.fundingLoading = false;
        state.paymentDetails = { ...action.payload.data, amount: action.payload.data.amount };
      })
      .addCase(fundWallet.rejected, (state, action) => {
        state.fundingLoading = false;
        state.error = action.payload?.message || 'Failed to initiate funding. Please check your network and try again.';
      })
      .addCase(checkFundingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkFundingStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data.transaction) {
          const transaction = { ...action.payload.data.transaction, amount: action.payload.data.transaction.amount };
          state.wallet.transactions = [
            transaction,
            ...state.wallet.transactions.filter(t => t.reference !== transaction.reference),
          ];
          if (transaction.status === 'completed') {
            state.wallet.balance = action.payload.data.wallet?.balance || 0;
            state.wallet.totalDeposits = action.payload.data.wallet?.totalDeposits || 0;
            state.paymentDetails = null;
          }
        }
      })
      .addCase(checkFundingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to check funding status. Please check your network and try again.';
      })
      .addCase(manualReconcileTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(manualReconcileTransaction.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data.transaction) {
          const transaction = { ...action.payload.data.transaction, amount: action.payload.data.transaction.amount };
          state.wallet.transactions = [
            transaction,
            ...state.wallet.transactions.filter(t => t.reference !== transaction.reference),
          ];
          if (transaction.status === 'completed') {
            state.wallet.balance = action.payload.data.wallet?.balance || 0;
            state.wallet.totalDeposits = action.payload.data.wallet?.totalDeposits || 0;
            state.paymentDetails = null;
          }
        }
      })
      .addCase(manualReconcileTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to reconcile transaction. Please check your network and try again.';
      })
      .addCase(withdrawFunds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(withdrawFunds.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data.transaction) {
          const transaction = { ...action.payload.data.transaction, amount: action.payload.data.transaction.amount };
          state.wallet.transactions = [
            transaction,
            ...state.wallet.transactions.filter(t => t.reference !== transaction.reference),
          ];
          if (transaction.status === 'completed') {
            state.wallet.balance = action.payload.data.wallet?.balance || 0;
          }
        }
      })
      .addCase(withdrawFunds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to withdraw funds. Please check your network and try again.';
      });
  },
});

export const { setWallet, setPaymentDetails, clearPaymentDetails } = walletSlice.actions;
export default walletSlice.reducer;