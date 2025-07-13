import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, CreditCard, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Componentes de relatório
import ImpostoRenda from '../components/reports/ImpostoRenda';
import ExtratoConta from '../components/reports/ExtratoConta';
import ResumoInvest from '../components/reports/ResumoInvest';

// Configuração para animação de entrada na página
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

const Relatorio = () => {
  const [activeReport, setActiveReport] = useState('investment'); // 'tax', 'account', 'investment'
  
  const renderActiveReport = () => {
    switch (activeReport) {
      case 'tax':
        return <ImpostoRenda />;
      case 'account':
        return <ExtratoConta />;
      case 'investment':
        return <ResumoInvest />;
      default:
        return <div>Selecione um relatório</div>;
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
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8 flex items-center">
          <Link to="/dashboard" className="mr-4 p-2 rounded-full hover:bg-orange-200 transition-colors">
            <ArrowLeft className="h-6 w-6 text-orange-600" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>
        </div>
        
        {/* Seletores de relatório */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.button
              className={`flex items-center p-4 rounded-lg shadow-sm border ${
                activeReport === 'investment' 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-100'
              }`}
              onClick={() => setActiveReport('investment')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <BarChart3 size={24} className={activeReport === 'investment' ? 'text-blue-600' : 'text-gray-500'} />
              <div className="ml-4 text-left">
                <h3 className="font-medium">Resumo de Investimentos</h3>
                <p className="text-sm text-gray-500">Desempenho e distribuição da sua carteira</p>
              </div>
            </motion.button>
            
            <motion.button
              className={`flex items-center p-4 rounded-lg shadow-sm border ${
                activeReport === 'account' 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-100'
              }`}
              onClick={() => setActiveReport('account')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CreditCard size={24} className={activeReport === 'account' ? 'text-blue-600' : 'text-gray-500'} />
              <div className="ml-4 text-left">
                <h3 className="font-medium">Extrato de Conta Corrente</h3>
                <p className="text-sm text-gray-500">Histórico de transações da sua conta</p>
              </div>
            </motion.button>
            
            <motion.button
              className={`flex items-center p-4 rounded-lg shadow-sm border ${
                activeReport === 'tax' 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-100'
              }`}
              onClick={() => setActiveReport('tax')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FileText size={24} className={activeReport === 'tax' ? 'text-blue-600' : 'text-gray-500'} />
              <div className="ml-4 text-left">
                <h3 className="font-medium">Relatório de Imposto de Renda</h3>
                <p className="text-sm text-gray-500">Informações para sua declaração</p>
              </div>
            </motion.button>
          </div>
        </div>
        
        {/* Conteúdo do relatório selecionado */}
        <div>
          {renderActiveReport()}
        </div>
      </div>
    </motion.div>
  );
};

export default Relatorio;