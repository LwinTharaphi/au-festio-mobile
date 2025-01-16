import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  userLoading: false,
}

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    uid: null,
    email: null,
    displayName: null,
  },
  reducers: {
    setUser: (state, action) => {
      console.log('setUser payload',action.payload);
      state.user = action.payload || null;
 
    },
    logoutUser: (state) => {
      state.user = null;
    },
    setUserLoading: (state, action) => {
      state.userLoading = action.payload || false;
    }
  },
})

// Action creators are generated for each case reducer function
export const { setUser, setUserLoading, logoutUser } = userSlice.actions

export default userSlice.reducer