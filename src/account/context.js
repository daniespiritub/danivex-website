import { createContext, useContext } from 'react'
export const AccountContext = createContext({ ready: false, account: false, assistant: false, user: null })
export const useAccount = () => useContext(AccountContext)
