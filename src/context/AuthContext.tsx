
import React, { createContext, useState, useContext, useEffect } from 'react';

export type UserRole = 'owner' | 'manager' | 'cashier';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  password?: string; // Added password field
  branchId?: string;
  storeId?: string;
  branchName?: string;
  storeName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for cached user session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        // In a real app, this would check with your backend API or Supabase
        const cachedUser = localStorage.getItem('posUser');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check for saved users first
      const savedUsers = localStorage.getItem('users');
      let allUsers = [];
      
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        // Convert saved users to the format we need
        allUsers = parsedUsers.map((u: any) => ({
          ...u,
          password: u.password || 'password' // Fallback for users without password
        }));
      }
      
      // Add default mock users if no saved users or if owner login is needed
      const mockUsers = [
        { id: '1', email: 'owner@example.com', password: 'password', role: 'owner', name: 'John Owner' },
        { id: '2', email: 'manager@example.com', password: 'password', role: 'manager', name: 'Sarah Manager', branchId: '1', storeId: '1', branchName: 'Main Branch', storeName: 'Main Store' },
        { id: '3', email: 'cashier@example.com', password: 'password', role: 'cashier', name: 'Mike Cashier', branchId: '1', storeId: '1', branchName: 'Main Branch', storeName: 'Main Store' },
      ];
      
      // Combine mock users with saved users, prioritizing saved users
      const combinedUsers = [...allUsers];
      
      // Only add mock users that don't exist in saved users (by email)
      mockUsers.forEach(mockUser => {
        if (!combinedUsers.some(u => u.email === mockUser.email)) {
          combinedUsers.push(mockUser);
        }
      });
      
      const foundUser = combinedUsers.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword as User);
        localStorage.setItem('posUser', JSON.stringify(userWithoutPassword));
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    
    try {
      // In a real app, this would call your backend API or Supabase to sign out
      localStorage.removeItem('posUser');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
