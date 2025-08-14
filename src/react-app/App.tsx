import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from '@getmocha/users-service/react';
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import OrderPage from "@/react-app/pages/Order";
import OrderStatusPage from "@/react-app/pages/OrderStatus";
import AdminPage from "@/react-app/pages/Admin";
import { useEffect } from "react";

function GoogleFontsLoader() {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <GoogleFontsLoader />
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/status" element={<OrderStatusPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
