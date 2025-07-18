import { createSlice } from '@reduxjs/toolkit';
import { fetchInitialData, fundWallet, checkFundingStatus, manualReconcileTransaction, withdrawFunds } from './walletThunks';

const initialState = {
  user: null,
  wallet: null,
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
      state.user = action.payload.user || null;
      state.wallet = action.payload.wallet?.balance || 0;
      state.transactions = action.payload.wallet?.transactions || [];
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
        state.transactions = action.payload.data.wallet?.transactions || [];
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch wallet data';
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
        state.error = action.payload?.message || 'Failed to initiate funding';
      })
      .addCase(checkFundingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkFundingStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data.transaction?.status === 'completed') {
          state.wallet = action.payload.data.newBalance || state.wallet;
          state.transactions = [
            action.payload.data.transaction,
            ...state.transactions.filter(t => t.reference !== action.payload.data.transaction.reference),
          ];
          state.paymentDetails = null;
        }
      })
      .addCase(checkFundingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to check funding status';
      })
      .addCase(manualReconcileTransaction.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.wallet = action.payload.data.newBalance || state.wallet;
          state.transactions = [
            action.payload.data.transaction,
            ...state.transactions.filter(t => t.reference !== action.payload.data.transaction.reference),
          ];
          state.paymentDetails = null;
        }
      })
      .addCase(manualReconcileTransaction.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to reconcile transaction';
      })
      .addCase(withdrawFunds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(withdrawFunds.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload.data.newBalance || state.wallet;
        state.transactions = [
          action.payload.data,
          ...state.transactions.filter(t => t.reference !== action.payload.data.reference),
        ];
      })
      .addCase(withdrawFunds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to process withdrawal';
      });
  },
});

export const { setWallet, setPaymentDetails, clearPaymentDetails } = walletSlice.actions;
export default walletSlice.reducer;