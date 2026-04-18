import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreErrorHandler';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isApproved: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Use onSnapshot for reactive profile updates (e.g., when admin assigns new checklists)
        const unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), async (userDoc) => {
          try {
            if (userDoc.exists()) {
              const data = userDoc.data();
              // Ensure specific email always has admin role and is approved
              if (firebaseUser.email === 'santiago02061992@gmail.com' && (data.role !== 'admin' || data.isApproved !== true)) {
                const updatedProfile = { ...data, role: 'admin', isApproved: true };
                await setDoc(doc(db, 'users', firebaseUser.uid), updatedProfile);
                setProfile(updatedProfile);
              } else {
                setProfile(data);
              }
            } else {
              // Create default profile for new users
              const isAdminEmail = firebaseUser.email === 'santiago02061992@gmail.com';
              const newProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
                role: isAdminEmail ? 'admin' : 'staff',
                isApproved: isAdminEmail, // Admin is auto-approved
                createdAt: new Date().toISOString(),
                assignedChecklistIds: []
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
              setProfile(newProfile);
            }
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          }
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || user?.email === 'santiago02061992@gmail.com',
    isApproved: profile?.isApproved === true || user?.email === 'santiago02061992@gmail.com',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
