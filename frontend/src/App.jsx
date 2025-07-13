import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Deposito from './pages/Deposito';
import Saque from './pages/Saque';
import Transferencia from './pages/Transferencia';

// Páginas de placeholder para as funcionalidades financeiras
// Estas páginas seriam implementadas posteriormente
const WithdrawPage = () => <div className="p-10"><h1 className="text-2xl">Página de Saque</h1><p>Em desenvolvimento...</p></div>;
const TransferPage = () => <div className="p-10"><h1 className="text-2xl">Página de Transferência</h1><p>Em desenvolvimento...</p></div>;
const InvestPage = () => <div className="p-10"><h1 className="text-2xl">Página de Investimentos</h1><p>Em desenvolvimento...</p></div>;

// Componente para proteção de rotas
const ProtectedRoute = ({ children }) => {
  // Verificar se o usuário está autenticado usando 'user' ao invés de 'isAuthenticated'
  const isAuthenticated = localStorage.getItem('user') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simular verificação de autenticação ou carregamento inicial
    const checkAuth = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(checkAuth);
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100/50 flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-orange-300 rounded-2xl mb-4"></div>
          <div className="h-4 w-24 bg-orange-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Rota raiz - redireciona para dashboard se autenticado, ou login caso contrário */}
        <Route path="/" element={
          localStorage.getItem('isAuthenticated') === 'true' ? 
            <Navigate to="/dashboard" replace /> : 
            <Navigate to="/login" replace />
        } />
        
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rotas protegidas */}
        <Route path="/dashboard" element={
            <Dashboard />
        } />
        
        <Route path="/deposito" element={
          <ProtectedRoute>
            <Deposito />
          </ProtectedRoute>
        } />
        
        <Route path="/saque" element={
          <ProtectedRoute>
            <Saque />
          </ProtectedRoute>
        } />
        
        <Route path="/withdraw" element={
          <ProtectedRoute>
            <WithdrawPage />
          </ProtectedRoute>
        } />
        
        <Route path="/transfer" element={
          <ProtectedRoute>
            <TransferPage />
          </ProtectedRoute>
        } />
        
        <Route path="/invest" element={
          <ProtectedRoute>
            <InvestPage />
          </ProtectedRoute>
        } />
        
        <Route path="/transferencia" element={
          <ProtectedRoute>
            <Transferencia />
          </ProtectedRoute>
        } />
        
      </Routes>
    </Router>
  );
};

export default App;