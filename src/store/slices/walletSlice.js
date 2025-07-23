import { createSlice } from '@reduxjs/toolkit';
import { fetchInitialData, fundWallet, checkFundingStatus, manualReconcileTransaction } from './walletThunks';

const initialState = {
  user: null,
  wallet: { balance: 0, totalDeposits: 0, transactions: [] },
  paymentDetails: null,
  loading: false,
  fundingLoading: false,
  error: null,
};

// Helper function to convert Date objects to ISO strings in transactions
const serializeTransaction = (transaction) => ({
  ...transaction,
  createdAt: transaction.createdAt instanceof Date ? transaction.createdAt.toISOString() : transaction.createdAt,
  metadata: {
    ...transaction.metadata,
    reconciledAt: transaction.metadata?.reconciledAt instanceof Date ? transaction.metadata.reconciledAt.toISOString() : transaction.metadata?.reconciledAt,
  },
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWallet(state, action) {
      state.user = action.payload.user || state.user;
      state.wallet.balance = action.payload.balance ?? state.wallet.balance;
      state.wallet.totalDeposits = action.payload.totalDeposits ?? state.wallet.totalDeposits;
      if (action.payload.transaction) {
        const serializedTransaction = serializeTransaction(action.payload.transaction);
        const existingIndex = state.wallet.transactions.findIndex(
          (t) => t.reference === serializedTransaction.reference
        );
        if (existingIndex >= 0) {
          state.wallet.transactions[existingIndex] = {
            ...state.wallet.transactions[existingIndex],
            ...serializedTransaction,
            amount: serializedTransaction.amount,
          };
        } else {
          state.wallet.transactions.unshift({
            ...serializedTransaction,
            amount: serializedTransaction.amount,
          });
        }
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
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data.user || null;
        state.wallet.balance = action.payload.data.wallet?.balance || 0;
        state.wallet.totalDeposits = action.payload.data.wallet?.totalDeposits || 0;
        // Serialize all transactions' createdAt fields
        state.wallet.transactions = action.payload.data.wallet?.transactions.map(serializeTransaction) || [];
      })
      .addCase(fundWallet.fulfilled, (state, action) => {
        state.fundingLoading = false;
        state.paymentDetails = { ...action.payload.data, amount: action.payload.data.amount };
        // Optimistic update with serialized transaction
        state.wallet.transactions.unshift(
          serializeTransaction({
            type: 'deposit',
            amount: action.payload.data.amount,
            reference: action.payload.data.reference,
            status: 'pending',
            createdAt: new Date(),
          })
        );
      })
      .addCase(checkFundingStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data.transaction) {
          const transaction = serializeTransaction({
            ...action.payload.data.transaction,
            amount: action.payload.data.transaction.amount,
          });
          const existingIndex = state.wallet.transactions.findIndex(
            (t) => t.reference === transaction.reference
          );
          if (existingIndex >= 0) {
            state.wallet.transactions[existingIndex] = transaction;
          } else {
            state.wallet.transactions.unshift(transaction);
          }
          if (transaction.status === 'completed') {
            state.wallet.balance = action.payload.data.newBalance;
            state.wallet.totalDeposits = action.payload.data.totalDeposits || 0;
            state.paymentDetails = null;
          }
        }
      })
      .addCase(manualReconcileTransaction.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data.transaction) {
          const transaction = serializeTransaction({
            ...action.payload.data.transaction,
            amount: action.payload.data.transaction.amount,
          });
          const existingIndex = state.wallet.transactions.findIndex(
            (t) => t.reference === transaction.reference
          );
          if (existingIndex >= 0) {
            state.wallet.transactions[existingIndex] = transaction;
          } else {
            state.wallet.transactions.unshift(transaction);
          }
          if (transaction.status === 'completed') {
            state.wallet.balance = action.payload.data.newBalance;
            state.wallet.totalDeposits = action.payload.data.totalDeposits || 0;
            state.paymentDetails = null;
          }
        }
      })
      // Handle pending and rejected cases as before
      .addCase(fetchInitialData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch wallet data';
      })
      .addCase(fundWallet.pending, (state) => {
        state.fundingLoading = true;
        state.error = null;
      })
      .addCase(fundWallet.rejected, (state, action) => {
        state.fundingLoading = false;
        state.error = action.payload?.message || 'Failed to initiate funding';
      })
      .addCase(checkFundingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkFundingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to check funding status';
      })
      .addCase(manualReconcileTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(manualReconcileTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to reconcile transaction';
      });
  },
});

export const { setWallet, setPaymentDetails, clearPaymentDetails } = walletSlice.actions;
export default walletSlice.reducer;