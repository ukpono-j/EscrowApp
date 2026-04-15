import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isCollapsed: JSON.parse(localStorage.getItem("sidebarCollapsed")) ?? false,
  isMobile: window.innerWidth < 768,
  isSidebarVisible: false,
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    setIsMobile: (state, action) => {
      state.isMobile = action.payload;
    },

    toggleSidebar: (state) => {
      if (state.isMobile) {
        state.isSidebarVisible = !state.isSidebarVisible;
      } else {
        state.isCollapsed = !state.isCollapsed;
        localStorage.setItem("sidebarCollapsed", JSON.stringify(state.isCollapsed));
      }
    },

    openSidebar: (state) => {
      state.isSidebarVisible = true;
    },

    closeSidebar: (state) => {
      state.isSidebarVisible = false;
    },

    setCollapsed: (state, action) => {
      state.isCollapsed = action.payload;
      localStorage.setItem("sidebarCollapsed", JSON.stringify(action.payload));
    },
  },
});

export const {
  setIsMobile,
  toggleSidebar,
  openSidebar,
  closeSidebar,
  setCollapsed,
} = sidebarSlice.actions;

export default sidebarSlice.reducer;