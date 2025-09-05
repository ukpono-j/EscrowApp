import { createSlice } from '@reduxjs/toolkit';
import { fetchInitialData, fetchSingleTransaction, updateTransaction, confirmTransaction, fundTransaction, cancelTransaction } from './thunks';

const initialState = {
  transactions: [],
  loading: false,
  error: null,
};

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setTransactions(state, action) {
      state.transactions = Array.isArray(action.payload)
        ? action.payload.filter(t => t && t._id)
        : [];
      state.loading = false;
      state.error = null;
    },
    addTransaction(state, action) {
      if (action.payload && action.payload._id) {
        state.transactions.push(action.payload);
      }
      state.loading = false;
      state.error = null;
    },
    setLoading(state) {
      state.loading = true;
      state.error = null;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchInitialData
      .addCase(fetchInitialData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        // console.log('fetchInitialData payload:', action.payload);
        state.transactions = Array.isArray(action.payload.transactions)
          ? action.payload.transactions.filter(t => t && t._id)
          : [];
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch initial data';
        state.loading = false;
      })
      // fetchSingleTransaction
      .addCase(fetchSingleTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSingleTransaction.fulfilled, (state, action) => {
        const updatedTransaction = action.payload;
        if (updatedTransaction && updatedTransaction._id) {
          const index = state.transactions.findIndex(t => t?._id === updatedTransaction._id);
          if (index !== -1) {
            state.transactions[index] = { ...state.transactions[index], ...updatedTransaction };
          } else {
            state.transactions.push(updatedTransaction);
          }
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchSingleTransaction.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch transaction';
        state.loading = false;
      })
      // updateTransaction
      .addCase(updateTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const updatedTransaction = action.payload;
        if (updatedTransaction && updatedTransaction._id) {
          state.transactions = state.transactions
            .filter(t => t && t._id)
            .map(t =>
              t._id === updatedTransaction._id ? { ...t, ...updatedTransaction } : t
            );
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update transaction';
        state.loading = false;
      })
      // confirmTransaction
      .addCase(confirmTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmTransaction.fulfilled, (state, action) => {
        const updatedTransaction = action.payload.transaction;
        if (updatedTransaction && updatedTransaction._id) {
          state.transactions = state.transactions
            .filter(t => t && t._id)
            .map(t =>
              t._id === updatedTransaction._id ? { ...t, ...updatedTransaction } : t
            );
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(confirmTransaction.rejected, (state, action) => {
        state.error = action.payload?.error || 'Failed to confirm transaction';
        state.loading = false;
      })
      // fundTransaction
      .addCase(fundTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fundTransaction.fulfilled, (state, action) => {
        const updatedTransaction = action.payload;
        if (updatedTransaction && updatedTransaction._id) {
          state.transactions = state.transactions
            .filter(t => t && t._id)
            .map(t =>
              t._id === updatedTransaction._id ? { ...t, ...updatedTransaction } : t
            );
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(fundTransaction.rejected, (state, action) => {
        state.error = action.payload?.error || 'Failed to fund transaction';
        state.loading = false;
      })
      // cancelTransaction
      .addCase(cancelTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelTransaction.fulfilled, (state, action) => {
        // Backend returns { message, refunded, transaction }
        const updatedTransaction = action.payload.transaction;
        if (updatedTransaction && updatedTransaction._id) {
          state.transactions = state.transactions
            .filter(t => t && t._id)
            .map(t =>
              t._id === updatedTransaction._id ? { ...t, ...updatedTransaction } : t
            );
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(cancelTransaction.rejected, (state, action) => {
        state.error = action.payload?.error || 'Failed to cancel transaction';
        state.loading = false;
      });
  },
});

export const { setTransactions, addTransaction, setLoading, setError } = transactionSlice.actions;

export default transactionSlice.reducer;