import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Definir a URL base da API - mantendo consistência com outros componentes
const API_URL = 'http://localhost:3000/api'; // Ajuste conforme seu ambiente

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

const Transferencia = () => {
  // Estados do componente
  const [valor, setValor] = useState('');
  const [tipoTransferencia, setTipoTransferencia] = useState('internal');
  const [contaDestino, setContaDestino] = useState('');
  const [contaOrigem, setContaOrigem] = useState('corrente'); // corrente ou investimento
  const [contaDestinoInterna, setContaDestinoInterna] = useState('investimento'); // corrente ou investimento
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [contaDestinoValida, setContaDestinoValida] = useState(null);
  const [contaInfo, setContaInfo] = useState({
    corrente: null,
    investimento: null
  });
  const [contaDestinoInfo, setContaDestinoInfo] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  const navigate = useNavigate();

  // Buscar os dados das contas do usuário
  useEffect(() => {
    const fetchContas = async () => {
      try {
        setIsLoading(true);
        
        // Obter dados do usuário do localStorage
        const storedUser = JSON.parse(localStorage.getItem('user'));
        
        if (!storedUser || !storedUser.id) {
          navigate('/login');
          return;
        }
        
        // Buscar conta corrente
        const responseCorrente = await axios.get(`${API_URL}/accounts/${storedUser.id}/corrente`);
        
        // Buscar conta investimento - corrigindo o endpoint para "investimento"
        const responseInvestimento = await axios.get(`${API_URL}/accounts/${storedUser.id}/investimento`);
        
        if (responseCorrente.data.success && responseInvestimento.data.success) {
          setContaInfo({
            corrente: responseCorrente.data.data,
            investimento: responseInvestimento.data.data
          });
        } else {
          throw new Error("Erro ao buscar dados das contas");
        }
      } catch (error) {
        console.error('Erro ao carregar dados das contas:', error);
        displayToast(error.response?.data?.message || 'Erro ao carregar dados das contas', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContas();
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

  // Função para alternar o tipo de transferência
  const handleTipoTransferenciaChange = (e) => {
    setTipoTransferencia(e.target.value);
    setContaDestinoValida(null);
    setContaDestinoInfo(null);
  };

  // Adicionar esta função para gerenciar mudanças na conta de origem
  const handleContaOrigemChange = (e) => {
    const novaContaOrigem = e.target.value;
    setContaOrigem(novaContaOrigem);
    
    // Atualizar automaticamente a conta destino interna para que não seja igual à origem
    if (novaContaOrigem === 'corrente') {
      setContaDestinoInterna('investimento');
    } else {
      setContaDestinoInterna('corrente');
    }
  };

  // Função para realizar a transferência
  const realizarTransferencia = async (e) => {
    e.preventDefault();
    
    // Validar o valor inserido
    const valorNumerico = parseFloat(valor.replace(',', '.'));
    
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      displayToast('O valor da transferência deve ser maior que zero', 'error');
      return;
    }
    
    // Verificar se há saldo suficiente na conta de origem
    const saldoOrigem = contaInfo[contaOrigem]?.balance || 0;
    if (valorNumerico > saldoOrigem) {
      displayToast('Saldo insuficiente para realizar esta transferência', 'error');
      return;
    }
    
    // Para transferência externa, verificar se a conta destino é válida
    if (tipoTransferencia === 'external' && !contaDestinoValida) {
      displayToast('Conta de destino não encontrada ou inválida', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const sourceAccountId = contaInfo[contaOrigem]?.id;
      
      if (!sourceAccountId) {
        throw new Error('Conta de origem inválida');
      }
      
      // Chamar a API usando o endpoint do AccountController
      const response = await axios.post(`${API_URL}/accounts/${sourceAccountId}/transfer`, {
        // Para transferência interna, enviar o ID da conta destino
        // Para transferência externa, enviar o email do destinatário
        ...(tipoTransferencia === 'internal' 
          ? { toAccountId: contaInfo[contaDestinoInterna]?.id } 
          : { toEmail: contaDestino }),
        amount: valorNumerico,
        isExternal: tipoTransferencia === 'external'
      });
      
      if (response.data.success) {
        // Atualizar os saldos das contas após a transferência
        if (tipoTransferencia === 'internal') {
          // Buscar os novos saldos das contas após a transferência
          const storedUser = JSON.parse(localStorage.getItem('user'));
          
          const [responseCorrente, responseInvestimento] = await Promise.all([
            axios.get(`${API_URL}/accounts/${storedUser.id}/corrente`),
            axios.get(`${API_URL}/accounts/${storedUser.id}/investimento`)
          ]);
          
          setContaInfo({
            corrente: responseCorrente.data.data,
            investimento: responseInvestimento.data.data
          });
        } else {
          // Para transferência externa, atualiza apenas a conta de origem
          setContaInfo({
            ...contaInfo,
            [contaOrigem]: {
              ...contaInfo[contaOrigem],
              balance: contaInfo[contaOrigem].balance - valorNumerico - (response.data.fee || 0)
            }
          });
        }
        
        displayToast('Transferência realizada com sucesso!', 'success');
        setValor(''); // Limpa o campo após a transferência
        setContaDestinoValida(null);
        setContaDestinoInfo(null);
        
        // Redirecionar para o dashboard após 2 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Erro ao realizar transferência');
      }
    } catch (error) {
      console.error('Erro ao realizar transferência:', error);
      displayToast(error.response?.data?.message || error.message || 'Falha ao realizar a transferência', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para verificar se a conta de destino existe (transferência externa)
  const verificarContaDestino = async () => {
    if (!contaDestino) return;
    
    setIsValidating(true);
    setContaDestinoValida(null);
    
    try {
      // Using email directly - no cleaning needed like with CPF
      const email = contaDestino.trim();
      
      // First, search for user by email
      const responseUser = await axios.get(`${API_URL}/users/email/${email}`);
      
      if (!responseUser.data.success) {
        setContaDestinoValida(false);
        setContaDestinoInfo(null);
        return;
      }
      
      // If user found, get their account
      const userId = responseUser.data.data.id;
      const responseAccount = await axios.get(`${API_URL}/accounts/${userId}/corrente`);
      
      if (responseAccount.data.success) {
        setContaDestinoValida(true);
        setContaDestinoInfo({
          accountId: responseAccount.data.data.id,
          ownerName: responseUser.data.data.name || responseUser.data.data.email,
          userId: userId
        });
      } else {
        setContaDestinoValida(false);
        setContaDestinoInfo(null);
      }
    } catch (error) {
      console.error('Erro ao validar conta destino:', error);
      setContaDestinoValida(false);
      setContaDestinoInfo(null);
    } finally {
      setIsValidating(false);
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
          <h1 className="text-3xl font-bold text-gray-800">Transferência</h1>
        </div>
        
        {/* Saldos das contas */}
        <div className="mb-8 grid gap-4 grid-cols-2">
          <motion.div
            className="bg-white p-5 rounded-xl shadow-md"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <p className="text-sm text-gray-500 mb-1">Conta Corrente</p>
            <p className="text-xl font-bold text-gray-900">
              {contaInfo.corrente ? formatCurrency(contaInfo.corrente.balance) : 'Carregando...'}
            </p>
          </motion.div>
          <motion.div
            className="bg-white p-5 rounded-xl shadow-md"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <p className="text-sm text-gray-500 mb-1">Conta Investimento</p>
            <p className="text-xl font-bold text-gray-900">
              {contaInfo.investimento ? formatCurrency(contaInfo.investimento.balance) : 'Carregando...'}
            </p>
          </motion.div>
        </div>
        
        {/* Formulário de transferência */}
        <form onSubmit={realizarTransferencia} className="bg-white p-6 rounded-xl shadow-md">
          {/* Tipo de transferência */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de transferência
            </label>
            <div className="flex space-x-2">
              <label className={`flex-1 flex items-center p-4 border rounded-lg cursor-pointer
                ${tipoTransferencia === 'internal' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300'}`}>
                <input
                  type="radio"
                  value="internal"
                  checked={tipoTransferencia === 'internal'}
                  onChange={handleTipoTransferenciaChange}
                  className="hidden"
                />
                <span className="ml-2">Entre minhas contas</span>
              </label>
              <label className={`flex-1 flex items-center p-4 border rounded-lg cursor-pointer
                ${tipoTransferencia === 'external' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300'}`}>
                <input
                  type="radio"
                  value="external"
                  checked={tipoTransferencia === 'external'}
                  onChange={handleTipoTransferenciaChange}
                  className="hidden"
                />
                <span className="ml-2">Para outra pessoa</span>
              </label>
            </div>
          </div>
          
          {/* Transferência interna */}
          {tipoTransferencia === 'internal' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origem e Destino
              </label>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm text-gray-600">Origem:</label>
                  <select
                    value={contaOrigem}
                    onChange={handleContaOrigemChange}
                    className="block w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="corrente">Conta Corrente</option>
                    <option value="investimento">Conta Investimento</option>
                  </select>
                </div>
                
                <ArrowRight className="h-6 w-6 text-gray-400 mx-2" />
                
                <div>
                  <label className="text-sm text-gray-600">Destino:</label>
                  <div className="block w-full mt-1 p-2 border border-gray-300 bg-gray-100 rounded-md">
                    {contaDestinoInterna === 'corrente' ? 'Conta Corrente' : 'Conta Investimento'}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Transferência externa */}
          {tipoTransferencia === 'external' && (
            <div className="mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta de origem
                </label>
                <select
                  value={contaOrigem}
                  onChange={(e) => setContaOrigem(e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="corrente">Conta Corrente</option>
                  <option value="investimento">Conta Investimento</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email do destinatário
                </label>
                <div className="flex">
                  <input
                    type="email"
                    value={contaDestino}
                    onChange={(e) => setContaDestino(e.target.value)}
                    placeholder="Ex: usuario@exemplo.com"
                    className="flex-grow p-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={verificarContaDestino}
                    disabled={!contaDestino || isValidating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none"
                  >
                    {isValidating ? 'Verificando...' : 'Verificar'}
                  </button>
                </div>
                
                {/* Feedback de validação da conta */}
                {contaDestinoValida === true && (
                  <div className="mt-2 p-2 bg-green-50 text-green-700 rounded-md flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Conta encontrada: {contaDestinoInfo?.ownerName || 'Usuário'}</span>
                  </div>
                )}
                {contaDestinoValida === false && (
                  <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-md flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>Conta não encontrada.</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Campo para o valor */}
          <div className="mb-6">
            <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-2">
              Valor da transferência
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
                className="pl-12 block w-full py-3 px-4 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
              />
            </div>
          </div>
          
          <motion.button
            type="submit"
            disabled={isLoading || (tipoTransferencia === 'external' && contaDestinoValida !== true)}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isLoading || (tipoTransferencia === 'external' && contaDestinoValida !== true) ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? 'Processando...' : 'Confirmar Transferência'}
          </motion.button>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Informações importantes:</h3>
            <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
              <li>O valor não pode exceder o saldo da conta de origem.</li>
              <li>A transferência entre suas contas é instantânea.</li>
            </ul>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default Transferencia;