import { View, Text } from 'react-native'
import React from 'react'
import { useContext , createContext, useState} from 'react'

const GlobalContext = createContext()

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({children}) => {
    const [state, setState] = useState(null)
    return (
        <GlobalContext.Provider value={{state, setState}}>
            {children}
        </GlobalContext.Provider>
    );
}