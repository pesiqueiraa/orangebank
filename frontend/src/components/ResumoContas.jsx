import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, TrendingUp, Eye, EyeOff, Citrus } from 'lucide-react';
import TiltCard from './TiltCard';

const ResumoContas = ({ accounts }) => {
  // Estado para controlar a visibilidade dos saldos
  const [showBalances, setShowBalances] = useState(true);

  // Função para formatar valores monetários no padrão brasileiro
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para buscar uma conta pelo tipo
  const getAccountByType = (type) => {
    return accounts.find(account => account.type === type) || { balance: 0 };
  };

  // Obter contas específicas e calcular o saldo total
  const currentAccount = getAccountByType('corrente');
  const investmentAccount = getAccountByType('investimento');
  const totalBalance = currentAccount.balance + investmentAccount.balance;

  // Variantes de animação para os cartões
  const cardVariants = {
    hover: {
      scale: 1.02,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { type: "spring", stiffness: 300 }
    },
    tap: {
      scale: 0.98,
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Cartão de Saldo Total */}
      <motion.div 
        className="col-span-1 md:col-span-3 bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl overflow-hidden border border-white border-opacity-40 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        variants={cardVariants}
        whileHover="hover"
        whileTap="tap"
      >
        <div className="p-6 flex justify-between items-center relative overflow-hidden">
          {/* Elementos decorativos para efeito de glassmorphism */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-300 rounded-full opacity-20"></div>
          <div className="absolute bottom-0 left-12 w-16 h-16 bg-orange-500 rounded-full opacity-10"></div>
          
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-gray-500">Saldo Total</h3>
            <div className="flex items-center mt-1">
              <motion.div
                animate={showBalances ? "visible" : "hidden"}
                variants={{
                  visible: { opacity: 1, x: 0 },
                  hidden: { opacity: 0, x: -10 }
                }}
                transition={{ duration: 0.2 }}
              >
                {showBalances ? (
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">••••••</p>
                )}
              </motion.div>
              <motion.button 
                onClick={() => setShowBalances(!showBalances)} 
                className="ml-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showBalances ? "Ocultar saldos" : "Mostrar saldos"}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                {showBalances ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </motion.button>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-1 text-xs text-gray-500 relative z-10">
            <span>Atualizado em</span>
            <span className="font-medium">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </motion.div>

      {/* Cartão da Conta Corrente - Com efeito 3D */}
      <TiltCard className="bg-white rounded-xl shadow-md h-full"
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
                  boxShadow: "9px 9px 16px rgba(163, 177, 198, 0.5), -9px -9px 16px rgba(255, 255, 255, 0.7)"
                }}>
        <motion.div 
          className="p-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Padrão de fundo para o cartão */}
          <div className="absolute top-0 right-0 w-full h-full opacity-5">
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
              <path d="M0 0 L100 0 L100 100 L0 100 Z" stroke="black" strokeWidth="0.5" strokeDasharray="5,5" />
              <circle cx="50" cy="50" r="30" stroke="black" strokeWidth="0.5" strokeDasharray="5,5" />
            </svg>
          </div>
          
          <div className="flex items-center mb-3 relative z-10">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mr-3" style={{ boxShadow: "inset 2px 2px 5px rgba(163, 177, 198, 0.5), inset -2px -2px 5px rgba(255, 255, 255, 0.8)" }}>
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Conta Corrente</h3>
          </div>
          
          <div className="mt-4 relative z-10">
            <p className="text-sm text-gray-500">Saldo disponível</p>
            <motion.div
              animate={showBalances ? "visible" : "hidden"}
              variants={{
                visible: { opacity: 1, y: 0 },
                hidden: { opacity: 0, y: -10 }
              }}
              transition={{ duration: 0.2 }}
            >
              {showBalances ? (
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentAccount.balance)}</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">••••••</p>
              )}
            </motion.div>
          </div>
          
          {/* Número do cartão mascarado */}
          <div className="mt-4 pt-4 border-t border-gray-100 relative z-10">
            <p className="text-xs text-gray-400">Conta</p>
            <p className="text-sm font-medium text-gray-600">1234 5678</p>
          </div>
          
          {/* Chip do cartão decorativo */}
          <div className="absolute top-3 right-3 w-8 h-6 rounded-sm bg-gradient-to-br from-yellow-300 to-yellow-400 opacity-70"></div>
        </motion.div>
      </TiltCard>

      {/* Cartão da Conta Investimento - Com efeito 3D */}
      <TiltCard className="bg-white rounded-xl shadow-md h-full"
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #f0fff0 100%)",
                  boxShadow: "9px 9px 16px rgba(163, 177, 198, 0.5), -9px -9px 16px rgba(255, 255, 255, 0.7)"
                }}>
        <motion.div 
          className="p-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Padrão de fundo para o cartão */}
          <div className="absolute top-0 right-0 w-full h-full opacity-5">
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
              <path d="M0 0 L100 0 L100 100 L0 100 Z" stroke="black" strokeWidth="0.5" />
              <path d="M20 20 L80 20 L80 80 L20 80 Z" stroke="black" strokeWidth="0.5" />
            </svg>
          </div>
          
          <div className="flex items-center mb-3 relative z-10">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mr-3" style={{ boxShadow: "inset 2px 2px 5px rgba(163, 177, 198, 0.5), inset -2px -2px 5px rgba(255, 255, 255, 0.8)" }}>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Conta Investimento</h3>
          </div>
          
          <div className="mt-4 relative z-10">
            <p className="text-sm text-gray-500">Saldo disponível</p>
            <motion.div
              animate={showBalances ? "visible" : "hidden"}
              variants={{
                visible: { opacity: 1, y: 0 },
                hidden: { opacity: 0, y: -10 }
              }}
              transition={{ duration: 0.2 }}
            >
              {showBalances ? (
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(investmentAccount.balance)}</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">••••••</p>
              )}
            </motion.div>
          </div>
          
          {/* Indicador de desempenho */}
          <div className="mt-4 pt-4 border-t border-gray-100 relative z-10">
            <p className="text-xs text-gray-400">Rendimento mês</p>
            <p className="text-sm font-medium text-green-600">+2,7%</p>
          </div>
          
          {/* Elementos decorativos */}
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-green-300 to-green-400 opacity-70"></div>
        </motion.div>
      </TiltCard>

      {/* Cartão de Status - Com efeito 3D */}
      <TiltCard className="bg-white rounded-xl shadow-md h-full"
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #fff5f0 100%)",
                  boxShadow: "9px 9px 16px rgba(163, 177, 198, 0.5), -9px -9px 16px rgba(255, 255, 255, 0.7)"
                }}>
        <motion.div 
          className="p-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Padrão de fundo para o cartão */}
          <div className="absolute top-0 right-0 w-full h-full opacity-5">
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="40" stroke="black" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="20" stroke="black" strokeWidth="0.5" />
            </svg>
          </div>
          
          <div className="flex items-center mb-3 relative z-10">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mr-3" style={{ boxShadow: "inset 2px 2px 5px rgba(163, 177, 198, 0.5), inset -2px -2px 5px rgba(255, 255, 255, 0.8)" }}>
              <Citrus className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Meu OrangeBank</h3>
          </div>
          
          <div className="mt-4 relative z-10">
            <p className="text-sm text-gray-500">Status da conta</p>
            <div className="flex items-center mt-1">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <p className="text-lg font-medium text-green-600">Ativa</p>
            </div>
          </div>
          
          {/* Desde quando é cliente */}
          <div className="mt-4 pt-4 border-t border-gray-100 relative z-10">
            <p className="text-xs text-gray-400">Cliente desde</p>
            <p className="text-sm font-medium text-gray-600">Janeiro 2025</p>
          </div>
          
          {/* Elementos decorativos */}
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 opacity-70"></div>
        </motion.div>
      </TiltCard>
    </div>
  );
};

export default ResumoContas;