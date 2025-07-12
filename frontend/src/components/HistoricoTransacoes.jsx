import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, 
  MinusCircle, 
  ArrowRightLeft, 
  LineChart, 
  CreditCard
} from 'lucide-react';

const HistoricoTransacoes = ({ transactions }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposito':
        return <PlusCircle className="h-5 w-5 text-green-600" />;
      case 'saque':
        return <MinusCircle className="h-5 w-5 text-red-600" />;
      case 'transferencia':
        return <ArrowRightLeft className="h-5 w-5 text-blue-600" />;
      case 'investimento':
        return <LineChart className="h-5 w-5 text-purple-600" />;
      case 'pagamento':
        return <CreditCard className="h-5 w-5 text-gray-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (amount) => {
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionBgClass = (type) => {
    switch (type) {
      case 'deposito':
        return 'bg-green-100';
      case 'saque':
        return 'bg-red-100';
      case 'transferencia':
        return 'bg-blue-100';
      case 'investimento':
        return 'bg-purple-100';
      case 'pagamento':
        return 'bg-gray-100';
      default:
        return 'bg-gray-100';
    }
  };

  const tableVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-sm rounded-xl overflow-hidden border border-white border-opacity-40 shadow-md">
      <div className="overflow-x-auto">
        <motion.table 
          className="w-full text-left"
          variants={tableVariants}
          initial="hidden"
          animate="visible"
        >
          <thead>
            <tr className="bg-gray-50 bg-opacity-80">
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <motion.tr 
                    key={transaction.id} 
                    className="hover:bg-gray-50 transition-colors"
                    variants={rowVariants}
                    whileHover={{
                      backgroundColor: "#f9fafb",
                      transition: { duration: 0.2 }
                    }}
                    layout
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <motion.div 
                          className={`w-10 h-10 rounded-full ${getTransactionBgClass(transaction.type)} flex items-center justify-center`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {getTransactionIcon(transaction.type)}
                        </motion.div>
                        <span className="text-sm font-medium text-gray-800">{transaction.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.span 
                        className={`text-sm font-semibold ${getTransactionColor(transaction.amount)}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        {formatCurrency(transaction.amount)}
                      </motion.span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </motion.table>
      </div>
    </div>
  );
};

export default HistoricoTransacoes;