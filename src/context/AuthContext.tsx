
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'owner' | 'manager' | 'cashier';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state by checking for session
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          try {
            // Fetch the full user profile from the profiles table
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*, branches(name), stores(name)')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) throw profileError;
            
            if (profileData) {
              setUser({
                id: profileData.id,
                email: profileData.email,
                role: profileData.role as UserRole,
                name: profileData.name,
                branchId: profileData.branch_id,
                storeId: profileData.store_id,
                branchName: profileData.branches?.name,
                storeName: profileData.stores?.name
              });
            } else {
              // If for some reason the profile doesn't exist, create a minimal user object
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                role: 'cashier', // Default role
                name: session.user.user_metadata.name || session.user.email || 'User'
              });
            }
          } catch (e) {
            console.error('Error fetching user profile:', e);
            // Still set basic user info even if profile fetch fails
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: 'cashier', // Default role
              name: session.user.user_metadata.name || session.user.email || 'User'
            });
          }
        } else {
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user) {
          // Fetch the full user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*, branches(name), stores(name)')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) throw profileError;
          
          if (profileData) {
            setUser({
              id: profileData.id,
              email: profileData.email,
              role: profileData.role as UserRole,
              name: profileData.name,
              branchId: profileData.branch_id,
              storeId: profileData.store_id,
              branchName: profileData.branches?.name,
              storeName: profileData.stores?.name
            });
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // First try to login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        // If login fails and we're in development, fall back to mock users
        if (import.meta.env.DEV) {
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
            toast({
              title: "Development mode",
              description: "Using mock user data. In production, real authentication would be used.",
            });
          } else {
            throw new Error('Invalid email or password');
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setError('An unknown error occurred');
        toast({
          title: "Login failed",
          description: "An unknown error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear any local storage data
      localStorage.removeItem('posUser');
      
      // Reset user state
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "Could not complete logout process",
        variant: "destructive",
      });
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
