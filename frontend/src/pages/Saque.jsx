import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Definir a URL base da API - mantendo consistência com outros componentes
const API_URL = 'https://orangebank.onrender.com/api'; // Ajuste conforme seu ambiente

// Componentes para animação de entrada na página
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -20
  }
};

const Saque = () => {
  // Estados do componente
  const [valor, setValor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contaCorrente, setContaCorrente] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  const navigate = useNavigate();

  // Buscar os dados da conta corrente do usuário
  useEffect(() => {
    const fetchContaCorrente = async () => {
      try {
        setIsLoading(true);
        
        // Obter dados do usuário do localStorage
        const storedUser = JSON.parse(localStorage.getItem('user'));
        
        if (!storedUser || !storedUser.id) {
          navigate('/login');
          return;
        }

        // Buscar a conta corrente do usuário usando axios
        const response = await axios.get(`${API_URL}/accounts/${storedUser.id}/corrente`);
        
        if (response.data.success) {
          setContaCorrente(response.data.data);
        } else {
          throw new Error("Erro ao buscar dados da conta");
        }
      } catch (error) {
        console.error('Erro ao carregar conta corrente:', error);
        displayToast(error.response?.data?.message || 'Erro ao carregar dados da conta', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContaCorrente();
  }, [navigate]);

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

  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para lidar com a mudança no input do valor
  const handleValorChange = (e) => {
    // Remove caracteres não numéricos exceto ponto/vírgula
    const value = e.target.value.replace(/[^\d.,]/g, '');
    setValor(value);
  };

  // Função para realizar o saque
  const realizarSaque = async (e) => {
    e.preventDefault();
    
    // Validar o valor inserido
    const valorNumerico = parseFloat(valor.replace(',', '.'));
    
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      displayToast('O valor do saque deve ser maior que zero', 'error');
      return;
    }
    
    // Validar se há saldo suficiente
    if (contaCorrente && valorNumerico > contaCorrente.balance) {
      displayToast('Saldo insuficiente para realizar este saque', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!contaCorrente || !contaCorrente.id) {
        throw new Error("Conta corrente não encontrada");
      }
      
      // Chamar a API de saque usando axios
      const response = await axios.post(
        `${API_URL}/accounts/${contaCorrente.id}/withdraw`, 
        { amount: valorNumerico }
      );
      
      if (response.data.success) {
        // Atualizar o saldo da conta
        setContaCorrente({
          ...contaCorrente,
          balance: response.data.newBalance
        });
        
        displayToast('Saque realizado com sucesso!', 'success');
        setValor(''); // Limpa o campo após o saque
        
        // Redirecionar para o dashboard após 2 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Falha ao realizar o saque');
      }
    } catch (error) {
      console.error('Erro ao realizar saque:', error);
      displayToast(
        error.response?.data?.message || error.message || 'Falha ao realizar o saque', 
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-8 px-4 sm:px-6 lg:px-8"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.4 }}
    >
      {/* Toast de notificação */}
      {showToast && (
        <div className="fixed top-20 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-4 flex items-center shadow-lg ${
              toastType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {toastType === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <p>{toastMessage}</p>
          </motion.div>
        </div>
      )}
      
      <div className="max-w-lg mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8 flex items-center">
          <Link to="/dashboard" className="mr-4 p-2 rounded-full hover:bg-orange-200 transition-colors">
            <ArrowLeft className="h-6 w-6 text-orange-600" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Realizar Saque</h1>
        </div>
        
        {/* Saldo atual */}
        <motion.div
          className="mb-6 bg-white p-6 rounded-xl shadow-md"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <p className="text-sm text-gray-500 mb-1">Saldo disponível em conta corrente</p>
          <p className="text-2xl font-bold text-gray-900">
            {contaCorrente ? formatCurrency(contaCorrente.balance) : 'Carregando...'}
          </p>
        </motion.div>
        
        {/* Formulário de saque */}
        <form onSubmit={realizarSaque} className="bg-white p-6 rounded-xl shadow-md">
          <div className="mb-6">
            <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-2">
              Valor do saque
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">R$</span>
              </div>
              <input
                type="text"
                name="valor"
                id="valor"
                value={valor}
                onChange={handleValorChange}
                placeholder="0,00"
                className="pl-12 block w-full py-3 px-4 rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500"
                autoComplete="off"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Informe o valor que deseja sacar da sua conta corrente.
            </p>
          </div>
          
          <motion.button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? 'Processando...' : 'Confirmar Saque'}
          </motion.button>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Informações importantes:</h3>
            <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
              <li>O valor não pode exceder seu saldo atual.</li>
              <li>O saque será debitado imediatamente da sua conta corrente.</li>
            </ul>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default Saque;