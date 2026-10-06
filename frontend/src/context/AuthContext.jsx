import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('krishivaani_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('register'); // 'register' | 'login'
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('krishivaani_auth_user', JSON.stringify(user));
      localStorage.setItem('krishivaani_farmer_phone', user.mobile);
      if (user.id) localStorage.setItem('krishivaani_farmer_id', user.id);
    } else {
      localStorage.removeItem('krishivaani_auth_user');
      localStorage.removeItem('krishivaani_farmer_phone');
      localStorage.removeItem('krishivaani_farmer_id');
    }
  }, [user]);

  const openAuth = (tab = 'register') => {
    setAuthModalTab(tab);
    setAuthError(null);
    setAuthModalOpen(true);
  };

  const closeAuth = () => {
    setAuthModalOpen(false);
    setAuthError(null);
  };

  const getAccounts = () => {
    try {
      return JSON.parse(localStorage.getItem('krishivaani_registered_accounts') || '[]');
    } catch {
      return [];
    }
  };

  const register = async ({ name, mobile, password, state = 'Odisha', district = 'Bhadrak', village = '', land_area_acres = 4.5, soil_type = 'Alluvial' }) => {
    setAuthError(null);
    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    if (!name || name.trim().length < 2) {
      throw new Error('Please enter a valid full name (at least 2 letters).');
    }
    if (cleanMobile.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least 1 uppercase letter (A-Z).');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least 1 lowercase letter (a-z).');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least 1 number (0-9).');
    }
    if (!/[@$!%*?&#^()_\-+={}[\]:;"'<>,.?/\\|~`]/.test(password)) {
      throw new Error('Password must contain at least 1 special character (e.g. @, #, $, etc.).');
    }

    const accounts = getAccounts();
    const existing = accounts.find(a => a.mobile === cleanMobile);
    if (existing) {
      throw new Error('An account with this mobile number already exists. Please Sign In.');
    }

    let backendFarmerId = null;
    // Attempt backend sync
    try {
      const res = await fetch('http://localhost:8000/api/v1/farmers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone_number: cleanMobile,
          state,
          district,
          village: village || 'Gram Panchayat',
          land_area_acres: Number(land_area_acres) || 4.5,
          soil_type: soil_type || 'Alluvial',
          irrigation_source: 'Canal',
          primary_crops: ['Paddy', 'Mustard'],
          preferred_language: 'en'
        })
      });
      if (res.ok) {
        const data = await res.json();
        backendFarmerId = data.id;
      }
    } catch (e) {
      console.warn("Backend farmer profile creation fallback:", e);
    }

    const newAccount = {
      id: backendFarmerId || `farmer_${cleanMobile}_${Date.now()}`,
      name: name.trim(),
      mobile: cleanMobile,
      password,
      state,
      district,
      village: village || 'Gram Panchayat',
      land_area_acres: Number(land_area_acres) || 4.5,
      soil_type: soil_type || 'Alluvial',
      irrigation_source: 'Canal',
      primary_crops: ['Paddy', 'Mustard'],
      registeredAt: new Date().toISOString(),
    };

    accounts.push(newAccount);
    localStorage.setItem('krishivaani_registered_accounts', JSON.stringify(accounts));
    setUser(newAccount);
    setAuthModalOpen(false);
    return newAccount;
  };

  const login = async ({ mobile, password }) => {
    setAuthError(null);
    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const accounts = getAccounts();
    const account = accounts.find(a => a.mobile === cleanMobile);
    if (!account) {
      throw new Error('No account found with this mobile number. Please Register first.');
    }
    if (account.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    // Try fetching latest from backend if available
    try {
      const res = await fetch(`http://localhost:8000/api/v1/farmers/phone/${cleanMobile}`);
      if (res.ok) {
        const bData = await res.json();
        const merged = { ...account, ...bData, id: bData.id || account.id };
        setUser(merged);
        setAuthModalOpen(false);
        return merged;
      }
    } catch (e) {
      console.warn("Backend lookup offline:", e);
    }

    setUser(account);
    setAuthModalOpen(false);
    return account;
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);

    // Update in stored accounts list
    const accounts = getAccounts().map(a => a.mobile === user.mobile ? { ...a, ...updates } : a);
    localStorage.setItem('krishivaani_registered_accounts', JSON.stringify(accounts));

    // Update in backend
    if (user.id) {
      try {
        await fetch(`http://localhost:8000/api/v1/farmers/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (e) {
        console.warn("Backend profile update failed:", e);
      }
    }
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        authModalOpen,
        authModalTab,
        authError,
        setAuthError,
        openAuth,
        closeAuth,
        register,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
