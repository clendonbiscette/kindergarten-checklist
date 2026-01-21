import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const currentUser = authAPI.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      if (response.success) {
        setUser(response.data.user);
        return { success: true };
      }
      // API returned success: false
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      // Error thrown by API client (network error or HTTP error response)
      // The error object from our API client is {success, message} for HTTP errors
      // or {success, message: "Network error..."} for network issues
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'Login failed. Please try again.');
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        // Auto-login after registration
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'Registration failed. Please try again.');
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const registerTeacher = async (teacherData) => {
    try {
      const response = await authAPI.registerTeacher(teacherData);
      if (response.success) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'Registration failed. Please try again.');
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    registerTeacher,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
