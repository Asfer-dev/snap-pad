// frontend/src/context/AuthContext.ts
import { createContext } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// Only export the context definition here
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
