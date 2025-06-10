import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);

  const login = (userData, socketConnection) => {
    setIsAuthenticated(true);
    setUser(userData);
    setSocket(socketConnection);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    if (socket) {
      socket.close();
      setSocket(null);
    }
  };

  const value = {
    isAuthenticated,
    user,
    socket,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
