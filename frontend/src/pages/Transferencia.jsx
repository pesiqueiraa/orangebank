import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
  const [contaOrigem, setContaOrigem] = useState('corrente'); // corrente ou investment
  const [contaDestinoInterna, setContaDestinoInterna] = useState('investment'); // corrente ou investment
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [contaDestinoValida, setContaDestinoValida] = useState(null);
  const [contaInfo, setContaInfo] = useState({
    corrente: null,
    investment: null
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
        // Em uma implementação real, você buscaria o ID do usuário da sessão
        const userId = localStorage.getItem('userId') || 'mock-user-id';
        
        // Buscar conta corrente
        const responseCorrente = await fetch(`/api/accounts/${userId}/corrente`);
        if (!responseCorrente.ok) throw new Error('Erro ao buscar dados da conta corrente');
        const dataCorrente = await responseCorrente.json();
        
        // Buscar conta investimento
        const responseInvestment = await fetch(`/api/accounts/${userId}/investment`);
        if (!responseInvestment.ok) throw new Error('Erro ao buscar dados da conta investimento');
        const dataInvestment = await responseInvestment.json();
        
        setContaInfo({
          corrente: dataCorrente,
          investment: dataInvestment
        });
      } catch (error) {
        console.error('Erro ao carregar dados das contas:', error);
        displayToast('Erro ao carregar dados das contas', 'error');
      }
    };

    fetchContas();
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

  // Função para verificar se a conta de destino existe (transferência externa)
  const verificarContaDestino = async () => {
    if (!contaDestino) return;
    
    setIsValidating(true);
    setContaDestinoValida(null);
    
    try {
      const response = await fetch(`/api/accounts/${contaDestino}/validate`);
      const data = await response.json();
      
      if (response.ok && data.exists) {
        setContaDestinoValida(true);
        setContaDestinoInfo(data.accountInfo);
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

  // Função para alternar entre contas (interna)
  const handleContaOrigemChange = (e) => {
    const novaConta = e.target.value;
    setContaOrigem(novaConta);
    
    // Se a origem for corrente, destino é investment e vice-versa
    setContaDestinoInterna(novaConta === 'corrente' ? 'investment' : 'corrente');
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
      // Preparar os dados da transferência
      const transferData = {
        amount: valorNumerico,
        sourceAccountId: contaInfo[contaOrigem]?.id
      };
      
      let endpoint;
      
      if (tipoTransferencia === 'internal') {
        // Transferência entre contas do mesmo usuário
        endpoint = '/api/transfers/internal';
        transferData.destinationAccountId = contaInfo[contaDestinoInterna]?.id;
      } else {
        // Transferência para outro usuário
        endpoint = '/api/transfers/external';
        transferData.destinationAccountId = contaDestinoInfo?.id;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao realizar transferência');
      }
      
      // Atualizar os saldos das contas após a transferência
      if (tipoTransferencia === 'internal') {
        // Atualiza os saldos das duas contas para transferência interna
        setContaInfo({
          ...contaInfo,
          [contaOrigem]: {
            ...contaInfo[contaOrigem],
            balance: contaInfo[contaOrigem].balance - valorNumerico
          },
          [contaDestinoInterna]: {
            ...contaInfo[contaDestinoInterna],
            balance: contaInfo[contaDestinoInterna].balance + valorNumerico
          }
        });
      } else {
        // Para transferência externa, atualiza apenas a conta de origem
        setContaInfo({
          ...contaInfo,
          [contaOrigem]: {
            ...contaInfo[contaOrigem],
            balance: contaInfo[contaOrigem].balance - valorNumerico
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
      
    } catch (error) {
      console.error('Erro ao realizar transferência:', error);
      displayToast(error.message || 'Falha ao realizar a transferência', 'error');
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
              {contaInfo.investment ? formatCurrency(contaInfo.investment.balance) : 'Carregando...'}
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
                    <option value="investment">Conta Investimento</option>
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
                  <option value="investment">Conta Investimento</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do CPF do destinatário
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={contaDestino}
                    onChange={(e) => setContaDestino(e.target.value)}
                    placeholder="Ex: 123.456.789-00"
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
              <li>Transferências para outros bancos podem levar até 1 dia útil.</li>
              <li>Você receberá um comprovante da transferência no seu e-mail.</li>
            </ul>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default Transferencia;