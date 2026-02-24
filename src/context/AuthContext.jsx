import React, { createContext, useContext } from 'react';
import { useAuthStore } from '../store/useStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const auth = useAuthStore();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
