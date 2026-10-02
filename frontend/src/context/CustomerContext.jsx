import React, { createContext, useContext, useState, useEffect } from 'react';

const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  // Session token stored per customer in local storage without requiring account signup
  const [sessionToken, setSessionToken] = useState(() => {
    let token = localStorage.getItem('shopflow_customer_session');
    if (!token) {
      token = 'cs_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('shopflow_customer_session', token);
    }
    return token;
  });

  const [customerCode, setCustomerCode] = useState(() => {
    let code = localStorage.getItem('shopflow_customer_code');
    if (!code) {
      code = 'CUS-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      localStorage.setItem('shopflow_customer_code', code);
    }
    return code;
  });

  // Track customer requests in current browser session
  const [activeRequests, setActiveRequests] = useState(() => {
    const saved = localStorage.getItem('shopflow_customer_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const addRequest = (newRequest) => {
    setActiveRequests((prev) => {
      const updated = [newRequest, ...prev.filter(r => r.request_number !== newRequest.request_number)];
      localStorage.setItem('shopflow_customer_requests', JSON.stringify(updated));
      return updated;
    });
  };

  const updateRequestStatus = (requestNumber, newStatus) => {
    setActiveRequests((prev) => {
      const updated = prev.map(r => r.request_number === requestNumber ? { ...r, status: newStatus } : r);
      localStorage.setItem('shopflow_customer_requests', JSON.stringify(updated));
      return updated;
    });
  };

  const resetSession = () => {
    const newToken = 'cs_' + Math.random().toString(36).substring(2, 15);
    const newCode = 'CUS-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    setSessionToken(newToken);
    setCustomerCode(newCode);
    setActiveRequests([]);
    localStorage.setItem('shopflow_customer_session', newToken);
    localStorage.setItem('shopflow_customer_code', newCode);
    localStorage.removeItem('shopflow_customer_requests');
  };

  return (
    <CustomerContext.Provider value={{
      sessionToken,
      customerCode,
      activeRequests,
      addRequest,
      updateRequestStatus,
      resetSession,
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => useContext(CustomerContext);
