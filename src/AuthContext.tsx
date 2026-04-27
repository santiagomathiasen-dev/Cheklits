import React, { createContext, useContext, useEffect, useState } from 'react';
import { dataService } from './services/dataService';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'staff';
  isApproved: boolean;
  createdAt: string;
  organization_id: string;
  assignedChecklistIds?: string[];
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  login: (email: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isApproved: false,
  login: () => {},
  logout: () => {},
});

const DEFAULT_ORG_ID = 'azura-main-org';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('gastrocheck_current_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      const profiles = dataService.getProfiles(DEFAULT_ORG_ID);
      const userProfile = profiles.find((p: any) => p.uid === userData.uid);
      setProfile(userProfile || null);
    }
    setLoading(false);
  }, []);

  const login = (email: string, name: string) => {
    const uid = btoa(email); 
    const profiles = dataService.getProfiles(DEFAULT_ORG_ID);
    const existingProfile = profiles.find((p: any) => p.uid === uid);
    
    const isAdminEmail = email === 'santiago02061992@gmail.com';
    const newProfile: UserProfile = existingProfile || {
      uid,
      email,
      displayName: name || email.split('@')[0],
      role: isAdminEmail ? 'admin' : 'staff',
      isApproved: isAdminEmail,
      createdAt: new Date().toISOString(),
      organization_id: DEFAULT_ORG_ID,
      assignedChecklistIds: []
    };

    if (!existingProfile) {
      dataService.saveProfile(newProfile);
    }

    const userData = { uid, email, displayName: name };
    localStorage.setItem('gastrocheck_current_user', JSON.stringify(userData));
    setUser(userData);
    setProfile(newProfile);
  };

  const logout = () => {
    localStorage.removeItem('gastrocheck_current_user');
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || user?.email === 'santiago02061992@gmail.com',
    isApproved: profile?.isApproved === true || user?.email === 'santiago02061992@gmail.com',
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
