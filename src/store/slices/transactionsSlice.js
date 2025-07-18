import { createSlice } from '@reduxjs/toolkit';
import { fetchInitialData, updateTransaction } from './thunks';

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
      state.transactions = Array.isArray(action.payload) ? action.payload : [];
      state.loading = false;
      state.error = null;
    },
    addTransaction(state, action) {
      state.transactions.push(action.payload);
      state.loading = false;
    },
    setLoading(state) {
      state.loading = true;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        state.transactions = Array.isArray(action.payload.transactions) ? action.payload.transactions : [];
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to fetch initial data';
        state.loading = false;
        state.transactions = [];
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const updatedTransaction = action.payload;
        state.transactions = state.transactions.map(t =>
          t._id === updatedTransaction._id ? { ...t, paymentAmount: updatedTransaction.paymentAmount } : t
        );
        state.loading = false;
        state.error = null;
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update transaction';
        state.loading = false;
      });
  },
});

export const { setTransactions, addTransaction, setLoading, setError } = transactionSlice.actions;
export default transactionSlice.reducer;