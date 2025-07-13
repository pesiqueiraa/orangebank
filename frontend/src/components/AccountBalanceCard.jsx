import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp } from 'lucide-react';

const AccountBalanceCard = ({ balance, loading }) => {
  // Formatar valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <motion.div
      className="bg-white p-5 rounded-xl shadow-md"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <div className="bg-orange-100 p-2 rounded-full mr-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Conta Investimento</h2>
        </div>
        
        <Wallet className="h-5 w-5 text-gray-400" />
      </div>
      
      <div>
        <p className="text-sm text-gray-500 mb-1">Saldo disponível</p>
        <p className="text-2xl font-bold text-gray-900">
          {loading ? 'Carregando...' : formatCurrency(balance)}
        </p>
      </div>
    </motion.div>
  );
};

export default AccountBalanceCard;