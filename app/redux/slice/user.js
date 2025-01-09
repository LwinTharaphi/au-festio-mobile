import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  userLoading: false,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
    //   const { email, uid, displayName, emailVerified } = action.payload;

    //   state.user = email && uid ?{
    //     email,
    //     uid,
    //     displayName : displayName || null,
    //     emailVerified
    //     } : null;
        state.user = action.payload
    },
    setUserLoading: (state, action) => {
      state.userLoading = action.payload
    }
  },
})

// Action creators are generated for each case reducer function
export const { setUser, setUserLoading } = userSlice.actions

export default userSlice.reducer