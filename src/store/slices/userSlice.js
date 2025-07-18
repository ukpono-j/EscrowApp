import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userDetails: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserDetails(state, action) {
      state.userDetails = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading(state) {
      state.loading = true;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setUserDetails, setLoading, setError } = userSlice.actions;
export default userSlice.reducer;