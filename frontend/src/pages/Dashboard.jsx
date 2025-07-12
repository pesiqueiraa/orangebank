import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Citrus, 
  User, 
  LogOut, 
  CheckCircle, 
  AlertCircle, 
  Info
} from 'lucide-react';
import ResumoContas from '../components/ResumoContas';
import ActionButtons from '../components/ActionButtons';
import HistoricoTransacoes from '../components/HistoricoTransacoes';
import Grafico from '../components/Grafico';

const Dashboard = () => {
  // Estados para armazenar os dados do dashboard
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [chartPeriod, setChartPeriod] = useState('week');
  const navigate = useNavigate();

  useEffect(() => {
    // Simula o carregamento de dados da API
    const fetchDashboardData = async () => {
      try {
        // Dados simulados para demonstração
        const userData = {
          id: 'uuid-123',
          name: 'João Silva',
          email: 'joao.silva@email.com'
        };
        
        const accountsData = [
          { id: 'acc-1', type: 'corrente', balance: 3250.75 },
          { id: 'acc-2', type: 'investimento', balance: 12750.42 }
        ];
        
        const transactionsData = [
          { id: 'tx-1', type: 'deposito', amount: 1500.00, date: '2025-07-10T14:30:00Z', description: 'Depósito em dinheiro' },
          { id: 'tx-2', type: 'transferencia', amount: -350.00, date: '2025-07-09T10:15:00Z', description: 'Transferência para Maria' },
          { id: 'tx-3', type: 'pagamento', amount: -89.90, date: '2025-07-08T18:22:00Z', description: 'Pagamento de conta de luz' },
          { id: 'tx-4', type: 'investimento', amount: -1000.00, date: '2025-07-07T09:45:00Z', description: 'Compra de ações ENER3' },
          { id: 'tx-5', type: 'saque', amount: -200.00, date: '2025-07-06T16:30:00Z', description: 'Saque no caixa eletrônico' },
        ];
        
        // Simulação de um atraso de rede
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setUser(userData);
        setAccounts(accountsData);
        setTransactions(transactionsData);
        
        // Exibe toast de boas-vindas
        displayToast('Bem-vindo de volta, João!', 'success');
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
        displayToast('Erro ao carregar dados', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Função para exibir notificações toast
  const displayToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    // Oculta a notificação após 3 segundos
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Função para lidar com o logout
  const handleLogout = () => {
    displayToast('Saindo...', 'info');
    setTimeout(() => {
      localStorage.removeItem('isAuthenticated');
      navigate('/login');
    }, 1000);
  };

  // Função para alterar o período do gráfico
  const handlePeriodChange = (period) => {
    setChartPeriod(period);
    displayToast(`Período alterado para: ${period}`, 'info');
  };

  // Tela de carregamento com animação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100/50 flex items-center justify-center p-4">
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="w-16 h-16 bg-orange-300 rounded-2xl flex items-center justify-center mb-4"
            animate={{ 
              scale: [1, 1.1, 1], 
              rotate: [0, 5, -5, 0] 
            }}
            transition={{ 
              duration: 2, 
              ease: "easeInOut", 
              repeat: Infinity 
            }}
          >
            <Citrus className="h-10 w-10 text-white" />
          </motion.div>
          <motion.div 
            className="h-6 w-48 bg-orange-200 rounded mb-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div 
            className="h-4 w-64 bg-gray-200 rounded"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100/50">
      {/* Notificação toast flutuante */}
      <AnimatePresence>
        {showToast && (
          <Toast message={toastMessage} type={toastType} />
        )}
      </AnimatePresence>

      {/* Cabeçalho com efeito de glassmorphism */}
      <header className="sticky top-0 z-10 bg-white bg-opacity-80 backdrop-blur-lg backdrop-filter border-b border-gray-100 shadow-sm">
        <motion.div 
          className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-3">
            <motion.div 
              className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
            >
              <Citrus className="h-6 w-6 text-white" />
            </motion.div>
            <h1 className="text-xl font-semibold text-gray-800">OrangeBank</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center shadow-inner">
                <User className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-sm font-medium">{user.name}</span>
            </motion.div>
            
            <motion.button 
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Sair"
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
            >
              <LogOut className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.div>
      </header>
      
      {/* Conteúdo principal */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Seu Painel Financeiro</h2>
        </motion.div>
        
        {/* Resumo das contas com efeito 3D */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ResumoContas accounts={accounts} />
        </motion.div>
        
        {/* Gráfico financeiro interativo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Evolução Financeira</h3>
            <div className="flex space-x-2">
              <PeriodButton 
                label="Semana" 
                active={chartPeriod === 'week'} 
                onClick={() => handlePeriodChange('week')} 
              />
              <PeriodButton 
                label="Mês" 
                active={chartPeriod === 'month'} 
                onClick={() => handlePeriodChange('month')} 
              />
              <PeriodButton 
                label="Ano" 
                active={chartPeriod === 'year'} 
                onClick={() => handlePeriodChange('year')} 
              />
            </div>
          </div>
          <Grafico period={chartPeriod} />
        </motion.div>
        
        {/* Botões de ação */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <ActionButtons onActionClick={(action) => displayToast(`Indo para: ${action}`, 'info')} />
        </motion.div>
        
        {/* Histórico de transações */}
        <motion.div 
          className="mt-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Últimas Movimentações</h3>
          <HistoricoTransacoes transactions={transactions} />
        </motion.div>
      </main>
    </div>
  );
};

// Componente de botão para seleção de período
const PeriodButton = ({ label, active, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-md transition-all ${
        active 
          ? 'bg-orange-500 text-white shadow-md' 
          : 'bg-white text-gray-500 border border-gray-200'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {label}
    </motion.button>
  );
};

// Componente de notificação toast
const Toast = ({ message, type = 'success' }) => {
  // Retorna o ícone adequado com base no tipo de notificação
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-white" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-white" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-white" />;
    }
  };

  // Retorna a cor de fundo adequada com base no tipo de notificação
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <motion.div
      className="fixed top-4 right-4 z-50 flex items-center"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className={`${getBackgroundColor()} px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 bg-opacity-90 backdrop-blur-sm`}>
        {getIcon()}
        <span className="text-sm text-white font-medium">{message}</span>
      </div>
    </motion.div>
  );
};

export default Dashboard;