import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Citrus, 
  User, 
  LogOut, 
  CheckCircle, 
  AlertCircle, 
  Info,
  FileText
} from 'lucide-react';
import orangeCoin from '../../../assets/orangecoin.png';
import axios from 'axios';
import ResumoContas from '../components/ResumoContas';
import ActionButtons from '../components/ActionButtons';
import HistoricoTransacoes from '../components/HistoricoTransacoes';
import Grafico from '../components/Grafico';
import OrangeCoinWidget from '../components/OrangeCoinWidget';

const API_URL = 'http://localhost:3000/api';

const Dashboard = () => {
  // Estados para armazenar os dados do dashboard
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [chartPeriod, setChartPeriod] = useState('week');
  const [orangeCoins, setOrangeCoins] = useState(0);
  const [previousOrangeCoins, setPreviousOrangeCoins] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    // Carregar dados do dashboard
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Obter dados do usuário do localStorage
      const storedUser = JSON.parse(localStorage.getItem('user'));
      setUser(storedUser);
      
      // Salvar valor anterior antes de atualizar
      setPreviousOrangeCoins(orangeCoins);
      
      // Obter OrangeCoins do usuário
      const orangeCoinsResponse = await axios.get(`${API_URL}/users/${storedUser.id}/orangecoins`);
      if (orangeCoinsResponse.data.success) {
        setOrangeCoins(orangeCoinsResponse.data.data.orangeCoins);
      }
      
      // Obter contas do usuário
      const accountsResponse = await axios.get(`${API_URL}/accounts/${storedUser.id}`);
      if (accountsResponse.data.success) {
        setAccounts(accountsResponse.data.data);
        
        // Encontrar conta corrente para buscar histórico de transações
        const currentAccount = accountsResponse.data.data.find(acc => acc.type === 'corrente');
        if (currentAccount) {
          // Buscar histórico de transações da conta corrente
          const transactionsResponse = await axios.get(
            `${API_URL}/accounts/${currentAccount.id}/history?limit=10`
          );
          
          if (transactionsResponse.data.success) {
            // Formatar transações para o formato esperado pelo componente
            const formattedTransactions = transactionsResponse.data.data.map(tx => ({
              id: tx.id,
              type: mapTransactionType(tx.tipo),
              amount: tx.tipo.includes('saque') || tx.tipo.includes('transfer') ? -parseFloat(tx.valor) : parseFloat(tx.valor),
              date: tx.created_at,
              description: getTransactionDescription(tx)
            }));
            
            setTransactions(formattedTransactions);
          }
          
          // Buscar dados de performance para investimentos
          const investAccount = accountsResponse.data.data.find(acc => acc.type === 'investimento');
          if (investAccount) {
            const performanceResponse = await axios.get(
              `${API_URL}/accounts/${investAccount.id}/performance`
            );
            
            if (performanceResponse.data.success) {
              setPerformance(performanceResponse.data.data);
            }
          }
        }
      }
      
      // Exibe toast de boas-vindas
      displayToast(`Bem-vindo de volta, ${storedUser.name.split(' ')[0]}!`, 'success');
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      displayToast('Erro ao carregar dados', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Funções auxiliares para formatação de dados
  const mapTransactionType = (apiType) => {
    const typeMap = {
      'depósito': 'deposito',
      'saque': 'saque',
      'transferência_interna': 'transferencia',
      'transferência_externa': 'transferencia',
      'recebimento_interna': 'deposito',
      'recebimento_externo': 'deposito',
      'compra_ativo': 'investimento',
      'venda_ativo': 'investimento',
    };
    return typeMap[apiType] || apiType;
  };
  
  const getTransactionDescription = (transaction) => {
    switch (transaction.tipo) {
      case 'depósito':
        return 'Depósito em conta';
      case 'saque':
        return 'Saque da conta';
      case 'transferência_interna':
        return 'Transferência entre contas';
      case 'transferência_externa':
        return 'Transferência enviada';
      case 'recebimento_interna':
        return 'Transferência recebida';
      case 'recebimento_externo':
        return 'Transferência recebida';
      case 'compra_ativo':
        return 'Compra de investimento';
      case 'venda_ativo':
        return 'Venda de investimento';
      default:
        return transaction.tipo;
    }
  };

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
      localStorage.removeItem('user');
      navigate('/login');
    }, 1000);
  };

  // Função para realizar um depósito
  const handleDeposit = async (amount, accountId) => {
    try {
      setIsLoading(true);
      
      // Salvar valor anterior antes de chamar a API
      setPreviousOrangeCoins(orangeCoins);
      
      const response = await axios.post(`${API_URL}/accounts/${accountId}/deposit`, {
        amount: parseFloat(amount)
      });
      
      if (response.data.success) {
        displayToast('Depósito realizado com sucesso!', 'success');
        fetchDashboardData(); // Recarregar dados que atualizará OrangeCoins
        
        // Opcionalmente, mostre um toast específico para OrangeCoins
        setTimeout(() => {
          displayToast('Você ganhou +5 OrangeCoins!', 'reward');
        }, 1000);
      }
    } catch (error) {
      console.error("Erro ao realizar depósito:", error);
      displayToast(error.response?.data?.message || 'Erro ao processar depósito', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para realizar um saque
  const handleWithdraw = async (amount, accountId) => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_URL}/accounts/${accountId}/withdraw`, {
        amount: parseFloat(amount)
      });
      
      if (response.data.success) {
        displayToast('Saque realizado com sucesso!', 'success');
        fetchDashboardData(); // Recarregar dados
      }
    } catch (error) {
      console.error("Erro ao realizar saque:", error);
      displayToast(error.response?.data?.message || 'Erro ao processar saque', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para realizar uma transferência
  const handleTransfer = async (fromAccountId, toAccountId, amount) => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_URL}/accounts/${fromAccountId}/transfer`, {
        toAccountId,
        amount: parseFloat(amount)
      });
      
      if (response.data.success) {
        displayToast('Transferência realizada com sucesso!', 'success');
        fetchDashboardData(); // Recarregar dados
      }
    } catch (error) {
      console.error("Erro ao realizar transferência:", error);
      displayToast(error.response?.data?.message || 'Erro ao processar transferência', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para alterar o período do gráfico
  const handlePeriodChange = (period) => {
    setChartPeriod(period);
    displayToast(`Período alterado para: ${period}`, 'info');
  };

  // Função para lidar com o clique em ações
  const handleActionClick = (action) => {
    // Exemplo de como lidar com cliques nas ações
    switch (action) {
      case 'deposit':
        const currentAccount = accounts.find(acc => acc.type === 'corrente');
        if (currentAccount) {
          handleDeposit(100, currentAccount.id); // Exemplo com valor fixo
        }
        break;
      case 'withdraw':
        displayToast('Função de saque em desenvolvimento', 'info');
        break;
      case 'transfer':
        displayToast('Função de transferência em desenvolvimento', 'info');
        break;
      case 'invest':
        displayToast('Função de investimento em desenvolvimento', 'info');
        break;
      default:
        displayToast(`Indo para: ${action}`, 'info');
    }
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
            <OrangeCoinWidget coins={orangeCoins} previousCoins={previousOrangeCoins} />
            
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center shadow-inner">
                <User className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-sm font-medium">{user?.name}</span>
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
          <Grafico period={chartPeriod} performanceData={performance} />
        </motion.div>
        
        {/* Card de Relatórios */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-8"
        >
          <div className="bg-orange-50 rounded-xl p-6 border border-orange-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Relatórios Financeiros</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Acesse relatórios detalhados sobre suas finanças, investimentos e impostos.
                </p>
              </div>
              <motion.button
                onClick={() => navigate('/relatorio')}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-lg flex items-center space-x-2 shadow-md hover:bg-orange-600 transition-colors"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(251, 146, 60, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className="h-5 w-5" />
                <span className="font-medium">Ver Relatórios</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
        
        {/* Botões de ação */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <ActionButtons onActionClick={handleActionClick} />
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
      case 'reward':
        return <img src="/assets/orangecoin.png" alt="OrangeCoin" className="h-5 w-5" />;
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
      case 'reward':
        return 'bg-gradient-to-r from-orange-500 to-amber-500';
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