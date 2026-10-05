import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('shopflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('shopflow_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      // Validate or refresh session
      api.get('/auth/me')
        .then(res => {
          if (res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('shopflow_user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          // Token expired or invalid
        });
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: authToken, user: authUser } = res.data;
      
      setToken(authToken);
      setUser(authUser);
      localStorage.setItem('shopflow_token', authToken);
      localStorage.setItem('shopflow_user', JSON.stringify(authUser));
      
      return { success: true, user: authUser };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const registerShop = async (shopData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register-shop', shopData);
      const { token: authToken, user: authUser, shop } = res.data;
      
      setToken(authToken);
      setUser(authUser);
      localStorage.setItem('shopflow_token', authToken);
      localStorage.setItem('shopflow_user', JSON.stringify(authUser));
      
      return { success: true, user: authUser, shop };
    } catch (error) {
      const msg = error.response?.data?.message || 'Onboarding failed. Please check inputs.';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const switchShop = async (shopId) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/switch-shop', { shop_id: shopId });
      const currentShop = res.data?.current_shop;
      
      setUser(prev => {
        if (!prev) return prev;
        const updated = { ...prev, current_shop_id: shopId, current_shop: currentShop };
        localStorage.setItem('shopflow_user', JSON.stringify(updated));
        return updated;
      });
      
      return { success: true, current_shop: currentShop };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to switch shop.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // Ignore
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('shopflow_token');
      localStorage.removeItem('shopflow_user');
    }
  };

  // Demo auto-login helper for instant 1-click testing
  const quickLoginAs = async (role) => {
    const credentials = {
      staff: { email: 'staff@example.com', password: 'password' },
      manager: { email: 'amit@example.com', password: 'password' },
      owner: { email: 'shopowner@example.com', password: 'password' },
      super_admin: { email: 'admin@shopflow.com', password: 'password' },
    };

    const creds = credentials[role] || credentials.staff;
    return await login(creds.email, creds.password);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      registerShop,
      switchShop,
      logout,
      quickLoginAs,
      isAuthenticated: !!token,
      isStaff: user && ['staff', 'manager', 'shop_owner', 'super_admin'].includes(user.role),
      isAdmin: user && ['shop_owner', 'manager', 'super_admin'].includes(user.role),
      isSuperAdmin: user && user.role === 'super_admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
